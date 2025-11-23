'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { 
  Search, 
  Bell,
  X,
  RefreshCw,
  Menu,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePageActions } from '@/contexts/PageActionsContext';
import { useSearch } from '@/contexts/SearchContext';
import GlobalSearch from './components/GlobalSearch';
import NotificationModal from './components/NotificationModal';

interface AdminTopNavBarProps {
  isCollapsed: boolean;
  onToggleSidebar: () => void;
}

// Page titles mapping
const pageTitles: Record<string, { title: string; description?: string }> = {
  '/admin': { title: 'Dashboard', description: 'Overview and statistics' },
  '/admin/dashboard': { title: 'Dashboard', description: 'Overview and statistics' },
  '/admin/media': { title: 'Media Library', description: 'Manage media files' },
};


export default function AdminTopNavBar({ isCollapsed, onToggleSidebar }: AdminTopNavBarProps) {
  const [showGlobalSearch, setShowGlobalSearch] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState({ current: 0, total: 0 });
  const router = useRouter();
  const pathname = usePathname();
  const { actions } = usePageActions();
  const { searchTerm, setSearchTerm, placeholder } = useSearch();

  
  // Get current page info
  const getPageInfo = () => {
    // Check for exact match first
    if (pageTitles[pathname]) {
      return pageTitles[pathname];
    }
    
    // Default fallback
    return { title: 'Admin', description: '' };
  };
  
  const pageInfo = getPageInfo();

  const handleSearchClick = () => {
    setShowGlobalSearch(true);
  };


  const handleSyncS3 = async () => {
    if (isSyncing) return;
    
    setIsSyncing(true);
    setSyncProgress({ current: 0, total: 0 });
    
    try {
      const response = await fetch('/api/admin/media/sync/progress', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body reader available');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        
        // Process complete lines
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.type === 'progress') {
                const newProgress = { 
                  current: data.current, 
                  total: data.total 
                };
                setSyncProgress(newProgress);
              } else if (data.type === 'complete') {
                alert(`S3 sync completed successfully!\n\nTotal objects: ${data.result.totalObjects || 'N/A'}\nSynced: ${data.result.synced} files`);
                window.location.reload();
                return;
              } else if (data.error) {
                throw new Error(data.error);
              }
            } catch (parseError) {
              console.error('Error parsing SSE data:', parseError);
            }
          }
        }
      }
      
    } catch (error) {
      console.error('[AdminTopNavBar] S3 sync error:', error);
      alert(`S3 sync error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSyncing(false);
      setTimeout(() => {
        setSyncProgress({ current: 0, total: 0 });
      }, 2000);
    }
  };

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowGlobalSearch(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [pathname]);

  const isMediaPage = pathname === '/admin/media';

  return (
    <header className={cn(
      "border-b border-gray-200 absolute top-0 right-0 z-50 bg-white transition-all duration-300",
      "left-0 lg:left-56",
      isCollapsed && "lg:left-16"
    )}>
      
      <div className="px-3 sm:px-4 md:px-6 lg:px-8 py-1.5 sm:py-2">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4 min-h-[2.5rem] sm:min-h-[3rem]">
          {/* Left: Mobile Menu Button + Page Title */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-shrink-0">
            {/* Mobile Sidebar Toggle Button - On the left */}
            <div className="lg:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleSidebar}
                className="text-blue-600 hover:bg-gray-100 h-8 w-8 p-0"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </div>
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <h1 className="text-sm sm:text-base md:text-lg font-bold text-black truncate">
                {pageInfo.title}
              </h1>
            </div>
          </div>

          {/* Center: Search Bar + Notifications OR Progress Bar */}
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0 order-3 sm:order-2">
            {isSyncing && syncProgress.total > 0 ? (
              /* Progress Bar during sync */
              <div className="relative w-full max-w-full sm:max-w-md">
                <div className="bg-gray-200 rounded-lg h-9 sm:h-10 overflow-hidden shadow-inner">
                  <div 
                    className="h-full bg-blue-600 transition-all duration-300 ease-out"
                    style={{ 
                      width: `${(syncProgress.current / syncProgress.total) * 100}%` 
                    }}
                  />
                  
                  {/* Progress text overlay */}
                  <div className="absolute inset-0 flex items-center justify-center px-2">
                    <span className="text-xs sm:text-sm font-medium text-gray-700 drop-shadow-sm truncate">
                      Syncing {syncProgress.current} / {syncProgress.total} files
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              /* Normal Search Bar */
              <div className="relative w-full max-w-full sm:max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-blue-600/50" />
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onFocus={handleSearchClick}
                  placeholder={placeholder || "Search..."}
                  className="pl-10 pr-16 sm:pr-20 py-1.5 sm:py-2 w-full bg-gray-50 border border-gray-200 rounded-lg text-xs sm:text-sm text-black placeholder:text-black/50 focus:bg-white focus:border-blue-600/40 focus:outline-none transition-colors cursor-pointer"
                />
                {!searchTerm && (
                  <div className="absolute inset-y-0 right-0 pr-2 sm:pr-3 flex items-center pointer-events-none">
                    <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-blue-600/60 bg-white border border-gray-200 rounded">
                      <span className="text-xs">⌘</span>K
                    </kbd>
                  </div>
                )}
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute inset-y-0 right-0 pr-2 sm:pr-3 flex items-center text-blue-600/50 hover:text-blue-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            )}
            <Button 
              onClick={() => setShowNotificationModal(true)}
              variant="ghost" 
              size="sm" 
              className="relative text-blue-600 hover:bg-gray-100 flex-shrink-0 h-8 w-8 sm:h-9 sm:w-9 p-0"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute -top-1 -right-1 h-3.5 w-3.5 sm:h-4 sm:w-4 bg-red-500 text-white text-[10px] sm:text-xs rounded-full flex items-center justify-center">
                3
              </span>
            </Button>
          </div>

          {/* Right: Page-Specific Actions */}
          <div className="flex items-center justify-end gap-1.5 sm:gap-2 md:gap-3 flex-wrap flex-shrink-0 order-2 sm:order-3">
            {/* S3 Sync Button - Only show on media page */}
            {isMediaPage && (
              <Button 
                variant="outline"
                size="sm"
                onClick={handleSyncS3}
                disabled={isSyncing}
                className="text-blue-600 border-gray-200 hover:bg-blue-50 h-8 text-xs sm:text-sm px-2 sm:px-3"
              >
                <RefreshCw className={cn("h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-2", isSyncing && "animate-spin")} />
                <span className="hidden sm:inline">{isSyncing ? 'Syncing...' : 'Sync S3'}</span>
              </Button>
            )}
            
            {actions.map((action) => (
              <Button 
                key={action.id}
                variant={action.variant || 'default'}
                size="sm"
                onClick={action.onClick}
                disabled={action.disabled}
                className={cn(
                  action.variant === 'default' ? 'bg-blue-600 hover:bg-blue-700' : undefined,
                  'h-8 text-xs sm:text-sm px-2 sm:px-3 whitespace-nowrap',
                  !action.label && 'w-8 p-0'
                )}
              >
                {action.icon}
                {action.label && <span>{action.label}</span>}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Global Search Modal */}
      <GlobalSearch isOpen={showGlobalSearch} onClose={() => setShowGlobalSearch(false)} />
      
      {/* Notification Modal */}
      <NotificationModal isOpen={showNotificationModal} onClose={() => setShowNotificationModal(false)} />
    </header>
  );
}

