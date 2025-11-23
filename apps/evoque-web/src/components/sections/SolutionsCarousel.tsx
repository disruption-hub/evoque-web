'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import S3FilePreview from '@/components/shared/S3FilePreview';
import { getBrandColor } from '@/config/brand-colors';

interface SolutionsCarouselProps {
  children: React.ReactNode;
  images?: string[];
  imageAlt?: string;
}

export default function SolutionsCarousel({ children, images = [], imageAlt = 'Solution' }: SolutionsCarouselProps) {
  const [sections, setSections] = useState<Array<{ title: string; content: string }>>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [slideWidth, setSlideWidth] = useState<number>(0);
  const [slideHeight, setSlideHeight] = useState<number>(0);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const [showScrollHint, setShowScrollHint] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const autoScrollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const userScrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isAutoScrollingRef = useRef<boolean>(false);
  const scrollAnimationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const scrollDebounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const targetScrollPositionRef = useRef<number | null>(null);
  const scrollEndListenerRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Parse content to extract sections by h2 tags
    const htmlContent = containerRef.current.innerHTML;
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    const h2Elements = doc.querySelectorAll('h2');
    
    const sectionsArray: Array<{ title: string; content: string }> = [];

    if (h2Elements.length > 0) {
      h2Elements.forEach((h2, index) => {
        const title = h2.textContent || '';
        let content = '';
        
        // Get all content after this h2 until the next h2
        let nextElement = h2.nextElementSibling;
        while (nextElement && nextElement.tagName !== 'H2') {
          content += nextElement.outerHTML;
          nextElement = nextElement.nextElementSibling;
        }

        sectionsArray.push({ title, content });
      });
    } else {
      // If no h2 sections found, treat entire content as one section
      sectionsArray.push({
        title: '',
        content: htmlContent
      });
    }

    setSections(sectionsArray);
  }, [children]);

  // Detect mobile and calculate slide dimensions
  useEffect(() => {
    const checkMobile = () => {
      const mobile = typeof window !== 'undefined' && window.innerWidth < 768;
      setIsMobile(mobile);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // Calculate slide width/height and gap based on container dimensions
  useEffect(() => {
    const updateSlideDimensions = () => {
      if (scrollContainerRef.current) {
        const width = scrollContainerRef.current.offsetWidth;
        // For mobile, use viewport height; for desktop, use container height or viewport height
        const isMobileWidth = typeof window !== 'undefined' && window.innerWidth < 768;
        const height = isMobileWidth
          ? window.innerHeight
          : (scrollContainerRef.current.offsetHeight || window.innerHeight);
        setSlideWidth(width);
        setSlideHeight(height);
      }
    };

    // Initial calculation
    updateSlideDimensions();
    
    // Recalculate on resize
    window.addEventListener('resize', updateSlideDimensions);
    
    return () => {
      window.removeEventListener('resize', updateSlideDimensions);
    };
  }, [sections]);

  // Get gap value based on screen size (gap-4 = 16px, gap-8 = 32px)
  const getGap = useCallback(() => {
    if (typeof window === 'undefined') return 16;
    return window.innerWidth >= 768 ? 32 : 16; // md breakpoint
  }, []);

  const scrollToSlide = useCallback((index: number, isAutoScroll: boolean = false) => {
    if (!scrollContainerRef.current) return;
    if (isMobile && slideHeight === 0) return;
    if (!isMobile && slideWidth === 0) return;
    
    const gap = getGap();
    let targetPosition: number;
    
    if (isMobile) {
      // Vertical scrolling for mobile: index * (slideHeight + gap)
      targetPosition = index * (slideHeight + gap);
    } else {
      // Horizontal scrolling for desktop: index * (slideWidth + gap)
      targetPosition = index * (slideWidth + gap);
    }
    
    targetScrollPositionRef.current = targetPosition;
    
    if (isAutoScroll) {
      isAutoScrollingRef.current = true;
    }
    
    // Remove scrollend listener if it exists
    if (scrollEndListenerRef.current && scrollContainerRef.current) {
      scrollContainerRef.current.removeEventListener('scrollend', scrollEndListenerRef.current);
    }
    
    // Create scrollend listener for modern browsers
    const handleScrollEnd = () => {
      if (isAutoScroll) {
        // Verify we reached the target position (within 5px threshold)
        const currentScroll = isMobile 
          ? (scrollContainerRef.current?.scrollTop || 0)
          : (scrollContainerRef.current?.scrollLeft || 0);
        if (Math.abs(currentScroll - targetPosition) <= 5) {
          isAutoScrollingRef.current = false;
          targetScrollPositionRef.current = null;
        }
      }
      if (scrollContainerRef.current && scrollEndListenerRef.current) {
        scrollContainerRef.current.removeEventListener('scrollend', scrollEndListenerRef.current);
        scrollEndListenerRef.current = null;
      }
    };
    
    // Add scrollend listener if supported
    if (scrollContainerRef.current && 'onscrollend' in scrollContainerRef.current) {
      scrollEndListenerRef.current = handleScrollEnd;
      scrollContainerRef.current.addEventListener('scrollend', handleScrollEnd);
    }
    
    // Scroll based on device type
    if (isMobile) {
      scrollContainerRef.current.scrollTo({
        top: targetPosition,
        behavior: 'smooth'
      });
    } else {
      scrollContainerRef.current.scrollTo({
        left: targetPosition,
        behavior: 'smooth'
      });
    }
    setCurrentIndex(index);
    
    // Clear any existing timeout
    if (scrollAnimationTimeoutRef.current) {
      clearTimeout(scrollAnimationTimeoutRef.current);
    }
    
    // Fallback: Mark auto-scroll as complete after animation finishes
    // Use longer timeout to account for gaps and ensure completion
    if (isAutoScroll) {
      scrollAnimationTimeoutRef.current = setTimeout(() => {
        // Verify scroll position before marking as complete
        const currentScroll = isMobile
          ? (scrollContainerRef.current?.scrollTop || 0)
          : (scrollContainerRef.current?.scrollLeft || 0);
        if (Math.abs(currentScroll - targetPosition) <= 5) {
          isAutoScrollingRef.current = false;
          targetScrollPositionRef.current = null;
        } else {
          // If not at target, wait a bit more and check again
          scrollAnimationTimeoutRef.current = setTimeout(() => {
            isAutoScrollingRef.current = false;
            targetScrollPositionRef.current = null;
          }, 200);
        }
      }, 800); // Longer timeout to account for gaps
    }
  }, [slideWidth, slideHeight, isMobile, getGap]);

  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current) return;
    if (isMobile && slideHeight === 0) return;
    if (!isMobile && slideWidth === 0) return;
    
    // Debounce scroll handling to prevent rapid state updates
    if (scrollDebounceTimeoutRef.current) {
      clearTimeout(scrollDebounceTimeoutRef.current);
    }
    
    scrollDebounceTimeoutRef.current = setTimeout(() => {
      if (!scrollContainerRef.current) return;
      if (isMobile && slideHeight === 0) return;
      if (!isMobile && slideWidth === 0) return;
      
      const gap = getGap();
      let currentScroll: number;
      let newIndex: number;
      
      if (isMobile) {
        // Vertical scrolling for mobile
        currentScroll = scrollContainerRef.current.scrollTop;
        newIndex = Math.round(currentScroll / (slideHeight + gap));
      } else {
        // Horizontal scrolling for desktop
        currentScroll = scrollContainerRef.current.scrollLeft;
        newIndex = Math.round(currentScroll / (slideWidth + gap));
      }
      
      // Only update index if it actually changed and is valid
      if (newIndex !== currentIndex && newIndex >= 0 && newIndex < sections.length) {
        setCurrentIndex(newIndex);
      }
      
      // Check if scroll has reached target position (for auto-scroll completion)
      if (isAutoScrollingRef.current && targetScrollPositionRef.current !== null) {
        const threshold = 5; // 5px threshold
        if (Math.abs(currentScroll - targetScrollPositionRef.current) <= threshold) {
          isAutoScrollingRef.current = false;
          targetScrollPositionRef.current = null;
        }
      }
      
      // Only mark as user scrolling if it's not an auto-scroll in progress
      if (!isAutoScrollingRef.current) {
        setIsUserScrolling(true);
        if (userScrollTimeoutRef.current) {
          clearTimeout(userScrollTimeoutRef.current);
        }
        userScrollTimeoutRef.current = setTimeout(() => {
          setIsUserScrolling(false);
        }, 3000); // Resume auto-scroll after 3 seconds of no user interaction
      }
    }, 50); // Debounce delay
  }, [slideWidth, slideHeight, isMobile, currentIndex, sections.length, getGap]);

  // Hide scroll hint overlay after 1 second
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowScrollHint(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Auto-advance carousel every 3 seconds (1 second more for mobile)
  useEffect(() => {
    if (sections.length <= 1) return;
    
    const startAutoScroll = () => {
      if (autoScrollIntervalRef.current) {
        clearInterval(autoScrollIntervalRef.current);
      }
      
      autoScrollIntervalRef.current = setInterval(() => {
        // Only auto-scroll if not hovered, not user scrolling, and not already auto-scrolling
        if (!isHovered && !isUserScrolling && !isAutoScrollingRef.current && scrollContainerRef.current) {
          // Verify scroll is at target position before starting new scroll
          if (targetScrollPositionRef.current !== null) {
            const currentScroll = isMobile
              ? (scrollContainerRef.current.scrollTop || 0)
              : (scrollContainerRef.current.scrollLeft || 0);
            const threshold = 5;
            if (Math.abs(currentScroll - targetScrollPositionRef.current) > threshold) {
              // Still scrolling to previous target, skip this interval
              return;
            }
          }
          
          const nextIndex = (currentIndex + 1) % sections.length;
          scrollToSlide(nextIndex, true); // Pass true to indicate this is an auto-scroll
        }
      }, 3000); // 3 seconds (1 second more than before)
    };

    startAutoScroll();

    return () => {
      if (autoScrollIntervalRef.current) {
        clearInterval(autoScrollIntervalRef.current);
      }
      if (userScrollTimeoutRef.current) {
        clearTimeout(userScrollTimeoutRef.current);
      }
      if (scrollAnimationTimeoutRef.current) {
        clearTimeout(scrollAnimationTimeoutRef.current);
      }
      if (scrollDebounceTimeoutRef.current) {
        clearTimeout(scrollDebounceTimeoutRef.current);
      }
      // Clean up scrollend listener
      if (scrollEndListenerRef.current && scrollContainerRef.current) {
        scrollContainerRef.current.removeEventListener('scrollend', scrollEndListenerRef.current);
      }
    };
  }, [sections.length, currentIndex, isHovered, isUserScrolling, isMobile, scrollToSlide]);

  if (sections.length === 0) {
    return (
      <div ref={containerRef} className="w-full">
        {children}
      </div>
    );
  }

  const canScrollLeft = currentIndex > 0;
  const canScrollRight = currentIndex < sections.length - 1;
  const canScrollUp = currentIndex > 0;
  const canScrollDown = currentIndex < sections.length - 1;

  return (
    <div 
      className="w-full h-full relative" 
      style={{ overflowX: 'visible', zIndex: 1 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <style dangerouslySetInnerHTML={{ __html: `
        .solutions-carousel::-webkit-scrollbar {
          display: none;
        }
        .solutions-carousel {
          overflow-x: auto !important;
        }
        @media (max-width: 767px) {
          .solutions-carousel {
            overflow-x: hidden !important;
            overflow-y: auto !important;
          }
        }
        @keyframes bounce-horizontal {
          0%, 100% {
            transform: translateX(0);
          }
          50% {
            transform: translateX(8px);
          }
        }
        @keyframes bounce-horizontal-reverse {
          0%, 100% {
            transform: translateX(0);
          }
          50% {
            transform: translateX(-8px);
          }
        }
        @keyframes bounce-vertical {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(8px);
          }
        }
        @keyframes bounce-vertical-reverse {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-8px);
          }
        }
        .scroll-indicator-left {
          animation: bounce-horizontal-reverse 3s ease-in-out infinite;
        }
        .scroll-indicator-right {
          animation: bounce-horizontal 3s ease-in-out infinite;
        }
        @media (max-width: 767px) {
          .scroll-indicator-top {
            animation: bounce-vertical-reverse 3s ease-in-out infinite;
          }
          .scroll-indicator-bottom {
            animation: bounce-vertical 3s ease-in-out infinite;
          }
        }
        .scroll-hint-overlay {
          animation: fadeOut 1s ease-out forwards;
        }
        @keyframes fadeOut {
          0% {
            opacity: 1;
          }
          100% {
            opacity: 0;
            pointer-events: none;
          }
        }
      `}} />
      
      {/* Scroll hint overlay - shows for 1 second on first render */}
      {showScrollHint && sections.length > 1 && (
        <div 
          className="scroll-hint-overlay fixed inset-0 z-[100] flex items-center justify-center pointer-events-none"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(2px)'
          }}
        >
          <div className="text-white text-lg md:text-2xl font-medium text-center px-4">
            {isMobile ? (
              <>
                <div className="mb-4">↑ Swipe to explore ↓</div>
                <div className="text-sm md:text-base opacity-80">Scroll vertically to see more</div>
              </>
            ) : (
              <>
                <div className="mb-4">← Swipe to explore →</div>
                <div className="text-sm md:text-base opacity-80">Scroll horizontally to see more</div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Animated scroll indicators */}
      {sections.length > 1 && (
        <>
          {isMobile ? (
            <>
              {/* Top indicator for mobile */}
              {canScrollUp && (
                <div 
                  className="absolute top-0 left-0 right-0 -translate-y-[75%] z-20 cursor-pointer md:hidden"
                  onClick={() => scrollToSlide(currentIndex - 1)}
                  onTouchStart={() => scrollToSlide(currentIndex - 1)}
                >
                  <div className="bg-white/85 backdrop-blur-md rounded-lg h-4 w-full shadow-2xl scroll-indicator-top border-2 border-white/40"></div>
                </div>
              )}
              
              {/* Bottom indicator for mobile */}
              {canScrollDown && (
                <div 
                  className="absolute bottom-0 left-0 right-0 translate-y-[75%] z-20 cursor-pointer md:hidden"
                  onClick={() => scrollToSlide(currentIndex + 1)}
                  onTouchStart={() => scrollToSlide(currentIndex + 1)}
                >
                  <div className="bg-white/85 backdrop-blur-md rounded-lg h-4 w-full shadow-2xl scroll-indicator-bottom border-2 border-white/40"></div>
                </div>
              )}
            </>
          ) : (
            <>
              {/* Left indicator for desktop */}
              {canScrollLeft && (
                <div 
                  className="absolute left-0 top-0 bottom-0 -translate-x-[75%] z-20 cursor-pointer hidden md:block"
                  onClick={() => scrollToSlide(currentIndex - 1)}
                  onTouchStart={() => scrollToSlide(currentIndex - 1)}
                >
                  <div className="bg-white/85 backdrop-blur-md rounded-lg w-4 md:w-5 h-full shadow-2xl scroll-indicator-left border-2 border-white/40"></div>
                </div>
              )}
              
              {/* Right indicator for desktop */}
              {canScrollRight && (
                <div 
                  className="absolute right-0 top-0 bottom-0 translate-x-[75%] z-20 cursor-pointer hidden md:block"
                  onClick={() => scrollToSlide(currentIndex + 1)}
                  onTouchStart={() => scrollToSlide(currentIndex + 1)}
                >
                  <div className="bg-white/85 backdrop-blur-md rounded-lg w-4 md:w-5 h-full shadow-2xl scroll-indicator-right border-2 border-white/40"></div>
                </div>
              )}
            </>
          )}
        </>
      )}
      
      {/* Hidden container to parse MDX content */}
      <div ref={containerRef} className="hidden">
        {children}
      </div>

      {/* Scrollable carousel - vertical on mobile, horizontal on desktop */}
      <div
        ref={scrollContainerRef}
        className="solutions-carousel flex snap-x snap-mandatory md:snap-x md:snap-mandatory flex-col md:flex-row snap-y snap-mandatory md:snap-y-none gap-4 md:gap-8 pb-4"
        style={{
          overflowX: isMobile ? 'hidden' : 'auto',
          overflowY: isMobile ? 'auto' : 'hidden',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
          scrollSnapType: isMobile ? 'y mandatory' : 'x mandatory',
          width: '100%',
          height: isMobile ? '100vh' : 'auto',
          maxHeight: isMobile ? '100vh' : 'none',
          zIndex: 1,
          position: 'relative',
          paddingTop: 0,
          marginTop: 0
        }}
        onScroll={handleScroll}
      >
        {sections.map((section, index) => {
          // Use image at index, or first image, or null
          const image = images[index] || images[0] || null;
          
          return (
            <div
              key={index}
              className="flex-shrink-0 grid grid-cols-1 md:grid-cols-2 gap-0 items-start snap-start"
              style={isMobile ? {
                height: slideHeight > 0 ? `${slideHeight}px` : '100vh',
                minHeight: slideHeight > 0 ? `${slideHeight}px` : '100vh',
                width: '100%'
              } : {
                width: slideWidth > 0 ? `${slideWidth}px` : '100%',
                minWidth: slideWidth > 0 ? `${slideWidth}px` : '100%'
              }}
            >
              {/* Left Column: Image */}
              <div className="w-full relative min-h-[25vh] md:min-h-[50vh] bg-white overflow-hidden" style={{ marginTop: 0, padding: 0, marginLeft: 0, marginRight: 0 }}>
                {image ? (
                  <div className="w-full h-full min-h-[25vh] md:min-h-[50vh]">
                    <S3FilePreview
                      src={image}
                      alt={`${imageAlt} - ${section.title}`}
                      className="w-full h-full"
                      style={{ 
                        minHeight: '25vh', 
                        objectFit: 'cover',
                        width: '100%',
                        height: '100%'
                      }}
                      disablePreviewModal={true}
                      disableSkeleton={false}
                      forceImgTag={true}
                    />
                  </div>
                ) : (
                  <div className="w-full h-full min-h-[25vh] md:min-h-[50vh] bg-gray-100 flex items-center justify-center">
                    <span className="text-gray-400 text-sm">Image placeholder</span>
                  </div>
                )}
              </div>

              {/* Right Column: Text Content */}
              <div className="w-full relative flex items-start pl-4 md:pl-8" style={{ marginTop: 0 }}>
                <div 
                  className="prose prose-sm max-w-none w-full text-sm md:text-base lg:text-lg [&_p]:text-sm [&_p]:md:text-base [&_p]:lg:text-lg [&_li]:text-sm [&_li]:md:text-base [&_li]:lg:text-lg [&_h1]:text-base [&_h1]:md:text-lg [&_h1]:lg:text-xl [&_h2]:text-base [&_h2]:md:text-lg [&_h2]:lg:text-xl [&_h2]:mt-0 [&_h3]:text-sm [&_h3]:md:text-base [&_h3]:lg:text-lg"
                  style={{
                    color: getBrandColor('black')
                  }}
                  dangerouslySetInnerHTML={{ __html: section.title ? `<h2 class="text-base md:text-lg lg:text-xl font-bold mb-2 md:mb-4 mt-0">${section.title}</h2>${section.content}` : section.content }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Dots indicator */}
      {sections.length > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {sections.map((_, index) => (
            <button
              key={index}
              onClick={() => scrollToSlide(index)}
              className="h-2 rounded-full transition-all"
              style={{
                width: index === currentIndex ? '1.5rem' : '0.5rem',
                backgroundColor: index === currentIndex 
                  ? getBrandColor('deepNavy') 
                  : '#D1D5DB'
              }}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
