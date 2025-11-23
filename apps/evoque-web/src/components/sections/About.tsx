'use client';

import React, { useEffect, useRef } from 'react';
import { getBrandColor } from '@/config/brand-colors';
import { AboutSectionProps } from '@/types/sections';
import { useResponsiveVideo } from '@/hooks/useResponsiveVideo';
import S3FilePreview from '@/components/shared/S3FilePreview';

export default function About({
  title = 'About E-Voque',
  description,
  backgroundImage
}: AboutSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const videoUrl = useResponsiveVideo(
    typeof backgroundImage === 'string' ? backgroundImage : backgroundImage
  );

  // Setup video autoplay - optimized for mobile
  useEffect(() => {
    if (!videoUrl || !sectionRef.current) return;

    const section = sectionRef.current;
    let videoElement: HTMLVideoElement | null = null;
    let observer: IntersectionObserver | null = null;

    // Function to ensure video plays
    const ensureVideoPlays = () => {
      if (!videoElement) return;
      
      // Configure video for mobile autoplay
      videoElement.muted = true;
      videoElement.setAttribute('muted', 'true');
      videoElement.setAttribute('playsinline', 'true');
      videoElement.setAttribute('webkit-playsinline', 'true');
      videoElement.playsInline = true;
      
      // Try to play immediately
      const playPromise = videoElement.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Silently handle autoplay errors - will be handled by global touch handlers
        });
      }
    };

    // Wait for video element to be created by S3FilePreview
    const findAndSetupVideo = () => {
      videoElement = section.querySelector('video') as HTMLVideoElement;
      
      if (!videoElement) {
        // Retry after a short delay if video not found yet
        setTimeout(findAndSetupVideo, 100);
        return;
      }

      // Try to play immediately when video is found
      ensureVideoPlays();

      // Also try when video is ready
      if (videoElement.readyState >= 2) {
        ensureVideoPlays();
      } else {
        videoElement.addEventListener('canplay', ensureVideoPlays, { once: true });
        videoElement.addEventListener('loadeddata', ensureVideoPlays, { once: true });
        videoElement.addEventListener('loadedmetadata', ensureVideoPlays, { once: true });
      }

      // Setup IntersectionObserver to ensure video plays when in view
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            // Play video when section is in viewport
            if (entry.isIntersecting && videoElement) {
              ensureVideoPlays();
            }
          });
        },
        {
          threshold: [0, 0.1, 0.5, 1],
          rootMargin: '0px'
        }
      );

      observer.observe(section);
    };

    // Start looking for video element
    findAndSetupVideo();

    return () => {
      if (observer) {
        observer.disconnect();
      }
    };
  }, [videoUrl]);

  // Parse markdown-style bold text (**text**) and italic text (*text*) and convert to JSX
  const renderDescription = (text: string) => {
    const result: React.ReactNode[] = [];
    
    function processItalic(text: string, startIdx: number): React.ReactNode[] {
      const italicRegex = /\*([^*].*?)\*/g;
      const parts: React.ReactNode[] = [];
      let lastIdx = 0;
      let match;
      
      while ((match = italicRegex.exec(text)) !== null) {
        // Add text before italic
        if (match.index > lastIdx) {
          parts.push(text.substring(lastIdx, match.index));
        }
        // Add italic text
        parts.push(<em key={`italic-${startIdx + parts.length}`}>{match[1]}</em>);
        lastIdx = italicRegex.lastIndex;
      }
      
      // Add remaining text
      if (lastIdx < text.length) {
        parts.push(text.substring(lastIdx));
      }
      
      return parts.length > 0 ? parts : [text];
    }
    
    // Process bold text first (**text**)
    const boldRegex = /\*\*(.*?)\*\*/g;
    let match;
    let lastIndex = 0;
    let hasBold = false;
    
    while ((match = boldRegex.exec(text)) !== null) {
      hasBold = true;
      // Add text before the bold
      if (match.index > lastIndex) {
        const beforeText = text.substring(lastIndex, match.index);
        // Process italic in the before text
        result.push(...processItalic(beforeText, result.length));
      }
      // Add bold text
      result.push(<strong key={`bold-${result.length}`}>{match[1]}</strong>);
      lastIndex = boldRegex.lastIndex;
    }
    
    // Add remaining text
    if (lastIndex < text.length) {
      const remainingText = text.substring(lastIndex);
      result.push(...processItalic(remainingText, result.length));
    }
    
    // If no bold text was found, process the entire text for italic
    if (!hasBold) {
      return processItalic(text, 0);
    }
    
    return result.length > 0 ? result : [text];
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .about-title-responsive {
          font-size: clamp(2rem, 8vw, 8rem) !important;
        }
        .about-description-responsive {
          font-size: clamp(1rem, 2.5vw, 3rem) !important;
        }
        @media (orientation: landscape) and (max-width: 1023px) {
          .about-title-responsive {
            font-size: clamp(2rem, 5vw, 5rem) !important;
          }
          .about-description-responsive {
            font-size: clamp(1rem, 2vw, 2.25rem) !important;
          }
        }
        @media (min-width: 1024px) {
          .about-title-responsive {
            font-size: clamp(2rem, 5vw, 5rem) !important;
          }
          .about-description-responsive {
            font-size: clamp(1rem, 2vw, 2.25rem) !important;
          }
        }
        @media (min-width: 1280px) {
          .about-title-responsive {
            font-size: clamp(2rem, 4vw, 4rem) !important;
          }
          .about-description-responsive {
            font-size: clamp(1rem, 1.5vw, 2rem) !important;
          }
        }
      `}} />
      <section ref={sectionRef} id="about" className="relative min-h-screen overflow-hidden">
        {/* Video Background */}
        {videoUrl && (
          <div className="absolute inset-0 z-0 w-full h-full">
            <S3FilePreview
              src={videoUrl}
              alt="Background video"
              className="w-full h-full object-cover"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              autoplay={true}
              loop={true}
              muted={true}
              controls={false}
              playsInline={true}
              preload="auto"
              disablePreviewModal={true}
              disableSkeleton={true}
              priority={true}
            />
            {/* Overlay for better text readability */}
            <div className="absolute inset-0 bg-black/20 z-10" />
          </div>
        )}
        <div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 w-full relative z-10 min-h-screen flex items-end sm:pb-10 md:pb-12 lg:pb-16 xl:pb-20">
        <div className="max-w-4xl lg:max-w-5xl xl:max-w-6xl mx-auto text-center w-full">
          <div
            className="px-6 py-8 sm:px-8 sm:py-10 md:px-12 md:py-12 lg:px-16 lg:py-14 xl:px-20 xl:py-16 rounded-tl-3xl rounded-tr-3xl"
            style={{ 
              backgroundColor: getBrandColor('greenAccent'),
              opacity: 0.7,
              borderRadius: '1.5rem 1.5rem 0 0'
            }}
          >
            {title && (
              <h2 
                className="about-title-responsive font-bold mb-4 sm:mb-5 md:mb-6 lg:mb-8 xl:mb-10"
                style={{ 
                  color: getBrandColor('white')
                }}
              >
                {title}
              </h2>
            )}
            {description && (
              <p 
                className="about-description-responsive leading-relaxed md:leading-loose lg:leading-loose"
                style={{ 
                  color: getBrandColor('white')
                }}
              >
                {renderDescription(description)}
              </p>
            )}
          </div>
        </div>
      </div>
      </section>
    </>
  );
}

