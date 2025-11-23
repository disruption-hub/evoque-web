'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { PageActionsProvider, usePageActions } from '@/contexts/PageActionsContext';
import { SearchProvider } from '@/contexts/SearchContext';
import { AdminSidebarProvider, useAdminSidebar } from '@/contexts/AdminSidebarContext';
import { AuthProvider } from '@/contexts/AuthContext';
import AdminSidebar from '@/components/admin/layout/sidebar';
import AdminTopNavBar from '@/components/admin/layout/header';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

function AdminLayoutInner({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isCollapsed, setIsCollapsed, toggleMobileSidebar, isMobileOpen, setIsMobileOpen } = useAdminSidebar();
  const pathname = usePathname();
  const isLiveEditorRoute = pathname?.includes('/live-editor');
  const isMediaPage = pathname?.includes('/media');
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const { actions } = usePageActions();

  // Auto-collapse sidebar when on live-editor route
  useEffect(() => {
    if (isLiveEditorRoute && !isCollapsed) {
      setIsCollapsed(true);
    }
  }, [isLiveEditorRoute, isCollapsed, setIsCollapsed]);

  return (
    <div className={cn(
      "min-h-screen bg-white transition-opacity duration-500 relative"
    )}>
      {!isLiveEditorRoute && (
        <AdminTopNavBar 
          isCollapsed={isCollapsed} 
          onToggleSidebar={toggleMobileSidebar}
        />
      )}
      <div className={cn("flex", isLiveEditorRoute ? "pt-0" : "pt-10 md:pt-12")}>
        <AdminSidebar 
          isCollapsed={isCollapsed} 
          onToggle={() => setIsCollapsed(!isCollapsed)}
          isMobileOpen={isMobileOpen}
          onToggleMobile={() => setIsMobileOpen(!isMobileOpen)}
          onToggleActionsMenu={() => setShowActionsMenu(true)}
        />
        <main className={cn(
          "flex-1 w-full transition-all duration-300",
          "ml-0 lg:ml-56",
          isCollapsed && "lg:ml-16",
          isLiveEditorRoute && "p-0 relative",
          isMediaPage && "pt-16 md:pt-0"
        )}>
          {isLiveEditorRoute ? (
            // For live-editor routes, children will render header/sidebar and content
            children
          ) : (
            // Regular pages with padding
            <div className="p-3 sm:p-4 md:p-6 lg:p-8">
              {children}
            </div>
          )}
        </main>
      </div>

      {/* Mobile Actions Menu Overlay */}
      {showActionsMenu && (
        <div
          className="fixed inset-0 bg-black/50 z-[60] md:hidden"
          onClick={() => setShowActionsMenu(false)}
        />
      )}

      {/* Mobile Actions Menu Sidebar */}
      <div
        className={cn(
          "fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-white shadow-2xl z-[70] transform transition-transform duration-300 ease-in-out md:hidden",
          showActionsMenu ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Mobile Menu Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Actions</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowActionsMenu(false)}
              className="h-8 w-8 p-0"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Mobile Menu Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {actions.map((action) => (
              <Button
                key={action.id}
                variant={action.variant || 'default'}
                size="sm"
                onClick={() => {
                  action.onClick();
                  setShowActionsMenu(false);
                }}
                disabled={action.disabled}
                className={cn(
                  action.variant === 'default' ? 'bg-blue-600 hover:bg-blue-700' : undefined,
                  'w-full justify-start h-10'
                )}
              >
                {action.icon}
                {action.label && <span className="ml-2">{action.label}</span>}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <AdminSidebarProvider>
        <PageActionsProvider>
          <SearchProvider>
            <AdminLayoutInner>
              {children}
            </AdminLayoutInner>
          </SearchProvider>
        </PageActionsProvider>
      </AdminSidebarProvider>
    </AuthProvider>
  );
}

