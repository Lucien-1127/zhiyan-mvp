import { client } from './client';
import type { ApiResponse } from '../../types/api';
import type { DashboardPayload, TrendRangeKey } from '../../types/dashboard';
import type { ProxyRuntime, ProxyAction } from '../../types/proxy';
import type { AlertItem } from '../../types/alert';

export const dashboardApi = {
  status: (signal?: AbortSignal) =>
    client.get<ApiResponse<DashboardPayload>>('/api/dashboard', signal),

  trend: (range: TrendRangeKey, signal?: AbortSignal) =>
    client.get<ApiResponse<DashboardPayload>>(`/api/trend?range=${range}`, signal),
};

export const alertsApi = {
  list: (signal?: AbortSignal) =>
    client.get<AlertItem[]>('/api/alerts', signal),

  acknowledge: (id: string) =>
    client.post<{ success: boolean }>(`/api/alerts/${id}/acknowledge`),

  resolve: (id: string) =>
    client.post<{ success: boolean }>(`/api/alerts/${id}/resolve`),
};

export const proxyApi = {
  status: (signal?: AbortSignal) =>
    client.get<ProxyRuntime>('/api/proxy/status', signal),

  action: (action: ProxyAction) =>
    client.post<{ success: boolean }>('/api/proxy/action', { action }),
};

export function apiResponse<T>(data: T): ApiResponse<T> {
  return { success: true, data };
}
