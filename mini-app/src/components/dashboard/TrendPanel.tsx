import type { TrendRangeKey, TrendSeries } from '../../types/dashboard';

interface TrendPanelProps {
  range: TrendRangeKey;
  series: TrendSeries[];
  onRangeChange: (range: TrendRangeKey) => void;
}

const RANGES: TrendRangeKey[] = ['1h', '6h', '24h', '7d'];

const RANGE_LABELS: Record<TrendRangeKey, string> = {
  '1h': '1h',
  '6h': '6h',
  '24h': '24h',
  '7d': '7d',
};

export default function TrendPanel({ range, series, onRangeChange }: TrendPanelProps) {
  return (
    <div>
      <div
        style={{
          display: 'flex',
          gap: 6,
          marginBottom: 12,
        }}
      >
        {RANGES.map((r) => {
          const isActive = range === r;
          return (
            <button
              key={r}
              onClick={() => onRangeChange(r)}
              style={{
                padding: '4px 14px',
                borderRadius: 6,
                border: 'none',
                background: isActive
                  ? 'var(--tg-theme-button-color, #2481cc)'
                  : 'var(--tg-theme-secondary-bg-color, #e8e8e8)',
                color: isActive
                  ? 'var(--tg-theme-button-text-color, #fff)'
                  : 'var(--tg-theme-hint-color, #8e8e93)',
                fontSize: 12,
                fontWeight: isActive ? 600 : 400,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {RANGE_LABELS[r]}
            </button>
          );
        })}
      </div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: 200,
          borderRadius: 12,
          backgroundColor: 'var(--tg-theme-secondary-bg-color, #f0f0f0)',
          border: '1px dashed var(--tg-theme-divider-color, rgba(0,0,0,0.08))',
          color: 'var(--tg-theme-hint-color, #8e8e93)',
          fontSize: 14,
        }}
      >
        <span style={{ fontSize: 32, marginBottom: 8 }}>📊</span>
        <span>圖表區域 (ECharts 待整合)</span>
        <span style={{ fontSize: 11, marginTop: 4, opacity: 0.6 }}>
          {series.length > 0 ? `${series.length} 個系列` : '暫無資料'}
        </span>
      </div>
    </div>
  );
}
