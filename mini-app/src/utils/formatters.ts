import type { KPIItem, MetricDelta } from '@/types/metric';
import type { HealthStatus } from '@/types/common';

export function formatKPIValue(item: KPIItem): string {
  if (typeof item.value === 'string') return item.value;
  switch (item.unit) {
    case 'percent': return `${item.value.toFixed(1)}%`;
    case 'ms':      return `${item.value.toFixed(0)}ms`;
    case 'rpm':     return item.value >= 1000
      ? `${(item.value / 1000).toFixed(1)}k` : `${item.value.toFixed(0)}`;
    case 'count':   return item.value >= 1000
      ? `${(item.value / 1000).toFixed(1)}k` : `${item.value.toFixed(0)}`;
    case 'quota':   return `${item.value.toFixed(1)}%`;
    case 'gb':      return `${item.value.toFixed(1)}GB`;
    case 'bytes':   return item.value >= 1_000_000_000
      ? `${(item.value / 1_000_000_000).toFixed(1)}GB`
      : `${(item.value / 1_000_000).toFixed(1)}MB`;
    default:        return `${item.value}`;
  }
}

export function formatDelta(delta?: MetricDelta): string {
  if (!delta) return '';
  const arrow = delta.direction === 'up' ? '↑' : delta.direction === 'down' ? '↓' : '→';
  const pct = delta.percentage != null ? ` (${delta.percentage > 0 ? '+' : ''}${delta.percentage.toFixed(1)}%)` : '';
  return `${arrow} ${delta.value}${pct}`;
}

export function statusLabel(status: HealthStatus): string {
  const map: Record<HealthStatus, string> = {
    online: '正常', degraded: '降級', offline: '離線', warning: '警告',
    down: '故障', idle: '閒置', busy: '忙碌', failed: '失敗',
  };
  return map[status] ?? status;
}
