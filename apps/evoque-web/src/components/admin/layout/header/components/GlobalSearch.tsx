'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Search, Loader2, ImageIcon, BarChart3, Eye, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

interface QuickAccessRoute {
  id: string;
  title: string;
  subtitle: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
}

export default function GlobalSearch({ isOpen, onClose }: GlobalSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Quick access routes (shown when no search)
  const quickAccessRoutes: QuickAccessRoute[] = [
    { id: 'quick-dashboard', title: 'Dashboard', subtitle: 'Overview', url: '/admin/dashboard', icon: BarChart3 },
    { id: 'quick-media', title: 'Media', subtitle: 'Files & images', url: '/admin/media', icon: ImageIcon },
    { id: 'quick-live', title: 'Live Editor', subtitle: 'Visual editor', url: '/admin/live-editor', icon: Eye },
  ];

  const handleRouteClick = (url: string) => {
    router.push(url);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredRoutes = searchQuery
    ? quickAccessRoutes.filter(
        (route) =>
          route.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          route.subtitle.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : quickAccessRoutes;

  return (
    <div className="fixed inset-0 z-[60] pt-12 md:pt-12">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      
      {/* Dropdown */}
      <div className="relative max-w-4xl mx-auto px-4">
        <div 
          ref={dropdownRef}
          className="bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-200"
        >
          {/* Search Input */}
          <div className="p-4 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-blue-600/50" />
              <Input
                placeholder="Search routes, media, live editor..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                className="pl-10 pr-10 border-gray-200 focus:border-blue-600 text-base h-12"
                autoFocus
              />
              {loading && (
                <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 animate-spin text-blue-600" />
              )}
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Results */}
          <div className="max-h-[60vh] overflow-y-auto">
            {filteredRoutes.length > 0 ? (
              <div className="p-2">
                {filteredRoutes.map((route) => {
                  const Icon = route.icon;
                  const isActive = pathname === route.url;
                  
                  return (
                    <button
                      key={route.id}
                      onClick={() => handleRouteClick(route.url)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left",
                        isActive
                          ? "bg-blue-50 text-blue-600"
                          : "hover:bg-gray-50 text-gray-900"
                      )}
                    >
                      <Icon className="h-5 w-5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">{route.title}</div>
                        <div className="text-xs text-gray-500 truncate">{route.subtitle}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">
                <p>No results found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

