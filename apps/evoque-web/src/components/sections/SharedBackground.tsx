'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import S3FilePreview from '@/components/shared/S3FilePreview';
import { ResponsiveBackgroundImage } from '@/types/sections';
import { useResponsiveVideo } from '@/hooks/useResponsiveVideo';

interface SharedBackgroundProps {
  backgroundImage?: ResponsiveBackgroundImage | string;
  sectionsToTrack?: string[]; // Array of section IDs that should show this background
}

export default function SharedBackground({ backgroundImage, sectionsToTrack = [] }: SharedBackgroundProps) {
  const [errorCount, setErrorCount] = useState(0);
  const [currentKey, setCurrentKey] = useState(0);
  // Start with visibility false - will be set to true when sections are visible
  const [isVisible, setIsVisible] = useState(false);
  const visibleSectionsRef = useRef<Set<string>>(new Set());

  // Get the appropriate video URL based on viewport
  const videoUrl = useResponsiveVideo(
    typeof backgroundImage === 'string' 
      ? backgroundImage 
      : backgroundImage
  );

  // Check if background is a video
  const isVideo = useMemo(() => {
    if (!videoUrl) return false;
    const lower = videoUrl.toLowerCase();
    return lower.includes('.mp4') || lower.includes('.webm') || lower.includes('.mov');
  }, [videoUrl]);

  // Reset error state when videoUrl changes
  useEffect(() => {
    setErrorCount(0);
    setCurrentKey(prev => prev + 1);
  }, [videoUrl]);

  // Track visibility of sections using IntersectionObserver (similar to Hero.tsx)
  useEffect(() => {
    if (!sectionsToTrack || sectionsToTrack.length === 0) {
      // If no sections to track, don't show background
      setIsVisible(false);
      if (process.env.NODE_ENV === 'development') {
        console.log('[SharedBackground] No sections to track');
      }
      return;
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('[SharedBackground] Setting up observers for sections:', sectionsToTrack);
    }

    const observers: IntersectionObserver[] = [];
    visibleSectionsRef.current.clear();
    const timeouts: NodeJS.Timeout[] = [];

    // Helper function to set up observer for a section
    const setupObserver = (sectionId: string): boolean => {
      const sectionElement = document.getElementById(sectionId);
      if (!sectionElement) {
        return false;
      }

      // Check initial visibility state immediately
      // Use the same logic as IntersectionObserver for consistency
      const checkInitialVisibility = () => {
        const rect = sectionElement.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const viewportWidth = window.innerWidth;
        
        // Check if section is in viewport (at least partially visible)
        const isInViewport = rect.top < viewportHeight && rect.bottom > 0 && 
                            rect.left < viewportWidth && rect.right > 0;
        
        if (isInViewport) {
          // Apply rootMargin logic: -20% top and bottom (middle 60% of viewport)
          const topMargin = viewportHeight * 0.2;
          const bottomMargin = viewportHeight * 0.2;
          const adjustedTop = rect.top + topMargin;
          const adjustedBottom = rect.bottom - bottomMargin;
          
          // Check if section is in the middle 60% of viewport
          const isInMiddleViewport = adjustedTop < viewportHeight && adjustedBottom > 0;
          
          if (isInMiddleViewport) {
            // Calculate visible height
            const visibleHeight = Math.min(rect.bottom, viewportHeight) - Math.max(rect.top, 0);
            const sectionHeight = rect.height;
            
            // Check if at least 50% of the section is visible (matching observer threshold)
            const visibleRatio = visibleHeight / sectionHeight;
            const isSectionVisible = visibleRatio >= 0.5;
            
            if (isSectionVisible) {
              visibleSectionsRef.current.add(sectionId);
              setIsVisible(true);
              if (process.env.NODE_ENV === 'development') {
                console.log(`[SharedBackground] Section ${sectionId} is initially visible (${Math.round(visibleRatio * 100)}% visible, ${Math.round(visibleHeight)}px of ${Math.round(sectionHeight)}px)`);
              }
            }
          }
        }
      };

      // Check initial state after a small delay to ensure DOM is ready
      setTimeout(checkInitialVisibility, 100);

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            // Section is visible if at least 50% of it is in viewport (same as Hero)
            const isSectionVisible = entry.intersectionRatio >= 0.5;
            
            if (process.env.NODE_ENV === 'development') {
              console.log(`[SharedBackground] Section ${sectionId} intersection ratio: ${entry.intersectionRatio.toFixed(2)}, visible: ${isSectionVisible}`);
            }
            
            if (isSectionVisible) {
              visibleSectionsRef.current.add(sectionId);
            } else {
              visibleSectionsRef.current.delete(sectionId);
            }

            // Show background if at least one section is visible
            const shouldBeVisible = visibleSectionsRef.current.size > 0;
            setIsVisible(shouldBeVisible);
            
            if (process.env.NODE_ENV === 'development') {
              console.log(`[SharedBackground] Background visibility: ${shouldBeVisible}, visible sections:`, Array.from(visibleSectionsRef.current));
            }
          });
        },
        {
          threshold: [0, 0.5, 1],
          rootMargin: '-20% 0px -20% 0px' // Same as Hero - trigger when section is in the middle 60% of viewport
        }
      );

      observer.observe(sectionElement);
      observers.push(observer);
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`[SharedBackground] Observer set up for section ${sectionId}`);
      }
      
      return true;
    };

    // Try to set up observers for each section, with retry logic
    sectionsToTrack.forEach((sectionId) => {
      // Try immediately
      if (setupObserver(sectionId)) {
        return;
      }

      // Retry with increasing delays if section not found (might be rendering)
      let retryCount = 0;
      const maxRetries = 20;
      const retryDelay = 200;

      const retrySetup = () => {
        if (retryCount >= maxRetries) {
          console.warn(`[SharedBackground] Section ${sectionId} not found after ${maxRetries} retries`);
          return;
        }

        if (setupObserver(sectionId)) {
          if (process.env.NODE_ENV === 'development') {
            console.log(`[SharedBackground] Found section ${sectionId} on retry attempt ${retryCount + 1}`);
          }
          return;
        }

        // Retry after delay
        retryCount++;
        const timeoutId = setTimeout(retrySetup, retryDelay);
        timeouts.push(timeoutId);
      };

      const timeoutId = setTimeout(retrySetup, retryDelay);
      timeouts.push(timeoutId);
    });

    // Cleanup
    return () => {
      observers.forEach(observer => observer.disconnect());
      timeouts.forEach(timeout => clearTimeout(timeout));
    };
  }, [sectionsToTrack]);

  // Handle error from S3FilePreview
  const handleError = () => {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[SharedBackground] Error loading background video:', videoUrl);
    }
    setErrorCount(prev => prev + 1);
    
    // Retry after a short delay if we haven't exceeded max retries
    if (errorCount < 2) {
      setTimeout(() => {
        setCurrentKey(prev => prev + 1);
      }, 1000);
    }
  };

  if (!videoUrl) return null;

  // Show fallback only after multiple consecutive errors
  if (errorCount >= 3) {
    return (
      <div 
        className="fixed inset-0 z-0 h-screen w-screen bg-gradient-to-br from-deep-navy to-blue-900 transition-opacity duration-500"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 0,
          opacity: 1,
          pointerEvents: 'none'
        }}
      >
        <div className="absolute inset-0 bg-black/20" />
      </div>
    );
  }

  return (
    <div 
      key={`shared-bg-${currentKey}`}
      className="fixed inset-0 z-0 h-screen w-screen transition-opacity duration-500"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 0,
        opacity: isVisible ? 1 : 0,
        pointerEvents: 'none',
        backgroundColor: 'transparent'
      }}
    >
      {/* Fallback background - shown when video fails */}
      <div 
        className="absolute inset-0 w-full h-full bg-gradient-to-br from-deep-navy via-blue-900 to-deep-navy transition-opacity duration-500"
        style={{
          opacity: errorCount >= 2 ? 1 : 0,
          zIndex: errorCount >= 2 ? 1 : 0
        }}
      />
      
      {/* Video/Image background */}
      <div 
        className="absolute inset-0 w-full h-full transition-opacity duration-500"
        style={{
          opacity: errorCount >= 2 ? 0 : 1,
          zIndex: errorCount >= 2 ? -1 : 1
        }}
      >
        <S3FilePreview
          src={videoUrl}
          alt="Shared Background"
          className="w-full h-full object-cover"
          style={{ 
            width: '100%', 
            height: '100%',
            objectFit: 'cover'
          }}
          autoplay={isVideo ? true : false}
          loop={isVideo ? true : false}
          muted={isVideo ? true : false}
          controls={false}
          playsInline={isVideo ? true : false}
          preload={isVideo ? 'auto' : 'metadata'}
          disablePreviewModal={true}
          disableSkeleton={true}
          priority={true}
          onError={handleError}
        />
      </div>
      
      {/* Overlay for better text readability */}
      <div className="absolute inset-0 bg-black/20 z-10" />
    </div>
  );
}
