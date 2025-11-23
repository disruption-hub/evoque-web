import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'
import { addCorsHeaders, handleCors } from '@/lib/cors'
import { s3MediaService } from '@/lib/s3/s3Service'
import { getFileUrl } from '@/lib/s3/databaseConfig'

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

// PATCH /api/admin/media/[id] - Update a media file (move to folder or rename)
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
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

    const { id } = await context.params
    const body = await request.json()
    
    // Fetch media file from database
    const mediaFile = await prisma.mediaFile.findUnique({
      where: { id },
    })

    if (!mediaFile) {
      return addCorsHeaders(NextResponse.json(
        { error: 'Media file not found' },
        { status: 404 }
      ), origin)
    }

    const oldS3Key = mediaFile.s3Key
    const oldFolder = mediaFile.folder
    const oldFileName = mediaFile.fileName
    let newS3Key = oldS3Key
    let newFolder = oldFolder
    let newFileName = oldFileName
    let needsS3Move = false

    // Handle folder change (move)
    if (body.folder !== undefined) {
      newFolder = body.folder || null
      
      // Calculate new S3 key based on folder
      if (oldS3Key) {
        const keyParts = oldS3Key.split('/')
        const fileName = keyParts[keyParts.length - 1]
        
        if (newFolder) {
          newS3Key = `${newFolder}/${fileName}`
        } else {
          newS3Key = fileName
        }
        
        // Only move in S3 if the key actually changed
        if (newS3Key !== oldS3Key) {
          needsS3Move = true
        }
      }
    }

    // Handle file name change (rename)
    if (body.fileName !== undefined && body.fileName !== oldFileName) {
      newFileName = body.fileName
      
      // Update S3 key with new filename
      if (oldS3Key) {
        const keyParts = oldS3Key.split('/')
        const extension = keyParts[keyParts.length - 1].split('.').pop()
        
        // Preserve the timestamp and random string prefix if present
        const oldFileNameParts = keyParts[keyParts.length - 1].split('-')
        let newKeyFileName = newFileName
        
        // If old filename has timestamp-random pattern, preserve it
        if (oldFileNameParts.length >= 3 && /^\d+$/.test(oldFileNameParts[0])) {
          const timestamp = oldFileNameParts[0]
          const randomString = oldFileNameParts[1]
          const sanitizedName = newFileName.replace(/[^a-zA-Z0-9.-]/g, '_')
          newKeyFileName = `${timestamp}-${randomString}-${sanitizedName}`
        } else {
          // Otherwise, sanitize the new name
          const sanitizedName = newFileName.replace(/[^a-zA-Z0-9.-]/g, '_')
          newKeyFileName = sanitizedName
        }
        
        // Ensure extension is preserved
        if (extension && !newKeyFileName.endsWith(`.${extension}`)) {
          newKeyFileName = `${newKeyFileName}.${extension}`
        }
        
        if (newFolder) {
          newS3Key = `${newFolder}/${newKeyFileName}`
        } else {
          newS3Key = newKeyFileName
        }
        
        if (newS3Key !== oldS3Key) {
          needsS3Move = true
        }
      }
    }

    // Move file in S3 if needed
    if (needsS3Move && oldS3Key && newS3Key) {
      try {
        await s3MediaService.moveFile(oldS3Key, newS3Key, true)
      } catch (error: any) {
        console.error('Error moving file in S3:', error)
        return addCorsHeaders(NextResponse.json(
          { 
            error: 'Failed to move file in S3',
            details: error.message
          },
          { status: 500 }
        ), origin)
      }
    }

    // Get S3 config for generating new file URL
    const { createS3Client } = await import('@/lib/s3/databaseConfig')
    const { config: s3Config } = await createS3Client()
    const newFileUrl = newS3Key && s3Config ? getFileUrl(newS3Key, s3Config) : mediaFile.fileUrl

    // Update database record
    const updateData: any = {
      updatedAt: new Date(),
    }

    if (newFolder !== oldFolder) {
      updateData.folder = newFolder
    }

    if (newFileName !== oldFileName) {
      updateData.fileName = newFileName
    }

    if (newS3Key !== oldS3Key) {
      updateData.s3Key = newS3Key
      updateData.fileUrl = newFileUrl
    }

    const updatedMediaFile = await prisma.mediaFile.update({
      where: { id },
      data: updateData,
      include: {
        uploadedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    })

    // Convert BigInt to number for JSON serialization
    const serializedMediaFile = {
      ...updatedMediaFile,
      fileSize: Number(updatedMediaFile.fileSize),
      createdAt: updatedMediaFile.createdAt.toISOString(),
      updatedAt: updatedMediaFile.updatedAt.toISOString(),
    }

    return addCorsHeaders(NextResponse.json(serializedMediaFile), origin)
  } catch (error: any) {
    console.error('Error updating media file:', error)
    return addCorsHeaders(NextResponse.json(
      { error: error.message || 'Failed to update media file' },
      { status: 500 }
    ), origin)
  }
}

