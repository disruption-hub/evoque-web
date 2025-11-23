import Link from 'next/link';

interface DashboardStatsCardItemProps {
  label: string;
  value: number | string;
  subtitle: string;
  href: string;
}

export function DashboardStatsCardItem({ 
  label, 
  value, 
  subtitle, 
  href 
}: DashboardStatsCardItemProps) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between py-2 hover:underline cursor-pointer transition-all"
    >
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-black">{label}</span>
      </div>
      <div className="text-right">
        <p className="text-lg font-bold text-black">{value}</p>
        <p className="text-xs text-black/70">{subtitle}</p>
      </div>
    </Link>
  );
}

