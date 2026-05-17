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
  const hasAttorneyInfo = Boolean(vault.attorneyFirm || vault.attorneyName || vault.attorneyPhone || vault.attorneyEmail);

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
      <Header title="People" subtitle="Trusted contacts and professional contacts" />
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
      {vault.contacts.length === 0 ? (
        <View style={styles.panel}>
          <Text style={styles.rowSub}>Add trusted people who should know how to access this vault in an emergency.</Text>
        </View>
      ) : (
        vault.contacts.map((contact) => (
          <Pressable key={contact.id} style={styles.contactCard} onPress={() => setEditingContact(contact)}>
            <View style={styles.flex}>
              <Text style={styles.rowTitle}>{contact.name}</Text>
              <Text style={styles.rowSub}>{contact.role}</Text>
              <Text style={styles.tinyText}>{contact.phone}</Text>
            </View>
            {contact.canApproveAccess && <Ionicons name="shield-checkmark" size={24} color="#0f766e" />}
          </Pressable>
        ))
      )}
      <View style={styles.panel}>
        <SectionTitle title="Attorney Contact" />
        {hasAttorneyInfo ? (
          <>
            <InfoLine label="Firm" value={vault.attorneyFirm || 'Not added'} />
            <InfoLine label="Attorney" value={vault.attorneyName || 'Not added'} />
            <InfoLine label="Phone" value={vault.attorneyPhone || 'Not added'} />
            <InfoLine label="Email" value={vault.attorneyEmail || 'Not added'} />
          </>
        ) : (
          <Text style={styles.rowSub}>No attorney contact has been added. Add one in Settings if a professional helped prepare or review these documents.</Text>
        )}
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
