/* eslint-disable no-undef */
import { AxiosError, type AxiosInstance, type AxiosRequestConfig } from 'axios';

import { createAxiosInstance } from '@/shared/api/axios-factory';
import { HttpCache } from '@/shared/api/http-cache';
import { EHttpMethod, type HttpMethodType, type IRequestOptions } from '@/shared/api/http-types';
import config from '@/shared/config/config';
import { EHttpError, HttpError, ValidationError } from '@/shared/errors';
import { ConsoleLogger, type ILogger } from '@/shared/lib/logger';

const DEFAULT_TIMEOUT = config.VITE_DEFAULT_TIMEOUT;
const DEFAULT_CACHE_TTL = config.VITE_DEFAULT_CACHE_TTL;

/** Универсальный тип ответа API */
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface HttpClientConfig {
  /** Включить кэширование глобально */
  enableCache?: boolean;
  /** TTL по умолчанию для всех кэшируемых запросов */
  defaultCacheTtl?: number;
  /** Автоматическая очистка устаревших записей (интервал в мс) */
  autoPruneInterval?: number;
}

export class HttpClient {
  private readonly axiosInstance: AxiosInstance;
  private readonly baseUrl: string;
  private readonly logger: ILogger;
  private readonly cache: HttpCache;
  private readonly config: HttpClientConfig;
  private pruneInterval?: NodeJS.Timeout;

  constructor(baseUrl: string, axiosConfig?: AxiosRequestConfig, logger?: ILogger, clientConfig?: HttpClientConfig) {
    this.axiosInstance = createAxiosInstance(baseUrl, axiosConfig, logger);
    this.baseUrl = baseUrl.replace(/\/+$/, '');
    this.logger = logger ?? new ConsoleLogger();
    this.cache = new HttpCache(this.logger);
    this.config = {
      enableCache: clientConfig?.enableCache ?? true,
      defaultCacheTtl: clientConfig?.defaultCacheTtl ?? DEFAULT_CACHE_TTL,
      autoPruneInterval: clientConfig?.autoPruneInterval,
    };

    // Настройка автоматической очистки
    if (this.config.autoPruneInterval) {
      this.startAutoPrune(this.config.autoPruneInterval);
    }
  }

  /**
   * Получить доступ к кэшу (для ручного управления)
   */
  get cacheManager(): HttpCache {
    return this.cache;
  }

  /**
   * Запустить автоматическую очистку устаревших записей
   */
  startAutoPrune(interval: number): void {
    // Если уже запущен, останавливаем старый
    if (this.pruneInterval) {
      this.stopAutoPrune();
    }

    this.pruneInterval = setInterval(() => {
      this.cache.prune();
    }, interval);

    // Для Node.js окружения (тесты) - позволяем процессу завершиться
    if (typeof this.pruneInterval === 'object' && 'unref' in this.pruneInterval) {
      (this.pruneInterval as NodeJS.Timeout).unref();
    }
  }

  /**
   * Остановить автоматическую очистку
   */
  stopAutoPrune(): void {
    if (this.pruneInterval) {
      clearInterval(this.pruneInterval);
      this.pruneInterval = undefined;
    }
  }

  /**
   * Уничтожить клиент и очистить ресурсы
   */
  destroy(): void {
    this.stopAutoPrune();
    this.cache.clear();
  }

  private getUrl(endpoint: string) {
    if (!endpoint) throw new ValidationError('Endpoint cannot be empty');
    return `${this.baseUrl}/${endpoint.replace(/^\/+/, '')}`;
  }

