import { NextRequest, NextResponse } from 'next/server';
import { 
  S3Client, 
  GetObjectCommand,
  HeadObjectCommand
} from '@aws-sdk/client-s3';
import { Readable } from 'stream';
import { getAwsConfiguration } from '@/lib/s3/databaseConfig';
import { AwsConfiguration } from '@evoque/prisma';

// Route segment config for Vercel - increase timeout for large file streaming
export const maxDuration = 60; // 60 seconds (max for Pro plan, 10s for Hobby)
export const runtime = 'nodejs'; // Use Node.js runtime for streaming

// Global S3 client and config (will be initialized when needed)
let s3Client: S3Client | null = null;
let s3Config: AwsConfiguration | null = null;
let bucketName = '';

// Initialize S3 client and config from database
async function initializeS3() {
  if (!s3Client || !s3Config) {
    console.log('[S3 Init] Initializing S3 client...');
    try {
      const config = await getAwsConfiguration();
      
      if (!config) {
        console.error('[S3 Init] No configuration returned from getAwsConfiguration()');
        throw new Error('S3 not configured - please configure S3 settings in the admin panel');
      }
      
      console.log('[S3 Init] Creating S3Client with config:', {
        region: config.region,
        bucketName: config.bucketName,
        hasAccessKeyId: !!config.accessKeyId,
        hasSecretAccessKey: !!config.secretAccessKey,
        accessKeyIdPrefix: config.accessKeyId ? `${config.accessKeyId.substring(0, 4)}...` : 'missing',
      });
      
      s3Client = new S3Client({
        region: config.region,
        credentials: {
          accessKeyId: config.accessKeyId,
          secretAccessKey: config.secretAccessKey,
        }
      });
      s3Config = config;
      bucketName = config.bucketName;
      
      console.log('[S3 Init] S3Client created successfully:', {
        region: config.region,
        bucketName,
        hasClient: !!s3Client,
      });
      
    } catch (error) {
      console.error('[S3 Init] Error during initialization:', {
        error: error instanceof Error ? error.message : String(error),
        errorName: error instanceof Error ? error.name : undefined,
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw new Error('S3 not configured - please configure S3 settings in the admin panel: ' + error);
    }
  } else {
    console.log('[S3 Init] Using existing S3 client (already initialized)');
  }
}

// Enhanced content type detection
function getContentTypeFromFilename(filename: string): string {
  const extension = filename.toLowerCase().split('.').pop();
  
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
    case 'txt':
      return 'text/plain';
    case 'json':
      return 'application/json';
    case 'html':
      return 'text/html';
    case 'css':
      return 'text/css';
    case 'js':
      return 'application/javascript';
    case 'zip':
      return 'application/zip';
    case 'mp3':
      return 'audio/mpeg';
    case 'wav':
      return 'audio/wav';
    default:
      return 'application/octet-stream';
  }
}

// Basic SVG sanitization function
function sanitizeSVG(svgContent: string): string {
  // Remove script tags and event handlers
  return svgContent
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/data:text\/html/gi, 'data:text/plain')
    .replace(/xlink:href\s*=\s*["']javascript:[^"']*["']/gi, '');
}

// Parse Range header (e.g., "bytes=0-1023")
function parseRange(rangeHeader: string, fileSize: number): { start: number; end: number } | null {
  const match = rangeHeader.match(/bytes=(\d+)-(\d*)/);
  if (!match) return null;
  
  const start = parseInt(match[1], 10);
  const end = match[2] ? parseInt(match[2], 10) : fileSize - 1;
  
  if (start >= fileSize || end >= fileSize || start > end) {
    return null;
  }
  
  return { start, end };
}

