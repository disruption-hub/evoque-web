'use client';

import React, { useEffect, useMemo } from 'react';
import { Section } from '@/types';
import { useResponsiveVideo } from '@/hooks/useResponsiveVideo';
import { getBrandColor } from '@/config/brand-colors';
import { useVideoLoading } from '@/contexts/VideoLoadingContext';
import { VideoLoader, getProductionVideoConfig, isMobileDevice } from '@/lib/video-utils';

interface VideoPreloaderProps {
  sections: Section[];
  children: React.ReactNode;
}

interface ResponsiveBackgroundImage {
  mobile?: string;
  desktop?: string;
}

function normalizeBackgroundImage(
  backgroundImage: string | ResponsiveBackgroundImage | undefined
): string | ResponsiveBackgroundImage | undefined {
  if (!backgroundImage) return undefined;
  if (typeof backgroundImage === 'string') return backgroundImage;
  return backgroundImage;
}

function isVideoUrl(url: string | undefined): boolean {
  if (!url) return false;
  const lower = url.toLowerCase();
  return lower.includes('.mp4') || lower.includes('.webm') || lower.includes('.mov');
}

/**
 * Normalize video URLs - convert /api/v1/media/download to /api/media/download
 */
function normalizeVideoUrl(url: string): string {
  if (!url) return url;
  // Normalize /api/v1/media/download to /api/media/download
  if (url.includes('/api/v1/media/download')) {
    return url.replace('/api/v1/media/download', '/api/media/download');
  }
  return url;
}

export default function VideoPreloader({ sections, children }: VideoPreloaderProps) {
  const { setVideosLoaded } = useVideoLoading();

  // Extract video URLs from sections (Hero, About, BeyondStandards)
  const videoUrls = useMemo(() => {
    const urls: string[] = [];
    
    sections.forEach((section) => {
      if (!section.isActive || !section.sectionData) return;
      
      const sectionData = section.sectionData;
      let backgroundImage: string | ResponsiveBackgroundImage | undefined;
      
      // Extract backgroundImage based on section type
      if (section.type === 'HERO' || section.type === 'ABOUT' || section.type === 'BEYOND_STANDARDS') {
        backgroundImage = normalizeBackgroundImage(
          sectionData.backgroundImage as string | ResponsiveBackgroundImage | undefined
        );
      }
      
      if (!backgroundImage) return;
      
      // Handle string format (single URL)
      if (typeof backgroundImage === 'string' && isVideoUrl(backgroundImage)) {
        const normalizedUrl = normalizeVideoUrl(backgroundImage);
        if (!urls.includes(normalizedUrl)) {
          urls.push(normalizedUrl);
        }
      }
      // Handle object format (mobile/desktop)
      else if (typeof backgroundImage === 'object') {
        const bgObj = backgroundImage as { mobile?: string; desktop?: string };
        if (bgObj.mobile && isVideoUrl(bgObj.mobile)) {
          const normalizedUrl = normalizeVideoUrl(bgObj.mobile);
          if (!urls.includes(normalizedUrl)) {
            urls.push(normalizedUrl);
          }
        }
        if (bgObj.desktop && isVideoUrl(bgObj.desktop)) {
          const normalizedUrl = normalizeVideoUrl(bgObj.desktop);
          if (!urls.includes(normalizedUrl)) {
            urls.push(normalizedUrl);
          }
        }
      }
    });
    
    return urls;
  }, [sections]);

  // Preload all videos - optimized for mobile with VideoLoader utility
  useEffect(() => {
    // Reset loading state when videoUrls change
    setVideosLoaded(false);
    
    if (videoUrls.length === 0) {
      // No videos to load, immediately set loaded state
      setVideosLoaded(true);
      return;
    }

    // Detect mobile device
    const isMobile = isMobileDevice();
    const config = getProductionVideoConfig();
    
    let loadedCount = 0;
    const videos: HTMLVideoElement[] = [];
    const totalVideos = videoUrls.length;
    let isCleanedUp = false;
    let hasSetLoaded = false; // Prevent multiple calls to setVideosLoaded

    const handleVideoLoaded = () => {
      if (isCleanedUp || hasSetLoaded) return;
      loadedCount++;
      
      if (loadedCount >= totalVideos) {
        hasSetLoaded = true;
        // All videos loaded - wait a moment to ensure they're ready to play
        setTimeout(() => {
          if (!isCleanedUp) {
            // Trigger video autoplay now that all videos are loaded
            const allVideos = document.querySelectorAll('video');
            allVideos.forEach((video) => {
              const videoEl = video as HTMLVideoElement;
              if (videoEl && videoEl.muted) {
                videoEl.play().catch(() => {
                  // Silently handle - will be triggered by user interaction
                });
              }
            });
            
            // Mark videos as loaded
            setVideosLoaded(true);
          }
          
          // Clean up preloader video elements after a delay
          setTimeout(() => {
            videos.forEach((video) => {
              try {
                video.remove();
              } catch (e) {
                // Silently handle cleanup errors
              }
            });
          }, 100);
        }, 200);
      }
    };

    // Load videos using VideoLoader utility with retry logic
    const loadVideo = async (index: number) => {
      if (index >= videoUrls.length || isCleanedUp) {
        return;
      }

      const videoUrl = videoUrls[index];
      let video: HTMLVideoElement | null = null;

      try {
        video = document.createElement('video');
        // Set video attributes for background playback
        video.preload = 'auto'; // Full preload to ensure complete loading
        video.muted = true;
        video.playsInline = true;
        video.setAttribute('playsinline', 'true');
        video.setAttribute('webkit-playsinline', 'true');
        video.crossOrigin = 'anonymous';
        video.style.display = 'none';
        video.style.position = 'absolute';
        video.style.width = '1px';
        video.style.height = '1px';
        video.style.opacity = '0';
        video.style.pointerEvents = 'none';
        video.style.zIndex = '-9999';
        
        document.body.appendChild(video);
        videos.push(video);
        
        // Use VideoLoader with retry logic and optimized settings for mobile
        // Wrap in Promise.race with a timeout to prevent hanging
        const loadTimeout = isMobile ? 6000 : 9000; // Shorter timeout than safety timeout
        const loadPromise = VideoLoader.loadVideoWithRetry(video, videoUrl, {
          maxRetries: isMobile ? Math.min(2, config.maxRetries) : config.maxRetries,
          retryDelay: isMobile ? Math.min(800, config.retryDelay) : config.retryDelay,
          timeoutMs: isMobile ? Math.min(5000, config.timeoutMs) : Math.min(8000, config.timeoutMs),
          fallbackUrls: [], // No fallback URLs for now, can be added if needed
          useConnectivityProbe: false,
        });
        
        const timeoutPromise = new Promise<boolean>((resolve) => {
          setTimeout(() => resolve(false), loadTimeout);
        });
        
        const success = await Promise.race([loadPromise, timeoutPromise]);

        if (!isCleanedUp) {
          if (success) {
            handleVideoLoaded();
          } else {
            // Count errors/timeouts as loaded to not block page
            handleVideoLoaded();
          }
        }
      } catch (e) {
        // Count errors as loaded to not block page
        if (!isCleanedUp) {
          handleVideoLoaded();
        }
      }
    };

    // Load all videos in parallel (both mobile and desktop)
    videoUrls.forEach((_, index) => loadVideo(index));

    // Fallback timeout - ensure loading state always clears
    // Use shorter timeout to prevent stuck loading state
    // Mobile: 5 seconds, Desktop: 10 seconds (reduced from 8/15)
    const timeoutMs = isMobile ? 5000 : 10000;
    const timeoutId = setTimeout(() => {
      if (!isCleanedUp && !hasSetLoaded) {
        hasSetLoaded = true;
        setVideosLoaded(true);
        videos.forEach((video) => {
          try {
            video.remove();
          } catch (e) {
            // Silently handle cleanup errors
          }
        });
      }
    }, timeoutMs);
    
    // Safety timeout - absolute maximum time before clearing loading state
    // This ensures the loading screen never stays forever
    const safetyTimeoutMs = 12000; // 12 seconds absolute maximum
    const safetyTimeoutId = setTimeout(() => {
      if (!hasSetLoaded) {
        hasSetLoaded = true;
        setVideosLoaded(true);
        videos.forEach((video) => {
          try {
            video.remove();
          } catch (e) {
            // Silently handle cleanup errors
          }
        });
      }
    }, safetyTimeoutMs);

    // Cleanup for both mobile and desktop
    return () => {
      isCleanedUp = true;
      clearTimeout(timeoutId);
      clearTimeout(safetyTimeoutId);
      videos.forEach((video) => {
        try {
          video.remove();
        } catch (e) {
          // Silently handle cleanup errors
        }
      });
    };
  }, [videoUrls, setVideosLoaded]);

  // Always render children - videos load in background
  return <>{children}</>;
}

