'use client';

import React from 'react';
import { Section } from '@/types';
import { useVideoLoading } from '@/contexts/VideoLoadingContext';
import DeferredContent from './DeferredContent';

interface SectionContentRendererProps {
  section: Section;
  children: React.ReactNode;
}

export default function SectionContentRenderer({ section, children }: SectionContentRendererProps) {
  const { videosLoaded } = useVideoLoading();

  // Show section structure immediately (skeleton)
  // Render content after videos load
  return (
    <>
      {/* Show section structure immediately */}
      <div style={{ minHeight: '100vh' }}>
        {videosLoaded ? (
          <DeferredContent delay={50}>
            {children}
          </DeferredContent>
        ) : (
          // Show skeleton/placeholder while videos load
          <div style={{ minHeight: '100vh', opacity: 0.3 }} />
        )}
      </div>
    </>
  );
}

