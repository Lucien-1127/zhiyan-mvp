export function BottomSafeArea() {
  return <div aria-hidden="true" style={{ height: 'env(safe-area-inset-bottom, 0px)', minHeight: 20 }} />;
}
