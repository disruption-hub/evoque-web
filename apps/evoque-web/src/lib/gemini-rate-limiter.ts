/**
 * Rate limiter/throttler for Gemini API requests
 * Prevents exceeding API quota by controlling request frequency
 */

interface RequestRecord {
  timestamp: number;
  model?: string;
}

export interface RateLimiterOptions {
  requestsPerMinute?: number;
  requestsPerSecond?: number;
}

/**
 * Rate limiter using sliding window algorithm
 */
export class GeminiRateLimiter {
  private requestHistory: RequestRecord[] = [];
  private requestsPerMinute: number;
  private requestsPerSecond?: number;
  private readonly windowMs = 60 * 1000; // 1 minute window
  private readonly secondWindowMs = 1000; // 1 second window

  constructor(options: RateLimiterOptions = {}) {
    // Default limits based on environment or model
    // Free tier typically: 15 requests per minute
    // Paid tier can be higher
    this.requestsPerMinute = options.requestsPerMinute || 
      parseInt(process.env.GEMINI_RATE_LIMIT_RPM || '15', 10);
    this.requestsPerSecond = options.requestsPerSecond;
  }

  /**
   * Clean up old requests outside the time window
   */
  private cleanup(oldestAllowed: number): void {
    this.requestHistory = this.requestHistory.filter(
      record => record.timestamp >= oldestAllowed
    );
  }

  /**
   * Check if we can make a request now
   */
  canMakeRequest(model?: string): boolean {
    const now = Date.now();
    const minuteAgo = now - this.windowMs;
    
    // Clean up old requests
    this.cleanup(minuteAgo);
    
    // Count requests in the last minute
    const recentRequests = this.requestHistory.filter(
      record => record.timestamp >= minuteAgo
    );
    
    // Check per-minute limit
    if (recentRequests.length >= this.requestsPerMinute) {
      return false;
    }
    
    // Check per-second limit if configured
    if (this.requestsPerSecond) {
      const secondAgo = now - this.secondWindowMs;
      const requestsLastSecond = recentRequests.filter(
        record => record.timestamp >= secondAgo
      );
      
      if (requestsLastSecond.length >= this.requestsPerSecond) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Calculate how long to wait before next request is allowed
   */
  getWaitTime(model?: string): number {
    const now = Date.now();
    const minuteAgo = now - this.windowMs;
    
    // Clean up old requests
    this.cleanup(minuteAgo);
    
    // Count requests in the last minute
    const recentRequests = this.requestHistory.filter(
      record => record.timestamp >= minuteAgo
    );
    
    if (recentRequests.length < this.requestsPerMinute) {
      // Check per-second limit if configured
      if (this.requestsPerSecond) {
        const secondAgo = now - this.secondWindowMs;
        const requestsLastSecond = recentRequests.filter(
          record => record.timestamp >= secondAgo
        );
        
        if (requestsLastSecond.length >= this.requestsPerSecond) {
          // Wait until oldest request in last second is > 1 second old
          const oldestInSecond = Math.min(
            ...requestsLastSecond.map(r => r.timestamp)
          );
          return Math.max(0, oldestInSecond + this.secondWindowMs - now);
        }
      }
      
      return 0; // Can make request now
    }
    
    // Wait until oldest request is > 1 minute old
    const oldestRequest = Math.min(...recentRequests.map(r => r.timestamp));
    return Math.max(0, oldestRequest + this.windowMs - now);
  }

  /**
   * Record a request was made
   */
  recordRequest(model?: string): void {
    this.requestHistory.push({
      timestamp: Date.now(),
      model,
    });
    
    // Clean up old requests periodically
    const now = Date.now();
    const minuteAgo = now - this.windowMs;
    this.cleanup(minuteAgo);
  }

  /**
   * Wait until a request can be made, then record it
   */
  async waitAndRecord(model?: string): Promise<void> {
    const waitTime = this.getWaitTime(model);
    
    if (waitTime > 0) {
      if (process.env.NODE_ENV === 'development') {
        console.log(
          `[Gemini Rate Limiter] Rate limit reached. ` +
          `Waiting ${Math.round(waitTime / 1000)}s before next request...`
        );
      }
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.recordRequest(model);
  }

  /**
   * Reset the rate limiter (useful for testing)
   */
  reset(): void {
    this.requestHistory = [];
  }
}

// Singleton instance for application-wide rate limiting
let rateLimiterInstance: GeminiRateLimiter | null = null;

/**
 * Get or create the global rate limiter instance
 */
export function getRateLimiter(options?: RateLimiterOptions): GeminiRateLimiter {
  if (!rateLimiterInstance) {
    rateLimiterInstance = new GeminiRateLimiter(options);
  }
  return rateLimiterInstance;
}

/**
 * Reset the global rate limiter (useful for testing)
 */
export function resetRateLimiter(): void {
  rateLimiterInstance = null;
}