// Background video loader component (shows tilting background)
export function VideoLoadingBackground() {
  const { videosLoaded } = useVideoLoading();
  
  if (videosLoaded) {
    return null;
  }

  // Convert hex to rgba with transparency
  const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };
  
  const deepNavy = hexToRgba(getBrandColor('deepNavy'), 0.85);
  const greenAccent = hexToRgba(getBrandColor('greenAccent'), 0.75);
  const accentOrange = hexToRgba(getBrandColor('accentOrange'), 0.70);
  const secondaryBlue = hexToRgba(getBrandColor('secondaryBlue'), 0.75);
  
  return (
    <div 
      className="fixed inset-0 z-[10001]"
      style={{
        overflow: 'hidden',
        backgroundColor: getBrandColor('deepNavy'),
        pointerEvents: 'none'
      }}
    >
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(
            135deg, 
            ${deepNavy} 0%, 
            ${secondaryBlue} 20%, 
            ${greenAccent} 40%,
            ${accentOrange} 60%,
            ${secondaryBlue} 80%, 
            ${deepNavy} 100%
          )`,
          backgroundSize: '300% 300%',
          animation: 'tiltGradient 12s ease-in-out infinite',
          transformOrigin: 'center center',
        }}
      />
      <style jsx>{`
        @keyframes tiltGradient {
          0% {
            background-position: 0% 50%;
            transform: rotate(0deg) scale(1.1);
          }
          25% {
            background-position: 100% 0%;
            transform: rotate(1.5deg) scale(1.15);
          }
          50% {
            background-position: 100% 100%;
            transform: rotate(0deg) scale(1.1);
          }
          75% {
            background-position: 0% 100%;
            transform: rotate(-1.5deg) scale(1.15);
          }
          100% {
            background-position: 0% 50%;
            transform: rotate(0deg) scale(1.1);
          }
        }
      `}</style>
    </div>
  );
}

