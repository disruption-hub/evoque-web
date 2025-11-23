'use client';

import React from 'react';
import { MapPin, Mail, Globe, ArrowRight } from "lucide-react";
import { getBrandColor } from '@/config/brand-colors';
import { ContactSectionProps } from '@/types/sections';

export default function Contact({
  title,
  description,
  address,
  addressDescription,
  email,
  website,
  ctaText,
  ctaLink,
  ctaDescription
}: ContactSectionProps) {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .contact-title-responsive {
          font-size: clamp(1.25rem, 3vw, 3rem) !important;
        }
        @media (orientation: landscape) and (max-width: 1023px) {
          .contact-title-responsive {
            font-size: clamp(1.25rem, 2.5vw, 2.5rem) !important;
          }
        }
        @media (min-width: 1024px) {
          .contact-title-responsive {
            font-size: clamp(1.25rem, 2.5vw, 2.5rem) !important;
          }
        }
        @media (min-width: 1280px) {
          .contact-title-responsive {
            font-size: clamp(1.25rem, 2vw, 2rem) !important;
          }
        }
      `}} />
    <section id="contact" className="min-h-screen flex items-start bg-white" style={{ paddingTop: 0, marginTop: 0 }}>
      <div className="container mx-auto px-4 w-full pt-8 md:pt-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-3 md:mb-12">
            <h2 
              className="contact-title-responsive font-bold mb-4 md:mb-6"
              style={{ 
                color: getBrandColor('deepNavy')
              }}
            >
              {title || 'Contact Us'}
            </h2>
            {description && (
              <p className="text-sm md:text-xl" style={{ color: '#4a4a4a' }}>
                {description}
              </p>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            {/* Location Info */}
            <div className="space-y-6">
              <div>
                <h3 
                  className="text-lg md:text-2xl font-bold mb-2 md:mb-3"
                  style={{ color: getBrandColor('deepNavy') }}
                >
                  Location
                </h3>
                <div className="flex items-start gap-4 mb-4">
                  <div 
                    className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${getBrandColor('deepNavy')}1a` }}
                  >
                    <MapPin 
                      className="w-6 h-6" 
                      style={{ color: getBrandColor('deepNavy') }}
                    />
                  </div>
                  <div>
                    {address && (
                      <p 
                        className="font-bold text-sm md:text-lg"
                        style={{ color: getBrandColor('deepNavy') }}
                      >
                        {address}
                      </p>
                    )}
                    {addressDescription && (
                      <p className="mt-2" style={{ color: '#4a4a4a' }}>
                        {addressDescription}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <h3 
                  className="text-base md:text-xl font-bold mb-3 md:mb-4"
                  style={{ color: getBrandColor('deepNavy') }}
                >
                  Contact Information
                </h3>
                <div className="flex flex-row gap-6 flex-wrap">
                  {email && (
                    <div className="flex items-center gap-3">
                      <Mail 
                        className="w-5 h-5" 
                        style={{ color: getBrandColor('accentOrange') }}
                      />
                      <a
                        href={`mailto:${email}`}
                        className="transition-colors hover:opacity-80"
                        style={{ color: getBrandColor('deepNavy') }}
                      >
                        {email}
                      </a>
                    </div>
                  )}
                  {website && (
                    <div className="flex items-center gap-3">
                      <Globe 
                        className="w-5 h-5" 
                        style={{ color: getBrandColor('accentOrange') }}
                      />
                      <a
                        href={website.startsWith('http') ? website : `http://${website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="transition-colors hover:opacity-80"
                        style={{ color: getBrandColor('deepNavy') }}
                      >
                        {website}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* CTA Card */}
            <div 
              className="rounded-lg p-8 text-white"
              style={{
                background: `linear-gradient(to bottom right, ${getBrandColor('deepNavy')}, ${getBrandColor('secondaryBlue')})`
              }}
            >
              <h3 className="text-lg md:text-2xl font-bold mb-3 md:mb-4">
                Let's Work Together!
              </h3>
              {ctaDescription && (
                <p className="text-white/90 mb-6 leading-relaxed">
                  {ctaDescription}
                </p>
              )}
              {ctaText && ctaLink && (
                <a
                  href={ctaLink}
                  className="inline-flex items-center justify-center rounded-md font-medium transition-all duration-200 h-11 px-8 w-full sm:w-auto"
                  style={{
                    backgroundColor: getBrandColor('accentOrange'),
                    color: getBrandColor('white'),
                    border: 'none'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = '0.9';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = '1';
                  }}
                >
                  {ctaText}
                  <ArrowRight className="ml-2" size={20} />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
    </>
  );
}

