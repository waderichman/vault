import { StatusBar } from 'expo-status-bar';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import React, { useEffect, useState } from 'react';
import { Alert, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TabBar } from './src/components/tab-bar';
import { styles } from './src/components/styles';
import { defaultVault } from './src/data/defaultVault';
import { authenticate } from './src/lib/auth';
import { firebaseAuth } from './src/lib/firebase';
import { makeId } from './src/lib/ids';
import { upsertUserProfile } from './src/lib/userProfile';
import { clearVault, loadVault, saveVault } from './src/lib/vaultStorage';
import { AuthScreen } from './src/screens/AuthScreen';
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
  const [authLoaded, setAuthLoaded] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    return onAuthStateChanged(firebaseAuth, (nextUser) => {
      setUser(nextUser);
      setUnlocked(false);
      setActiveTab('vault');
      setAuthLoaded(true);
      if (nextUser) {
        upsertUserProfile(nextUser).catch((error) => {
          console.warn('Could not save user profile', error);
        });
      }
    });
  }, []);

  useEffect(() => {
    if (!user) {
      setVault(defaultVault);
      setLoaded(false);
      return;
    }

    setLoaded(false);
    loadVault(user.uid)
      .then(setVault)
      .finally(() => setLoaded(true));
  }, [user]);

  useEffect(() => {
    if (loaded && user) {
      saveVault(user.uid, vault);
    }
  }, [loaded, user, vault]);

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
          if (user) {
            clearVault(user.uid);
          }
          setVault(defaultVault);
          setUnlocked(false);
        },
      },
    ]);
  };

  const signOutUser = async () => {
    await signOut(firebaseAuth);
  };

  if (!authLoaded) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <AuthScreen />;
  }

  if (!loaded) {
    return <LoadingScreen />;
  }

  if (!unlocked) {
    return <UnlockScreen onUnlock={() => authenticate(setUnlocked)} />;
  }

  if (!vault.onboarded) {
    return <OnboardingScreen onComplete={updateVault} />;
  }

  return (
    <SafeAreaView style={styles.shell}>
      <StatusBar style="dark" />
      <View style={styles.content}>
        {activeTab === 'vault' && <VaultScreen vault={vault} setVault={setVault} onOpenEmergency={() => setActiveTab('emergency')} addAudit={addAudit} />}
        {activeTab === 'emergency' && <EmergencyScreen vault={vault} setVault={setVault} addAudit={addAudit} />}
        {activeTab === 'people' && <PeopleScreen vault={vault} setVault={setVault} addAudit={addAudit} />}
        {activeTab === 'settings' && (
          <SettingsScreen vault={vault} updateVault={updateVault} resetVault={resetVault} userEmail={user.email} onSignOut={signOutUser} />
        )}
      </View>
      <TabBar activeTab={activeTab} setActiveTab={setActiveTab} />
    </SafeAreaView>
  );
}
