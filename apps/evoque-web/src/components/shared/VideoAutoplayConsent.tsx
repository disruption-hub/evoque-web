'use client';

import React, { useState, useEffect } from 'react';
import { getBrandColor } from '@/config/brand-colors';

const STORAGE_KEY = 'video-autoplay-consent';

// Global function to trigger video play on all muted videos
// This must be called synchronously during user interaction for mobile autoplay to work
function triggerVideoAutoplay() {
  const videos = document.querySelectorAll('video');
  
  videos.forEach((video) => {
    const videoEl = video as HTMLVideoElement;
    
    // Ensure video is properly configured for autoplay
    if (videoEl) {
      videoEl.muted = true;
      videoEl.setAttribute('muted', 'true');
      videoEl.setAttribute('playsinline', 'true');
      videoEl.setAttribute('webkit-playsinline', 'true');
      videoEl.playsInline = true;
      
      // Try to play immediately - must be in user interaction context
      const playPromise = videoEl.play();
      
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          // If immediate play fails, try again when video is ready
          const tryPlayWhenReady = () => {
            videoEl.play().catch(() => {
              // Silently handle errors
            });
          };
          
          // Try again when video has loaded enough data
          if (videoEl.readyState >= 2) {
            tryPlayWhenReady();
          } else {
            videoEl.addEventListener('canplay', tryPlayWhenReady, { once: true });
            videoEl.addEventListener('loadeddata', tryPlayWhenReady, { once: true });
            videoEl.addEventListener('loadedmetadata', tryPlayWhenReady, { once: true });
          }
        });
      }
    }
  });
}

// Store whether we've triggered autoplay already
let hasTriggeredAutoplay = false;

// Reset on page visibility change to allow autoplay after user returns
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      hasTriggeredAutoplay = false;
    }
  });
}

export default function VideoAutoplayConsent() {
  const [showConsent, setShowConsent] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check if user has already consented
    const hasConsented = localStorage.getItem(STORAGE_KEY);
    
    // Check if mobile device
    const checkMobile = () => {
      const isMobileDevice = window.innerWidth < 768 || 
        /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(navigator.userAgent.toLowerCase());
      setIsMobile(isMobileDevice);
      
      // Only show consent on mobile if not already consented
      if (isMobileDevice && !hasConsented) {
        setShowConsent(true);
      }
    };

    checkMobile();
    
    // Global touch event handler to enable autoplay on mobile
    // Capture ALL touch events and send them to videos
    // IMPORTANT: Must call triggerVideoAutoplay synchronously during the event
    const handleTouchEvent = (e: TouchEvent) => {
      if (!hasTriggeredAutoplay) {
        hasTriggeredAutoplay = true;
        // Trigger video play immediately on first touch - this enables autoplay on mobile
        triggerVideoAutoplay();
      }
    };

    // Also handle click and other interaction events
    const handleInteraction = () => {
      if (!hasTriggeredAutoplay) {
        hasTriggeredAutoplay = true;
        triggerVideoAutoplay();
      }
    };

    // Listen for touch events FIRST (capture phase) - most important for mobile
    // Use capture: true to catch events early, and NOT passive for better control
    document.addEventListener('touchstart', handleTouchEvent, { capture: true });
    document.addEventListener('touchend', handleTouchEvent, { capture: true });
    
    // Also listen in bubble phase as fallback
    document.addEventListener('click', handleInteraction, { capture: true });
    document.addEventListener('mousedown', handleInteraction, { capture: true });
    
    // Listen for resize events
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
      document.removeEventListener('touchstart', handleTouchEvent, { capture: true });
      document.removeEventListener('touchend', handleTouchEvent, { capture: true });
      document.removeEventListener('click', handleInteraction, { capture: true });
      document.removeEventListener('mousedown', handleInteraction, { capture: true });
    };
  }, []);

  const handleConsent = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Store consent in localStorage
    localStorage.setItem(STORAGE_KEY, 'true');
    
    // IMPORTANT: Trigger video autoplay IMMEDIATELY during this user interaction
    // This must happen synchronously during the touch/click event for mobile autoplay
    hasTriggeredAutoplay = true;
    triggerVideoAutoplay();
    
    setShowConsent(false);
    
    // Also trigger after a short delay to catch any videos that load later
    setTimeout(() => {
      triggerVideoAutoplay();
    }, 100);
  };

  if (!showConsent || !isMobile) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 z-[10002] flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}
      onClick={handleConsent}
      onTouchStart={handleConsent}
    >
      <div 
        className="bg-white rounded-lg shadow-2xl p-6 sm:p-8 max-w-sm mx-4 text-center"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
      >
        <h3 
          className="text-xl sm:text-2xl font-bold mb-4"
          style={{ color: getBrandColor('deepNavy') }}
        >
          Tap to Continue
        </h3>
        <p 
          className="text-sm sm:text-base mb-6 leading-relaxed"
          style={{ color: getBrandColor('black') }}
        >
          Tap anywhere on the screen to enable video playback and continue browsing.
        </p>
        <button
          onClick={handleConsent}
          onTouchStart={handleConsent}
          className="w-full py-3 px-6 rounded-md font-medium transition-all duration-200 hover:opacity-90 active:opacity-80"
          style={{
            backgroundColor: getBrandColor('accentOrange'),
            color: getBrandColor('white')
          }}
        >
          Continue
        </button>
        <p 
          className="text-xs mt-4 text-gray-500"
        >
          This enables video autoplay on mobile devices
        </p>
      </div>
    </div>
  );
}

