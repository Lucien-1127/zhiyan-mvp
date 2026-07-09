import { useState, useEffect, useCallback } from 'react';
import { PageContainer } from '../../components/layout/PageContainer';
import LoadingBlock from '../../components/common/LoadingBlock';
import ErrorBlock from '../../components/common/ErrorBlock';
import { useTelegramBackButton } from '../../hooks/telegram/index';
import { apiFetch } from '../../hooks/useApi';

/* ───────── Types ───────── */

interface ServiceItem {
  n: string;
  s: string;
}

interface GroqKeyItem {
  k: string;
  l: number;
  u: number;
  t: string;
}

interface DailyUsageItem {
  d: string;
  t: number;
}

interface OpenRouterQuota {
  total: number;
  used: number;
  remaining: number;
}

interface KeysSummary {
  total: number;
  [platform: string]: number;
}

interface StatusResponse {
  openrouter: OpenRouterQuota;
  services: ServiceItem[];
  groq: GroqKeyItem[];
  daily: DailyUsageItem[];
  keys_summary: KeysSummary;
  updated: string;
}

interface PlatformItem {
  p: string;
  n: number;
  e: number;
}

interface ModelErrorItem {
  m: string;
  e: string;
}

interface ModelRecentItem {
  m: string;
  t: string;
}

interface ModelsResponse {
  platforms: PlatformItem[];
  errors: ModelErrorItem[];
  recent: ModelRecentItem[];
}

/* ───────── Props ───────── */

interface ApiStatusPageProps {
  onBack: () => void;
}

/* ───────── Helpers ───────── */

function progressColor(used: number, total: number): string {
  if (total === 0) return 'var(--tg-theme-hint-color, #999)';
  const ratio = used / total;
  if (ratio < 0.5) return '#34c759';
  if (ratio < 0.8) return '#ff9500';
  return '#ff3b30';
}

function formatNumber(n: number): string {
  return n.toLocaleString('zh-TW');
}

/* ───────── Inline styles ───────── */

const headerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  padding: '12px 16px',
  borderBottom: '1px solid var(--tg-theme-hint-color, #ccc)',
  background: 'var(--tg-theme-bg-color, #fff)',
};

const backButtonStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  fontSize: 20,
  cursor: 'pointer',
  padding: '4px 8px',
  marginRight: 12,
  color: 'var(--tg-theme-button-color, #40a7e3)',
};

const sectionCardStyle: React.CSSProperties = {
  background: 'var(--tg-theme-secondary-bg-color, #efeff4)',
  borderRadius: 12,
  padding: 14,
  marginBottom: 12,
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: 15,
  fontWeight: 700,
  color: 'var(--tg-theme-text-color, #000)',
  margin: '0 0 10px 0',
};

const emptyTextStyle: React.CSSProperties = {
  fontSize: 13,
  color: 'var(--tg-theme-hint-color, #999)',
  textAlign: 'center',
  padding: '12px 0',
};

const refreshButtonStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  fontSize: 13,
  color: 'var(--tg-theme-button-color, #40a7e3)',
  cursor: 'pointer',
  padding: '4px 0',
  marginBottom: 12,
  textAlign: 'right',
  display: 'block',
  width: '100%',
};

const updatedStyle: React.CSSProperties = {
  fontSize: 12,
  color: 'var(--tg-theme-hint-color, #999)',
  textAlign: 'center',
  marginTop: 8,
  padding: '8px 0 24px',
};

/* ───────── Component ───────── */

