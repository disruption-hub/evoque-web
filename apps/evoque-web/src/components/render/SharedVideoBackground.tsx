'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useVideoBackground } from '@/contexts/VideoBackgroundContext';
import S3FilePreview from '@/components/shared/S3FilePreview';

export default function SharedVideoBackground() {
  const { registeredVideos, activeSectionId } = useVideoBackground();
  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window === 'undefined') return true;
    return window.matchMedia('(min-width: 1024px)').matches;
  });

  // Listen for viewport changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 1024px)');
    
    const updateIsDesktop = () => {
      setIsDesktop(mediaQuery.matches);
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

  // Convert Map to array for rendering
  const videosArray = useMemo(() => {
    return Array.from(registeredVideos.values());
  }, [registeredVideos]);

  if (videosArray.length === 0) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-0 h-screen w-screen pointer-events-none"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 0,
      }}
    >
      {videosArray.map((video) => {
        const isActive = video.sectionId === activeSectionId;
        
        // Determine which video URL to use based on viewport
        const videoUrl = isDesktop 
          ? (video.videoUrlDesktop || video.videoUrlMobile)
          : (video.videoUrlMobile || video.videoUrlDesktop);
        
        if (!videoUrl) {
          return null;
        }
        
        return (
          <div
            key={video.sectionId}
            className="absolute inset-0 w-full h-full transition-opacity duration-500 ease-in-out"
            style={{
              opacity: isActive ? 1 : 0,
              pointerEvents: 'none',
            }}
          >
            <S3FilePreview
              src={videoUrl}
              alt={`${video.sectionId} Background`}
              className="w-full h-full object-cover"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
              autoplay={video.isVideo ? true : false}
              loop={video.isVideo ? true : false}
              muted={video.isVideo ? true : false}
              controls={false}
              playsInline={video.isVideo ? true : false}
              preload={video.isVideo ? 'auto' : 'metadata'}
              disablePreviewModal={true}
              disableSkeleton={true}
              priority={true}
            />
            {/* Overlay for better text readability */}
            <div className="absolute inset-0 bg-black/20 z-10" />
          </div>
        );
      })}
    </div>
  );
}

