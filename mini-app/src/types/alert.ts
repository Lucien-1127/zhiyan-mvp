import type { BaseEntity, ID, SeverityLevel } from './common';

export type AlertSourceType = 'vm' | 'proxy' | 'agent' | 'rule' | 'quota' | 'system';
export type AlertActionType = 'acknowledge' | 'ignore' | 'restart_proxy' | 'open_logs' | 'assign' | 'resolve';

export interface AlertItem extends BaseEntity {
  sourceType: AlertSourceType;
  sourceId: ID;
  sourceName: string;
  severity: SeverityLevel;
  title: string;
  summary: string;
  occurredAt: string;
  isRead: boolean;
  isResolved: boolean;
  requestId?: string;
  logUrl?: string;
  availableActions: AlertActionType[];
}

export interface AlertSummary {
  total: number;
  critical: number;
  warning: number;
  info: number;
  resolved: number;
}
