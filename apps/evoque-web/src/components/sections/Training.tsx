import React from 'react';
import { getBrandColor } from '@/config/brand-colors';
import { TrainingSectionProps } from '@/types/sections';
import { ColorCircle, ImageCircle } from '@/components/ui';

export default function Training({
  title,
  bullets = [],
  content,
  image,
  imageAlt
}: TrainingSectionProps) {
  // Default Unsplash image for training
  const defaultImage = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=400&fit=crop'; // Training/education related image
  
  // Render content as paragraphs if provided, otherwise fall back to bullets list
  const renderContent = () => {
    if (content) {
      // Split content by double newlines to create paragraphs
      const paragraphs = content.split(/\n\n+/).filter(p => p.trim());
      return (
        <div className="space-y-6">
          {paragraphs.map((paragraph, index) => (
            <p
              key={index}
              className="training-content-responsive leading-relaxed"
              style={{ 
                color: getBrandColor('white')
              }}
            >
              {paragraph.trim()}
            </p>
          ))}
        </div>
      );
    }
    
    if (bullets.length > 0) {
      return (
        <div className="space-y-6">
          {bullets.map((bullet, index) => (
            <p
              key={index}
              className="training-content-responsive leading-relaxed"
              style={{ 
                color: getBrandColor('white')
              }}
            >
              {bullet}
            </p>
          ))}
        </div>
      );
    }
    
    return null;
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .training-title-responsive {
          font-size: clamp(2rem, 6vw, 5.25rem) !important;
        }
        .training-content-responsive {
          font-size: clamp(1rem, 2vw, 2.25rem) !important;
        }
        @media (orientation: landscape) and (max-width: 1023px) {
          .training-title-responsive {
            font-size: clamp(2rem, 4vw, 4rem) !important;
          }
          .training-content-responsive {
            font-size: clamp(1rem, 1.5vw, 1.75rem) !important;
          }
        }
        @media (min-width: 1024px) {
          .training-title-responsive {
            font-size: clamp(2rem, 4vw, 4rem) !important;
          }
          .training-content-responsive {
            font-size: clamp(1rem, 1.5vw, 1.75rem) !important;
          }
        }
        @media (min-width: 1280px) {
          .training-title-responsive {
            font-size: clamp(2rem, 3vw, 3.5rem) !important;
          }
          .training-content-responsive {
            font-size: clamp(1rem, 1.25vw, 1.5rem) !important;
          }
        }
      `}} />
    <section id="training" className="pt-0 pb-0 relative min-h-screen overflow-hidden" style={{ backgroundColor: getBrandColor('white') + 'F5' }}>
      {/* Green circle behind blue container - starts from top, rounded bottom */}
      <ColorCircle
        color={getBrandColor('greenAccent')}
        borderRadius="0 0 10% 10%"
        width="w-full"
        height="h-[60vh]"
        position="absolute"
        top="0"
        left="0"
        zIndex={0}
        pointerEvents={true}
      />
      
      {/* Blue container with bottom border radius - taller, nearly to top */}
      <div className="relative z-10 flex items-end min-h-screen px-4 md:px-6 lg:px-8">
        <div
          className="relative px-6 pb-8 md:px-12 md:pb-16 lg:px-16 lg:pb-20 rounded-tl-[5rem] rounded-tr-[5rem] md:rounded-tl-[6rem] md:rounded-tr-[6rem] w-full max-w-6xl mx-auto"
          style={{
            backgroundColor: getBrandColor('deepNavy'),
            borderRadius: '6rem 6rem 0 0',
            minHeight: 'calc(100vh - 4rem)',
            paddingTop: '10rem',
            border: `2px solid ${getBrandColor('deepNavy')}`
          }}
        >
          {/* ImageCircle at the top */}
          <ImageCircle
            src={image || defaultImage}
            alt={imageAlt || 'Training'}
            borderRadius="rounded-b-full"
            width={{
              mobile: 'w-64',
              md: 'w-96',
              lg: 'w-[28rem]'
            }}
            height={{
              mobile: 'h-64',
              md: 'h-96',
              lg: 'h-[28rem]'
            }}
            position="absolute"
            top="0"
            left="50%"
            translateX="-50%"
            translateY="-50%"
            zIndex={20}
            objectFit="cover"
            overflow={true}
            disablePreviewModal={true}
          />
          <div className="w-full flex flex-col h-full" style={{ paddingTop: 0, marginTop: 0 }}>
            {title && (
              <h2 
                className="training-title-responsive font-bold text-center"
                style={{ 
                  color: getBrandColor('white'),
                  lineHeight: '1.2',
                  padding: 0,
                  marginTop: 0,
                  marginBottom: 0,
                  border: `2px solid ${getBrandColor('deepNavy')}`
                }}
              >
                {title}
              </h2>
            )}
            <div className="text-center mt-auto" style={{ color: getBrandColor('white'), paddingTop: '120px', marginTop: 0, paddingLeft: 0, paddingRight: 0 }}>
              {renderContent()}
            </div>
          </div>
        </div>
      </div>
    </section>
    </>
  );
}

