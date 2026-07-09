import { useEffect } from 'react';
import { useTelegramTheme } from '../../hooks/telegram';

export function TgThemeSync() {
  const theme = useTelegramTheme();

  useEffect(() => {
    document.documentElement.style.setProperty('--tg-color-scheme', theme.colorScheme);
    if (theme.bgColor) document.documentElement.style.setProperty('--tg-theme-bg-color', theme.bgColor);
    if (theme.textColor) document.documentElement.style.setProperty('--tg-theme-text-color', theme.textColor);
    if (theme.hintColor) document.documentElement.style.setProperty('--tg-theme-hint-color', theme.hintColor);
    if (theme.linkColor) document.documentElement.style.setProperty('--tg-theme-link-color', theme.linkColor);
    if (theme.buttonColor) document.documentElement.style.setProperty('--tg-theme-button-color', theme.buttonColor);
    if (theme.buttonTextColor) document.documentElement.style.setProperty('--tg-theme-button-text-color', theme.buttonTextColor);
    if (theme.secondaryBgColor) document.documentElement.style.setProperty('--tg-theme-secondary-bg-color', theme.secondaryBgColor);
  }, [theme]);

  return null;
}
