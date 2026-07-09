import type { HealthStatus, ID } from './common';

export type MetricUnit = 'count' | 'percent' | 'ms' | 'rpm' | 'bytes' | 'gb' | 'quota';

export interface MetricDelta {
  value: number;
  direction: 'up' | 'down' | 'flat';
  percentage?: number;
  comparedTo?: string;
}

export interface KPIItem {
  id: ID;
  key: 'vm_status' | 'proxy_status' | 'active_agents' | 'requests_per_minute'
       | 'avg_latency' | 'error_rate' | 'quota_usage' | 'alerts_count';
  label: string;
  value: string | number;
  rawValue?: number;
  unit?: MetricUnit;
  status?: HealthStatus;
  delta?: MetricDelta;
  description?: string;
  clickable?: boolean;
  targetRoute?: string;
}
