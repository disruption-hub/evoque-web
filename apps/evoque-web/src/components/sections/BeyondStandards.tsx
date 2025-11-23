'use client';

import React, { useEffect, useRef } from 'react';
import { Headphones, Wifi, Shield } from 'lucide-react';
import { getBrandColor } from '@/config/brand-colors';
import { BeyondStandardsSectionProps } from '@/types/sections';
import { useResponsiveVideo } from '@/hooks/useResponsiveVideo';
import S3FilePreview from '@/components/shared/S3FilePreview';

export default function BeyondStandards({
  title = 'Beyond Standards',
  description,
  items = [],
  backgroundImage
}: BeyondStandardsSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const icons = [Headphones, Wifi, Shield];
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

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .beyond-standards-title-responsive {
          font-size: clamp(2rem, 8vw, 8rem) !important;
        }
        .beyond-standards-description-responsive {
          font-size: clamp(1rem, 2.5vw, 3rem) !important;
        }
        .beyond-standards-item-responsive {
          font-size: clamp(1rem, 2vw, 3rem) !important;
        }
        @media (orientation: landscape) and (max-width: 1023px) {
          .beyond-standards-title-responsive {
            font-size: clamp(2rem, 5vw, 5rem) !important;
          }
          .beyond-standards-description-responsive {
            font-size: clamp(1rem, 2vw, 2.25rem) !important;
          }
          .beyond-standards-item-responsive {
            font-size: clamp(1rem, 1.5vw, 2rem) !important;
          }
        }
        @media (min-width: 1024px) {
          .beyond-standards-title-responsive {
            font-size: clamp(2rem, 5vw, 5rem) !important;
          }
          .beyond-standards-description-responsive {
            font-size: clamp(1rem, 2vw, 2.25rem) !important;
          }
          .beyond-standards-item-responsive {
            font-size: clamp(1rem, 1.5vw, 2rem) !important;
          }
        }
        @media (min-width: 1280px) {
          .beyond-standards-title-responsive {
            font-size: clamp(2rem, 4vw, 4rem) !important;
          }
          .beyond-standards-description-responsive {
            font-size: clamp(1rem, 1.5vw, 2rem) !important;
          }
          .beyond-standards-item-responsive {
            font-size: clamp(1rem, 1.25vw, 1.75rem) !important;
          }
        }
      `}} />
      <section ref={sectionRef} id="beyond-standards" className="relative min-h-screen overflow-hidden">
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
        <div className="relative z-10 pt-12 sm:pt-16 md:pt-20 lg:pt-24 xl:pt-28 flex items-end justify-center md:justify-center min-h-screen w-full">
        <div
          className="px-6 pt-8 pb-40 sm:px-8 sm:pt-10 sm:pb-40 md:px-12 md:pt-12 md:pb-40 lg:px-16 lg:pt-14 lg:pb-0 xl:px-20 xl:pt-16 xl:pb-0 rounded-tl-[5rem] rounded-tr-[5rem] sm:rounded-tl-[5.5rem] sm:rounded-tr-[5.5rem] md:rounded-tl-[6rem] md:rounded-tr-[6rem] lg:rounded-tl-[7rem] lg:rounded-tr-[7rem] xl:rounded-tl-[8rem] xl:rounded-tr-[8rem] w-full md:w-auto max-w-6xl lg:max-w-7xl xl:max-w-[90rem] mx-auto"
          style={{
            backgroundColor: getBrandColor('accentOrange') + 'E6',
            borderRadius: '6rem 6rem 0 0'
          }}
        >
          <div className="max-w-6xl lg:max-w-7xl xl:max-w-[90rem] mx-auto">
            {/* Title and Description */}
            <div className="text-center mb-8 sm:mb-10 md:mb-12 lg:mb-16 xl:mb-20">
              {title && (
                <h2
                  className="beyond-standards-title-responsive font-bold mb-4 sm:mb-5 md:mb-6 lg:mb-8 xl:mb-10"
                  style={{ 
                    color: getBrandColor('white')
                  }}
                >
                  {title}
                </h2>
              )}
              {description && (
                <p
                  className="beyond-standards-description-responsive leading-relaxed md:leading-loose lg:leading-loose max-w-4xl lg:max-w-5xl xl:max-w-6xl mx-auto px-4 sm:px-6 md:px-8"
                  style={{ 
                    color: getBrandColor('white')
                  }}
                >
                  {description}
                </p>
              )}
            </div>

            {/* Icons with connecting lines */}
            <div className="relative">
              {/* Connecting line - spans across all icons */}
              {items.length > 0 && (
                <div className="absolute top-8 sm:top-10 md:top-12 lg:top-14 xl:top-16 left-0 right-0 h-0.5 md:h-1 pointer-events-none z-0">
                  <div
                    className="h-full mx-auto"
                    style={{
                      width: 'calc(100% - 2rem)',
                      backgroundColor: getBrandColor('white'),
                      marginLeft: '1rem',
                      marginRight: '1rem'
                    }}
                  />
                </div>
              )}

              <div className="grid grid-cols-3 grid-rows-1 gap-2 sm:gap-4 md:gap-8 lg:gap-12 xl:gap-16 items-start relative z-10 px-2 sm:px-4 md:px-6 lg:px-8" style={{ gridAutoFlow: 'row' }}>
                {items.map((item, index) => {
                  const IconComponent = icons[index] || Headphones;

                  return (
                    <div key={index} className="flex flex-col items-center">
                      {/* Icon in blue circle */}
                      <div
                        className="relative z-10 w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 xl:w-28 xl:h-28 rounded-full flex items-center justify-center mb-3 sm:mb-4 md:mb-5 lg:mb-6 xl:mb-8"
                        style={{ backgroundColor: getBrandColor('deepNavy') }}
                      >
                        <IconComponent
                          className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 xl:w-14 xl:h-14"
                          style={{ color: getBrandColor('white') }}
                        />
                      </div>

                      {/* Text below icon */}
                      <p
                        className="beyond-standards-item-responsive text-center leading-relaxed md:leading-loose px-1 sm:px-2 md:px-3"
                        style={{ 
                          color: getBrandColor('white')
                        }}
                      >
                        {item}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
      </section>
    </>
  );
}

