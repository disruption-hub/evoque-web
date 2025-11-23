'use client';

import { useEffect, useRef } from 'react';

interface VideoPreloadProps {
  videoUrl?: string;
}

/**
 * Component that adds a preload link for the video in the document head
 * This ensures the video starts loading before other resources
 * Note: We use 'metadata' preload to avoid downloading the entire video
 */
export default function VideoPreload({ videoUrl }: VideoPreloadProps) {
  const linkRef = useRef<HTMLLinkElement | null>(null);

  useEffect(() => {
    if (!videoUrl) return;

    // Check if it's a video file
    const isVideo = videoUrl.toLowerCase().includes('.mp4') || 
                    videoUrl.toLowerCase().includes('.webm') || 
                    videoUrl.toLowerCase().includes('.mov');

    if (!isVideo) return;

    // Check if preload link already exists (avoid duplicates)
    const existingLink = document.querySelector(`link[rel="preload"][data-video-preload="${videoUrl}"]`);
    if (existingLink) {
      linkRef.current = existingLink as HTMLLinkElement;
      return;
    }

    // Create and add preload link with metadata only (not full video)
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'video';
    link.href = videoUrl;
    link.setAttribute('fetchpriority', 'high');
    // Only preload metadata, not the entire video
    link.setAttribute('type', 'video/mp4');
    link.setAttribute('data-video-preload', videoUrl);
    document.head.appendChild(link);
    linkRef.current = link;

    // Cleanup function
    return () => {
      if (linkRef.current && linkRef.current.parentNode) {
        linkRef.current.parentNode.removeChild(linkRef.current);
        linkRef.current = null;
      }
    };
  }, [videoUrl]);

  return null;
}

