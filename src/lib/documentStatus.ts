import { VerificationStatus } from '../types/vault';

export function nextStatusesForActive(statuses: VerificationStatus[], isActive: boolean): VerificationStatus[] {
  const withoutVersion = statuses.filter((status) => status !== 'Active directive' && status !== 'Superseded');
  return [...withoutVersion, isActive ? 'Active directive' : 'Superseded'];
}
