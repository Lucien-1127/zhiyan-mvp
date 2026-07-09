import type { DashboardTabKey, TrendRangeKey } from '../../types/dashboard';

export type AppRoute = '/dashboard' | '/alerts' | '/events' | '/proxy' | '/settings' | '/keys' | '/api-status' | '/dream' | '/chat' | '/documents' | '/analysis' | '/profile' | '/prompts' | '/logs' | '/knowledge';

export const ROUTES: Record<string, AppRoute> = {
  DASHBOARD: '/dashboard',
  ALERTS: '/alerts',
  EVENTS: '/events',
  PROXY: '/proxy',
  SETTINGS: '/settings',
  KEYS: '/keys',
  API_STATUS: '/api-status',
  DREAM: '/dream',
  CHAT: '/chat',
  DOCUMENTS: '/documents',
  ANALYSIS: '/analysis',
  PROFILE: '/profile',
  PROMPTS: '/prompts',
  LOGS: '/logs',
  KNOWLEDGE: '/knowledge',
} as const;

export const DEFAULT_DASHBOARD_TAB: DashboardTabKey = 'trends';
export const DEFAULT_TREND_RANGE: TrendRangeKey = '24h';
