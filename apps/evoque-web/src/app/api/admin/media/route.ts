import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'
import { addCorsHeaders, handleCors } from '@/lib/cors'

async function authenticateRequest(request: NextRequest) {
  const origin = request.headers.get('origin')
  
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '') || 
                request.cookies.get('auth-token-client')?.value ||
                request.cookies.get('auth-token')?.value

  if (!token) {
    return { error: addCorsHeaders(NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    ), origin), user: null }
  }

  let decoded: any
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret')
  } catch (error) {
    return { error: addCorsHeaders(NextResponse.json(
      { error: 'Invalid or expired token' },
      { status: 401 }
    ), origin), user: null }
  }

  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
    include: { role: true },
  })

  if (!user || !user.isActive) {
    return { error: addCorsHeaders(NextResponse.json(
      { error: 'User not found or inactive' },
      { status: 401 }
    ), origin), user: null }
  }

  // Admin role check removed - all authenticated users can access admin routes
  return { error: null, user }
}

// Handle preflight OPTIONS request
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin')
  return handleCors(origin)
}

// GET /api/admin/media - Get all media files with pagination
export async function GET(request: NextRequest) {
  const origin = request.headers.get('origin')
  
  try {
    // Check authentication
    const authResult = await authenticateRequest(request)
    if (authResult.error) return authResult.error
    if (!authResult.user) {
      return addCorsHeaders(NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      ), origin)
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const search = searchParams.get('search') || ''
    const folder = searchParams.get('folder') || ''
    const fileType = searchParams.get('fileType') || ''
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}
    
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { fileName: { contains: search, mode: 'insensitive' } },
        { altText: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (folder && folder !== 'all') {
      where.folder = folder
    }

    if (fileType && fileType !== 'all') {
      // Handle different file type filters
      if (fileType === 'image') {
        where.fileType = { startsWith: 'image/' }
      } else if (fileType === 'video') {
        where.fileType = { startsWith: 'video/' }
      } else if (fileType === 'audio') {
        where.fileType = { startsWith: 'audio/' }
      } else {
        where.fileType = { contains: fileType }
      }
    }

    // Fetch media files
    const [mediaFiles, total] = await Promise.all([
      prisma.mediaFile.findMany({
        where,
        include: {
          uploadedBy: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      prisma.mediaFile.count({ where }),
    ])

    // Convert BigInt values to numbers for JSON serialization
    const serializedMediaFiles = mediaFiles.map(file => ({
      ...file,
      fileSize: Number(file.fileSize),
      s3Key: file.s3Key || undefined,
      createdAt: file.createdAt.toISOString(),
      updatedAt: file.updatedAt.toISOString(),
    }))

    return addCorsHeaders(NextResponse.json({
      mediaFiles: serializedMediaFiles,
      pagination: {
        page,
        limit,
        total: Number(total),
        pages: Math.ceil(Number(total) / limit),
      },
    }), origin)
  } catch (error: any) {
    console.error('Error fetching media files:', error)
    return addCorsHeaders(NextResponse.json(
      { error: error.message || 'Failed to fetch media files' },
      { status: 500 }
    ), origin)
  }
}

