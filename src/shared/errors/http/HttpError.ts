import { AxiosError } from 'axios';

import { type HttpStatusType } from '@/shared/api/http-status';
import { EHttpError, type HttpErrorType } from '@/shared/errors/http/HttpError.types';

export class HttpError extends Error {
  public readonly type: HttpErrorType;
  public readonly status?: HttpStatusType;
  public readonly details?: unknown;

  constructor(type: HttpErrorType, message: string, status?: HttpStatusType, details?: unknown) {
    super(message);
    this.name = 'HttpError';
    this.type = type;
    this.status = status;
    this.details = details;
  }

  static fromAxiosError(error: AxiosError): HttpError {
    if (error.code === 'ECONNABORTED' || /timeout/i.test(error.message)) {
      return new HttpError(EHttpError.TIMEOUT, 'Request timed out');
    }

    const status = error.response?.status;
    const data = error.response?.data;
    const statusText = error.response?.statusText;

    if (status) {
      let message = 'Server Error';
      if (data && typeof data === 'object' && data !== null) {
        message = ((data as Record<string, unknown>).message as string) || statusText || message;
      } else {
        message = statusText || message;
      }

      if (status >= 500) return new HttpError(EHttpError.SERVER, message, status, data);
      return new HttpError(EHttpError.CLIENT, message, status, data);
    }

    if (error.request) return new HttpError(EHttpError.NETWORK, 'Network error. Check connection.');

    return new HttpError(EHttpError.UNKNOWN, error.message);
  }
}
