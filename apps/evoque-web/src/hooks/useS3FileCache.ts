'use client';

import { useMemo, useCallback } from 'react';

// Global cache for S3 URLs to avoid multiple API calls
class S3FileCache {
  private cache = new Map<string, string>();
  private readonly CACHE_DURATION = 10 * 60 * 1000; // 10 minutos
  private timestamps = new Map<string, number>();
  private pendingRequests = new Map<string, Promise<string>>();

  get(s3Key: string): string | null {
    const cached = this.cache.get(s3Key);
    const timestamp = this.timestamps.get(s3Key);
    
    if (cached && timestamp && (Date.now() - timestamp) < this.CACHE_DURATION) {
      return cached;
    }
    
    // Clean expired entry
    if (cached) {
      this.cache.delete(s3Key);
      this.timestamps.delete(s3Key);
    }
    
    return null;
  }

  set(s3Key: string, url: string): void {
    this.cache.set(s3Key, url);
    this.timestamps.set(s3Key, Date.now());
    
    // Limit cache size
    if (this.cache.size > 200) {
      const oldestKey = Array.from(this.timestamps.entries())
        .sort(([, a], [, b]) => a - b)[0][0];
      this.cache.delete(oldestKey);
      this.timestamps.delete(oldestKey);
    }
  }

  // Prevent duplicate requests for the same S3 key
  async getOrFetch(s3Key: string): Promise<string> {
    // Check cache first
    const cached = this.get(s3Key);
    if (cached) {
      return cached;
    }

    // Check if there's already a pending request for this key
    const pending = this.pendingRequests.get(s3Key);
    if (pending) {
      return pending;
    }

    // Create new request - use /api/media/download for new-web app
    const apiUrl = `/api/media/download?key=${encodeURIComponent(s3Key)}&view=true`;
    const promise = Promise.resolve(apiUrl);
    
    this.pendingRequests.set(s3Key, promise);
    
    try {
      const url = await promise;
      this.set(s3Key, url);
      return url;
    } finally {
      this.pendingRequests.delete(s3Key);
    }
  }

  clear(): void {
    this.cache.clear();
    this.timestamps.clear();
    this.pendingRequests.clear();
  }

  getStats(): {
    cacheSize: number;
    pendingRequests: number;
    oldestEntry: number | null;
    newestEntry: number | null;
  } {
    const timestamps = Array.from(this.timestamps.values());
    
    return {
      cacheSize: this.cache.size,
      pendingRequests: this.pendingRequests.size,
      oldestEntry: timestamps.length > 0 ? Math.min(...timestamps) : null,
      newestEntry: timestamps.length > 0 ? Math.max(...timestamps) : null
    };
  }
}

// Global instance
const s3FileCache = new S3FileCache();

interface UseS3FileCacheOptions {
  enableCache?: boolean;
  cacheKey?: string;
}

