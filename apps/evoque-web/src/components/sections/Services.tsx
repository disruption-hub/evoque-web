'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { getBrandColor } from '@/config/brand-colors';
import { ServicesSectionProps } from '@/types/sections';
import { ColorCircle } from '@/components/ui';

export default function Services({
  title = 'Our Services',
  description,
  services = []
}: ServicesSectionProps) {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .services-title-responsive {
          font-size: clamp(1.25rem, 3vw, 3rem) !important;
        }
        @media (orientation: landscape) and (max-width: 1023px) {
          .services-title-responsive {
            font-size: clamp(1.25rem, 2.5vw, 2.5rem) !important;
          }
        }
        @media (min-width: 1024px) {
          .services-title-responsive {
            font-size: clamp(1.25rem, 2.5vw, 2.5rem) !important;
          }
        }
        @media (min-width: 1280px) {
          .services-title-responsive {
            font-size: clamp(1.25rem, 2vw, 2rem) !important;
          }
        }
      `}} />
    <section id="services" className="min-h-screen flex items-center" style={{ backgroundColor: getBrandColor('white') }}>
      <div className="container mx-auto px-4 w-full">
        <div className="max-w-6xl mx-auto">
          {title && (
            <div className="text-center mb-12">
              <h2 
                className="services-title-responsive font-bold mb-4"
                style={{ 
                  color: getBrandColor('deepNavy')
                }}
              >
                {title}
              </h2>
              {description && (
                <p 
                  className="text-sm md:text-xl max-w-3xl mx-auto"
                  style={{ color: getBrandColor('black') + 'B3' }}
                >
                  {description}
                </p>
              )}
            </div>
          )}
          {services.length > 0 && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {services.map((service, index) => (
                <Link
                  key={index}
                  href={service.href || '#'}
                  className="block h-full"
                >
                  <Card
                    className="border-2 shadow-md hover:shadow-xl transition-all duration-300 group h-full flex flex-col relative overflow-hidden"
                    style={{ 
                      borderColor: getBrandColor('deepNavy') + '1A',
                      backgroundColor: getBrandColor('white')
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = getBrandColor('deepNavy') + '4D';
                      e.currentTarget.style.transform = 'translateY(-4px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = getBrandColor('deepNavy') + '1A';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    {/* Green circle in the right top corner - bigger */}
                    <ColorCircle
                      color={getBrandColor('greenAccent')}
                      borderRadius="rounded-full"
                      translateX={{
                        mobile: "30%",
                        md: "25%",
                        lg: "20%"
                      }}
                      translateY={{
                        mobile: "-30%",
                        md: "-25%",
                        lg: "-20%"
                      }}
                      width="w-40 md:w-48"
                      height="h-40 md:h-48"
                      position="absolute"
                      top="0"
                      right="0"
                      zIndex={0}
                      pointerEvents={true}
                    />
                    
                    <CardContent className="p-6 flex flex-col h-full relative z-10">
                      {service.icon && (
                        <div className="mb-4 relative w-full h-48 rounded-lg overflow-hidden">
                          <Image
                            src={service.icon}
                            alt={service.title || 'Service'}
                            fill
                            className="object-cover group-hover:scale-110 transition-transform duration-300"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          />
                        </div>
                      )}
                      <h3 
                        className="text-base md:text-2xl font-bold mb-3"
                        style={{ color: getBrandColor('deepNavy') }}
                      >
                        {service.title}
                      </h3>
                      {service.description && (
                        <p 
                          className="text-xs leading-relaxed flex-grow"
                          style={{ color: getBrandColor('black') + 'B3' }}
                        >
                          {service.description}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
    </>
  );
}

