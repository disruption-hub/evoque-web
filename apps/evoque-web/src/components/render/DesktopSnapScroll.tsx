'use client';

import React, { useEffect, useRef } from 'react';

interface DesktopSnapScrollProps {
  children: React.ReactNode;
}

export default function DesktopSnapScroll({ children }: DesktopSnapScrollProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isScrolling = useRef(false);
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null);
  const currentSectionRef = useRef(0);
  const lastSectionChangeTime = useRef(0);
  const wheelDebounceTimeout = useRef<NodeJS.Timeout | null>(null);
  const lastScrollDirection = useRef<'up' | 'down' | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Only enable on desktop
    const isDesktop = () => window.innerWidth >= 768;
    if (!isDesktop()) return;

    const mainElement = container.querySelector('main');
    if (!mainElement) return;
    
    const sections = Array.from(mainElement.children) as HTMLElement[];

    const snapToSection = (index: number) => {
      if (index < 0 || index >= sections.length) return;
      if (!isDesktop()) return;
      if (isScrolling.current) return;
      
      // Check if enough time has passed since last section change
      const now = Date.now();
      const timeSinceLastChange = now - lastSectionChangeTime.current;
      if (timeSinceLastChange < 300) {
        return;
      }
      
      isScrolling.current = true;
      currentSectionRef.current = index;
      lastSectionChangeTime.current = now;
      
      sections[index].scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });

      // Dispatch scroll event to ensure header detects scroll direction
      const scrollEvent = new Event('scroll', { bubbles: true });
      container.dispatchEvent(scrollEvent);

      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }
      scrollTimeout.current = setTimeout(() => {
        isScrolling.current = false;
        container.dispatchEvent(new Event('scroll', { bubbles: true }));
      }, 500);
    };

    const handleWheel = (e: WheelEvent) => {
      if (!isDesktop()) return;
      if (isScrolling.current) {
        e.preventDefault();
        return;
      }

      e.preventDefault();

      const scrollDirection = e.deltaY > 0 ? 'down' : 'up';
      
      // Clear any pending debounce timeout
      if (wheelDebounceTimeout.current) {
        clearTimeout(wheelDebounceTimeout.current);
      }

      // Debounce wheel events for desktop
      wheelDebounceTimeout.current = setTimeout(() => {
        const directionChanged = lastScrollDirection.current !== scrollDirection;
        
        if (directionChanged) {
          lastScrollDirection.current = scrollDirection;
          
          if (scrollDirection === 'down') {
            snapToSection(Math.min(currentSectionRef.current + 1, sections.length - 1));
          } else {
            snapToSection(Math.max(currentSectionRef.current - 1, 0));
          }
        } else {
          if (scrollDirection === 'down') {
            snapToSection(Math.min(currentSectionRef.current + 1, sections.length - 1));
          } else {
            snapToSection(Math.max(currentSectionRef.current - 1, 0));
          }
        }
      }, 100);
    };

    // Find current section based on scroll position
    const updateCurrentSection = () => {
      if (!isDesktop()) return;
      
      const scrollTop = container.scrollTop;
      const viewportHeight = window.innerHeight;
      
      sections.forEach((section, index) => {
        const sectionTop = section.offsetTop;
        
        if (scrollTop + (viewportHeight / 2) >= sectionTop && 
            scrollTop + (viewportHeight / 2) < sectionTop + section.offsetHeight) {
          currentSectionRef.current = index;
        }
      });
    };

    // Handle window resize
    const handleResize = () => {
      if (!isDesktop()) {
        // If resized to mobile, disable snap scroll
        container.removeEventListener('wheel', handleWheel);
        container.removeEventListener('scroll', updateCurrentSection);
      } else {
        // If resized to desktop, enable snap scroll
        container.addEventListener('wheel', handleWheel, { passive: false });
        container.addEventListener('scroll', updateCurrentSection, { passive: true });
        updateCurrentSection();
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    container.addEventListener('scroll', updateCurrentSection, { passive: true });
    window.addEventListener('resize', handleResize);

    // Initial section detection
    updateCurrentSection();

    return () => {
      container.removeEventListener('wheel', handleWheel);
      container.removeEventListener('scroll', updateCurrentSection);
      window.removeEventListener('resize', handleResize);
      
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }
      if (wheelDebounceTimeout.current) {
        clearTimeout(wheelDebounceTimeout.current);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      data-snap-scroll-container-desktop
      className="flex-1 overflow-y-auto overflow-x-hidden snap-y snap-mandatory w-full"
      style={{
        height: '100vh',
        maxHeight: '100vh',
        scrollBehavior: 'smooth',
        scrollSnapType: 'y mandatory',
        paddingTop: 0,
        marginTop: 0,
        overflowX: 'hidden',
        overscrollBehavior: 'none',
        overscrollBehaviorY: 'none',
      }}
    >
      {children}
    </div>
  );
}

