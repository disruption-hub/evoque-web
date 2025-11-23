import { prisma } from '@/lib/prisma';
import { S3Client } from '@aws-sdk/client-s3';
import { AwsConfiguration } from '@evoque/prisma';
import { unstable_cache } from 'next/cache';

let cachedConfig: AwsConfiguration | null = null;
let configCacheTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Helper function to convert BigInt values to strings for JSON serialization
function serializeBigInt<T extends Record<string, any>>(obj: T): T {
  const serialized = { ...obj };
  for (const key in serialized) {
    if (typeof serialized[key] === 'bigint') {
      serialized[key] = serialized[key].toString() as any;
    }
  }
  return serialized;
}

// Helper function to convert string values back to BigInt where needed
function deserializeBigInt(obj: Record<string, any>): AwsConfiguration {
  return {
    ...obj,
    maxFileSize: BigInt(obj.maxFileSize)
  } as AwsConfiguration;
}

// Helper function to create AwsConfiguration from environment variables
function getAwsConfigFromEnv(): AwsConfiguration | null {
  console.log('[S3 Config] Attempting to load from environment variables...');
  
  // Check for required environment variables
  const accessKeyId = process.env.NEXT_PUBLIC_S3_ACCESS_KEY_ID || process.env.S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.NEXT_PUBLIC_S3_SECRET_ACCESS_KEY || process.env.S3_SECRET_ACCESS_KEY;
  const bucketName = process.env.NEXT_PUBLIC_S3_BUCKET_NAME || process.env.S3_BUCKET_NAME;
  const region = process.env.NEXT_PUBLIC_S3_REGION || process.env.S3_REGION || 'us-east-1';
  
  console.log('[S3 Config] Environment variables check:', {
    hasAccessKeyId: !!accessKeyId,
    hasSecretAccessKey: !!secretAccessKey,
    hasBucketName: !!bucketName,
    region,
    accessKeyIdPrefix: accessKeyId ? `${accessKeyId.substring(0, 4)}...` : 'missing',
    bucketName,
    envVarsChecked: [
      'NEXT_PUBLIC_S3_ACCESS_KEY_ID',
      'S3_ACCESS_KEY_ID',
      'NEXT_PUBLIC_S3_SECRET_ACCESS_KEY',
      'S3_SECRET_ACCESS_KEY',
      'NEXT_PUBLIC_S3_BUCKET_NAME',
      'S3_BUCKET_NAME',
      'NEXT_PUBLIC_S3_REGION',
      'S3_REGION',
    ],
  });
  
  if (!accessKeyId || !secretAccessKey || !bucketName) {
    console.error('[S3 Config] Missing required environment variables:', {
      missingAccessKeyId: !accessKeyId,
      missingSecretAccessKey: !secretAccessKey,
      missingBucketName: !bucketName,
    });
    return null;
  }

  // Extract bucket name from URL prefix if provided
  let finalBucketName = bucketName;
  const urlPrefix = process.env.NEXT_PUBLIC_S3_URL_PREFIX || process.env.S3_URL_PREFIX;
  if (!finalBucketName && urlPrefix) {
    const match = urlPrefix.match(/https?:\/\/([^.]+)\.s3/);
    if (match) {
      finalBucketName = match[1];
    }
  }

  if (!finalBucketName) {
    return null;
  }

  // Create a minimal AwsConfiguration object from environment variables
  const config = {
    id: 'env-config',
    region,
    bucketName: finalBucketName,
    accessKeyId,
    secretAccessKey,
    urlPrefix: urlPrefix || `https://${finalBucketName}.s3.${region}.amazonaws.com`,
    isActive: true,
    maxFileSize: BigInt(52428800), // 50MB default
    allowedFileTypes: ['image/*', 'video/*', 'application/pdf', 'text/*'],
    folderStructure: 'uploads',
    enableCdn: false,
    cdnUrl: null,
    corsEnabled: true,
    corsOrigins: ['*'],
    versioningEnabled: false,
    enableEncryption: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdById: 'env',
    updatedById: 'env',
  } as AwsConfiguration;
  
  console.log('[S3 Config] Successfully created config from environment variables:', {
    id: config.id,
    region: config.region,
    bucketName: config.bucketName,
    urlPrefix: config.urlPrefix,
    hasAccessKeyId: !!config.accessKeyId,
    hasSecretAccessKey: !!config.secretAccessKey,
  });
  
  return config;
}

