import { Ionicons } from '@expo/vector-icons';

export type Tab = 'vault' | 'emergency' | 'people' | 'settings';

export type DirectiveDocumentType = 'Health Care Surrogate' | 'HIPAA Authorization' | 'Living Will';

export type VerificationStatus =
  | 'Attorney-uploaded'
  | 'Uploaded by user'
  | 'Signed'
  | 'Witnessed'
  | 'Notarized'
  | 'Attorney-reviewed'
  | 'Active directive'
  | 'Superseded';

export type DirectiveDocument = {
  id: string;
  type: DirectiveDocumentType;
  state: string;
  signedDate: string;
  uploadedBy: string;
  statuses: VerificationStatus[];
  isActive: boolean;
  fileName?: string;
  fileSize?: number;
  localUri?: string;
  encryptedLocalUri?: string;
  encryptedSize?: number;
  encryptionKeyId?: string;
  encryptionFingerprint?: string;
  uploadStatus?:
    | 'No file attached'
    | 'Local PDF selected'
    | 'Encrypted locally'
    | 'Encrypted upload queued'
    | 'Encrypted blob uploaded; saving metadata'
    | 'Uploaded encrypted blob'
    | 'Encrypted blob uploaded; metadata pending';
};

export type TrustedContact = {
  id: string;
  name: string;
  role: string;
  phone: string;
  canApproveAccess: boolean;
};

export type AccessRequest = {
  id: string;
  requesterName: string;
  requesterRole: string;
  status: 'Pending' | 'Approved' | 'Denied';
  requestedAt: string;
};

export type AuditEvent = {
  id: string;
  message: string;
  createdAt: string;
};

export type VaultData = {
  onboarded: boolean;
  memberName: string;
  directiveState: string;
  directiveStateCode?: string;
  attorneyName: string;
  attorneyFirm: string;
  attorneyPhone: string;
  attorneyEmail: string;
  requirePin: boolean;
  requireTwoApprovals: boolean;
  documents: DirectiveDocument[];
  contacts: TrustedContact[];
  accessRequests: AccessRequest[];
  auditLog: AuditEvent[];
};

export type DocumentMeta = Record<
  DirectiveDocumentType,
  {
    icon: keyof typeof Ionicons.glyphMap;
    purpose: string;
    shortName: string;
  }
>;
