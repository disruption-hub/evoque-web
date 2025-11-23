import React from 'react';
import { getBrandColor } from '@/config/brand-colors';

/**
 * Deprecated: White background
 * This background was used in CompetitiveAdvantage.tsx before video background was implemented
 */
export function CompetitiveAdvantageBackground() {
  return (
    <div style={{ backgroundColor: getBrandColor('white') }} />
  );
}

