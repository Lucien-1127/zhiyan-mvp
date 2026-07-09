import type { AppEnvironment } from './common';
import type { AlertItem, AlertSummary } from './alert';
import type { TimelineEvent } from './event';
import type { KPIItem } from './metric';
import type { ProxyRuntime } from './proxy';

export type DashboardTabKey = 'trends' | 'alerts' | 'events';
export type TrendRangeKey = '1h' | '6h' | '24h' | '7d';

export interface TimeSeriesPoint {
  timestamp: string;
  value: number;
}

export interface TrendSeries {
  key: 'requests' | 'latency' | 'error_rate' | 'quota_usage';
  label: string;
  color: string;
  points: TimeSeriesPoint[];
  unit: 'rpm' | 'ms' | 'percent' | 'quota';
}

export interface DashboardOverview {
  environment: AppEnvironment;
  generatedAt: string;
  kpis: KPIItem[];
  alertSummary: AlertSummary;
  latestProxy?: ProxyRuntime;
}

export interface DashboardPayload {
  overview: DashboardOverview;
  trendRange: TrendRangeKey;
  trends: TrendSeries[];
  alerts: AlertItem[];
  events: TimelineEvent[];
}
