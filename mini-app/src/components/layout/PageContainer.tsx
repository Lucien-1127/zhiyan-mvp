import { type ReactNode } from 'react';

export function PageContainer({ children, style }: { children: ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        padding: '16px 16px 100px',
        flex: 1,
        overflowY: 'auto',
        ...style,
      }}
    >
      {children}
    </div>
  );
}
