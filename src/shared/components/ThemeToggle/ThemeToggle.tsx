import { toggleDark } from '@/app/store/themeSlice';
import { useAppDispatch, useAppSelector } from '@/shared/hooks/redux';
import { useLocalStorage } from '@/shared/hooks/useLocalStorage';
import { Button } from '@/shared/shadcn/ui/button';

export const ThemeToggle = () => {
  const dispatch = useAppDispatch();
  const dark = useAppSelector((state) => state.theme.dark);
  const [, setStored] = useLocalStorage<boolean>('theme', dark);

  const handleToggle = () => {
    dispatch(toggleDark());
    setStored(!dark);
  };

  return (
    <Button aria-activedescendant="" aria-pressed={dark} variant="outline" onClick={handleToggle}>
      {dark ? '🌙 Dark' : '☀️ Light'}
    </Button>
  );
};
