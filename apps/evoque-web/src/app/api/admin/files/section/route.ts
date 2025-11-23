import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';
import { writeSection } from '@/lib/file-service';
import { Section } from '@/types';
import { addCorsHeaders, handleCors } from '@/lib/cors';

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

  return { error: null, user };
}

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  return handleCors(origin);
}

// POST /api/admin/files/section - Update a section
export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');

  try {
    const authResult = await authenticateRequest(request);
    if (authResult.error) return authResult.error;
    if (!authResult.user) {
      return addCorsHeaders(
        NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
        origin
      );
    }

    const body = await request.json();
    const section = body.section as Section;

    if (!section || !section.id) {
      return addCorsHeaders(
        NextResponse.json({ error: 'Section data is required' }, { status: 400 }),
        origin
      );
    }

    const success = await writeSection(section);

    if (!success) {
      return addCorsHeaders(
        NextResponse.json({ error: 'Failed to save section' }, { status: 500 }),
        origin
      );
    }

    return addCorsHeaders(
      NextResponse.json({ success: true, data: section }),
      origin
    );
  } catch (error: any) {
    console.error('Error updating section:', error);
    return addCorsHeaders(
      NextResponse.json(
        { error: error.message || 'Internal server error' },
        { status: 500 }
      ),
      origin
    );
  }
}

