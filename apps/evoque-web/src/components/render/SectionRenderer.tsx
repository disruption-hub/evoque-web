import React from 'react';
import { Section } from '@/types';
import SectionComponentRenderer from './SectionComponentRenderer';
import SectionContentWrapper from './SectionContentWrapper';

interface SectionRendererProps {
  section: Section;
}

export default async function SectionRenderer({ section }: SectionRendererProps) {
  if (!section || !section.isActive) {
    return null;
  }

  // Render section content immediately - videos with priority={true} will load first
  // Section structure (SectionWrapper) is already visible
  const sectionContent = await SectionComponentRenderer({ section });

  // Render immediately - videos are prioritized via priority={true} prop
  // SectionContentWrapper now allows immediate rendering
  return (
    <SectionContentWrapper>
      {sectionContent}
    </SectionContentWrapper>
  );
}

