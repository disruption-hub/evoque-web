'use client';

import Link from 'next/link';
import { useLiveEditor } from '@/contexts/LiveEditorContext';
import { ChevronRight } from 'lucide-react';

export default function LiveEditorHeader() {
  const { selectedPage, selectedSection, selectedComponent, selectPage, selectSection, selectComponent } = useLiveEditor();

  const breadcrumbs = [
    {
      label: 'Editor',
      href: '/admin/live-editor',
      onClick: () => {},
    },
  ];

  if (selectedPage) {
    breadcrumbs.push({
      label: selectedPage.title || selectedPage.slug || 'Page',
      href: `/admin/live-editor/${selectedPage.slug || 'home'}`,
      onClick: () => selectPage(selectedPage),
    });
  }

  if (selectedSection) {
    breadcrumbs.push({
      label: selectedSection.title || selectedSection.sectionKey || 'Section',
      href: '#',
      onClick: () => selectSection(selectedSection),
    });
  }

  if (selectedComponent) {
    breadcrumbs.push({
      label: selectedComponent.name || 'Component',
      href: '#',
      onClick: () => selectComponent(selectedComponent),
    });
  }

  return (
    <header className="border-b border-gray-200 bg-white z-40 sticky top-0">
      <div className="px-4 py-3">
        <nav className="flex items-center space-x-2 text-sm">
          {breadcrumbs.map((crumb, index) => (
            <div key={index} className="flex items-center space-x-2">
              {index > 0 && (
                <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
              )}
              {index === breadcrumbs.length - 1 ? (
                <span className="text-gray-900 font-medium">{crumb.label}</span>
              ) : (
                <Link
                  href={crumb.href}
                  onClick={(e) => {
                    e.preventDefault();
                    crumb.onClick();
                  }}
                  className="text-gray-600 hover:text-gray-900 transition-colors"
                >
                  {crumb.label}
                </Link>
              )}
            </div>
          ))}
        </nav>
      </div>
    </header>
  );
}


