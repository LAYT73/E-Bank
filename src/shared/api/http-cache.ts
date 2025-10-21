import { type ILogger } from '@/shared/lib/logger';

export interface CacheEntry<T = unknown> {
  data: T;
  expires: number;
  createdAt: number;
}

export interface CacheOptions {
  /** Время жизни кэша в миллисекундах */
  ttl?: number;
  /** Включить кэширование для этого запроса */
  enabled?: boolean;
  /** Ключ кэша (если не указан, генерируется автоматически) */
  key?: string;
  /** Стратегия обновления */
  strategy?: 'cache-first' | 'network-first' | 'cache-only';
  /** Условие валидности кэша */
  isValid?: (data: unknown) => boolean;
}

export class HttpCache {
  private cache = new Map<string, CacheEntry>();
  private logger?: ILogger;

  constructor(logger?: ILogger) {
    this.logger = logger;
  }

  /**
   * Генерирует ключ кэша на основе URL и параметров
   */
  generateKey(method: string, url: string, params?: Record<string, unknown>): string {
    const paramsStr = params ? JSON.stringify(params) : '';
    return `${method}:${url}${paramsStr ? ':' + paramsStr : ''}`;
  }

  /**
   * Получить данные из кэша
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      this.logger?.info(`[Cache MISS] ${key}`);
      return null;
    }

    // Проверяем, не истек ли срок действия
    if (entry.expires < Date.now()) {
      this.logger?.info(`[Cache EXPIRED] ${key}`);
      this.cache.delete(key);
      return null;
    }

    this.logger?.info(`[Cache HIT] ${key}`, {
      age: Date.now() - entry.createdAt,
      ttl: entry.expires - Date.now(),
    });

    return entry.data as T;
  }

  /**
   * Сохранить данные в кэш
   */
  set<T>(key: string, data: T, ttl: number = 60000): void {
    const entry: CacheEntry<T> = {
      data,
      expires: Date.now() + ttl,
      createdAt: Date.now(),
    };

    this.cache.set(key, entry);
    this.logger?.info(`[Cache SET] ${key}`, { ttl });
  }

  /**
   * Удалить данные из кэша по ключу
   */
  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.logger?.info(`[Cache DELETE] ${key}`);
    }
    return deleted;
  }

  /**
   * Удалить все данные, соответствующие паттерну
   */
  invalidate(pattern: string | RegExp): number {
    let count = 0;
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        count++;
      }
    }

    if (count > 0) {
      this.logger?.info(`[Cache INVALIDATE] ${pattern.toString()}`, { count });
    }

    return count;
  }

  /**
   * Очистить весь кэш
   */
  clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    this.logger?.info(`[Cache CLEAR]`, { cleared: size });
  }

  /**
   * Получить размер кэша
   */
  get size(): number {
    return this.cache.size;
  }

  /**
   * Получить все ключи кэша
   */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Удалить устаревшие записи
   */
  prune(): number {
    let count = 0;
    const now = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.expires < now) {
        this.cache.delete(key);
        count++;
      }
    }

    if (count > 0) {
      this.logger?.info(`[Cache PRUNE]`, { pruned: count });
    }

    return count;
  }
}
