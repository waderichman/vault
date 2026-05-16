import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import { Tab } from '../types/vault';
import { styles } from './styles';

const tabConfig: Array<{ id: Tab; label: string; icon: keyof typeof Ionicons.glyphMap }> = [
  { id: 'vault', label: 'Vault', icon: 'lock-closed-outline' },
  { id: 'emergency', label: 'Emergency', icon: 'alert-circle-outline' },
  { id: 'people', label: 'People', icon: 'people-outline' },
  { id: 'settings', label: 'Settings', icon: 'settings-outline' },
];

export function TabBar({ activeTab, setActiveTab }: { activeTab: Tab; setActiveTab: (tab: Tab) => void }) {
  return (
    <View style={styles.tabBar}>
      {tabConfig.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <Pressable key={tab.id} style={styles.tabButton} onPress={() => setActiveTab(tab.id)}>
            <Ionicons name={tab.icon} size={22} color={isActive ? '#0f766e' : '#64748b'} />
            <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
