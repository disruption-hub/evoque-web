import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { addCorsHeaders, handleCors } from '@/lib/cors'

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

// Handle preflight OPTIONS request
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin')
  return handleCors(origin)
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin')
  
  try {
    const body = await request.json()
    const { email, password } = loginSchema.parse(body)

    // Find user by email - select only needed fields for better performance
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
        firstName: true,
        lastName: true,
        phone: true,
        profileImage: true,
        isActive: true,
        emailVerified: true,
        lastLoginAt: true,
        createdAt: true,
        roleId: true,
        role: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
    })

    if (!user) {
      return addCorsHeaders(NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      ), origin)
    }

    // Check if user is active
    if (!user.isActive) {
      return addCorsHeaders(NextResponse.json(
        { error: 'Account is deactivated' },
        { status: 401 }
      ), origin)
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password)
    if (!isValidPassword) {
      return addCorsHeaders(NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      ), origin)
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    })

    // Create JWT token
    const jwtSecret = process.env.JWT_SECRET || 'fallback-secret';
    
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        roleId: user.roleId 
      },
      jwtSecret,
      { expiresIn: '7d' }
    )

    // Create session in database
    await prisma.session.create({
      data: {
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    })

    // Prepare user data (exclude password)
    const userData = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      profileImage: user.profileImage,
      role: {
        id: user.role.id,
        name: user.role.name,
        description: user.role.description
      },
      emailVerified: user.emailVerified,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt
    }

    // Create response with cookie
    const response = NextResponse.json({
      success: true,
      user: userData,
      token
    })

    // Determine cookie settings based on environment
    const isProduction = process.env.NODE_ENV === 'production';
    const sameSite = isProduction ? 'none' : 'lax';
    const secure = isProduction;

    // Set HTTP-only cookie (for server-side reading)
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: secure,
      sameSite: sameSite as 'lax' | 'none' | 'strict',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    })

    // Also set a non-httpOnly cookie for client-side Authorization header
    response.cookies.set('auth-token-client', token, {
      httpOnly: false,
      secure: secure,
      sameSite: sameSite as 'lax' | 'none' | 'strict',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    })

    return addCorsHeaders(response, origin)

  } catch (error) {
    console.error('Login error:', error)
    
    if (error instanceof z.ZodError) {
      return addCorsHeaders(NextResponse.json(
        { error: 'Invalid input data', details: error.issues },
        { status: 400 }
      ), origin)
    }

    return addCorsHeaders(NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    ), origin)
  }
}

