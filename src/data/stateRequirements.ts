import { DirectiveDocumentType } from '../types/vault';
import { UsStateCode, getStateName, usStates } from './usStates';

export type StateDocumentRequirement = {
  id: string;
  label: string;
  category: 'Agent authority' | 'Treatment wishes' | 'Privacy release' | 'Portable medical orders';
  priority: 'core' | 'recommended' | 'situational';
  acceptedDocumentTypes: DirectiveDocumentType[];
  note: string;
};

export type StateRequirementProfile = {
  stateCode: UsStateCode;
  stateName: string;
  jurisdictionLabel: string;
  documentRequirements: StateDocumentRequirement[];
  sourceUrl: string;
  sourceLabel: string;
  polstSourceUrl: string;
  polstSourceLabel: string;
  legalStatus: 'Not legal advice';
  guidanceNote: string;
};

const commonDocumentRequirements: StateDocumentRequirement[] = [
  {
    id: 'health-care-agent',
    label: 'Health care agent or proxy',
    category: 'Agent authority',
    priority: 'core',
    acceptedDocumentTypes: ['Health Care Surrogate'],
    note: 'Names the person who can make medical decisions when the vault owner cannot.',
  },
  {
    id: 'treatment-wishes',
    label: 'Treatment wishes or living will',
    category: 'Treatment wishes',
    priority: 'core',
    acceptedDocumentTypes: ['Living Will'],
    note: 'Documents end-of-life or no-recovery care preferences; state naming and triggering rules vary.',
  },
  {
    id: 'hipaa-release',
    label: 'HIPAA release',
    category: 'Privacy release',
    priority: 'recommended',
    acceptedDocumentTypes: ['HIPAA Authorization'],
    note: 'Allows named people to receive protected health information from providers.',
  },
  {
    id: 'portable-medical-order',
    label: 'POLST / MOLST / POST',
    category: 'Portable medical orders',
    priority: 'situational',
    acceptedDocumentTypes: ['POLST / MOLST / POST'],
    note: 'Usually relevant for serious illness or frailty and typically completed through a state clinical program.',
  },
];

export const stateRequirementProfiles: Record<UsStateCode, StateRequirementProfile> = usStates.reduce(
  (profiles, state) => ({
    ...profiles,
    [state.code]: {
      stateCode: state.code,
      stateName: state.name,
      jurisdictionLabel: `Organized for ${state.name}`,
      documentRequirements: commonDocumentRequirements,
      sourceUrl: `https://www.caringinfo.org/planning/advance-directives/by-state/${stateSlug(state.name)}/`,
      sourceLabel: `${state.name} advance directive forms`,
      polstSourceUrl: 'https://polst.org/state-polst-programs/',
      polstSourceLabel: 'National POLST state program directory',
      legalStatus: 'Not legal advice',
      guidanceNote:
        'AdvanceVault organizes documents by selected state but does not determine legal validity. Review official state instructions or counsel for execution requirements.',
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

function stateSlug(stateName: string) {
  return stateName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
