'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Image from 'next/image';
import { useS3FileCache } from '@/hooks/useS3FileCache';
import { 
  FileIcon, 
  FileTextIcon, 
  FileSpreadsheetIcon, 
  PresentationIcon, 
  FileCodeIcon, 
  FileArchiveIcon, 
  FileAudioIcon, 
  FileVideoIcon, 
  FileImageIcon, 
  FileJsonIcon
} from 'lucide-react';

interface S3FilePreviewProps {
  src: string;
  alt?: string;
  className?: string;
  style?: React.CSSProperties;
  fileType?: string;
  showDownload?: boolean;
  fileName?: string;
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
  onLoad?: () => void;
  onError?: (error?: React.SyntheticEvent<HTMLImageElement, Event>) => void;
  onDimensionsLoaded?: (dimensions: {width: number; height: number}) => void;
  disablePreviewModal?: boolean;
  modalClassName?: string;
  disableSkeleton?: boolean;
  // Force use of regular img tag instead of Next.js Image
  forceImgTag?: boolean;
  // Video-specific props
  autoplay?: boolean;
  loop?: boolean;
  muted?: boolean;
  controls?: boolean;
  playsInline?: boolean;
  preload?: 'none' | 'metadata' | 'auto';
  // Priority loading - bypasses lazy loading and loads immediately
  priority?: boolean;
  // Video poster image URL (thumbnail/preview image)
  poster?: string;
}

// Función para determinar el tipo de archivo a partir de la URL
const getFileTypeFromUrl = (url: string): string => {
  // Check for query params and get the real file extension
  const cleanUrl = url.split('?')[0];
  const extension = cleanUrl.split('.').pop()?.toLowerCase();
  
  if (!extension) {
    // Try to detect PDFs from the pattern in S3 key
    if (url.includes('-') && url.toLowerCase().includes('pdf')) {
      return 'application/pdf';
    }
    return 'application/octet-stream';
  }
  
  switch (extension) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'gif':
      return 'image/gif';
    case 'webp':
      return 'image/webp';
    case 'svg':
      return 'image/svg+xml';
    case 'pdf':
      return 'application/pdf';
    case 'mp4':
      return 'video/mp4';
    case 'webm':
      return 'video/webm';
    case 'mov':
      return 'video/quicktime';
    case 'doc':
    case 'docx':
      return 'application/msword';
    case 'xls':
    case 'xlsx':
      return 'application/vnd.ms-excel';
    case 'ppt':
    case 'pptx':
      return 'application/vnd.ms-powerpoint';
    case 'csv':
      return 'text/csv';
    case 'txt':
      return 'text/plain';
    case 'json':
      return 'application/json';
    case 'html':
    case 'htm':
      return 'text/html';
    case 'css':
      return 'text/css';
    case 'js':
      return 'application/javascript';
    case 'zip':
    case 'rar':
      return 'application/zip';
    case 'mp3':
    case 'wav':
    case 'ogg':
      return 'audio/mpeg';
    default:
      return 'application/octet-stream';
  }
};

// Función para categorizar tipos de archivos
const categorizeFileType = (fileType: string): string => {
  if (fileType.startsWith('image/')) return 'image';
  if (fileType.startsWith('video/')) return 'video';
  if (fileType.startsWith('audio/')) return 'audio';
  if (fileType === 'application/pdf') return 'pdf';
  if (fileType === 'application/msword' || fileType.includes('wordprocessingml')) return 'document';
  if (fileType === 'application/vnd.ms-excel' || fileType.includes('spreadsheetml')) return 'spreadsheet';
  if (fileType === 'application/vnd.ms-powerpoint' || fileType.includes('presentationml')) return 'presentation';
  if (fileType === 'text/csv') return 'csv';
  if (fileType === 'text/plain') return 'text';
  if (fileType === 'application/json' || fileType === 'text/json') return 'json';
  if (fileType.includes('html')) return 'html';
  if (fileType.includes('javascript') || fileType.includes('typescript')) return 'code';
  if (fileType.includes('zip') || fileType.includes('compressed') || fileType.includes('archive')) return 'archive';
  return 'other';
};

/**
 * Componente optimizado para mostrar previsualizaciones de archivos de S3
 * Usa caché global para evitar múltiples llamadas a la API
 */
