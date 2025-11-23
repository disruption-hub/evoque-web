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

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin')
  return handleCors(origin)
}

export async function GET(request: NextRequest) {
  const origin = request.headers.get('origin')
  
  try {
    const auth = await authenticateRequest(request)
    if (auth.error) return auth.error
    if (!auth.user) {
      return addCorsHeaders(NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      ), origin)
    }

    const configs = await prisma.awsConfiguration.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: {
          select: { id: true, email: true, firstName: true, lastName: true }
        },
        updatedBy: {
          select: { id: true, email: true, firstName: true, lastName: true }
        }
      }
    })

    // Don't expose secret keys in response and convert BigInt to string
    const safeConfigs = configs.map(config => ({
      ...config,
      maxFileSize: config.maxFileSize.toString(),
      secretAccessKey: config.secretAccessKey ? '***hidden***' : null,
      encryptionKey: config.encryptionKey ? '***hidden***' : null,
    }))

    return addCorsHeaders(NextResponse.json({
      success: true,
      data: safeConfigs
    }), origin)
  } catch (error) {
    console.error('Error fetching AWS configurations:', error)
    return addCorsHeaders(NextResponse.json(
      { error: 'Internal server error', success: false },
      { status: 500 }
    ), origin)
  }
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin')
  
  try {
    const auth = await authenticateRequest(request)
    if (auth.error) return auth.error
    if (!auth.user) {
      return addCorsHeaders(NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      ), origin)
    }

    const body = await request.json()
    const {
      region,
      bucketName,
      accessKeyId,
      secretAccessKey,
      urlPrefix,
      isActive,
      maxFileSize,
      allowedFileTypes,
      folderStructure,
      enableCdn,
      cdnUrl,
      enableEncryption,
      encryptionKey,
      corsEnabled,
      corsOrigins,
      versioningEnabled,
      lifecyclePolicy,
      public: isPublic
    } = body

    const config = await prisma.awsConfiguration.create({
      data: {
        region: region || 'us-east-1',
        bucketName,
        accessKeyId,
        secretAccessKey,
        urlPrefix,
        isActive: isActive !== undefined ? isActive : true,
        maxFileSize: maxFileSize ? BigInt(maxFileSize) : BigInt(52428800),
        allowedFileTypes: allowedFileTypes || ['image/*', 'video/*', 'application/pdf', 'text/*'],
        folderStructure: folderStructure || 'uploads',
        enableCdn: enableCdn || false,
        cdnUrl,
        enableEncryption: enableEncryption || false,
        encryptionKey,
        corsEnabled: corsEnabled !== undefined ? corsEnabled : true,
        corsOrigins: corsOrigins || ['*'],
        versioningEnabled: versioningEnabled !== undefined ? versioningEnabled : true,
        lifecyclePolicy,
        public: isPublic || false,
        createdById: auth.user.id
      },
      include: {
        createdBy: {
          select: { id: true, email: true, firstName: true, lastName: true }
        }
      }
    })

    return addCorsHeaders(NextResponse.json({
      success: true,
      data: {
        ...config,
        secretAccessKey: '***hidden***',
        encryptionKey: config.encryptionKey ? '***hidden***' : null,
        maxFileSize: config.maxFileSize.toString()
      }
    }), origin)
  } catch (error) {
    console.error('Error creating AWS configuration:', error)
    return addCorsHeaders(NextResponse.json(
      { error: 'Internal server error', success: false },
      { status: 500 }
    ), origin)
  }
}

