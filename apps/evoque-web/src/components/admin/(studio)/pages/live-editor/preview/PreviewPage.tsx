'use client';

import React from 'react';
import { Page, Section, MenuSection } from '@/types';
import ClientPageRenderer from '@/components/render/ClientPageRenderer';

interface PreviewPageProps {
  page: Page;
  sections: Section[];
  menuSections: MenuSection[];
}

export default function PreviewPage({ page, sections, menuSections }: PreviewPageProps) {
  return (
    <ClientPageRenderer
      page={page}
      sections={sections}
      menuSections={menuSections}
    />
  );
}