const S3FilePreview = ({ 
  src, 
  alt = 'File preview', 
  className = '', 
  style,
  fileType: providedFileType,
  fileName,
  onClick,
  onLoad,
  onError,
  onDimensionsLoaded,
  disablePreviewModal = false,
  modalClassName,
  disableSkeleton = false,
  forceImgTag = false,
  // Video props with defaults
  autoplay = false,
  loop = false,
  muted = false,
  controls = true,
  playsInline = false,
  preload = 'metadata',
  priority = false,
  poster,
}: S3FilePreviewProps) => {
  const [imageError, setImageError] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [fileNotFound, setFileNotFound] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadStartTime, setLoadStartTime] = useState<number>(0);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [detectedContentType, setDetectedContentType] = useState<string | null>(null);
  const [generatedPosterUrl, setGeneratedPosterUrl] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [shouldAutoplay, setShouldAutoplay] = useState(autoplay);
  const [aspectRatio, setAspectRatio] = useState<number | null>(null);
  const [computedObjectFit, setComputedObjectFit] = useState<'contain' | 'cover' | 'fill' | 'none' | 'scale-down'>('cover');
  const videoContainerRef = useRef<HTMLDivElement>(null);
  
  // Use the S3 file cache hook with error handling
  const s3CacheResult = useS3FileCache(src || '');
  const { finalUrl, isS3Url, s3Key } = s3CacheResult;
  
  // Add safety checks for the hook results
  const safeFinalUrl = finalUrl || src;
  const safeIsS3Url = Boolean(isS3Url);
  const safeS3Key = s3Key || null;
  
  // Normalize /api/v1/media/download URLs to /api/media/download
  const normalizedFinalUrl = useMemo(() => {
    if (!safeFinalUrl) return safeFinalUrl;
    if (safeFinalUrl.includes('/api/v1/media/download')) {
      try {
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost';
        const url = new URL(safeFinalUrl, baseUrl);
        const keyParam = url.searchParams.get('key');
        const viewParam = url.searchParams.get('view');
        if (keyParam) {
          return `/api/media/download?key=${encodeURIComponent(keyParam)}${viewParam ? `&view=${viewParam}` : '&view=true'}`;
        }
      } catch (_error) {
        // If URL parsing fails, return original
      }
    }
    return safeFinalUrl;
  }, [safeFinalUrl]);
  
  // Memoize the file analysis to avoid recalculation on every render
  const fileAnalysis = useMemo(() => {
    if (!src) return null;
    
    // Extract key from API URL if present (e.g., /api/media/download?key=filename.mp4&view=true)
    // Normalize /api/v1/media/download to /api/media/download
    let normalizedSrc = src;
    if (src.includes('/api/v1/media/download')) {
      try {
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost';
        const url = new URL(src, baseUrl);
        const keyParam = url.searchParams.get('key');
        const viewParam = url.searchParams.get('view');
        if (keyParam) {
          normalizedSrc = `/api/media/download?key=${encodeURIComponent(keyParam)}${viewParam ? `&view=${viewParam}` : '&view=true'}`;
        }
      } catch (_error) {
        // If URL parsing fails, use original src
      }
    }
    
    let fileKey = normalizedSrc;
    if (normalizedSrc.includes('/api/media/download') || normalizedSrc.includes('/api/v1/media/download')) {
      try {
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost';
        const url = new URL(normalizedSrc, baseUrl);
        const keyParam = url.searchParams.get('key');
        if (keyParam) {
          // Remove query parameters from the key itself if present (e.g., "photo-123?w=1920" -> "photo-123")
          fileKey = keyParam.split('?')[0].split('&')[0];
        }
      } catch (_error) {
        // If URL parsing fails, use original src
      }
    }
    
    // Determinar el tipo de archivo - check both original src and extracted key
    let detectedFileType = providedFileType || getFileTypeFromUrl(fileKey) || getFileTypeFromUrl(normalizedSrc) || getFileTypeFromUrl(src);
    
    // More robust file type detection based on URL patterns - check both src and fileKey
    const urlLower = normalizedSrc.toLowerCase();
    const keyLower = fileKey.toLowerCase();
    
    // Check for known image hosting services (Unsplash, etc.) - assume images
    const isKnownImageHost = urlLower.includes('unsplash.com') || 
                            urlLower.includes('images.unsplash.com') ||
                            urlLower.includes('pexels.com') ||
                            urlLower.includes('pixabay.com') ||
                            (urlLower.includes('photo-') && (urlLower.includes('?w=') || urlLower.includes('&w=')));
    
    // Override detection for common image formats - check both URL and key
    if (urlLower.includes('.png') || urlLower.includes('png') || keyLower.includes('.png') || keyLower.includes('png')) {
      detectedFileType = 'image/png';
    } else if (urlLower.includes('.jpg') || urlLower.includes('.jpeg') || urlLower.includes('jpg') || urlLower.includes('jpeg') || 
               keyLower.includes('.jpg') || keyLower.includes('.jpeg') || keyLower.includes('jpg') || keyLower.includes('jpeg')) {
      detectedFileType = 'image/jpeg';
    } else if (urlLower.includes('.gif') || urlLower.includes('gif') || keyLower.includes('.gif') || keyLower.includes('gif')) {
      detectedFileType = 'image/gif';
    } else if (urlLower.includes('.webp') || urlLower.includes('webp') || keyLower.includes('.webp') || keyLower.includes('webp')) {
      detectedFileType = 'image/webp';
    } else if (urlLower.includes('.svg') || urlLower.includes('svg') || keyLower.includes('.svg') || keyLower.includes('svg')) {
      detectedFileType = 'image/svg+xml';
    } else if (urlLower.includes('.pdf') || urlLower.includes('pdf') || keyLower.includes('.pdf') || keyLower.includes('pdf')) {
      detectedFileType = 'application/pdf';
    } else if (urlLower.includes('.mp4') || urlLower.includes('mp4') || keyLower.includes('.mp4') || keyLower.includes('mp4')) {
      detectedFileType = 'video/mp4';
    } else if (urlLower.includes('.webm') || urlLower.includes('webm') || keyLower.includes('.webm') || keyLower.includes('webm')) {
      detectedFileType = 'video/webm';
    } else if (urlLower.includes('.mov') || urlLower.includes('mov') || keyLower.includes('.mov') || keyLower.includes('mov')) {
      detectedFileType = 'video/quicktime';
    } else if (isKnownImageHost) {
      // Assume images from known image hosting services
      detectedFileType = 'image/jpeg';
    } else if (safeIsS3Url && safeS3Key && !detectedFileType.includes('pdf') && !detectedFileType.includes('video')) {
      // For S3 URLs without clear extension, check if it's likely an image
      // Common image patterns in S3 keys
      if (keyLower.includes('photo') || keyLower.includes('image') || keyLower.includes('img') || 
          keyLower.includes('picture') || keyLower.match(/^[a-z0-9-]+$/)) {
        // If it looks like an image key (alphanumeric with dashes, no extension), assume JPEG
        detectedFileType = 'image/jpeg';
      }
    }
    
    // Fallback: If we still don't have a clear type and it's from S3/API, default to image for unknown types
    // This handles cases where the key doesn't have an extension but is actually an image
    if (detectedFileType === 'application/octet-stream' && safeIsS3Url && safeS3Key) {
      // Check if it's definitely NOT a video or PDF
      const definitelyNotImage = keyLower.includes('.pdf') || 
                                 keyLower.includes('.mp4') || 
                                 keyLower.includes('.webm') || 
                                 keyLower.includes('.mov') ||
                                 keyLower.includes('video');
      if (!definitelyNotImage) {
        // Default to image for unknown S3 files (most S3 files in this context are images)
        detectedFileType = 'image/jpeg';
      }
    }
    
    // Special case: check filename for PDF if not already detected
    if (!detectedFileType.includes('pdf') && 
        (fileName && fileName.toLowerCase().endsWith('.pdf'))) {
      detectedFileType = 'application/pdf';
    }
    
    // Use detected content type from API response if available
    if (detectedContentType && detectedContentType.startsWith('image/')) {
      detectedFileType = detectedContentType;
    } else if (detectedContentType && detectedContentType.startsWith('video/')) {
      detectedFileType = detectedContentType;
    }
    
    // Actualizar estados derivados del tipo de archivo
    const isImage = detectedFileType.startsWith('image/');
    const isPdf = detectedFileType === 'application/pdf';
    const isVideo = detectedFileType.startsWith('video/');
    const isSvg = detectedFileType === 'image/svg+xml' || 
                  urlLower.includes('.svg') || urlLower.includes('svg');
    
    // Determinar la categoría del archivo
    const fileCategory = categorizeFileType(detectedFileType);
    
    return {
      detectedFileType,
      isImage,
      isPdf,
      isVideo,
      isSvg,
      fileCategory
    };
  }, [src, providedFileType, fileName, detectedContentType, safeIsS3Url, safeS3Key]);

  // Reset error and loading state when src changes
  useEffect(() => {
    setImageError(false);
    setVideoError(false);
    setFileNotFound(false);
    setIsLoading(true);
    setLoadStartTime(Date.now());
    setIsPreviewOpen(false);
    
    // Fallback timeout: clear loading state after 30 seconds to prevent infinite loading
    const timeoutId = setTimeout(() => {
      setIsLoading((prevLoading) => {
        if (prevLoading) {
          if (process.env.NODE_ENV === 'development') {
            console.warn('[S3FilePreview] Loading timeout after 30s for:', src);
          }
          return false;
        }
        return prevLoading;
      });
    }, 30000);
    
    return () => {
      clearTimeout(timeoutId);
    };
  }, [src, normalizedFinalUrl]);

  // State for Intersection Observer (lazy loading)
  const [isInView, setIsInView] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for lazy loading videos and images
  useEffect(() => {
    // Skip lazy loading if priority is true (load immediately for priority content like background videos)
    if (priority) {
      setIsInView(true);
      return;
    }
    
    // Skip if autoplay is true (load immediately for autoplay videos)
    if (autoplay && fileAnalysis?.isVideo) {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            // Disconnect once loaded
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '50px', // Start loading 50px before entering viewport
      }
    );

    const currentRef = containerRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
      observer.disconnect();
    };
  }, [priority, autoplay, fileAnalysis?.isVideo]);

  // Don't fetch video as blob URL - let browser handle streaming natively
  // This prevents duplicate requests and allows efficient range requests (206 responses)
  // The browser's native video element handles streaming much better than fetching the entire file
  // No useEffect needed - we just use the URL directly in the video element

  // Setup video autoplay for background videos (similar to zoom.tsx)
  useEffect(() => {
    if (!videoRef.current || !fileAnalysis?.isVideo || !shouldAutoplay) return;

    const video = videoRef.current;
    
    // Force controls to false for autoplay videos
    const shouldShowControls = autoplay ? false : controls;
    
    // Set video attributes for background playback
    video.autoplay = autoplay;
    video.muted = true; // Always muted for autoplay (required for mobile)
    video.loop = loop;
    video.playsInline = true; // Always true for mobile autoplay
    video.controls = shouldShowControls;
    video.crossOrigin = 'anonymous'; // Required for CORS and optimized loading
    video.setAttribute('playsinline', 'true'); // For iOS compatibility
    video.setAttribute('muted', 'true'); // Also set as attribute for compatibility
    video.setAttribute('autoplay', 'true'); // Set as attribute for compatibility
    video.setAttribute('webkit-playsinline', 'true'); // For older iOS
    video.setAttribute('crossorigin', 'anonymous'); // Also set as attribute for compatibility
    video.preload = preload || 'auto'; // Preload video for smoother playback
    
    // Set poster attribute if available (will show while video loads)
    // This will be updated dynamically when the frame is captured
    const updatePoster = () => {
      if (video && (poster || generatedPosterUrl)) {
        video.poster = poster || generatedPosterUrl || '';
      }
    };
    
    updatePoster();
    
    // Update poster when generatedPosterUrl becomes available
    if (generatedPosterUrl) {
      video.poster = generatedPosterUrl;
    }
    
    // Try to play the video
    const playVideo = async () => {
      if (!video || !shouldAutoplay) return;
      
      try {
        // Ensure video is muted (required for autoplay)
        video.muted = true;
        await video.play();
      } catch (error) {
          // Silently handle autoplay errors (browser restrictions)
          if (process.env.NODE_ENV === 'development') {
            console.warn('[S3FilePreview] Video autoplay failed:', error);
          }
      }
    };

    // Try to play immediately if video is ready
    if (video.readyState >= 2) { // HAVE_CURRENT_DATA
      playVideo();
    } else {
        // Wait for video to be ready - prioritize canplaythrough for full loading
        video.addEventListener('canplaythrough', playVideo, { once: true });
        video.addEventListener('canplay', playVideo, { once: true });
        video.addEventListener('loadedmetadata', playVideo, { once: true });
        video.addEventListener('loadeddata', playVideo, { once: true });
    }

    // Also try after a short delay to catch dynamically loaded videos
    const timeoutId = setTimeout(playVideo, 200);

    // Global user interaction handler for mobile autoplay
    // On mobile, autoplay requires user interaction, so we listen for the first touch/click
    // IMPORTANT: This must happen synchronously during the touch event for mobile autoplay
    let userInteracted = false;
    const handleUserInteraction = () => {
      if (userInteracted || !video || !shouldAutoplay) return;
      userInteracted = true;
      
      // Ensure video attributes are set for mobile
      video.muted = true;
      video.setAttribute('muted', 'true');
      video.setAttribute('playsinline', 'true');
      video.setAttribute('webkit-playsinline', 'true');
      video.playsInline = true;
      
      // Try to play immediately - must be synchronous during user interaction
      const playPromise = video.play();
      
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          // If immediate play fails, try again when ready
          const tryPlayWhenReady = () => {
            video.play().catch(() => {
              // Silently handle errors
            });
          };
          
          if (video.readyState >= 2) {
            tryPlayWhenReady();
          } else {
            video.addEventListener('canplay', tryPlayWhenReady, { once: true });
            video.addEventListener('loadeddata', tryPlayWhenReady, { once: true });
          }
        });
      }
    };

    // Listen for user interactions (touch/click) in capture phase for immediate response
    // Use capture: true to catch events early, before they bubble
    const events = ['touchstart', 'touchend', 'click', 'mousedown'];
    events.forEach(event => {
      document.addEventListener(event, handleUserInteraction, { once: true, capture: true });
    });

    // Cleanup
    return () => {
      clearTimeout(timeoutId);
      video.removeEventListener('canplaythrough', playVideo);
      video.removeEventListener('canplay', playVideo);
      video.removeEventListener('loadedmetadata', playVideo);
      video.removeEventListener('loadeddata', playVideo);
      events.forEach(event => {
        document.removeEventListener(event, handleUserInteraction);
      });
    };
  }, [normalizedFinalUrl, fileAnalysis?.isVideo, shouldAutoplay, muted, loop, playsInline, controls, preload, poster, generatedPosterUrl]);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Capture first frame of video as poster image if no poster is provided
  // Generate poster for all videos (both autoplay background videos and admin/media videos)
  useEffect(() => {
    if (!fileAnalysis?.isVideo || poster || !videoRef.current || !normalizedFinalUrl) return;
    
    const video = videoRef.current;
    let captured = false;
    
    const captureFrame = () => {
      if (captured) return;
      
      try {
        // Check if video has valid dimensions
        if (video.videoWidth <= 0 || video.videoHeight <= 0) {
          return;
        }
        
        // Create a canvas to capture the video frame
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        
        if (ctx) {
          // Draw the current video frame to the canvas
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          // Convert canvas to blob URL for better performance
          canvas.toBlob((blob) => {
            if (blob && !captured) {
              const posterUrl = URL.createObjectURL(blob);
              setGeneratedPosterUrl(posterUrl);
              captured = true;
            }
          }, 'image/jpeg', 0.8);
        }
      } catch (error) {
        // Silently fail if frame capture doesn't work
        if (process.env.NODE_ENV === 'development') {
          console.warn('[S3FilePreview] Failed to capture video frame:', error);
        }
      }
    };

    // Try to capture frame when video has loaded enough data
    if (video.readyState >= 2) {
      // Video has current frame data
      captureFrame();
    } else {
      // Wait for video to load metadata/frame
      const handleMetadata = () => {
        // Seek to first frame (0 seconds) to ensure we get the first frame
        video.currentTime = 0;
      };
      
      const handleSeeked = () => {
        captureFrame();
        video.removeEventListener('seeked', handleSeeked);
      };
      
      video.addEventListener('loadedmetadata', handleMetadata, { once: true });
      video.addEventListener('seeked', handleSeeked, { once: true });
      video.addEventListener('loadeddata', captureFrame, { once: true });
    }

    // Cleanup: revoke object URL when component unmounts or video changes
    return () => {
      if (generatedPosterUrl) {
        URL.revokeObjectURL(generatedPosterUrl);
      }
    };
  }, [fileAnalysis?.isVideo, poster, normalizedFinalUrl, generatedPosterUrl]);


  // Preload image only when in view (lazy loading)
  useEffect(() => {
    // Only preload images that are in view or above the fold
    if (!normalizedFinalUrl || !fileAnalysis?.isImage) return;
    
    // Skip lazy loading for priority content, autoplay videos (they load immediately)
    if (priority || autoplay) {
      setIsInView(true);
    }

    // Only preload when in view, priority, or autoplay
    if (!isInView && !autoplay && !priority) return;

    const img = new window.Image();
    img.onload = () => {
      // Image loaded successfully
    };
    img.onerror = () => {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[S3FilePreview] Image preload failed:', normalizedFinalUrl);
      }
    };
    img.src = normalizedFinalUrl;
  }, [normalizedFinalUrl, fileAnalysis?.isImage, isInView, autoplay, priority]);

  useEffect(() => {
    if (!isPreviewOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsPreviewOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPreviewOpen]);

  // Early return for invalid src - moved after all hooks
  if (!src || typeof src !== 'string' || src.trim() === '') {
    return null;
  }

  // Handler for successful image load
  const handleImageLoad = (event: React.SyntheticEvent<HTMLImageElement, Event>) => {
    try {
      const target = event.currentTarget as HTMLImageElement;
      
      setIsLoading(false);
      
      // Call external onLoad callback if provided
      if (onLoad) {
        onLoad();
      }
      
      // Capture image dimensions and calculate aspect ratio
      if (target.naturalWidth && target.naturalHeight) {
        const dimensions = {
          width: target.naturalWidth,
          height: target.naturalHeight
        };
        
        // Calculate aspect ratio
        const ratio = dimensions.width / dimensions.height;
        setAspectRatio(ratio);
        
        // Determine objectFit based on aspect ratio
        const is9to16 = Math.abs(ratio - 0.5625) < 0.01;
        const is16to9 = Math.abs(ratio - 1.7777777777777777) < 0.01;
        setComputedObjectFit((is9to16 || is16to9) ? 'contain' : 'cover');
        
        // Call the callback if provided
        if (onDimensionsLoaded) {
          onDimensionsLoaded(dimensions);
        }
      }
      
      if (process.env.NODE_ENV === 'development') {
      }
    } catch {
      setIsLoading(false);
      if (process.env.NODE_ENV === 'development') {
        console.warn("[S3FilePreview] Image loaded but logging failed");
      }
    }
  };

  // Handler for image error - completely silent to prevent Next.js unhandled errors
  const handleImageError = async (error?: React.SyntheticEvent<HTMLImageElement, Event>) => {
    // Prevent the error from bubbling up and being treated as unhandled
    if (error) {
      try {
        error.preventDefault();
        error.stopPropagation();
      } catch {
        // Silently handle any preventDefault/stopPropagation errors
      }
    }

    setIsLoading(false);
    setImageError(true);

    // Check if it's a 404 error by trying to fetch the URL
    if (normalizedFinalUrl && normalizedFinalUrl.includes('/api/media/download')) {
      try {
        const response = await fetch(normalizedFinalUrl, { method: 'HEAD' });
        if (response.status === 404) {
          setFileNotFound(true);
        }
      } catch (fetchError) {
        // If fetch fails, assume it might be a 404
        if (normalizedFinalUrl.includes('/api/media/download')) {
          setFileNotFound(true);
        }
      }
    }

    // Call external onError callback if provided
    if (onError) {
      onError(error);
    }

    try {
      const loadTime = Date.now() - loadStartTime;
      
      // Only log in development mode to avoid console errors in production
      if (process.env.NODE_ENV === 'development') {
        console.warn("[S3FilePreview] Error loading image");
        console.warn("- Source URL:", src || 'unknown');
        console.warn("- Final URL:", safeFinalUrl || 'unknown');
        console.warn("- Is S3 URL:", safeIsS3Url);
        console.warn("- S3 Key:", safeS3Key || 'unknown');
        console.warn("- Error Type:", error?.type || 'unknown');
        console.warn("- File Name:", fileName || 'unknown');
        console.warn("- Failed after:", `${loadTime}ms`);
        console.warn("- Timestamp:", new Date().toISOString());
      }
    } catch {
      // Completely silent fallback - no logging to avoid any console errors
    }
  };
  
  // Mostrar nada si no hay URL o análisis
  if (!src || !fileAnalysis) {
    return null;
  }
  
  const { isImage, isPdf, isVideo, fileCategory } = fileAnalysis;
  // Disable preview modal for videos with autoplay (background videos) or if explicitly disabled
  const shouldEnablePreviewModal = !disablePreviewModal && (isImage || (isVideo && !shouldAutoplay));
  const displayFileName = fileName || src.split('/').pop() || 'download';
  
  // Generate poster URL for videos if not provided
  // Use provided poster, generated poster from first frame, or undefined (browser will show first frame)
  const videoPoster = poster || generatedPosterUrl || undefined;
  
  // Función para renderizar el icono basado en el tipo de archivo
  const renderFileIcon = () => {
    switch (fileCategory) {
      case 'pdf':
        return <FileTextIcon className="h-12 w-12 text-red-500" />;
      case 'document':
        return <FileTextIcon className="h-12 w-12 text-blue-500" />;
      case 'spreadsheet':
        return <FileSpreadsheetIcon className="h-12 w-12 text-green-500" />;
      case 'presentation':
        return <PresentationIcon className="h-12 w-12 text-orange-500" />;
      case 'code':
        return <FileCodeIcon className="h-12 w-12 text-purple-500" />;
      case 'archive':
        return <FileArchiveIcon className="h-12 w-12 text-yellow-600" />;
      case 'audio':
        return <FileAudioIcon className="h-12 w-12 text-pink-500" />;
      case 'video':
        return <FileVideoIcon className="h-12 w-12 text-purple-600" />;
      case 'image':
        return <FileImageIcon className="h-12 w-12 text-blue-400" />;
      case 'json':
        return <FileJsonIcon className="h-12 w-12 text-amber-500" />;
      default:
        return <FileIcon className="h-12 w-12 text-gray-500" />;
    }
  };
  
  // Skeleton loader component
  const SkeletonLoader = () => (
    <div className={`flex items-center justify-center w-full h-full bg-gray-200 animate-shimmer ${className}`}>
      <div className="flex flex-col items-center space-y-2">
        <div className="w-8 h-8 bg-gray-300 rounded animate-pulse"></div>
        <div className="w-16 h-2 bg-gray-300 rounded animate-pulse"></div>
        <div className="w-12 h-1 bg-gray-300 rounded animate-pulse"></div>
      </div>
    </div>
  );
  
  // Render image component - no background for transparent images
  const renderImage = () => {
    if (fileNotFound) {
      return (
        <div className={`flex items-center justify-center w-full h-full bg-gray-100 border-2 border-dashed border-gray-300 rounded ${className}`}>
          <div className="flex flex-col items-center space-y-2 text-center p-4">
            {renderFileIcon()}
            <span className="text-sm font-medium text-gray-600">File not found</span>
            <span className="text-xs text-gray-500">The requested file does not exist in storage</span>
          </div>
        </div>
      );
    }

    if (imageError) {
      return (
        <div className="flex items-center justify-center w-full h-full bg-gray-100 text-gray-400 p-4 text-center">
          <div>
            <FileImageIcon className="h-8 w-8 mx-auto mb-2" />
            <span className="text-xs block mb-1">Error loading image</span>
            <span className="text-xs text-gray-500 block">
              Try refreshing with Ctrl+Shift+R
            </span>
          </div>
        </div>
      );
    }
    
    // Determine objectFit based on aspect ratio
    // If aspect ratio is detected and NOT exactly 9:16 (0.5625) or 16:9 (1.777...), use cover
    // Otherwise use the style's objectFit or default to contain
    const validObjectFitValues = ['contain', 'cover', 'fill', 'none', 'scale-down'] as const;
    type ValidObjectFit = typeof validObjectFitValues[number];
    
    let objectFit: ValidObjectFit;
    if (style?.objectFit && validObjectFitValues.includes(style.objectFit as ValidObjectFit)) {
      // Explicitly set with valid value, use it
      objectFit = style.objectFit as ValidObjectFit;
    } else if (aspectRatio !== null) {
      // Check if aspect ratio is exactly 9:16 (0.5625) or 16:9 (1.777...)
      const is9to16 = Math.abs(aspectRatio - 0.5625) < 0.01; // Allow small floating point differences
      const is16to9 = Math.abs(aspectRatio - 1.7777777777777777) < 0.01;
      objectFit = (is9to16 || is16to9) ? 'contain' : 'cover';
    } else {
      // No aspect ratio detected yet, default to cover for better visual experience
      objectFit = 'cover';
    }
    
    // Remove object-contain/object-cover from className if style has objectFit
    const imageClassName = className.replace(/object-\w+/g, '').trim();
    
    // Special handling for common image formats - try direct loading first
    const srcLower = src.toLowerCase();
    const isCommonImageFormat = srcLower.includes('.png') || 
                               srcLower.includes('.jpg') || 
                               srcLower.includes('.jpeg') || 
                               srcLower.includes('.webp') ||
                               srcLower.includes('.svg');
    
    // Check if URL has query strings (Next.js Image doesn't support query strings)
    const hasQueryString = src.includes('?') || normalizedFinalUrl.includes('?');
    
    if (isCommonImageFormat) {
      // Use regular img tag if URL has query strings (Next.js Image restriction) or if forceImgTag is true
      if (hasQueryString || forceImgTag) {
        return (
          <div className="relative w-full h-full overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={normalizedFinalUrl || src}
              alt={alt}
              className={`w-full h-full transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'} ${imageClassName}`}
              style={{ ...style, objectFit }}
              onLoad={handleImageLoad}
              onError={handleImageError}
              loading={priority ? "eager" : "lazy"}
            />
            {isLoading && !disableSkeleton && (
              <div className="absolute inset-0 z-20">
                <SkeletonLoader />
              </div>
            )}
          </div>
        );
      }
      
      // Use Next.js Image for URLs without query strings
      return (
        <div className="relative w-full h-full overflow-hidden">
          <Image
            src={src} // Use original URL directly for common image formats
            alt={alt}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className={`w-full h-full transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'} ${imageClassName}`}
            style={{ ...style, objectFit }}
            onLoad={handleImageLoad}
            onError={(e) => {
              // If direct load fails, try the API route
              const target = e.currentTarget as HTMLImageElement;
              target.src = normalizedFinalUrl;
            }}
            priority={priority}
            {...(priority ? {} : { loading: 'lazy' })}
          />
          {isLoading && (
            <div className="absolute inset-0 z-20">
              <SkeletonLoader />
            </div>
          )}
        </div>
      );
    }
    
    // For SVG files served through our API, use regular img tag if forceImgTag is true or has query string
    if (safeIsS3Url && safeS3Key && (normalizedFinalUrl.includes('.svg') || src.includes('.svg'))) {
      if (forceImgTag || hasQueryString) {
        return (
          <div className="relative w-full h-full overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={normalizedFinalUrl} 
              alt={alt}
              className={`w-full h-full transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'} ${imageClassName}`}
              style={{ ...style, objectFit }}
              onLoad={handleImageLoad}
              onError={handleImageError}
              loading={priority ? "eager" : "lazy"}
            />
            {isLoading && !disableSkeleton && (
              <div className="absolute inset-0 z-20">
                <SkeletonLoader />
              </div>
            )}
          </div>
        );
      }
      return (
        <div className="relative w-full h-full overflow-hidden">
          <Image
            src={normalizedFinalUrl} 
            alt={alt}
            width={1000}
            height={1000}
            className={`w-full h-full transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'} ${imageClassName}`}
            style={{ ...style, objectFit }}
            onLoad={handleImageLoad}
            onError={handleImageError}
            priority={priority}
            {...(priority ? {} : { loading: 'lazy' })}
          />
          {isLoading && (
            <div className="absolute inset-0 z-20">
              <SkeletonLoader />
            </div>
          )}
        </div>
      );
    }
    
    // For all other S3 files served through our API, check if URL has query strings
    if (safeIsS3Url && safeS3Key) {
      // Check if URL has query strings (like /api/v1/media/download?key=...&view=true)
      const hasQueryString = normalizedFinalUrl.includes('?') || src.includes('?');
      
      // Use regular img tag for API routes with query strings (Next.js Image doesn't support query strings) or if forceImgTag is true
      if (hasQueryString || forceImgTag) {
        return (
          <div className="relative w-full h-full overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={normalizedFinalUrl}
              alt={alt}
              className={`w-full h-full transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'} ${imageClassName}`}
              style={{ ...style, objectFit }}
              onLoad={handleImageLoad}
              onError={handleImageError}
              loading={priority ? "eager" : "lazy"}
            />
            {isLoading && !disableSkeleton && (
              <div className="absolute inset-0 z-20">
                <SkeletonLoader />
              </div>
            )}
          </div>
        );
      }
      
      // Use Next.js Image for S3 URLs without query strings
      return (
        <div className="relative w-full h-full overflow-hidden">
          <Image
            src={normalizedFinalUrl} 
            alt={alt}
            className={`w-full h-full transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'} ${imageClassName}`}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            style={{ ...style, objectFit }}
            onLoad={handleImageLoad}
            onError={handleImageError}
            priority={priority}
            {...(priority ? {} : { loading: 'lazy' })}
          />
          {isLoading && (
            <div className="absolute inset-0 z-20">
              <SkeletonLoader />
            </div>
          )}
        </div>
      );
    }
    
    // For external images (non-S3), check if we should force img tag
    if (forceImgTag || hasQueryString) {
      return (
        <div className="relative w-full h-full overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={normalizedFinalUrl || src}
            alt={alt}
            className={`w-full h-full transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'} ${imageClassName}`}
            style={{ ...style, objectFit }}
            onLoad={handleImageLoad}
            onError={handleImageError}
            loading="lazy"
          />
          {isLoading && !disableSkeleton && (
            <div className="absolute inset-0 z-20">
              <SkeletonLoader />
            </div>
          )}
        </div>
      );
    }
    
    // For external images (non-S3), use Next.js Image component
    return (
      <div className="relative w-full h-full overflow-hidden">
        <Image 
          src={normalizedFinalUrl || src}
          alt={alt}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className={`w-full h-full transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'} ${imageClassName}`}
          style={{ ...style, objectFit }}
          onLoad={handleImageLoad}
          onError={handleImageError}
          priority={priority}
          {...(priority ? {} : { loading: 'lazy' })}
        />
        {isLoading && (
          <div className="absolute inset-0 z-20">
            <SkeletonLoader />
          </div>
        )}
      </div>
    );
  };
  
  const handleContainerClick = (event: React.MouseEvent<HTMLDivElement>) => {
    onClick?.(event);
    if (onClick) {
      return;
    }
    if (!shouldEnablePreviewModal) {
      return;
    }
    setIsPreviewOpen(true);
  };

  const handleClosePreview = () => {
    setIsPreviewOpen(false);
  };

  // Renderizar según el tipo de archivo
  return (
    <>
      <div ref={containerRef} className="relative group" style={style} onClick={handleContainerClick}>
        {isImage && !imageError ? (
        // All images (including SVGs) - render as image
        renderImage()
      ) : isPdf ? (
        // Para PDFs, mostrar un icono de PDF con opción para ver
        <div className={`flex flex-col items-center justify-center ${className}`}>
          <FileTextIcon className="h-12 w-12 text-red-500" />
          <span className="text-xs mt-1 text-center truncate max-w-full">
            {displayFileName}
          </span>
          <a 
            href={normalizedFinalUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-xs text-blue-500 hover:underline mt-1"
            onClick={(e) => e.stopPropagation()}
          >
            Ver PDF
          </a>
        </div>
        ) : isVideo ? (
        // Para videos, usar un tag de video
        <div ref={videoContainerRef} className="relative w-full h-full overflow-hidden">
          {fileNotFound ? (
            <div className="flex items-center justify-center w-full h-full bg-gray-100 border-2 border-dashed border-gray-300 rounded">
              <div className="flex flex-col items-center space-y-2 text-center p-4">
                {renderFileIcon()}
                <span className="text-sm font-medium text-gray-600">File not found</span>
                <span className="text-xs text-gray-500">The requested file does not exist in storage</span>
              </div>
            </div>
          ) : videoError ? (
            <div className="flex items-center justify-center w-full h-full bg-gray-100 text-gray-400 p-4 text-center">
              <div>
                <FileVideoIcon className="h-8 w-8 mx-auto mb-2" />
                <span className="text-xs block mb-1">Error loading video</span>
                <span className="text-xs text-gray-500 block">
                  {normalizedFinalUrl || src}
                </span>
              </div>
            </div>
          ) : (
          <video 
              ref={videoRef}
              src={normalizedFinalUrl || undefined} 
            controls={shouldAutoplay ? false : controls}
            autoPlay={shouldAutoplay}
            loop={loop}
            muted={shouldAutoplay ? true : muted}
            playsInline={shouldAutoplay ? true : playsInline}
            preload={shouldAutoplay ? (preload || 'auto') : (poster ? 'none' : 'metadata')}
            poster={videoPoster || undefined}
            crossOrigin={shouldAutoplay ? 'anonymous' : undefined}
            className={className || "w-full h-full"}
            style={{
              ...style,
              objectFit: style?.objectFit || computedObjectFit
            }}
            onClick={(e) => {
                if (onClick) {
                  e.stopPropagation();
                  onClick(e as unknown as React.MouseEvent<HTMLDivElement, MouseEvent>);
                }
                // Trigger play on click for mobile autoplay
                if (shouldAutoplay && videoRef.current) {
                  videoRef.current.muted = true;
                  videoRef.current.play().catch(() => {
                    // Silently handle errors
                  });
                }
            }}
            onLoadedMetadata={() => {
              setIsLoading(false);
              setVideoError(false);
              
              // Calculate video aspect ratio
              if (videoRef.current && videoRef.current.videoWidth && videoRef.current.videoHeight) {
                const ratio = videoRef.current.videoWidth / videoRef.current.videoHeight;
                setAspectRatio(ratio);
                
                // Determine objectFit based on aspect ratio
                const is9to16 = Math.abs(ratio - 0.5625) < 0.01;
                const is16to9 = Math.abs(ratio - 1.7777777777777777) < 0.01;
                setComputedObjectFit((is9to16 || is16to9) ? 'contain' : 'cover');
              }
              
              // Try to play video if autoplay is enabled (for background videos)
              if (shouldAutoplay && videoRef.current) {
                videoRef.current.muted = true;
                videoRef.current.play().catch((error) => {
                  // Silently handle autoplay errors (browser restrictions)
                  if (process.env.NODE_ENV === 'development') {
                    console.warn('[S3FilePreview] Video autoplay failed:', error);
                  }
                });
              }
            }}
            onLoadedData={() => {
              // Fallback: also set loading to false when data is loaded
              setIsLoading(false);
              setVideoError(false);
              // Try to play video if autoplay is enabled
              if (shouldAutoplay && videoRef.current) {
                videoRef.current.muted = true;
                videoRef.current.play().catch(() => {
                  // Silently handle errors
                });
              }
            }}
            onCanPlay={() => {
              // Fallback: set loading to false when video can play
              setIsLoading(false);
              setVideoError(false);
              // Try to play video if autoplay is enabled (for background videos)
              if (shouldAutoplay && videoRef.current) {
                videoRef.current.muted = true;
                videoRef.current.play().catch((error) => {
                  // Silently handle autoplay errors (browser restrictions)
                  if (process.env.NODE_ENV === 'development') {
                    console.warn('[S3FilePreview] Video autoplay failed:', error);
                  }
                });
              }
            }}
            onTouchStart={() => {
              // Trigger play on touch for mobile autoplay
              if (shouldAutoplay && videoRef.current) {
                videoRef.current.muted = true;
                videoRef.current.play().catch(() => {
                  // Silently handle errors
                });
              }
            }}
            onError={async (e) => {
              setIsLoading(false);
              setVideoError(true);
              
              // Check if it's a 404 error by trying to fetch the URL
              if (normalizedFinalUrl && normalizedFinalUrl.includes('/api/media/download')) {
                try {
                  const response = await fetch(normalizedFinalUrl, { method: 'HEAD' });
                  if (response.status === 404) {
                    setFileNotFound(true);
                  }
                } catch (fetchError) {
                  // If fetch fails, assume it might be a 404
                  if (normalizedFinalUrl.includes('/api/media/download')) {
                    setFileNotFound(true);
                  }
                }
              }
              
              if (onError) {
                onError();
              }
              if (process.env.NODE_ENV === 'development') {
                console.warn('[S3FilePreview] Video load error for:', src);
                console.warn('- Final URL:', normalizedFinalUrl);
                console.warn('- S3 Key:', safeS3Key);
                console.warn('- Video element:', e.currentTarget);
              }
            }}
          >
            Tu navegador no soporta el tag de video.
          </video>
          )}
          {isLoading && !videoError && !disableSkeleton && !videoPoster && (
            <div className="absolute inset-0 z-20">
              <SkeletonLoader />
            </div>
          )}
        </div>
      ) : (
        // Para otros archivos, mostrar un icono basado en el tipo
        <div className={`flex flex-col items-center justify-center ${className}`}>
          {renderFileIcon()}
          <span className="text-xs mt-1 text-center truncate max-w-full">
            {displayFileName}
          </span>
        </div>
        )}
      </div>
      {isPreviewOpen && shouldEnablePreviewModal && (
        <div
          className={`fixed inset-0 z-[1002] flex items-center justify-center bg-black/70 px-4 ${modalClassName ?? ''}`}
          onClick={handleClosePreview}
        >
          <div
            className="relative w-full max-w-5xl max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="absolute top-4 right-4 rounded-full bg-black/60 px-3 py-1 text-sm font-medium text-white transition hover:bg-black/80"
              onClick={handleClosePreview}
            >
              Close
            </button>
            {isImage ? (
              <img
                src={normalizedFinalUrl}
                alt={alt}
                className="w-full max-h-[90vh] object-contain rounded-lg"
              />
            ) : (
              <video
                src={normalizedFinalUrl}
                controls
                autoPlay
                className="w-full max-h-[90vh] rounded-lg bg-black"
              >
                Tu navegador no soporta el tag de video.
              </video>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default S3FilePreview;
