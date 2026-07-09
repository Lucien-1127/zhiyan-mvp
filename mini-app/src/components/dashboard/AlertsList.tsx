import type { AlertItem } from '../../types/alert';
import AlertCard from './AlertCard';

interface AlertsListProps {
  items: AlertItem[];
  onAlertClick: (alert: AlertItem) => void;
  onActionClick: (alert: AlertItem, action: string) => void;
}

export default function AlertsList({ items, onAlertClick, onActionClick }: AlertsListProps) {
  if (items.length === 0) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '32px 16px',
          color: 'var(--tg-theme-hint-color, #8e8e93)',
          fontSize: 14,
          gap: 8,
        }}
      >
        <span style={{ fontSize: 28 }}>✅</span>
        <span>目前無告警</span>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      {items.map((alert) => (
        <AlertCard
          key={alert.id}
          alert={alert}
          onClick={onAlertClick}
          onAction={onActionClick}
        />
      ))}
    </div>
  );
}
