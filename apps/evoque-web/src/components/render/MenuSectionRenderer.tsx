'use client';

import React, { useEffect, useRef } from 'react';
import { MenuSection, MenuItem } from '@/types';
import Header from './menu-sections/Header';
import Footer from './menu-sections/Footer';
import { NavigationHeader, BrandFooter } from '@/components/navigation';

interface MenuSectionRendererProps {
  menuSection: MenuSection;
  menuItems?: MenuItem[];
  useComponentized?: boolean; // Option to use new componentized components
}

// Component to handle header spacing for sections
function HeaderSpacer({ headerElement }: { headerElement: React.ReactNode }) {
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let resizeObserver: ResizeObserver | null = null;

    const updateSpacing = () => {
      if (wrapperRef.current) {
        const header = wrapperRef.current.querySelector('header');
        if (header) {
          const height = header.offsetHeight;
          // Apply padding-top to main element to push sections down
          const mainElements = document.querySelectorAll('main');
          mainElements.forEach((main) => {
            (main as HTMLElement).style.paddingTop = `${height}px`;
          });
        }
      }
    };

    // Wait for header to render, then measure
    const timeoutId = setTimeout(() => {
      updateSpacing();
      
      // Use ResizeObserver to detect header size changes after initial render
      if (wrapperRef.current && 'ResizeObserver' in window) {
        const header = wrapperRef.current.querySelector('header');
        if (header) {
          resizeObserver = new ResizeObserver(updateSpacing);
          resizeObserver.observe(header);
        }
      }
    }, 100);

    // Update on resize
    window.addEventListener('resize', updateSpacing);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', updateSpacing);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      // Cleanup: remove padding when component unmounts
      const mainElements = document.querySelectorAll('main');
      mainElements.forEach((main) => {
        (main as HTMLElement).style.paddingTop = '';
      });
    };
  }, []);

  return (
    <div ref={wrapperRef}>
      {headerElement}
    </div>
  );
}

export default function MenuSectionRenderer({ 
  menuSection, 
  menuItems,
  useComponentized = false // Default to using responsive Header/Footer components
}: MenuSectionRendererProps) {
  if (!menuSection || !menuSection.isActive) {
    return null;
  }

  // Use componentized components if enabled
  if (useComponentized) {
    switch (menuSection.type) {
      case 'HEADER':
        return (
          <HeaderSpacer
            headerElement={
              <NavigationHeader
                logo={menuSection.content?.logo as string}
                logoAlt={menuSection.content?.logoAlt as string || `${menuSection.name} Logo`}
                links={menuSection.content?.links as Array<{ label: string; url: string; isExternal?: boolean }> || (menuItems || []).map(item => ({
                  label: item.label,
                  url: item.url,
                  isExternal: item.isExternal
                }))}
              />
            }
          />
        );
      case 'FOOTER':
        // Support both linkGroups and links for backward compatibility
        const footerLinkGroups = menuSection.content?.linkGroups as Array<{ links: MenuItem[] }> || [];
        const footerLinks = menuSection.content?.links as MenuItem[] || [];
        // Convert MenuItem[] to LinkGroup format
        const linkGroups = footerLinkGroups.length > 0
          ? footerLinkGroups.map(group => ({
              links: group.links
                .filter(item => item.isActive)
                .sort((a, b) => a.order - b.order)
                .map(item => ({
                  label: item.label,
                  url: item.url,
                  isExternal: item.isExternal || false
                }))
            }))
          : footerLinks.length > 0 ? [{
              links: footerLinks
                .filter(item => item.isActive)
                .sort((a, b) => a.order - b.order)
                .map(item => ({
                  label: item.label,
                  url: item.url,
                  isExternal: item.isExternal || false
                }))
            }] : [];
        return (
          <BrandFooter
            copyright={menuSection.content?.copyright as string}
            linkGroups={linkGroups}
            content={menuSection.content?.content as string | undefined}
          />
        );
      default:
        return null;
    }
  }

  // Fall back to original components
  switch (menuSection.type) {
    case 'HEADER':
      return (
        <HeaderSpacer
          headerElement={
            <Header menuSection={menuSection} menuItems={menuItems} />
          }
        />
      );
    case 'FOOTER':
      return <Footer menuSection={menuSection} menuItems={menuItems} />;
    default:
      return null;
  }
}

