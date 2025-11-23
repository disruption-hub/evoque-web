import React from 'react';
import { getBrandColor } from '@/config/brand-colors';

/**
 * Deprecated: Split background (50% blue left, 50% white right)
 * This background was used in BeyondStandards.tsx before video background was implemented
 */
export function BeyondStandardsBackground() {
  return (
    <div className="absolute inset-0 grid grid-cols-2 min-h-screen">
      <div style={{ backgroundColor: getBrandColor('deepNavy') }}></div>
      <div style={{ backgroundColor: getBrandColor('white') }}></div>
    </div>
  );
}

