'use client';

import React, { useEffect, useRef } from 'react';
import { ArrowRight } from 'lucide-react';
import { getBrandColor } from '@/config/brand-colors';
import { HeroSectionProps } from '@/types/sections';
import { useResponsiveVideo } from '@/hooks/useResponsiveVideo';
import S3FilePreview from '@/components/shared/S3FilePreview';

export default function Hero({
  title,
  subtitle,
  backgroundImage,
  ctaText,
  ctaLink,
  secondaryCtaText,
  secondaryCtaLink,
  description
}: HeroSectionProps) {
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

    // Cleanup function
    return () => {
      if (observer) {
        observer.disconnect();
      }
    };
  }, [videoUrl]);

  return (
    <section ref={sectionRef} id="hero" className="relative min-h-screen flex items-center justify-center overflow-hidden">
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

      <style dangerouslySetInnerHTML={{ __html: `
        .hero-title-responsive {
          font-size: clamp(3rem, 15vw, 12rem) !important;
        }
        .hero-description-responsive {
          font-size: clamp(1.5rem, 5vw, 5rem) !important;
        }
        @media (orientation: landscape) and (max-width: 1023px) {
          .hero-title-responsive {
            font-size: clamp(3rem, 8vw, 6rem) !important;
          }
          .hero-description-responsive {
            font-size: clamp(1.5rem, 3vw, 3rem) !important;
          }
        }
        @media (min-width: 1024px) {
          .hero-title-responsive {
            font-size: clamp(3rem, 8vw, 6rem) !important;
          }
          .hero-description-responsive {
            font-size: clamp(1.5rem, 3vw, 3rem) !important;
          }
        }
        @media (min-width: 1280px) {
          .hero-title-responsive {
            font-size: clamp(3rem, 6vw, 5rem) !important;
          }
          .hero-description-responsive {
            font-size: clamp(1.5rem, 2.5vw, 2.5rem) !important;
          }
        }
      `}} />
      {/* Content */}
      <div className="container mx-auto px-4 text-center relative" style={{ zIndex: 10 }}>
        <div className="max-w-3xl mx-auto">
          {title && (
            <h1 
              className="hero-title-responsive font-bold mb-4 md:mb-6 text-white animate-slide-up"
              style={{ 
                animationDelay: '0.5s',
                opacity: 0
              }}
            >
              {title}
            </h1>
          )}
          {description && (
            <p 
              className="hero-description-responsive text-white/90 max-w-3xl mx-auto leading-relaxed animate-slide-up px-2" 
              style={{ 
                animationDelay: '0.75s',
                opacity: 0
              }}
            >
              {description}
            </p>
          )}
          {(ctaText || secondaryCtaText) && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              {ctaText && ctaLink && (
                <a
                  href={ctaLink}
                  className="inline-flex items-center justify-center rounded-md font-medium transition-all duration-200 h-11 px-8 animate-slide-up"
                  style={{
                    backgroundColor: getBrandColor('accentOrange'),
                    color: getBrandColor('white'),
                    border: 'none',
                    animationDelay: '1s',
                    opacity: 0
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = '0.9';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = '1';
                  }}
                >
                  {ctaText}
                  <ArrowRight className="ml-2" size={20} />
                </a>
              )}
              {secondaryCtaText && secondaryCtaLink && (
                <a
                  href={secondaryCtaLink}
                  className="inline-flex items-center justify-center rounded-md font-medium transition-all duration-200 h-11 px-8 border-2 text-white hover:bg-white hover:text-deep-navy animate-slide-up"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    borderColor: 'white',
                    color: 'white',
                    animationDelay: '1.25s',
                    opacity: 0
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = getBrandColor('white');
                    e.currentTarget.style.color = getBrandColor('deepNavy');
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                    e.currentTarget.style.color = 'white';
                  }}
                >
                  {secondaryCtaText}
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

