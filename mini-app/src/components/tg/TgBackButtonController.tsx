import { useTelegramBackButton } from '../../hooks/telegram';
import type { ReactNode } from 'react';

export function TgBackButtonController({ visible, onClick, children }: {
  visible: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  useTelegramBackButton(visible, onClick);
  return <>{children}</>;
}
