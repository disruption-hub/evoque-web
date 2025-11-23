'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getBrandColor } from '@/config/brand-colors';
import { Button } from '@/components/ui/button';

interface NavLink {
  label: string;
  url: string;
  isExternal?: boolean;
}

interface NavigationHeaderProps {
  logo?: string;
  logoAlt?: string;
  links: NavLink[];
}

export default function NavigationHeader({
  logo: propLogo,
  logoAlt: propLogoAlt = 'Logo',
  links: propLinks
}: NavigationHeaderProps) {
  // Use values from props (JSON data)
  const logo = propLogo;
  const logoAlt = propLogoAlt;
  const links = propLinks;

  // Check if logo exists and is not an empty string
  const hasLogo = logo && logo.trim() !== '';

  return (
    <header
      className="w-full shadow-md sticky top-0 z-50"
      style={{ backgroundColor: getBrandColor('white') }}
    >
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        {hasLogo && (
          <Link href="/" className="flex items-center">
            <Image
              src={logo}
              alt={logoAlt}
              width={120}
              height={40}
              className="h-10 w-auto"
            />
          </Link>
        )}
        <nav className="flex items-center space-x-6">
          {links.map((link) => {
            const isButton = link.label === 'Join Us' || link.label === 'Sign In';
            
            if (isButton) {
              return (
                <Button
                  key={link.url}
                  asChild
                  variant={link.label === 'Join Us' ? 'default' : 'outline'}
                  size="sm"
                >
                  <Link href={link.url}>
                    {link.label}
                  </Link>
                </Button>
              );
            }
            
            return (
              <Link
                key={link.url}
                href={link.url}
                target={link.isExternal ? '_blank' : undefined}
                rel={link.isExternal ? 'noopener noreferrer' : undefined}
                className="transition-colors font-medium"
                style={{ color: getBrandColor('deepNavy') }}
                onMouseEnter={(e) => e.currentTarget.style.color = getBrandColor('secondaryBlue')}
                onMouseLeave={(e) => e.currentTarget.style.color = getBrandColor('deepNavy')}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}

