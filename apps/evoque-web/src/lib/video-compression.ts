import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

// Singleton FFmpeg instance
let ffmpegInstance: FFmpeg | null = null;
let isFFmpegLoaded = false;

/**
 * Initialize FFmpeg instance (singleton pattern)
 */
async function getFFmpeg(): Promise<FFmpeg> {
  if (ffmpegInstance && isFFmpegLoaded) {
    return ffmpegInstance;
  }

  const ffmpeg = new FFmpeg();
  
  // Load FFmpeg core and wasm files
  const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
  
  try {
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    });
    
    ffmpegInstance = ffmpeg;
    isFFmpegLoaded = true;
    
    return ffmpeg;
  } catch (error) {
    console.error('Failed to load FFmpeg:', error);
    throw new Error('Failed to initialize video compression. Please refresh the page and try again.');
  }
}

/**
 * Calculate target bitrate based on target file size and video duration
 */
function calculateTargetBitrate(targetSizeBytes: number, durationSeconds: number): number {
  // Target bitrate in bits per second
  // Account for audio bitrate (typically 128kbps = 128000 bps)
  const audioBitrate = 128000;
  const audioSize = audioBitrate * durationSeconds / 8; // in bytes
  const availableVideoSize = targetSizeBytes - audioSize;
  const videoBitrate = (availableVideoSize * 8) / durationSeconds; // in bits per second
  
  // Ensure minimum bitrate
  return Math.max(videoBitrate, 500000); // Minimum 500kbps
}

/**
 * Get video duration in seconds
 */
async function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    
    video.onloadedmetadata = () => {
      window.URL.revokeObjectURL(video.src);
      resolve(video.duration);
    };
    
    video.onerror = () => {
      window.URL.revokeObjectURL(video.src);
      reject(new Error('Failed to load video metadata'));
    };
    
    video.src = URL.createObjectURL(file);
  });
}

/**
 * Compress a video file to target size
 * @param file - Original video file
 * @param targetSizeMB - Target size in MB (default: 4MB)
 * @param onProgress - Optional progress callback (0-100)
 * @returns Compressed video file
 */
