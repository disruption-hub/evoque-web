'use client';

import React from 'react';
import { getBrandColor } from '@/config/brand-colors';
import { VisionSectionProps } from '@/types/sections';

export default function Vision({
  title = 'Our Vision',
  description,
  backgroundImage
}: VisionSectionProps) {
  // Parse markdown-style bold text (**text**) and italic text (*text*) and convert to JSX
  const renderDescription = (text: string) => {
    const result: React.ReactNode[] = [];
    
    function processItalic(text: string, startIdx: number): React.ReactNode[] {
      const italicRegex = /\*([^*].*?)\*/g;
      const parts: React.ReactNode[] = [];
      let lastIdx = 0;
      let match;
      
      while ((match = italicRegex.exec(text)) !== null) {
        // Add text before italic
        if (match.index > lastIdx) {
          parts.push(text.substring(lastIdx, match.index));
        }
        // Add italic text
        parts.push(<em key={`italic-${startIdx + parts.length}`}>{match[1]}</em>);
        lastIdx = italicRegex.lastIndex;
      }
      
      // Add remaining text
      if (lastIdx < text.length) {
        parts.push(text.substring(lastIdx));
      }
      
      return parts.length > 0 ? parts : [text];
    }
    
    // Process bold text first (**text**)
    const boldRegex = /\*\*(.*?)\*\*/g;
    let match;
    let lastIndex = 0;
    let hasBold = false;
    
    while ((match = boldRegex.exec(text)) !== null) {
      hasBold = true;
      // Add text before the bold
      if (match.index > lastIndex) {
        const beforeText = text.substring(lastIndex, match.index);
        // Process italic in the before text
        result.push(...processItalic(beforeText, result.length));
      }
      // Add bold text
      result.push(<strong key={`bold-${result.length}`}>{match[1]}</strong>);
      lastIndex = boldRegex.lastIndex;
    }
    
    // Add remaining text
    if (lastIndex < text.length) {
      const remainingText = text.substring(lastIndex);
      result.push(...processItalic(remainingText, result.length));
    }
    
    // If no bold text was found, process the entire text for italic
    if (!hasBold) {
      return processItalic(text, 0);
    }
    
    return result.length > 0 ? result : [text];
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .vision-title-responsive {
          font-size: clamp(1.25rem, 3vw, 3rem) !important;
        }
        @media (orientation: landscape) and (max-width: 1023px) {
          .vision-title-responsive {
            font-size: clamp(1.25rem, 2.5vw, 2.5rem) !important;
          }
        }
        @media (min-width: 1024px) {
          .vision-title-responsive {
            font-size: clamp(1.25rem, 2.5vw, 2.5rem) !important;
          }
        }
        @media (min-width: 1280px) {
          .vision-title-responsive {
            font-size: clamp(1.25rem, 2vw, 2rem) !important;
          }
        }
      `}} />
      <div className="relative z-10 pt-12 md:pt-20 lg:pt-24 flex items-end min-h-screen">
        <div
          className="px-6 pt-8 pb-40 md:px-12 md:pt-10 md:pb-40 rounded-tl-[5rem] rounded-tr-[5rem] md:rounded-tl-[6rem] md:rounded-tr-[6rem] w-full max-w-6xl mx-auto"
          style={{
            backgroundColor: getBrandColor('secondaryBlue'),
            borderRadius: '6rem 6rem 0 0'
          }}
        >
          <div className="max-w-6xl mx-auto">
            {/* Title and Description */}
            <div className="text-center mb-12">
              {title && (
                <h2
                  className="vision-title-responsive font-bold mb-4 md:mb-6"
                  style={{ 
                    color: getBrandColor('white')
                  }}
                >
                  {title}
                </h2>
              )}
              {description && (
                <p
                  className="text-sm md:text-xl leading-relaxed max-w-4xl mx-auto"
                  style={{ color: getBrandColor('white') }}
                >
                  {renderDescription(description)}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

