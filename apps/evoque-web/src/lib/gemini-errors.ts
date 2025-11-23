/**
 * Gemini API Error Handler
 * Parses and converts Gemini API errors to user-friendly messages
 */

interface GeminiApiError {
  error?: {
    code?: number;
    message?: string;
    status?: string;
    details?: Array<{
      '@type'?: string;
      retryDelay?: string;
      links?: Array<{
        description?: string;
        url?: string;
      }>;
    }>;
  };
}

interface ParsedError {
  message: string;
  userMessage: string;
  code?: number;
  status?: string;
  retryAfter?: number; // in seconds
  actionable: boolean;
  links?: Array<{ description: string; url: string }>;
}

/**
 * Parse Gemini API error and convert to user-friendly message
 */
export function parseGeminiError(error: unknown): ParsedError {
  let errorMessage = 'An unknown error occurred';
  let errorCode: number | undefined;
  let errorStatus: string | undefined;
  let retryAfter: number | undefined;
  let links: Array<{ description: string; url: string }> | undefined;

  // Try to extract error information
  if (error instanceof Error) {
    errorMessage = error.message;
    const errorObj = error as any;

    // First, check if error object already has parsed error structure (ApiError from SDK)
    if (errorObj.error) {
      try {
        const parsed = typeof errorObj.error === 'string' 
          ? JSON.parse(errorObj.error) 
          : errorObj.error;
        
        if (parsed.error) {
          errorCode = parsed.error.code;
          errorStatus = parsed.error.status;
          errorMessage = parsed.error.message || errorMessage;

          // Extract retry information from details
          if (parsed.error.details && Array.isArray(parsed.error.details)) {
            for (const detail of parsed.error.details) {
              if (detail['@type']?.includes('RetryInfo') && detail.retryDelay) {
                // Parse retry delay (e.g., "33s" -> 33)
                const match = detail.retryDelay.match(/(\d+)/);
                if (match) {
                  retryAfter = parseInt(match[1], 10);
                }
              }
              if (detail.links && Array.isArray(detail.links)) {
                links = detail.links
                  .filter((link: { description?: string; url?: string }): link is { description: string; url: string } => 
                    !!link.description && !!link.url
                  )
                  .map((link: { description: string; url: string }) => ({
                    description: link.description,
                    url: link.url,
                  }));
              }
            }
          }
        }
      } catch {
        // If parsing fails, continue to other methods
      }
    }

    // Try to parse JSON error message (if error is in message string)
    if (!retryAfter) {
      try {
        // Check if message is a JSON string
        if (errorMessage.startsWith('{') || errorMessage.includes('"error"')) {
          const parsed = JSON.parse(errorMessage) as GeminiApiError;
          if (parsed.error) {
            errorCode = parsed.error.code || errorCode;
            errorStatus = parsed.error.status || errorStatus;
            errorMessage = parsed.error.message || errorMessage;

            // Extract retry information
            if (parsed.error.details && Array.isArray(parsed.error.details)) {
              for (const detail of parsed.error.details) {
                if (detail['@type']?.includes('RetryInfo') && detail.retryDelay && !retryAfter) {
                  // Parse retry delay (e.g., "32s" -> 32)
                  const match = detail.retryDelay.match(/(\d+)/);
                  if (match) {
                    retryAfter = parseInt(match[1], 10);
                  }
                }
                if (detail.links && Array.isArray(detail.links) && !links) {
                  links = detail.links
                    .filter((link: { description?: string; url?: string }): link is { description: string; url: string } => 
                      !!link.description && !!link.url
                    )
                    .map((link: { description: string; url: string }) => ({
                      description: link.description,
                      url: link.url,
                    }));
                }
              }
            }
          }
        }
      } catch {
        // If parsing fails, use the error message as-is
      }
    }

    // Extract retry info from message text if not found in structured data
    // Example: "Please retry in 33.505757455s." or "Please retry in 33s"
    if (!retryAfter && errorMessage) {
      const retryMatch = errorMessage.match(/retry in ([\d.]+)s?/i);
      if (retryMatch) {
        retryAfter = Math.ceil(parseFloat(retryMatch[1]));
      }
    }

    // Check for status code on error object
    if (errorObj.status !== undefined) {
      errorCode = errorObj.status;
    }
    
    // Check for code on error object
    if (errorObj.code !== undefined && !errorCode) {
      errorCode = errorObj.code;
    }
  }

  // Convert to user-friendly message
  const userMessage = convertToUserMessage(errorCode, errorStatus, errorMessage);
  const actionable = errorCode === 429 || errorCode === 503 || errorCode === 502;

  return {
    message: errorMessage,
    userMessage,
    code: errorCode,
    status: errorStatus,
    retryAfter,
    actionable,
    links,
  };
}

