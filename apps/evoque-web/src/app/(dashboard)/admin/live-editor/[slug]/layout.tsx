'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Page, Section } from '@/types';
import apiClient from '@/lib/api-client';
import { useLiveEditor } from '@/contexts/LiveEditorContext';
import LiveEditorSidebar from '@/components/admin/live-editor/Sidebar';
import EditorPanel from '@/components/admin/live-editor/EditorPanel';
import PreviewPanel from '@/components/admin/live-editor/PreviewPanel';
import ResizableDivider from '@/components/admin/live-editor/ResizableDivider';
import { useAdminSidebar } from '@/contexts/AdminSidebarContext';
import { cn } from '@/lib/utils';

function LiveEditorPageLayoutContent({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const searchParams = useSearchParams();
  const { 
    selectedPage,
    selectedSection,
    selectedComponent,
    setSelectedPage, 
    setSelectedSection, 
    setSelectedComponent,
    filteredComponents,
  } = useLiveEditor();
  const { isCollapsed } = useAdminSidebar();
  
  const slug = params?.slug as string;
  const locale = searchParams.get('locale') || 'en';
  const sectionId = searchParams.get('section');
  const componentId = searchParams.get('component');

  const [page, setPage] = useState<Page | null>(null);
  const [allPages, setAllPages] = useState<Page[]>([]);
  const [allSections, setAllSections] = useState<Section[]>([]);
  const [pageSections, setPageSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [editorWidth, setEditorWidth] = useState(50); // Percentage
  const [mobileView, setMobileView] = useState<'preview' | 'editor'>('preview'); // Mobile view toggle

  // Normalize slug
  const normalizedSlug = useMemo(() => {
    if (!slug || slug === 'home') return '';
    return slug;
  }, [slug]);

  // Load page data
  useEffect(() => {
    const loadPageData = async () => {
      try {
        setLoading(true);
        
        // Load page
        const pageResponse = await apiClient.get<{ data: Page }>(
          `/admin/files?type=page&slug=${normalizedSlug || ''}`
        );
        
        if (pageResponse.data) {
          const pageData = pageResponse.data;
          setPage(pageData);
          setSelectedPage(pageData);

          // Load all sections
          const sectionsResponse = await apiClient.get<{ data: Section[] }>(
            '/admin/files?list=sections'
          );
          const allSectionsData = sectionsResponse.data || [];
          setAllSections(allSectionsData);

          // Filter sections for this page
          if (pageData.sections && pageData.sections.length > 0) {
            const pageSectionIds = new Set(pageData.sections);
            const filtered = allSectionsData.filter(s => pageSectionIds.has(s.id));
            setPageSections(filtered);
          } else {
            setPageSections([]);
          }
        }
      } catch (error) {
        console.error('Failed to load page data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      loadPageData();
    }
  }, [slug, normalizedSlug, setSelectedPage]);

  // Load all pages for sidebar
  useEffect(() => {
    const loadPages = async () => {
      try {
        const response = await apiClient.get<{ data: Page[] }>('/admin/files?list=pages');
        setAllPages(response.data || []);
      } catch (error) {
        console.error('Failed to load pages:', error);
      }
    };
    loadPages();
  }, []);

  // Sync URL params with selection - load section first, then component
  useEffect(() => {
    if (sectionId && pageSections.length > 0) {
      const section = pageSections.find(s => s.id === sectionId);
      if (section && (!selectedSection || selectedSection.id !== section.id)) {
        setSelectedSection(section);
      }
    } else if (!sectionId) {
      setSelectedSection(null);
      setSelectedComponent(null);
    }
  }, [sectionId, pageSections, setSelectedSection, selectedSection]);

  useEffect(() => {
    // Only load component if section is selected and has components
    if (componentId && selectedSection && filteredComponents.length > 0) {
      const component = filteredComponents.find(c => c.id === componentId);
      if (component && (!selectedComponent || selectedComponent.id !== component.id)) {
        setSelectedComponent(component);
      }
    } else if (!componentId) {
      setSelectedComponent(null);
    }
  }, [componentId, selectedSection, filteredComponents, setSelectedComponent, selectedComponent]);

  const handleResize = (leftWidthPercent: number) => {
    setEditorWidth(leftWidthPercent);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-sm text-gray-600">Loading page...</p>
        </div>
      </div>
    );
  }

  if (!page) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-gray-600 mb-2">Page not found</p>
          <p className="text-sm text-gray-500">The page you're looking for doesn't exist</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex overflow-hidden">
      {/* Desktop Layout: Editor | Divider | Preview */}
      <div className="hidden lg:flex flex-1 overflow-hidden h-full">
        {/* Editor Panel */}
        <div 
          className="flex-shrink-0 overflow-hidden h-full"
          style={{ width: `${editorWidth}%`, minWidth: '200px' }}
        >
          <EditorPanel />
        </div>

        {/* Resizable Divider */}
        <ResizableDivider 
          onResize={handleResize}
          initialLeftWidth={editorWidth}
          minLeftWidth={200}
          minRightWidth={200}
        />

        {/* Preview Panel */}
        <div 
          className="flex-shrink-0 overflow-hidden h-full"
          style={{ width: `${100 - editorWidth}%`, minWidth: '200px' }}
        >
          <PreviewPanel>
            {children}
          </PreviewPanel>
        </div>
      </div>

      {/* Mobile Layout: Single view with toggle */}
      <div className="lg:hidden flex flex-col flex-1 overflow-hidden h-full">
        {/* Mobile view toggle buttons */}
        <div className="flex border-b border-gray-200 bg-white">
          <button
            onClick={() => setMobileView('editor')}
            className={cn(
              "flex-1 px-4 py-2 text-sm font-medium transition-colors",
              mobileView === 'editor'
                ? "bg-blue-50 text-blue-700 border-b-2 border-blue-700"
                : "text-gray-600 hover:bg-gray-50"
            )}
          >
            Editor
          </button>
          <button
            onClick={() => setMobileView('preview')}
            className={cn(
              "flex-1 px-4 py-2 text-sm font-medium transition-colors",
              mobileView === 'preview'
                ? "bg-blue-50 text-blue-700 border-b-2 border-blue-700"
                : "text-gray-600 hover:bg-gray-50"
            )}
          >
            Preview
          </button>
        </div>

        {/* Mobile content - switch between editor and preview */}
        <div className="flex-1 overflow-hidden">
          {mobileView === 'editor' ? (
            <div className="h-full">
              <EditorPanel />
            </div>
          ) : (
            <div className="h-full">
              <PreviewPanel>
                {children}
              </PreviewPanel>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LiveEditorPageLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <LiveEditorPageLayoutContent>{children}</LiveEditorPageLayoutContent>
    </Suspense>
  );
}


