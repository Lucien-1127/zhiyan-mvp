import { useEffect, useState } from 'react';
import { useTelegramBackButton } from '../../hooks/telegram/index';
import { apiFetch } from '../../hooks/useApi';

/* ───────── Types ───────── */

interface ModelStatus {
  name: string;
  latencyMs: number;
  status: 'online' | 'degraded';
}

interface SystemStatus {
  uptime: string;
  totalRequests: number;
  activeConnections: number;
}

interface TokenStats {
  date: string;
  input: number;
  output: number;
  total: number;
}

/* ───────── Mock Data ───────── */

const MOCK_MODELS: ModelStatus[] = [
  { name: 'Gemini 2.5 Pro', latencyMs: 128, status: 'online' },
  { name: 'Claude 4 Sonnet', latencyMs: 156, status: 'online' },
  { name: 'GPT-4.1', latencyMs: 198, status: 'online' },
  { name: 'DeepSeek V4', latencyMs: 142, status: 'online' },
  { name: 'Kimi K2', latencyMs: 168, status: 'degraded' },
];

const MOCK_SYSTEM: SystemStatus = {
  uptime: '14d 6h 32m',
  totalRequests: 127458,
  activeConnections: 8,
};

const MOCK_TOKEN_HISTORY: TokenStats[] = [
  { date: '07/08', input: 128000, output: 64000, total: 192000 },
  { date: '07/07', input: 142000, output: 71000, total: 213000 },
  { date: '07/06', input: 98000, output: 49000, total: 147000 },
  { date: '07/05', input: 156000, output: 78000, total: 234000 },
  { date: '07/04', input: 112000, output: 56000, total: 168000 },
];

const MAX_LATENCY = 250;

/* ───────── Styles ───────── */

const styles = {
  page: {
    display: 'flex' as const,
    flexDirection: 'column' as const,
    minHeight: '100vh',
    background: 'var(--tg-theme-bg-color, #1a1a2e)',
    color: 'var(--tg-theme-text-color, #e2e8f0)',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  },
  header: {
    display: 'flex' as const,
    alignItems: 'center' as const,
    padding: '12px 16px',
    borderBottom: '1px solid rgba(148, 163, 184, 0.12)',
    background: 'var(--tg-theme-secondary-bg-color, #1e293b)',
  },
  headerTitle: {
    fontSize: '17px',
    fontWeight: 600,
    color: 'var(--tg-theme-text-color, #e2e8f0)',
  },
  content: {
    padding: '16px',
    display: 'flex' as const,
    flexDirection: 'column' as const,
    gap: '20px',
    flex: 1,
  },
  sectionTitle: {
    fontSize: '15px',
    fontWeight: 600,
    color: 'var(--tg-theme-text-color, #e2e8f0)',
    marginBottom: '12px',
  },
  statsGrid: {
    display: 'grid' as const,
    gridTemplateColumns: '1fr 1fr',
    gap: '10px',
  },
  statCard: {
    background: 'var(--tg-theme-secondary-bg-color, #1e293b)',
    borderRadius: '12px',
    padding: '14px',
    border: '1px solid rgba(148, 163, 184, 0.08)',
  },
  statValue: {
    fontSize: '22px',
    fontWeight: 700,
    color: 'var(--tg-theme-text-color, #e2e8f0)',
    lineHeight: 1.2,
    marginBottom: '4px',
  },
  statLabel: {
    fontSize: '11px',
    color: 'var(--tg-theme-hint-color, #94a3b8)',
    fontWeight: 500,
  },
  modelList: {
    display: 'flex' as const,
    flexDirection: 'column' as const,
    gap: '10px',
  },
  modelRow: {
    display: 'flex' as const,
    alignItems: 'center' as const,
    gap: '10px',
  },
  modelName: {
    width: '110px',
    flexShrink: 0,
    fontSize: '13px',
    fontWeight: 500,
    color: 'var(--tg-theme-text-color, #e2e8f0)',
  },
  modelBarTrack: {
    flex: 1,
    height: '8px',
    borderRadius: '4px',
    background: 'rgba(148, 163, 184, 0.15)',
    overflow: 'hidden' as const,
  },
  modelBarFill: {
    height: '100%',
    borderRadius: '4px',
    transition: 'width 0.6s ease',
  },
  modelLatency: {
    width: '50px',
    flexShrink: 0,
    textAlign: 'right' as const,
    fontSize: '12px',
    color: 'var(--tg-theme-hint-color, #94a3b8)',
    fontWeight: 500,
  },
  tokenTable: {
    display: 'flex' as const,
    flexDirection: 'column' as const,
    gap: '6px',
  },
  tokenRow: {
    display: 'flex' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    padding: '8px 12px',
    background: 'var(--tg-theme-secondary-bg-color, #1e293b)',
    borderRadius: '8px',
    fontSize: '12px',
  },
  tokenDate: {
    color: 'var(--tg-theme-text-color, #e2e8f0)',
    fontWeight: 500,
    width: '50px',
  },
  tokenBarWrap: {
    flex: 1,
    height: '6px',
    borderRadius: '3px',
    background: 'rgba(148, 163, 184, 0.12)',
    margin: '0 10px',
    overflow: 'hidden' as const,
  },
  tokenBarFill: {
    height: '100%',
    borderRadius: '3px',
    background: 'var(--tg-theme-button-color, #40a7e3)',
  },
  tokenValue: {
    color: 'var(--tg-theme-hint-color, #94a3b8)',
    width: '60px',
    textAlign: 'right' as const,
  },
};

