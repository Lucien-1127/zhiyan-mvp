import type { BaseEntity, ID } from './common';

export type AuditResult = 'success' | 'failed' | 'partial';

export interface EventActor {
  id: ID;
  name: string;
  avatarUrl?: string;
  ip?: string;
}

export interface EventTarget {
  id: ID;
  type: 'vm' | 'proxy' | 'agent' | 'rule' | 'quota' | 'setting';
  name: string;
}

export interface TimelineEvent extends BaseEntity {
  actor: EventActor;
  action: string;
  target: EventTarget;
  result: AuditResult;
  timestamp: string;
  detail?: string;
}
