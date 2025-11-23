import React from 'react';
import { Page, Section, MenuSection, MenuItem } from '@/types';
import MenuSectionRenderer from './MenuSectionRenderer';
import SectionRenderer from './SectionRenderer';
import MobileSnapScroll from './MobileSnapScroll';
import DesktopSnapScroll from './DesktopSnapScroll';
import SectionWrapper from './SectionWrapper';
import DeferredContent from './DeferredContent';
import VideoPreloader from './VideoPreloader';
import VideoPreloadLinks from './VideoPreloadLinks';
import { VideoLoadingProvider } from '@/contexts/VideoLoadingContext';
import MenuSectionsRenderer from './MenuSectionsRenderer';

interface PageRendererProps {
  page: Page;
  sections: Section[];
  menuSections: MenuSection[];
  menuItems?: MenuItem[];
}

export default async function PageRenderer({
  page,
  sections,
  menuSections,
  menuItems = []
}: PageRendererProps) {
  if (!page || !page.isActive) {
    return null;
  }

  // Get sections for this page, sorted by order
  const pageSections = sections
    .filter(section => page.sections.includes(section.id))
    .sort((a, b) => a.order - b.order);

  // Get menu sections for this page, sorted by order
  const pageMenuSections = menuSections
    .filter(ms => page.menuSections?.includes(ms.id))
    .sort((a, b) => a.order - b.order);

  // Separate header and footer
  const header = pageMenuSections.find(ms => ms.type === 'HEADER');
  const footer = pageMenuSections.find(ms => ms.type === 'FOOTER');

  // Only enable MobileSnapScroll for home page (slug === '')
  const isHomePage = page.slug === '';

  return (
    <VideoLoadingProvider>
      {/* Add preload links for videos to speed up loading - these load FIRST */}
      <VideoPreloadLinks sections={pageSections} />
      <VideoPreloader sections={pageSections}>
        <div 
          className="min-h-screen flex flex-col overflow-x-hidden w-full relative"
          style={{
            overscrollBehavior: 'none',
            overscrollBehaviorY: 'none',
            WebkitOverscrollBehavior: 'none'
          } as React.CSSProperties}
        >
          {/* Render sections immediately - videos with priority={true} will load first */}
          {isHomePage ? (
            <>
              <div className="block md:hidden">
                <MobileSnapScroll>
                  <main className="flex-grow w-full overflow-x-hidden" style={{ paddingTop: 0, marginTop: 0 }}>
                    {pageSections.map((section) => (
                      <SectionWrapper
                        key={section.id} 
                        className="snap-start snap-always min-h-screen"
                        style={{ paddingTop: 0, marginTop: 0 }}
                      >
                        <SectionRenderer section={section} />
                      </SectionWrapper>
                    ))}
                    {/* Footer as the last snap section - renders after videos load */}
                    {footer && (
                      <SectionWrapper key="footer" className="snap-start snap-always min-h-screen">
                        <MenuSectionsRenderer footer={footer} menuItems={menuItems} />
                      </SectionWrapper>
                    )}
                  </main>
                </MobileSnapScroll>
              </div>
              <div className="hidden md:block">
                <DesktopSnapScroll>
                  <main className="flex-grow w-full overflow-x-hidden" style={{ paddingTop: 0, marginTop: 0 }}>
                    {pageSections.map((section) => (
                      <SectionWrapper
                        key={section.id} 
                        className="snap-start snap-always min-h-screen"
                        style={{ paddingTop: 0, marginTop: 0 }}
                      >
                        <SectionRenderer section={section} />
                      </SectionWrapper>
                    ))}
                    {/* Footer as the last snap section - renders after videos load */}
                    {footer && (
                      <SectionWrapper key="footer" className="snap-start snap-always min-h-screen">
                        <MenuSectionsRenderer footer={footer} menuItems={menuItems} />
                      </SectionWrapper>
                    )}
                  </main>
                </DesktopSnapScroll>
              </div>
            </>
          ) : (
            <main className="flex-grow w-full overflow-x-hidden">
              {pageSections.map((section) => (
                <SectionWrapper key={section.id}>
                  <SectionRenderer section={section} />
                </SectionWrapper>
              ))}
              {/* Footer renders after videos load */}
              <MenuSectionsRenderer footer={footer} menuItems={menuItems} />
            </main>
          )}
          
          {/* Header renders immediately - no waiting for videos */}
          {header && (
            <MenuSectionsRenderer header={header} menuItems={menuItems} />
          )}
        </div>
      </VideoPreloader>
    </VideoLoadingProvider>
  );
}

