import { DashboardStatsCardItem } from './DashboardStatsCardItem';

export interface StatItem {
  label: string;
  value: number | string;
  subtitle: string;
  href: string;
}

interface DashboardStatsCardProps {
  title: string;
  loading: boolean;
  stats: StatItem[];
}

export function DashboardStatsCard({ 
  title, 
  loading, 
  stats 
}: DashboardStatsCardProps) {
  return (
    <div className="bg-white overflow-hidden rounded-xl transition-all duration-300">
      <div className="p-4 md:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base md:text-lg font-semibold text-black">{title}</h3>
        </div>
        {loading ? (
          <div className="space-y-3">
            {[...Array(stats.length)].map((_, index) => (
              <div key={index} className="animate-pulse bg-gray-200 h-6 w-full rounded"></div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {stats.map((stat, index) => (
              <DashboardStatsCardItem
                key={index}
                label={stat.label}
                value={stat.value}
                subtitle={stat.subtitle}
                href={stat.href}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