export async function compressVideo(
  file: File,
  targetSizeMB: number = 4,
  onProgress?: (progress: number) => void
): Promise<File> {
  const targetSizeBytes = targetSizeMB * 1024 * 1024;
  
  // If file is already smaller than target, return original
  if (file.size <= targetSizeBytes) {
    console.log(`[Video Compression] File ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB) is already smaller than target ${targetSizeMB}MB, skipping compression`);
    return file;
  }

  console.log(`[Video Compression] Starting compression for ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB) to target ${targetSizeMB}MB`);

  try {
    const ffmpeg = await getFFmpeg();
    
    // Get video duration
    const duration = await getVideoDuration(file);
    if (!duration || duration <= 0) {
      throw new Error('Could not determine video duration');
    }

    // Set up progress handler
    if (onProgress) {
      ffmpeg.on('progress', ({ progress }) => {
        if (onProgress) {
          onProgress(Math.min(progress * 100, 99)); // Cap at 99% until final step
        }
      });
    }

    // Write input file to FFmpeg filesystem
    const inputFileName = 'input.' + file.name.split('.').pop();
    await ffmpeg.writeFile(inputFileName, await fetchFile(file));

    // Calculate target bitrate
    const targetBitrate = calculateTargetBitrate(targetSizeBytes, duration);
    const targetBitrateKbps = Math.floor(targetBitrate / 1000);

    // Output filename
    const outputFileName = 'output.mp4';

    // Compress video
    // Using H.264 codec with CRF (Constant Rate Factor) for quality
    // Lower CRF = higher quality, higher file size
    // We'll use a two-pass approach: first try with CRF, if still too large, reduce bitrate
    const crf = 28; // Good balance between quality and size
    
    await ffmpeg.exec([
      '-i', inputFileName,
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
      outputFileName
    ]);

    // Read compressed file
    const data = await ffmpeg.readFile(outputFileName);
    // Ensure data is a proper Uint8Array for Blob compatibility
    // Create a new Uint8Array to ensure proper type compatibility with Blob
    let uint8Array: Uint8Array;
    if (data instanceof Uint8Array) {
      // Create a new Uint8Array from the buffer to ensure proper type
      const buffer = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer;
      uint8Array = new Uint8Array(buffer);
    } else {
      // Handle other types - convert to Uint8Array
      if (typeof data === 'string') {
        // If it's a string (shouldn't happen for binary files, but handle it)
        const encoder = new TextEncoder();
        uint8Array = encoder.encode(data);
      } else {
        // Try to convert ArrayBuffer or ArrayLike to Uint8Array
        uint8Array = new Uint8Array(data as ArrayBuffer | ArrayLike<number>);
      }
    }
    const blob = new Blob([uint8Array as BlobPart], { type: 'video/mp4' });
    
    // Clean up FFmpeg filesystem
    await ffmpeg.deleteFile(inputFileName);
    await ffmpeg.deleteFile(outputFileName);

    // Create new File object with compressed data
    const compressedFileName = file.name.replace(/\.[^/.]+$/, '') + '-compressed.mp4';
    const compressedFile = new File([blob], compressedFileName, {
      type: 'video/mp4',
      lastModified: Date.now()
    });

    // If still too large, try more aggressive compression
    if (compressedFile.size > targetSizeBytes && compressedFile.size < file.size) {
      // Try again with lower bitrate
      const newBitrateKbps = Math.floor(targetBitrateKbps * 0.8);
      
      await ffmpeg.writeFile(inputFileName, await fetchFile(file));
      
      await ffmpeg.exec([
        '-i', inputFileName,
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
        outputFileName
      ]);

      const data2 = await ffmpeg.readFile(outputFileName);
      // Ensure data is a proper Uint8Array for Blob compatibility
      // Create a new Uint8Array to ensure proper type compatibility with Blob
      let uint8Array2: Uint8Array;
      if (data2 instanceof Uint8Array) {
        // Create a new Uint8Array from the buffer to ensure proper type
        const buffer = data2.buffer.slice(data2.byteOffset, data2.byteOffset + data2.byteLength) as ArrayBuffer;
        uint8Array2 = new Uint8Array(buffer);
      } else {
        // Handle other types - convert to Uint8Array
        if (typeof data2 === 'string') {
          // If it's a string (shouldn't happen for binary files, but handle it)
          const encoder = new TextEncoder();
          uint8Array2 = encoder.encode(data2);
        } else {
          // Try to convert ArrayBuffer or ArrayLike to Uint8Array
          uint8Array2 = new Uint8Array(data2 as ArrayBuffer | ArrayLike<number>);
        }
      }
      const blob2 = new Blob([uint8Array2 as BlobPart], { type: 'video/mp4' });
      
      await ffmpeg.deleteFile(inputFileName);
      await ffmpeg.deleteFile(outputFileName);

      const compressedFile2 = new File([blob2], compressedFileName, {
        type: 'video/mp4',
        lastModified: Date.now()
      });

      if (onProgress) {
        onProgress(100);
      }

      return compressedFile2;
    }

    if (onProgress) {
      onProgress(100);
    }

    return compressedFile;
  } catch (error) {
    console.error('Video compression error:', error);
    throw new Error(
      error instanceof Error 
        ? `Video compression failed: ${error.message}`
        : 'Video compression failed. Please try again or use a smaller video file.'
    );
  }
}

/**
 * Check if a file is a video file
 */
export function isVideoFile(file: File): boolean {
  return file.type.startsWith('video/') || 
         /\.(mp4|webm|mov|avi|mkv|flv|wmv|m4v)$/i.test(file.name);
}

/**
 * Format file size in bytes to human-readable string
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Get file size in MB
 */
export function getFileSizeMB(file: File): number {
  return file.size / (1024 * 1024);
}

