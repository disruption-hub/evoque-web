import React from 'react';
import { getBrandColor } from '@/config/brand-colors';

/**
 * Deprecated: Blue gradient with SVG pattern overlay
 * This background was used in Hero.tsx before video background was implemented
 */
export function HeroBackground() {
  // Pattern SVG for background
  const patternSVG = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNiIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMSkiIHN0cm9rZS13aWR0aD0iMiIvPjwvZz48L3N2Zz4=";

  return (
    <>
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
    </>
  );
}

