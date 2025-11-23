import React from 'react';
import { Users, UserCheck, UserPlus, Briefcase, Award, LucideIcon } from 'lucide-react';
import { getBrandColor } from '@/config/brand-colors';
import { HumanResourcesSectionProps, HumanResourcesItem } from '@/types/sections';
import { ColorCircle } from '../ui';

// Icon mapping
const iconMap: Record<string, LucideIcon> = {
  Users,
  UserCheck,
  UserPlus,
  Briefcase,
  Award,
};

export default function HumanResources({
  title,
  description,
  items = []
}: HumanResourcesSectionProps) {
  // Normalize items to handle both string[] and HumanResourcesItem[]
  const normalizedItems: HumanResourcesItem[] = items.map((item) => {
    if (typeof item === 'string') {
      return { text: item };
    }
    return item;
  });

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .hr-title-responsive {
          font-size: clamp(1.5rem, 6vw, 8rem) !important;
        }
        .hr-description-responsive {
          font-size: clamp(1rem, 1.5vw, 2.25rem) !important;
        }
        .hr-item-responsive {
          font-size: clamp(1.25rem, 2vw, 2.25rem) !important;
        }
        @media (orientation: landscape) and (max-width: 1023px) {
          .hr-title-responsive {
            font-size: clamp(1.5rem, 4vw, 5rem) !important;
          }
          .hr-description-responsive {
            font-size: clamp(1rem, 1.25vw, 1.75rem) !important;
          }
          .hr-item-responsive {
            font-size: clamp(1.25rem, 1.5vw, 1.75rem) !important;
          }
        }
        @media (min-width: 1024px) {
          .hr-title-responsive {
            font-size: clamp(1.5rem, 4vw, 5rem) !important;
          }
          .hr-description-responsive {
            font-size: clamp(1.25rem, 2vw, 2.5rem) !important;
          }
          .hr-item-responsive {
            font-size: clamp(1.25rem, 1.5vw, 1.75rem) !important;
          }
          .hr-yellow-desktop {
            max-width: 1400px !important;
            max-height: 900px !important;
            left: 50% !important;
            right: auto !important;
            transform: translateX(-50%) !important;
          }
          .hr-blue-title-desktop {
            max-width: 800px !important;
            max-height: 200px !important;
          }
          .hr-blue-description-desktop {
            max-width: 800px !important;
            max-height: 250px !important;
          }
        }
        @media (min-width: 1280px) {
          .hr-title-responsive {
            font-size: clamp(1.5rem, 3vw, 4rem) !important;
          }
          .hr-description-responsive {
            font-size: clamp(1.25rem, 1.75vw, 2.25rem) !important;
          }
          .hr-item-responsive {
            font-size: clamp(1.25rem, 1.25vw, 1.5rem) !important;
          }
        }
      `}} />
    <section id="human-resources" className="relative min-h-screen overflow-hidden" style={{ backgroundColor: getBrandColor('white') }}>
      {/* Green circle on bottom left corner - mirrored from Solutions */}
      <ColorCircle
        color={getBrandColor('greenAccent')}
        borderRadius="0 100% 100% 0"
        translateX="-60%"
        translateY="15vh"
        width="w-80 md:w-[28rem] lg:w-[40rem]"
        height="h-96 md:h-[36rem] lg:h-[52rem]"
        position="absolute"
        bottom="0"
        left="0"
        zIndex={10}
        pointerEvents={true}
      />

      {/* Yellow div - wraps content, crosses behind blue div, nearly 100vh starting from bottom */}
      <div
        className="absolute bottom-0 right-0 w-full h-[95vh] rounded-tl-5xl rounded-tr-[6rem] md:rounded-tl-[60px] md:rounded-tr-[8rem] lg:rounded-tl-[80px] lg:rounded-tr-[10rem] hr-yellow-desktop"
        style={{
          backgroundColor: getBrandColor('accentOrange'),
          zIndex: 5
        }}
      >
        {/* Content inside yellow div */}
        {normalizedItems.length > 0 && (
          <div className="container mx-auto px-4 w-full h-full flex items-center" style={{ transform: 'translateY(-10vh)' }}>
            <div className="max-w-4xl mx-auto w-full">
              <ul className="space-y-3 md:space-y-4">
                {normalizedItems.map((item, index) => {
                  const Icon = (item.icon && iconMap[item.icon]) || Users;
                  return (
                    <li
                      key={index}
                      className="flex items-center gap-3 md:gap-4"
                    >
                      {/* Icon in blue circle */}
                      <div
                        className="w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: getBrandColor('deepNavy') }}
                      >
                        <Icon
                          className="w-4 h-4 md:w-5 md:h-5"
                          style={{ color: getBrandColor('white') }}
                        />
                      </div>
                      {/* Text */}
                      <p 
                        className="hr-item-responsive font-bold leading-relaxed"
                        style={{ 
                          color: getBrandColor('white')
                        }}
                      >
                        {item.text}
                      </p>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Blue Title Div - Top Left with right corners rounded */}
      <div className="absolute top-0 left-0 z-20">
        <div
          className="rounded-tr-3xl rounded-br-3xl hr-blue-title-desktop"
          style={{
            backgroundColor: getBrandColor('deepNavy'),
            zIndex: 20,
            width: '85vw',
            paddingTop: '1rem',
            paddingBottom: '2rem',
            paddingLeft: '1rem',
            paddingRight: '3rem'
          }}
        >
          {title && (
            <h2
              className="hr-title-responsive font-bold text-white"
              style={{ 
                color: getBrandColor('white')
              }}
            >
              {title}
            </h2>
          )}
        </div>
      </div>

      {/* Blue Description Div - Bottom Right with left corners rounded */}
      {description && (
        <div className="absolute bottom-0 right-0 z-20">
          <div
            className="rounded-tl-3xl rounded-bl-3xl hr-blue-description-desktop"
            style={{
              backgroundColor: getBrandColor('deepNavy'),
              zIndex: 20,
              maxWidth: '85vw',
              paddingTop: '1rem',
              paddingBottom: '2rem',
              paddingLeft: '3rem',
              paddingRight: '1rem'
            }}
          >
            <p
              className="hr-description-responsive text-white/90 leading-relaxed max-w-2xl"
              style={{ 
                color: getBrandColor('white') + 'E6'
              }}
            >
              {description}
            </p>
          </div>
        </div>
      )}
    </section>
    </>
  );
}