export async function GET(request: NextRequest) {
  const requestId = Math.random().toString(36).substring(7);
  console.log(`[Media Download ${requestId}] Starting request`);
  
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');
    const viewMode = searchParams.get('view') === 'true';
    
    console.log(`[Media Download ${requestId}] Request params:`, {
      key,
      viewMode,
      url: request.url,
      userAgent: request.headers.get('user-agent'),
    });
    
    if (!key) {
      console.error(`[Media Download ${requestId}] No key provided`);
      return NextResponse.json(
        { error: 'No key provided' }, 
        { status: 400 }
      );
    }
    
    // Initialize S3 client
    console.log(`[Media Download ${requestId}] Initializing S3 client...`);
    try {
      await initializeS3();
      console.log(`[Media Download ${requestId}] S3 client initialized successfully`, {
        hasClient: !!s3Client,
        bucketName,
        region: s3Config?.region,
        configSource: s3Config?.id === 'env-config' ? 'environment-variables' : 'database',
      });
    } catch (initError) {
      console.error(`[Media Download ${requestId}] Failed to initialize S3:`, {
        error: initError instanceof Error ? initError.message : String(initError),
        stack: initError instanceof Error ? initError.stack : undefined,
        errorType: initError?.constructor?.name,
      });
      return NextResponse.json(
        { 
          error: 'S3 not configured', 
          details: initError instanceof Error ? initError.message : String(initError)
        },
        { status: 500 }
      );
    }
    
    if (!s3Client || !bucketName) {
      console.error(`[Media Download ${requestId}] S3 client or bucket name not set after initialization`, {
        hasClient: !!s3Client,
        bucketName,
        hasConfig: !!s3Config,
      });
      return NextResponse.json(
        { error: 'S3 not configured', details: 'S3 client initialization completed but client or bucket name is missing' },
        { status: 500 }
      );
    }
    
    try {
      // Extract filename from key
      const filename = key.split('/').pop() || 'download';
      
      // Determine content type
      const contentType = getContentTypeFromFilename(filename);
      const isVideo = contentType.startsWith('video/');
      const isAudio = contentType.startsWith('audio/');
      
      console.log(`[Media Download ${requestId}] File info:`, {
        filename,
        contentType,
        isVideo,
        isAudio,
        key,
        bucketName,
      });
      
      // For videos and audio, get file size first for range request support
      let fileSize: number | undefined;
      if (isVideo || isAudio) {
        console.log(`[Media Download ${requestId}] Getting file size for ${isVideo ? 'video' : 'audio'}...`);
        try {
          const headCommand = new HeadObjectCommand({
            Bucket: bucketName,
            Key: key,
          });
          console.log(`[Media Download ${requestId}] Sending HeadObjectCommand:`, {
            bucket: bucketName,
            key,
          });
          const headResponse = await s3Client.send(headCommand);
          fileSize = headResponse.ContentLength;
          console.log(`[Media Download ${requestId}] File size retrieved:`, {
            fileSize,
            contentType: headResponse.ContentType,
            lastModified: headResponse.LastModified,
            etag: headResponse.ETag,
          });
        } catch (error: any) {
          // Check if file doesn't exist
          const errorName = error?.name || error?.errorName || (error instanceof Error ? error.name : undefined);
          const errorCode = error?.Code || error?.code;
          
          if (errorName === 'NoSuchKey' || errorCode === 'NoSuchKey' || 
              (error instanceof Error && error.message?.includes('NoSuchKey'))) {
            console.error(`[Media Download ${requestId}] File not found in S3 (from HEAD request):`, {
              key,
              bucket: bucketName,
            });
            return NextResponse.json(
              { error: 'File not found in storage', details: 'The requested file does not exist in S3' },
              { status: 404 }
            );
          }
          
          // If HEAD fails for other reasons, continue without range support
          console.warn(`[Media Download ${requestId}] Could not get file size for range support:`, {
            error: error instanceof Error ? error.message : String(error),
            errorName,
            stack: error instanceof Error ? error.stack : undefined,
          });
        }
      }
      
      // Check for Range header (for video/audio streaming)
      const rangeHeader = request.headers.get('range');
      let range: { start: number; end: number } | null = null;
      
      if (rangeHeader && fileSize && (isVideo || isAudio)) {
        range = parseRange(rangeHeader, fileSize);
        console.log(`[Media Download ${requestId}] Range request:`, {
          rangeHeader,
          parsedRange: range,
          fileSize,
        });
      }
      
      // Create get object command with range if specified
      const command = new GetObjectCommand({
        Bucket: bucketName,
        Key: key,
        ...(range && { Range: `bytes=${range.start}-${range.end}` }),
      });
      
      console.log(`[Media Download ${requestId}] Sending GetObjectCommand:`, {
        bucket: bucketName,
        key,
        hasRange: !!range,
        range: range ? `bytes=${range.start}-${range.end}` : undefined,
      });
      
      // Get file from S3
      const response = await s3Client.send(command);
      
      console.log(`[Media Download ${requestId}] S3 response received:`, {
        hasBody: !!response.Body,
        contentType: response.ContentType,
        contentLength: response.ContentLength,
        etag: response.ETag,
        lastModified: response.LastModified,
        metadata: response.Metadata,
      });
      
      if (!response.Body) {
        console.error(`[Media Download ${requestId}] S3 response has no body`);
        return NextResponse.json(
          { error: 'File not found' },
          { status: 404 }
        );
      }
      
      // Determine content type with enhanced detection
      let finalContentType = response.ContentType || contentType;
      
      // Override S3 content type if it's generic
      if (finalContentType === 'application/octet-stream' || finalContentType === 'binary/octet-stream') {
        finalContentType = contentType;
      }
      
      // For videos and audio, stream directly without buffering to avoid memory/timeout issues
      // For other files (images, SVGs), we may need to buffer for processing
      const shouldStream = isVideo || isAudio || (response.ContentLength && response.ContentLength > 10 * 1024 * 1024); // Stream if > 10MB
      
      console.log(`[Media Download ${requestId}] Processing decision:`, {
        shouldStream,
        isVideo,
        isAudio,
        contentLength: response.ContentLength,
        isLargeFile: response.ContentLength && response.ContentLength > 10 * 1024 * 1024,
      });
      
      if (shouldStream) {
        console.log(`[Media Download ${requestId}] Using streaming mode`);
        // Stream directly from S3 to client - this is essential for large files on Vercel
        const nodeStream = response.Body as Readable;
        
        // Convert Node.js Readable stream to Web ReadableStream for Next.js
        const webStream = new ReadableStream({
          async start(controller) {
            try {
              for await (const chunk of nodeStream) {
                // Handle both Buffer and Uint8Array chunks
                const uint8Chunk = chunk instanceof Uint8Array 
                  ? chunk 
                  : new Uint8Array(Buffer.from(chunk));
                controller.enqueue(uint8Chunk);
              }
              controller.close();
            } catch (error) {
              controller.error(error);
            }
          },
          cancel() {
            // Clean up the Node.js stream if the client cancels
            if (nodeStream.destroy) {
              nodeStream.destroy();
            }
          }
        });
        
        // Create appropriate headers for streaming
        const headers: HeadersInit = {
          'Content-Type': finalContentType,
          // Add CORS headers to allow loading from any origin
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, Range',
          'Access-Control-Expose-Headers': 'Content-Length, Content-Type, Content-Range, Accept-Ranges',
        };
        
        // Add range support headers for videos and audio
        if (isVideo || isAudio) {
          headers['Accept-Ranges'] = 'bytes';
          if (fileSize) {
            headers['Content-Length'] = range 
              ? (range.end - range.start + 1).toString()
              : fileSize.toString();
          }
        } else if (response.ContentLength) {
          headers['Content-Length'] = response.ContentLength.toString();
        }
        
        // Set cache control
        if (viewMode && (finalContentType.startsWith('image/') || finalContentType.startsWith('video/') || finalContentType.startsWith('audio/'))) {
          headers['Cache-Control'] = 'public, max-age=86400, s-maxage=86400'; // 24 hours
        } else {
          headers['Cache-Control'] = 'public, max-age=3600, s-maxage=3600'; // 1 hour
        }
        
        // Set Content-Disposition based on view mode
        if (!viewMode) {
          headers['Content-Disposition'] = `attachment; filename="${filename}"`;
        } else {
          headers['Content-Disposition'] = `inline; filename="${filename}"`;
        }
        
        // Handle range requests (206 Partial Content)
        if (range && fileSize) {
          headers['Content-Range'] = `bytes ${range.start}-${range.end}/${fileSize}`;
          console.log(`[Media Download ${requestId}] Returning 206 Partial Content response`, {
            contentRange: headers['Content-Range'],
            contentLength: headers['Content-Length'],
            contentType: headers['Content-Type'],
          });
          return new NextResponse(webStream, {
            status: 206,
            headers
          });
        }
        
        // Stream the full file
        console.log(`[Media Download ${requestId}] Returning 200 OK streaming response`, {
          contentLength: headers['Content-Length'],
          contentType: headers['Content-Type'],
          acceptRanges: headers['Accept-Ranges'],
        });
        return new NextResponse(webStream, {
          status: 200,
          headers
        });
      }
      
      // For smaller files (images, SVGs, etc.), buffer for processing
      console.log(`[Media Download ${requestId}] Using buffering mode for smaller file`);
      const stream = response.Body as Readable;
      const chunks: Uint8Array[] = [];
      
      for await (const chunk of stream) {
        chunks.push(chunk);
      }
      
      const buffer = Buffer.concat(chunks);
      
      // Special handling for different file types
      let finalBuffer = buffer;
      
      // Sanitize SVG content for security (only if not a range request)
      if (finalContentType === 'image/svg+xml' && !range) {
        try {
          const svgContent = buffer.toString('utf-8');
          const sanitizedContent = sanitizeSVG(svgContent);
          finalBuffer = Buffer.from(sanitizedContent, 'utf-8');
        } catch (error) {
          console.error('Error sanitizing SVG: ' + error);
          // If sanitization fails, serve original but with strict CSP
          finalBuffer = buffer;
        }
      }
      
      // Create appropriate headers based on view mode and file type
      const headers: HeadersInit = {
        'Content-Type': finalContentType,
        'Content-Length': finalBuffer.length.toString(),
        // Add CORS headers to allow loading from any origin
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, Range',
        'Access-Control-Expose-Headers': 'Content-Length, Content-Type, Content-Range, Accept-Ranges',
      };
      
      // Set cache control based on file type and view mode
      if (viewMode && (finalContentType.startsWith('image/') || finalContentType.startsWith('video/') || finalContentType.startsWith('audio/'))) {
        // Cache images, videos, and audio for longer when viewing
        headers['Cache-Control'] = 'public, max-age=86400, s-maxage=86400'; // 24 hours
      } else {
        // Shorter cache for downloads or other files
        headers['Cache-Control'] = 'public, max-age=3600, s-maxage=3600'; // 1 hour
      }
      
      // Add security headers for SVG files
      if (finalContentType === 'image/svg+xml') {
        headers['X-Content-Type-Options'] = 'nosniff';
        headers['Content-Security-Policy'] = "default-src 'none'; style-src 'unsafe-inline'; img-src data:; script-src 'none';";
        headers['X-Frame-Options'] = 'DENY';
        headers['Referrer-Policy'] = 'no-referrer';
      }
      
      // Set Content-Disposition based on view mode
      if (!viewMode) {
        // Force download
        headers['Content-Disposition'] = `attachment; filename="${filename}"`;
      } else {
        // Allow inline viewing
        headers['Content-Disposition'] = `inline; filename="${filename}"`;
      }
      
      // Create response with file data (full file)
      console.log(`[Media Download ${requestId}] Returning 200 OK buffered response`, {
        bufferSize: finalBuffer.length,
        contentType: headers['Content-Type'],
        contentLength: headers['Content-Length'],
      });
      const res = new NextResponse(finalBuffer, {
        status: 200,
        headers
      });
      
      return res;
      
    } catch (s3Error: any) {
      const errorName = s3Error?.name || s3Error?.errorName || (s3Error instanceof Error ? s3Error.name : undefined);
      const errorCode = s3Error?.Code || s3Error?.code;
      const errorMessage = s3Error instanceof Error ? s3Error.message : String(s3Error);
      
      console.error(`[Media Download ${requestId}] S3 error:`, {
        error: errorMessage,
        errorName,
        errorCode,
        errorType: s3Error?.constructor?.name,
        bucket: bucketName,
        key,
      });
      
      // Check if it's a NoSuchKey error (file doesn't exist)
      if (errorName === 'NoSuchKey' || errorCode === 'NoSuchKey' || 
          errorMessage.includes('NoSuchKey') || 
          errorMessage.includes('The specified key does not exist')) {
        console.error(`[Media Download ${requestId}] File not found in S3`);
        return NextResponse.json(
          { 
            error: 'File not found in storage', 
            details: 'The requested file does not exist in S3',
            key,
            code: 'FILE_NOT_FOUND'
          },
          { status: 404 }
        );
      }
      
      // Check for NoSuchBucket error
      if (errorName === 'NoSuchBucket' || errorCode === 'NoSuchBucket' || 
          errorMessage.includes('NoSuchBucket')) {
        console.error(`[Media Download ${requestId}] Bucket not found`);
        return NextResponse.json(
          { 
            error: 'Storage bucket not found', 
            details: errorMessage,
            code: 'BUCKET_NOT_FOUND'
          },
          { status: 404 }
        );
      }
      
      // Check for access denied errors
      if (errorName === 'AccessDenied' || errorCode === 'AccessDenied' || 
          errorMessage.includes('AccessDenied') || errorMessage.includes('Forbidden')) {
        console.error(`[Media Download ${requestId}] Access denied to S3 object`);
        return NextResponse.json(
          { 
            error: 'Access denied to file', 
            details: errorMessage,
            code: 'ACCESS_DENIED'
          },
          { status: 403 }
        );
      }
      
      // For other S3 errors, return 500
      console.error(`[Media Download ${requestId}] Unknown S3 error`);
      return NextResponse.json(
        { 
          error: 'Failed to retrieve file from storage', 
          details: errorMessage,
          code: 'STORAGE_ERROR'
        },
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error(`[Media Download ${requestId}] Unexpected error:`, {
      error: error instanceof Error ? error.message : String(error),
      errorName: error instanceof Error ? error.name : undefined,
      stack: error instanceof Error ? error.stack : undefined,
      errorType: error?.constructor?.name,
    });
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    return NextResponse.json(
      { 
        error: 'Failed to access file', 
        details: errorMessage,
        ...(process.env.NODE_ENV === 'development' && errorStack && { stack: errorStack })
      },
      { status: 500 }
    );
  }
}

// Handle HEAD requests for video metadata
export async function HEAD(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');
    
    if (!key) {
      return new NextResponse(null, { status: 400 });
    }
    
    // Initialize S3 client
    await initializeS3();
    
    if (!s3Client || !bucketName) {
      return new NextResponse(null, { status: 500 });
    }
    
    try {
      const headCommand = new HeadObjectCommand({
        Bucket: bucketName,
        Key: key,
      });
      
      const response = await s3Client.send(headCommand);
      const filename = key.split('/').pop() || 'download';
      const contentType = response.ContentType || getContentTypeFromFilename(filename);
      const fileSize = response.ContentLength || 0;
      const isVideo = contentType.startsWith('video/');
      const isAudio = contentType.startsWith('audio/');
      
      const headers: HeadersInit = {
        'Content-Type': contentType,
        'Content-Length': fileSize.toString(),
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, Range',
        'Access-Control-Expose-Headers': 'Content-Length, Content-Type, Accept-Ranges',
      };
      
      if (isVideo || isAudio) {
        headers['Accept-Ranges'] = 'bytes';
      }
      
      return new NextResponse(null, {
        status: 200,
        headers
      });
      
    } catch (s3Error: any) {
      const errorName = s3Error?.name || s3Error?.errorName || (s3Error instanceof Error ? s3Error.name : undefined);
      const errorCode = s3Error?.Code || s3Error?.code;
      const errorMessage = s3Error instanceof Error ? s3Error.message : String(s3Error);
      
      // Check if it's a NoSuchKey error (file doesn't exist)
      if (errorName === 'NoSuchKey' || errorCode === 'NoSuchKey' || 
          errorMessage.includes('NoSuchKey') || 
          errorMessage.includes('The specified key does not exist')) {
        return new NextResponse(null, { status: 404 });
      }
      
      // For other errors, also return 404 to be safe
      return new NextResponse(null, { status: 404 });
    }
    
  } catch (error) {
    return new NextResponse(null, { status: 500 });
  }
}

// Handle OPTIONS requests for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, Range',
      'Access-Control-Expose-Headers': 'Content-Length, Content-Type, Content-Range, Accept-Ranges',
      'Access-Control-Max-Age': '86400',
    },
  });
}
