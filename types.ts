export const ValidationStatus = {
  IDLE: 'idle',
  SUCCESS: 'success',
  NOT_FOUND: 'not_found',
  ERROR: 'error',
} as const;

export type ValidationStatusType = typeof ValidationStatus[keyof typeof ValidationStatus];

export interface CertificateRecord {
  [key: string]: string | number | null | undefined;
}
