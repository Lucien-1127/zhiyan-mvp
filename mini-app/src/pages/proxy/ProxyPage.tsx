import { useState, useEffect } from 'react';
import { PageContainer } from '../../components/layout/PageContainer';
import { apiFetch } from '../../hooks/useApi';

interface ProxyPageProps {
  onBack: () => void;
}

interface ServiceStatus {
  name: string;
  status: string;
  detail: string;
}

interface ProxyStats {
  total_requests: number;
  today_requests: number;
  total_errors: number;
  error_rate: number;
}

interface ProxyStatus {
  services: ServiceStatus[];
  stats: ProxyStats;
}

export function ProxyPage({ onBack }: ProxyPageProps) {
  const [proxyData, setProxyData] = useState<ProxyStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProxyStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch('/api/proxy/status');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setProxyData(data);
    } catch (e: any) {
      setError(e.message || '無法取得 Proxy 狀態');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProxyStatus();
  }, []);

  const serviceIcon = (status: string) => {
    switch (status) {
      case 'ok': return '🟢';
      case 'down': return '🔴';
      default: return '⚪';
    }
  };

  const healthLabel = (status: string) => {
    switch (status) {
      case 'ok': return '正常';
      case 'down': return '離線';
      default: return '未知';
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid var(--tg-theme-hint-color, #ccc)', background: 'var(--tg-theme-bg-color, #fff)' }}>
          <button onClick={onBack} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', padding: '4px 8px', marginRight: 12, color: 'var(--tg-theme-button-color, #40a7e3)' }} aria-label="返回">←</button>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>⚡ Proxy 狀態</h1>
        </div>
        <PageContainer>
          <p style={{ textAlign: 'center', color: 'var(--tg-theme-hint-color, #999)', marginTop: 32 }}>載入中...</p>
        </PageContainer>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid var(--tg-theme-hint-color, #ccc)', background: 'var(--tg-theme-bg-color, #fff)' }}>
          <button onClick={onBack} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', padding: '4px 8px', marginRight: 12, color: 'var(--tg-theme-button-color, #40a7e3)' }} aria-label="返回">←</button>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>⚡ Proxy 狀態</h1>
        </div>
        <PageContainer>
          <div style={{ textAlign: 'center', marginTop: 32 }}>
            <p style={{ color: '#e74c3c', marginBottom: 12 }}>⚠️ {error}</p>
            <button onClick={fetchProxyStatus} style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: 'var(--tg-theme-button-color, #40a7e3)', color: '#fff', cursor: 'pointer', fontSize: 14 }}>🔄 重新整理</button>
          </div>
        </PageContainer>
      </div>
    );
  }

  const stats = proxyData?.stats;
  const services = proxyData?.services || [];

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
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>⚡ Proxy 狀態</h1>
      </div>
      <PageContainer>
        {/* 服務健康度 */}
        <h2 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 12px', color: 'var(--tg-theme-text-color, #fff)' }}>
          🏥 服務健康度
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
          {services.map((svc) => (
            <div
              key={svc.name}
              style={{
                background: 'var(--tg-theme-bg-color, #1a1a2e)',
                borderRadius: 10,
                padding: 14,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                border: '1px solid var(--tg-theme-hint-color, #333)',
              }}
            >
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--tg-theme-text-color, #fff)' }}>{svc.name}</div>
                <div style={{ fontSize: 11, color: 'var(--tg-theme-hint-color, #999)', marginTop: 2 }}>{svc.detail}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 18 }}>{serviceIcon(svc.status)}</div>
                <div style={{ fontSize: 11, color: svc.status === 'ok' ? '#2ecc71' : '#e74c3c' }}>{healthLabel(svc.status)}</div>
              </div>
            </div>
          ))}
        </div>

        {/* 模型請求統計 */}
        <h2 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 12px', color: 'var(--tg-theme-text-color, #fff)' }}>
          📊 模型請求統計
        </h2>
        <div
          style={{
            background: 'var(--tg-theme-bg-color, #1a1a2e)',
            borderRadius: 10,
            padding: 14,
            border: '1px solid var(--tg-theme-hint-color, #333)',
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ textAlign: 'center', padding: '10px 0' }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--tg-theme-text-color, #fff)' }}>
                {stats?.total_requests?.toLocaleString() ?? '-'}
              </div>
              <div style={{ fontSize: 11, color: 'var(--tg-theme-hint-color, #999)', marginTop: 4 }}>總請求數</div>
            </div>
            <div style={{ textAlign: 'center', padding: '10px 0' }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--tg-theme-text-color, #fff)' }}>
                {stats?.today_requests?.toLocaleString() ?? '-'}
              </div>
              <div style={{ fontSize: 11, color: 'var(--tg-theme-hint-color, #999)', marginTop: 4 }}>今日請求數</div>
            </div>
            <div style={{ textAlign: 'center', padding: '10px 0' }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#e74c3c' }}>
                {stats?.total_errors?.toLocaleString() ?? '-'}
              </div>
              <div style={{ fontSize: 11, color: 'var(--tg-theme-hint-color, #999)', marginTop: 4 }}>錯誤數</div>
            </div>
            <div style={{ textAlign: 'center', padding: '10px 0' }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: (stats?.error_rate ?? 0) > 5 ? '#e74c3c' : '#2ecc71' }}>
                {stats?.error_rate ?? '-'}%
              </div>
              <div style={{ fontSize: 11, color: 'var(--tg-theme-hint-color, #999)', marginTop: 4 }}>錯誤率</div>
            </div>
          </div>
        </div>
      </PageContainer>
    </div>
  );
}

export default ProxyPage;
