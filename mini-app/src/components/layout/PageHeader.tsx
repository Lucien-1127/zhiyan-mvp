import type { ReactNode } from 'react';

export function PageHeader({ title, subtitle, action }: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div style={{
      padding: '12px 16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderBottom: '1px solid var(--tg-theme-section-separator-color, #e0e0e0)',
    }}>
      <div>
        <div style={{ fontSize: 17, fontWeight: 600 }}>{title}</div>
        {subtitle && (
          <div style={{ fontSize: 13, color: 'var(--tg-theme-hint-color, #999)', marginTop: 2 }}>
            {subtitle}
          </div>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
