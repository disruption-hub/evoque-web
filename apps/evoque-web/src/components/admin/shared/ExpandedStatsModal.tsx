'use client';

import { X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DashboardStatsCard, StatItem } from './DashboardStatsCard';

interface DashboardStats {
  media: {
    total: number;
    images: number;
    videos: number;
    totalSize: number;
  };
  connections?: {
    aws?: {
      connected: boolean;
      isActive: boolean;
      region?: string | null;
      bucketName?: string | null;
    };
    resend?: {
      connected: boolean;
      isActive: boolean;
    };
  };
}

interface ExpandedStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: DashboardStats | null;
  loading: boolean;
  category?: string;
}

export function ExpandedStatsModal({
  isOpen,
  onClose,
  stats,
  loading,
  category,
}: ExpandedStatsModalProps) {
  // Get all stats organized by category
  const getAllStats = () => {
    if (!stats) return {};

    return {
      'Content Management': [
        {
          label: 'Media Files',
          value: stats.media.total || 0,
          subtitle: `${stats.media.images || 0} images, ${stats.media.videos || 0} videos`,
          href: '/admin/media',
        },
      ] as StatItem[],
      'Connections': [
        {
          label: 'AWS Connection',
          value: stats.connections?.aws?.connected
            ? (stats.connections.aws.region || 'Connected')
            : 'Not Connected',
          subtitle: stats.connections?.aws?.connected
            ? `S3 Storage${stats.connections.aws.bucketName ? ` • ${stats.connections.aws.bucketName}` : ''}`
            : 'Not Configured',
          href: '#',
        },
        {
          label: 'Resend Connection',
          value: stats.connections?.resend?.connected ? 'Connected' : 'Not Connected',
          subtitle: stats.connections?.resend?.connected ? 'Email API' : 'Not Configured',
          href: '#',
        },
        {
          label: 'Storage Used',
          value: stats.media.totalSize
            ? parseFloat((stats.media.totalSize / (1024 * 1024)).toFixed(2))
            : 0,
          subtitle: 'MB',
          href: '/admin/media',
        },
      ] as StatItem[],
    };
  };

  const allStats = getAllStats();
  const categories = Object.keys(allStats);
  const displayCategories = category ? [category] : categories;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl w-full h-[95vh] max-h-[95vh] p-0 flex flex-col">
        <DialogHeader className="px-6 pt-6 pb-4 border-b flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold">
              {category ? `${category} - Detailed Stats` : 'All Dashboard Statistics'}
            </DialogTitle>
            <button
              onClick={onClose}
              className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <X className="h-5 w-5" />
              <span className="sr-only">Close</span>
            </button>
          </div>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayCategories.map((cat) => (
              <DashboardStatsCard
                key={cat}
                title={cat}
                loading={loading}
                stats={allStats[cat as keyof typeof allStats] || []}
              />
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

