'use client';

import React from 'react';
import { MenuSection, MenuItem } from '@/types';
import MenuSectionRenderer from './MenuSectionRenderer';
import { useVideoLoading } from '@/contexts/VideoLoadingContext';
import DeferredContent from './DeferredContent';

interface MenuSectionsRendererProps {
  header?: MenuSection;
  footer?: MenuSection;
  menuItems?: MenuItem[];
}

export default function MenuSectionsRenderer({ header, footer, menuItems }: MenuSectionsRendererProps) {
  const { videosLoaded } = useVideoLoading();

  // Render header immediately, footer can wait for videos if needed
  return (
    <>
      {/* Header renders immediately - no waiting for videos */}
      {header && (
        <MenuSectionRenderer menuSection={header} menuItems={menuItems} />
      )}
      {/* Footer renders after videos load */}
      {footer && videosLoaded && (
        <DeferredContent delay={100}>
          <MenuSectionRenderer menuSection={footer} menuItems={menuItems} />
        </DeferredContent>
      )}
    </>
  );
}

