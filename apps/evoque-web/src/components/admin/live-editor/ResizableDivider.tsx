'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface ResizableDividerProps {
  onResize?: (leftWidthPercent: number) => void;
  minLeftWidth?: number;
  minRightWidth?: number;
  initialLeftWidth?: number;
}

export default function ResizableDivider({
  onResize,
  minLeftWidth = 200,
  minRightWidth = 200,
  initialLeftWidth = 50,
}: ResizableDividerProps) {
  const [isDragging, setIsDragging] = useState(false);
  const dividerRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef<number>(0);
  const startWidthRef = useRef<number>(initialLeftWidth);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    if (dividerRef.current?.parentElement) {
      setIsDragging(true);
      startXRef.current = e.clientX;
      const container = dividerRef.current.parentElement as HTMLElement;
      const leftPanel = container.children[0] as HTMLElement;
      if (leftPanel) {
        startWidthRef.current = (leftPanel.clientWidth / container.clientWidth) * 100;
      }
    }
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !dividerRef.current?.parentElement) return;

      const container = dividerRef.current.parentElement as HTMLElement;
      const containerWidth = container.clientWidth;
      const deltaX = e.clientX - startXRef.current;
      const deltaPercent = (deltaX / containerWidth) * 100;
      const newLeftWidthPercent = Math.max(0, Math.min(100, startWidthRef.current + deltaPercent));

      // Ensure minimum widths
      const minLeftPercent = (minLeftWidth / containerWidth) * 100;
      const minRightPercent = (minRightWidth / containerWidth) * 100;

      if (newLeftWidthPercent >= minLeftPercent && newLeftWidthPercent <= 100 - minRightPercent) {
        if (onResize) {
          onResize(newLeftWidthPercent);
        }
      }
    },
    [isDragging, minLeftWidth, minRightWidth, onResize]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <div
      ref={dividerRef}
      className={cn(
        "w-1 bg-gray-300 hover:bg-blue-500 cursor-col-resize transition-colors relative group flex-shrink-0",
        isDragging && "bg-blue-500"
      )}
      onMouseDown={handleMouseDown}
    >
      {/* Hover indicator */}
      <div className="absolute inset-y-0 -left-1 -right-1 bg-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
    </div>
  );
}


