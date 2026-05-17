import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';
import { buildStateChecklist } from '../lib/stateChecklist';
import { VaultData } from '../types/vault';
import { SectionTitle } from './SectionTitle';
import { styles } from './styles';

export function StateChecklistPanel({ vault }: { vault: VaultData }) {
  const checklist = buildStateChecklist(vault);

  if (checklist.length === 0) {
    return (
      <View style={styles.panel}>
        <SectionTitle title="Document Checklist" />
        <Text style={styles.rowSub}>Choose a directive state to organize this vault by jurisdiction.</Text>
      </View>
    );
  }

  return (
    <View style={styles.panel}>
      <SectionTitle title="Document Checklist" />
      {checklist.map((item) => (
        <View key={item.id} style={styles.checklistRow}>
          <View style={styles.rowIconSmall}>
            <Ionicons name={iconForStatus(item.status)} size={18} color={colorForStatus(item.status)} />
          </View>
          <View style={styles.flex}>
            <Text style={styles.rowTitle}>{item.label}</Text>
            <Text style={styles.rowSub}>{item.note}</Text>
            {item.matchedDocuments.length > 0 && (
              <Text style={styles.tinyText}>{item.matchedDocuments.map((document) => document.fileName ?? document.type).join(', ')}</Text>
            )}
          </View>
          <View style={[styles.checklistPill, item.status === 'missing' && styles.warningPill, item.status === 'review' && styles.reviewPill]}>
            <Text style={[styles.checklistPillText, item.status === 'missing' && styles.warningPillText, item.status === 'review' && styles.reviewPillText]}>
              {item.actionLabel}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

function iconForStatus(status: 'complete' | 'missing' | 'review') {
  if (status === 'complete') return 'checkmark-circle';
  if (status === 'missing') return 'alert-circle';
  return 'information-circle';
}

function colorForStatus(status: 'complete' | 'missing' | 'review') {
  if (status === 'complete') return '#0f766e';
  if (status === 'missing') return '#b91c1c';
  return '#0369a1';
}
