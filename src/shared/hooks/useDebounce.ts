import { useEffect, useState } from 'react';

/**
 * Универсальный debounce-хук.
 *
 * @template T - Тип значения, которое нужно дебаунсить.
 * @param value - Значение, которое будет отложено.
 * @param delay - Задержка в миллисекундах (по умолчанию 500 мс).
 * @returns Отложенное значение, обновляющееся после задержки.
 *
 * @example
 * const debouncedValue = useDebounce(searchTerm, 300);
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}
