interface ErrorBlockProps {
  message: string;
  onRetry?: () => void;
}

export default function ErrorBlock({ message, onRetry }: ErrorBlockProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        gap: 12,
        margin: '12px 0',
        borderRadius: 10,
        backgroundColor: 'rgba(255, 59, 48, 0.08)',
        border: '1px solid rgba(255, 59, 48, 0.2)',
      }}
    >
      <span
        style={{
          fontSize: 14,
          color: '#ff3b30',
          textAlign: 'center',
          lineHeight: 1.4,
        }}
      >
        {message}
      </span>
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            padding: '6px 20px',
            borderRadius: 8,
            border: '1px solid #ff3b30',
            background: 'transparent',
            color: '#ff3b30',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          重試
        </button>
      )}
    </div>
  );
}
