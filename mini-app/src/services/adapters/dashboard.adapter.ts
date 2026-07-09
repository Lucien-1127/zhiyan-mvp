import type { KPIItem, MetricUnit } from '../../types/metric';
import type { HealthStatus } from '../../types/common';
import type { DashboardPayload } from '../../types/dashboard';
import type { AlertItem } from '../../types/alert';

interface BackendDashboardRaw {
  overview: {
    environment: string;
    generatedAt: string;
    kpis: KPIItem[];
    alertSummary: { total: number; critical: number; warning: number; info: number; resolved: number };
  };
  trendRange: string;
  trends: DashboardPayload['trends'];
  alerts: AlertItem[];
  events: DashboardPayload['events'];
}

export function dashboardAdapter(raw: BackendDashboardRaw): DashboardPayload {
  return {
    overview: {
      environment: raw.overview.environment as 'prod' | 'staging' | 'dev',
      generatedAt: raw.overview.generatedAt,
      kpis: raw.overview.kpis.map((k) => ({
        ...k,
        key: k.key as KPIItem['key'],
        status: k.status as HealthStatus,
        unit: k.unit as MetricUnit | undefined,
        rawValue: typeof k.value === 'number' ? k.value : undefined,
      })),
      alertSummary: raw.overview.alertSummary,
    },
    trendRange: raw.trendRange as '1h' | '6h' | '24h' | '7d',
    trends: raw.trends,
    alerts: raw.alerts,
    events: raw.events,
  };
}

export function alertAdapter(raw: Record<string, unknown>) {
  return raw;
}

export function chartAdapter(raw: Record<string, unknown>) {
  return raw;
}