// DELETE /api/admin/media/[id] - Delete a media file
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
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

    const { id } = await context.params
    
    // Get query parameters for delete type
    const { searchParams } = new URL(request.url)
    const deleteFrom = (searchParams.get('deleteFrom') || 'both') as 'db' | 's3' | 'both'

    // Validate deleteFrom parameter
    if (!['db', 's3', 'both'].includes(deleteFrom)) {
      return addCorsHeaders(NextResponse.json(
        { error: 'Invalid deleteFrom parameter. Must be "db", "s3", or "both"' },
        { status: 400 }
      ), origin)
    }

    // Fetch media file from database
    const mediaFile = await prisma.mediaFile.findUnique({
      where: { id },
    })

    if (!mediaFile) {
      return addCorsHeaders(NextResponse.json(
        { error: 'Media file not found' },
        { status: 404 }
      ), origin)
    }

    const s3Key = mediaFile.s3Key
    let dbDeleted = false
    let s3Deleted = false
    const errors: string[] = []

    // Delete from database
    if (deleteFrom === 'db' || deleteFrom === 'both') {
      try {
        await prisma.mediaFile.delete({
          where: { id },
        })
        dbDeleted = true
      } catch (error: any) {
        console.error('Error deleting from database:', error)
        errors.push(`Database deletion failed: ${error.message || 'Unknown error'}`)
      }
    }

    // Delete from S3
    if ((deleteFrom === 's3' || deleteFrom === 'both') && s3Key) {
      try {
        await s3MediaService.deleteFile(s3Key)
        s3Deleted = true
      } catch (error: any) {
        console.error('Error deleting from S3:', error)
        errors.push(`S3 deletion failed: ${error.message || 'Unknown error'}`)
        
        // If deleteFrom is 'both' and S3 deletion fails, but DB deletion succeeded,
        // we should still report success but note the S3 error
        if (deleteFrom === 'both' && dbDeleted) {
          // Continue - partial success
        } else if (deleteFrom === 's3') {
          // If only S3 deletion was requested and it failed, return error
          return addCorsHeaders(NextResponse.json(
            { 
              error: 'Failed to delete from S3',
              details: errors
            },
            { status: 500 }
          ), origin)
        }
      }
    } else if ((deleteFrom === 's3' || deleteFrom === 'both') && !s3Key) {
      // If S3 deletion was requested but no s3Key exists, warn but don't fail
      if (deleteFrom === 's3') {
        return addCorsHeaders(NextResponse.json(
          { error: 'No S3 key found for this file' },
          { status: 400 }
        ), origin)
      }
      // If deleteFrom is 'both', continue with DB deletion only
    }

    // Determine response based on what was requested and what succeeded
    if (deleteFrom === 'db' && !dbDeleted) {
      return addCorsHeaders(NextResponse.json(
        { 
          error: 'Failed to delete from database',
          details: errors
        },
        { status: 500 }
      ), origin)
    }

    if (deleteFrom === 's3' && !s3Deleted) {
      return addCorsHeaders(NextResponse.json(
        { 
          error: 'Failed to delete from S3',
          details: errors
        },
        { status: 500 }
      ), origin)
    }

    // Success response
    return addCorsHeaders(NextResponse.json({
      success: true,
      message: 'File deleted successfully',
      deleted: {
        database: dbDeleted,
        s3: s3Deleted,
      },
      ...(errors.length > 0 && { warnings: errors }),
    }), origin)
  } catch (error: any) {
    console.error('Error deleting media file:', error)
    return addCorsHeaders(NextResponse.json(
      { error: error.message || 'Failed to delete media file' },
      { status: 500 }
    ), origin)
  }
}
