'use client';

import React from 'react';
import { getBrandColor } from '@/config/brand-colors';
import { FormSectionProps } from '@/types/sections';
import { SignInForm } from '@/components/ui/sign-in-form';
import { JoinUsForm } from '@/components/ui/join-us-form';

export default function Form({
  title,
  description,
  formType = 'signin',
  layout = 'vertical',
  heroTitle,
  heroDescription,
  formPosition = 'right'
}: FormSectionProps) {
  const isHorizontal = layout === 'horizontal';
  const patternSVG = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNiIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMSkiIHN0cm9rZS13aWR0aD0iMiIvPjwvZz48L3N2Zz4=";
  const isFormLeft = formPosition === 'left';

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .form-title-responsive {
          font-size: clamp(1.25rem, 3vw, 3rem) !important;
        }
        @media (orientation: landscape) and (max-width: 1023px) {
          .form-title-responsive {
            font-size: clamp(1.25rem, 2.5vw, 2.5rem) !important;
          }
        }
        @media (min-width: 1024px) {
          .form-title-responsive {
            font-size: clamp(1.25rem, 2.5vw, 2.5rem) !important;
          }
        }
        @media (min-width: 1280px) {
          .form-title-responsive {
            font-size: clamp(1.25rem, 2vw, 2rem) !important;
          }
        }
      `}} />
    <section id="form" className={isHorizontal ? '' : 'py-16 md:py-24'} style={{ backgroundColor: isHorizontal ? 'transparent' : getBrandColor('white') + 'F5' }}>
      {isHorizontal ? (
        <div className="h-screen flex items-center">
          <div className="w-full h-full">
            <div className="grid md:grid-cols-2 gap-0 h-full">
              {/* Hero Content */}
              {(heroTitle || heroDescription) && (
                <div className={`relative h-full flex items-center justify-center overflow-hidden ${isFormLeft ? 'order-2 md:order-2' : 'order-2 md:order-1'}`}>
                  {/* Background Gradient */}
                  <div 
                    className="absolute inset-0"
                    style={{
                      background: `linear-gradient(to bottom right, ${getBrandColor('deepNavy')}, ${getBrandColor('secondaryBlue')}, ${getBrandColor('deepNavy')})`
                    }}
                  />
                  {/* Pattern Overlay */}
                  <div 
                    className="absolute inset-0 opacity-20"
                    style={{
                      backgroundImage: `url('${patternSVG}')`
                    }}
                  />
                  
                  {/* Content */}
                  <div className="relative z-10 px-8 py-12 md:px-12 text-center md:text-left">
                    {heroTitle && (
                      <h2 
                        className="form-title-responsive font-bold mb-4 md:mb-6 text-white"
                      >
                        {heroTitle}
                      </h2>
                    )}
                    {heroDescription && (
                      <p 
                        className="text-sm md:text-xl text-white/90 leading-relaxed"
                      >
                        {heroDescription}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Form */}
              <div className={`h-full py-16 md:py-24 px-4 md:px-8 flex items-center justify-center ${isFormLeft ? 'order-1 md:order-1' : 'order-1 md:order-2'}`} style={{ backgroundColor: getBrandColor('white') + 'F5' }}>
                <div className="w-full max-w-md">
                  {formType === 'signin' && <SignInForm />}
                  {formType === 'joinus' && <JoinUsForm />}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Vertical layout header */}
            {(title || description) && (
              <div className="text-center mb-12">
                {title && (
                  <h2 
                    className="form-title-responsive font-bold mb-4 md:mb-6"
                    style={{ 
                      color: getBrandColor('deepNavy')
                    }}
                  >
                    {title}
                  </h2>
                )}
                {description && (
                  <p 
                    className="text-sm md:text-xl leading-relaxed"
                    style={{ color: getBrandColor('black') + 'CC' }}
                  >
                    {description}
                  </p>
                )}
              </div>
            )}

            {/* Form */}
            <div className="flex justify-center">
              {formType === 'signin' && <SignInForm />}
              {formType === 'joinus' && <JoinUsForm />}
            </div>
          </div>
        </div>
      )}
    </section>
    </>
  );
}

