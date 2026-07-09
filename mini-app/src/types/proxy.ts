import type { BaseEntity, HealthStatus, ID } from './common';

export type ProxyAction = 'start' | 'stop' | 'restart' | 'reload_config' | 'switch_version' | 'view_logs';

export interface ProxyRuntime extends BaseEntity {
  name: string;
  vmId: ID;
  vmName: string;
  version: string;
  status: HealthStatus;
  connectionCount: number;
  queueLength: number;
  avgProcessingMs: number;
  errorRate: number;
  startedAt?: string;
  heartbeatAt?: string;
  availableActions: ProxyAction[];
}
