import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'
import { addCorsHeaders, handleCors } from '@/lib/cors'
import { exec } from 'child_process'
import { promisify } from 'util'
import { writeFile, unlink, mkdtemp } from 'fs/promises'
import { join } from 'path'
import { tmpdir } from 'os'
import { readFileSync } from 'fs'

const execAsync = promisify(exec)

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

  return { error: null, user }
}

// Handle preflight OPTIONS request
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin')
  return handleCors(origin)
}

// POST /api/admin/media/compress - Compress a video file
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

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    const targetSizeMB = formData.get('targetSizeMB') ? parseFloat(formData.get('targetSizeMB') as string) : 4
    
    if (!file) {
      return addCorsHeaders(NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      ), origin)
    }

    // Check if file is a video or image
    const isVideo = file.type.startsWith('video/')
    const isImage = file.type.startsWith('image/')
    
    if (!isVideo && !isImage) {
      return addCorsHeaders(NextResponse.json(
        { error: 'File must be a video or image' },
        { status: 400 }
      ), origin)
    }

    const targetSizeBytes = targetSizeMB * 1024 * 1024
    
    // If file is already smaller than target, return original
    if (file.size <= targetSizeBytes) {
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      
      return addCorsHeaders(
        new NextResponse(buffer, {
          headers: {
            'Content-Type': file.type,
            'Content-Disposition': `attachment; filename="${file.name}"`,
            'Content-Length': buffer.length.toString(),
          },
        }),
        origin
      )
    }

    // Handle image compression
    if (isImage) {
      // For images, we'll use a simple approach: return error suggesting client-side compression
      // In a production environment, you'd want to use sharp or similar library
      return addCorsHeaders(NextResponse.json(
        { 
          error: 'Image compression should be handled client-side. Please use the client-side compression feature.',
          code: 'USE_CLIENT_COMPRESSION'
        },
        { status: 400 }
      ), origin)
    }

    // Create temporary directory for video compression
    const tempDir = await mkdtemp(join(tmpdir(), 'video-compress-'))
    const inputPath = join(tempDir, `input.${file.name.split('.').pop()}`)
    const outputPath = join(tempDir, 'output.mp4')

    try {
      // Write input file to disk
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      await writeFile(inputPath, buffer)

      // Get video duration using ffprobe
      const { stdout: durationOutput } = await execAsync(
        `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${inputPath}"`
      )
      const duration = parseFloat(durationOutput.trim())
      
      if (!duration || duration <= 0) {
        throw new Error('Could not determine video duration')
      }

      // Calculate target bitrate
      const audioBitrate = 128000 // 128kbps
      const audioSize = (audioBitrate * duration) / 8 // in bytes
      const availableVideoSize = targetSizeBytes - audioSize
      const videoBitrate = Math.max((availableVideoSize * 8) / duration, 500000) // Minimum 500kbps
      const targetBitrateKbps = Math.floor(videoBitrate / 1000)

      // Compress video using ffmpeg
      const crf = 28 // Good balance between quality and size
      const ffmpegCommand = [
        'ffmpeg',
        '-i', `"${inputPath}"`,
        '-c:v', 'libx264',
        '-preset', 'medium',
        '-crf', crf.toString(),
        '-b:v', `${targetBitrateKbps}k`,
        '-maxrate', `${targetBitrateKbps}k`,
        '-bufsize', `${targetBitrateKbps * 2}k`,
        '-c:a', 'aac',
        '-b:a', '128k',
        '-movflags', '+faststart',
        '-y',
        `"${outputPath}"`
      ].join(' ')

      await execAsync(ffmpegCommand)

      // Read compressed file
      const compressedBuffer = readFileSync(outputPath)
      
      // If still too large, try more aggressive compression
      if (compressedBuffer.length > targetSizeBytes && compressedBuffer.length < file.size) {
        const newBitrateKbps = Math.floor(targetBitrateKbps * 0.8)
        
        const ffmpegCommand2 = [
          'ffmpeg',
          '-i', `"${inputPath}"`,
          '-c:v', 'libx264',
          '-preset', 'medium',
          '-crf', '30',
          '-b:v', `${newBitrateKbps}k`,
          '-maxrate', `${newBitrateKbps}k`,
          '-bufsize', `${newBitrateKbps * 2}k`,
          '-c:a', 'aac',
          '-b:a', '96k',
          '-movflags', '+faststart',
          '-y',
          `"${outputPath}"`
        ].join(' ')

        await execAsync(ffmpegCommand2)
        const compressedBuffer2 = readFileSync(outputPath)
        
        // Clean up
        await unlink(inputPath).catch(() => {})
        await unlink(outputPath).catch(() => {})
        
        return addCorsHeaders(
          new NextResponse(compressedBuffer2, {
            headers: {
              'Content-Type': 'video/mp4',
              'Content-Disposition': `attachment; filename="${file.name.replace(/\.[^/.]+$/, '')}-compressed.mp4"`,
              'Content-Length': compressedBuffer2.length.toString(),
            },
          }),
          origin
        )
      }

      // Clean up
      await unlink(inputPath).catch(() => {})
      await unlink(outputPath).catch(() => {})

      return addCorsHeaders(
        new NextResponse(compressedBuffer, {
          headers: {
            'Content-Type': 'video/mp4',
            'Content-Disposition': `attachment; filename="${file.name.replace(/\.[^/.]+$/, '')}-compressed.mp4"`,
            'Content-Length': compressedBuffer.length.toString(),
          },
        }),
        origin
      )
    } catch (error: any) {
      // Clean up on error
      await unlink(inputPath).catch(() => {})
      await unlink(outputPath).catch(() => {})
      
      console.error('Video compression error:', error)
      throw error
    }
  } catch (error: any) {
    console.error('Error compressing video:', error)
    
    // Check if ffmpeg is available
    if (error.message?.includes('ffmpeg') || error.message?.includes('ffprobe')) {
      return addCorsHeaders(NextResponse.json(
        { 
          error: 'FFmpeg is not installed or not available on the server. Please install FFmpeg to enable video compression.',
          code: 'FFMPEG_NOT_AVAILABLE'
        },
        { status: 500 }
      ), origin)
    }
    
    return addCorsHeaders(NextResponse.json(
      { 
        error: error.message || 'Failed to compress video',
        code: 'COMPRESSION_ERROR'
      },
      { status: 500 }
    ), origin)
  }
}

