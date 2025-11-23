'use client';

import React from 'react';
import { useHeader } from '@/contexts/HeaderContext';

interface SectionWrapperProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export default function SectionWrapper({ children, className = '', style }: SectionWrapperProps) {
  const { isHeaderVisible, hideHeader } = useHeader();

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only hide header if it's currently visible
    // Don't interfere with other interactions when header is hidden
    if (isHeaderVisible) {
      // Check if the click target is an interactive element (button, link, input, etc.)
      const target = e.target as HTMLElement;
      const isInteractive = 
        target.tagName === 'BUTTON' ||
        target.tagName === 'A' ||
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.closest('button') ||
        target.closest('a') ||
        target.closest('input') ||
        target.closest('textarea') ||
        target.closest('select') ||
        target.closest('[role="button"]') ||
        target.closest('[onclick]');

      // Only hide header if clicking on non-interactive elements
      if (!isInteractive) {
        hideHeader();
      }
    }
  };

  return (
    <div
      className={className}
      style={style}
      onClick={isHeaderVisible ? handleClick : undefined}
    >
      {children}
    </div>
  );
}

