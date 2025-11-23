import React from 'react';
import S3FilePreview from '@/components/shared/S3FilePreview';

export interface ImageCircleProps {
  src: string;
  alt: string;
  borderRadius?: string | {
    mobile?: string;
    md?: string;
    lg?: string;
  };
  translateX?: string;
  translateY?: string;
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
  top?: string;
  bottom?: string;
  left?: string;
  right?: string;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  overflow?: boolean;
  className?: string;
  style?: React.CSSProperties;
  // S3FilePreview props
  autoplay?: boolean;
  loop?: boolean;
  muted?: boolean;
  controls?: boolean;
  playsInline?: boolean;
  preload?: 'none' | 'metadata' | 'auto';
  disablePreviewModal?: boolean;
  disableSkeleton?: boolean;
}

export default function ImageCircle({
  src,
  alt,
  borderRadius = 'rounded-full',
  translateX,
  translateY,
  width,
  height,
  position = 'absolute',
  zIndex = 10,
  top,
  bottom,
  left,
  right,
  objectFit = 'cover',
  overflow = true,
  className = '',
  style = {},
  autoplay = false,
  loop = false,
  muted = false,
  controls = false,
  playsInline = false,
  preload = 'metadata',
  disablePreviewModal = true,
  disableSkeleton = false
}: ImageCircleProps) {
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
    // Responsive object - use mobile as default
    return {
      borderRadius: borderRadius.mobile || undefined,
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

  // Build transform string
  const buildTransform = () => {
    const transforms: string[] = [];
    if (translateX) transforms.push(`translateX(${translateX})`);
    if (translateY) transforms.push(`translateY(${translateY})`);
    return transforms.length > 0 ? transforms.join(' ') : undefined;
  };

  const transform = buildTransform();
  const borderRadiusStyle = getBorderRadiusStyle();
  const borderRadiusClasses = getBorderRadiusClasses();

  // Split style into outer and inner styles
  // Position-related styles go to outer, transform/border-radius related go to inner
  const { borderTopLeftRadius, borderTopRightRadius, borderBottomLeftRadius, borderBottomRightRadius, borderRadius: styleBorderRadius, transform: styleTransform, ...outerStyleProps } = style;
  
  const outerStyles: React.CSSProperties = {
    position,
    ...(top !== undefined && { top }),
    ...(bottom !== undefined && { bottom }),
    ...(left !== undefined && { left }),
    ...(right !== undefined && { right }),
    zIndex,
    ...outerStyleProps
  };

  // Use styleTransform if provided, otherwise use transform from props
  const finalTransform = styleTransform || transform;
  
  const innerStyles: React.CSSProperties = {
    ...(finalTransform && { transform: finalTransform, transformOrigin: 'center' }),
    overflow: overflow ? 'hidden' : 'visible',
    ...borderRadiusStyle,
    ...(borderTopLeftRadius && { borderTopLeftRadius }),
    ...(borderTopRightRadius && { borderTopRightRadius }),
    ...(borderBottomLeftRadius && { borderBottomLeftRadius }),
    ...(borderBottomRightRadius && { borderBottomRightRadius }),
    ...(styleBorderRadius && !borderRadiusStyle.borderRadius && { borderRadius: styleBorderRadius })
  };

  return (
    <div
      className={`${getWidthClasses()} ${getHeightClasses()} ${className}`}
      style={outerStyles}
    >
      <div
        className={`relative w-full h-full ${borderRadiusClasses}`}
        style={innerStyles}
      >
        <S3FilePreview
          src={src}
          alt={alt}
          className={`w-full h-full object-${objectFit}`}
          style={{ width: '100%', height: '100%', objectFit }}
          autoplay={autoplay}
          loop={loop}
          muted={muted}
          controls={controls}
          playsInline={playsInline}
          preload={preload}
          disablePreviewModal={disablePreviewModal}
          disableSkeleton={disableSkeleton}
        />
      </div>
    </div>
  );
}

