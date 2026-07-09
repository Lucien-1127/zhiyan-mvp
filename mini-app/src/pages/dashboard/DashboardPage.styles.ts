import type { CSSProperties } from 'react';

export const dashboardStyles: Record<string, CSSProperties> = {
  page: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  mainBtn: {
    position: 'fixed',
    bottom: 24,
    left: 16,
    right: 16,
    padding: 16,
    borderRadius: 12,
    background: 'var(--tg-theme-button-color, #2481cc)',
    color: 'var(--tg-theme-button-text-color, #fff)',
    border: 'none',
    fontSize: 17,
    fontWeight: 600,
    textAlign: 'center',
    cursor: 'pointer',
  },
};
