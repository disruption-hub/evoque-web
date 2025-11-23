'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { ResponsiveBackgroundImage } from '@/types/sections';

interface VideoRegistration {
  sectionId: string;
  videoUrlMobile?: string;
  videoUrlDesktop?: string;
  isVideo: boolean;
}

interface VideoBackgroundContextType {
  registeredVideos: Map<string, VideoRegistration>;
  activeSectionId: string | null;
  registerVideo: (sectionId: string, videoUrlMobile: string | undefined, videoUrlDesktop: string | undefined, isVideo: boolean) => void;
  unregisterVideo: (sectionId: string) => void;
  setActiveSection: (sectionId: string | null | ((current: string | null) => string | null)) => void;
}

const VideoBackgroundContext = createContext<VideoBackgroundContextType | undefined>(undefined);

export function VideoBackgroundProvider({ children }: { children: ReactNode }) {
  const [registeredVideos, setRegisteredVideos] = useState<Map<string, VideoRegistration>>(new Map());
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);

  const registerVideo = useCallback((sectionId: string, videoUrlMobile: string | undefined, videoUrlDesktop: string | undefined, isVideo: boolean) => {
    setRegisteredVideos((prev) => {
      const newMap = new Map(prev);
      newMap.set(sectionId, { sectionId, videoUrlMobile, videoUrlDesktop, isVideo });
      return newMap;
    });
  }, []);

  const unregisterVideo = useCallback((sectionId: string) => {
    setRegisteredVideos((prev) => {
      const newMap = new Map(prev);
      newMap.delete(sectionId);
      return newMap;
    });
    // Clear active section if it's the one being unregistered
    setActiveSectionId((prev) => (prev === sectionId ? null : prev));
  }, []);

  const setActiveSection = useCallback((sectionId: string | null | ((current: string | null) => string | null)) => {
    setActiveSectionId(sectionId);
  }, []);

  return (
    <VideoBackgroundContext.Provider
      value={{
        registeredVideos,
        activeSectionId,
        registerVideo,
        unregisterVideo,
        setActiveSection,
      }}
    >
      {children}
    </VideoBackgroundContext.Provider>
  );
}

export function useVideoBackground() {
  const context = useContext(VideoBackgroundContext);
  if (context === undefined) {
    throw new Error('useVideoBackground must be used within a VideoBackgroundProvider');
  }
  return context;
}

