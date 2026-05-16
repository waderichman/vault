import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { Alert, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TabBar } from './src/components/tab-bar';
import { styles } from './src/components/styles';
import { defaultVault } from './src/data/defaultVault';
import { authenticate } from './src/lib/auth';
import { makeId } from './src/lib/ids';
import { clearVault, loadVault, saveVault } from './src/lib/vaultStorage';
import { EmergencyScreen } from './src/screens/EmergencyScreen';
import { LoadingScreen } from './src/screens/LoadingScreen';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { PeopleScreen } from './src/screens/PeopleScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { UnlockScreen } from './src/screens/UnlockScreen';
import { VaultScreen } from './src/screens/VaultScreen';
import { Tab, VaultData } from './src/types/vault';

export default function App() {
  const [unlocked, setUnlocked] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('vault');
  const [vault, setVault] = useState<VaultData>(defaultVault);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    loadVault()
      .then(setVault)
      .finally(() => setLoaded(true));
  }, []);

  useEffect(() => {
    if (loaded) {
      saveVault(vault);
    }
  }, [loaded, vault]);

  const updateVault = (patch: Partial<VaultData>) => {
    setVault((current) => ({ ...current, ...patch }));
  };

  const addAudit = (message: string) => {
    setVault((current) => ({
      ...current,
      auditLog: [{ id: makeId('audit'), message, createdAt: 'Just now' }, ...current.auditLog],
    }));
  };

  const resetVault = () => {
    Alert.alert('Reset demo vault?', 'This clears local demo data on this device.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset',
        style: 'destructive',
        onPress: () => {
          clearVault();
          setVault(defaultVault);
          setUnlocked(false);
        },
      },
    ]);
  };

  if (!loaded) {
    return <LoadingScreen />;
  }

  if (!unlocked) {
    return <UnlockScreen onUnlock={() => authenticate(setUnlocked)} />;
  }

  if (!vault.onboarded) {
    return <OnboardingScreen onComplete={() => updateVault({ onboarded: true })} />;
  }

  return (
    <SafeAreaView style={styles.shell}>
      <StatusBar style="dark" />
      <View style={styles.content}>
        {activeTab === 'vault' && <VaultScreen vault={vault} setVault={setVault} onOpenEmergency={() => setActiveTab('emergency')} addAudit={addAudit} />}
        {activeTab === 'emergency' && <EmergencyScreen vault={vault} setVault={setVault} addAudit={addAudit} />}
        {activeTab === 'people' && <PeopleScreen vault={vault} setVault={setVault} addAudit={addAudit} />}
        {activeTab === 'settings' && <SettingsScreen vault={vault} updateVault={updateVault} resetVault={resetVault} />}
      </View>
      <TabBar activeTab={activeTab} setActiveTab={setActiveTab} />
    </SafeAreaView>
  );
}