export function useS3FileCache(src: string, options: UseS3FileCacheOptions = {}) {
  const { enableCache = true, cacheKey } = options;

  // Analyze the source URL
  const fileAnalysis = useMemo(() => {
    if (!src) return null;

    // Check if it's already an API URL with key parameter
    const isApiUrl = src.includes('/api/media/download') || src.includes('/api/v1/media/download');
    if (isApiUrl) {
      try {
        // Handle both absolute and relative URLs
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost';
        const url = new URL(src, baseUrl);
        const keyParam = url.searchParams.get('key');
        const viewParam = url.searchParams.get('view');
        if (keyParam) {
          // Normalize /api/v1/media/download to /api/media/download
          const normalizedUrl = src.includes('/api/v1/media/download')
            ? `/api/media/download?key=${encodeURIComponent(keyParam)}${viewParam ? `&view=${viewParam}` : '&view=true'}`
            : src;
          
          return {
            isS3Url: true,
            s3Key: keyParam,
            originalSrc: normalizedUrl, // Return normalized URL
            isAlreadyApiUrl: true
          };
        }
      } catch (_error) {
        // If URL parsing fails, continue with normal detection
      }
    }

    // Check if it's a direct S3 key (not a URL, just a filename/key)
    // This handles cases where the database stores just the S3 key
    if (!src.includes('://') && !src.startsWith('/') && !src.startsWith('http')) {
      // Likely a direct S3 key
      return {
        isS3Url: true,
        s3Key: src,
        originalSrc: src,
        isDirectKey: true
      };
    }

    // Detectar si es una URL de S3
    const isS3Url = src.includes('s3.amazonaws.com') || 
                    src.includes('vercelvendure') ||
                    (process.env.NEXT_PUBLIC_S3_URL_PREFIX && src.startsWith(process.env.NEXT_PUBLIC_S3_URL_PREFIX));
    
    let s3Key: string | null = null;
    
    
    if (isS3Url) {
      try {
        // Intentar extraer la clave de S3 de la URL
        const url = new URL(src);
        const pathParts = url.pathname.split('/');
        
        // Eliminar la primera parte vacía del pathname que comienza con /
        pathParts.shift();
        
        // La clave es el resto del path
        s3Key = pathParts.join('/');
      } catch (_error) {
        s3Key = null;
      }
    }

    const result = {
      isS3Url,
      s3Key,
      originalSrc: src,
      isAlreadyApiUrl: false,
      isDirectKey: false
    };
    
    return result;
  }, [src]);

  // Get the optimized URL
  const getOptimizedUrl = useCallback(async (): Promise<string> => {
    if (!fileAnalysis) return src;

    const { isS3Url, s3Key, isAlreadyApiUrl } = fileAnalysis as any;

    // If it's already an API URL, return as-is
    if (isAlreadyApiUrl) {
      return src;
    }

    // ALWAYS redirect S3 URLs through our API
    if (isS3Url && s3Key) {
      // Use cache key if provided, otherwise use s3Key
      const key = cacheKey || s3Key;
      return await s3FileCache.getOrFetch(key);
    }

    // For non-S3 URLs, return as-is
    return src;
  }, [fileAnalysis, src, cacheKey]);

  // Get cached URL synchronously (for immediate use)
  const getCachedUrl = useCallback((): string | null => {
    if (!fileAnalysis || !enableCache) return null;

    const { isS3Url, s3Key } = fileAnalysis;

    if (isS3Url && s3Key) {
      const key = cacheKey || s3Key;
      return s3FileCache.get(key);
    }

    return null;
  }, [fileAnalysis, enableCache, cacheKey]);

  // Get the final URL (cached or generate API URL)
  const finalUrl = useMemo(() => {
    if (!fileAnalysis) return src;

    const { isS3Url, s3Key, isAlreadyApiUrl } = fileAnalysis as any;

    // If it's already an API URL, return as-is
    if (isAlreadyApiUrl) {
      return src;
    }

    // ALWAYS redirect S3 URLs through our API, never load directly from S3
    if (isS3Url && s3Key) {
      const key = cacheKey || s3Key;
      const cached = s3FileCache.get(key);
      
      if (cached) {
        return cached;
      }
      
      // ALWAYS generate API URL for S3 files, never use direct S3 URLs
      // Use /api/media/download for new-web app
      const apiUrl = `/api/media/download?key=${encodeURIComponent(s3Key)}&view=true`;
      s3FileCache.set(key, apiUrl);
      return apiUrl;
    }

    // For non-S3 URLs, use as-is
    return src;
  }, [fileAnalysis, src, cacheKey]);

  // Clear cache function
  const clearCache = useCallback(() => {
    s3FileCache.clear();
  }, []);

  // Get cache stats
  const getCacheStats = useCallback(() => {
    return s3FileCache.getStats();
  }, []);

  return {
    finalUrl,
    isS3Url: fileAnalysis?.isS3Url || false,
    s3Key: fileAnalysis?.s3Key || null,
    getOptimizedUrl,
    getCachedUrl,
    clearCache,
    getCacheStats
  };
}

// Export the cache instance for direct access if needed
export { s3FileCache }; 