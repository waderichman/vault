import { DocumentMeta } from '../types/vault';

export const documentMeta: DocumentMeta = {
  'Health Care Surrogate': {
    icon: 'person-circle-outline',
    purpose: 'Names who can make medical decisions when you cannot.',
    shortName: 'Proxy',
  },
  'HIPAA Authorization': {
    icon: 'medkit-outline',
    purpose: 'Names who doctors may share protected health information with.',
    shortName: 'HIPAA',
  },
  'Living Will': {
    icon: 'document-text-outline',
    purpose: 'States care wishes for end-of-life or no-recovery scenarios.',
    shortName: 'Wishes',
  },
  'POLST / MOLST / POST': {
    icon: 'clipboard-outline',
    purpose: 'Portable medical orders for serious illness or frailty, usually completed with a clinician.',
    shortName: 'Medical Orders',
  },
};
