import { type ReactNode } from 'react';
import { useTelegramViewport } from '../../hooks/telegram';

export function TelegramAppShell({ children }: { children: ReactNode }) {
  const vp = useTelegramViewport();
  return (
    <div
      style={{
        minHeight: vp.height ? `${vp.height}px` : '100dvh',
        maxWidth: '100vw',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--tg-theme-bg-color, #fff)',
        color: 'var(--tg-theme-text-color, #000)',
      }}
    >
      {children}
    </div>
  );
}
