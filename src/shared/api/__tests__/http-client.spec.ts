/* eslint-disable @typescript-eslint/no-explicit-any */
class MockAxiosError extends Error {
  isAxiosError: boolean;
  response: any;
  config: any;
  code: any;
  request: any;

  constructor(...args: any[]) {
    super(args[0]);
    this.isAxiosError = true;
    this.response = args[4];
    this.config = args[2];
    this.code = undefined;
    this.request = undefined;
  }
}

jest.mock('@/shared/config/env', () => ({
  getRawEnv: () => ({
    VITE_API_URL: 'https://api.example.com',
    VITE_DEFAULT_CACHE_TTL: 60000,
    VITE_DEFAULT_TIMEOUT: 10000,
  }),
}));

const axiosInstanceMock = {
  request: jest.fn(),
  interceptors: {
    request: { use: jest.fn(), eject: jest.fn() },
    response: { use: jest.fn(), eject: jest.fn() },
  },
};

jest.mock('axios', () => ({
  __esModule: true,
  default: { create: jest.fn(() => axiosInstanceMock) },
  create: jest.fn(() => axiosInstanceMock),
  AxiosError: MockAxiosError,
  AxiosHeaders: class MockAxiosHeaders {
    constructor() {}
    set() {}
  },
}));

import { AxiosError, AxiosHeaders } from 'axios';

import { HttpClient, type ApiResponse } from '@/shared/api/http-client';
import { EHttpError } from '@/shared/errors';

describe('HttpClient', () => {
  let client: HttpClient;

  beforeEach(() => {
    client = new HttpClient('https://api.example.com', undefined, undefined, {
      enableCache: false, // Отключаем кэш для базовых тестов
    });
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Очищаем ресурсы после каждого теста
    client.destroy();
  });

  it('должен вернуть данные при успешном GET', async () => {
    const responseData: ApiResponse<{ id: number; name: string }> = { data: { id: 1, name: 'Test' } };
    axiosInstanceMock.request.mockResolvedValue({ data: responseData });

    const result = await client.get<ApiResponse<{ id: number; name: string }>>('/test');
    expect(result).toEqual(responseData);
  });

  it('должен вернуть данные при успешном POST', async () => {
    const responseData: ApiResponse<{ success: boolean }> = { data: { success: true } };
    axiosInstanceMock.request.mockResolvedValue({ data: responseData });

    const payload = { name: 'Test' };
    const result = await client.post<ApiResponse<{ success: boolean }>>('/create', payload);

    expect(result).toEqual(responseData);
    expect(axiosInstanceMock.request).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'POST',
        url: 'https://api.example.com/create',
        data: payload,
        headers: {},
        timeout: 10000,
      }),
    );
  });

  it('должен выбросить HttpError при 500', async () => {
    const axiosError = new AxiosError(
      'Request failed with status code 500',
      undefined,
      { url: '/error', method: 'get', headers: new AxiosHeaders(), data: null },
      undefined,
      {
        status: 500,
        statusText: 'Internal Server Error',
        data: { message: 'Server Error' },
        headers: {},
        config: { url: '/error', method: 'get', headers: new AxiosHeaders(), data: null },
      },
    );

    axiosInstanceMock.request.mockRejectedValueOnce(axiosError);

    await expect(client.get('/error')).rejects.toMatchObject({
      type: EHttpError.SERVER,
      status: 500,
      message: 'Server Error',
    });
  });

  it('должен выбросить HttpError при 404', async () => {
    const axiosError = new AxiosError(
      'Not Found',
      undefined,
      { url: '/missing', method: 'get', headers: new AxiosHeaders(), data: null },
      undefined,
      {
        status: 404,
        statusText: 'Not Found',
        data: { message: 'Page not found' },
        headers: {},
        config: { url: '/missing', method: 'get', headers: new AxiosHeaders(), data: null },
      },
    );

    axiosInstanceMock.request.mockRejectedValueOnce(axiosError);

    await expect(client.get('/missing')).rejects.toMatchObject({
      type: EHttpError.CLIENT,
      status: 404,
      message: 'Page not found',
    });
  });

  it('должен выбросить HttpError при Network Error', async () => {
    const axiosError = new AxiosError(
      'Network Error',
      undefined,
      { url: '/network', method: 'get', headers: new AxiosHeaders(), data: null },
      undefined,
      undefined,
    );

    axiosInstanceMock.request.mockRejectedValueOnce(axiosError);

    await expect(client.get('/network')).rejects.toMatchObject({
      type: EHttpError.UNKNOWN,
      status: undefined,
      message: 'Network Error',
    });
  });

  it('должен вызывать request с правильными параметрами', async () => {
    axiosInstanceMock.request.mockResolvedValue({ data: { data: 123 } });

    await client.get('/params', { params: { q: 'test' } });

    expect(axiosInstanceMock.request).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'GET',
        url: 'https://api.example.com/params',
        params: { q: 'test' },
        headers: {},
        timeout: 10000,
      }),
    );
  });
});

