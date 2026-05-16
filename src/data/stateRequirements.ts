import { DirectiveDocumentType } from '../types/vault';
import { UsStateCode, getStateName, usStates } from './usStates';

export type StateRequirementProfile = {
  stateCode: UsStateCode;
  stateName: string;
  recommendedDocuments: DirectiveDocumentType[];
  sourceUrl: string;
  sourceLabel: string;
  reviewStatus: 'Needs legal review' | 'Source-linked';
  guidanceNote: string;
};

const commonDocuments: DirectiveDocumentType[] = ['Health Care Surrogate', 'HIPAA Authorization', 'Living Will'];

export const stateRequirementProfiles: Record<UsStateCode, StateRequirementProfile> = usStates.reduce(
  (profiles, state) => ({
    ...profiles,
    [state.code]: {
      stateCode: state.code,
      stateName: state.name,
      recommendedDocuments: commonDocuments,
      sourceUrl: 'https://www.caringinfo.org/planning/advance-directives/by-state/',
      sourceLabel: 'CaringInfo state advance directive forms',
      reviewStatus: 'Needs legal review',
      guidanceNote:
        'State-specific forms and signing rules should be verified against official state materials or reviewed by counsel before production use.',
    },
  }),
  {} as Record<UsStateCode, StateRequirementProfile>,
);

export function getStateRequirementProfile(stateCode?: string) {
  if (!stateCode || !(stateCode in stateRequirementProfiles)) {
    return null;
  }

  return stateRequirementProfiles[stateCode as UsStateCode];
}

export function getStateDisplayName(stateCode?: string, fallback?: string) {
  return getStateName(stateCode) || fallback || '';
}
