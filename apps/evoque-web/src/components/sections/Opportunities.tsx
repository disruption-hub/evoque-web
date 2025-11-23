'use client';

import React, { useState, useEffect } from 'react';
import { getBrandColor } from '@/config/brand-colors';
import { OpportunitiesFeaturesProps } from '@/types/sections';
import { ColorCircle, ImageCircle } from '@/components/ui';

export default function Opportunities({
  title = 'Opportunities',
  features = []
}: OpportunitiesFeaturesProps) {
  const [circleStyles, setCircleStyles] = useState<{ width: string; height: string }>({
    width: '60vw',
    height: '60vw'
  });

  useEffect(() => {
    const updateCircleSize = () => {
      const vh = window.innerHeight;
      const vw = window.innerWidth;
      const isMobile = vw < 768;
      
      // Responsive size: larger on mobile, similar to WhyPeru's approach
      // On mobile: 60-70vw (larger), on larger screens: 40-60vw
      if (isMobile) {
        // Mobile: larger size - between 60vw and 70vw, capped by viewport height
        const minSize = Math.min(vw * 0.6, vh * 0.6);
        const maxSize = Math.min(vw * 0.7, vh * 0.75);
        const calculatedSize = Math.max(minSize, Math.min(maxSize, vw * 0.65));
        setCircleStyles({
          width: `${calculatedSize}px`,
          height: `${calculatedSize}px`
        });
      } else {
        // Desktop: original sizing but simplified
        const minSize = Math.min(vw * 0.4, vh * 0.5);
        const maxSize = Math.min(vw * 0.6, vh * 0.7);
        const calculatedSize = Math.max(minSize, Math.min(maxSize, vw * 0.5));
        setCircleStyles({
          width: `${calculatedSize}px`,
          height: `${calculatedSize}px`
        });
      }
    };

    // Initial calculation
    updateCircleSize();

    // Update on resize
    window.addEventListener('resize', updateCircleSize);
    return () => window.removeEventListener('resize', updateCircleSize);
  }, []);
  // Default Unsplash images for each opportunity
  const defaultImages = [
    'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=400&h=400&fit=crop', // Strategic Location - globe/map
    'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=400&h=400&fit=crop', // Cultural Affinity - people
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=400&fit=crop', // Growth Potential - growth chart
    'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=400&h=400&fit=crop'  // Business Acumen - business
  ];

  return (
    <section id="opportunities" className="min-h-screen flex items-center relative overflow-hidden" style={{ backgroundColor: getBrandColor('white') }}>
      {/* Green circle - responsive width, always visible at top right */}
      <div 
        className="absolute top-0 right-0 z-[5]" 
        style={{ 
          width: circleStyles.width,
          height: circleStyles.height,
          top: 0,
          right: 0
        }}
      >
        <ColorCircle
          color={getBrandColor('greenAccent')}
          borderRadius="rounded-bl-full"
          width="w-full"
          height="h-full"
          position="relative"
          zIndex={5}
          pointerEvents={true}
        />
      </div>
      
      {/* Title positioned to the right - Always white text with rounded green background */}
      {title && (
        <div 
          className="absolute top-0 right-0 z-10 p-6 md:p-8 lg:p-12 opportunities-title-white rounded-bl-3xl"
          style={{ 
            backgroundColor: getBrandColor('greenAccent'),
            borderRadius: '0 0 0 1.5rem'
          }}
        >
          <h2 
            className="font-bold text-right opportunities-title-white !text-white"
            style={{ 
              color: getBrandColor('white'),
              fontSize: 'clamp(33px, 5vw, 99px)'
            }}
          >
            {title}
          </h2>
        </div>
      )}
      
      <style dangerouslySetInnerHTML={{ __html: `
        .opportunities-title-white,
        .opportunities-title-white h2 {
          color: ${getBrandColor('white')} !important;
        }
        .opportunity-top-right-white h3,
        .opportunity-top-right-white p {
          color: ${getBrandColor('white')} !important;
        }
      `}} />

      <div className="container mx-auto px-4 w-full relative z-10" style={{ marginTop: 'clamp(80px, 5vh, 250px)' }}>
        <div className="max-w-7xl mx-auto">
          {features.length > 0 && (
            <div className="grid grid-cols-2 gap-x-0 md:gap-4  mb-40">
              {features.slice(0, 4).map((feature, index) => {
                // Top right grid item (index 1) should have white text
                const isTopRight = index === 1;
                const textColor = isTopRight ? getBrandColor('white') : getBrandColor('black');
                
                const content = (
                  <>
                    {/* Circular image */}
                    <div className="mb-6 flex justify-center">
                      <ImageCircle
                        src={feature.image || defaultImages[index] || defaultImages[0]}
                        alt={feature.title || 'Opportunity'}
                        width="w-32 md:w-48 lg:w-56"
                        height="h-32 md:h-48 lg:h-56"
                        borderRadius="rounded-full"
                        position="relative"
                        objectFit="cover"
                      />
                    </div>
                    
                    <h3 
                      className="font-bold mb-4 text-center"
                      style={{ 
                        color: textColor,
                        fontSize: 'clamp(17px, 2.5vw, 25px)'
                      }}
                    >
                      {feature.title}
                    </h3>
                    {feature.description && (
                      <p 
                        className="leading-relaxed text-center font-bold"
                        style={{ 
                          color: textColor,
                          fontSize: 'clamp(13px, 2vw, 19px)'
                        }}
                      >
                        {feature.description}
                      </p>
                    )}
                  </>
                );

                return (
                  <div
                    key={index}
                    className={`p-2 relative z-10 text-center ${isTopRight ? 'opportunity-top-right-white' : ''}`}
                  >
                    {isTopRight ? (
                      <div
                        className="rounded-lg p-4 md:p-6"
                        style={{
                          backgroundColor: getBrandColor('greenAccent')
                        }}
                      >
                        {content}
                      </div>
                    ) : (
                      content
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

