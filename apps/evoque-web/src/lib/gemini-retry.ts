/**
 * Retry utility with exponential backoff for Gemini API calls
 */

export interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number; // in milliseconds
  maxDelay?: number; // in milliseconds
  backoffMultiplier?: number;
  retryAfter?: number; // Use API-provided retry delay if available (in seconds)
}

export interface RetryResult<T> {
  result: T;
  attempts: number;
}

/**
 * Check if an error is retryable based on status code
 */
export function isRetryableStatusCode(code?: number, status?: string): boolean {
  // Retry on rate limits (429), service unavailable (503), bad gateway (502)
  if (code === 429 || status === 'RESOURCE_EXHAUSTED') return true;
  if (code === 503 || status === 'UNAVAILABLE') return true;
  if (code === 502) return true;
  
  // Don't retry on client errors (400, 401, 403, 404) or server errors (500)
  if (code === 400 || code === 401 || code === 403 || code === 404) return false;
  if (code === 500 || status === 'INTERNAL') return false;
  
  return false;
}

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Calculate delay for exponential backoff
 */
function calculateDelay(
  attempt: number,
  initialDelay: number,
  maxDelay: number,
  backoffMultiplier: number,
  retryAfter?: number
): number {
  // If API provided retry delay, use it (converted to milliseconds)
  if (retryAfter !== undefined && attempt === 1) {
    return Math.min(retryAfter * 1000, maxDelay);
  }
  
  // Exponential backoff: initialDelay * (backoffMultiplier ^ (attempt - 1))
  const delay = initialDelay * Math.pow(backoffMultiplier, attempt - 1);
  
  // Cap at maxDelay
  return Math.min(delay, maxDelay);
}

/**
 * Retry a function with exponential backoff
 * 
 * @param fn Function to retry
 * @param options Retry configuration options
 * @returns Promise that resolves with the result or rejects after max retries
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<RetryResult<T>> {
  const {
    maxRetries = parseInt(process.env.GEMINI_MAX_RETRIES || '3', 10),
    initialDelay = parseInt(process.env.GEMINI_RETRY_INITIAL_DELAY_MS || '1000', 10),
    maxDelay = parseInt(process.env.GEMINI_RETRY_MAX_DELAY_MS || '60000', 10),
    backoffMultiplier = 2,
    retryAfter,
  } = options;

  let lastError: Error | unknown;
  let lastRetryAfter: number | undefined = retryAfter;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await fn();
      return {
        result,
        attempts: attempt,
      };
    } catch (error) {
      lastError = error;
      
      // Extract error information
      const errorObj = error as any;
      const errorCode = errorObj.code || errorObj.status;
      const errorStatus = errorObj.status;
      
      // Check if error is retryable
      if (!isRetryableStatusCode(errorCode, errorStatus)) {
        // Not retryable, throw immediately
        throw error;
      }
      
      // Extract retryAfter from error if available
      if (errorObj.retryAfter !== undefined) {
        lastRetryAfter = errorObj.retryAfter;
      }
      
      // If this was the last attempt, throw the error
      if (attempt >= maxRetries) {
        throw error;
      }
      
      // Calculate delay for next retry
      const delay = calculateDelay(
        attempt,
        initialDelay,
        maxDelay,
        backoffMultiplier,
        lastRetryAfter
      );
      
      // Log retry attempt in development
      if (process.env.NODE_ENV === 'development') {
        console.log(
          `[Gemini Retry] Attempt ${attempt}/${maxRetries} failed. ` +
          `Retrying in ${Math.round(delay / 1000)}s... ` +
          `(Error: ${errorCode || 'unknown'})`
        );
      }
      
      // Wait before retrying
      await sleep(delay);
      
      // Clear retryAfter after first use
      lastRetryAfter = undefined;
    }
  }
  
  // Should never reach here, but TypeScript needs this
  throw lastError;
}

