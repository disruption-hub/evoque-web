'use client';

import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register ScrollTrigger plugin
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

interface ScrollAnimationWrapperProps {
  children: React.ReactNode;
  sectionId: 'about' | 'beyond-standards' | 'mission' | 'vision' | 'values';
  backgroundImage?: string;
}

export default function ScrollAnimationWrapper({ 
  children, 
  sectionId,
  backgroundImage 
}: ScrollAnimationWrapperProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const scrollTriggerRef = useRef<ScrollTrigger | null>(null);

  useEffect(() => {
    if (!sectionRef.current || !contentRef.current) return;

    const section = sectionRef.current;
    const content = contentRef.current;

    // Clean up previous ScrollTrigger
    if (scrollTriggerRef.current) {
      scrollTriggerRef.current.kill();
      scrollTriggerRef.current = null;
    }

    // Get the snap scroll container (mobile or desktop)
    const getScrollContainer = (): HTMLElement | Window => {
      const mobileContainer = document.querySelector('[data-snap-scroll-container]') as HTMLElement;
      const desktopContainer = document.querySelector('[data-snap-scroll-container-desktop]') as HTMLElement;
      return mobileContainer || desktopContainer || window;
    };

    const scrollContainer = getScrollContainer();
    const isSnapScroll = scrollContainer instanceof HTMLElement;

    if (sectionId === 'about') {
      // About: Green div starts visible at top, slides up on scroll
      gsap.set(content, { y: 0 });

      scrollTriggerRef.current = ScrollTrigger.create({
        trigger: section,
        start: 'top top',
        end: () => `+=${window.innerHeight}`,
        scrub: 1, // Smooth scrubbing
        onUpdate: (self) => {
          // Slide up as we scroll down
          const progress = self.progress;
          const yOffset = progress * window.innerHeight;
          gsap.set(content, { y: -yOffset });
        },
        scroller: isSnapScroll ? scrollContainer : undefined,
        invalidateOnRefresh: true,
      });
    } else if (sectionId === 'beyond-standards') {
      // BeyondStandards: Yellow div starts outside screen (below), slides up into view
      gsap.set(content, { y: window.innerHeight });

      scrollTriggerRef.current = ScrollTrigger.create({
        trigger: section,
        start: 'top bottom',
        end: () => `top top+=${window.innerHeight}`,
        scrub: 1, // Smooth scrubbing
        onUpdate: (self) => {
          // Slide up from below as we scroll
          const progress = self.progress;
          const yOffset = (1 - progress) * window.innerHeight;
          gsap.set(content, { y: yOffset });
        },
        onEnter: () => {
          // Ensure content starts at initial position when entering
          gsap.set(content, { y: window.innerHeight });
        },
        onLeave: () => {
          // When leaving, keep content at final position but ensure it stays within section bounds
          // The yellow div should be fully visible at the bottom of its section
          gsap.set(content, { y: 0 });
        },
        onEnterBack: () => {
          // When scrolling back into the section, start animation from final position
          gsap.set(content, { y: 0 });
        },
        onLeaveBack: () => {
          // When scrolling back past start, reset to initial position
          gsap.set(content, { y: window.innerHeight });
        },
        scroller: isSnapScroll ? scrollContainer : undefined,
        invalidateOnRefresh: true,
      });
    } else if (sectionId === 'mission' || sectionId === 'vision' || sectionId === 'values') {
      // Mission, Vision, Values: Similar to about - starts visible, slides up on scroll
      gsap.set(content, { y: 0 });

      scrollTriggerRef.current = ScrollTrigger.create({
        trigger: section,
        start: 'top top',
        end: () => `+=${window.innerHeight}`,
        scrub: 1, // Smooth scrubbing
        onUpdate: (self) => {
          // Slide up as we scroll down
          const progress = self.progress;
          const yOffset = progress * window.innerHeight;
          gsap.set(content, { y: -yOffset });
        },
        scroller: isSnapScroll ? scrollContainer : undefined,
        invalidateOnRefresh: true,
      });
    }

    // Handle window resize
    const handleResize = () => {
      ScrollTrigger.refresh();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (scrollTriggerRef.current) {
        scrollTriggerRef.current.kill();
        scrollTriggerRef.current = null;
      }
    };
  }, [sectionId, backgroundImage]);

  // For beyond-standards, use overflow-hidden to prevent content from extending into next section
  // The section will clip the yellow div when it's translated outside its bounds
  const overflowClass = sectionId === 'beyond-standards' ? 'overflow-hidden' : 'overflow-hidden';

  return (
    <section 
      ref={sectionRef}
      id={sectionId}
      className={`relative min-h-screen ${overflowClass}`}
      style={{ 
        position: 'relative', 
        zIndex: sectionId === 'beyond-standards' ? 10 : 1
      }}
    >
      <div 
        ref={contentRef} 
        style={{ 
          willChange: 'transform', 
          position: 'relative', 
          zIndex: sectionId === 'beyond-standards' ? 10 : 1,
          // Ensure the content wrapper doesn't extend beyond section
          height: '100%',
          width: '100%'
        }}
      >
        {children}
      </div>
    </section>
  );
}

