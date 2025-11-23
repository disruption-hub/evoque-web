'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Page, Section, MenuSection } from '@/types';
import apiClient from '@/lib/api-client';
import PreviewLayout from '@/components/admin/(studio)/pages/live-editor/preview/PreviewLayout';
import PreviewPage from '@/components/admin/(studio)/pages/live-editor/preview/PreviewPage';
import { RefreshCw } from 'lucide-react';
import { useLiveEditor } from '@/contexts/LiveEditorContext';

function LiveEditorSlugPageContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { selectedPage } = useLiveEditor();
  
  const slug = params?.slug as string;
  const locale = searchParams.get('locale') || 'en';

  // Page data
  const [page, setPage] = useState<Page | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [menuSections, setMenuSections] = useState<MenuSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // Load page data
  const loadPageData = useCallback(async () => {
    try {
      setLoading(true);
      const normalizedSlug = !slug || slug === 'home' ? '' : slug;
      
      const [sectionsList, menuSectionsList] = await Promise.all([
        apiClient.get<{ data: Section[] }>('/admin/files?list=sections'),
        apiClient.get<{ data: MenuSection[] }>('/admin/files?list=menu-sections')
      ]);

      // Load page data from file system
      try {
        const pageResponse = await apiClient.get<{ data: Page }>(`/admin/files?type=page&slug=${normalizedSlug || ''}`);
        if (pageResponse.data) {
          setPage(pageResponse.data);
          
          // Filter sections for this page from the already loaded sections list
          if (pageResponse.data.sections && pageResponse.data.sections.length > 0) {
            const pageSectionIds = new Set(pageResponse.data.sections);
            const pageSections = (sectionsList.data || []).filter(s => pageSectionIds.has(s.id));
            setSections(pageSections);
          } else {
            setSections([]);
          }
          
          // Filter menu sections for this page from the already loaded menu sections list
          if (pageResponse.data.menuSections && pageResponse.data.menuSections.length > 0) {
            const pageMenuSectionIds = new Set(pageResponse.data.menuSections);
            const pageMenuSections = (menuSectionsList.data || []).filter(ms => pageMenuSectionIds.has(ms.id));
            setMenuSections(pageMenuSections);
          } else {
            setMenuSections([]);
          }
        }
      } catch (error) {
        console.error('Failed to load page data:', error);
        setPage(null);
        setSections([]);
        setMenuSections([]);
      }
    } catch (error) {
      console.error('Failed to load page data:', error);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    loadPageData();
  }, [loadPageData, refreshKey]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-gray-400" />
          <p className="text-sm text-gray-600">Loading page content...</p>
        </div>
      </div>
    );
  }

  if (!page) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-sm text-gray-600">Page not found</p>
          <p className="text-xs text-gray-500 mt-2">No page data available</p>
        </div>
      </div>
    );
  }

  return (
    <PreviewLayout>
      <PreviewPage
        page={page}
        sections={sections}
        menuSections={menuSections}
      />
    </PreviewLayout>
  );
}

export default function LiveEditorSlugPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-gray-400" />
          <p className="text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <LiveEditorSlugPageContent />
    </Suspense>
  );
}


