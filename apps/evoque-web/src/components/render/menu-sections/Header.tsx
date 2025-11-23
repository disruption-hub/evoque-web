'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, X } from 'lucide-react';
import { MenuSection, MenuItem } from '@/types';
import { Button } from '@/components/ui/button';
import { getBrandColor } from '@/config/brand-colors';
import { useHeader } from '@/contexts/HeaderContext';

interface HeaderProps {
  menuSection: MenuSection;
  menuItems?: MenuItem[];
}

export default function Header({ menuSection, menuItems = [] }: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isHeaderVisible, setIsHeaderVisible } = useHeader();
  const [isInFirstSection, setIsInFirstSection] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const autoHideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const wasHeaderVisibleRef = useRef(true);
  const headerShownTimeRef = useRef<number | null>(null);
  const previousSectionRef = useRef(0);

  // Handle scroll to hide/show header - listen to both window and snap scroll container
  useEffect(() => {
    let snapScrollContainer: HTMLElement | null = null;
    let timeoutId: NodeJS.Timeout | null = null;
    
    // Detect which section we're in
    const detectCurrentSection = (): number => {
      const isMobile = window.innerWidth < 768;
      let scrollContainer: HTMLElement | null = null;
      
      if (isMobile) {
        scrollContainer = snapScrollContainer || document.querySelector('[data-snap-scroll-container]') as HTMLElement;
      } else {
        // On desktop, also check for desktop snap scroll container
        scrollContainer = document.querySelector('[data-snap-scroll-container-desktop]') as HTMLElement;
      }
      
      const container = scrollContainer || document;
      const mainElement = scrollContainer 
        ? scrollContainer.querySelector('main') || scrollContainer
        : document.querySelector('main');
      
      if (!mainElement) return 0;
      
      const sections = Array.from(mainElement.children) as HTMLElement[];
      if (sections.length === 0) return 0;
      
      const scrollTop = scrollContainer?.scrollTop || window.scrollY;
      const viewportHeight = window.innerHeight;
      
      // Find which section is currently most visible
      for (let i = 0; i < sections.length; i++) {
        const section = sections[i];
        const sectionTop = scrollContainer 
          ? section.offsetTop
          : section.getBoundingClientRect().top + window.scrollY;
        const sectionHeight = section.offsetHeight;
        const sectionBottom = sectionTop + sectionHeight;
        
        // If section is at least 50% visible, consider it the current section
        if (scrollTop + (viewportHeight / 2) >= sectionTop && 
            scrollTop + (viewportHeight / 2) < sectionBottom) {
          return i;
        }
      }
      
      // Default to first section if at top
      if (scrollTop < 10) return 0;
      
      // Otherwise, find the closest section
      for (let i = 0; i < sections.length; i++) {
        const section = sections[i];
        const sectionTop = scrollContainer 
          ? section.offsetTop
          : section.getBoundingClientRect().top + window.scrollY;
        if (scrollTop < sectionTop) {
          return Math.max(0, i - 1);
        }
      }
      
      return sections.length - 1;
    };
    
    const handleScroll = () => {
      const isMobile = window.innerWidth < 768;
      
      let currentScrollY = 0;
      
      if (isMobile) {
        // Try to get snap scroll container if not already cached
        if (!snapScrollContainer) {
          snapScrollContainer = document.querySelector('[data-snap-scroll-container]') as HTMLElement;
        }
        // Use snap scroll container scroll position on mobile
        if (snapScrollContainer) {
          currentScrollY = snapScrollContainer.scrollTop;
        } else {
          // Fallback to window scroll if container not found
          currentScrollY = window.scrollY;
        }
      } else {
        // On desktop, try desktop snap scroll container first
        const desktopContainer = document.querySelector('[data-snap-scroll-container-desktop]') as HTMLElement;
        if (desktopContainer) {
          currentScrollY = desktopContainer.scrollTop;
        } else {
          // Fallback to window scroll
        currentScrollY = window.scrollY;
        }
      }
      
      // Detect current section
      const currentSection = detectCurrentSection();
      const previousSection = previousSectionRef.current;
      const inFirstSection = currentSection === 0;
      
      setIsInFirstSection(inFirstSection);
      
      // Clear any auto-hide timeout (we don't use it anymore)
        if (autoHideTimeoutRef.current) {
          clearTimeout(autoHideTimeoutRef.current);
          autoHideTimeoutRef.current = null;
        }
      
      // First section: always visible
      if (inFirstSection) {
        setIsHeaderVisible(true);
        wasHeaderVisibleRef.current = true;
        headerShownTimeRef.current = null;
        previousSectionRef.current = currentSection;
        setLastScrollY(currentScrollY);
        return;
      }
      
      // Not in first section: determine visibility based on scroll direction
      if (currentSection > previousSection) {
        // Scrolled to next section (down) - hide header
        setIsHeaderVisible(false);
        wasHeaderVisibleRef.current = false;
        headerShownTimeRef.current = null;
      } else if (currentSection < previousSection) {
        // Scrolled to previous section (up) - show header and keep it visible
        setIsHeaderVisible(true);
        wasHeaderVisibleRef.current = true;
            headerShownTimeRef.current = null;
          }
      // If same section, keep current visibility state
      
      previousSectionRef.current = currentSection;
      setLastScrollY(currentScrollY);
    };

    // Listen to window scroll (desktop fallback)
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Try to set up snap scroll container listeners
    const setupSnapScrollListeners = () => {
      // Mobile snap scroll container
      const mobileContainer = document.querySelector('[data-snap-scroll-container]') as HTMLElement;
      if (mobileContainer) {
        mobileContainer.addEventListener('scroll', handleScroll, { passive: true });
        snapScrollContainer = mobileContainer;
      }
      
      // Desktop snap scroll container
      const desktopContainer = document.querySelector('[data-snap-scroll-container-desktop]') as HTMLElement;
      if (desktopContainer) {
        desktopContainer.addEventListener('scroll', handleScroll, { passive: true });
      }
      
      return mobileContainer || desktopContainer;
    };
    
    // Try immediately, then retry after a short delay if not found
    if (!setupSnapScrollListeners()) {
      timeoutId = setTimeout(() => {
        setupSnapScrollListeners();
      }, 100);
    }
    
    // Initial call to set correct state
    handleScroll();
    
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      if (autoHideTimeoutRef.current) {
        clearTimeout(autoHideTimeoutRef.current);
        autoHideTimeoutRef.current = null;
      }
      window.removeEventListener('scroll', handleScroll);
      if (snapScrollContainer) {
        snapScrollContainer.removeEventListener('scroll', handleScroll);
      }
      const desktopContainer = document.querySelector('[data-snap-scroll-container-desktop]') as HTMLElement;
      if (desktopContainer) {
        desktopContainer.removeEventListener('scroll', handleScroll);
      }
    };
  }, [lastScrollY]);

  if (!menuSection || !menuSection.isActive) {
    return null;
  }

  // Use values from JSON data
  const logo = menuSection.content?.logo as string | undefined;
  const logoAlt = (menuSection.content?.logoAlt as string) || 'Logo';
  // Use links from JSON if available, otherwise fall back to menuItems
  const contentLinks = menuSection.content?.links as Array<{ label: string; url: string; isExternal?: boolean }> | undefined;
  const activeMenuItems = contentLinks && contentLinks.length > 0
    ? contentLinks.map((link, index) => ({
        id: `json-link-${index}`,
        label: link.label,
        url: link.url,
        isExternal: link.isExternal || false,
        order: index,
        isActive: true
      }))
    : (menuItems || []).filter(item => item.isActive).sort((a, b) => a.order - b.order);

  // Check if logo exists and is not an empty string
  const hasLogo = logo && logo.trim() !== '';

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Always render header, but control visibility based on scroll behavior

  return (
    <header 
      className={`fixed top-0 left-0 right-0 w-full z-50 transition-transform duration-300 ease-in-out ${
        isHeaderVisible ? 'translate-y-0' : '-translate-y-full'
      }`}
      style={{ 
        backgroundColor: getBrandColor('white'),
        zIndex: isMobileMenuOpen ? 10000 : 50
      }}
    >
      <div className="container mx-auto px-4 py-4">
        {/* Main header row */}
        <div className="flex items-center justify-between">
          {/* Left: Logo */}
          <div className="flex items-center flex-shrink-0">
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
          </div>

          {/* Center: Desktop Navigation - Centered with white container */}
          <div className="hidden lg:flex flex-1 justify-center items-center">
            <nav 
              className="flex items-center space-x-6 w-auto"
              style={{
                backgroundColor: getBrandColor('white'),
                borderRadius: '14px',
                border: `1px solid ${getBrandColor('deepNavy')}20`,
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                padding: '12px 20px',
              }}
            >
              {activeMenuItems
                .filter(item => item.label !== 'Join Us' && item.label !== 'Sign In')
                .map((item) => (
                  <Link
                    key={item.id}
                    href={item.url}
                    target={item.isExternal ? '_blank' : undefined}
                    rel={item.isExternal ? 'noopener noreferrer' : undefined}
                    className="transition-colors whitespace-nowrap text-sm lg:text-[15px]"
                    style={{ 
                      color: getBrandColor('black'),
                      textDecoration: 'none'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = getBrandColor('secondaryBlue');
                      e.currentTarget.style.opacity = '0.8';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = getBrandColor('black');
                      e.currentTarget.style.opacity = '1';
                    }}
                  >
                    {item.label}
                  </Link>
                ))}
            </nav>
          </div>

          {/* Right: Desktop CTA Buttons or Mobile Menu Button */}
          <div className="flex items-center flex-shrink-0">
            {/* Desktop CTA Buttons */}
            <div className="hidden lg:flex items-center space-x-2">
              {activeMenuItems
                .filter(item => item.label === 'Join Us' || item.label === 'Sign In')
                .map((item) => {
                  const isSignIn = item.label === 'Sign In';
                  return (
                    <Button
                      key={item.id}
                      asChild
                      variant={item.label === 'Join Us' ? 'default' : 'outline'}
                      size="sm"
                      className="whitespace-nowrap"
                      style={isSignIn ? {
                        borderColor: getBrandColor('deepNavy'),
                        color: getBrandColor('deepNavy'),
                        backgroundColor: 'transparent'
                      } : undefined}
                      onMouseEnter={isSignIn ? (e) => {
                        e.currentTarget.style.backgroundColor = getBrandColor('deepNavy') + '10';
                      } : undefined}
                      onMouseLeave={isSignIn ? (e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      } : undefined}
                    >
                      <Link href={item.url}>
                        {item.label}
                      </Link>
                    </Button>
                  );
                })}
            </div>

            {/* Mobile Menu Button - only visible on mobile */}
            <button
              onClick={toggleMobileMenu}
              className="lg:hidden p-2 rounded-md transition-colors"
              style={{ color: getBrandColor('black') }}
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Sidebar Overlay */}
        {isMobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-[9998] md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
            style={{  height: '100vh' }}
          />
        )}

        {/* Mobile Sidebar Menu */}
        <div
          className={`fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-white shadow-2xl z-[9999] transform transition-transform duration-300 ease-in-out md:hidden ${
            isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
          style={{ 
            backgroundColor: getBrandColor('white'),
            zIndex: 9999,
            height: '100vh'
          }}
        >
          <div className="flex flex-col h-full">
            {/* Sidebar Header */}
            <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: getBrandColor('deepNavy') + '20', paddingBottom: '8px' }}>
              {hasLogo && (
                <Link href="/" className="flex items-center" onClick={() => setIsMobileMenuOpen(false)}>
                  <Image
                    src={logo}
                    alt={logoAlt}
                    width={120}
                    height={40}
                    className="h-8 w-auto"
                  />
                </Link>
              )}
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 rounded-md transition-colors"
                style={{ color: getBrandColor('deepNavy') }}
                aria-label="Close menu"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Sidebar Content - Scrollable */}
            <div className="flex-1 overflow-y-auto p-4" style={{ paddingTop: '8px' }}>
              {/* Mobile Navigation - Only links (no buttons) */}
              <nav className="flex flex-col space-y-2">
                {activeMenuItems
                  .filter(item => item.label !== 'Join Us' && item.label !== 'Sign In')
                  .map((item) => (
                    <Link
                      key={item.id}
                      href={item.url}
                      target={item.isExternal ? '_blank' : undefined}
                      rel={item.isExternal ? 'noopener noreferrer' : undefined}
                      className="transition-colors py-3 px-4 rounded-md text-base font-medium"
                      style={{ 
                        color: getBrandColor('deepNavy'),
                        backgroundColor: 'transparent'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = getBrandColor('white');
                        e.currentTarget.style.backgroundColor = getBrandColor('deepNavy');
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = getBrandColor('deepNavy');
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {item.label}
                    </Link>
                  ))}
              </nav>
            </div>

            {/* Fixed Bottom Section - Buttons */}
            <div className="p-4 border-t bg-white" style={{ borderColor: getBrandColor('deepNavy') + '20' }}>
              <nav className="flex flex-col space-y-2" style={{ marginBottom: '120px' }}>
                {activeMenuItems
                  .filter(item => item.label === 'Join Us' || item.label === 'Sign In')
                  .map((item) => (
                    <Button
                      key={item.id}
                      asChild
                      variant={item.label === 'Join Us' ? 'default' : 'outline'}
                      size="sm"
                      className="w-full"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Link href={item.url}>
                        {item.label}
                      </Link>
                    </Button>
                  ))}
              </nav>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

