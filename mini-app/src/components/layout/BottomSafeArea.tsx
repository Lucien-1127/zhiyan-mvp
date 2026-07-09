import { useTelegramViewport } from '../../hooks/telegram';

export function BottomSafeArea() {
  const vp = useTelegramViewport();
  const bottom = (vp as any).safeAreaInsetBottom ?? 0;
  return <div style={{ height: bottom, minHeight: 20 }} />;
}