/**
 * Convert technical error to user-friendly message
 */
function convertToUserMessage(
  code?: number,
  status?: string,
  originalMessage?: string
): string {
  // Rate limiting (429)
  if (code === 429 || status === 'RESOURCE_EXHAUSTED') {
    return 'You have exceeded your API quota. Please check your plan and billing details, or wait a few minutes and try again.';
  }

  // Service unavailable (503)
  if (code === 503 || status === 'UNAVAILABLE') {
    return 'The service is temporarily unavailable. Please try again in a few moments.';
  }

  // Bad gateway (502)
  if (code === 502) {
    return 'The service encountered a temporary issue. Please try again shortly.';
  }

  // Invalid argument (400)
  if (code === 400 || status === 'INVALID_ARGUMENT') {
    if (originalMessage?.includes('contents is not specified')) {
      return 'The request is missing required content. Please try again with a valid prompt.';
    }
    if (originalMessage?.includes('prompt')) {
      return 'The prompt you provided is invalid. Please check your input and try again.';
    }
    return 'Invalid request. Please check your input and try again.';
  }

  // Permission denied (403)
  if (code === 403 || status === 'PERMISSION_DENIED') {
    return 'You do not have permission to perform this action. Please check your API key and permissions.';
  }

  // Not found (404)
  if (code === 404 || status === 'NOT_FOUND') {
    return 'The requested resource was not found.';
  }

  // Internal server error (500)
  if (code === 500 || status === 'INTERNAL') {
    return 'An internal server error occurred. Please try again later.';
  }

  // Authentication errors (401)
  if (code === 401 || status === 'UNAUTHENTICATED') {
    return 'Authentication failed. Please check your API key.';
  }

  // Timeout
  if (originalMessage?.toLowerCase().includes('timeout')) {
    return 'The request timed out. Please try again with a simpler prompt or check your connection.';
  }

  // Network errors
  if (originalMessage?.toLowerCase().includes('network') || 
      originalMessage?.toLowerCase().includes('fetch')) {
    return 'Network error. Please check your internet connection and try again.';
  }

  // Fallback: return original message if it's relatively clean
  if (originalMessage && !originalMessage.includes('GenerateContentRequest') && 
      !originalMessage.includes('@type')) {
    return originalMessage;
  }

  // Default fallback
  return 'An error occurred while processing your request. Please try again.';
}

/**
 * Get retry delay message for user
 */
export function getRetryMessage(retryAfter?: number): string | null {
  if (!retryAfter) return null;
  
  if (retryAfter < 60) {
    return `Please wait ${retryAfter} seconds before trying again.`;
  }
  
  const minutes = Math.ceil(retryAfter / 60);
  return `Please wait ${minutes} ${minutes === 1 ? 'minute' : 'minutes'} before trying again.`;
}

/**
 * Check if an error is retryable
 * @param error Error object (can be Error instance or parsed error)
 * @returns true if error is retryable (429, 503, 502), false otherwise
 */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof Error) {
    const errorObj = error as any;
    const code = errorObj.code || errorObj.status;
    const status = errorObj.status;
    
    // Retry on rate limits (429), service unavailable (503), bad gateway (502)
    if (code === 429 || status === 'RESOURCE_EXHAUSTED') return true;
    if (code === 503 || status === 'UNAVAILABLE') return true;
    if (code === 502) return true;
    
    // Don't retry on client errors (400, 401, 403, 404) or server errors (500)
    if (code === 400 || code === 401 || code === 403 || code === 404) return false;
    if (code === 500 || status === 'INTERNAL') return false;
  }
  
  // If error is already parsed, check the parsed error
  const parsedError = parseGeminiError(error);
  const code = parsedError.code;
  const status = parsedError.status;
  
  if (code === 429 || status === 'RESOURCE_EXHAUSTED') return true;
  if (code === 503 || status === 'UNAVAILABLE') return true;
  if (code === 502) return true;
  
  return false;
}

