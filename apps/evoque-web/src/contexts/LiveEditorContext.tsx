'use client';

import { createContext, useContext, useState, ReactNode, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Page, Section, Component } from '@/types';

interface LiveEditorContextType {
  selectedPage: Page | null;
  selectedSection: Section | null;
  selectedComponent: Component | null;
  setSelectedPage: (page: Page | null) => void;
  setSelectedSection: (section: Section | null) => void;
  setSelectedComponent: (component: Component | null) => void;
  selectPage: (page: Page) => void;
  selectSection: (section: Section) => void;
  selectComponent: (component: Component) => void;
  clearSelection: () => void;
  editorType: 'page' | 'section' | 'component' | null;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  filteredComponents: Component[];
}

const LiveEditorContext = createContext<LiveEditorContextType | undefined>(undefined);

function LiveEditorProviderInner({ children }: { children: ReactNode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedPage, setSelectedPageState] = useState<Page | null>(null);
  const [selectedSection, setSelectedSectionState] = useState<Section | null>(null);
  const [selectedComponent, setSelectedComponentState] = useState<Component | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Get filtered components from selected section
  // Components can be an array of Component objects or string IDs
  const filteredComponents: Component[] = selectedSection?.components
    ? selectedSection.components
        .filter((comp): comp is Component => 
          typeof comp === 'object' && comp !== null && 'id' in comp && 'type' in comp
        )
    : [];

  // Determine editor type based on selection
  const editorType: 'page' | 'section' | 'component' | null = 
    selectedComponent ? 'component' :
    selectedSection ? 'section' :
    selectedPage ? 'page' :
    null;

  const selectPage = useCallback((page: Page) => {
    setSelectedPageState(page);
    setSelectedSectionState(null);
    setSelectedComponentState(null);
    // Navigate to page route
    const locale = searchParams.get('locale') || 'en';
    router.push(`/admin/live-editor/${page.slug || 'home'}?locale=${locale}`);
  }, [router, searchParams]);

  const selectSection = useCallback((section: Section) => {
    setSelectedSectionState(section);
    setSelectedComponentState(null);
    // Update URL params without changing route
    const locale = searchParams.get('locale') || 'en';
    const slug = selectedPage?.slug || 'home';
    const params = new URLSearchParams(searchParams.toString());
    params.set('section', section.id);
    params.delete('component');
    router.push(`/admin/live-editor/${slug}?${params.toString()}`);
  }, [router, searchParams, selectedPage]);

  const selectComponent = useCallback((component: Component) => {
    setSelectedComponentState(component);
    // Update URL params without changing route
    const locale = searchParams.get('locale') || 'en';
    const slug = selectedPage?.slug || 'home';
    const params = new URLSearchParams(searchParams.toString());
    if (selectedSection) {
      params.set('section', selectedSection.id);
    }
    params.set('component', component.id);
    router.push(`/admin/live-editor/${slug}?${params.toString()}`);
  }, [router, searchParams, selectedPage, selectedSection]);

  const setSelectedPage = useCallback((page: Page | null) => {
    setSelectedPageState(page);
    if (!page) {
      setSelectedSectionState(null);
      setSelectedComponentState(null);
    }
  }, []);

  const setSelectedSection = useCallback((section: Section | null) => {
    setSelectedSectionState(section);
    if (!section) {
      setSelectedComponentState(null);
    }
  }, []);

  const setSelectedComponent = useCallback((component: Component | null) => {
    setSelectedComponentState(component);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedPageState(null);
    setSelectedSectionState(null);
    setSelectedComponentState(null);
    router.push('/admin/live-editor');
  }, [router]);

  return (
    <LiveEditorContext.Provider
      value={{
        selectedPage,
        selectedSection,
        selectedComponent,
        setSelectedPage,
        setSelectedSection,
        setSelectedComponent,
        selectPage,
        selectSection,
        selectComponent,
        clearSelection,
        editorType,
        sidebarOpen,
        setSidebarOpen,
        filteredComponents,
      }}
    >
      {children}
    </LiveEditorContext.Provider>
  );
}

export function LiveEditorProvider({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    }>
      <LiveEditorProviderInner>{children}</LiveEditorProviderInner>
    </Suspense>
  );
}

export function useLiveEditor() {
  const context = useContext(LiveEditorContext);
  if (context === undefined) {
    throw new Error('useLiveEditor must be used within a LiveEditorProvider');
  }
  return context;
}


