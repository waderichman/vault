import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { InfoLine } from '../../components/InfoLine';
import { styles } from '../../components/styles';
import { documentMeta } from '../../data/documentMeta';
import { formatBytes } from '../../lib/formatting';
import { DirectiveDocument } from '../../types/vault';

export function DocumentDetail({
  document,
  onClose,
  onToggleActive,
  onUpload,
}: {
  document: DirectiveDocument;
  onClose: () => void;
  onToggleActive: () => void;
  onUpload: () => Promise<void>;
}) {
  const [isUploading, setIsUploading] = useState(false);

  const upload = async () => {
    setIsUploading(true);
    try {
      await onUpload();
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <View style={styles.detailPanel}>
      <View style={styles.detailHeader}>
        <View style={styles.flex}>
          <Text style={styles.cardTitle}>{document.type}</Text>
          <Text style={styles.muted}>{documentMeta[document.type].purpose}</Text>
        </View>
        <Pressable onPress={onClose} hitSlop={12}>
          <Ionicons name="close" size={24} color="#334155" />
        </Pressable>
      </View>
      <InfoLine label="State" value={document.state} />
      <InfoLine label="Signed" value={document.signedDate} />
      <InfoLine label="Uploaded by" value={document.uploadedBy} />
      <InfoLine label="Version" value={document.isActive ? 'Active directive' : 'Superseded / old version'} />
      <InfoLine label="File" value={document.fileName ?? 'No PDF attached'} />
      <InfoLine label="Size" value={formatBytes(document.fileSize)} />
      <InfoLine label="Encrypted size" value={formatBytes(document.encryptedSize)} />
      <InfoLine label="Upload" value={document.uploadStatus ?? 'No file attached'} />
      <InfoLine label="Key reference" value={document.encryptionKeyId ?? 'Not encrypted yet'} />
      <InfoLine label="Fingerprint" value={document.encryptionFingerprint ?? 'Not encrypted yet'} />
      <View style={styles.statusGrid}>
        {document.statuses.map((status) => (
          <View key={status} style={styles.statusPill}>
            <Ionicons name="checkmark-circle" size={15} color="#0f766e" />
            <Text style={styles.statusText}>{status}</Text>
          </View>
        ))}
      </View>
      <Pressable style={styles.secondaryButton} onPress={onToggleActive}>
        <Ionicons name={document.isActive ? 'archive-outline' : 'checkmark-circle-outline'} size={20} color="#0f766e" />
        <Text style={styles.secondaryButtonText}>{document.isActive ? 'Mark Superseded' : 'Make Active'}</Text>
      </Pressable>
      {document.encryptedLocalUri && document.uploadStatus !== 'Uploaded encrypted blob' && (
        <Pressable style={styles.primaryButton} disabled={isUploading} onPress={upload}>
          <Ionicons name={isUploading ? 'cloud-upload-outline' : 'cloud-done-outline'} size={20} color="#ffffff" />
          <Text style={styles.primaryButtonText}>{isUploading ? 'Uploading Encrypted Blob...' : 'Upload Encrypted Blob'}</Text>
        </Pressable>
      )}
    </View>
  );
}
