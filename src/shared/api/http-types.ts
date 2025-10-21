import type { CacheOptions } from '@/shared/api/http-cache';

import type { AxiosProgressEvent } from 'axios';

/** Поддерживаемые HTTP-методы */
export const EHttpMethod = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  PATCH: 'PATCH',
  DELETE: 'DELETE',
} as const;

export type HttpMethodType = (typeof EHttpMethod)[keyof typeof EHttpMethod];

/** Параметры запроса */
export interface IRequestOptions<TData = unknown, TParams = Record<string, string | number | boolean>> {
  params?: TParams;
  data?: TData;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  timeout?: number;
  onUploadProgress?: (progressEvent: AxiosProgressEvent) => void;
  onDownloadProgress?: (progressEvent: AxiosProgressEvent) => void;
  /** Настройки кэширования */
  cache?: CacheOptions;
}
