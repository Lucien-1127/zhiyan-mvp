interface DashboardHeaderProps {
  onRestartProxy: () => void;
  onApiStatus?: () => void;
  onKeyManager?: () => void;
}

export default function DashboardHeader({ onRestartProxy, onApiStatus, onKeyManager }: DashboardHeaderProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 0 8px',
      }}
    >
      <h1
        style={{
          margin: 0,
          fontSize: 20,
          fontWeight: 700,
          color: 'var(--tg-theme-text-color, #000)',
        }}
      >
        Hermes Proxy Console
      </h1>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <button
          onClick={onApiStatus}
          style={{
            padding: '4px 10px',
            borderRadius: 6,
            border: 'none',
            background: 'var(--tg-theme-button-color, #40a7e3)',
            color: 'var(--tg-theme-button-text-color, #fff)',
            fontSize: 11,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          API 狀態
        </button>
        <button
          onClick={onKeyManager}
          style={{
            padding: '4px 10px',
            borderRadius: 6,
            border: 'none',
            background: 'var(--tg-theme-secondary-bg-color, #efeff4)',
            color: 'var(--tg-theme-text-color, #000)',
            fontSize: 11,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          金鑰
        </button>
        <button
          onClick={onRestartProxy}
          style={{
            padding: '6px 14px',
            borderRadius: 8,
            border: '1px solid var(--tg-theme-hint-color, rgba(0,0,0,0.12))',
            background: 'transparent',
            color: 'var(--tg-theme-text-color, #000)',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          重啟
        </button>
      </div>
    </div>
  );
}