  private async execute<TResponse = unknown, TData = unknown, TParams = Record<string, string | number | boolean>>(
    method: HttpMethodType,
    url: string,
    options?: IRequestOptions<TData, TParams>,
  ): Promise<TResponse> {
    const cacheOptions = options?.cache;
    const isCacheEnabled = this.config.enableCache && cacheOptions?.enabled !== false;
    const isGetRequest = method === EHttpMethod.GET;

    // Только GET запросы кэшируются по умолчанию
    const shouldUseCache = isCacheEnabled && isGetRequest && cacheOptions;
    const cacheStrategy = cacheOptions?.strategy ?? 'cache-first';
    const cacheTtl = cacheOptions?.ttl ?? this.config.defaultCacheTtl;

    // Генерируем ключ кэша
    let cacheKey: string | null = null;
    if (shouldUseCache) {
      cacheKey = cacheOptions?.key ?? this.cache.generateKey(method, url, options?.params as Record<string, unknown>);
    }

    // Стратегия: cache-only
    if (shouldUseCache && cacheStrategy === 'cache-only' && cacheKey) {
      const cached = this.cache.get<TResponse>(cacheKey);
      if (cached) {
        return cached;
      }
      throw new HttpError(EHttpError.CLIENT, 'No cached data available', 404);
    }

    // Стратегия: cache-first
    if (shouldUseCache && cacheStrategy === 'cache-first' && cacheKey) {
      const cached = this.cache.get<TResponse>(cacheKey);
      if (cached) {
        // Проверяем кастомную валидацию
        if (!cacheOptions?.isValid || cacheOptions.isValid(cached)) {
          return cached;
        }
        // Если данные невалидны, удаляем из кэша
        this.cache.delete(cacheKey);
      }
    }

    // Выполняем запрос
    const isFormData = typeof FormData !== 'undefined' && options?.data instanceof FormData;

    const axiosConfig: AxiosRequestConfig = {
      method,
      url: this.getUrl(url),
      params: options?.params,
      data: options?.data,
      headers: {
        ...options?.headers,
        ...(isFormData ? { 'Content-Type': 'multipart/form-data' } : {}),
      },
      signal: options?.signal,
      timeout: options?.timeout ?? DEFAULT_TIMEOUT,
      onUploadProgress: options?.onUploadProgress,
      onDownloadProgress: options?.onDownloadProgress,
    };

    const startTime = Date.now();

    try {
      const response = await this.axiosInstance.request<TResponse>(axiosConfig);
      const duration = Date.now() - startTime;
      this.logger.info(`[HTTP ${method}] ${url} success`, { duration, status: response.status });

      // Сохраняем в кэш
      if (shouldUseCache && cacheKey && response.data) {
        this.cache.set(cacheKey, response.data, cacheTtl);
      }

      return response.data;
    } catch (err) {
      const duration = Date.now() - startTime;
      let httpError: HttpError;

      if (err instanceof AxiosError) {
        httpError = HttpError.fromAxiosError(err);
      } else {
        httpError = new HttpError(EHttpError.UNKNOWN, (err as Error).message);
      }

      this.logger.error(`HTTP ${method} ${url} failed`, {
        duration,
        type: httpError.type,
        status: httpError.status,
        message: httpError.message,
      });

      // Стратегия: network-first - возвращаем кэш при ошибке
      if (shouldUseCache && cacheStrategy === 'network-first' && cacheKey) {
        const cached = this.cache.get<TResponse>(cacheKey);
        if (cached) {
          this.logger.warn(`Returning cached data after network error for ${url}`);
          return cached;
        }
      }

      throw httpError;
    }
  }

  // Универсальная генерация методов
  private createMethod(method: HttpMethodType) {
    return <TResponse = unknown, TData = unknown, TParams = Record<string, string | number | boolean>>(
      url: string,
      dataOrOptions?: TData | IRequestOptions<TData, TParams>,
      optionsMaybe?: IRequestOptions<TData, TParams>,
    ) => {
      let data: TData | undefined;
      let options: IRequestOptions<TData, TParams> | undefined;

      if (method === EHttpMethod.GET || method === EHttpMethod.DELETE) {
        options = dataOrOptions as IRequestOptions<TData, TParams>;
      } else {
        data = dataOrOptions as TData;
        options = optionsMaybe;
      }

      return this.execute<TResponse, TData, TParams>(method, url, { ...options, data });
    };
  }

  /** GET */
  get = this.createMethod(EHttpMethod.GET);
  /** POST */
  post = this.createMethod(EHttpMethod.POST);
  /** PUT */
  put = this.createMethod(EHttpMethod.PUT);
  /** PATCH */
  patch = this.createMethod(EHttpMethod.PATCH);
  /** DELETE */
  delete = this.createMethod(EHttpMethod.DELETE);
}
