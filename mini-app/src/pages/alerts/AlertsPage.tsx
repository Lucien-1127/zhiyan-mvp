import { useState, useEffect } from 'react';
import { PageContainer } from '../../components/layout/PageContainer';
import { apiFetch } from '../../hooks/useApi';

interface AlertsPageProps {
  onBack: () => void;
}

interface AlertItem {
  id: number;
  platform: string;
  model_id: string;
  status: string;
  error: string;
  created_at: string;
}

export function AlertsPage({ onBack }: AlertsPageProps) {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAlerts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch('/api/alerts');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setAlerts(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e.message || '無法取得告警資料');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const statusLabel = (s: string) => {
    switch (s) {
      case 'error': return '❌ 錯誤';
      case 'timeout': return '⏱️ 超時';
      case 'rate_limited': return '🚦 限流';
      default: return s;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '12px 16px',
          borderBottom: '1px solid var(--tg-theme-hint-color, #ccc)',
          background: 'var(--tg-theme-bg-color, #fff)',
        }}
      >
        <button
          onClick={onBack}
          style={{
            background: 'none',
            border: 'none',
            fontSize: 20,
            cursor: 'pointer',
            padding: '4px 8px',
            marginRight: 12,
            color: 'var(--tg-theme-button-color, #40a7e3)',
          }}
          aria-label="返回"
        >
          ←
        </button>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>🔴 系統告警</h1>
      </div>
      <PageContainer>
        {loading && (
          <p style={{ textAlign: 'center', color: 'var(--tg-theme-hint-color, #999)', marginTop: 32 }}>
            載入中...
          </p>
        )}
        {error && (
          <div style={{ textAlign: 'center', marginTop: 32 }}>
            <p style={{ color: '#e74c3c', marginBottom: 12 }}>⚠️ {error}</p>
            <button
              onClick={fetchAlerts}
              style={{
                padding: '8px 20px',
                borderRadius: 8,
                border: 'none',
                background: 'var(--tg-theme-button-color, #40a7e3)',
                color: '#fff',
                cursor: 'pointer',
                fontSize: 14,
              }}
            >
              🔄 重新整理
            </button>
          </div>
        )}
        {!loading && !error && alerts.length === 0 && (
          <div style={{ textAlign: 'center', marginTop: 48 }}>
            <p style={{ fontSize: 40, margin: '0 0 12px' }}>✅</p>
            <p style={{ color: 'var(--tg-theme-hint-color, #999)', fontSize: 14 }}>
              目前無告警
            </p>
          </div>
        )}
        {!loading && !error && alerts.length > 0 && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--tg-theme-hint-color, #333)' }}>
                  <th style={{ padding: '8px 6px', textAlign: 'left', color: 'var(--tg-theme-hint-color, #999)' }}>時間</th>
                  <th style={{ padding: '8px 6px', textAlign: 'left', color: 'var(--tg-theme-hint-color, #999)' }}>平台</th>
                  <th style={{ padding: '8px 6px', textAlign: 'left', color: 'var(--tg-theme-hint-color, #999)' }}>模型</th>
                  <th style={{ padding: '8px 6px', textAlign: 'left', color: 'var(--tg-theme-hint-color, #999)' }}>狀態</th>
                  <th style={{ padding: '8px 6px', textAlign: 'left', color: 'var(--tg-theme-hint-color, #999)' }}>錯誤詳情</th>
                </tr>
              </thead>
              <tbody>
                {alerts.map((a) => (
                  <tr key={a.id} style={{ borderBottom: '1px solid var(--tg-theme-hint-color, #222)' }}>
                    <td style={{ padding: '10px 6px', whiteSpace: 'nowrap', fontSize: 12 }}>
                      {a.created_at.replace('T', ' ').substring(0, 19)}
                    </td>
                    <td style={{ padding: '10px 6px' }}>{a.platform}</td>
                    <td style={{ padding: '10px 6px', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {a.model_id}
                    </td>
                    <td style={{ padding: '10px 6px' }}>{statusLabel(a.status)}</td>
                    <td style={{ padding: '10px 6px', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#e74c3c' }}>
                      {a.error}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </PageContainer>
    </div>
  );
}

export default AlertsPage;
