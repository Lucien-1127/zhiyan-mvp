import type { KPIItem } from '../../types/metric';
import StatusBadge from '../common/StatusBadge';
import MetricDelta from '../common/MetricDelta';

interface StatCardProps {
  item: KPIItem;
  onClick?: (item: KPIItem) => void;
}

export default function StatCard({ item, onClick }: StatCardProps) {
  const handleClick = () => {
    if (onClick) onClick(item);
  };

  return (
    <div
      onClick={handleClick}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        padding: '14px 16px',
        borderRadius: 12,
        backgroundColor: 'var(--tg-theme-secondary-bg-color, #f0f0f0)',
        border: '1px solid var(--tg-theme-divider-color, rgba(0,0,0,0.08))',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'opacity 0.15s',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span
          style={{
            fontSize: 12,
            fontWeight: 500,
            color: 'var(--tg-theme-hint-color, #8e8e93)',
          }}
        >
          {item.label}
        </span>
        {item.status && <StatusBadge status={item.status} />}
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 8,
        }}
      >
        <span
          style={{
            fontSize: 24,
            fontWeight: 700,
            color: 'var(--tg-theme-text-color, #000)',
            lineHeight: 1,
          }}
        >
          {item.value}
        </span>
        {item.delta && <MetricDelta delta={item.delta} />}
      </div>
    </div>
  );
}
