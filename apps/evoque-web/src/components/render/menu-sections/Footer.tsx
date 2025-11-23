'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { MenuSection, MenuItem } from '@/types';
import { getBrandColor } from '@/config/brand-colors';
import { Button } from '@/components/ui/button';
import { MarkdownRenderer } from '@/components/ui/MarkdownRenderer';

interface LinkGroup {
  title?: string;
  links: Array<{
    label: string;
    url: string;
    isExternal?: boolean;
  }>;
}

interface FooterProps {
  menuSection: MenuSection;
  menuItems?: MenuItem[];
}

export default function Footer({ menuSection, menuItems = [] }: FooterProps) {

  if (!menuSection || !menuSection.isActive) {
    return null;
  }

  // Use link groups from JSON
  const jsonLinkGroups = (menuSection.content?.linkGroups as Array<{ title?: string; links: MenuItem[] }>) || [];
  
  // Use JSON link groups
  const linkGroups = jsonLinkGroups.map(group => ({
      title: group.title,
      links: group.links
        .filter(item => item.isActive)
        .sort((a, b) => a.order - b.order)
        .map(item => ({
          label: item.label,
          url: item.url,
          isExternal: item.isExternal || false
        }))
    }));

  // Separate regular link groups from action group (Join Us, Sign In)
  const { regularGroups, actionGroup } = useMemo<{ regularGroups: LinkGroup[]; actionGroup: LinkGroup | null }>(() => {
    const allRegularLinks: Array<{ label: string; url: string; isExternal?: boolean }> = [];
    let actions: LinkGroup | null = null;

    linkGroups.forEach(group => {
      const actionLinks = group.links.filter(link => 
        link.label === 'Join Us' || link.label === 'Sign In'
      );
      
      if (actionLinks.length > 0) {
        // Create or add to actions group
        if (!actions) {
          actions = {
            title: 'Actions',
            links: actionLinks
          };
        } else {
          actions.links = [...actions.links, ...actionLinks];
        }
      }

      const regularLinks = group.links.filter(link => 
        link.label !== 'Join Us' && link.label !== 'Sign In'
      );
      
      // Collect all regular links into a single array
      allRegularLinks.push(...regularLinks);
    });

    // Combine all regular links into a single "Useful links" group
    const regularGroups: LinkGroup[] = allRegularLinks.length > 0 
      ? [{
          title: 'Useful links',
          links: allRegularLinks
        }]
      : [];

    return {
      regularGroups,
      actionGroup: actions
    };
  }, [linkGroups]);

  // Use logo from JSON
  const logo = menuSection.content?.logo as string | undefined;
  const logoAlt = (menuSection.content?.logoAlt as string) || 'Logo';
  // Check if logo exists and is not an empty string
  const hasLogo = logo && logo.trim() !== '';
  
  // Get content from JSON
  const content = menuSection.content?.content as string | undefined;
  
  // Type guard for actionGroup
  const hasActionGroup = actionGroup !== null && actionGroup !== undefined && actionGroup.links.length > 0;

  return (
    <footer className="w-full min-h-screen md:min-h-0 mt-auto flex items-center" style={{ backgroundColor: getBrandColor('white'), color: getBrandColor('black') }}>
      <div className="container mx-auto px-4 py-6 md:py-8 w-full">
        <div className="flex flex-col gap-6 md:gap-8">
          {/* Logo */}
          {hasLogo && (
            <div className="flex items-center mb-4">
              <Link href="/" className="flex items-center">
                <Image
                  src={logo}
                  alt={logoAlt}
                  width={120}
                  height={40}
                  className="h-10 w-auto"
                />
              </Link>
            </div>
          )}
          {/* Link Groups and MDX Content Row */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 md:gap-8">
            {/* Regular Link Groups */}
            {regularGroups.length > 0 && (
              <div className="flex flex-col sm:flex-row gap-6 md:gap-8 items-start sm:items-start w-full md:w-auto">
                {regularGroups.map((group, groupIndex) => (
                  <div key={groupIndex} className="flex flex-col gap-3">
                    {group.title && (
                      <h3 className="font-bold text-sm sm:text-base" style={{ color: getBrandColor('black') }}>
                        {group.title}
                      </h3>
                    )}
                    <nav className="flex flex-col gap-2">
                      {group.links.map((link, linkIndex) => (
                        <Link
                          key={`${groupIndex}-${linkIndex}`}
                          href={link.url}
                          target={link.isExternal ? '_blank' : undefined}
                          rel={link.isExternal ? 'noopener noreferrer' : undefined}
                          className="transition-colors text-sm sm:text-base whitespace-nowrap hover:opacity-70"
                          style={{ 
                            color: getBrandColor('black'),
                            textDecoration: 'underline'
                          }}
                        >
                          {link.label}
                        </Link>
                      ))}
                    </nav>
                  </div>
                ))}
              </div>
            )}

            {/* Actions Group with Buttons */}
            {hasActionGroup && actionGroup && (
              <div className="flex flex-col gap-3">
                {actionGroup.title && (
                  <h3 className="font-bold text-sm sm:text-base" style={{ color: getBrandColor('black') }}>
                    {actionGroup.title}
                  </h3>
                )}
                <div className="flex flex-col sm:flex-row gap-2">
                  {actionGroup.links.map((link, linkIndex) => {
                    const isSignIn = link.label === 'Sign In';
                    return (
                      <Button
                        key={`action-${linkIndex}`}
                        asChild
                        variant={link.label === 'Join Us' ? 'default' : 'outline'}
                        size="sm"
                        className="whitespace-nowrap"
                        style={isSignIn ? {
                          borderColor: getBrandColor('black'),
                          color: getBrandColor('black'),
                          backgroundColor: 'transparent'
                        } : undefined}
                        onMouseEnter={isSignIn ? (e) => {
                          e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
                        } : undefined}
                        onMouseLeave={isSignIn ? (e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        } : undefined}
                      >
                        <Link href={link.url}>
                          {link.label}
                        </Link>
                      </Button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Content */}
            {content && (
              <div className="prose prose-sm max-w-none w-full md:w-auto text-sm sm:text-base" style={{ color: getBrandColor('black') }}>
                <MarkdownRenderer content={content} />
              </div>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}

