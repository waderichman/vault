import { Ionicons } from '@expo/vector-icons';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithCredential, signInWithEmailAndPassword } from 'firebase/auth';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles } from '../components/styles';
import { firebaseAuth } from '../lib/firebase';

WebBrowser.maybeCompleteAuthSession();

const googleWebClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
const googleIosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
const googleAndroidClientId = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;
const googleIosUrlScheme = googleIosClientId ? `com.googleusercontent.apps.${googleIosClientId.replace('.apps.googleusercontent.com', '')}` : undefined;

export function AuthScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [googleRequest, googleResponse, promptGoogleSignIn] = Google.useIdTokenAuthRequest({
    clientId: googleWebClientId || googleIosClientId || googleAndroidClientId || 'missing-google-client-id',
    webClientId: googleWebClientId,
    iosClientId: googleIosClientId,
    androidClientId: googleAndroidClientId,
    selectAccount: true,
  }, {
    native: googleIosUrlScheme ? `${googleIosUrlScheme}:/oauthredirect` : undefined,
  });
  const googleConfigured = Boolean(googleWebClientId || (Platform.OS === 'ios' && googleIosClientId) || (Platform.OS === 'android' && googleAndroidClientId));

  useEffect(() => {
    if (googleResponse?.type !== 'success') {
      return;
    }

    const idToken = googleResponse.params.id_token;

    if (!idToken) {
      Alert.alert('Google sign-in failed', 'Google did not return an ID token.');
      return;
    }

    signInWithCredential(firebaseAuth, GoogleAuthProvider.credential(idToken)).catch((error) => {
      Alert.alert('Google sign-in failed', formatAuthError(error));
    });
  }, [googleResponse]);

  const submit = async () => {
    const trimmedEmail = email.trim();

    if (!trimmedEmail || password.length < 6) {
      Alert.alert('Account needed', 'Enter an email and a password with at least 6 characters.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isCreating) {
        await createUserWithEmailAndPassword(firebaseAuth, trimmedEmail, password);
      } else {
        await signInWithEmailAndPassword(firebaseAuth, trimmedEmail, password);
      }
    } catch (error) {
      Alert.alert(isCreating ? 'Could not create account' : 'Could not sign in', formatAuthError(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.shell}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.unlockScreen}>
        <View style={styles.lockIcon}>
          <Ionicons name="person-circle-outline" size={48} color="#0f766e" />
        </View>
        <Text style={styles.heroTitle}>AdvanceVault</Text>
        <Text style={styles.heroCopy}>Sign in to connect this vault to your private Firebase account.</Text>
        <View style={styles.panel}>
          <Text style={styles.inputLabel}>Email</Text>
          <TextInput
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            onChangeText={setEmail}
            placeholder="you@example.com"
            style={styles.input}
            textContentType="emailAddress"
            value={email}
          />
          <Text style={styles.inputLabel}>Password</Text>
          <TextInput
            autoCapitalize="none"
            autoComplete="password"
            onChangeText={setPassword}
            placeholder="At least 6 characters"
            secureTextEntry
            style={styles.input}
            textContentType={isCreating ? 'newPassword' : 'password'}
            value={password}
          />
        </View>
        <Pressable style={styles.primaryButton} disabled={isSubmitting} onPress={submit}>
          <Ionicons name={isCreating ? 'person-add-outline' : 'log-in-outline'} size={20} color="#ffffff" />
          <Text style={styles.primaryButtonText}>{isSubmitting ? 'Working...' : isCreating ? 'Create Account' : 'Sign In'}</Text>
        </Pressable>
        <Pressable style={styles.secondaryButton} disabled={isSubmitting} onPress={() => setIsCreating((current) => !current)}>
          <Text style={styles.secondaryButtonText}>{isCreating ? 'Use Existing Account' : 'Create New Account'}</Text>
        </Pressable>
        <Pressable
          style={styles.secondaryButton}
          disabled={!googleConfigured || !googleRequest || isSubmitting}
          onPress={() => promptGoogleSignIn()}
        >
          <Ionicons name="logo-google" size={20} color="#0f766e" />
          <Text style={styles.secondaryButtonText}>Sign in with Google</Text>
        </Pressable>
        {!googleConfigured && (
          <Text style={styles.disclaimer}>Add Google OAuth client IDs to .env to enable Google sign-in.</Text>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function formatAuthError(error: unknown) {
  if (typeof error === 'object' && error && 'code' in error && typeof error.code === 'string') {
    switch (error.code) {
      case 'auth/email-already-in-use':
        return 'That email already has an account. Try signing in instead.';
      case 'auth/invalid-credential':
      case 'auth/user-not-found':
      case 'auth/wrong-password':
        return 'The email or password was not accepted.';
      case 'auth/operation-not-allowed':
        return 'Enable this sign-in provider in Firebase Authentication first.';
      case 'auth/network-request-failed':
        return 'Network request failed. Check the device connection and Firebase setup.';
      case 'auth/weak-password':
        return 'Use a stronger password with at least 6 characters.';
    }
  }

  return error instanceof Error ? error.message : 'Authentication failed.';
}