export default function ApiStatusPage({ onBack }: ApiStatusPageProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [models, setModels] = useState<ModelsResponse | null>(null);

  useTelegramBackButton(true, onBack);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [statusRes, modelsRes] = await Promise.all([
        apiFetch('/api/status'),
        apiFetch('/api/models'),
      ]);

      if (!statusRes.ok) throw new Error(`Status API ${statusRes.status}`);
      if (!modelsRes.ok) throw new Error(`Models API ${modelsRes.status}`);

      const statusData: StatusResponse = await statusRes.json();
      const modelsData: ModelsResponse = await modelsRes.json();

      setStatus(statusData);
      setModels(modelsData);
    } catch (e) {
      setError(e instanceof Error ? e.message : '未知錯誤');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* ── Loading state ── */
  if (loading && !status) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={headerStyle}>
          <button onClick={onBack} style={backButtonStyle} aria-label="返回">←</button>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>API 服務狀態</h1>
        </div>
        <PageContainer>
          <LoadingBlock message="載入服務狀態…" />
        </PageContainer>
      </div>
    );
  }

  /* ── Error state ── */
  if (error && !status) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={headerStyle}>
          <button onClick={onBack} style={backButtonStyle} aria-label="返回">←</button>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>API 服務狀態</h1>
        </div>
        <PageContainer>
          <ErrorBlock message={error} onRetry={fetchData} />
        </PageContainer>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={headerStyle}>
        <button onClick={onBack} style={backButtonStyle} aria-label="返回">←</button>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>API 服務狀態</h1>
      </div>

      <PageContainer>
        {/* Refresh button */}
        <button onClick={fetchData} style={refreshButtonStyle} disabled={loading}>
          {loading ? '重新整理中…' : '↻ 重新整理'}
        </button>

        {/* 1. Service Health */}
        <div style={sectionCardStyle}>
          <h2 style={sectionTitleStyle}>服務健康狀態</h2>
          {status && status.services && status.services.length > 0 ? (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 8,
              }}
            >
              {status.services.map((svc, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '6px 8px',
                    borderRadius: 8,
                    background: 'var(--tg-theme-bg-color, #fff)',
                    fontSize: 13,
                    color: 'var(--tg-theme-text-color, #000)',
                  }}
                >
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      flexShrink: 0,
                      backgroundColor: svc.s === 'ok' ? '#34c759' : '#ff3b30',
                    }}
                  />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {svc.n}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div style={emptyTextStyle}>暫無服務資料</div>
          )}
        </div>

        {/* 2. OpenRouter Quota */}
        <div style={sectionCardStyle}>
          <h2 style={sectionTitleStyle}>OpenRouter 配額</h2>
          {status && status.openrouter ? (
            status.openrouter.total === 0 ? (
              <div style={emptyTextStyle}>未配置</div>
            ) : (
              <div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: 13,
                    color: 'var(--tg-theme-text-color, #000)',
                    marginBottom: 6,
                  }}
                >
                  <span>使用量：{formatNumber(status.openrouter.used)} / {formatNumber(status.openrouter.total)}</span>
                  <span>剩餘：{formatNumber(status.openrouter.remaining)}</span>
                </div>
                <div
                  style={{
                    width: '100%',
                    height: 20,
                    borderRadius: 10,
                    background: 'var(--tg-theme-bg-color, #fff)',
                    overflow: 'hidden',
                    position: 'relative',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${Math.min((status.openrouter.used / status.openrouter.total) * 100, 100)}%`,
                      borderRadius: 10,
                      backgroundColor: progressColor(status.openrouter.used, status.openrouter.total),
                      transition: 'width 0.3s ease',
                      minWidth: 4,
                    }}
                  />
                </div>
                <div
                  style={{
                    textAlign: 'right',
                    fontSize: 12,
                    color: progressColor(status.openrouter.used, status.openrouter.total),
                    fontWeight: 600,
                    marginTop: 4,
                  }}
                >
                  {((status.openrouter.used / status.openrouter.total) * 100).toFixed(1)}%
                </div>
              </div>
            )
          ) : (
            <div style={emptyTextStyle}>載入中…</div>
          )}
        </div>

        {/* 3. Groq Keys Quota */}
        <div style={sectionCardStyle}>
          <h2 style={sectionTitleStyle}>Groq 金鑰配額</h2>
          {status && status.groq && status.groq.length > 0 ? (
            <div>
              {/* Header */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr 60px',
                  gap: 4,
                  padding: '6px 8px',
                  fontSize: 11,
                  fontWeight: 600,
                  color: 'var(--tg-theme-hint-color, #999)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.3px',
                  borderBottom: '1px solid var(--tg-theme-hint-color, #ccc)',
                  marginBottom: 4,
                }}
              >
                <span>金鑰 ID</span>
                <span>額度</span>
                <span>已用</span>
                <span>類型</span>
              </div>
              {status.groq.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1fr 60px',
                    gap: 4,
                    padding: '8px',
                    fontSize: 13,
                    color: 'var(--tg-theme-text-color, #000)',
                    borderBottom: idx < status.groq.length - 1
                      ? '1px solid var(--tg-theme-hint-color, #ccc)'
                      : 'none',
                  }}
                >
                  <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{item.k}</span>
                  <span>{formatNumber(item.l)}</span>
                  <span>{formatNumber(item.u)}</span>
                  <span style={{ fontSize: 11, color: 'var(--tg-theme-hint-color, #999)' }}>{item.t}</span>
                </div>
              ))}
            </div>
          ) : (
            <div style={emptyTextStyle}>無 Groq 配額資料</div>
          )}
        </div>

        {/* 4. Model Platforms */}
        <div style={sectionCardStyle}>
          <h2 style={sectionTitleStyle}>模型平台</h2>
          {models && models.platforms && models.platforms.length > 0 ? (
            <div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 60px 60px',
                  gap: 4,
                  padding: '6px 8px',
                  fontSize: 11,
                  fontWeight: 600,
                  color: 'var(--tg-theme-hint-color, #999)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.3px',
                  borderBottom: '1px solid var(--tg-theme-hint-color, #ccc)',
                  marginBottom: 4,
                }}
              >
                <span>平台</span>
                <span style={{ textAlign: 'right' }}>總數</span>
                <span style={{ textAlign: 'right' }}>啟用</span>
              </div>
              {models.platforms.map((plat, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 60px 60px',
                    gap: 4,
                    padding: '8px',
                    fontSize: 13,
                    color: 'var(--tg-theme-text-color, #000)',
                    borderBottom: idx < models.platforms.length - 1
                      ? '1px solid var(--tg-theme-hint-color, #ccc)'
                      : 'none',
                  }}
                >
                  <span style={{ fontWeight: 500 }}>{plat.p}</span>
                  <span style={{ textAlign: 'right' }}>{plat.n}</span>
                  <span
                    style={{
                      textAlign: 'right',
                      color: plat.e > 0 ? '#34c759' : 'var(--tg-theme-hint-color, #999)',
                      fontWeight: plat.e > 0 ? 600 : 400,
                    }}
                  >
                    {plat.e}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div style={emptyTextStyle}>暫無模型資料</div>
          )}
        </div>

        {/* 5. Daily Usage */}
        <div style={sectionCardStyle}>
          <h2 style={sectionTitleStyle}>每日使用量</h2>
          {status && status.daily && status.daily.length > 0 ? (
            <div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 80px',
                  gap: 4,
                  padding: '6px 8px',
                  fontSize: 11,
                  fontWeight: 600,
                  color: 'var(--tg-theme-hint-color, #999)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.3px',
                  borderBottom: '1px solid var(--tg-theme-hint-color, #ccc)',
                  marginBottom: 4,
                }}
              >
                <span>日期</span>
                <span style={{ textAlign: 'right' }}>Token 數</span>
              </div>
              {status.daily
                .slice()
                .sort((a, b) => b.d.localeCompare(a.d))
                .slice(0, 14)
                .map((day, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 80px',
                      gap: 4,
                      padding: '8px',
                      fontSize: 13,
                      color: 'var(--tg-theme-text-color, #000)',
                      borderBottom: idx < Math.min(status.daily.length, 14) - 1
                        ? '1px solid var(--tg-theme-hint-color, #ccc)'
                        : 'none',
                    }}
                  >
                    <span style={{ fontSize: 12 }}>{day.d}</span>
                    <span style={{ textAlign: 'right', fontFamily: 'monospace', fontSize: 12 }}>
                      {formatNumber(day.t)}
                    </span>
                  </div>
                ))}
            </div>
          ) : (
            <div style={emptyTextStyle}>暫無使用記錄</div>
          )}
        </div>

        {/* 6. Keys Summary */}
        {status && status.keys_summary && (
          <div style={sectionCardStyle}>
            <h2 style={sectionTitleStyle}>金鑰總覽</h2>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
              }}
            >
              {Object.entries(status.keys_summary)
                .filter(([key]) => key !== 'total')
                .map(([platform, count]) => (
                  <div
                    key={platform}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '6px 8px',
                      fontSize: 13,
                      color: 'var(--tg-theme-text-color, #000)',
                      background: 'var(--tg-theme-bg-color, #fff)',
                      borderRadius: 8,
                    }}
                  >
                    <span style={{ fontWeight: 500, textTransform: 'capitalize' }}>{platform}</span>
                    <span style={{ fontWeight: 600 }}>{count}</span>
                  </div>
                ))}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '8px',
                  fontSize: 14,
                  fontWeight: 700,
                  color: 'var(--tg-theme-text-color, #000)',
                  borderTop: '1px solid var(--tg-theme-hint-color, #ccc)',
                  marginTop: 4,
                }}
              >
                <span>總計</span>
                <span>{status.keys_summary.total}</span>
              </div>
            </div>
          </div>
        )}

        {/* Updated timestamp */}
        {status && status.updated && (
          <div style={updatedStyle}>
            Updated: {status.updated}
          </div>
        )}
      </PageContainer>
    </div>
  );
}
