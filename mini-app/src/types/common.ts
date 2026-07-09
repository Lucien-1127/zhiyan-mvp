export type ID = string;
export type AppEnvironment = 'prod' | 'staging' | 'dev';
export type HealthStatus = 'online' | 'degraded' | 'offline' | 'warning' | 'down' | 'idle' | 'busy' | 'failed';
export type SeverityLevel = 'critical' | 'warning' | 'info' | 'resolved';
export type AsyncState = 'idle' | 'loading' | 'success' | 'error';

export interface BaseEntity {
  id: ID;
  createdAt: string;
  updatedAt: string;
}
