import type { HealthStatus, SeverityLevel } from '@/types/common';

export function isHealthy(s: HealthStatus): boolean {
  return s === 'online';
}

export function isWarning(s: HealthStatus): boolean {
  return s === 'warning' || s === 'degraded';
}

export function isCritical(s: HealthStatus): boolean {
  return s === 'down' || s === 'failed' || s === 'offline';
}

export function severityWeight(level: SeverityLevel): number {
  const w: Record<SeverityLevel, number> = {
    critical: 4, warning: 3, info: 2, resolved: 1,
  };
  return w[level] ?? 0;
}
