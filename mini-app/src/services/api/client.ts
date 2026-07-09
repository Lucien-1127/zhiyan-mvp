import type { ApiResponse, ApiError } from '../../types/api';

const API_BASE: string = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_BASE) || '';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

interface RequestOptions {
  method?: HttpMethod;
  body?: unknown;
  signal?: AbortSignal;
  timeout?: number;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    path: string,
    options: RequestOptions = {},
  ): Promise<ApiResponse<T>> {
    const { method = 'GET', body, signal, timeout = 15000 } = options;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const mergedSignal = signal
      ? combineSignals(signal, controller.signal)
      : controller.signal;

    try {
      const res = await fetch(`${this.baseUrl}${path}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: mergedSignal,
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new ApiClientError(
          (errBody as ApiError).message || `HTTP ${res.status}`,
          (errBody as ApiError).code || `HTTP_${res.status}`,
        );
      }

      const json = await res.json();
      return { success: true, data: json as T };
    } catch (err) {
      if (err instanceof ApiClientError) throw err;
      if ((err as Error).name === 'AbortError') {
        throw new ApiClientError('請求超時', 'TIMEOUT');
      }
      throw new ApiClientError(
        (err as Error).message || '網路錯誤',
        'NETWORK_ERROR',
      );
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async get<T>(path: string, signal?: AbortSignal) {
    return this.request<T>(path, { method: 'GET', signal });
  }

  async post<T>(path: string, body?: unknown, signal?: AbortSignal) {
    return this.request<T>(path, { method: 'POST', body, signal });
  }

  async put<T>(path: string, body?: unknown, signal?: AbortSignal) {
    return this.request<T>(path, { method: 'PUT', body, signal });
  }

  async delete<T>(path: string, signal?: AbortSignal) {
    return this.request<T>(path, { method: 'DELETE', signal });
  }
}

export class ApiClientError extends Error {
  code: string;

  constructor(message: string, code: string) {
    super(message);
    this.name = 'ApiClientError';
    this.code = code;
  }
}

function combineSignals(...signals: AbortSignal[]): AbortSignal {
  const controller = new AbortController();
  for (const sig of signals) {
    if (sig.aborted) {
      controller.abort(sig.reason);
      return controller.signal;
    }
    sig.addEventListener('abort', () => controller.abort(sig.reason), { once: true });
  }
  return controller.signal;
}

export const client = new ApiClient(API_BASE);