/* ───────── Helpers ───────── */

function latencyColor(ms: number): string {
  if (ms < 140) return '#22c55e';
  if (ms < 180) return '#f59e0b';
  return '#ef4444';
}

function formatNumber(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toString();
}

/* ───────── Component ───────── */

export default function AnalysisPage({ onBack }: { onBack: () => void }) {
  const [models] = useState<ModelStatus[]>(MOCK_MODELS);
  const [system] = useState<SystemStatus>(MOCK_SYSTEM);
  const [tokenHistory] = useState<TokenStats[]>(MOCK_TOKEN_HISTORY);
  const [loading, setLoading] = useState(true);

  useTelegramBackButton(true, onBack);

  useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.all([
          apiFetch('/api/models').catch(() => {}),
          apiFetch('/api/status').catch(() => {}),
        ]);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const maxToken = Math.max(...tokenHistory.map((t) => t.total), 1);

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <span style={styles.headerTitle}>分析儀表板</span>
      </div>

      <div style={styles.content}>
        {loading && (
          <div
            style={{
              textAlign: 'center',
              color: 'var(--tg-theme-hint-color, #94a3b8)',
              fontSize: '13px',
              padding: '8px',
            }}
          >
            正在載入資料⋯
          </div>
        )}

        {/* System Stats */}
        <div>
          <div style={styles.sectionTitle}>系統概覽</div>
          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <div style={styles.statValue}>{formatNumber(system.totalRequests)}</div>
              <div style={styles.statLabel}>總請求數</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statValue}>{system.activeConnections}</div>
              <div style={styles.statLabel}>當前連線</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statValue}>{system.uptime}</div>
              <div style={styles.statLabel}>運行時間</div>
            </div>
            <div style={styles.statCard}>
              <div style={{ ...styles.statValue, color: '#22c55e' }}>98%</div>
              <div style={styles.statLabel}>可用率</div>
            </div>
          </div>
        </div>

        {/* Model Performance */}
        <div>
          <div style={styles.sectionTitle}>模型效能</div>
          <div style={styles.modelList}>
            {models.map((model) => {
              const pct = Math.min((model.latencyMs / MAX_LATENCY) * 100, 100);
              return (
                <div key={model.name} style={styles.modelRow}>
                  <span style={styles.modelName}>{model.name}</span>
                  <div style={styles.modelBarTrack}>
                    <div
                      style={{
                        ...styles.modelBarFill,
                        width: `${pct}%`,
                        background: latencyColor(model.latencyMs),
                      }}
                    />
                  </div>
                  <span style={styles.modelLatency}>{model.latencyMs}ms</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Token Usage History */}
        <div>
          <div style={styles.sectionTitle}>Token 用量趨勢</div>
          <div style={styles.tokenTable}>
            {tokenHistory.map((day) => (
              <div key={day.date} style={styles.tokenRow}>
                <span style={styles.tokenDate}>{day.date}</span>
                <div style={styles.tokenBarWrap}>
                  <div
                    style={{
                      ...styles.tokenBarFill,
                      width: `${(day.total / maxToken) * 100}%`,
                    }}
                  />
                </div>
                <span style={styles.tokenValue}>{formatNumber(day.total)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
