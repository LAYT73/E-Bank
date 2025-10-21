import './styles/index.scss';
import './styles/tailwind.css';

import { AppProviders } from '@/app/providers/AppProviders';
import { useInitTheme } from '@/shared/hooks/useInitTheme';

import { AppRouter } from './providers/router/AppRouter';

function App() {
  useInitTheme();

  return (
    <AppProviders>
      <AppRouter />
    </AppProviders>
  );
}

export default App;
