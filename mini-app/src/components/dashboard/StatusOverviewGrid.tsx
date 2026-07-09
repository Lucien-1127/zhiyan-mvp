import type { KPIItem } from '../../types/metric';
import StatCard from './StatCard';

interface StatusOverviewGridProps {
  items: KPIItem[];
  onKpiClick?: (item: KPIItem) => void;
}

export default function StatusOverviewGrid({ items, onKpiClick }: StatusOverviewGridProps) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 10,
      }}
    >
      {items.map((item) => (
        <StatCard key={item.id} item={item} onClick={onKpiClick} />
      ))}
    </div>
  );
}
