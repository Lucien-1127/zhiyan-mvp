import { useState, useCallback, useRef, useEffect } from 'react';
import type { DashboardPayload } from '../../types/dashboard';
import { apiFetch } from '../useApi';

const API_BASE = '';

export function useDashboardData(): {
  data: DashboardPayload | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
} {
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetchData = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const res = await apiFetch(`${API_BASE}/api/dashboard`, {
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      // Backend returns DashboardPayload directly
      const payload = json as DashboardPayload;
      // Validate KPIs exist
      if (!payload?.overview?.kpis?.length) {
        throw new Error('API 回傳格式異常：缺少 kpis');
      }
      setData(payload);
      setLoading(false);
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      const message = err instanceof Error ? err.message : '無法載入 Dashboard 資料';
      setError(message);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    return () => abortRef.current?.abort();
  }, [fetchData]);

  return { data, loading, error, refresh: fetchData };
}
