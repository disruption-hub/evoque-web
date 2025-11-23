'use client';

import { useState, useEffect } from 'react';

export interface ResponsiveVideoConfig {
  mobile?: string;
  desktop?: string;
}

/**
 * Hook to determine the appropriate video URL based on screen size
 * Uses 1024px breakpoint (lg in Tailwind) with device detection fallback
 * 
 * @param config - Object with mobile and desktop video URLs
 * @returns The appropriate video URL based on current viewport
 */
export function useResponsiveVideo(config: ResponsiveVideoConfig | string | undefined): string | undefined {
  const [videoUrl, setVideoUrl] = useState<string | undefined>(() => {
    // Handle backward compatibility: if config is a string, treat it as desktop
    if (typeof config === 'string') {
      return config;
    }
    
    // If config is undefined or empty, return undefined
    if (!config || (!config.mobile && !config.desktop)) {
      return undefined;
    }
    
    // Initial determination (SSR-safe: default to desktop)
    if (typeof window === 'undefined') {
      return config.desktop || config.mobile;
    }
    
    // Use breakpoint detection
    const isDesktop = window.matchMedia('(min-width: 1024px)').matches;
    
    if (isDesktop) {
      return config.desktop || config.mobile;
    } else {
      return config.mobile || config.desktop;
    }
  });

  useEffect(() => {
    // Handle backward compatibility: if config is a string, treat it as desktop
    if (typeof config === 'string') {
      setVideoUrl(config);
      return;
    }
    
    // If config is undefined or empty, set to undefined
    if (!config || (!config.mobile && !config.desktop)) {
      setVideoUrl(undefined);
      return;
    }
    
    // Use matchMedia for breakpoint detection
    const mediaQuery = window.matchMedia('(min-width: 1024px)');
    
    const updateVideo = () => {
      const isDesktop = mediaQuery.matches;
      
      if (isDesktop) {
        setVideoUrl(config.desktop || config.mobile);
      } else {
        setVideoUrl(config.mobile || config.desktop);
      }
    };
    
    // Initial check
    updateVideo();
    
    // Listen for changes (modern browsers)
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', updateVideo);
      return () => mediaQuery.removeEventListener('change', updateVideo);
    } else {
      // Fallback for older browsers
      const handler = () => updateVideo();
      window.addEventListener('resize', handler);
      return () => window.removeEventListener('resize', handler);
    }
  }, [config]);

  return videoUrl;
}

/**
 * Hook to determine if current viewport is desktop (>= 1024px)
 * Includes device detection fallback
 */
export function useIsDesktop(): boolean {
  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window === 'undefined') {
      return true; // SSR default to desktop
    }
    
    // Primary: breakpoint detection
    const breakpointMatch = window.matchMedia('(min-width: 1024px)').matches;
    if (breakpointMatch) {
      return true;
    }
    
    // Fallback: device detection
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
    const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
    
    return !isMobileDevice;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 1024px)');
    
    const updateIsDesktop = () => {
      const breakpointMatch = mediaQuery.matches;
      if (breakpointMatch) {
        setIsDesktop(true);
        return;
      }
      
      // Fallback: device detection
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
      setIsDesktop(!isMobileDevice);
    };
    
    updateIsDesktop();
    
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', updateIsDesktop);
      return () => mediaQuery.removeEventListener('change', updateIsDesktop);
    } else {
      const handler = () => updateIsDesktop();
      window.addEventListener('resize', handler);
      return () => window.removeEventListener('resize', handler);
    }
  }, []);

  return isDesktop;
}

