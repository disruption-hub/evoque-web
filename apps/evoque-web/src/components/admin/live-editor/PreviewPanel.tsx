'use client';

import { useState, useEffect, useRef } from 'react';
import { useLiveEditor } from '@/contexts/LiveEditorContext';

interface PreviewPanelProps {
  children?: React.ReactNode;
  defaultWidth?: number;
}

export default function PreviewPanel({ children, defaultWidth = 375 }: PreviewPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [previewWidth, setPreviewWidth] = useState(defaultWidth);
  const { selectedPage } = useLiveEditor();

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        const width = containerRef.current.clientWidth;
        setPreviewWidth(width);
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  if (!selectedPage) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600 mb-2">No page selected</p>
          <p className="text-sm text-gray-500">
            Select a page from the sidebar to preview
          </p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="h-full overflow-y-auto bg-gray-100 relative"
      style={{ width: '100%' }}
    >
      {/* Preview Frame */}
      <div 
        className="mx-auto bg-white shadow-lg min-h-full"
        style={{
          width: `${Math.min(previewWidth, 1200)}px`,
          maxWidth: '100%',
        }}
      >
        {/* Preview Content */}
        {children || (
          <div className="p-8">
            <div className="text-center py-12">
              <p className="text-gray-600 mb-2">Page Preview</p>
              <p className="text-sm text-gray-500 mb-4">
                Width: {Math.min(previewWidth, 1200)}px
              </p>
              <div className="text-xs text-gray-400">
                Preview content will be rendered here
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


