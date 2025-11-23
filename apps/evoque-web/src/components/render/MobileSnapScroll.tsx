'use client';

import React, { useEffect, useRef } from 'react';

interface MobileSnapScrollProps {
  children: React.ReactNode;
}

export default function MobileSnapScroll({ children }: MobileSnapScrollProps) {
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

    // Only enable on mobile
    const isMobile = () => window.innerWidth < 768;
    if (!isMobile()) return;

    // Prevent body scroll bounce
    const preventBodyBounce = (e: TouchEvent) => {
      const target = e.target as HTMLElement;
      // Allow scrolling within the container
      if (container.contains(target) || container === target) {
        return;
      }
      // Prevent default on body
      if (document.body.scrollTop === 0 || 
          document.body.scrollHeight === document.body.scrollTop + window.innerHeight) {
        e.preventDefault();
      }
    };

    // Apply overscroll-behavior to body
    const originalBodyStyle = document.body.style.overscrollBehavior;
    const originalBodyStyleY = document.body.style.overscrollBehaviorY;
    const originalBodyWebkitStyle = (document.body.style as any).webkitOverscrollBehavior;
    
    document.body.style.overscrollBehavior = 'none';
    document.body.style.overscrollBehaviorY = 'none';
    (document.body.style as any).webkitOverscrollBehavior = 'none';
    
    document.body.addEventListener('touchmove', preventBodyBounce, { passive: false });

    let touchStartY = 0;
    let touchEndY = 0;
    const mainElement = container.querySelector('main');
    if (!mainElement) return;
    
    const sections = Array.from(mainElement.children) as HTMLElement[];

    // Prevent scroll bounce (rubber band effect)
    const handleTouchMove = (e: TouchEvent) => {
      if (!isMobile()) return;
      
      const scrollTop = container.scrollTop;
      const scrollHeight = container.scrollHeight;
      const clientHeight = container.clientHeight;
      
      // Prevent bounce at top
      if (scrollTop <= 0 && e.touches[0].clientY > touchStartY) {
        e.preventDefault();
        return;
      }
      
      // Prevent bounce at bottom
      if (scrollTop + clientHeight >= scrollHeight - 1 && e.touches[0].clientY < touchStartY) {
        e.preventDefault();
        return;
      }
    };

    const snapToSection = (index: number) => {
      if (index < 0 || index >= sections.length) return;
      if (!isMobile()) return;
      if (isScrolling.current) return; // Prevent multiple simultaneous snaps
      
      // Check if enough time has passed since last section change (reduced for faster response)
      const now = Date.now();
      const timeSinceLastChange = now - lastSectionChangeTime.current;
      if (timeSinceLastChange < 250) {
        return; // Prevent rapid section changes but allow faster response
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
        // Dispatch another scroll event after animation completes
        container.dispatchEvent(new Event('scroll', { bubbles: true }));
      }, 400); // Reduced timeout for faster response
    };

    const handleWheel = (e: WheelEvent) => {
      if (!isMobile()) return;
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

      // Reduced debounce for faster, Instagram-like response
      wheelDebounceTimeout.current = setTimeout(() => {
        // Check if direction changed (allows immediate response to direction change)
        const directionChanged = lastScrollDirection.current !== scrollDirection;
        
        if (directionChanged) {
          lastScrollDirection.current = scrollDirection;
          
          if (scrollDirection === 'down') {
            // Scrolling down - next section
            snapToSection(Math.min(currentSectionRef.current + 1, sections.length - 1));
          } else {
            // Scrolling up - previous section
            snapToSection(Math.max(currentSectionRef.current - 1, 0));
          }
        } else {
          // Same direction - snapToSection will check if enough time has passed
          if (scrollDirection === 'down') {
            snapToSection(Math.min(currentSectionRef.current + 1, sections.length - 1));
          } else {
            snapToSection(Math.max(currentSectionRef.current - 1, 0));
          }
        }
      }, 50); // Reduced to 50ms for faster, Instagram-like response
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (!isMobile()) return;
      touchStartY = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!isMobile()) return;
      
      touchEndY = e.changedTouches[0].clientY;
      const diff = touchStartY - touchEndY;

      // Reduced threshold for faster, more responsive touch gestures
      if (Math.abs(diff) > 30 && !isScrolling.current) {
        if (diff > 0) {
          // Swipe up - next section
          snapToSection(Math.min(currentSectionRef.current + 1, sections.length - 1));
        } else {
          // Swipe down - previous section
          snapToSection(Math.max(currentSectionRef.current - 1, 0));
        }
      }
    };

    // Find current section based on scroll position
    const updateCurrentSection = () => {
      if (!isMobile()) return;
      
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

    container.addEventListener('wheel', handleWheel, { passive: false });
    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });
    container.addEventListener('scroll', updateCurrentSection, { passive: true });

    // Initial section detection
    updateCurrentSection();

    return () => {
      container.removeEventListener('wheel', handleWheel);
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      container.removeEventListener('scroll', updateCurrentSection);
      document.body.removeEventListener('touchmove', preventBodyBounce);
      
      // Restore original body styles
      document.body.style.overscrollBehavior = originalBodyStyle;
      document.body.style.overscrollBehaviorY = originalBodyStyleY;
      (document.body.style as any).webkitOverscrollBehavior = originalBodyWebkitStyle;
      
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
      data-snap-scroll-container
      className="flex-1 overflow-y-auto overflow-x-hidden md:overflow-visible snap-y snap-mandatory md:snap-none w-full"
      style={{
        height: '100vh',
        maxHeight: '100vh',
        scrollBehavior: 'smooth',
        WebkitOverflowScrolling: 'touch',
        scrollSnapType: 'y mandatory',
        paddingTop: 0,
        marginTop: 0,
        overflowX: 'hidden',
        overscrollBehavior: 'none',
        overscrollBehaviorY: 'none',
        ...({ WebkitOverscrollBehavior: 'none' } as any)
      }}
    >
      {children}
    </div>
  );
}

