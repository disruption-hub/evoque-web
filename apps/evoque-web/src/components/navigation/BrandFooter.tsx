'use client';

import React from 'react';
import Link from 'next/link';
import { getBrandColor } from '@/config/brand-colors';
import { MarkdownRenderer } from '@/components/ui/MarkdownRenderer';

interface SocialLink {
  platform: string;
  url: string;
  icon?: string;
}

interface LinkGroup {
  links: Array<{
    label: string;
    url: string;
    isExternal?: boolean;
  }>;
}

interface BrandFooterProps {
  copyright?: string;
  socialLinks?: SocialLink[];
  links?: Array<{
    label: string;
    url: string;
    isExternal?: boolean;
  }>;
  linkGroups?: LinkGroup[];
  content?: string;
}

export default function BrandFooter({
  copyright,
  socialLinks,
  links: propLinks,
  linkGroups: propLinkGroups,
  content
}: BrandFooterProps) {
  // Use link groups from props (JSON data)
  const linkGroups = propLinkGroups && propLinkGroups.length > 0
    ? propLinkGroups
    : propLinks && propLinks.length > 0 ? [{
        links: propLinks
      }] : [];

  return (
    <footer
      className="w-full mt-auto"
      style={{ backgroundColor: getBrandColor('deepNavy'), color: getBrandColor('white') }}
    >
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0 gap-6">
          {linkGroups.length > 0 && (
            <div className="flex flex-col md:flex-row gap-6 items-center">
              {linkGroups.map((group, groupIndex) => (
                <nav key={groupIndex} className="flex flex-wrap items-center gap-4 md:gap-6">
                  {group.links.map((link, linkIndex) => (
                    <Link
                      key={`${groupIndex}-${linkIndex}`}
                      href={link.url}
                      target={link.isExternal ? '_blank' : undefined}
                      rel={link.isExternal ? 'noopener noreferrer' : undefined}
                      className="transition-colors"
                      style={{ color: getBrandColor('white') }}
                      onMouseEnter={(e) => e.currentTarget.style.color = getBrandColor('accentElectricBlue')}
                      onMouseLeave={(e) => e.currentTarget.style.color = getBrandColor('white')}
                    >
                      {link.label}
                    </Link>
                  ))}
                </nav>
              ))}
            </div>
          )}
          {socialLinks && socialLinks.length > 0 && (
            <div className="flex items-center space-x-4">
              {socialLinks.map((social) => (
                <a
                  key={social.platform}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors text-2xl"
                  style={{ color: getBrandColor('white') }}
                  onMouseEnter={(e) => e.currentTarget.style.color = getBrandColor('accentElectricBlue')}
                  onMouseLeave={(e) => e.currentTarget.style.color = getBrandColor('white')}
                  aria-label={social.platform}
                >
                  {social.icon || social.platform}
                </a>
              ))}
            </div>
          )}
          {content ? (
            <div className="prose prose-sm max-w-none" style={{ color: '#e2e8f0' }}>
              <MarkdownRenderer content={content} />
            </div>
          ) : copyright && (
            <p className="text-sm text-center md:text-right" style={{ color: '#e2e8f0' }}>
              {copyright}
            </p>
          )}
        </div>
      </div>
    </footer>
  );
}

