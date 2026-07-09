interface LoadingBlockProps {
  message?: string;
}

export default function LoadingBlock({ message = '載入中…' }: LoadingBlockProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 16px',
        gap: 12,
      }}
    >
      <style>{`
        @keyframes loading-pulse {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1); }
        }
      `}</style>
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          border: '3px solid var(--tg-theme-hint-color, #999)',
          borderTopColor: 'var(--tg-theme-button-color, #2481cc)',
          animation: 'loading-pulse 0.8s ease-in-out infinite',
        }}
      />
      <span
        style={{
          fontSize: 14,
          color: 'var(--tg-theme-hint-color, #999)',
        }}
      >
        {message}
      </span>
    </div>
  );
}
