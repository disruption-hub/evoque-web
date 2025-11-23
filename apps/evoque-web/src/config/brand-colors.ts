/**
 * E-Voque Brand Colors
 * RGB values and hex codes for consistent branding
 */

export const brandColors = {
  // Main corporate color
  deepNavy: {
    rgb: 'rgb(27, 27, 104)',
    hex: '#1B1B68',
    name: 'Deep Navy',
    purpose: 'Main corporate color'
  },
  
  // Secondary blue
  secondaryBlue: {
    rgb: 'rgb(29, 51, 149)',
    hex: '#1D3395',
    name: 'Secondary Blue',
    purpose: 'Secondary brand color'
  },
  
  // Accent electric blue
  accentElectricBlue: {
    rgb: 'rgb(137, 136, 252)',
    hex: '#8988FC',
    name: 'Accent Electric Blue',
    purpose: 'Accent color'
  },
  
  // Accent orange
  accentOrange: {
    rgb: 'rgb(255, 171, 34)',
    hex: '#FFAB22',
    name: 'Accent Orange',
    purpose: 'Accent color'
  },
  
  // Green accent
  greenAccent: {
    rgb: 'rgb(89, 160, 71)',
    hex: '#59A047',
    name: 'Green Accent',
    purpose: 'Accent color'
  },
  
  // Black
  black: {
    rgb: 'rgb(0, 0, 0)',
    hex: '#000000',
    name: 'Black',
    purpose: 'Text and contrast'
  },
  
  // White
  white: {
    rgb: 'rgb(255, 255, 255)',
    hex: '#FFFFFF',
    name: 'White',
    purpose: 'Background and contrast'
  }
} as const;

// Helper function to get color by name
export function getBrandColor(colorName: keyof typeof brandColors): string {
  return brandColors[colorName].hex;
}

// CSS variables for Tailwind (can be used in globals.css)
export const brandColorCSS = `
  :root {
    --color-deep-navy: ${brandColors.deepNavy.hex};
    --color-secondary-blue: ${brandColors.secondaryBlue.hex};
    --color-accent-electric-blue: ${brandColors.accentElectricBlue.hex};
    --color-accent-orange: ${brandColors.accentOrange.hex};
    --color-green-accent: ${brandColors.greenAccent.hex};
    --color-black: ${brandColors.black.hex};
    --color-white: ${brandColors.white.hex};
  }
`;

