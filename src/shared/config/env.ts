export function getRawEnv() {
  return {
    VITE_API_URL: import.meta.env.VITE_API_URL,
    VITE_DEFAULT_CACHE_TTL: import.meta.env.VITE_DEFAULT_CACHE_TTL
      ? Number(import.meta.env.VITE_DEFAULT_CACHE_TTL)
      : undefined,
    VITE_DEFAULT_TIMEOUT: import.meta.env.VITE_DEFAULT_TIMEOUT
      ? Number(import.meta.env.VITE_DEFAULT_TIMEOUT)
      : undefined,
  } as Record<string, string | undefined>;
}
