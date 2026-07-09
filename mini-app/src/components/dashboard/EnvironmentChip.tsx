import type { AppEnvironment } from '../../types/common';

interface EnvironmentChipProps {
  env: AppEnvironment;
}

const ENV_COLORS: Record<AppEnvironment, string> = {
  prod: '#ff3b30',
  staging: '#ff9500',
  dev: '#007aff',
};

const ENV_LABELS: Record<AppEnvironment, string> = {
  prod: 'Production',
  staging: 'Staging',
  dev: 'Development',
};

export default function EnvironmentChip({ env }: EnvironmentChipProps) {
  const color = ENV_COLORS[env];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '3px 10px',
        borderRadius: 12,
        fontSize: 11,
        fontWeight: 700,
        color: '#fff',
        backgroundColor: color,
        lineHeight: 1.4,
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          backgroundColor: 'rgba(255,255,255,0.9)',
        }}
      />
      {ENV_LABELS[env]}
    </span>
  );
}