describe('HttpClient Cache', () => {
  let client: HttpClient;

  beforeEach(() => {
    client = new HttpClient('https://api.example.com', undefined, undefined, {
      enableCache: true,
      defaultCacheTtl: 1000,
      // НЕ включаем autoPruneInterval в тестах
    });
    jest.clearAllMocks();
  });

  afterEach(() => {
    client.destroy();
  });

  it('должен закэшировать GET-запрос', async () => {
    const responseData = { data: { id: 1 } };
    axiosInstanceMock.request.mockResolvedValue({ data: responseData });

    // Первый запрос
    await client.get('/test', { cache: { enabled: true } });
    expect(axiosInstanceMock.request).toHaveBeenCalledTimes(1);

    // Второй запрос (из кэша)
    const result = await client.get('/test', { cache: { enabled: true } });
    expect(axiosInstanceMock.request).toHaveBeenCalledTimes(1); // не вызывался повторно
    expect(result).toEqual(responseData);
  });

  it('должен инвалидировать кэш по паттерну', async () => {
    axiosInstanceMock.request.mockResolvedValue({ data: { data: 1 } });

    await client.get('/users/1', { cache: { enabled: true } });
    await client.get('/users/2', { cache: { enabled: true } });

    expect(client.cacheManager.size).toBe(2);

    client.cacheManager.invalidate(/^GET:.*\/users\//);

    expect(client.cacheManager.size).toBe(0);
  });

  it('должен использовать network-first при ошибке сети', async () => {
    const cachedData = { data: { cached: true } };
    axiosInstanceMock.request
      .mockResolvedValueOnce({ data: cachedData })
      .mockRejectedValueOnce(new Error('Network error'));

    // Первый запрос - успешный
    await client.get('/test', { cache: { enabled: true, strategy: 'network-first' } });

    // Второй запрос - ошибка, но вернется кэш
    const result = await client.get('/test', { cache: { enabled: true, strategy: 'network-first' } });

    expect(result).toEqual(cachedData);
  });

  it('должен очищать устаревшие записи при вызове prune', async () => {
    axiosInstanceMock.request.mockResolvedValue({ data: { data: 1 } });

    // Создаем запись с коротким TTL
    await client.get('/short-lived', { cache: { enabled: true, ttl: 10 } });

    expect(client.cacheManager.size).toBe(1);

    // Ждем истечения TTL
    await new Promise((resolve) => setTimeout(resolve, 20));

    // Вызываем prune вручную
    const pruned = client.cacheManager.prune();

    expect(pruned).toBe(1);
    expect(client.cacheManager.size).toBe(0);
  });

  it('должен поддерживать кастомную валидацию кэша', async () => {
    const oldData = { data: { version: 1 } };
    const newData = { data: { version: 2 } };

    axiosInstanceMock.request.mockResolvedValueOnce({ data: oldData }).mockResolvedValueOnce({ data: newData });

    // Первый запрос - кэшируем
    await client.get('/versioned', { cache: { enabled: true } });

    // Второй запрос с валидацией - кэш невалиден, идем в сеть
    const result = await client.get('/versioned', {
      cache: {
        enabled: true,
        isValid: (data: any) => data.data.version === 2,
      },
    });

    expect(result).toEqual(newData);
    expect(axiosInstanceMock.request).toHaveBeenCalledTimes(2);
  });
});
