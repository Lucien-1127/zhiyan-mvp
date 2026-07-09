import { useCallback, useState } from 'react';
import { useTelegramBackButton, useTelegramPopup } from '../../hooks/telegram/index';

/* ───────── Types ───────── */

interface ModelRoute {
  name: string;
  latencyMs: number;
  status: 'online' | 'degraded';
}

interface ConversationItem {
  id: string;
  title: string;
  model: string;
  time: string;
  snippet: string;
}

interface QuickAction {
  id: string;
  label: string;
  icon: string;
  route?: string;
}

/* ───────── Mock Data ───────── */

const MOCK_KPIS = [
  { id: 'chats', value: '1,284', label: '今日對話', trend: '↑12.5%', trendUp: true },
  { id: 'health', value: '96.7%', label: '系統健康度', trend: '', trendUp: true },
  { id: 'tokens', value: '256.4K', label: 'Token 用量', trend: '', trendUp: false },
  { id: 'cost', value: '$0.842', label: '今日花費', trend: '↓8.3%', trendUp: false },
];

const MOCK_SUBMODULES = [
  { label: 'API Routes', status: '5/5', ok: true },
  { label: 'Models', status: '12/12', ok: true },
  { label: 'DB', status: 'OK', ok: true },
  { label: 'Cache', status: 'OK', ok: true },
];

const MOCK_MODELS: ModelRoute[] = [
  { name: 'Gemini 2.5 Pro', latencyMs: 128, status: 'online' },
  { name: 'Claude 4 Sonnet', latencyMs: 156, status: 'online' },
  { name: 'GPT-4.1', latencyMs: 198, status: 'online' },
  { name: 'DeepSeek V4', latencyMs: 142, status: 'online' },
  { name: 'Kimi K2', latencyMs: 168, status: 'degraded' },
];

const MAX_LATENCY = 250;

const QUICK_ACTIONS: QuickAction[] = [
  { id: 'chat', label: '開始對話', icon: '💬', route: '/chat' },
  { id: 'upload', label: '上傳檔案', icon: '📎', route: '/documents' },
  { id: 'kb', label: '知識庫', icon: '📚', route: '/knowledge' },
  { id: 'prompt', label: '提示詞工廠', icon: '⚡', route: '/prompts' },
  { id: 'logs', label: '系統日誌', icon: '📋', route: '/logs' },
  { id: 'settings', label: '設定', icon: '⚙️', route: '/settings' },
];

const MOCK_CONVERSATIONS: ConversationItem[] = [
  {
    id: '1',
    title: 'API 架構設計討論',
    model: 'DeepSeek V4',
    time: '2 分鐘前',
    snippet: '關於微服務網關的設計方案，我建議採用…',
  },
];

/* ───────── Styles ───────── */

