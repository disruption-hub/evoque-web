'use client';

import React from 'react';
import { Building2, Target, Eye, Heart, LucideIcon } from 'lucide-react';
import { getBrandColor } from '@/config/brand-colors';
import { ValuesSectionProps } from '@/types/sections';

// Icon mapping
const iconMap: Record<string, LucideIcon> = {
  Building2,
  Target,
  Eye,
  Heart,
};

function Values({
  title = 'Our Values',
  values = [],
  backgroundImage
}: ValuesSectionProps) {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .values-title-responsive {
          font-size: clamp(1.25rem, 3vw, 3rem) !important;
        }
        @media (orientation: landscape) and (max-width: 1023px) {
          .values-title-responsive {
            font-size: clamp(1.25rem, 2.5vw, 2.5rem) !important;
          }
        }
        @media (min-width: 1024px) {
          .values-title-responsive {
            font-size: clamp(1.25rem, 2.5vw, 2.5rem) !important;
          }
        }
        @media (min-width: 1280px) {
          .values-title-responsive {
            font-size: clamp(1.25rem, 2vw, 2rem) !important;
          }
        }
      `}} />
      {/* Orange container with top border radius */}
      <div className="relative z-10 pt-12 md:pt-20 lg:pt-24 flex items-end min-h-screen">
        <div
          className="px-6 pt-8 pb-40 md:px-12 md:pt-10 md:pb-40 rounded-tl-[5rem] rounded-tr-[5rem] md:rounded-tl-[6rem] md:rounded-tr-[6rem] w-full max-w-6xl mx-auto"
          style={{
            backgroundColor: getBrandColor('accentOrange'),
            borderRadius: '6rem 6rem 0 0'
          }}
        >
          <div className="max-w-6xl mx-auto">
            {/* Title */}
            <div className="text-center mb-12">
              {title && (
                <h2
                  className="values-title-responsive font-bold mb-8 md:mb-12"
                  style={{ 
                    color: getBrandColor('white')
                  }}
                >
                  {title}
                </h2>
              )}
            </div>

            {/* Values Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
              {values.map((value, index) => {
                const Icon = (value.icon && iconMap[value.icon]) || Building2;
                return (
                  <div
                    key={value.title}
                    className="flex flex-col items-center text-center"
                  >
                    {/* Icon in navy circle */}
                    <div
                      className="relative z-10 w-16 h-16 md:w-24 md:h-24 rounded-full flex items-center justify-center mb-4 md:mb-6"
                      style={{ backgroundColor: getBrandColor('deepNavy') }}
                    >
                      <Icon
                        className="w-8 h-8 md:w-12 md:h-12"
                        style={{ color: getBrandColor('white') }}
                      />
                    </div>

                    {/* Title and Description */}
                    <div>
                      <h3
                        className="text-base md:text-xl font-bold mb-2 md:mb-3"
                        style={{ color: getBrandColor('white') }}
                      >
                        {value.title}
                      </h3>
                      <p
                        className="text-xs md:text-base leading-relaxed"
                        style={{ color: getBrandColor('white') }}
                      >
                        {value.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>  
    </>
  );
}

export default Values;

