import { useState, useMemo, useCallback } from 'react';
import type { DashboardTabKey, TrendRangeKey, TrendSeries } from '../../types/dashboard';
import type { KPIItem } from '../../types/metric';
import type { AlertItem } from '../../types/alert';
import type { TimelineEvent } from '../../types/event';
import { useDashboardData } from '../../hooks/dashboard/useDashboardData';
import { useTelegramMainButton, useTelegramPopup } from '../../hooks/telegram/index';
import DashboardHeader from '../../components/dashboard/DashboardHeader';
import { apiFetch } from '../../hooks/useApi';
import EnvironmentChip from '../../components/dashboard/EnvironmentChip';
import StatusOverviewGrid from '../../components/dashboard/StatusOverviewGrid';
import DashboardTabs from '../../components/dashboard/DashboardTabs';
import TrendPanel from '../../components/dashboard/TrendPanel';
import AlertsList from '../../components/dashboard/AlertsList';
import EventsTimeline from '../../components/dashboard/EventsTimeline';
import LoadingBlock from '../../components/common/LoadingBlock';
import ErrorBlock from '../../components/common/ErrorBlock';

interface DashboardPageProps {
  defaultTab: DashboardTabKey;
  onNavigate: (route: string) => void;
  onRestartProxy: () => void;
}

function generateMockTrends(range: TrendRangeKey): TrendSeries[] {
  const pointCount = range === '1h' ? 60 : range === '6h' ? 36 : range === '24h' ? 24 : 7;
  const now = Date.now();
  const intervalMs =
    range === '1h' ? 60000 :
    range === '6h' ? 600000 :
    range === '24h' ? 3600000 :
    86400000;

  const points = Array.from({ length: pointCount }, (_, i) => ({
    timestamp: new Date(now - (pointCount - 1 - i) * intervalMs).toISOString(),
    value: 200 + Math.round(Math.random() * 300),
  }));

  return [
    {
      key: 'requests' as const,
      label: '請求量',
      color: '#007aff',
      points,
      unit: 'rpm' as const,
    },
    {
      key: 'latency' as const,
      label: '延遲',
      color: '#ff9500',
      points: points.map((p) => ({
        ...p,
        value: 80 + Math.round(Math.random() * 120),
      })),
      unit: 'ms' as const,
    },
  ];
}

export default function DashboardPage({ defaultTab, onNavigate, onRestartProxy }: DashboardPageProps) {
  const [activeTab, setActiveTab] = useState<DashboardTabKey>(defaultTab);
  const [trendRange, setTrendRange] = useState<TrendRangeKey>('24h');
  const { data, loading, error, refresh } = useDashboardData();

  const mockTrends = useMemo(() => generateMockTrends(trendRange), [trendRange]);

  const { openPopup } = useTelegramPopup();

  // Extract KPI items from real data, or fallback to empty
  const kpiItems: KPIItem[] = useMemo(() => {
    if (!data?.overview?.kpis) return [];
    return data.overview.kpis;
  }, [data]);

  const alertItems: AlertItem[] = useMemo(() => {
    if (!data?.alerts) return [];
    return data.alerts;
  }, [data]);

  const eventItems: TimelineEvent[] = useMemo(() => {
    if (!data?.events) return [];
    return data.events;
  }, [data]);

  const alertCount = alertItems.filter((a) => !a.isResolved).length;
  const environment = data?.overview?.environment ?? 'prod';

  const handleKpiClick = useCallback((item: KPIItem) => {
    if (item.targetRoute) {
      onNavigate(item.targetRoute);
    }
  }, [onNavigate]);

  const handleAlertClick = useCallback(async (alert: AlertItem) => {
    await openPopup(alert.title, alert.summary, [
      { id: 'close', type: 'default', text: '關閉' },
    ]);
  }, [openPopup]);

  const handleAlertAction = useCallback(async (alert: AlertItem, action: string) => {
    const label: Record<string, string> = {
      acknowledge: '已確認此告警，系統將記錄您的操作',
      ignore: '已忽略此告警，將不再顯示於首頁',
      restart_proxy: '重啟 Proxy 指令已送出',
      open_logs: '正在開啟日誌…',
      assign: '指派功能開發中',
      resolve: '已標記為已解決',
    };

    // POST to backend
    try {
      if (['acknowledge', 'ignore', 'resolve'].includes(action)) {
        const endpoint = action === 'acknowledge' ? 'acknowledge' : action === 'resolve' ? 'resolve' : 'ignore';
        await apiFetch(`/api/alerts/${alert.id}/${endpoint}`, { method: 'POST' });
      }
    } catch {
      // silent — still show popup
    }

    await openPopup(
      action === 'acknowledge' ? '✅ 已確認' :
      action === 'ignore' ? '⏭️ 已忽略' : '操作',
      label[action] || `執行動作: ${action}`,
      [{ id: 'ok', type: 'default', text: '確定' }],
    );
  }, [openPopup]);

  const handleEventClick = useCallback(async (event: TimelineEvent) => {
    await openPopup(
      `${event.actor.name} — ${event.action}`,
      `目標: ${event.target.name} (${event.target.type})\n結果: ${event.result}\n${event.detail || ''}`,
      [{ id: 'close', type: 'default', text: '關閉' }],
    );
  }, [openPopup]);

  const handleRestartProxy = useCallback(async () => {
    await openPopup(
      '確認重啟 Proxy',
      '將中斷服務約 30 秒，確定繼續？',
      [
        { id: 'cancel', type: 'cancel', text: '取消' },
        { id: 'confirm', type: 'destructive', text: '重啟' },
      ],
    );
    try {
      await apiFetch('/api/proxy/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'restart' }),
      });
    } catch {
      // silent
    }
    onRestartProxy();
  }, [openPopup, onRestartProxy]);

  /* Telegram MainButton — 重啟 Proxy */
  useTelegramMainButton(
    { text: '重啟 Proxy', visible: true },
    handleRestartProxy,
  );

  // Loading state
  if (loading) {
    return (
      <div style={{ padding: '0 16px' }}>
        <LoadingBlock />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div style={{ padding: '0 16px' }}>
        <ErrorBlock message={`資料載入失敗: ${error}`} onRetry={refresh} />
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        padding: '0 16px 80px',
      }}
    >
      <DashboardHeader onRestartProxy={handleRestartProxy} onApiStatus={() => onNavigate('/api-status')} onKeyManager={() => onNavigate('/keys')} />

      <div style={{ marginBottom: 4 }}>
        <EnvironmentChip env={environment} />
      </div>

      <StatusOverviewGrid items={kpiItems} onKpiClick={handleKpiClick} />

      <DashboardTabs
        activeTab={activeTab}
        onChange={setActiveTab}
        alertCount={alertCount}
      />

      {activeTab === 'trends' && (
        <TrendPanel
          range={trendRange}
          series={data?.trends && data.trends.length > 0 ? data.trends : mockTrends}
          onRangeChange={setTrendRange}
        />
      )}

      {activeTab === 'alerts' && (
        <AlertsList
          items={alertItems}
          onAlertClick={handleAlertClick}
          onActionClick={handleAlertAction}
        />
      )}

      {activeTab === 'events' && (
        <EventsTimeline
          items={eventItems}
          onEventClick={handleEventClick}
        />
      )}
    </div>
  );
}
