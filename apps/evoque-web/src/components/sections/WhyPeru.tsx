'use client';

import React, { useState, useEffect } from 'react';
import { getBrandColor } from '@/config/brand-colors';
import { WhyPeruSectionProps } from '@/types/sections';
import { ImageCircle } from '@/components/ui';

export default function WhyPeru({
  title,
  points = [],
  content,
  image,
  imageAlt
}: WhyPeruSectionProps) {
  const [imageStyles, setImageStyles] = useState<{ width: string; height: string }>({
    width: '50vw',
    height: '50vw'
  });

  useEffect(() => {
    const updateImageSize = () => {
      const vh = window.innerHeight;
      const vw = window.innerWidth;
      const isMobile = vw < 768;
      
      // Responsive size: larger on mobile, smaller on desktop
      // On mobile: 60-70vw (larger), on larger screens: 40-60vw
      if (isMobile) {
        // Mobile: larger size - between 60vw and 70vw, capped by viewport height
        const minSize = Math.min(vw * 0.6, vh * 0.6);
        const maxSize = Math.min(vw * 0.7, vh * 0.75);
        const calculatedSize = Math.max(minSize, Math.min(maxSize, vw * 0.65));
        setImageStyles({
          width: `${calculatedSize}px`,
          height: `${calculatedSize}px`
        });
      } else {
        // Desktop: original sizing
        const minSize = Math.min(vw * 0.4, vh * 0.5);
        const maxSize = Math.min(vw * 0.6, vh * 0.7);
        const calculatedSize = Math.max(minSize, Math.min(maxSize, vw * 0.5));
        setImageStyles({
          width: `${calculatedSize}px`,
          height: `${calculatedSize}px`
        });
      }
    };

    // Initial calculation
    updateImageSize();

    // Update on resize
    window.addEventListener('resize', updateImageSize);
    return () => window.removeEventListener('resize', updateImageSize);
  }, []);
  // Render content as paragraphs if provided, otherwise fall back to points list
  const renderContent = () => {
    if (content) {
      // Split content by double newlines to create paragraphs
      const paragraphs = content.split(/\n\n+/).filter(p => p.trim());
      return (
        <div className="space-y-6">
          {paragraphs.map((paragraph, index) => (
            <p
              key={index}
              className="why-peru-content-responsive leading-relaxed"
              style={{ 
                color: getBrandColor('black') + 'CC'
              }}
            >
              {paragraph.trim()}
            </p>
          ))}
        </div>
      );
    }
    
    if (points.length > 0) {
      return (
        <ul className="space-y-4">
          {points.map((point, index) => (
            <li
              key={index}
              className="flex items-start gap-3"
            >
              <div 
                className="w-2 h-2 rounded-full mt-2 flex-shrink-0"
                style={{ backgroundColor: getBrandColor('accentOrange') }}
              />
              <p 
                className="why-peru-content-responsive leading-relaxed"
                style={{ 
                  color: getBrandColor('black') + 'CC'
                }}
              >
                {point}
              </p>
            </li>
          ))}
        </ul>
      );
    }
    
    return null;
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .why-peru-title-responsive {
          font-size: clamp(1.5rem, 4vw, 4.5rem) !important;
        }
        .why-peru-content-responsive {
          font-size: clamp(1rem, 2vw, 2.25rem) !important;
        }
        @media (orientation: landscape) and (max-width: 1023px) {
          .why-peru-title-responsive {
            font-size: clamp(1.5rem, 3vw, 3.5rem) !important;
          }
          .why-peru-content-responsive {
            font-size: clamp(1rem, 1.5vw, 1.75rem) !important;
          }
        }
        @media (min-width: 1024px) {
          .why-peru-title-responsive {
            font-size: clamp(1.5rem, 3vw, 3.5rem) !important;
          }
          .why-peru-content-responsive {
            font-size: clamp(1rem, 1.5vw, 1.75rem) !important;
          }
        }
        @media (min-width: 1280px) {
          .why-peru-title-responsive {
            font-size: clamp(1.5rem, 2.5vw, 3rem) !important;
          }
          .why-peru-content-responsive {
            font-size: clamp(1rem, 1.25vw, 1.5rem) !important;
          }
        }
      `}} />
    <section id="why-peru" className="relative min-h-screen overflow-hidden" style={{ backgroundColor: getBrandColor('white') + 'F5', marginTop: 0, paddingTop: 0 }}>
      {/* Large circular image at top right corner - responsive */}
      {image && (
        <div 
          className="absolute top-0 right-0 z-[15]" 
          style={{ 
            width: imageStyles.width,
            height: imageStyles.height,
            top: 0,
            right: 0
          }}
        >
          <ImageCircle
            src={image}
            alt={imageAlt || 'Lima, Peru'}
            borderRadius="rounded-bl-full"
            width="w-full"
            height="h-full"
            position="relative"
            zIndex={15}
            objectFit="cover"
            overflow={true}
            disablePreviewModal={true}
          />
        </div>
      )}

      {/* Text at bottom left */}
      <div className="absolute bottom-0 left-0 z-10 p-6 md:p-8 lg:p-12 max-w-lg md:max-w-xl lg:max-w-2xl pb-40">
        {title && (
          <h2 
            className="why-peru-title-responsive font-bold mb-4 md:mb-8"
            style={{ 
              color: getBrandColor('deepNavy')
            }}
          >
            {title}
          </h2>
        )}
        <div style={{ color: getBrandColor('black') + 'CC' }}>
          {renderContent()}
        </div>
      </div>
    </section>
    </>
  );
}

