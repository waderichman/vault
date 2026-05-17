import { getStateRequirementProfile, StateDocumentRequirement } from '../data/stateRequirements';
import { DirectiveDocument, VaultData } from '../types/vault';

export type StateChecklistStatus = 'complete' | 'missing' | 'review';

export type StateChecklistItem = StateDocumentRequirement & {
  status: StateChecklistStatus;
  matchedDocuments: DirectiveDocument[];
  actionLabel: string;
};

export function buildStateChecklist(vault: VaultData): StateChecklistItem[] {
  const profile = getStateRequirementProfile(vault.directiveStateCode);

  if (!profile) {
    return [];
  }

  const activeDocuments = vault.documents.filter((document) => document.isActive);

  return profile.documentRequirements.map((requirement) => {
    const matchedDocuments = activeDocuments.filter((document) => requirement.acceptedDocumentTypes.includes(document.type));

    if (matchedDocuments.length > 0) {
      return {
        ...requirement,
        matchedDocuments,
        status: 'complete' as const,
        actionLabel: `${matchedDocuments.length} active`,
      };
    }

    if (requirement.priority === 'situational') {
      return {
        ...requirement,
        matchedDocuments,
        status: 'review' as const,
        actionLabel: 'Review with clinician',
      };
    }

    return {
      ...requirement,
      matchedDocuments,
      status: 'missing' as const,
      actionLabel: requirement.priority === 'core' ? 'Missing core item' : 'Recommended',
    };
  });
}

export function summarizeStateChecklist(vault: VaultData) {
  const checklist = buildStateChecklist(vault);
  const coreMissing = checklist.filter((item) => item.priority === 'core' && item.status === 'missing').length;
  const recommendedMissing = checklist.filter((item) => item.priority === 'recommended' && item.status === 'missing').length;
  const reviewNeeded = checklist.filter((item) => item.status === 'review').length;

  return {
    checklist,
    coreMissing,
    recommendedMissing,
    reviewNeeded,
  };
}
