import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { Header } from '../components/Header';
import { Metric } from '../components/Metric';
import { SectionTitle } from '../components/SectionTitle';
import { styles } from '../components/styles';
import { documentMeta } from '../data/documentMeta';
import { DocumentDetail } from '../features/documents/DocumentDetail';
import { DocumentForm } from '../features/documents/DocumentForm';
import { nextStatusesForActive } from '../lib/documentStatus';
import { uploadEncryptedDocument } from '../lib/secureUpload';
import { DirectiveDocument, VaultData } from '../types/vault';

export function VaultScreen({
  vault,
  setVault,
  onOpenEmergency,
  addAudit,
}: {
  vault: VaultData;
  setVault: React.Dispatch<React.SetStateAction<VaultData>>;
  onOpenEmergency: () => void;
  addAudit: (message: string) => void;
}) {
  const [selectedDocument, setSelectedDocument] = useState<DirectiveDocument | null>(null);
  const [showDocumentForm, setShowDocumentForm] = useState(false);
  const activeDocuments = vault.documents.filter((document) => document.isActive);

  const updateDocumentStatus = (documentId: string, uploadStatus: DirectiveDocument['uploadStatus']) => {
    setVault((current) => ({
      ...current,
      documents: current.documents.map((item) => (item.id === documentId ? { ...item, uploadStatus } : item)),
    }));
    setSelectedDocument((current) => (current?.id === documentId ? { ...current, uploadStatus } : current));
  };

  const saveDocument = (document: DirectiveDocument) => {
    setVault((current) => ({
      ...current,
      documents: [document, ...current.documents],
    }));
    addAudit(`${document.type} added to vault`);
    setShowDocumentForm(false);
  };

  const toggleActive = (documentId: string) => {
    setVault((current) => ({
      ...current,
      documents: current.documents.map((document) =>
        document.id === documentId
          ? {
              ...document,
              isActive: !document.isActive,
              statuses: nextStatusesForActive(document.statuses, !document.isActive),
            }
          : document,
      ),
    }));
    addAudit('Document active status changed');
  };

  const uploadDocument = async (document: DirectiveDocument) => {
    let storageUploaded = false;

    try {
      await uploadEncryptedDocument({
        vault,
        document,
        onStorageUploaded: () => {
          storageUploaded = true;
          updateDocumentStatus(document.id, 'Encrypted blob uploaded; saving metadata');
        },
      });
      updateDocumentStatus(document.id, 'Uploaded encrypted blob');
      addAudit(`${document.type} encrypted blob uploaded`);
      Alert.alert('Uploaded', 'Encrypted document blob and metadata were uploaded to Firebase.');
    } catch (error) {
      if (storageUploaded) {
        updateDocumentStatus(document.id, 'Encrypted blob uploaded; metadata pending');
      }
      Alert.alert('Upload failed', error instanceof Error ? error.message : 'Could not upload encrypted document.');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <Header title="Vault" subtitle={`${vault.directiveState} advance directive vault`} />
      <View style={styles.summaryCard}>
        <View style={styles.summaryHeader}>
          <View style={styles.flex}>
            <Text style={styles.cardTitle}>{vault.memberName}</Text>
            <Text style={styles.muted}>Attorney-verified directive set</Text>
          </View>
          <Ionicons name="checkmark-circle" size={34} color="#0f766e" />
        </View>
        <View style={styles.metrics}>
          <Metric value={`${activeDocuments.length}`} label="Active docs" />
          <Metric value={`${vault.contacts.length}`} label="Contacts" />
          <Metric value="2027" label="Review" />
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <SectionTitle title="Advance Health Care Directives" />
        <Pressable style={styles.iconButton} onPress={() => setShowDocumentForm(true)}>
          <Ionicons name="add" size={20} color="#0f766e" />
        </Pressable>
      </View>

      {vault.documents.map((document) => (
        <Pressable key={document.id} style={styles.documentRow} onPress={() => setSelectedDocument(document)}>
          <View style={styles.rowIcon}>
            <Ionicons name={documentMeta[document.type].icon} size={24} color="#0f766e" />
          </View>
          <View style={styles.rowBody}>
            <Text style={styles.rowTitle}>{document.type}</Text>
            <Text style={styles.rowSub}>{document.uploadedBy}</Text>
          </View>
          <View style={[styles.activePill, !document.isActive && styles.inactivePill]}>
            <Text style={[styles.activePillText, !document.isActive && styles.inactivePillText]}>{document.isActive ? 'Active' : 'Old'}</Text>
          </View>
        </Pressable>
      ))}

      <Pressable style={styles.secondaryButton} onPress={onOpenEmergency}>
        <Ionicons name="alert-circle-outline" size={20} color="#0f766e" />
        <Text style={styles.secondaryButtonText}>Review emergency access</Text>
      </Pressable>

      {selectedDocument && (
        <DocumentDetail
          document={selectedDocument}
          onClose={() => setSelectedDocument(null)}
          onToggleActive={() => toggleActive(selectedDocument.id)}
          onUpload={() => uploadDocument(selectedDocument)}
        />
      )}
      <DocumentForm visible={showDocumentForm} state={vault.directiveState} defaultUploader={vault.attorneyFirm} onCancel={() => setShowDocumentForm(false)} onSave={saveDocument} />
    </ScrollView>
  );
}
