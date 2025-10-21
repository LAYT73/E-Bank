import React, { createContext, useContext, type ReactNode, useMemo } from 'react';

import { HttpClient } from '@/shared/api/http-client';
import config from '@/shared/config/config';
import { ConsoleLogger, type ILogger } from '@/shared/lib/logger';

export interface DIContainer {
  logger: ILogger;
  httpClient: HttpClient;
}

const DIContext = createContext<DIContainer | null>(null);

export const DIProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const container = useMemo<DIContainer>(() => {
    const logger = new ConsoleLogger();
    const httpClient = new HttpClient(config.VITE_API_URL, undefined, logger, {
      enableCache: true,
      defaultCacheTtl: 60000,
    });

    return { logger, httpClient };
  }, []);

  return <DIContext.Provider value={container}>{children}</DIContext.Provider>;
};

export const useDI = (): DIContainer => {
  const context = useContext(DIContext);
  if (!context) throw new Error('useDI must be used within DIProvider');
  return context;
};
