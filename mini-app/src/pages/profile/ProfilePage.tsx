import { useCallback } from 'react';
import { useTelegramBackButton, useTelegramPopup } from '../../hooks/telegram/index';

/* ───────── Types ───────── */

interface SettingLink {
  id: string;
  label: string;
  icon: string;
  description: string;
}

/* ───────── Mock Data ───────── */

const SETTING_LINKS: SettingLink[] = [
  { id: 'api-keys', label: 'API 金鑰管理', icon: '🔑', description: '管理你的 API 存取金鑰' },
  { id: 'models', label: '模型偏好設定', icon: '🤖', description: '選擇預設模型與參數' },
  { id: 'notifications', label: '通知設定', icon: '🔔', description: '控制推播通知開關' },
  { id: 'theme', label: '主題與顯示', icon: '🎨', description: '自訂介面主題樣式' },
  { id: 'security', label: '安全與隱私', icon: '🛡️', description: '帳號安全與資料隱私' },
  { id: 'about', label: '關於 Hermes', icon: 'ℹ️', description: '版本資訊與授權' },
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
  profileCard: {
    display: 'flex' as const,
    alignItems: 'center' as const,
    gap: '16px',
    padding: '20px',
    background: 'var(--tg-theme-secondary-bg-color, #1e293b)',
    borderRadius: '16px',
    border: '1px solid rgba(148, 163, 184, 0.08)',
  },
  avatarLarge: {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #40a7e3, #6366f1)',
    display: 'flex' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    fontSize: '28px',
    fontWeight: 700,
    color: '#fff',
    flexShrink: 0,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: '20px',
    fontWeight: 700,
    color: 'var(--tg-theme-text-color, #e2e8f0)',
    display: 'flex' as const,
    alignItems: 'center' as const,
    gap: '8px',
  },
  proBadge: {
    display: 'inline-block',
    fontSize: '10px',
    fontWeight: 700,
    color: '#fff',
    background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
    borderRadius: '4px',
    padding: '2px 8px',
    verticalAlign: 'middle',
  },
  profileId: {
    fontSize: '13px',
    color: 'var(--tg-theme-hint-color, #94a3b8)',
    marginTop: '4px',
  },
  statsRow: {
    display: 'flex' as const,
    justifyContent: 'space-around' as const,
    padding: '16px',
    background: 'var(--tg-theme-secondary-bg-color, #1e293b)',
    borderRadius: '12px',
    border: '1px solid rgba(148, 163, 184, 0.08)',
  },
  statItem: {
    textAlign: 'center' as const,
  },
  statValue: {
    fontSize: '18px',
    fontWeight: 700,
    color: 'var(--tg-theme-text-color, #e2e8f0)',
  },
  statLabel: {
    fontSize: '11px',
    color: 'var(--tg-theme-hint-color, #94a3b8)',
    marginTop: '2px',
  },
  sectionTitle: {
    fontSize: '15px',
    fontWeight: 600,
    color: 'var(--tg-theme-text-color, #e2e8f0)',
    marginBottom: '12px',
  },
  settingsList: {
    display: 'flex' as const,
    flexDirection: 'column' as const,
    gap: '8px',
  },
  settingItem: {
    display: 'flex' as const,
    alignItems: 'center' as const,
    gap: '12px',
    padding: '14px',
    background: 'var(--tg-theme-secondary-bg-color, #1e293b)',
    borderRadius: '12px',
    border: '1px solid rgba(148, 163, 184, 0.08)',
    cursor: 'pointer',
    transition: 'background 0.15s ease',
  },
  settingIcon: {
    fontSize: '20px',
    flexShrink: 0,
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: '14px',
    fontWeight: 500,
    color: 'var(--tg-theme-text-color, #e2e8f0)',
  },
  settingDesc: {
    fontSize: '11px',
    color: 'var(--tg-theme-hint-color, #94a3b8)',
    marginTop: '2px',
  },
  chevron: {
    fontSize: '14px',
    color: 'var(--tg-theme-hint-color, #94a3b8)',
    flexShrink: 0,
  },
};

/* ───────── Component ───────── */

export default function ProfilePage({ onBack }: { onBack: () => void }) {
  const { openPopup } = useTelegramPopup();

  useTelegramBackButton(true, onBack);

  const handleSettingClick = useCallback(
    async (setting: SettingLink) => {
      await openPopup(
        setting.label,
        `${setting.description}\n\n此功能即將上線，敬請期待！`,
        [{ id: 'ok', type: 'default', text: '知道了' }],
      );
    },
    [openPopup],
  );

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <span style={styles.headerTitle}>個人設定</span>
      </div>

      <div style={styles.content}>
        {/* Profile Card */}
        <div style={styles.profileCard}>
          <div style={styles.avatarLarge}>陛</div>
          <div style={styles.profileInfo}>
            <div style={styles.profileName}>
              陛下
              <span style={styles.proBadge}>PRO</span>
            </div>
            <div style={styles.profileId}>ID 10086 · 註冊於 2026-01-15</div>
          </div>
        </div>

        {/* Stats */}
        <div style={styles.statsRow}>
          <div style={styles.statItem}>
            <div style={styles.statValue}>1,284</div>
            <div style={styles.statLabel}>今日對話</div>
          </div>
          <div style={styles.statItem}>
            <div style={styles.statValue}>256K</div>
            <div style={styles.statLabel}>Token 用量</div>
          </div>
          <div style={styles.statItem}>
            <div style={styles.statValue}>32</div>
            <div style={styles.statLabel}>已儲存提示詞</div>
          </div>
        </div>

        {/* Settings */}
        <div>
          <div style={styles.sectionTitle}>設定</div>
          <div style={styles.settingsList}>
            {SETTING_LINKS.map((item) => (
              <div
                key={item.id}
                style={styles.settingItem}
                onClick={() => handleSettingClick(item)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') handleSettingClick(item);
                }}
              >
                <span style={styles.settingIcon}>{item.icon}</span>
                <div style={styles.settingInfo}>
                  <div style={styles.settingLabel}>{item.label}</div>
                  <div style={styles.settingDesc}>{item.description}</div>
                </div>
                <span style={styles.chevron}>›</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
