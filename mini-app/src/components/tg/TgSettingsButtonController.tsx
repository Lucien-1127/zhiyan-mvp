import { useEffect } from 'react';
import type { ReactNode } from 'react';

export function TgSettingsButtonController({ visible, onClick, children }: {
  visible: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    const sb = tg?.SettingsButton;
    if (!sb) return;
    try {
      if (visible) {
        sb.show();
        sb.onClick(onClick);
      } else {
        sb.hide();
      }
    } catch { /* ignore outside TG */ }
    return () => {
      try { sb.hide(); } catch { /* Telegram may be unavailable during teardown. */ }
      try { sb.offClick(onClick); } catch { /* Continue cleanup if Telegram is unavailable. */ }
    };
  }, [visible, onClick]);
  return <>{children}</>;
}
