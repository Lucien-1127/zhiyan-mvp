import type { HealthStatus } from '../../types/common';

const STATUS_COLORS: Record<HealthStatus, string> = {
  online: '#34c759',
  degraded: '#ffcc02',
  warning: '#ffcc02',
  down: '#ff3b30',
  failed: '#ff3b30',
  offline: '#ff3b30',
  idle: '#8e8e93',
  busy: '#8e8e93',
};

interface StatusBadgeProps {
  status: HealthStatus;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      style={{
        display: 'inline-block',
        width: 10,
        height: 10,
        borderRadius: '50%',
        backgroundColor: STATUS_COLORS[status] ?? '#8e8e93',
        flexShrink: 0,
      }}
      aria-label={`Status: ${status}`}
    />
  );
}
