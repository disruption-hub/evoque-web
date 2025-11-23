'use client';

import React, { useState, useEffect, useRef } from 'react';
import S3FilePreview from '@/components/shared/S3FilePreview';
import { getBrandColor } from '@/config/brand-colors';
import SolutionsCarousel from './SolutionsCarousel';

interface SolutionsGridProps {
  children: React.ReactNode;
  images?: string[];
  imageAlt?: string;
}

export default function SolutionsGrid({ children, images = [], imageAlt = 'Solution' }: SolutionsGridProps) {
  const [sections, setSections] = useState<Array<{ title: string; content: string }>>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Parse content to extract sections by h2 tags
    const htmlContent = containerRef.current.innerHTML;
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    const h2Elements = doc.querySelectorAll('h2');
    
    const sectionsArray: Array<{ title: string; content: string }> = [];

    if (h2Elements.length > 0) {
      h2Elements.forEach((h2) => {
        const title = h2.textContent || '';
        let content = '';
        
        // Get all content after this h2 until the next h2
        let nextElement = h2.nextElementSibling;
        while (nextElement && nextElement.tagName !== 'H2') {
          content += nextElement.outerHTML;
          nextElement = nextElement.nextElementSibling;
        }

        sectionsArray.push({ title, content });
      });
    } else {
      // If no h2 sections found, treat entire content as one section
      sectionsArray.push({
        title: '',
        content: htmlContent
      });
    }

    setSections(sectionsArray);
  }, [children]);

  if (sections.length === 0) {
    return (
      <div ref={containerRef} className="hidden">
        {children}
      </div>
    );
  }

  return (
    <div className="w-full h-full relative" style={{ zIndex: 1 }}>
      {/* Hidden container to parse MDX content */}
      <div ref={containerRef} className="hidden">
        {children}
      </div>

      {/* Mobile/Tablet: Grid layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 md:gap-8 px-4 sm:px-6 md:px-8 lg:hidden">
        {sections.map((section, index) => {
          // Use image at index, or first image, or null
          const image = images[index] || images[0] || null;
          
          return (
            <div
              key={index}
              className="flex flex-col bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-300"
            >
              {/* Image */}
              <div className="w-full relative min-h-[200px] sm:min-h-[250px] md:min-h-[300px] bg-gray-100 overflow-hidden">
                {image ? (
                  <div className="w-full h-full">
                    <S3FilePreview
                      src={image}
                      alt={`${imageAlt} - ${section.title}`}
                      className="w-full h-full"
                      style={{ 
                        objectFit: 'cover',
                        width: '100%',
                        height: '100%'
                      }}
                      disablePreviewModal={true}
                      disableSkeleton={false}
                      forceImgTag={true}
                    />
                  </div>
                ) : (
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                    <span className="text-gray-400 text-sm md:text-base">Image placeholder</span>
                  </div>
                )}
              </div>

              {/* Text Content */}
              <div className="w-full p-4 sm:p-5 md:p-6 flex-1 flex flex-col">
                <div 
                  className="prose prose-sm max-w-none w-full text-sm sm:text-base md:text-lg [&_p]:text-sm [&_p]:sm:text-base [&_p]:md:text-lg [&_li]:text-sm [&_li]:sm:text-base [&_li]:md:text-lg [&_h1]:text-base [&_h1]:sm:text-lg [&_h1]:md:text-xl [&_h2]:text-base [&_h2]:sm:text-lg [&_h2]:md:text-xl [&_h2]:font-bold [&_h2]:mb-2 [&_h2]:sm:mb-3 [&_h2]:md:mb-4 [&_h2]:mt-0 [&_h3]:text-sm [&_h3]:sm:text-base [&_h3]:md:text-lg [&_ul]:mt-2 [&_ul]:sm:mt-3 [&_ul]:md:mt-4 [&_ol]:mt-2 [&_ol]:sm:mt-3 [&_ol]:md:mt-4"
                  style={{
                    color: getBrandColor('black')
                  }}
                  dangerouslySetInnerHTML={{ __html: section.title ? `<h2 class="text-base sm:text-lg md:text-xl font-bold mb-2 sm:mb-3 md:mb-4 mt-0">${section.title}</h2>${section.content}` : section.content }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop at 1024px: Carousel */}
      <div className="hidden lg:block xl:hidden">
        <SolutionsCarousel images={images} imageAlt={imageAlt}>
          {children}
        </SolutionsCarousel>
      </div>

      {/* Desktop at 1280px+: 1 row, 3 columns, positioned at left, 85vw width */}
      <div className="hidden xl:block px-4 lg:px-6 xl:px-8 h-full" style={{ width: '85vw', transform: 'scale(0.85)', transformOrigin: 'left top' }}>
        <div className="grid grid-cols-3 gap-6 lg:gap-8 xl:gap-10 h-full items-stretch">
          {sections.map((section, index) => {
            // Use image at index, or first image, or null
            const image = images[index] || images[0] || null;
            
            return (
              <div
                key={index}
                className="flex flex-col h-full"
              >
                {/* Image */}
                {image && (
                  <div className="w-full relative min-h-[200px] lg:min-h-[250px] xl:min-h-[300px] bg-gray-100 overflow-hidden rounded-lg shadow-sm mb-4">
                    <S3FilePreview
                      src={image}
                      alt={`${imageAlt} - ${section.title}`}
                      className="w-full h-full"
                      style={{ 
                        objectFit: 'cover',
                        width: '100%',
                        height: '100%'
                      }}
                      disablePreviewModal={true}
                      disableSkeleton={false}
                      forceImgTag={true}
                    />
                  </div>
                )}

                {/* Text Content */}
                <div className="flex-1 flex flex-col justify-center">
                  <div 
                    className="prose prose-sm max-w-none w-full text-lg lg:text-xl xl:text-2xl [&_p]:text-lg [&_p]:lg:text-xl [&_p]:xl:text-2xl [&_li]:text-lg [&_li]:lg:text-xl [&_li]:xl:text-2xl [&_h1]:text-xl [&_h1]:lg:text-2xl [&_h1]:xl:text-3xl [&_h2]:text-lg [&_h2]:lg:text-xl [&_h2]:xl:text-2xl [&_h2]:font-bold [&_h2]:mb-2 [&_h2]:lg:mb-3 [&_h2]:xl:mb-4 [&_h2]:mt-0 [&_h3]:text-base [&_h3]:lg:text-lg [&_h3]:xl:text-xl [&_ul]:mt-2 [&_ul]:lg:mt-3 [&_ul]:xl:mt-4 [&_ol]:mt-2 [&_ol]:lg:mt-3 [&_ol]:xl:mt-4"
                    style={{
                      color: getBrandColor('black')
                    }}
                    dangerouslySetInnerHTML={{ __html: section.title ? `<h2 class="text-lg lg:text-xl xl:text-2xl font-bold mb-2 lg:mb-3 xl:mb-4 mt-0">${section.title}</h2>${section.content}` : section.content }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

