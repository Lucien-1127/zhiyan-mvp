import { type ReactNode } from 'react';
import { useTelegramInit } from '../../hooks/telegram';

export function TelegramProvider({ children }: { children: ReactNode }) {
  useTelegramInit();
  return <>{children}</>;
}
