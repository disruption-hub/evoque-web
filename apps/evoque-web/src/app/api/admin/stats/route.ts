import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'
import { addCorsHeaders, handleCors } from '@/lib/cors'

// Handle preflight OPTIONS request
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin')
  return handleCors(origin)
}

export async function GET(request: NextRequest) {
  const origin = request.headers.get('origin')
  
  try {
    // Extract token from Authorization header or cookies
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '') || 
                  request.cookies.get('auth-token-client')?.value ||
                  request.cookies.get('auth-token')?.value

    if (!token) {
      return addCorsHeaders(NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      ), origin)
    }

    // Verify token
    let decoded: any
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret')
    } catch (error) {
      return addCorsHeaders(NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      ), origin)
    }

    // Get user with role
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        role: true,
      },
    })

    if (!user || !user.isActive) {
      return addCorsHeaders(NextResponse.json(
        { error: 'User not found or inactive' },
        { status: 401 }
      ), origin)
    }

    // Check if user is admin
    const roleName = user.role?.name || ''
    const isAdmin = ['super_admin', 'Admin'].includes(roleName)

    if (!isAdmin) {
      return addCorsHeaders(NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      ), origin)
    }

    // Verify session is still active
    const session = await prisma.session.findFirst({
      where: {
        userId: user.id,
        isActive: true,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    if (!session) {
      return addCorsHeaders(NextResponse.json(
        { error: 'Session expired or invalid' },
        { status: 401 }
      ), origin)
    }

    // Get pages stats - with error handling
    let totalPages = 0, publishedPages = 0, draftPages = 0
    try {
      [totalPages, publishedPages, draftPages] = await Promise.all([
        prisma.page.count().catch(() => 0),
        prisma.page.count({ where: { status: 'published' } }).catch(() => 0),
        prisma.page.count({ where: { status: 'draft' } }).catch(() => 0),
      ])
    } catch (error) {
      console.error('Error fetching pages stats:', error)
    }

    // Get media stats - with error handling
    let images = 0, videos = 0, totalSize = 0, mediaTotal = 0
    try {
      const mediaFiles = await prisma.mediaFile.findMany({
        select: {
          fileType: true,
          fileSize: true,
        },
      }).catch(() => [])

      mediaTotal = mediaFiles.length
      images = mediaFiles.filter((f) => f.fileType?.startsWith('image/')).length
      videos = mediaFiles.filter((f) => f.fileType?.startsWith('video/')).length
      totalSize = mediaFiles.reduce((sum, f) => sum + Number(f.fileSize || 0), 0)
    } catch (error) {
      console.error('Error fetching media stats:', error)
    }

    // Get users stats - with error handling
    let totalUsers = 0, activeUsers = 0, interpreters = 0, clients = 0
    try {
      [totalUsers, activeUsers] = await Promise.all([
        prisma.user.count().catch(() => 0),
        prisma.user.count({ where: { isActive: true } }).catch(() => 0),
      ])

      // Get user roles breakdown
      interpreters = await prisma.user.count({
        where: {
          isActive: true,
          role: {
            name: 'Interpreter',
          },
        },
      }).catch(() => 0)

      clients = await prisma.user.count({
        where: {
          isActive: true,
          role: {
            name: 'Client',
          },
        },
      }).catch(() => 0)
    } catch (error) {
      console.error('Error fetching users stats:', error)
    }

    // Get forms stats - with error handling
    let totalForms = 0, activeForms = 0, totalSubmissions = 0
    try {
      [totalForms, activeForms, totalSubmissions] = await Promise.all([
        prisma.form.count().catch(() => 0),
        prisma.form.count({ where: { isActive: true } }).catch(() => 0),
        prisma.formSubmission.count().catch(() => 0),
      ])
    } catch (error) {
      console.error('Error fetching forms stats:', error)
    }

    // Get roles stats - with error handling
    let totalRoles = 0, activeRoles = 0
    try {
      [totalRoles, activeRoles] = await Promise.all([
        prisma.role.count().catch(() => 0),
        prisma.role.count({ where: { isActive: true } }).catch(() => 0),
      ])
    } catch (error) {
      console.error('Error fetching roles stats:', error)
    }

    // Get AWS configuration status - with error handling
    let awsConfig = null
    try {
      awsConfig = await prisma.awsConfiguration.findFirst({
        where: { isActive: true },
        select: { id: true, isActive: true, region: true, bucketName: true },
      }).catch(() => null)
    } catch (error) {
      console.error('Error fetching AWS config:', error)
    }

    // Get Resend configuration status - with error handling
    let resendConfig = null
    try {
      resendConfig = await prisma.resendConfiguration.findFirst({
        where: { isActive: true },
        select: { id: true, isActive: true },
      }).catch(() => null)
    } catch (error) {
      console.error('Error fetching Resend config:', error)
    }

    // Get recent activity - with error handling
    let recentActivity: any[] = []
    try {
      const recentPages = await prisma.page.findMany({
        take: 5,
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          title: true,
          updatedAt: true,
        },
      }).catch(() => [])

      recentActivity = recentPages.map((page) => ({
        type: 'page',
        message: `Page "${page.title}" was updated`,
        timestamp: page.updatedAt.toISOString(),
      }))
    } catch (error) {
      console.error('Error fetching recent activity:', error)
    }

    const stats = {
      pages: {
        total: totalPages,
        published: publishedPages,
        draft: draftPages,
      },
      media: {
        total: mediaTotal,
        images,
        videos,
        totalSize,
      },
      users: {
        total: totalUsers,
        active: activeUsers,
        interpreters,
        clients,
      },
      forms: {
        total: totalForms,
        active: activeForms,
        submissions: totalSubmissions,
      },
      roles: {
        total: totalRoles,
        active: activeRoles,
      },
      connections: {
        aws: {
          connected: !!awsConfig,
          isActive: awsConfig?.isActive || false,
          region: awsConfig?.region || null,
          bucketName: awsConfig?.bucketName || null,
        },
        resend: {
          connected: !!resendConfig,
          isActive: resendConfig?.isActive || false,
        },
      },
      recentActivity,
    }

    return addCorsHeaders(NextResponse.json({
      success: true,
      data: stats,
    }), origin)

  } catch (error) {
    console.error('Error fetching admin stats:', error)
    return addCorsHeaders(NextResponse.json(
      { error: 'Internal server error', success: false },
      { status: 500 }
    ), origin)
  }
}