// Cached database query function that persists across serverless invocations
const getCachedAwsConfigFromDb = unstable_cache(
  async (): Promise<AwsConfiguration | null> => {
    console.log('[S3 Config] Attempting to load from database...');
    try {
      const hasDatabaseUrl = !!process.env.DATABASE_URL;
      console.log('[S3 Config] Database connection check:', {
        hasDatabaseUrl,
        databaseUrlPrefix: process.env.DATABASE_URL ? `${process.env.DATABASE_URL.substring(0, 20)}...` : 'missing',
      });
      
      const configuration = await prisma.awsConfiguration.findFirst({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' }
      });
      
      if (!configuration) {
        console.warn('[S3 Config] No active AWS configuration found in database');
        return null;
      }
      
      console.log('[S3 Config] Successfully loaded configuration from database:', {
        id: configuration.id,
        region: configuration.region,
        bucketName: configuration.bucketName,
        isActive: configuration.isActive,
      });
      
      // Serialize BigInt values to strings for caching
      return serializeBigInt(configuration) as any;
    } catch (error) {
      console.error('[S3 Config] Error fetching AWS configuration from database:', {
        error: error instanceof Error ? error.message : String(error),
        errorName: error instanceof Error ? error.name : undefined,
        stack: error instanceof Error ? error.stack : undefined,
        errorType: error?.constructor?.name,
      });
      return null;
    }
  },
  ['aws-configuration-active'],
  {
    revalidate: 300, // Cache for 5 minutes (300 seconds)
    tags: ['aws-configuration']
  }
);

export async function getAwsConfiguration(): Promise<AwsConfiguration | null> {
  const now = Date.now();
  
  // Return in-memory cached config if it's still valid (for same invocation)
  if (cachedConfig && (now - configCacheTime) < CACHE_DURATION) {
    console.log('[S3 Config] Using cached configuration (in-memory)');
    return cachedConfig;
  }

  console.log('[S3 Config] Loading fresh configuration...');

  // Try to get configuration from database first
  let configuration: AwsConfiguration | null = null;
  try {
    const dbConfig = await getCachedAwsConfigFromDb();
    if (dbConfig) {
      // Deserialize BigInt values back from strings
      configuration = deserializeBigInt(dbConfig);
      console.log('[S3 Config] Configuration loaded from database');
    } else {
      console.log('[S3 Config] No configuration found in database');
    }
  } catch (error) {
    console.warn('[S3 Config] Failed to fetch AWS configuration from database, trying environment variables:', {
      error: error instanceof Error ? error.message : String(error),
      errorName: error instanceof Error ? error.name : undefined,
    });
  }

  // Fallback to environment variables if database config is not available
  if (!configuration) {
    console.log('[S3 Config] Falling back to environment variables');
    configuration = getAwsConfigFromEnv();
    if (configuration) {
      console.log('[S3 Config] Configuration loaded from environment variables');
    }
  }

  if (!configuration) {
    console.error('[S3 Config] No AWS configuration available from database or environment variables');
    return null;
  }

  // Update in-memory cache
  cachedConfig = configuration;
  configCacheTime = now;

  console.log('[S3 Config] Configuration ready:', {
    source: configuration.id === 'env-config' ? 'environment-variables' : 'database',
    region: configuration.region,
    bucketName: configuration.bucketName,
  });

  return cachedConfig;
}

export function clearConfigCache(): void {
  cachedConfig = null;
  configCacheTime = 0;
}

export async function createS3Client(): Promise<{ client: S3Client | null; config: AwsConfiguration | null }> {
  try {
    const config = await getAwsConfiguration();
    
    if (!config) {
      return { client: null, config: null };
    }
    
    const client = new S3Client({
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      }
    });

    return { client, config };
    
  } catch (_error) {
    return { client: null, config: null };
  }
}

export function getFileUrl(s3Key: string, config: AwsConfiguration): string {
  // Use CDN URL if enabled, otherwise use S3 URL
  if (config.enableCdn && config.cdnUrl) {
    return `${config.cdnUrl}/${s3Key}`;
  }

  // Use custom URL prefix if provided
  if (config.urlPrefix) {
    return `${config.urlPrefix}/${s3Key}`;
  }

  // Default S3 URL
  return `https://${config.bucketName}.s3.${config.region}.amazonaws.com/${s3Key}`;
}

export function getPreviewUrl(s3Key: string): string {
  // Use API route for preview with view=true parameter
  return `/api/media/download?key=${encodeURIComponent(s3Key)}&view=true`;
}

export function isFileTypeAllowed(fileType: string, config: AwsConfiguration): boolean {
  if (!config.allowedFileTypes || config.allowedFileTypes.length === 0) {
    return true; // Allow all if no restrictions
  }

  return config.allowedFileTypes.some(allowedType => {
    if (allowedType.endsWith('/*')) {
      // Wildcard match (e.g., "image/*" matches "image/jpeg")
      const prefix = allowedType.slice(0, -1);
      return fileType.startsWith(prefix);
    }
    return fileType === allowedType;
  });
}

export function getMaxFileSize(config: AwsConfiguration): number {
  return Number(config.maxFileSize);
}

export function getFolderStructure(config: AwsConfiguration): string {
  return config.folderStructure || 'uploads';
}