const styles = {
  page: {
    display: 'flex' as const,
    flexDirection: 'column' as const,
    minHeight: '100vh',
    background: 'var(--tg-theme-bg-color, #1a1a2e)',
    color: 'var(--tg-theme-text-color, #e2e8f0)',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    paddingBottom: '76px',
  },
  content: {
    padding: '16px',
    display: 'flex' as const,
    flexDirection: 'column' as const,
    gap: '20px',
    flex: 1,
  },

  /* Header */
  header: {
    display: 'flex' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    padding: '12px 16px 0',
  },
  brand: {
    display: 'flex' as const,
    alignItems: 'center' as const,
    gap: '8px',
  },
  brandIcon: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    background: 'linear-gradient(135deg, #40a7e3, #6366f1)',
    display: 'flex' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    fontSize: '14px',
    fontWeight: 700,
    color: '#fff',
  },
  brandText: {
    fontSize: '18px',
    fontWeight: 700,
    letterSpacing: '1px',
    background: 'linear-gradient(90deg, #40a7e3, #818cf8)',
    WebkitBackgroundClip: 'text' as const,
    WebkitTextFillColor: 'transparent' as const,
  },
  userSection: {
    display: 'flex' as const,
    alignItems: 'center' as const,
    gap: '10px',
  },
  userInfo: {
    textAlign: 'right' as const,
  },
  userName: {
    fontSize: '14px',
    fontWeight: 600,
    color: 'var(--tg-theme-text-color, #e2e8f0)',
  },
  userId: {
    fontSize: '11px',
    color: 'var(--tg-theme-hint-color, #94a3b8)',
  },
  proBadge: {
    display: 'inline-block',
    fontSize: '10px',
    fontWeight: 700,
    color: '#fff',
    background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
    borderRadius: '4px',
    padding: '1px 6px',
    marginLeft: '4px',
    verticalAlign: 'middle',
  },
  avatar: {
    width: '38px',
    height: '38px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #40a7e3, #6366f1)',
    display: 'flex' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    fontSize: '16px',
    fontWeight: 700,
    color: '#fff',
    flexShrink: 0,
  },

  /* Section Title */
  sectionTitle: {
    fontSize: '15px',
    fontWeight: 600,
    color: 'var(--tg-theme-text-color, #e2e8f0)',
    marginBottom: '12px',
  },

  /* KPI Grid */
  kpiGrid: {
    display: 'grid' as const,
    gridTemplateColumns: '1fr 1fr',
    gap: '10px',
  },
  kpiCard: {
    background: 'var(--tg-theme-secondary-bg-color, #1e293b)',
    borderRadius: '12px',
    padding: '14px',
    position: 'relative' as const,
    border: '1px solid rgba(148, 163, 184, 0.08)',
  },
  kpiTrend: {
    position: 'absolute' as const,
    top: '10px',
    right: '10px',
    fontSize: '11px',
    fontWeight: 600,
  },
  kpiTrendUp: { color: '#22c55e' },
  kpiTrendDown: { color: '#ef4444' },
  kpiValue: {
    fontSize: '24px',
    fontWeight: 700,
    color: 'var(--tg-theme-text-color, #e2e8f0)',
    lineHeight: 1.2,
    marginBottom: '4px',
  },
  kpiLabel: {
    fontSize: '12px',
    color: 'var(--tg-theme-hint-color, #94a3b8)',
    fontWeight: 500,
  },

  /* Health Gauge */
  healthSection: {
    display: 'flex' as const,
    flexDirection: 'column' as const,
    alignItems: 'center' as const,
    gap: '16px',
  },
  gaugeWrap: {
    position: 'relative' as const,
    width: '120px',
    height: '120px',
  },
  gaugeValue: {
    position: 'absolute' as const,
    inset: 0,
    display: 'flex' as const,
    flexDirection: 'column' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  gaugeNumber: {
    fontSize: '26px',
    fontWeight: 700,
    color: 'var(--tg-theme-text-color, #e2e8f0)',
    lineHeight: 1,
  },
  gaugeLabel: {
    fontSize: '11px',
    color: 'var(--tg-theme-hint-color, #94a3b8)',
    marginTop: '2px',
  },
  submodules: {
    display: 'flex' as const,
    flexWrap: 'wrap' as const,
    gap: '8px',
    justifyContent: 'center' as const,
  },
  subChip: {
    display: 'flex' as const,
    alignItems: 'center' as const,
    gap: '4px',
    background: 'var(--tg-theme-secondary-bg-color, #1e293b)',
    border: '1px solid rgba(148, 163, 184, 0.1)',
    borderRadius: '20px',
    padding: '6px 12px',
    fontSize: '12px',
    color: 'var(--tg-theme-text-color, #e2e8f0)',
    fontWeight: 500,
  },
  subChipOk: { color: '#22c55e', fontSize: '12px' },

  /* Model Routing */
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
    width: '100px',
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

  /* Quick Actions */
  quickGrid: {
    display: 'grid' as const,
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '10px',
  },
  quickBtn: {
    display: 'flex' as const,
    flexDirection: 'column' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: '6px',
    padding: '14px 8px',
    background: 'var(--tg-theme-secondary-bg-color, #1e293b)',
    border: '1px solid rgba(148, 163, 184, 0.08)',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'transform 0.15s ease, background 0.15s ease',
    outline: 'none',
    color: 'var(--tg-theme-text-color, #e2e8f0)',
    fontFamily: 'inherit',
  },
  quickIcon: {
    fontSize: '20px',
    lineHeight: 1,
  },
  quickLabel: {
    fontSize: '11px',
    fontWeight: 500,
    color: 'var(--tg-theme-hint-color, #94a3b8)',
  },

  /* Conversation List */
  convItem: {
    display: 'flex' as const,
    flexDirection: 'column' as const,
    gap: '4px',
    padding: '12px 14px',
    background: 'var(--tg-theme-secondary-bg-color, #1e293b)',
    border: '1px solid rgba(148, 163, 184, 0.08)',
    borderRadius: '12px',
  },
  convTop: {
    display: 'flex' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },
  convTitle: {
    fontSize: '14px',
    fontWeight: 600,
    color: 'var(--tg-theme-text-color, #e2e8f0)',
  },
  convMeta: {
    fontSize: '11px',
    color: 'var(--tg-theme-hint-color, #94a3b8)',
  },
  convModel: {
    fontSize: '11px',
    color: 'var(--tg-theme-button-color, #40a7e3)',
    fontWeight: 500,
  },
  convSnippet: {
    fontSize: '12px',
    color: 'var(--tg-theme-hint-color, #94a3b8)',
    lineHeight: 1.4,
    overflow: 'hidden' as const,
    textOverflow: 'ellipsis' as const,
    whiteSpace: 'nowrap' as const,
  },

  /* Bottom Navigation */
  bottomNav: {
    position: 'fixed' as const,
    bottom: 0,
    left: 0,
    right: 0,
    display: 'flex' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-around' as const,
    padding: '8px 0',
    paddingBottom: 'env(safe-area-inset-bottom, 8px)',
    background: 'var(--tg-theme-secondary-bg-color, #1e293b)',
    borderTop: '1px solid rgba(148, 163, 184, 0.12)',
    zIndex: 100,
  },
  navItem: {
    display: 'flex' as const,
    flexDirection: 'column' as const,
    alignItems: 'center' as const,
    gap: '2px',
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    padding: '4px 12px',
    fontFamily: 'inherit',
    outline: 'none',
    transition: 'color 0.15s ease',
  },
  navIcon: {
    fontSize: '20px',
    lineHeight: 1,
  },
  navLabel: {
    fontSize: '10px',
    fontWeight: 500,
  },
};

