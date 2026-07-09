import type { AlertItem } from '../../types/alert';
import type { SeverityLevel } from '../../types/common';

interface AlertCardProps {
  alert: AlertItem;
  onClick: (alert: AlertItem) => void;
  onAction: (alert: AlertItem, action: string) => void;
}

const SEVERITY_COLORS: Record<SeverityLevel, string> = {
  critical: '#ff3b30',
  warning: '#ffcc02',
  info: '#007aff',
  resolved: '#34c759',
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return '剛剛';
  if (mins < 60) return `${mins} 分鐘前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} 小時前`;
  const days = Math.floor(hours / 24);
  return `${days} 天前`;
}

export default function AlertCard({ alert, onClick, onAction }: AlertCardProps) {
  const severityColor = SEVERITY_COLORS[alert.severity];

  return (
    <div
      onClick={() => onClick(alert)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        padding: '12px 14px',
        borderRadius: 10,
        backgroundColor: 'var(--tg-theme-secondary-bg-color, #f0f0f0)',
        border: '1px solid var(--tg-theme-divider-color, rgba(0,0,0,0.06))',
        cursor: 'pointer',
        transition: 'opacity 0.15s',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            backgroundColor: severityColor,
            flexShrink: 0,
          }}
        />
        <span
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--tg-theme-text-color, #000)',
            flex: 1,
          }}
        >
          {alert.title}
        </span>
        <span
          style={{
            fontSize: 11,
            color: 'var(--tg-theme-hint-color, #8e8e93)',
            whiteSpace: 'nowrap',
          }}
        >
          {timeAgo(alert.occurredAt)}
        </span>
      </div>
      <div
        style={{
          fontSize: 12,
          color: 'var(--tg-theme-hint-color, #8e8e93)',
          lineHeight: 1.4,
        }}
      >
        {alert.sourceName} — {alert.summary}
      </div>
      {alert.availableActions.length > 0 && (
        <div
          style={{
            display: 'flex',
            gap: 6,
            flexWrap: 'wrap',
            marginTop: 4,
          }}
        >
          {alert.availableActions.map((action) => (
            <button
              key={action}
              onClick={(e) => {
                e.stopPropagation();
                onAction(alert, action);
              }}
              style={{
                padding: '3px 10px',
                borderRadius: 6,
                border: '1px solid var(--tg-theme-divider-color, rgba(0,0,0,0.12))',
                background: 'transparent',
                color: 'var(--tg-theme-text-color, #000)',
                fontSize: 11,
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              {action === 'acknowledge' ? '確認' :
               action === 'ignore' ? '忽略' :
               action === 'restart_proxy' ? '重啟' :
               action === 'open_logs' ? '日誌' :
               action === 'assign' ? '指派' :
               action === 'resolve' ? '解決' : action}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
