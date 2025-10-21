export const EHttpError = {
  NETWORK: 'NETWORK',
  TIMEOUT: 'TIMEOUT',
  SERVER: 'SERVER',
  CLIENT: 'CLIENT',
  UNKNOWN: 'UNKNOWN',
} as const;

export type HttpErrorType = (typeof EHttpError)[keyof typeof EHttpError];
