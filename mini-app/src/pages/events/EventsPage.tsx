import { useState, useEffect } from 'react';
import { PageContainer } from '../../components/layout/PageContainer';
import { apiFetch } from '../../hooks/useApi';

interface EventsPageProps {
  onBack: () => void;
}

interface EventItem {
  m: string;
  t: string;
  type?: string;
}

export function EventsPage({ onBack }: EventsPageProps) {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch('/api/models');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const recent: EventItem[] = (data.recent || []).map((r: EventItem) => ({
        ...r,
        type: 'success',
      }));
      const errList: EventItem[] = (data.errors || []).map((e: EventItem) => ({
        m: e.m,
        t: e.t || '',
        type: 'error',
      }));
      const merged = [...recent, ...errList].sort(
        (a, b) => new Date(b.t).getTime() - new Date(a.t).getTime()
      );
      setEvents(merged.slice(0, 50));
    } catch (e: any) {
      setError(e.message || '無法取得事件記錄');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
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
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>📋 事件記錄</h1>
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
              onClick={fetchEvents}
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
        {!loading && !error && events.length === 0 && (
          <div style={{ textAlign: 'center', marginTop: 48 }}>
            <p style={{ color: 'var(--tg-theme-hint-color, #999)', fontSize: 14 }}>
              暫無事件記錄
            </p>
          </div>
        )}
        {!loading && !error && events.length > 0 && (
          <div>
            {events.map((ev, idx) => (
              <div
                key={`${ev.m}-${ev.t}-${idx}`}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  padding: '10px 0',
                  borderBottom: '1px solid var(--tg-theme-hint-color, #1a1a2e)',
                  gap: 10,
                }}
              >
                {/* Timeline dot */}
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    marginTop: 5,
                    flexShrink: 0,
                    background: ev.type === 'error' ? '#e74c3c' : '#2ecc71',
                  }}
                />
                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, color: 'var(--tg-theme-hint-color, #999)', marginBottom: 2 }}>
                    {ev.t.replace('T', ' ').substring(0, 19)}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--tg-theme-text-color, #fff)', marginBottom: 2 }}>
                    {ev.m}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      display: 'inline-block',
                      padding: '2px 8px',
                      borderRadius: 10,
                      background: ev.type === 'error' ? 'rgba(231,76,60,0.15)' : 'rgba(46,204,113,0.15)',
                      color: ev.type === 'error' ? '#e74c3c' : '#2ecc71',
                    }}
                  >
                    {ev.type === 'error' ? '❌ 錯誤' : '✅ 成功'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </PageContainer>
    </div>
  );
}

export default EventsPage;
