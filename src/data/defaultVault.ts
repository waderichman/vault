import { VaultData } from '../types/vault';

export const defaultVault: VaultData = {
  onboarded: false,
  memberName: '',
  directiveState: '',
  directiveStateCode: undefined,
  attorneyName: '',
  attorneyFirm: '',
  attorneyPhone: '',
  attorneyEmail: '',
  requirePin: true,
  requireTwoApprovals: false,
  documents: [],
  contacts: [],
  accessRequests: [],
  auditLog: [],
};
