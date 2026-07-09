import { type ReactNode, createContext, useContext } from 'react';
import { useTelegramTheme } from '../../hooks/telegram';
import type { TelegramThemeState } from '../../types/telegram';

const ThemeCtx = createContext<TelegramThemeState | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useTelegramTheme();
  return (
    <ThemeCtx.Provider value={theme}>
      {children}
    </ThemeCtx.Provider>
  );
}

export function useTheme(): TelegramThemeState {
  const ctx = useContext(ThemeCtx);
  if (!ctx) return { colorScheme: 'light' };
  return ctx;
}
