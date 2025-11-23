'use client';

import React from 'react';

interface SectionContentWrapperProps {
  children: React.ReactNode;
}

/**
 * Wraps section content - renders immediately to prioritize video loading
 * Videos with priority={true} and preload="auto" will load first
 * This ensures section videos are the first elements to load
 */
export default function SectionContentWrapper({ children }: SectionContentWrapperProps) {
  // Render immediately - videos have priority={true} and preload="auto"
  // which ensures they are prioritized by the browser and load first
  // VideoPreloadLinks in PageRenderer also adds <link rel="preload"> tags
  // for even faster video loading
  return <>{children}</>;
}

