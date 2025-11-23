'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  ChevronDown,
  ChevronUp,
  ChevronsLeft,
  ChevronsRight,
  X,
  Menu,
  Upload,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type NavItem = {
  name: string;
  href: string;
  hideOnMobile?: boolean;
  children?: NavItem[];
};

const navigation: NavItem[] = [
  {
    name: 'Studio',
    href: '/admin',
    children: [
      { name: 'Media', href: '/admin/media' },
      { name: 'Live Editor', href: '/admin/live-editor' },
    ],
  },
];

interface AdminSidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  isMobileOpen: boolean;
  onToggleMobile: () => void;
  onToggleActionsMenu: () => void;
}

export default function AdminSidebar({ isCollapsed, onToggle, isMobileOpen, onToggleMobile, onToggleActionsMenu }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, refreshUser } = useAuth();
  const [expandedItems, setExpandedItems] = useState<string[]>(['Studio']);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);

  // Close mobile menu when route changes
  useEffect(() => {
    if (isMobileOpen) {
      onToggleMobile();
    }
  }, [pathname]);

  // Auto-expand parent items when their children are active
  useEffect(() => {
    const itemsToExpand: string[] = [];
    
    navigation.forEach((item) => {
      if (item.children) {
        // Check if any child or grandchild is active
        const hasActiveChild = item.children.some((child) => {
          const childActive = isActive(child.href);
          
          // Check grandchildren
          if (child.children) {
            const hasActiveGrandchild = child.children.some((grandchild) => 
              isActive(grandchild.href)
            );
            
            if (hasActiveGrandchild) {
              itemsToExpand.push(child.name);
              return true;
            }
          }
          
          return childActive;
        });
        
        if (hasActiveChild) {
          itemsToExpand.push(item.name);
        }
      }
    });
    
    // Only update if there are changes to avoid infinite loops
    setExpandedItems(prev => {
      const newItems = [...new Set([...prev, ...itemsToExpand])];
      if (JSON.stringify(prev.sort()) !== JSON.stringify(newItems.sort())) {
        return newItems;
      }
      return prev;
    });
  }, [pathname]);

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  const toggleExpanded = (itemName: string) => {
    setExpandedItems(prev =>
      prev.includes(itemName)
        ? prev.filter(name => name !== itemName)
        : [...prev, itemName]
    );
  };

  const isActive = useCallback((href: string) => {
    // Normalize href to always start with /
    const normalizedHref = href.startsWith('/') ? href : `/${href}`;
    
    // Exact match for /admin/dashboard
    if (normalizedHref === '/admin/dashboard' || normalizedHref === '/admin') {
      return pathname === '/admin/dashboard' || pathname === '/admin';
    }
    
    // For all other routes, check if pathname starts with the href
    // This handles nested routes like /admin/website/pages
    return pathname.startsWith(normalizedHref);
  }, [pathname]);

  return (
    <>
      {/* Mobile/Tablet circular button - Now triggers actions menu */}
      <button
        onClick={onToggleActionsMenu}
        className="lg:hidden fixed bottom-4 right-4 z-40 p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors"
        title="Actions Menu"
      >
        <Upload className="h-6 w-6" />
      </button>

      {/* Mobile/Tablet overlay for sidebar */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[55] lg:hidden"
          onClick={onToggleMobile}
        />
      )}

      {/* Sidebar - z-index higher than upload button */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-[70] bg-white shadow-lg border-r border-gray-200 transform transition-all duration-300 ease-in-out overflow-x-hidden",
        isCollapsed ? "w-16" : "w-56",
        isMobileOpen ? "translate-x-0 w-56" : "-translate-x-full lg:translate-x-0"
      )}>
        {/* Toggle Button - Desktop Only (lg and up) - On top of border */}
        <button
          onClick={onToggle}
          className="hidden lg:flex absolute top-6 -right-3 z-[70] items-center justify-center p-1.5 bg-white text-blue-600 hover:bg-gray-100 rounded-full border border-gray-200 shadow-md transition-colors"
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? (
            <ChevronsRight className="h-4 w-4" />
          ) : (
            <ChevronsLeft className="h-4 w-4" />
          )}
        </button>
        
      <div className="flex flex-col h-full overflow-x-hidden">
        {/* Logo Header */}
        <div className="flex items-center justify-center border-b border-gray-200 h-14 md:h-16">
          <Link href="/admin/dashboard" className="flex items-center">
            <Image
              src="/logo.jpeg"
              alt="Logo"
              width={32}
              height={32}
              className={cn(
                "transition-all duration-300 object-contain",
                isCollapsed ? "h-7 w-7" : "h-8 w-8"
              )}
            />
          </Link>
        </div>
        
        <nav className={cn("flex-1 space-y-1 overflow-y-auto overflow-x-hidden scrollbar-thin", isCollapsed ? "px-2" : "px-3")}>
          {navigation.map((item) => {
            const isItemActive = isActive(item.href);
            const isExpanded = expandedItems.includes(item.name);
            const hasChildren = item.children && item.children.length > 0;
            const hideOnMobile = 'hideOnMobile' in item && item.hideOnMobile;

            return (
              <div key={item.name} className={cn(hideOnMobile && 'hidden md:block')}>
                <div className="flex items-center">
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-center w-full text-xs font-medium rounded-md transition-colors group relative',
                      isCollapsed ? 'px-2 py-2.5 justify-center' : 'px-2.5 py-2',
                      isItemActive
                        ? 'bg-blue-500 text-white shadow-sm'
                        : 'text-black hover:bg-gray-100 hover:text-blue-600 hover:shadow-sm'
                    )}
                    title={isCollapsed ? item.name : undefined}
                  >
                    <span className={cn(
                      "flex-1",
                      isCollapsed && "md:hidden"
                    )}>{item.name}</span>
                    
                    {/* Tooltip for collapsed state on desktop */}
                    {isCollapsed && (
                      <div className="hidden md:block absolute left-full ml-2 px-2.5 py-1.5 bg-blue-600 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-lg">
                        {item.name}
                      </div>
                    )}
                  </Link>
                  
                  {hasChildren && !isCollapsed && (
                    <button
                      onClick={() => toggleExpanded(item.name)}
                      className="ml-1 p-1 hover:bg-white rounded-full transition-colors group/chevron relative"
                    >
                      {isExpanded ? (
                        <ChevronUp className="h-3 w-3" />
                      ) : (
                        <ChevronDown className="h-3 w-3" />
                      )}
                      <div className="absolute left-full ml-2 px-2.5 py-1.5 bg-blue-600 text-white text-xs rounded-md opacity-0 group-hover/chevron:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-lg">
                        {isExpanded ? 'Collapse' : 'Expand'} {item.name}
                      </div>
                    </button>
                  )}
                </div>

                {hasChildren && isExpanded && item.children && (
                  <div className={cn(
                    "mt-0.5 space-y-0.5",
                    isCollapsed ? "hidden md:hidden" : "ml-6"
                  )}>
                    {item.children.map((child) => {
                      const isChildActive = isActive(child.href);
                      const hasGrandchildren = child.children && child.children.length > 0;
                      const isChildExpanded = expandedItems.includes(child.name);
                      
                      return (
                        <div key={child.name}>
                          <div className="flex items-center">
                            <Link
                              href={child.href}
                              className={cn(
                                'flex items-center flex-1 px-2.5 py-1.5 text-xs rounded-md transition-colors',
                                isChildActive
                                  ? 'bg-blue-500 text-white shadow-sm'
                                  : 'text-black/70 hover:bg-gray-100 hover:text-blue-600 hover:shadow-sm'
                              )}
                            >
                              {child.name}
                            </Link>
                            {hasGrandchildren && (
                              <button
                                onClick={() => toggleExpanded(child.name)}
                                className="ml-1 p-1 hover:bg-white rounded-full transition-colors group/chevron relative"
                              >
                                {isChildExpanded ? (
                                  <ChevronUp className="h-3 w-3" />
                                ) : (
                                  <ChevronDown className="h-3 w-3" />
                                )}
                                <div className="absolute left-full ml-2 px-2.5 py-1.5 bg-blue-600 text-white text-xs rounded-md opacity-0 group-hover/chevron:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-lg">
                                  {isChildExpanded ? 'Collapse' : 'Expand'} {child.name}
                                </div>
                              </button>
                            )}
                          </div>
                          
                          {hasGrandchildren && isChildExpanded && child.children && (
                            <div className="mt-0.5 ml-6 space-y-0.5">
                              {child.children.map((grandchild) => {
                                const isGrandchildActive = isActive(grandchild.href);
                                return (
                                  <Link
                                    key={grandchild.name}
                                    href={grandchild.href}
                                    className={cn(
                                      'flex items-center px-2.5 py-1.5 text-xs rounded-md transition-colors',
                                      isGrandchildActive
                                        ? 'bg-blue-500 text-white shadow-sm'
                                        : 'text-black/60 hover:bg-gray-100 hover:text-blue-600 hover:shadow-sm'
                                    )}
                                  >
                                    {grandchild.name}
                                  </Link>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Footer - User & Settings */}
        <div className="border-t border-gray-200">
          {/* User Section */}
          <button
            onClick={() => setIsUserModalOpen(true)}
            className={cn(
              "w-full flex items-center p-3 hover:bg-gray-200 transition-colors group relative",
              isCollapsed && "justify-center"
            )}
          >
            <Avatar className={cn("flex-shrink-0", isCollapsed ? "h-7 w-7" : "h-8 w-8")}>
              <AvatarImage src={user?.profileImage ?? undefined} alt={`${user?.firstName || ''} ${user?.lastName || ''}`} />
              <AvatarFallback className="bg-blue-600 text-white font-medium text-xs">
                {user?.firstName?.[0] || ''}{user?.lastName?.[0] || ''}
              </AvatarFallback>
            </Avatar>
            {!isCollapsed && (
              <div className="ml-2 flex-1 min-w-0 text-left">
                <p className="text-xs font-medium text-black truncate">
                  {user?.firstName || ''} {user?.lastName || ''}
                </p>
                <p className="text-xs text-black/60 truncate">
                  {user?.email || ''}
                </p>
              </div>
            )}
            {isCollapsed && (
              <div className="hidden md:block absolute left-full ml-2 px-2.5 py-1.5 bg-blue-600 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-lg">
                {user?.firstName || ''} {user?.lastName || ''}
              </div>
            )}
          </button>

          {/* Logout */}
          <div className="px-2 pb-2 space-y-1">
            <button
              onClick={handleLogout}
              className={cn(
                "flex items-center w-full text-xs font-medium rounded-md transition-colors hover:bg-red-50 hover:text-red-600 text-red-600 group relative",
                isCollapsed ? "px-2 py-2.5 justify-center" : "px-2.5 py-2"
              )}
            >
              <span className={cn("flex-1", isCollapsed && "md:hidden")}>Logout</span>
              {isCollapsed && (
                <div className="hidden md:block absolute left-full ml-2 px-2.5 py-1.5 bg-blue-600 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-lg">
                  Logout
                </div>
              )}
            </button>
          </div>
        </div>
      </div>
      </div>
      
      {/* User Modal - Simplified version */}
      <Dialog open={isUserModalOpen} onOpenChange={setIsUserModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>User Profile</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="flex items-center gap-4 mb-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={user?.profileImage ?? undefined} alt={`${user?.firstName || ''} ${user?.lastName || ''}`} />
                <AvatarFallback className="bg-blue-600 text-white">
                  {user?.firstName?.[0] || ''}{user?.lastName?.[0] || ''}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">{user?.firstName || ''} {user?.lastName || ''}</p>
                <p className="text-sm text-gray-600">{user?.email || ''}</p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
