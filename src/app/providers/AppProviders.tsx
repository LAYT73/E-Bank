import { type ReactNode } from 'react';
import { Provider } from 'react-redux';

import { store } from '@/app/store/store';
import { DIProvider } from '@/shared/di/di-container';

import { ErrorBoundary } from '../ui/ErrorBoundary';

interface AppProvidersProps {
  children: ReactNode;
}

export const AppProviders = ({ children }: AppProvidersProps) => {
  return (
    <ErrorBoundary>
      <DIProvider>
        <Provider store={store}>{children}</Provider>
      </DIProvider>
    </ErrorBoundary>
  );
};
