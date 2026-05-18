import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { styles } from '../../components/styles';

export function PdfPreviewModal({
  visible,
  title,
  uri,
  onClose,
}: {
  visible: boolean;
  title: string;
  uri: string | null;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();

  return (
    <Modal animationType="slide" visible={visible} presentationStyle="fullScreen">
      <View style={styles.shell}>
        <View style={[styles.previewHeader, { paddingTop: Math.max(insets.top, 12) + 8 }]}>
          <View style={styles.previewTitleWrap}>
            <Text style={styles.previewTitle} numberOfLines={1} ellipsizeMode="middle">
              {title}
            </Text>
            <Text style={styles.tinyText}>Decrypted local preview</Text>
          </View>
          <Pressable style={styles.previewCloseButton} onPress={onClose} hitSlop={16}>
            <Ionicons name="close" size={24} color="#334155" />
          </Pressable>
        </View>
        {uri && <WebView originWhitelist={['*']} source={{ uri }} style={styles.pdfPreview} />}
      </View>
    </Modal>
  );
}
