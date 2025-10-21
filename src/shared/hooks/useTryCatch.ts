import { useCallback, useEffect, useRef, useState } from 'react';

interface UseTryCatchResult<T, E> {
  data: T | null;
  error: E | null;
  loading: boolean;
  execute: () => Promise<void>;
}

/**
 * Хук для обработки асинхронных операций с автоматическим управлением состояниями загрузки, данных и ошибок.
 *
 * @template T Тип данных, возвращаемых успешным выполнением промиса.
 * @template E Тип ошибки, возвращаемой при неудачном выполнении промиса. По умолчанию Error.
 * @param promiseFn Функция, возвращающая промис для выполнения. Она может принимать необязательный AbortSignal для поддержки отмены.
 * @returns Объект с состояниями: data (данные), error (ошибка), loading (загрузка) и функцию execute для запуска операции.
 */
export function useTryCatch<T, E = Error>(promiseFn: (signal?: AbortSignal) => Promise<T>): UseTryCatchResult<T, E> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<E | null>(null);
  const [loading, setLoading] = useState(false);

  const fnRef = useRef(promiseFn);
  fnRef.current = promiseFn; // обновляем при каждом рендере, если promiseFn поменялся

  const callIdRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  const execute = useCallback(async () => {
    callIdRef.current += 1;
    const callId = callIdRef.current;

    // Отменяем предыдущий запрос
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    try {
      const result = await fnRef.current(controller.signal);
      if (callId === callIdRef.current) {
        setData(result);
        setError(null);
      }
    } catch (err) {
      if (controller.signal.aborted) return;
      if (callId === callIdRef.current) {
        setData(null);
        setError(err as E);
      }
    } finally {
      if (callId === callIdRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  return { data, error, loading, execute };
}
