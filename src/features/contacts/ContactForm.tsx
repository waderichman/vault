import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '../../components/Header';
import { styles } from '../../components/styles';
import { ToggleLine } from '../../components/ToggleLine';
import { makeId } from '../../lib/ids';
import { TrustedContact } from '../../types/vault';

export function ContactForm({
  visible,
  contact,
  onCancel,
  onSave,
  onDelete,
}: {
  visible: boolean;
  contact: TrustedContact | null;
  onCancel: () => void;
  onSave: (contact: TrustedContact) => void;
  onDelete: (id: string) => void;
}) {
  const [name, setName] = useState('');
  const [role, setRole] = useState('Emergency contact');
  const [phone, setPhone] = useState('');
  const [canApproveAccess, setCanApproveAccess] = useState(false);

  useEffect(() => {
    if (visible) {
      setName(contact?.name ?? '');
      setRole(contact?.role ?? 'Emergency contact');
      setPhone(contact?.phone ?? '');
      setCanApproveAccess(contact?.canApproveAccess ?? false);
    }
  }, [contact, visible]);

  return (
    <Modal animationType="slide" visible={visible} presentationStyle="pageSheet">
      <SafeAreaView style={styles.shell}>
        <ScrollView contentContainerStyle={styles.screen}>
          <Header title={contact ? 'Edit Contact' : 'Add Contact'} subtitle="Trusted people can route emergency decisions" />
          <View style={styles.panel}>
            <Text style={styles.inputLabel}>Name</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Jane Doe" />
            <Text style={styles.inputLabel}>Role</Text>
            <TextInput style={styles.input} value={role} onChangeText={setRole} placeholder="Health care surrogate" />
            <Text style={styles.inputLabel}>Phone</Text>
            <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="(555) 010-0000" />
            <ToggleLine label="Can approve emergency access" value={canApproveAccess} setValue={setCanApproveAccess} />
          </View>
          <Pressable
            style={styles.primaryButton}
            onPress={() => {
              if (!name.trim()) {
                Alert.alert('Name required', 'Add a contact name first.');
                return;
              }
              onSave({ id: contact?.id ?? makeId('contact'), name: name.trim(), role: role.trim() || 'Emergency contact', phone: phone.trim(), canApproveAccess });
            }}
          >
            <Ionicons name="save-outline" size={20} color="#ffffff" />
            <Text style={styles.primaryButtonText}>Save Contact</Text>
          </Pressable>
          {contact && (
            <Pressable
              style={styles.dangerButton}
              onPress={() => {
                onDelete(contact.id);
                onCancel();
              }}
            >
              <Text style={styles.dangerButtonText}>Delete Contact</Text>
            </Pressable>
          )}
          <Pressable style={styles.secondaryButton} onPress={onCancel}>
            <Text style={styles.secondaryButtonText}>Cancel</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
