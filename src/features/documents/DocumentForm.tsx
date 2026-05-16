import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '../../components/Header';
import { SegmentedOptions } from '../../components/SegmentedOptions';
import { styles } from '../../components/styles';
import { ToggleLine } from '../../components/ToggleLine';
import { documentMeta } from '../../data/documentMeta';
import { encryptPickedPdf } from '../../lib/encryption';
import { formatBytes } from '../../lib/formatting';
import { makeId } from '../../lib/ids';
import { DirectiveDocument, DirectiveDocumentType, VerificationStatus } from '../../types/vault';

export function DocumentForm({
  visible,
  state,
  defaultUploader,
  onCancel,
  onSave,
}: {
  visible: boolean;
  state: string;
  defaultUploader: string;
  onCancel: () => void;
  onSave: (document: DirectiveDocument) => void;
}) {
  const [type, setType] = useState<DirectiveDocumentType>('Health Care Surrogate');
  const [signedDate, setSignedDate] = useState(new Date().toISOString().slice(0, 10));
  const [uploadedBy, setUploadedBy] = useState(defaultUploader);
  const [attorneyUploaded, setAttorneyUploaded] = useState(true);
  const [witnessed, setWitnessed] = useState(true);
  const [notarized, setNotarized] = useState(false);
  const [selectedFile, setSelectedFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [isEncrypting, setIsEncrypting] = useState(false);

  const pickPdf = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/pdf',
      copyToCacheDirectory: true,
      multiple: false,
    });

    if (!result.canceled) {
      setSelectedFile(result.assets[0] ?? null);
    }
  };

  const buildStatuses = (): VerificationStatus[] => {
    const statuses: VerificationStatus[] = [attorneyUploaded ? 'Attorney-uploaded' : 'Uploaded by user', 'Signed'];
    if (witnessed) statuses.push('Witnessed');
    if (notarized) statuses.push('Notarized');
    if (attorneyUploaded) statuses.push('Attorney-reviewed');
    statuses.push('Active directive');
    return statuses;
  };

  const encryptAndSave = async () => {
    if (!selectedFile) {
      Alert.alert('PDF required', 'Choose the signed directive PDF before saving this document.');
      return;
    }

    setIsEncrypting(true);
    try {
      const encryptedFile = await encryptPickedPdf(selectedFile);
      onSave({
        id: makeId('doc'),
        type,
        state,
        signedDate,
        uploadedBy: uploadedBy.trim() || 'Unknown uploader',
        statuses: buildStatuses(),
        isActive: true,
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        localUri: selectedFile.uri,
        encryptedLocalUri: encryptedFile.encryptedLocalUri,
        encryptedSize: encryptedFile.encryptedSize,
        encryptionKeyId: encryptedFile.encryptionKeyId,
        encryptionFingerprint: encryptedFile.encryptionFingerprint,
        uploadStatus: 'Encrypted locally',
      });
    } catch (error) {
      Alert.alert('Encryption failed', error instanceof Error ? error.message : 'Could not encrypt this PDF.');
    } finally {
      setIsEncrypting(false);
    }
  };

  return (
    <Modal animationType="slide" visible={visible} presentationStyle="pageSheet">
      <SafeAreaView style={styles.shell}>
        <ScrollView contentContainerStyle={styles.screen}>
          <Header title="Add Document" subtitle="Create a verified directive record" />
          <SegmentedOptions options={Object.keys(documentMeta) as DirectiveDocumentType[]} value={type} setValue={setType} />
          <View style={styles.panel}>
            <Pressable style={styles.uploadBox} onPress={pickPdf}>
              <Ionicons name="cloud-upload-outline" size={28} color="#0f766e" />
              <View style={styles.flex}>
                <Text style={styles.rowTitle}>{selectedFile ? selectedFile.name : 'Choose signed PDF'}</Text>
                <Text style={styles.rowSub}>
                  {selectedFile ? `${formatBytes(selectedFile.size)} selected for secure upload` : 'Attach the executed directive PDF from your device.'}
                </Text>
              </View>
            </Pressable>
            <Text style={styles.inputLabel}>Signed date</Text>
            <TextInput style={styles.input} value={signedDate} onChangeText={setSignedDate} placeholder="YYYY-MM-DD" />
            <Text style={styles.inputLabel}>Uploaded by</Text>
            <TextInput style={styles.input} value={uploadedBy} onChangeText={setUploadedBy} />
            <ToggleLine label="Attorney uploaded" value={attorneyUploaded} setValue={setAttorneyUploaded} />
            <ToggleLine label="Witnessed" value={witnessed} setValue={setWitnessed} />
            <ToggleLine label="Notarized" value={notarized} setValue={setNotarized} />
          </View>
          <Pressable style={styles.primaryButton} disabled={isEncrypting} onPress={encryptAndSave}>
            <Ionicons name={isEncrypting ? 'lock-closed-outline' : 'save-outline'} size={20} color="#ffffff" />
            <Text style={styles.primaryButtonText}>{isEncrypting ? 'Encrypting PDF...' : 'Encrypt & Save Document'}</Text>
          </Pressable>
          <Pressable style={styles.secondaryButton} onPress={onCancel}>
            <Text style={styles.secondaryButtonText}>Cancel</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
