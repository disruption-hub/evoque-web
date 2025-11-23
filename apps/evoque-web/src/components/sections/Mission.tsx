'use client';

import React from 'react';
import { getBrandColor } from '@/config/brand-colors';
import { MissionSectionProps } from '@/types/sections';

export default function Mission({
  title = 'Our Mission',
  description,
  backgroundImage
}: MissionSectionProps) {
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
        .mission-title-responsive {
          font-size: clamp(1.25rem, 3vw, 3rem) !important;
        }
        @media (orientation: landscape) and (max-width: 1023px) {
          .mission-title-responsive {
            font-size: clamp(1.25rem, 2.5vw, 2.5rem) !important;
          }
        }
        @media (min-width: 1024px) {
          .mission-title-responsive {
            font-size: clamp(1.25rem, 2.5vw, 2.5rem) !important;
          }
        }
        @media (min-width: 1280px) {
          .mission-title-responsive {
            font-size: clamp(1.25rem, 2vw, 2rem) !important;
          }
        }
      `}} />
      <div className="container mx-auto px-4 w-full relative z-10 min-h-screen flex items-start md:pt-12 lg:pt-16">
        <div className="max-w-4xl mx-auto text-center w-full">
          <div
            className="px-6 py-8 md:px-12 md:py-10 rounded-bl-3xl rounded-br-3xl"
            style={{ 
              backgroundColor: getBrandColor('accentElectricBlue'),
              borderRadius: '0 0 1.5rem 1.5rem'
            }}
          >
            {title && (
              <h2 
                className="mission-title-responsive font-bold mb-4 md:mb-6"
                style={{ 
                  color: getBrandColor('white')
                }}
              >
                {title}
              </h2>
            )}
            {description && (
              <p 
                className="text-sm md:text-xl leading-relaxed"
                style={{ color: getBrandColor('white') }}
              >
                {renderDescription(description)}
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

