import { useEffect } from 'react';
import type { ReactNode } from 'react';

export function TgSettingsButtonController({ visible, onClick, children }: {
  visible: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp;
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
      try { sb.hide(); } catch {}
      try { sb.offClick(onClick); } catch {}
    };
  }, [visible, onClick]);
  return <>{children}</>;
}
