import type { BaseEntity, HealthStatus } from './common';

export interface VmResourceUsage {
  cpuPercent: number;
  ramPercent: number;
  diskPercent: number;
  networkInMbps: number;
  networkOutMbps: number;
}

export interface VmInstance extends BaseEntity {
  name: string;
  projectId: string;
  zone: string;
  externalIp?: string;
  internalIp: string;
  status: HealthStatus;
  heartbeatAt?: string;
  usage: VmResourceUsage;
}
