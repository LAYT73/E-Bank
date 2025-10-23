import { z } from 'zod';

import { ConfigError } from '@/shared/errors';

import { getRawEnv } from './env';

const EnvSchema = z.object({
  VITE_API_URL: z.url(),
  VITE_DEFAULT_CACHE_TTL: z.number().min(0).default(60000),
  VITE_DEFAULT_TIMEOUT: z.number().min(0).default(10000),
});

type Env = z.infer<typeof EnvSchema>;

const rawEnv = getRawEnv();
const parsed = EnvSchema.safeParse(rawEnv);

if (!parsed.success) {
  const { fieldErrors, formErrors } = parsed.error.flatten() as {
    fieldErrors: Record<string, string[] | undefined>;
    formErrors: string[];
  };

  const firstKey = Object.keys(fieldErrors)[0] ?? 'UNKNOWN';
  const firstMessage = fieldErrors[firstKey]?.[0] ?? formErrors[0] ?? 'Unknown error';

  throw new ConfigError(`Environment variable "${firstKey}" is invalid: ${firstMessage}`);
}

export const config: Env = parsed.data;
export default config;
