'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Page, Section } from '@/types';
import apiClient from '@/lib/api-client';
import { LiveEditorProvider, useLiveEditor } from '@/contexts/LiveEditorContext';
import LiveEditorHeader from '@/components/admin/live-editor/Header';
import LiveEditorSidebar from '@/components/admin/live-editor/Sidebar';
import { useAdminSidebar } from '@/contexts/AdminSidebarContext';
import { cn } from '@/lib/utils';

function SearchParamsSync() {
  const searchParams = useSearchParams();
  const { setSelectedSection, setSelectedComponent } = useLiveEditor();

  // Sync URL params with context state
  useEffect(() => {
    const sectionId = searchParams.get('section');
    const componentId = searchParams.get('component');

    // Reset selections when URL params change
    if (!sectionId) {
      setSelectedSection(null);
    }
    if (!componentId) {
      setSelectedComponent(null);
    }
  }, [searchParams, setSelectedSection, setSelectedComponent]);

  return null;
}

function LayoutInner({ children }: { children: React.ReactNode }) {
  const { isCollapsed } = useAdminSidebar();
  const { setSelectedPage } = useLiveEditor();
  const [pages, setPages] = useState<Page[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [pagesResponse, sectionsResponse] = await Promise.all([
          apiClient.get<{ data: Page[] }>('/admin/files?list=pages'),
          apiClient.get<{ data: Section[] }>('/admin/files?list=sections'),
        ]);

        setPages(pagesResponse.data || []);
        setSections(sectionsResponse.data || []);
      } catch (error) {
        console.error('Failed to load live editor data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  return (
    <div
      className={cn(
        "fixed inset-0 bg-white z-40 flex flex-col overflow-hidden",
        "top-0",
        "h-screen",
        "transition-all duration-300"
      )}
      style={{
        left: isCollapsed ? '4rem' : '14rem', // 64px collapsed, 224px expanded
        width: isCollapsed
          ? 'calc(100% - 4rem)' // 100% - 64px (collapsed sidebar)
          : 'calc(100% - 14rem)', // 100% - 224px (expanded sidebar)
      }}
    >
      {/* Sync search params - wrapped in Suspense */}
      <Suspense fallback={null}>
        <SearchParamsSync />
      </Suspense>
      
      {/* Header with breadcrumbs */}
      <LiveEditorHeader />

      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="hidden lg:block">
          <LiveEditorSidebar pages={pages} sections={sections} />
        </div>

        {/* Content area */}
        <main className="flex-1 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-sm text-gray-600">Loading editor...</p>
              </div>
            </div>
          ) : (
            children
          )}
        </main>
      </div>

      {/* Mobile sidebar - shown/hidden via Sidebar component */}
      <div className="lg:hidden fixed inset-0 z-50 pointer-events-none">
        <LiveEditorSidebar pages={pages} sections={sections} />
      </div>
    </div>
  );
}

export default function LiveEditorLayout({ children }: { children: React.ReactNode }) {
  return (
    <LiveEditorProvider>
      <LayoutInner>{children}</LayoutInner>
    </LiveEditorProvider>
  );
}