/* ───────── Color helpers ───────── */

function latencyColor(ms: number): string {
  if (ms < 140) return '#22c55e';
  if (ms < 180) return '#f59e0b';
  return '#ef4444';
}

/* ───────── SVG Ring ───────── */

function HealthGaugeRing({ percent }: { percent: number }) {
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percent / 100) * circumference;
  const color = percent >= 95 ? '#22c55e' : percent >= 80 ? '#f59e0b' : '#ef4444';

  return (
    <svg width="120" height="120" viewBox="0 0 120 120">
      {/* Background ring */}
      <circle
        cx="60"
        cy="60"
        r={radius}
        fill="none"
        stroke="rgba(148, 163, 184, 0.12)"
        strokeWidth="8"
      />
      {/* Progress arc */}
      <circle
        cx="60"
        cy="60"
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth="8"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        transform="rotate(-90 60 60)"
        style={{ transition: 'stroke-dashoffset 0.8s ease, stroke 0.3s ease' }}
      />
    </svg>
  );
}

/* ───────── Component ───────── */

export default function DreamDashboardPage({ onNavigate }: { onNavigate?: (route: string) => void }) {
  const [activeNav, setActiveNav] = useState('dashboard');
  const { openPopup } = useTelegramPopup();

  useTelegramBackButton(false);

  const handleQuickAction = useCallback((action: QuickAction) => {
    if (onNavigate && action.route) {
      onNavigate(action.route);
      return;
    }
    openPopup(
      action.label,
      `${action.label} 功能即將上線，敬請期待！`,
      [{ id: 'ok', type: 'default', text: '知道了' }],
    );
  }, [openPopup, onNavigate]);

  const handleConversationClick = useCallback(async (conv: ConversationItem) => {
    await openPopup(
      conv.title,
      `模型：${conv.model}\n時間：${conv.time}\n\n${conv.snippet}`,
      [{ id: 'close', type: 'default', text: '關閉' }],
    );
  }, [openPopup]);

  const handleNavClick = useCallback((key: string) => {
    setActiveNav(key);
    if (!onNavigate) return;
    const navRoutes: Record<string, string> = {
      chat: '/chat',
      documents: '/documents',
      analysis: '/analysis',
      profile: '/profile',
    };
    const route = navRoutes[key];
    if (route) onNavigate(route);
  }, [onNavigate]);

  /* ── Render ── */

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.brand}>
          <div style={styles.brandIcon}>H</div>
          <span style={styles.brandText}>HERMES v6.6</span>
        </div>
        <div style={styles.userSection}>
          <div style={styles.userInfo}>
            <div style={styles.userName}>
              陛下
              <span style={styles.proBadge}>PRO</span>
            </div>
            <div style={styles.userId}>ID 10086</div>
          </div>
          <div style={styles.avatar}>陛</div>
        </div>
      </div>

      {/* Body */}
      <div style={styles.content}>
        {/* KPI Grid */}
        <div style={styles.kpiGrid}>
          {MOCK_KPIS.map((kpi) => (
            <div key={kpi.id} style={styles.kpiCard}>
              {kpi.trend && (
                <span
                  style={{
                    ...styles.kpiTrend,
                    ...(kpi.trendUp ? styles.kpiTrendUp : styles.kpiTrendDown),
                  }}
                >
                  {kpi.trend}
                </span>
              )}
              <div style={styles.kpiValue}>{kpi.value}</div>
              <div style={styles.kpiLabel}>{kpi.label}</div>
            </div>
          ))}
        </div>

        {/* Health Gauge */}
        <div>
          <div style={styles.sectionTitle}>系統健康度</div>
          <div style={styles.healthSection}>
            <div style={styles.gaugeWrap}>
              <HealthGaugeRing percent={96.7} />
              <div style={styles.gaugeValue}>
                <div style={styles.gaugeNumber}>96.7%</div>
                <div style={styles.gaugeLabel}>健康</div>
              </div>
            </div>
            <div style={styles.submodules}>
              {MOCK_SUBMODULES.map((mod) => (
                <div key={mod.label} style={styles.subChip}>
                  <span style={styles.subChipOk}>●</span>
                  {mod.label} {mod.status}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Model Routing */}
        <div>
          <div style={styles.sectionTitle}>模型路由狀態</div>
          <div style={styles.modelList}>
            {MOCK_MODELS.map((model) => {
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

        {/* Quick Actions */}
        <div>
          <div style={styles.sectionTitle}>快速操作</div>
          <div style={styles.quickGrid}>
            {QUICK_ACTIONS.map((action) => (
              <button
                key={action.id}
                style={styles.quickBtn}
                onClick={() => handleQuickAction(action)}
                onMouseDown={(e) => {
                  const el = e.currentTarget;
                  el.style.transform = 'scale(0.95)';
                  el.style.background = 'rgba(148, 163, 184, 0.15)';
                }}
                onMouseUp={(e) => {
                  const el = e.currentTarget;
                  el.style.transform = 'scale(1)';
                  el.style.background = 'var(--tg-theme-secondary-bg-color, #1e293b)';
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget;
                  el.style.transform = 'scale(1)';
                  el.style.background = 'var(--tg-theme-secondary-bg-color, #1e293b)';
                }}
                onTouchStart={(e) => {
                  const el = e.currentTarget;
                  el.style.transform = 'scale(0.95)';
                  el.style.background = 'rgba(148, 163, 184, 0.15)';
                }}
                onTouchEnd={(e) => {
                  const el = e.currentTarget;
                  el.style.transform = 'scale(1)';
                  el.style.background = 'var(--tg-theme-secondary-bg-color, #1e293b)';
                }}
              >
                <span style={styles.quickIcon}>{action.icon}</span>
                <span style={styles.quickLabel}>{action.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Recent Conversations */}
        <div>
          <div style={styles.sectionTitle}>最近的對話</div>
          {MOCK_CONVERSATIONS.map((conv) => (
            <div
              key={conv.id}
              style={styles.convItem}
              onClick={() => handleConversationClick(conv)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') handleConversationClick(conv);
              }}
            >
              <div style={styles.convTop}>
                <span style={styles.convTitle}>{conv.title}</span>
                <span style={styles.convMeta}>{conv.time}</span>
              </div>
              <div>
                <span style={styles.convModel}>{conv.model}</span>
              </div>
              <div style={styles.convSnippet}>{conv.snippet}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Navigation */}
      <div style={styles.bottomNav}>
        {[
          { key: 'dashboard', icon: '📊', label: '儀表板' },
          { key: 'chat', icon: '💬', label: '對話' },
          { key: 'documents', icon: '📄', label: '文件' },
          { key: 'analysis', icon: '📈', label: '分析' },
          { key: 'profile', icon: '👤', label: '個人' },
        ].map((tab) => {
          const isActive = activeNav === tab.key;
          return (
            <button
              key={tab.key}
              style={{
                ...styles.navItem,
                color: isActive
                  ? 'var(--tg-theme-button-color, #40a7e3)'
                  : 'var(--tg-theme-hint-color, #94a3b8)',
              }}
              onClick={() => handleNavClick(tab.key)}
            >
              <span style={styles.navIcon}>{tab.icon}</span>
              <span style={styles.navLabel}>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
