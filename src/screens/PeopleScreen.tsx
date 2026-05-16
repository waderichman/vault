import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Header } from '../components/Header';
import { InfoLine } from '../components/InfoLine';
import { SectionTitle } from '../components/SectionTitle';
import { styles } from '../components/styles';
import { ContactForm } from '../features/contacts/ContactForm';
import { TrustedContact, VaultData } from '../types/vault';

export function PeopleScreen({
  vault,
  setVault,
  addAudit,
}: {
  vault: VaultData;
  setVault: React.Dispatch<React.SetStateAction<VaultData>>;
  addAudit: (message: string) => void;
}) {
  const [editingContact, setEditingContact] = useState<TrustedContact | null>(null);
  const [showContactForm, setShowContactForm] = useState(false);

  const saveContact = (contact: TrustedContact) => {
    setVault((current) => {
      const exists = current.contacts.some((item) => item.id === contact.id);
      return {
        ...current,
        contacts: exists ? current.contacts.map((item) => (item.id === contact.id ? contact : item)) : [contact, ...current.contacts],
      };
    });
    addAudit(`${contact.name} saved as trusted contact`);
    setEditingContact(null);
    setShowContactForm(false);
  };

  const deleteContact = (id: string) => {
    setVault((current) => ({ ...current, contacts: current.contacts.filter((contact) => contact.id !== id) }));
    addAudit('Trusted contact removed');
  };

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <Header title="People" subtitle="Trusted contacts and attorney verification" />
      <View style={styles.sectionHeader}>
        <SectionTitle title="Trusted People" />
        <Pressable
          style={styles.iconButton}
          onPress={() => {
            setEditingContact(null);
            setShowContactForm(true);
          }}
        >
          <Ionicons name="person-add-outline" size={19} color="#0f766e" />
        </Pressable>
      </View>
      {vault.contacts.map((contact) => (
        <Pressable key={contact.id} style={styles.contactCard} onPress={() => setEditingContact(contact)}>
          <View style={styles.flex}>
            <Text style={styles.rowTitle}>{contact.name}</Text>
            <Text style={styles.rowSub}>{contact.role}</Text>
            <Text style={styles.tinyText}>{contact.phone}</Text>
          </View>
          {contact.canApproveAccess && <Ionicons name="shield-checkmark" size={24} color="#0f766e" />}
        </Pressable>
      ))}
      <View style={styles.panel}>
        <SectionTitle title="Attorney Verification" />
        <InfoLine label="Firm" value={vault.attorneyFirm} />
        <InfoLine label="Attorney" value={vault.attorneyName} />
        <InfoLine label="Phone" value={vault.attorneyPhone} />
        <InfoLine label="Email" value={vault.attorneyEmail} />
      </View>
      <ContactForm
        visible={showContactForm || editingContact !== null}
        contact={editingContact}
        onCancel={() => {
          setEditingContact(null);
          setShowContactForm(false);
        }}
        onSave={saveContact}
        onDelete={deleteContact}
      />
    </ScrollView>
  );
}
