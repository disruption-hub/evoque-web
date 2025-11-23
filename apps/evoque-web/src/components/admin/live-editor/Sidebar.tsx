'use client';

import { Page, Section, Component } from '@/types';
import { useLiveEditor } from '@/contexts/LiveEditorContext';
import { Plus, FileText, Layout, Box } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LiveEditorSidebarProps {
  pages: Page[];
  sections: Section[];
  filteredSections?: Section[];
  onPageSelect?: (page: Page) => void;
  onSectionSelect?: (section: Section) => void;
  onComponentSelect?: (component: Component) => void;
}

export default function LiveEditorSidebar({
  pages,
  sections,
  filteredSections,
  onPageSelect,
  onSectionSelect,
  onComponentSelect,
}: LiveEditorSidebarProps) {
  const { 
    selectedPage, 
    selectedSection, 
    selectedComponent,
    selectPage,
    selectSection,
    selectComponent,
    filteredComponents,
    sidebarOpen,
    setSidebarOpen,
  } = useLiveEditor();

  // Use filtered sections if provided (for page-specific view), otherwise use all sections
  const displaySections = filteredSections || sections;

  const handlePageClick = (page: Page) => {
    selectPage(page);
    onPageSelect?.(page);
  };

  const handleSectionClick = (section: Section) => {
    selectSection(section);
    onSectionSelect?.(section);
  };

  const handleComponentClick = (component: Component) => {
    selectComponent(component);
    onComponentSelect?.(component);
  };

  if (!sidebarOpen) {
    return (
      <button
        onClick={() => setSidebarOpen(true)}
        className="fixed left-0 top-1/2 -translate-y-1/2 z-[60] bg-white border-r border-t border-b border-gray-200 rounded-r-md p-2 shadow-md lg:hidden pointer-events-auto"
      >
        <Layout className="h-5 w-5 text-gray-600" />
      </button>
    );
  }

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-[55] pointer-events-auto"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      <aside className={cn(
        "w-64 border-r border-gray-200 bg-white h-full flex flex-col overflow-hidden",
        "lg:relative lg:z-auto",
        "fixed lg:fixed inset-y-0 left-0 z-[60] lg:z-auto pointer-events-auto lg:pointer-events-auto",
        "transform transition-transform duration-300",
        !sidebarOpen && "lg:translate-x-0 -translate-x-full"
      )}>
        {/* Mobile close button */}
        <div className="lg:hidden flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-gray-900">Navigation</h2>
          <button
            onClick={() => setSidebarOpen(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Pages Section */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Pages
              </h3>
              <button className="text-gray-400 hover:text-gray-600">
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-1">
              {pages.length === 0 ? (
                <button className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  <span>Create new page</span>
                </button>
              ) : (
                pages.map((page) => (
                  <button
                    key={page.id}
                    onClick={() => handlePageClick(page)}
                    className={cn(
                      "w-full text-left px-3 py-2 text-sm rounded-md transition-colors flex items-center gap-2",
                      selectedPage?.id === page.id
                        ? "bg-blue-50 text-blue-700 font-medium"
                        : "text-gray-700 hover:bg-gray-50"
                    )}
                  >
                    <FileText className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{page.title || page.slug || 'Untitled'}</span>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Sections Section */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Sections
              </h3>
              <button className="text-gray-400 hover:text-gray-600">
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-1">
              {displaySections.length === 0 ? (
                <button className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  <span>Create new section</span>
                </button>
              ) : (
                displaySections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => handleSectionClick(section)}
                    className={cn(
                      "w-full text-left px-3 py-2 text-sm rounded-md transition-colors flex items-center gap-2",
                      selectedSection?.id === section.id
                        ? "bg-blue-50 text-blue-700 font-medium"
                        : "text-gray-700 hover:bg-gray-50"
                    )}
                  >
                    <Layout className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{section.title || section.sectionKey || 'Untitled'}</span>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Components Section - Only show when section is selected */}
          {selectedSection && (
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Components
                </h3>
                <button className="text-gray-400 hover:text-gray-600">
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-1">
                {filteredComponents.length === 0 ? (
                  <button className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    <span>Create new component</span>
                  </button>
                ) : (
                  filteredComponents.map((component) => (
                    <button
                      key={component.id}
                      onClick={() => handleComponentClick(component)}
                      className={cn(
                        "w-full text-left px-3 py-2 text-sm rounded-md transition-colors flex items-center gap-2",
                        selectedComponent?.id === component.id
                          ? "bg-blue-50 text-blue-700 font-medium"
                          : "text-gray-700 hover:bg-gray-50"
                      )}
                    >
                      <Box className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{component.name || 'Untitled'}</span>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}


