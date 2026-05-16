import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Header } from '../components/Header';
import { InfoLine } from '../components/InfoLine';
import { SectionTitle } from '../components/SectionTitle';
import { styles } from '../components/styles';
import { ToggleLine } from '../components/ToggleLine';
import { makeId } from '../lib/ids';
import { VaultData } from '../types/vault';

export function EmergencyScreen({
  vault,
  setVault,
  addAudit,
}: {
  vault: VaultData;
  setVault: React.Dispatch<React.SetStateAction<VaultData>>;
  addAudit: (message: string) => void;
}) {
  const approveRequest = (id: string) => {
    setVault((current) => ({
      ...current,
      accessRequests: current.accessRequests.map((request) => (request.id === id ? { ...request, status: 'Approved' } : request)),
    }));
    addAudit('Emergency access request approved');
  };

  const denyRequest = (id: string) => {
    setVault((current) => ({
      ...current,
      accessRequests: current.accessRequests.map((request) => (request.id === id ? { ...request, status: 'Denied' } : request)),
    }));
    addAudit('Emergency access request denied');
  };

  const addAccessRequest = () => {
    setVault((current) => ({
      ...current,
      accessRequests: [
        {
          id: makeId('req'),
          requesterName: 'Emergency Department',
          requesterRole: 'Verified medical provider',
          status: 'Pending',
          requestedAt: 'Just now',
        },
        ...current.accessRequests,
      ],
    }));
    addAudit('Emergency access requested');
  };

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <Header title="Emergency" subtitle="In-app access controls and request log" />
      <View style={styles.panel}>
        <SectionTitle title="Emergency Summary" />
        <InfoLine label="Patient" value={vault.memberName} />
        <InfoLine label="Directive state" value={vault.directiveState} />
        <InfoLine label="Surrogate" value={vault.contacts.find((contact) => contact.canApproveAccess)?.name ?? 'Not set'} />
        <InfoLine label="Attorney" value={vault.attorneyName} />
        <InfoLine label="Documents" value={`${vault.documents.filter((document) => document.isActive).length} active directives on file`} />
      </View>
      <View style={styles.panel}>
        <SectionTitle title="Break-glass Controls" />
        <ToggleLine label="Require surrogate PIN" value={vault.requirePin} setValue={(value) => setVault((current) => ({ ...current, requirePin: value }))} />
        <ToggleLine
          label="Require two trusted approvals"
          value={vault.requireTwoApprovals}
          setValue={(value) => setVault((current) => ({ ...current, requireTwoApprovals: value }))}
        />
        <Pressable style={styles.primaryButton} onPress={addAccessRequest}>
          <Ionicons name="lock-open-outline" size={20} color="#ffffff" />
          <Text style={styles.primaryButtonText}>Simulate Access Request</Text>
        </Pressable>
      </View>
      <SectionTitle title="Access Requests" />
      {vault.accessRequests.map((request) => (
        <View key={request.id} style={styles.requestCard}>
          <Text style={styles.rowTitle}>{request.requesterName}</Text>
          <Text style={styles.rowSub}>{request.requesterRole}</Text>
          <Text style={[styles.statusRequestText, request.status === 'Denied' && styles.deniedText, request.status === 'Approved' && styles.approvedText]}>
            {request.status}
          </Text>
          <Text style={styles.tinyText}>{request.requestedAt}</Text>
          {request.status === 'Pending' && (
            <View style={styles.actionRow}>
              <Pressable style={styles.smallSecondaryButton} onPress={() => denyRequest(request.id)}>
                <Text style={styles.smallSecondaryText}>Deny</Text>
              </Pressable>
              <Pressable style={styles.smallPrimaryButton} onPress={() => approveRequest(request.id)}>
                <Text style={styles.smallPrimaryText}>Approve</Text>
              </Pressable>
            </View>
          )}
        </View>
      ))}
      <View style={styles.panel}>
        <SectionTitle title="Audit Log" />
        {vault.auditLog.slice(0, 6).map((event) => (
          <InfoLine key={event.id} label={event.createdAt} value={event.message} />
        ))}
      </View>
    </ScrollView>
  );
}
