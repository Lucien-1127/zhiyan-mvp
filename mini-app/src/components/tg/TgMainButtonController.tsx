import { useTelegramMainButton } from '../../hooks/telegram';
import type { MainButtonConfig } from '../../hooks/telegram';
import type { ReactNode } from 'react';

export function TgMainButtonController({ config, onClick, children }: {
  config: MainButtonConfig;
  onClick: () => void;
  children: ReactNode;
}) {
  useTelegramMainButton(config, onClick);
  return <>{children}</>;
}
