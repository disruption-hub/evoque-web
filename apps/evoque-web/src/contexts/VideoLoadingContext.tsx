'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface VideoLoadingContextType {
  videosLoaded: boolean;
  setVideosLoaded: (loaded: boolean) => void;
}

const VideoLoadingContext = createContext<VideoLoadingContextType | undefined>(undefined);

export function VideoLoadingProvider({ children }: { children: ReactNode }) {
  const [videosLoaded, setVideosLoaded] = useState(false);

  return (
    <VideoLoadingContext.Provider value={{ videosLoaded, setVideosLoaded }}>
      {children}
    </VideoLoadingContext.Provider>
  );
}

export function useVideoLoading() {
  const context = useContext(VideoLoadingContext);
  if (!context) {
    throw new Error('useVideoLoading must be used within a VideoLoadingProvider');
  }
  return context;
}

