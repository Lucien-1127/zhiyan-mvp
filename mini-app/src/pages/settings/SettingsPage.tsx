import { useState, useEffect } from 'react';
import { PageContainer } from '../../components/layout/PageContainer';
import { apiFetch } from '../../hooks/useApi';

interface SettingsPageProps {
  onBack: () => void;
}

interface SettingsProfile {
  current_provider: string;
  enabled_platforms: number;
  platform_list: string[];
  api_keys_total: number;
  system_version: string;
}

export function SettingsPage({ onBack }: SettingsPageProps) {
  const [profile, setProfile] = useState<SettingsProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch('/api/settings/profile');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setProfile(data);
    } catch (e: any) {
      setError(e.message || '無法取得系統設定');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

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
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>⚙️ 系統設定</h1>
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
              onClick={fetchProfile}
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
        {!loading && !error && profile && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {/* Provider */}
            <div
              style={{
                background: 'var(--tg-theme-bg-color, #1a1a2e)',
                borderRadius: 10,
                padding: 14,
                border: '1px solid var(--tg-theme-hint-color, #333)',
              }}
            >
              <div style={{ fontSize: 11, color: 'var(--tg-theme-hint-color, #999)', marginBottom: 4 }}>當前模型 Provider</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--tg-theme-text-color, #fff)' }}>
                {profile.current_provider}
              </div>
            </div>

            {/* 已啟用平台數 */}
            <div
              style={{
                background: 'var(--tg-theme-bg-color, #1a1a2e)',
                borderRadius: 10,
                padding: 14,
                border: '1px solid var(--tg-theme-hint-color, #333)',
              }}
            >
              <div style={{ fontSize: 11, color: 'var(--tg-theme-hint-color, #999)', marginBottom: 4 }}>已啟用平台數</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--tg-theme-text-color, #fff)' }}>
                {profile.enabled_platforms}
              </div>
              <div style={{ fontSize: 11, color: 'var(--tg-theme-hint-color, #999)', marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {(profile.platform_list || []).map((p) => (
                  <span key={p} style={{ background: 'rgba(64,167,227,0.15)', padding: '2px 8px', borderRadius: 8, color: 'var(--tg-theme-button-color, #40a7e3)' }}>
                    {p}
                  </span>
                ))}
              </div>
            </div>

            {/* API Keys 數 */}
            <div
              style={{
                background: 'var(--tg-theme-bg-color, #1a1a2e)',
                borderRadius: 10,
                padding: 14,
                border: '1px solid var(--tg-theme-hint-color, #333)',
              }}
            >
              <div style={{ fontSize: 11, color: 'var(--tg-theme-hint-color, #999)', marginBottom: 4 }}>API Keys 總數</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--tg-theme-text-color, #fff)' }}>
                {profile.api_keys_total}
              </div>
            </div>

            {/* 系統版本 */}
            <div
              style={{
                background: 'var(--tg-theme-bg-color, #1a1a2e)',
                borderRadius: 10,
                padding: 14,
                border: '1px solid var(--tg-theme-hint-color, #333)',
              }}
            >
              <div style={{ fontSize: 11, color: 'var(--tg-theme-hint-color, #999)', marginBottom: 4 }}>系統版本</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--tg-theme-text-color, #fff)' }}>
                {profile.system_version}
              </div>
            </div>
          </div>
        )}
      </PageContainer>
    </div>
  );
}

export default SettingsPage;
