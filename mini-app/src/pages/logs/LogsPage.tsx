import { useState } from 'react';
import { useTelegramBackButton } from '../../hooks/telegram/index';

/* ───────── Types ───────── */

type LogLevel = 'INFO' | 'WARN' | 'ERROR';

interface LogEntry {
  id: string;
  time: string;
  level: LogLevel;
  source: string;
  message: string;
}

/* ───────── Mock Data ───────── */

const MOCK_LOGS: LogEntry[] = [
  { id: '1', time: '2026-07-08 14:32:18', level: 'INFO', source: 'router', message: 'API 請求 /api/models — 200 OK (142ms)' },
  { id: '2', time: '2026-07-08 14:31:55', level: 'WARN', source: 'cache', message: 'Redis 快取命中率下降至 72%' },
  { id: '3', time: '2026-07-08 14:31:22', level: 'INFO', source: 'auth', message: '用戶 #10086 驗證成功' },
  { id: '4', time: '2026-07-08 14:30:44', level: 'ERROR', source: 'model', message: 'Kimi K2 請求超時 (timeout=30s)' },
  { id: '5', time: '2026-07-08 14:30:10', level: 'INFO', source: 'router', message: 'API 請求 /api/chat — 200 OK (1,284ms)' },
  { id: '6', time: '2026-07-08 14:29:38', level: 'WARN', source: 'rate-limit', message: '用戶 #10086 接近速率限制 (85/100)' },
  { id: '7', time: '2026-07-08 14:28:55', level: 'INFO', source: 'cache', message: '模型列表快取已更新' },
  { id: '8', time: '2026-07-08 14:28:12', level: 'ERROR', source: 'db', message: '資料庫連線池耗盡 — 重試中 (attempt 2/3)' },
  { id: '9', time: '2026-07-08 14:27:30', level: 'INFO', source: 'system', message: '排程任務「清理暫存」執行完成' },
  { id: '10', time: '2026-07-08 14:26:45', level: 'INFO', source: 'auth', message: '用戶 #10085 登出' },
  { id: '11', time: '2026-07-08 14:26:10', level: 'WARN', source: 'model', message: 'Gemini 2.5 Pro 延遲升高至 210ms' },
  { id: '12', time: '2026-07-08 14:25:22', level: 'INFO', source: 'router', message: 'API 請求 /api/status — 200 OK (56ms)' },
];

const LEVELS: LogLevel[] = ['INFO', 'WARN', 'ERROR'];

const LEVEL_COLORS: Record<LogLevel, string> = {
  INFO: '#40a7e3',
  WARN: '#f59e0b',
  ERROR: '#ef4444',
};

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
  filterBar: {
    display: 'flex' as const,
    gap: '8px',
    padding: '12px 16px',
    borderBottom: '1px solid rgba(148, 163, 184, 0.08)',
  },
  filterBtn: {
    padding: '6px 14px',
    borderRadius: '16px',
    border: '1px solid rgba(148, 163, 184, 0.2)',
    background: 'transparent',
    color: 'var(--tg-theme-hint-color, #94a3b8)',
    fontSize: '12px',
    fontWeight: 500,
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all 0.15s ease',
  },
  filterBtnActive: {
    background: 'rgba(64, 167, 227, 0.15)',
    borderColor: 'var(--tg-theme-button-color, #40a7e3)',
    color: 'var(--tg-theme-button-color, #40a7e3)',
  },
  content: {
    flex: 1,
    overflowY: 'auto' as const,
    padding: '8px 16px 16px',
  },
  logList: {
    display: 'flex' as const,
    flexDirection: 'column' as const,
    gap: '6px',
  },
  logEntry: {
    display: 'flex' as const,
    flexDirection: 'column' as const,
    gap: '4px',
    padding: '10px 12px',
    background: 'var(--tg-theme-secondary-bg-color, #1e293b)',
    borderRadius: '8px',
    border: '1px solid rgba(148, 163, 184, 0.06)',
    fontSize: '12px',
    fontFamily: "'SF Mono', 'Fira Code', 'Consolas', monospace",
  },
  logTop: {
    display: 'flex' as const,
    alignItems: 'center' as const,
    gap: '8px',
  },
  levelBadge: {
    fontSize: '10px',
    fontWeight: 700,
    padding: '1px 6px',
    borderRadius: '4px',
    flexShrink: 0,
  },
  logTime: {
    color: 'var(--tg-theme-hint-color, #94a3b8)',
    fontSize: '11px',
    flexShrink: 0,
  },
  logSource: {
    color: 'var(--tg-theme-text-color, #e2e8f0)',
    fontWeight: 500,
    fontSize: '11px',
  },
  logMessage: {
    color: 'var(--tg-theme-text-color, #e2e8f0)',
    fontSize: '12px',
    lineHeight: 1.4,
    wordBreak: 'break-word' as const,
  },
};

/* ───────── Component ───────── */

export default function LogsPage({ onBack }: { onBack: () => void }) {
  const [activeLevel, setActiveLevel] = useState<LogLevel | 'ALL'>('ALL');

  useTelegramBackButton(true, onBack);

  const filteredLogs =
    activeLevel === 'ALL'
      ? MOCK_LOGS
      : MOCK_LOGS.filter((log) => log.level === activeLevel);

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <span style={styles.headerTitle}>系統日誌</span>
      </div>

      {/* Level Filter */}
      <div style={styles.filterBar}>
        <button
          style={{
            ...styles.filterBtn,
            ...(activeLevel === 'ALL' ? styles.filterBtnActive : {}),
          }}
          onClick={() => setActiveLevel('ALL')}
        >
          全部 ({MOCK_LOGS.length})
        </button>
        {LEVELS.map((level) => {
          const count = MOCK_LOGS.filter((l) => l.level === level).length;
          return (
            <button
              key={level}
              style={{
                ...styles.filterBtn,
                ...(activeLevel === level ? styles.filterBtnActive : {}),
              }}
              onClick={() => setActiveLevel(level)}
            >
              {level} ({count})
            </button>
          );
        })}
      </div>

      {/* Log Entries */}
      <div style={styles.content}>
        {filteredLogs.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              color: 'var(--tg-theme-hint-color, #94a3b8)',
              padding: '40px 0',
              fontSize: '14px',
            }}
          >
            沒有 {activeLevel} 等級的日誌
          </div>
        ) : (
          <div style={styles.logList}>
            {filteredLogs.map((entry) => (
              <div key={entry.id} style={styles.logEntry}>
                <div style={styles.logTop}>
                  <span
                    style={{
                      ...styles.levelBadge,
                      background: LEVEL_COLORS[entry.level],
                      color: '#fff',
                    }}
                  >
                    {entry.level}
                  </span>
                  <span style={styles.logTime}>{entry.time}</span>
                  <span style={styles.logSource}>[{entry.source}]</span>
                </div>
                <div style={styles.logMessage}>{entry.message}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
