'use client';

import React, { useMemo } from 'react';
import { getBrandColor } from '@/config/brand-colors';
import { CompetitiveAdvantageSectionProps } from '@/types/sections';
import S3FilePreview from '@/components/shared/S3FilePreview';
import { useResponsiveVideo } from '@/hooks/useResponsiveVideo';

export default function CompetitiveAdvantage({
  title,
  paragraph,
  content,
  backgroundImage
}: CompetitiveAdvantageSectionProps) {
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
        .competitive-title-responsive {
          font-size: clamp(1.5rem, 3.5vw, 3.75rem) !important;
        }
        .competitive-content-responsive {
          font-size: clamp(1.25rem, 2.5vw, 3rem) !important;
        }
        @media (orientation: landscape) and (max-width: 1023px) {
          .competitive-title-responsive {
            font-size: clamp(1.5rem, 2.5vw, 3rem) !important;
          }
          .competitive-content-responsive {
            font-size: clamp(1.25rem, 2vw, 2.25rem) !important;
          }
        }
        @media (min-width: 1024px) {
          .competitive-title-responsive {
            font-size: clamp(1.5rem, 2.5vw, 3rem) !important;
          }
          .competitive-content-responsive {
            font-size: clamp(1.25rem, 2vw, 2.25rem) !important;
          }
        }
        @media (min-width: 1280px) {
          .competitive-title-responsive {
            font-size: clamp(1.5rem, 2vw, 2.5rem) !important;
          }
          .competitive-content-responsive {
            font-size: clamp(1.25rem, 1.5vw, 2rem) !important;
          }
        }
      `}} />
    <section id="competitive-advantage" className="relative min-h-screen overflow-hidden">
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
      {/* Blue Title Div - Centered with bottom corners rounded */}
      <div className="absolute top-0 left-0 right-0 z-10 flex justify-center px-4 md:px-6 lg:px-8">
        <div
          className="px-8 md:px-12 lg:px-16 py-8 md:py-12 lg:py-16 rounded-bl-3xl rounded-br-3xl md:rounded-bl-4xl md:rounded-br-4xl lg:rounded-bl-5xl lg:rounded-br-5xl w-full max-w-6xl"
          style={{
            backgroundColor: getBrandColor('deepNavy'),
            borderRadius: '0 0 5rem 5rem',
            border: `2px solid ${getBrandColor('deepNavy')}`
          }}
        >
          {title && (
            <h2
              className="competitive-title-responsive font-bold text-white text-center"
              style={{ 
                color: getBrandColor('white'),
                border: `2px solid ${getBrandColor('deepNavy')}`
              }}
            >
              {title}
            </h2>
          )}
        </div>
      </div>

      {/* Yellow Content Div - At the bottom */}
      <div className="absolute bottom-0 left-0 right-0 z-0">
        <div
          className="px-6 md:px-12 lg:px-16 py-16 md:py-24 lg:py-32 pb-80 rounded-tl-3xl md:rounded-tl-4xl lg:rounded-tl-5xl"
          style={{
            backgroundColor: getBrandColor('accentOrange') + 'E6',
            borderRadius: '3rem 0 0 0'
          }}
        >
          <div className="max-w-4xl mx-auto">
            {content && (
              <div className="space-y-4 md:space-y-6">
                {content.split(/\n\n+/).map((paragraph, index) => (
                  <p
                    key={index}
                    className="competitive-content-responsive leading-relaxed"
                    style={{ 
                      color: getBrandColor('white')
                    }}
                  >
                    {paragraph.trim()}
                  </p>
                ))}
              </div>
            )}
            {paragraph && !content && (
              <p
                className="competitive-content-responsive leading-relaxed"
                style={{ 
                  color: getBrandColor('white')
                }}
              >
                {paragraph}
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
    </>
  );
}

