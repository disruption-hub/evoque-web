'use client';

import React, { useEffect, useMemo } from 'react';
import { Section } from '@/types';

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

interface VideoPreloadLinksProps {
  sections: Section[];
}

/**
 * Component that dynamically adds <link rel="preload"> tags for video URLs
 * extracted from sections. This speeds up video loading by preloading them
 * in the browser before they're needed.
 */
export default function VideoPreloadLinks({ sections }: VideoPreloadLinksProps) {
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
        if (!urls.includes(backgroundImage)) {
          urls.push(backgroundImage);
        }
      }
      // Handle object format (mobile/desktop)
      else if (typeof backgroundImage === 'object') {
        const bgObj = backgroundImage as { mobile?: string; desktop?: string };
        if (bgObj.mobile && isVideoUrl(bgObj.mobile) && !urls.includes(bgObj.mobile)) {
          urls.push(bgObj.mobile);
        }
        if (bgObj.desktop && isVideoUrl(bgObj.desktop) && !urls.includes(bgObj.desktop)) {
          urls.push(bgObj.desktop);
        }
      }
    });
    
    return urls;
  }, [sections]);

  // Add preload links to document head
  useEffect(() => {
    if (videoUrls.length === 0) return;

    // Create link elements for each video URL
    const linkElements: HTMLLinkElement[] = [];

    videoUrls.forEach((url) => {
      // Check if link already exists
      const existingLink = document.querySelector(`link[rel="preload"][href="${url}"]`);
      if (existingLink) return;

      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'video';
      link.type = 'video/mp4'; // Default to mp4, browser will handle other formats
      link.href = url;
      
      // Add to head
      document.head.appendChild(link);
      linkElements.push(link);
    });

    // Cleanup: remove links when component unmounts or URLs change
    return () => {
      linkElements.forEach((link) => {
        try {
          document.head.removeChild(link);
        } catch (e) {
          // Link may have already been removed
        }
      });
    };
  }, [videoUrls]);

  // This component doesn't render anything
  return null;
}

