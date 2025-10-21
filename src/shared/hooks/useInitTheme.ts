import { useEffect } from 'react';

import { store } from '@/app/store/store';
import { setDark } from '@/app/store/themeSlice';

import { useLocalStorage } from './useLocalStorage';

export const useInitTheme = () => {
  const [stored, setStored] = useLocalStorage<boolean | null>('theme', null);

  useEffect(() => {
    let dark: boolean;

    if (stored !== null) {
      dark = stored;
    } else {
      dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setStored(dark);
    }

    store.dispatch(setDark(dark));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
};
