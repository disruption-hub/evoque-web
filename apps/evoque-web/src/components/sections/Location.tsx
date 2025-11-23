import React from 'react';
import Image from 'next/image';
import { getBrandColor } from '@/config/brand-colors';
import { LocationSectionProps } from '@/types/sections';

// Simple function to convert markdown bold (**text**) to HTML
function renderMarkdown(text: string): React.ReactNode {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      const boldText = part.slice(2, -2);
      return <strong key={index}>{boldText}</strong>;
    }
    return <React.Fragment key={index}>{part}</React.Fragment>;
  });
}

export default function Location({
  title,
  location,
  facilityTitle,
  facilityDescription,
  image,
  imageAlt
}: LocationSectionProps) {
  return (
    <section id="location" className="min-h-screen flex items-center bg-muted">
      <div className="container mx-auto px-4 w-full">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            {title && (
              <h2 
                className="text-xl md:text-4xl font-bold mb-4 md:mb-6"
                style={{ color: getBrandColor('deepNavy') }}
              >
                {title}
              </h2>
            )}
            {location && (
              <p className="text-sm md:text-lg text-foreground mb-4 md:mb-6 leading-relaxed">
                {renderMarkdown(location)}
              </p>
            )}
            {facilityTitle && (
              <h3 
                className="text-lg md:text-2xl font-bold mb-3 md:mb-4"
                style={{ color: getBrandColor('deepNavy') }}
              >
                {facilityTitle}
              </h3>
            )}
            {facilityDescription && (
              <p className="text-sm md:text-lg text-foreground leading-relaxed">
                {facilityDescription}
              </p>
            )}
          </div>
          {image && (
            <div className="order-first md:order-last">
              <Image
                src={image}
                alt={imageAlt || 'Location'}
                width={800}
                height={600}
                className="w-full h-80 md:h-96 object-cover rounded-lg shadow-xl"
              />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

