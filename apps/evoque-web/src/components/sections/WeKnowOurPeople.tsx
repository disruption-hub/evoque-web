'use client';

import React, { useMemo } from 'react';
import { getBrandColor } from '@/config/brand-colors';
import { WeKnowOurPeopleSectionProps } from '@/types/sections';
import S3FilePreview from '@/components/shared/S3FilePreview';
import { useResponsiveVideo } from '@/hooks/useResponsiveVideo';

export default function WeKnowOurPeople({
  title = 'We know our people',
  backgroundImage,
  content
}: WeKnowOurPeopleSectionProps) {
  // Get the appropriate video URL based on viewport
  const videoUrl = useResponsiveVideo(
    typeof backgroundImage === 'string' 
      ? backgroundImage 
      : backgroundImage
  );
  
  // Check if background is a video (mp4, webm, mov) - check anywhere in URL including query params
  const isVideo = useMemo(() => {
    if (!videoUrl) return false;
    const lower = videoUrl.toLowerCase();
    return lower.includes('.mp4') || lower.includes('.webm') || lower.includes('.mov');
  }, [videoUrl]);
  
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .we-know-title-responsive {
          font-size: clamp(1.5rem, 4vw, 4.5rem) !important;
        }
        .we-know-content-responsive {
          font-size: clamp(1rem, 2vw, 2.25rem) !important;
        }
        @media (orientation: landscape) and (max-width: 1023px) {
          .we-know-title-responsive {
            font-size: clamp(1.5rem, 3vw, 3.5rem) !important;
          }
          .we-know-content-responsive {
            font-size: clamp(1rem, 1.5vw, 1.75rem) !important;
          }
        }
        @media (min-width: 1024px) {
          .we-know-title-responsive {
            font-size: clamp(1.5rem, 3vw, 3.5rem) !important;
          }
          .we-know-content-responsive {
            font-size: clamp(1rem, 1.5vw, 1.75rem) !important;
          }
        }
        @media (min-width: 1280px) {
          .we-know-title-responsive {
            font-size: clamp(1.5rem, 2.5vw, 3rem) !important;
          }
          .we-know-content-responsive {
            font-size: clamp(1rem, 1.25vw, 1.5rem) !important;
          }
        }
      `}} />
    <section id="we-know-our-people" className="relative min-h-screen overflow-hidden">
      {/* Background Image/Video */}
      {videoUrl && (
        <div className="absolute inset-0 z-0 h-full w-full">
          <S3FilePreview
            src={videoUrl}
            alt="Background"
            className="w-full h-full object-cover"
            style={{ 
              width: '100%', 
              height: '100%',
              objectFit: 'cover'
            }}
            autoplay={isVideo ? true : false}
            loop={isVideo ? true : false}
            muted={isVideo ? true : false}
            controls={false}
            playsInline={isVideo ? true : false}
            preload={isVideo ? 'auto' : 'metadata'}
            disablePreviewModal={true}
            disableSkeleton={true}
          />
          {/* Overlay for better text readability */}
          <div className="absolute inset-0 bg-black/20" />
        </div>
      )}

      {/* Blue Title Div - Top Right with left corners rounded */}
      <div className="absolute top-0 right-0 z-10">
        <div
          className="px-4 md:px-12 lg:px-16 py-4 md:py-12 lg:py-16 rounded-bl-2xl md:rounded-bl-4xl lg:rounded-bl-5xl"
          style={{
            backgroundColor: getBrandColor('deepNavy')
          }}
        >
          {title && (
            <h2
              className="we-know-title-responsive font-bold text-white"
              style={{ 
                color: getBrandColor('white')
              }}
            >
              {title}
            </h2>
          )}
        </div>
      </div>

      {/* White Content Div - Bottom Left */}
      <div className="absolute bottom-40 left-0 z-10 p-3 md:p-8 lg:p-12 max-w-[85%] md:max-w-xl lg:max-w-2xl">
        <div
          className="p-3 md:p-8 lg:p-10 rounded-lg shadow-xl"
          style={{
            backgroundColor: getBrandColor('white')
          }}
        >
          {content && (
            <div className="space-y-2 md:space-y-6">
              {content.split(/\n\n+/).map((paragraph, index) => (
                <p
                  key={index}
                  className="we-know-content-responsive leading-relaxed"
                  style={{ 
                    color: getBrandColor('black')
                  }}
                >
                  {paragraph.trim()}
                </p>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
    </>
  );
}

