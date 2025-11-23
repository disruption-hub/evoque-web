'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api-client';
import { DashboardStatsCard } from './shared/DashboardStatsCard';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ExpandedStatsModal } from './shared/ExpandedStatsModal';
import { RecentActivityModal } from './shared/RecentActivityModal';
import { Maximize2, Clock } from 'lucide-react';

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
  recentActivity: {
    type: string;
    message: string;
    timestamp: string;
  }[];
}

interface QuickActionProps {
  title: string;
  description: string;
  href: string;
}

const QuickAction = ({ title, description, href, disabled }: QuickActionProps & { disabled?: boolean }) => {
  if (disabled) {
    return (
      <div
        className="relative group bg-gray-100 p-4 md:p-6 rounded-xl border border-gray-300 cursor-not-allowed opacity-60"
      >
        <div className="mt-4 md:mt-6">
          <h3 className="text-base md:text-lg font-semibold text-gray-500">
            {title}
          </h3>
          <p className="mt-1 md:mt-2 text-xs md:text-sm text-gray-400">
            {description}
          </p>
        </div>
      </div>
    );
  }

  return (
    <Link
      href={href}
      className="relative group bg-white p-4 md:p-6 focus-within:ring-2 focus-within:ring-inset ring-evoque-deep-blue rounded-xl border border-evoque-deep-blue/20 hover:border-evoque-deep-blue/40 hover:shadow-lg transition-all duration-300"
    >
      <div className="mt-4 md:mt-6">
        <h3 className="text-base md:text-lg font-semibold text-gray-900">
          <span className="absolute inset-0" aria-hidden="true" />
          {title}
        </h3>
        <p className="mt-1 md:mt-2 text-xs md:text-sm text-gray-600">
          {description}
        </p>
      </div>
    </Link>
  );
};

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [isExpandedModalOpen, setIsExpandedModalOpen] = useState(false);
  const [isRecentActivityModalOpen, setIsRecentActivityModalOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const data = await apiClient.get<{ success: boolean; data: any; error?: string }>('/admin/stats');
        
        if (data.success) {
          setStats(data.data);
        } else {
          throw new Error(data.error || 'Failed to fetch statistics');
        }
      } catch (err: any) {
        console.error('Error fetching stats:', err);
        // Check for authentication errors (401 Unauthorized)
        // Check status code property or error message
        if (
          err.status === 401 ||
          err.isAuthError ||
          err.message?.includes('401') || 
          err.message?.includes('Unauthorized') || 
          err.message?.includes('Authentication') ||
          err.message?.includes('Authentication required')
        ) {
          router.push('/sign-in?redirect=/admin');
        } else {
          setError(err.message || 'An error occurred');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [router]);

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Manage your website content, users, and system settings
          </p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Error loading dashboard
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
                  <div className="mt-4 p-4 bg-cyan-50 border border-evoque-teal rounded-md">
                  <h4 className="text-sm font-medium text-[#00008B] mb-2">Need to log in?</h4>
                  <p className="text-sm text-[#00C2CB] mb-3">
                    Use these credentials to access the admin dashboard:
                  </p>
                  <div className="text-sm text-[#00C2CB] space-y-1">
                    <p><strong>Admin:</strong> admin@e-voque.com / admin123</p>
                  </div>
                  <div className="mt-3">
                    <Link 
                      href="/en/login?redirect=/admin"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-evoque-teal hover:bg-evoque-teal-dark focus:outline-none focus:ring-2 focus:ring-offset-2 ring-evoque-teal"
                    >
                      Go to Login
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Stats Cards Grid - 4/6 left, 2/6 right */}
      <div className="grid grid-cols-6 gap-4 md:gap-6 items-stretch">
        {/* Left Side - 4/6 width: Content Management and Users & Access */}
        <div className="col-span-6 md:col-span-4 flex flex-col">
          <div className="bg-white shadow-lg rounded-xl hover:shadow-xl hover:border-evoque-deep-blue/40 overflow-hidden flex flex-col flex-1 relative group min-h-[400px] h-full">
            {/* Expand Button */}
            <button
              onClick={() => {
                setExpandedCategory('Content Management');
                setIsExpandedModalOpen(true);
              }}
              className="absolute top-2 right-2 z-10 p-2 rounded-md bg-white/80 hover:bg-white border border-evoque-deep-blue/20 opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Expand Content Management stats"
            >
              <Maximize2 className="h-4 w-4 text-evoque-deep-blue" />
            </button>
            <DashboardStatsCard
              title="Content Management"
              loading={loading}
              stats={[
                {
                  label: 'Media Files',
                  value: stats?.media.total || 0,
                  subtitle: `${stats?.media.images || 0} images`,
                  href: '/admin/media',
                },
              ]}
            />
          </div>
        </div>

        {/* Right Side - 2/6 width: Connections */}
        <div className="col-span-6 md:col-span-2 flex flex-col">
          <div className="bg-white shadow-lg rounded-xl overflow-hidden flex flex-col flex-1 relative group/connections min-h-[400px] h-full">
            {/* Expand Button */}
            <button
              onClick={() => {
                setExpandedCategory('Connections');
                setIsExpandedModalOpen(true);
              }}
              className="absolute top-2 right-2 z-10 p-2 rounded-md bg-white/80 hover:bg-white opacity-0 group-hover/connections:opacity-100 transition-opacity"
              aria-label="Expand Connections stats"
            >
              <Maximize2 className="h-4 w-4 text-evoque-deep-blue" />
            </button>
            <DashboardStatsCard
              title="Connections"
              loading={loading}
              stats={[
                {
                  label: 'AWS Connection',
                  value: stats?.connections?.aws?.connected 
                    ? (stats.connections.aws.region || 'Connected')
                    : 'Not Connected',
                  subtitle: stats?.connections?.aws?.connected 
                    ? 'S3 Storage' 
                    : 'Not Configured',
                  href: '#',
                },
                {
                  label: 'Resend Connection',
                  value: stats?.connections?.resend?.connected ? 'Connected' : 'Not Connected',
                  subtitle: stats?.connections?.resend?.connected ? 'Email API' : 'Not Configured',
                  href: '#',
                },
                {
                  label: 'Storage Used',
                  value: stats?.media.totalSize 
                    ? parseFloat((stats.media.totalSize / (1024 * 1024)).toFixed(2))
                    : 0,
                  subtitle: 'MB',
                  href: '/admin/media',
                },
              ]}
            />
          </div>
        </div>
      </div>

      {/* Quick Actions - Full width */}
      <div className="w-full">
        <div className="bg-white shadow-lg rounded-xl border border-evoque-deep-blue/20">
          <div className="px-4 md:px-6 py-4 md:py-5 border-evoque-deep-blue/20 flex rounded-xl items-start justify-between">
            <div>
              <h3 className="text-base md:text-lg font-semibold text-black">
                Quick Actions
              </h3>
              <p className="mt-1 text-xs md:text-sm text-black/70">
                Access frequently used features and tools
              </p>
            </div>
            <button
              onClick={() => setIsRecentActivityModalOpen(true)}
              className="flex items-center gap-2 text-sm text-evoque-deep-blue hover:text-evoque-deep-blue/80 underline transition-colors"
            >
              <Clock className="h-4 w-4" />
              Recent Activity
            </button>
          </div>
          <div className="p-4 md:p-6">
            <div className="grid grid-cols-1 gap-3 md:gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <QuickAction
                title="Media Library"
                description="Upload and manage media files, images and videos"
                href="/admin/media"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Expanded Stats Modal */}
      <ExpandedStatsModal
        isOpen={isExpandedModalOpen}
        onClose={() => {
          setIsExpandedModalOpen(false);
          setExpandedCategory(null);
        }}
        stats={stats}
        loading={loading}
        category={expandedCategory || undefined}
      />

      {/* Recent Activity Modal */}
      <RecentActivityModal
        isOpen={isRecentActivityModalOpen}
        onClose={() => setIsRecentActivityModalOpen(false)}
        activities={stats?.recentActivity || []}
      />
    </div>
  );
}