interface SectionTitleProps {
  title: string;
  count?: number;
}

export default function SectionTitle({ title, count }: SectionTitleProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 0',
      }}
    >
      <h2
        style={{
          margin: 0,
          fontSize: 16,
          fontWeight: 600,
          color: 'var(--tg-theme-text-color, #000)',
        }}
      >
        {title}
      </h2>
      {count !== undefined && (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: 20,
            height: 20,
            borderRadius: 10,
            padding: '0 6px',
            fontSize: 11,
            fontWeight: 700,
            color: '#fff',
            backgroundColor: 'var(--tg-theme-button-color, #2481cc)',
          }}
        >
          {count}
        </span>
      )}
    </div>
  );
}
