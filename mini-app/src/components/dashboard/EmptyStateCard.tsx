interface EmptyStateCardProps {
  message: string;
  icon?: string;
}

export default function EmptyStateCard({ message, icon = '📭' }: EmptyStateCardProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 24px',
        borderRadius: 12,
        backgroundColor: 'var(--tg-theme-secondary-bg-color, #f0f0f0)',
        gap: 12,
      }}
    >
      <span style={{ fontSize: 40 }}>{icon}</span>
      <span
        style={{
          fontSize: 14,
          color: 'var(--tg-theme-hint-color, #8e8e93)',
          textAlign: 'center',
          lineHeight: 1.4,
        }}
      >
        {message}
      </span>
    </div>
  );
}
