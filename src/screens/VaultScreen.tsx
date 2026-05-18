import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { Header } from '../components/Header';
import { Metric } from '../components/Metric';
import { SectionTitle } from '../components/SectionTitle';
import { StateChecklistPanel } from '../components/StateChecklistPanel';
import { styles } from '../components/styles';
import { documentMeta } from '../data/documentMeta';
import { DocumentDetail } from '../features/documents/DocumentDetail';
import { DocumentForm } from '../features/documents/DocumentForm';
import { nextStatusesForActive } from '../lib/documentStatus';
import { summarizeStateChecklist } from '../lib/stateChecklist';
import { uploadEncryptedDocument } from '../lib/secureUpload';
import { DirectiveDocument, VaultData } from '../types/vault';

export function VaultScreen({
  vault,
  setVault,
  addAudit,
  defaultUploader,
}: {
  vault: VaultData;
  setVault: React.Dispatch<React.SetStateAction<VaultData>>;
  addAudit: (message: string) => void;
  defaultUploader: string;
}) {
  const [selectedDocument, setSelectedDocument] = useState<DirectiveDocument | null>(null);
  const [showDocumentForm, setShowDocumentForm] = useState(false);
  const activeDocuments = vault.documents.filter((document) => document.isActive);
  const stateSummary = summarizeStateChecklist(vault);

  const updateDocumentStatus = (documentId: string, uploadStatus: DirectiveDocument['uploadStatus']) => {
    setVault((current) => ({
      ...current,
      documents: current.documents.map((item) => (item.id === documentId ? { ...item, uploadStatus } : item)),
    }));
    setSelectedDocument((current) => (current?.id === documentId ? { ...current, uploadStatus } : current));
  };

  const updateDocumentRemotePath = (documentId: string, remoteStoragePath: string) => {
    setVault((current) => ({
      ...current,
      documents: current.documents.map((item) => (item.id === documentId ? { ...item, remoteStoragePath } : item)),
    }));
    setSelectedDocument((current) => (current?.id === documentId ? { ...current, remoteStoragePath } : current));
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
      const storagePath = await uploadEncryptedDocument({
        vault,
        document,
        onStorageUploaded: () => {
          storageUploaded = true;
          updateDocumentStatus(document.id, 'Encrypted blob uploaded; saving metadata');
        },
      });
      updateDocumentRemotePath(document.id, storagePath);
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
      <Header title="Vault" subtitle={`${vault.directiveState || 'Selected-state'} directive document vault`} />
      <View style={styles.summaryCard}>
        <View style={styles.summaryHeader}>
          <View style={styles.flex}>
            <Text style={styles.cardTitle}>{vault.memberName}</Text>
            <Text style={styles.muted}>Encrypted advance care document vault</Text>
          </View>
          <Ionicons name="checkmark-circle" size={34} color="#0f766e" />
        </View>
        <View style={styles.metrics}>
          <Metric value={`${activeDocuments.length}`} label="Active docs" />
          <Metric value={`${stateSummary.coreMissing}`} label="Core missing" />
          <Metric value={`${stateSummary.reviewNeeded}`} label="Review" />
        </View>
      </View>

      <StateChecklistPanel vault={vault} />

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

      {selectedDocument && (
        <DocumentDetail
          document={selectedDocument}
          onClose={() => setSelectedDocument(null)}
          onToggleActive={() => toggleActive(selectedDocument.id)}
          onUpload={() => uploadDocument(selectedDocument)}
        />
      )}
      <DocumentForm visible={showDocumentForm} state={vault.directiveState} defaultUploader={defaultUploader} onCancel={() => setShowDocumentForm(false)} onSave={saveDocument} />
    </ScrollView>
  );
}
