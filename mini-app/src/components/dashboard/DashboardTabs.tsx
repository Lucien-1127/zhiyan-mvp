import type { DashboardTabKey } from '../../types/dashboard';

interface DashboardTabsProps {
  activeTab: DashboardTabKey;
  onChange: (tab: DashboardTabKey) => void;
  alertCount?: number;
}

const TABS: { key: DashboardTabKey; label: string }[] = [
  { key: 'trends', label: '趨勢' },
  { key: 'alerts', label: '告警' },
  { key: 'events', label: '事件' },
];

export default function DashboardTabs({ activeTab, onChange, alertCount }: DashboardTabsProps) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 2,
        padding: 3,
        borderRadius: 10,
        backgroundColor: 'var(--tg-theme-secondary-bg-color, #e8e8e8)',
        margin: '12px 0',
      }}
    >
      {TABS.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              padding: '8px 12px',
              border: 'none',
              borderRadius: 8,
              background: isActive
                ? 'var(--tg-theme-bg-color, #fff)'
                : 'transparent',
              color: isActive
                ? 'var(--tg-theme-text-color, #000)'
                : 'var(--tg-theme-hint-color, #8e8e93)',
              fontSize: 13,
              fontWeight: isActive ? 600 : 400,
              cursor: 'pointer',
              transition: 'all 0.15s',
              boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
            }}
          >
            {tab.label}
            {tab.key === 'alerts' && alertCount !== undefined && alertCount > 0 && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: 16,
                  height: 16,
                  borderRadius: 8,
                  padding: '0 4px',
                  fontSize: 10,
                  fontWeight: 700,
                  color: '#fff',
                  backgroundColor: '#ff3b30',
                  lineHeight: 1,
                }}
              >
                {alertCount > 99 ? '99+' : alertCount}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
