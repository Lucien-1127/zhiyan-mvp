import type { DashboardPayload } from './dashboard';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  requestId?: string;
}

export interface ApiError {
  code: string;
  message: string;
  requestId?: string;
  details?: unknown;
}

export type DashboardResponse = ApiResponse<DashboardPayload>;
