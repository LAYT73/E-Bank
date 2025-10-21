import axios, { AxiosError, AxiosHeaders, type AxiosInstance, type AxiosRequestConfig } from 'axios';

import { HttpError } from '@/shared/errors';
import { ConsoleLogger, type ILogger } from '@/shared/lib/logger';

interface AxiosFactoryOptions extends AxiosRequestConfig {
  getToken?: () => string | null;
  refreshToken?: () => Promise<string>;
  retryCount?: number;
}

interface AxiosRequestWithRetry extends AxiosRequestConfig {
  _retry?: boolean;
  _retryCount?: number;
}

export function createAxiosInstance(baseURL: string, config?: AxiosFactoryOptions, logger?: ILogger): AxiosInstance {
  logger = logger ?? new ConsoleLogger();
  const retryCount = config?.retryCount ?? 1;

  const instance = axios.create({
    baseURL,
    headers: { 'Content-Type': 'application/json' },
    timeout: 10000,
    ...config,
  });

  // Request interceptor
  instance.interceptors.request.use((req) => {
    if (config?.getToken) {
      const token = config.getToken();
      if (token) {
        req.headers = new AxiosHeaders(req.headers);
        req.headers.set('Authorization', `Bearer ${token}`);
      }
    }
    logger.info(`[HTTP REQUEST] ${req.method?.toUpperCase()} ${req.url}`);
    return req;
  });

  // Response interceptor
  instance.interceptors.response.use(
    (res) => res,
    async (error: unknown) => {
      const startTime = Date.now();
      const originalRequest = (error as AxiosError)?.config as AxiosRequestWithRetry;

      const logError = (msg: string, extra?: Record<string, unknown>) => {
        const duration = Date.now() - startTime;
        logger.error(msg, { duration, method: originalRequest?.method, url: originalRequest?.url, ...extra });
      };

      // Проверяем, что это AxiosError
      const axiosError =
        error && typeof error === 'object' && 'isAxiosError' in error && (error as AxiosError).isAxiosError
          ? (error as AxiosError)
          : null;

      if (!axiosError) {
        logError('Non-Axios error caught', { originalError: error });
        return Promise.reject(error);
      }

      const status = axiosError.response?.status;

      // Retry 401 с refresh токеном
      if (status === 401 && config?.refreshToken && !originalRequest._retry) {
        originalRequest._retry = true;
        try {
          const newToken = await config.refreshToken();
          if (newToken) {
            originalRequest.headers = { ...(originalRequest.headers ?? {}), Authorization: `Bearer ${newToken}` };
            return instance.request(originalRequest);
          }
        } catch (refreshError) {
          logError('Refresh token failed', { originalError: (refreshError as Error).message });
          return Promise.reject(HttpError.fromAxiosError(axiosError));
        }
      }

      // Retry для 500/502/503
      if (status && [500, 502, 503].includes(status) && (originalRequest._retryCount ?? 0) < retryCount) {
        originalRequest._retryCount = (originalRequest._retryCount ?? 0) + 1;
        logError(`Retrying request, attempt #${originalRequest._retryCount}`, { status });
        return instance.request(originalRequest);
      }

      // Финальная ошибка
      logError('HTTP request failed', {
        status,
        message: axiosError.message,
        responseData: axiosError.response?.data,
      });

      return Promise.reject(HttpError.fromAxiosError(axiosError));
    },
  );

  return instance;
}
