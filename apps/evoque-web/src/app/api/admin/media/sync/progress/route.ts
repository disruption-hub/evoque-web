import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';
import { addCorsHeaders, handleCors } from '@/lib/cors';
import { s3MediaService } from '@/lib/s3/s3Service';

// Route segment config for Vercel - increase timeout for sync operations
export const maxDuration = 300; // 5 minutes for sync operations
export const runtime = 'nodejs'; // Use Node.js runtime for database and S3 operations
export const dynamic = 'force-dynamic'; // Ensure route is not statically optimized
export const fetchCache = 'force-no-store'; // Disable caching for this route

async function authenticateRequest(request: NextRequest) {
  const origin = request.headers.get('origin');
  
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '') || 
                request.cookies.get('auth-token-client')?.value ||
                request.cookies.get('auth-token')?.value;

  if (!token) {
    return { error: addCorsHeaders(NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    ), origin), user: null };
  }

  let decoded: any;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
  } catch (error) {
    return { error: addCorsHeaders(NextResponse.json(
      { error: 'Invalid or expired token' },
      { status: 401 }
    ), origin), user: null };
  }

  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
    include: { role: true },
  });

  if (!user || !user.isActive) {
    return { error: addCorsHeaders(NextResponse.json(
      { error: 'User not found or inactive' },
      { status: 401 }
    ), origin), user: null };
  }

  // Admin role check removed - all authenticated users can access admin routes
  return { error: null, user };
}

// Handle preflight OPTIONS request
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  return handleCors(origin);
}

// POST /api/admin/media/sync/progress - Sync S3 with database with progress updates via SSE
export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  
  try {
    // Check authentication
    const authResult = await authenticateRequest(request);
    if (authResult.error) return authResult.error;
    if (!authResult.user) {
      return addCorsHeaders(NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      ), origin);
    }

    // Check if S3 is configured
    const isConfigured = await s3MediaService.isConfigured();
    if (!isConfigured) {
      return addCorsHeaders(NextResponse.json(
        { error: 'AWS S3 is not properly configured' },
        { status: 500 }
      ), origin);
    }

    // Create a ReadableStream for Server-Sent Events
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        
        const sendEvent = (type: string, data: any) => {
          const message = `data: ${JSON.stringify({ type, ...data })}\n\n`;
          controller.enqueue(encoder.encode(message));
        };

        try {
          // Send initial progress
          sendEvent('progress', { current: 0, total: 0 });

          // Perform sync with progress callback
          const result = await s3MediaService.syncWithDatabase(
            authResult.user.id,
            (current: number, total: number) => {
              sendEvent('progress', { current, total });
            }
          );

          // Send completion event
          sendEvent('complete', {
            result: {
              synced: result.synced,
              created: result.created,
              updated: result.updated,
              deleted: result.deleted,
              totalObjects: result.synced + result.deleted,
            }
          });

          controller.close();
        } catch (error: any) {
          console.error('Error during media sync:', error);
          sendEvent('error', {
            error: error.message || 'Failed to sync media'
          });
          controller.close();
        }
      }
    });

    // Return SSE response
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        ...(origin ? {
          'Access-Control-Allow-Origin': origin,
          'Access-Control-Allow-Credentials': 'true',
        } : {}),
      },
    });
  } catch (error: any) {
    console.error('Error starting media sync:', error);
    return addCorsHeaders(NextResponse.json(
      { error: error.message || 'Failed to start media sync' },
      { status: 500 }
    ), origin);
  }
}

