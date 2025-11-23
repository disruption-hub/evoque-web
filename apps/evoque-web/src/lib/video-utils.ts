// Video utility functions for production-ready video loading

export interface VideoLoadOptions {
  maxRetries?: number;
  retryDelay?: number;
  timeoutMs?: number;
  fallbackUrls?: string[];
  // When true, performs a HEAD/ranged GET probe before setting the video src.
  // Default is false to avoid extra network calls. Enable only for diagnostics.
  useConnectivityProbe?: boolean;
}

export class VideoLoader {
  private static async testVideoConnection(url: string): Promise<boolean> {
    try {
      // Prefer HEAD; some CDNs/servers may not support it, so fall back to a tiny ranged GET
      const headResponse = await fetch(url, {
        method: 'HEAD',
        signal: AbortSignal.timeout(5000),
      });
      if (headResponse.ok) return true;
      } catch (error) {
        // Only log in development
        if (process.env.NODE_ENV === 'development') {
          console.warn('[VIDEO LOADER] HEAD test failed, trying ranged GET...', error);
        }
      }

      try {
        const getResponse = await fetch(url, {
          method: 'GET',
          headers: { Range: 'bytes=0-1' },
          signal: AbortSignal.timeout(5000),
        });
        return getResponse.ok && (getResponse.status === 200 || getResponse.status === 206);
      } catch (error) {
        // Only log in development
        if (process.env.NODE_ENV === 'development') {
          console.log('[VIDEO LOADER] Ranged GET test failed:', error);
        }
        return false;
      }
  }

  static async loadVideoWithRetry(
    videoElement: HTMLVideoElement,
    url: string,
    options: VideoLoadOptions = {}
  ): Promise<boolean> {
    const {
      maxRetries = 3,
      retryDelay = 1000,
      timeoutMs = 10000,
      fallbackUrls = [],
      useConnectivityProbe = false,
    } = options;

    // Normalize URLs - convert /api/v1/media/download to /api/media/download
    const normalizeUrl = (urlToNormalize: string): string => {
      if (urlToNormalize.includes('/api/v1/media/download')) {
        return urlToNormalize.replace('/api/v1/media/download', '/api/media/download');
      }
      return urlToNormalize;
    };

    // Normalize all URLs
    const normalizedUrl = normalizeUrl(url);
    const normalizedFallbacks = fallbackUrls.map(normalizeUrl);

    // Try the main URL first
    const urlsToTry = [normalizedUrl, ...normalizedFallbacks];

    for (const currentUrl of urlsToTry) {
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          // Optional connectivity probe (disabled by default to save calls)
          if (useConnectivityProbe) {
            const isConnectable = await this.testVideoConnection(currentUrl);
            if (!isConnectable) {
              console.warn(`[VIDEO LOADER] Connection test failed for ${currentUrl}`);
              if (attempt < maxRetries) {
                await this.delay(retryDelay * attempt);
                continue;
              }
              break; // Try next URL
            }
          }

          // Set the source and try to load
          videoElement.src = currentUrl;

          const success = await this.waitForVideoLoad(videoElement, timeoutMs);
          if (success) {
            // Only log in development
            if (process.env.NODE_ENV === 'development') {
              console.log(`[VIDEO LOADER] Successfully loaded ${currentUrl} on attempt ${attempt}`);
            }
            return true;
          }
        } catch (error) {
          // Only log in development
          if (process.env.NODE_ENV === 'development') {
            console.warn(`[VIDEO LOADER] Attempt ${attempt} failed for ${currentUrl}:`, error);
          }
        }

        if (attempt < maxRetries) {
          await this.delay(retryDelay * attempt);
        }
      }

      // Only log in development
      if (process.env.NODE_ENV === 'development') {
        console.warn(`[VIDEO LOADER] All attempts failed for ${currentUrl}, trying next URL...`);
      }
    }

    // Only log in development - don't spam production console
    if (process.env.NODE_ENV === 'development') {
      console.error(`[VIDEO LOADER] All URLs and attempts failed`);
    }
    return false;
  }

  private static waitForVideoLoad(video: HTMLVideoElement, timeoutMs: number): Promise<boolean> {
    return new Promise((resolve) => {
      let resolved = false;
      const timeout = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          cleanup();
          resolve(false);
        }
      }, timeoutMs);

      const onSuccess = () => {
        if (!resolved) {
          resolved = true;
          cleanup();
          resolve(true);
        }
      };

      const onError = () => {
        if (!resolved) {
          resolved = true;
          cleanup();
          resolve(false);
        }
      };

      const cleanup = () => {
        clearTimeout(timeout);
        video.removeEventListener('canplay', onSuccess);
        video.removeEventListener('loadeddata', onSuccess);
        video.removeEventListener('error', onError);
      };

      video.addEventListener('canplay', onSuccess, { once: true });
      video.addEventListener('loadeddata', onSuccess, { once: true });
      video.addEventListener('error', onError, { once: true });

      video.load();
    });
  }

  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Mobile detection utility
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;
  
  return window.innerWidth <= 768 || 
    /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// Production-specific video configuration
export function getProductionVideoConfig() {
  const isProduction = process.env.NODE_ENV === 'production';
  
  return {
    // More aggressive retry settings for production
    maxRetries: isProduction ? 5 : 3,
    retryDelay: isProduction ? 2000 : 1000,
    timeoutMs: isProduction ? 15000 : 10000,
    
    // Production-optimized video attributes
    videoAttributes: {
      preload: 'auto' as const, // Changed from 'metadata' to 'auto' for faster loading
      playsInline: true,
      muted: true,
      autoPlay: true,
      controls: false,
      'webkit-playsinline': 'true',
      crossOrigin: 'anonymous' as const,
    }
  };
}

