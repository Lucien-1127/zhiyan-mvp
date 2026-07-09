import type { TimelineEvent } from '../../types/event';
import type { AuditResult } from '../../types/event';

interface EventsTimelineProps {
  items: TimelineEvent[];
  onEventClick?: (event: TimelineEvent) => void;
}

const RESULT_COLORS: Record<AuditResult, string> = {
  success: '#34c759',
  failed: '#ff3b30',
  partial: '#ffcc02',
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return '剛剛';
  if (mins < 60) return `${mins} 分鐘前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} 小時前`;
  const days = Math.floor(hours / 24);
  return `${days} 天前`;
}

export default function EventsTimeline({ items, onEventClick }: EventsTimelineProps) {
  if (items.length === 0) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '32px 16px',
          color: 'var(--tg-theme-hint-color, #8e8e93)',
          fontSize: 14,
          gap: 8,
        }}
      >
        <span style={{ fontSize: 28 }}>📭</span>
        <span>暫無事件</span>
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'relative',
        paddingLeft: 20,
      }}
    >
      {/* Vertical timeline line */}
      <div
        style={{
          position: 'absolute',
          left: 7,
          top: 4,
          bottom: 4,
          width: 2,
          backgroundColor: 'var(--tg-theme-divider-color, rgba(0,0,0,0.08))',
        }}
      />
      {items.map((event) => {
        const resultColor = RESULT_COLORS[event.result] ?? '#8e8e93';
        return (
          <div
            key={event.id}
            onClick={() => onEventClick?.(event)}
            style={{
              position: 'relative',
              padding: '10px 0 10px 16px',
              cursor: onEventClick ? 'pointer' : 'default',
              borderBottom: '1px solid var(--tg-theme-divider-color, rgba(0,0,0,0.04))',
            }}
          >
            {/* Timeline dot */}
            <div
              style={{
                position: 'absolute',
                left: -17,
                top: 13,
                width: 10,
                height: 10,
                borderRadius: '50%',
                backgroundColor: resultColor,
                border: '2px solid var(--tg-theme-bg-color, #fff)',
                zIndex: 1,
              }}
            />
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                marginBottom: 4,
              }}
            >
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'var(--tg-theme-text-color, #000)',
                }}
              >
                {event.actor.name}
              </span>
              <span
                style={{
                  fontSize: 12,
                  color: 'var(--tg-theme-hint-color, #8e8e93)',
                }}
              >
                {event.action}
              </span>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: 'var(--tg-theme-text-color, #000)',
                }}
              >
                {event.target.name}
              </span>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  padding: '1px 6px',
                  borderRadius: 4,
                  fontWeight: 600,
                  backgroundColor:
                    event.result === 'success' ? 'rgba(52,199,89,0.12)' :
                    event.result === 'failed' ? 'rgba(255,59,48,0.12)' :
                    'rgba(255,204,2,0.12)',
                  color: resultColor,
                }}
              >
                {event.result === 'success' ? '成功' :
                 event.result === 'failed' ? '失敗' :
                 '部分成功'}
              </span>
              <span
                style={{
                  fontSize: 11,
                  color: 'var(--tg-theme-hint-color, #8e8e93)',
                }}
              >
                {timeAgo(event.timestamp)}
              </span>
            </div>
            {event.detail && (
              <div
                style={{
                  marginTop: 4,
                  fontSize: 11,
                  color: 'var(--tg-theme-hint-color, #8e8e93)',
                  lineHeight: 1.4,
                }}
              >
                {event.detail}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
