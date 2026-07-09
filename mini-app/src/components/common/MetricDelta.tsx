import type { MetricDelta as MetricDeltaType } from '../../types/metric';

interface MetricDeltaProps {
  delta?: MetricDeltaType;
}

function formatDelta(delta: MetricDeltaType): string {
  const arrow = delta.direction === 'up' ? '↑' : delta.direction === 'down' ? '↓' : '→';
  const val = delta.percentage != null
    ? `${Math.abs(delta.percentage).toFixed(1)}%`
    : `${Math.abs(delta.value)}`;
  return `${arrow} ${val}`;
}

export default function MetricDelta({ delta }: MetricDeltaProps) {
  if (!delta || delta.direction === 'flat') return null;

  const isUp = delta.direction === 'up';
  const color = isUp ? '#34c759' : '#ff3b30';
  const text = formatDelta(delta);

  return (
    <span
      style={{
        fontSize: 12,
        fontWeight: 600,
        color,
        whiteSpace: 'nowrap',
      }}
    >
      {text}
    </span>
  );
}
