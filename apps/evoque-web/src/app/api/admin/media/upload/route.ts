import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'
import { addCorsHeaders, handleCors } from '@/lib/cors'
import { createS3Client, getFileUrl, isFileTypeAllowed, getMaxFileSize } from '@/lib/s3/databaseConfig'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

// Configure route segment for file uploads
// Note: Vercel has a 4.5MB body size limit for serverless functions
// Files larger than 4.5MB will return a 413 error at the platform level
// For larger files, consider implementing presigned URLs for direct S3 uploads
export const runtime = 'nodejs'
export const maxDuration = 60 // 60 seconds for large file uploads

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

// POST /api/admin/media/upload - Upload a file to S3 and save to database
export async function POST(request: NextRequest) {
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

    // Get S3 configuration
    const { client: s3Client, config: s3Config } = await createS3Client()
    if (!s3Client || !s3Config) {
      return addCorsHeaders(NextResponse.json(
        { error: 'S3 not configured' },
        { status: 500 }
      ), origin)
    }

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return addCorsHeaders(NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      ), origin)
    }

    // Validate file size
    const maxSize = getMaxFileSize(s3Config)
    if (file.size > maxSize) {
      return addCorsHeaders(NextResponse.json(
        { error: `File size exceeds ${maxSize / (1024 * 1024)}MB limit` },
        { status: 400 }
      ), origin)
    }

    // Validate file type
    if (!isFileTypeAllowed(file.type, s3Config)) {
      return addCorsHeaders(NextResponse.json(
        { error: 'File type not allowed' },
        { status: 400 }
      ), origin)
    }

    // Get metadata from form data
    const title = (formData.get('title') as string) || file.name.split('.')[0]
    const folder = (formData.get('folder') as string) || null
    const altText = (formData.get('altText') as string) || null
    const description = (formData.get('description') as string) || null

    // Generate unique filename
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 15)
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const fileName = `${timestamp}-${randomString}-${sanitizedName}`
    const s3Key = folder ? `${folder}/${fileName}` : fileName

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload to S3
    // Note: ACL is not set as modern S3 buckets often have ACLs disabled
    // Access control should be managed through bucket policies instead
    const uploadCommand = new PutObjectCommand({
      Bucket: s3Config.bucketName,
      Key: s3Key,
      Body: buffer,
      ContentType: file.type,
      Metadata: {
        originalName: file.name,
        uploadedBy: authResult.user.id,
        uploadedAt: new Date().toISOString(),
      },
    })

    await s3Client.send(uploadCommand)

    // Generate file URL
    const fileUrl = getFileUrl(s3Key, s3Config)

    // Create database record
    const mediaFile = await prisma.mediaFile.create({
      data: {
        title,
        fileName: file.name,
        fileUrl,
        s3Key,
        fileSize: BigInt(file.size),
        fileType: file.type,
        folder,
        altText,
        description,
        isPublic: true,
        uploadedById: authResult.user.id,
      },
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
    })

    // Convert BigInt to number for JSON serialization
    const serializedMediaFile = {
      ...mediaFile,
      fileSize: Number(mediaFile.fileSize),
      createdAt: mediaFile.createdAt.toISOString(),
      updatedAt: mediaFile.updatedAt.toISOString(),
    }

    return addCorsHeaders(NextResponse.json(serializedMediaFile), origin)
  } catch (error: any) {
    console.error('Error uploading media file:', error)
    
    // Handle 413 Payload Too Large errors specifically
    if (error.message?.includes('413') || error.message?.includes('Payload Too Large') || error.message?.includes('body size')) {
      return addCorsHeaders(NextResponse.json(
        { 
          error: 'File too large. Vercel has a 4.5MB body size limit. For larger files, please use direct S3 upload with presigned URLs.',
          code: 'PAYLOAD_TOO_LARGE',
          maxSize: 4.5 * 1024 * 1024 // 4.5MB in bytes
        },
        { status: 413 }
      ), origin)
    }
    
    return addCorsHeaders(NextResponse.json(
      { error: error.message || 'Failed to upload media file' },
      { status: 500 }
    ), origin)
  }
}

