import React from 'react';
import { getBrandColor } from '@/config/brand-colors';
import { SolutionsListProps } from '@/types/sections';
import { ColorCircle } from '@/components/ui';
import S3FilePreview from '@/components/shared/S3FilePreview';
import SolutionsCarousel from './SolutionsCarousel';
import SolutionsGrid from './SolutionsGrid';
import { MarkdownRenderer } from '@/components/ui/MarkdownRenderer';

export default async function Solutions({
  title = 'Solutions',
  description,
  image,
  images,
  imageAlt = 'Solutions',
  content
}: SolutionsListProps) {

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .solutions-title-responsive {
          font-size: clamp(1.5rem, 4.5vw, 4.5rem) !important;
        }
        @media (orientation: landscape) and (max-width: 1023px) {
          .solutions-title-responsive {
            font-size: clamp(1.5rem, 3.5vw, 4rem) !important;
          }
        }
        @media (min-width: 1024px) {
          .solutions-title-responsive {
            font-size: clamp(1.5rem, 3.5vw, 4rem) !important;
          }
        }
        @media (min-width: 1280px) {
          .solutions-title-responsive {
            font-size: clamp(1.5rem, 3vw, 3.5rem) !important;
          }
        }
      `}} />
    <section id="solutions" className="min-h-screen bg-white relative overflow-y-hidden overflow-x-visible flex items-center py-4 sm:py-6 md:py-8 lg:py-10 xl:py-12">
      {/* Blue Title Div - Top Left with right corners rounded */}
      <div className="absolute top-0 left-0 z-10">
        <div
          className="px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-4 sm:py-6 md:py-8 lg:py-10 xl:py-12 rounded-tr-2xl sm:rounded-tr-2xl md:rounded-tr-3xl lg:rounded-tr-4xl xl:rounded-tr-5xl"
          style={{
            backgroundColor: getBrandColor('deepNavy')
          }}
        >
          {title && (
            <h2
              className="solutions-title-responsive font-bold"
              style={{ 
                color: getBrandColor('white')
              }}
            >
              {title}
            </h2>
          )}
          {description && (
            <p
              className="text-sm sm:text-base md:text-xl lg:text-2xl xl:text-3xl text-white/90 mt-1 sm:mt-2 md:mt-3 lg:mt-4 leading-relaxed max-w-2xl lg:max-w-3xl xl:max-w-4xl"
              style={{ color: getBrandColor('white') + 'E6' }}
            >
              {description}
            </p>
          )}
        </div>
      </div>

      {/* Container to clip the green circle within section bounds */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 5 }}>
        {/* Green circle on bottom right corner - mirrored from HumanResources */}
        <ColorCircle
          color={getBrandColor('greenAccent')}
          borderRadius="100% 0 0 100%"
          translateX="60%"
          translateY="15vh"
          width="w-80 sm:w-96 md:w-[28rem] lg:w-[36rem] xl:w-[40rem]"
          height="h-96 sm:h-[28rem] md:h-[36rem] lg:h-[44rem] xl:h-[52rem]"
          position="absolute"
          bottom="0"
          right="0"
          zIndex={5}
          pointerEvents={true}
        />
      </div>
      
      {/* Mobile: Carousel wrapper */}
      <style dangerouslySetInnerHTML={{ __html: `
        .solutions-carousel-wrapper {
          transform: translateY(calc(1rem + 1.5rem));
        }
        @media (min-width: 768px) {
          .solutions-carousel-wrapper {
            transform: translateY(calc(2rem + 2.5rem)) !important;
          }
        }
        @media (min-width: 1024px) {
          .solutions-carousel-wrapper {
            transform: translateY(calc(3rem + 3.5rem)) !important;
          }
        }
        .solutions-mobile-content {
          display: block;
        }
        .solutions-desktop-content {
          display: none;
        }
        @media (min-width: 768px) {
          .solutions-mobile-content {
            display: none;
          }
          .solutions-desktop-content {
            display: block;
          }
        }
      `}} />
      
      {/* Mobile: Horizontal scrollable carousel */}
      <div className="w-full h-full absolute top-0 left-0 solutions-carousel-wrapper solutions-mobile-content" style={{ overflowX: 'visible', overflowY: 'hidden', marginTop: 0, paddingTop: 60, zIndex: 1 }}>
        {content ? (
          <SolutionsCarousel images={images || (image ? [image] : [])} imageAlt={imageAlt}>
            <div 
              className="prose prose-sm max-w-none w-full text-lg md:text-3xl lg:text-5xl [&_p]:text-lg [&_p]:md:text-3xl [&_p]:lg:text-5xl [&_li]:text-lg [&_li]:md:text-3xl [&_li]:lg:text-5xl [&_h1]:text-3xl [&_h1]:md:text-5xl [&_h1]:lg:text-6xl [&_h2]:text-3xl [&_h2]:md:text-5xl [&_h2]:lg:text-6xl [&_h3]:text-lg [&_h3]:md:text-3xl [&_h3]:lg:text-5xl"
              style={{
                color: getBrandColor('black')
              }}
            >
              <MarkdownRenderer content={content} />
            </div>
          </SolutionsCarousel>
        ) : (
          description && (
            <p 
              className="text-base md:text-2xl leading-relaxed"
              style={{ color: getBrandColor('black') }}
            >
              {description}
            </p>
          )
        )}
      </div>

      {/* Tablet/Desktop: Grid layout */}
      <div className="w-full h-full relative top-0 left-0 solutions-desktop-content pt-20 sm:pt-24 md:pt-28 lg:pt-32 xl:pt-40 pb-8 sm:pb-10 md:pb-12 lg:pb-16 xl:pb-20" style={{ zIndex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        {content ? (
          <SolutionsGrid images={images || (image ? [image] : [])} imageAlt={imageAlt}>
            <div 
              className="prose prose-sm max-w-none w-full text-lg md:text-3xl lg:text-5xl [&_p]:text-lg [&_p]:md:text-3xl [&_p]:lg:text-5xl [&_li]:text-lg [&_li]:md:text-3xl [&_li]:lg:text-5xl [&_h1]:text-3xl [&_h1]:md:text-5xl [&_h1]:lg:text-6xl [&_h2]:text-3xl [&_h2]:md:text-5xl [&_h2]:lg:text-6xl [&_h3]:text-lg [&_h3]:md:text-3xl [&_h3]:lg:text-5xl"
              style={{
                color: getBrandColor('black')
              }}
            >
              <MarkdownRenderer content={content} />
            </div>
          </SolutionsGrid>
        ) : (
          description && (
            <div className="px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
              <p 
                className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl leading-relaxed max-w-4xl mx-auto"
                style={{ color: getBrandColor('black') }}
              >
                {description}
              </p>
            </div>
          )
        )}
      </div>
     
    </section>
    </>
  );
}

