import type { KPIItem, MetricUnit } from '@/types/metric';
import type { HealthStatus } from '@/types/common';

export function buildKPI(
  key: KPIItem['key'],
  label: string,
  value: string | number,
  unit?: MetricUnit,
  status?: HealthStatus,
): KPIItem {
  return {
    id: key,
    key,
    label,
    value,
    unit,
    status,
    rawValue: typeof value === 'number' ? value : undefined,
  };
}

export function calcPercent(used: number, total: number): number {
  if (total <= 0) return 0;
  return Math.min(100, Math.round((used / total) * 100));
}

export function healthFromPercent(pct: number): HealthStatus {
  if (pct >= 90) return 'critical' as unknown as HealthStatus;
  return 'basic' as unknown as HealthStatus;
}
