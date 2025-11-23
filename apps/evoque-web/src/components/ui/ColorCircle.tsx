import React from 'react';
import { getBrandColor } from '@/config/brand-colors';

export interface ColorCircleProps {
  color?: string;
  borderRadius?: string | {
    mobile?: string;
    md?: string;
    lg?: string;
  };
  translateX?: string | {
    mobile?: string;
    md?: string;
    lg?: string;
  };
  translateY?: string | {
    mobile?: string;
    md?: string;
    lg?: string;
  };
  width?: string | {
    mobile?: string;
    md?: string;
    lg?: string;
  };
  height?: string | {
    mobile?: string;
    md?: string;
    lg?: string;
  };
  position?: 'absolute' | 'relative';
  zIndex?: number;
  rotation?: number;
  top?: string;
  bottom?: string;
  left?: string;
  right?: string;
  pointerEvents?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export default function ColorCircle({
  color = getBrandColor('greenAccent'),
  borderRadius = 'rounded-full',
  translateX,
  translateY,
  width,
  height,
  position = 'absolute',
  zIndex = 0,
  rotation = 0,
  top,
  bottom,
  left,
  right,
  pointerEvents = true,
  className = '',
  style = {}
}: ColorCircleProps) {
  // Handle responsive width
  const getWidthClasses = () => {
    if (!width) return '';
    if (typeof width === 'string') return width;
    const classes: string[] = [];
    if (width.mobile) classes.push(width.mobile);
    if (width.md) classes.push(`md:${width.md}`);
    if (width.lg) classes.push(`lg:${width.lg}`);
    return classes.join(' ');
  };

  // Handle responsive height
  const getHeightClasses = () => {
    if (!height) return '';
    if (typeof height === 'string') return height;
    const classes: string[] = [];
    if (height.mobile) classes.push(height.mobile);
    if (height.md) classes.push(`md:${height.md}`);
    if (height.lg) classes.push(`lg:${height.lg}`);
    return classes.join(' ');
  };

  // Handle responsive border radius
  const getBorderRadiusStyle = (): React.CSSProperties => {
    if (!borderRadius) return {};
    if (typeof borderRadius === 'string') {
      // Check if it's a Tailwind class
      if (borderRadius.startsWith('rounded-')) {
        return {};
      }
      // Otherwise it's a custom value
      return { borderRadius };
    }
    // Responsive object
    return {
      borderRadius: borderRadius.mobile || undefined,
      // Use CSS custom properties or media queries would need to be handled differently
      // For now, use mobile as default and handle responsive via classes
    };
  };

  const getBorderRadiusClasses = (): string => {
    if (!borderRadius) return '';
    if (typeof borderRadius === 'string') {
      // If it's a Tailwind class, return it
      if (borderRadius.startsWith('rounded-')) {
        return borderRadius;
      }
      return '';
    }
    // Responsive object - return empty, use inline styles
    return '';
  };

  // Handle responsive translateX and translateY
  const getTranslateX = (): string | undefined => {
    if (!translateX) return undefined;
    if (typeof translateX === 'string') return translateX;
    return translateX.mobile;
  };

  const getTranslateY = (): string | undefined => {
    if (!translateY) return undefined;
    if (typeof translateY === 'string') return translateY;
    return translateY.mobile;
  };

  // Build transform string
  const buildTransform = () => {
    const transforms: string[] = [];
    const tx = getTranslateX();
    const ty = getTranslateY();
    if (tx) transforms.push(`translateX(${tx})`);
    if (ty) transforms.push(`translateY(${ty})`);
    if (rotation !== 0) transforms.push(`rotate(${rotation}deg)`);
    return transforms.length > 0 ? transforms.join(' ') : undefined;
  };

  const transform = buildTransform();
  const borderRadiusStyle = getBorderRadiusStyle();
  const borderRadiusClasses = getBorderRadiusClasses();

  // Build CSS custom properties for responsive transforms
  const getResponsiveTransformStyles = (): Record<string, string> => {
    const styles: Record<string, string> = {};
    if (typeof translateX === 'object' && translateX) {
      styles['--translate-x-mobile'] = translateX.mobile || '0';
      if (translateX.md) styles['--translate-x-md'] = translateX.md;
      if (translateX.lg) styles['--translate-x-lg'] = translateX.lg;
    }
    if (typeof translateY === 'object' && translateY) {
      styles['--translate-y-mobile'] = translateY.mobile || '0';
      if (translateY.md) styles['--translate-y-md'] = translateY.md;
      if (translateY.lg) styles['--translate-y-lg'] = translateY.lg;
    }
    return styles;
  };

  const responsiveTransformStyles = getResponsiveTransformStyles();
  const hasResponsiveTransforms = typeof translateX === 'object' || typeof translateY === 'object';

  const positionStyles: React.CSSProperties = {
    position,
    ...(top !== undefined && { top }),
    ...(bottom !== undefined && { bottom }),
    ...(left !== undefined && { left }),
    ...(right !== undefined && { right }),
    ...(!hasResponsiveTransforms && transform && { transform, transformOrigin: 'center' }),
    ...(hasResponsiveTransforms && {
      transform: `translateX(var(--translate-x-mobile, 0)) translateY(var(--translate-y-mobile, 0))${rotation !== 0 ? ` rotate(${rotation}deg)` : ''}`,
      transformOrigin: 'center'
    }),
    backgroundColor: color,
    zIndex,
    pointerEvents: pointerEvents ? 'none' : 'auto',
    ...borderRadiusStyle,
    ...(responsiveTransformStyles as React.CSSProperties),
    ...style
  };

  // Handle responsive border radius for responsive object
  let responsiveBorderRadiusClasses = '';
  if (typeof borderRadius === 'object' && borderRadius) {
    const classes: string[] = [];
    // We'll need to use inline styles for responsive border radius
    // Tailwind doesn't support arbitrary responsive border radius easily
  }

  // Use a simpler approach: generate a unique class and add style tag
  const circleId = React.useMemo(() => `color-circle-${Math.random().toString(36).substr(2, 9)}`, []);

  return (
    <>
      {hasResponsiveTransforms && (
        <style dangerouslySetInnerHTML={{
          __html: `
            @media (min-width: 768px) {
              .${circleId} {
                ${typeof translateX === 'object' && translateX?.md ? `--translate-x-mobile: ${translateX.md};` : ''}
                ${typeof translateY === 'object' && translateY?.md ? `--translate-y-mobile: ${translateY.md};` : ''}
              }
            }
            @media (min-width: 1024px) {
              .${circleId} {
                ${typeof translateX === 'object' && translateX?.lg ? `--translate-x-mobile: ${translateX.lg};` : ''}
                ${typeof translateY === 'object' && translateY?.lg ? `--translate-y-mobile: ${translateY.lg};` : ''}
              }
            }
          `
        }} />
      )}
      <div
        className={`${getWidthClasses()} ${getHeightClasses()} ${borderRadiusClasses} ${hasResponsiveTransforms ? circleId : ''} ${className}`}
        style={positionStyles}
      />
    </>
  );
}

