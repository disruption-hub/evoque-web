import { S3Client, ListObjectsV2Command, HeadObjectCommand, DeleteObjectCommand, CopyObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { prisma } from '@/lib/prisma';
import { createS3Client, getFileUrl, getPreviewUrl, clearConfigCache } from './databaseConfig';
import type { AwsConfiguration, MediaFile, Prisma } from '@evoque/prisma';

// Global S3 client and config (will be initialized when needed)
let s3Client: S3Client | null = null;
let s3Config: AwsConfiguration | null = null;

export interface S3MediaFile {
  id: string;
  title: string;
  fileName: string;
  fileUrl: string;
  s3Key: string;
  fileSize: number;
  fileType: string;
  folder: string;
  altText?: string;
  description?: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  uploadedById: string;
  lastModified: string;
  etag: string;
  storageClass?: string;
}

export class S3MediaService {
  private bucketName: string;
  private s3Client: S3Client | null;

  constructor() {
    this.bucketName = '';
    this.s3Client = null;
  }

  // Initialize S3 client and config from database
  private async initializeS3() {
    if (!s3Client || !s3Config) {
      const { client, config } = await createS3Client();
      
      if (!client || !config) {
        console.error('[S3Service] Failed to create S3 client or config');
        throw new Error('S3 not configured - please configure S3 settings in the admin panel');
      }
      
      s3Client = client;
      s3Config = config;
      this.bucketName = config.bucketName;
      this.s3Client = client;
    } else {
      // Ensure bucket name is set even if client/config are cached
      if (!this.bucketName && s3Config) {
        this.bucketName = s3Config.bucketName;
      }
    }
  }

  // Get all objects from S3
  async listS3Objects(options: {
    prefix?: string;
    maxKeys?: number;
    continuationToken?: string;
    getAllPages?: boolean; // If true, fetch all pages automatically
  } = {}): Promise<{
    objects: Array<{
      Key?: string;
      Size?: number;
      LastModified?: Date;
      ETag?: string;
      StorageClass?: string;
    }>;
    isTruncated: boolean;
    nextContinuationToken?: string;
  }> {
    try {
      await this.initializeS3();
      
      if (!this.s3Client || !this.bucketName) {
        throw new Error('S3 not configured');
      }

      const allObjects: Array<{
        Key?: string;
        Size?: number;
        LastModified?: Date;
        ETag?: string;
        StorageClass?: string;
      }> = [];
      
      let continuationToken = options.continuationToken;
      let isTruncated = true;

      // Fetch all pages if getAllPages is true
      while (isTruncated) {
        const command = new ListObjectsV2Command({
          Bucket: this.bucketName,
          Prefix: options.prefix || '',
          MaxKeys: options.maxKeys || 1000,
          ContinuationToken: continuationToken,
        });

        const response = await this.s3Client.send(command);
        
        if (response.Contents) {
          allObjects.push(...response.Contents);
        }
        
        isTruncated = response.IsTruncated || false;
        continuationToken = response.NextContinuationToken;

        // If getAllPages is false, only fetch one page
        if (!options.getAllPages) {
          break;
        }
      }
      
      return {
        objects: allObjects,
        isTruncated: isTruncated,
        nextContinuationToken: continuationToken,
      };
    } catch (error) {
      console.error('[S3Service] Error listing S3 objects:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to list S3 objects: ${errorMessage}`);
    }
  }

  // Get object metadata from S3
  async getObjectMetadata(s3Key: string): Promise<{
    ContentType?: string;
    Metadata?: Record<string, string>;
  } | null> {
    try {
      await this.initializeS3();
      
      if (!this.s3Client || !this.bucketName) {
        throw new Error('S3 not configured');
      }

      const command = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: s3Key,
      });

      const response = await this.s3Client.send(command);
      return response;
    } catch (_error) {
      return null;
    }
  }

  // Delete file from S3
  async deleteFile(s3Key: string): Promise<boolean> {
    try {
      await this.initializeS3();
      
      if (!this.s3Client || !this.bucketName) {
        throw new Error('S3 not configured');
      }

      if (!s3Key) {
        throw new Error('S3 key is required');
      }

      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: s3Key,
      });

      await this.s3Client.send(command);
      return true;
    } catch (error) {
      console.error('[S3Service] Error deleting file from S3:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to delete file from S3: ${errorMessage}`);
    }
  }

  // Copy/move file in S3
  async moveFile(sourceKey: string, destinationKey: string, deleteSource: boolean = true): Promise<boolean> {
    try {
      await this.initializeS3();
      
      if (!this.s3Client || !this.bucketName) {
        throw new Error('S3 not configured');
      }

      if (!sourceKey || !destinationKey) {
        throw new Error('Source and destination keys are required');
      }

      if (sourceKey === destinationKey) {
        // No move needed
        return true;
      }

      // Get object metadata first
      const headCommand = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: sourceKey,
      });
      const headResponse = await this.s3Client.send(headCommand);

      // Copy object to new location
      const copyCommand = new CopyObjectCommand({
        Bucket: this.bucketName,
        CopySource: `${this.bucketName}/${sourceKey}`,
        Key: destinationKey,
        ContentType: headResponse.ContentType,
        Metadata: headResponse.Metadata,
        MetadataDirective: 'COPY',
      });

      await this.s3Client.send(copyCommand);

      // Delete source if requested
      if (deleteSource) {
        await this.deleteFile(sourceKey);
      }

      return true;
    } catch (error) {
      console.error('[S3Service] Error moving file in S3:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to move file in S3: ${errorMessage}`);
    }
  }

  // Convert S3 object to MediaFile format
  async s3ObjectToMediaFile(s3Object: {
    Key?: string;
    Size?: number;
    LastModified?: Date;
    ETag?: string;
    StorageClass?: string;
  }, userId?: string): Promise<S3MediaFile | null> {
    try {
      const s3Key = s3Object.Key;
      if (!s3Key) {
        return null;
      }

      const fileSize = s3Object.Size || 0;
      const lastModified = s3Object.LastModified?.toISOString() || new Date().toISOString();
      const etag = s3Object.ETag?.replace(/"/g, '') || '';

      // Extract filename and folder from S3 key
      const keyParts = s3Key.split('/');
      const fileName = keyParts[keyParts.length - 1];
      const folder = keyParts.length > 1 ? keyParts.slice(0, -1).join('/') : '';

      // Get additional metadata
      const metadata = await this.getObjectMetadata(s3Key);
      const contentType = metadata?.ContentType || 'application/octet-stream';
      
      // Extract original filename from metadata if available
      const originalName = metadata?.Metadata?.originalName || fileName;

      // Generate preview URL using API route for admin interface
      const fileUrl = getPreviewUrl(s3Key);

      // Get the user if userId is provided, otherwise use a default system user
      let user = null;
      if (userId) {
        user = await prisma.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        });
      }
      
      // If no user found, try to find the original uploader from existing record
      if (!user) {
        const existingRecord = await prisma.mediaFile.findUnique({
          where: { s3Key },
          include: {
            uploadedBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        });
        
        if (existingRecord?.uploadedBy) {
          user = existingRecord.uploadedBy;
        }
      }
      
      // If still no user, create a system user record
      if (!user) {
        user = {
          id: 'system',
          firstName: 'System',
          lastName: 'User',
          email: 'system@example.com'
        };
      }

      // Use upsert to create or update the database record
      const dbRecord = await prisma.mediaFile.upsert({
        where: { s3Key },
        update: {
          fileSize: BigInt(fileSize),
          fileType: contentType,
          fileUrl,
          updatedAt: new Date()
        },
        create: {
          title: originalName.split('.')[0], // Remove extension for title
          fileName: originalName,
          fileUrl,
          s3Key,
          fileSize: BigInt(fileSize),
          fileType: contentType,
          folder: folder || null,
          isPublic: true,
          uploadedById: user.id
        },
        include: {
          uploadedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      });

      return {
        id: dbRecord.id,
        title: dbRecord.title,
        fileName: dbRecord.fileName,
        fileUrl: dbRecord.fileUrl,
        s3Key: dbRecord.s3Key,
        fileSize: Number(dbRecord.fileSize),
        fileType: dbRecord.fileType,
        folder: dbRecord.folder || '',
        altText: dbRecord.altText || undefined,
        description: dbRecord.description || undefined,
        isPublic: dbRecord.isPublic,
        createdAt: dbRecord.createdAt.toISOString(),
        updatedAt: dbRecord.updatedAt.toISOString(),
        uploadedById: dbRecord.uploadedById,
        lastModified,
        etag,
        storageClass: s3Object.StorageClass
      };
    } catch (_error) {
      return null;
    }
  }

  // Get all media files from S3 (optimized version)
  async getAllMediaFiles(options: {
    folder?: string;
    fileType?: string;
    search?: string;
    page?: number;
    limit?: number;
    userId: string;
  }): Promise<{
    mediaFiles: S3MediaFile[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> {
    try {
      const { folder, fileType, search, page = 1, limit = 20 } = options;
      const offset = (page - 1) * limit;

      // Note: We no longer filter by user - showing all media files

      // Build database query conditions
      const whereConditions: Record<string, unknown> = {};
      
      if (folder) {
        whereConditions.folder = folder;
      } else if (folder === '') {
        whereConditions.OR = [
          { folder: null },
          { folder: '' }
        ];
      }

      // Handle search and file type conditions
      const additionalConditions: Prisma.MediaFileWhereInput[] = [];
      
      if (search) {
        additionalConditions.push({
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { fileName: { contains: search, mode: 'insensitive' } }
          ]
        });
      }

      if (fileType) {
        const typeConditions: Record<string, unknown>[] = [];
        switch (fileType) {
          case 'image':
            typeConditions.push({ fileType: { startsWith: 'image/' } });
            break;
          case 'video':
            typeConditions.push({ fileType: { startsWith: 'video/' } });
            break;
          case 'audio':
            typeConditions.push({ fileType: { startsWith: 'audio/' } });
            break;
          case 'document':
            typeConditions.push(
              { fileType: { contains: 'pdf' } },
              { fileType: { contains: 'document' } },
              { fileType: { contains: 'text' } }
            );
            break;
          case 'archive':
            typeConditions.push(
              { fileType: { contains: 'zip' } },
              { fileType: { contains: 'rar' } },
              { fileType: { contains: 'tar' } }
            );
            break;
        }
        
        if (typeConditions.length > 0) {
          additionalConditions.push({ OR: typeConditions });
        }
      }
      
      // Add additional conditions if any
      if (additionalConditions.length > 0) {
        whereConditions.AND = additionalConditions;
      }

      // Get total count for pagination
      const total = await prisma.mediaFile.count({
        where: whereConditions
      });

      // Get paginated results from database
      const dbFiles = await prisma.mediaFile.findMany({
        where: whereConditions,
        include: {
          uploadedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit
      });

      // Convert database records to S3MediaFile format
      const mediaFiles: S3MediaFile[] = dbFiles.map((file: MediaFile & { uploadedById: string }) => ({
        id: file.id,
        title: file.title,
        fileName: file.fileName,
        fileUrl: file.fileUrl,
        s3Key: file.s3Key,
        fileSize: Number(file.fileSize),
        fileType: file.fileType,
        folder: file.folder || '',
        altText: file.altText || undefined,
        description: file.description || undefined,
        isPublic: file.isPublic,
        createdAt: (file.createdAt as Date).toISOString(),
        updatedAt: (file.updatedAt as Date).toISOString(),
        uploadedById: file.uploadedById,
        lastModified: (file.updatedAt as Date).toISOString(),
        etag: '', // Not available from database
        storageClass: undefined // Not available from database
      }));

      const result = {
        mediaFiles,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };

      return result;
    } catch (error) {
      console.error('[S3Service] Error in getAllMediaFiles:', error);
      throw new Error('Failed to get media files from S3');
    }
  }

  // Get folders from database (optimized version)
  async getFolders(): Promise<Array<{ folder: string; count: number; name: string }>> {
    try {
      // Get folder counts from database
      const folderStats = await prisma.mediaFile.groupBy({
        by: ['folder'],
        _count: {
          id: true
        },
        orderBy: {
          folder: 'asc'
        }
      });

      // Convert to array format
      const folders = folderStats.map((stat: { folder: string | null; _count: { id: number } }) => ({
        folder: stat.folder || '',
        count: stat._count.id,
        name: stat.folder || 'Root'
      }));

      return folders;
    } catch (_error) {
      throw new Error('Failed to get folders from database');
    }
  }

  // Sync S3 with database
  async syncWithDatabase(userId?: string, onProgress?: (current: number, total: number) => void): Promise<{
    synced: number;
    created: number;
    updated: number;
    deleted: number;
  }> {
    try {
      // Initialize S3 first to ensure bucket name is set
      await this.initializeS3();
      
      console.log('[S3Service] Starting sync with database...');
      console.log('[S3Service] Bucket name:', this.bucketName);
      console.log('[S3Service] Region:', s3Config?.region);
      console.log('[S3Service] User ID:', userId || 'not provided');
      
      // Fetch all pages of S3 objects
      const { objects } = await this.listS3Objects({ getAllPages: true });
      
      console.log('[S3Service] Found', objects.length, 'objects in S3');
      
      if (objects.length === 0) {
        console.warn('[S3Service] No objects found in S3 bucket. Make sure files are uploaded to S3 first.');
      }
      
      let synced = 0;
      let created = 0;
      let updated = 0;
      let deleted = 0;
      
      // Report initial progress
      if (onProgress) {
        onProgress(0, objects.length);
      }

      // Get all S3 keys that exist (filter out folders)
      const s3Keys = new Set<string>();
      const skippedFolders: string[] = [];
      for (const s3Object of objects) {
        if (!s3Object.Key) continue;
        // Skip folder markers (keys ending with /)
        if (s3Object.Key.endsWith('/')) {
          skippedFolders.push(s3Object.Key);
          continue;
        }
        s3Keys.add(s3Object.Key);
      }
      
      console.log('[S3Service] Valid file keys:', s3Keys.size);
      console.log('[S3Service] Skipped folders:', skippedFolders.length);
      if (s3Keys.size === 0 && objects.length > 0) {
        console.warn('[S3Service] Warning: Found objects but no valid file keys. Sample keys:', objects.slice(0, 5).map(o => o.Key));
      }
      

      // Get all database records with S3 keys
      const dbRecords = await prisma.mediaFile.findMany({
        select: {
          id: true,
          s3Key: true
        }
      });

      // Delete database records for files that no longer exist in S3
      for (const dbRecord of dbRecords) {
        if (dbRecord.s3Key && !s3Keys.has(dbRecord.s3Key)) {
          await prisma.mediaFile.delete({
            where: { id: dbRecord.id }
          });
          deleted++;
        }
      }
      

      // Add/update records for files that exist in S3
      for (let i = 0; i < objects.length; i++) {
        const s3Object = objects[i];
        
        // Skip objects without keys or folders (ending with /)
        if (!s3Object.Key) {
          continue;
        }
        
        if (s3Object.Key.endsWith('/')) {
          continue;
        }

        const s3Key = s3Object.Key;
        const fileSize = s3Object.Size || 0;
        const lastModified = s3Object.LastModified || new Date();
        
        // Report progress
        if (onProgress) {
          onProgress(i + 1, objects.length);
        }

        // Get metadata
        const metadata = await this.getObjectMetadata(s3Key);
        const contentType = metadata?.ContentType || 'application/octet-stream';
        const keyParts = s3Key.split('/');
        const fileName = keyParts[keyParts.length - 1];
        const folder = keyParts.length > 1 ? keyParts.slice(0, -1).join('/') : '';
        const originalName = metadata?.Metadata?.originalName || fileName;


        // Get the user if userId is provided, otherwise use a default system user
        let user = null;
        if (userId) {
          user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          });
        }
        
        // If no user found, try to find the original uploader from existing record
        if (!user) {
          const existingRecord = await prisma.mediaFile.findUnique({
            where: { s3Key },
            include: {
              uploadedBy: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true
                }
              }
            }
          });
          
          if (existingRecord?.uploadedBy) {
            user = existingRecord.uploadedBy;
          }
        }
        
        // If still no user, try to find or use the first admin user
        if (!user) {
          const adminUser = await prisma.user.findFirst({
            where: {
              role: {
                name: {
                  in: ['super_admin', 'Admin']
                }
              },
              isActive: true
            },
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          });
          
          if (adminUser) {
            user = adminUser;
          } else {
            // Last resort: use the provided userId if available, otherwise throw error
            if (userId) {
              throw new Error(`User with ID ${userId} not found and no admin user available`);
            }
            throw new Error('No user available for media sync. Please ensure you are authenticated.');
          }
        }

        const fileUrl = s3Config ? getFileUrl(s3Key, s3Config) : `https://${this.bucketName}.s3.amazonaws.com/${s3Key}`;

        // Check if record exists to determine if it's new or updated
        const existingDbRecord = await prisma.mediaFile.findUnique({
          where: { s3Key }
        });

        const isNewRecord = !existingDbRecord;

        // Use upsert to create or update the record
        await prisma.mediaFile.upsert({
          where: { s3Key },
          update: {
            fileSize: BigInt(fileSize),
            fileType: contentType,
            fileUrl,
            updatedAt: lastModified
          },
          create: {
            title: originalName.split('.')[0],
            fileName: originalName,
            fileUrl,
            s3Key,
            fileSize: BigInt(fileSize),
            fileType: contentType,
            folder,
            isPublic: true,
            uploadedById: user.id
          }
        });

        if (isNewRecord) {
          created++;
        } else {
          updated++;
        }

        synced++;
      }

      console.log('[S3Service] Sync completed:', { synced, created, updated, deleted });
      return { synced, created, updated, deleted };
    } catch (error) {
      console.error('[S3Service] Error syncing S3 with database:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to sync S3 with database: ${errorMessage}`);
    }
  }

  // Check if S3 is properly configured
  async isConfigured(): Promise<boolean> {
    try {
      await this.initializeS3();
      const configured = !!(s3Config && s3Config.isActive);
      return configured;
    } catch (error) {
      console.error('[S3Service] Error checking S3 configuration:', error);
      return false;
    }
  }

  // Get S3 configuration status
  async getConfigurationStatus(): Promise<{
    configured: boolean;
    bucketName: string;
    region: string;
    hasCredentials: boolean;
    isActive: boolean;
  }> {
    try {
      await this.initializeS3();
      
      return {
        configured: !!(s3Config && s3Config.isActive),
        bucketName: s3Config?.bucketName || '',
        region: s3Config?.region || 'us-east-1',
        hasCredentials: !!(s3Config?.accessKeyId && s3Config?.secretAccessKey),
        isActive: s3Config?.isActive || false
      };
    } catch (_error) {
      return {
        configured: false,
        bucketName: '',
        region: 'us-east-1',
        hasCredentials: false,
        isActive: false
      };
    }
  }

  // Get total count of files in S3
  async getTotalFileCount(): Promise<number> {
    try {
      const { client: s3Client, config: s3Config } = await createS3Client();
      
      if (!s3Client || !s3Config) {
        throw new Error('S3 client not configured');
      }

      const listCommand = new ListObjectsV2Command({
        Bucket: s3Config.bucketName,
        MaxKeys: 1000 // AWS limit for single request
      });

      let totalCount = 0;
      let continuationToken: string | undefined;

      do {
        if (continuationToken) {
          listCommand.input.ContinuationToken = continuationToken;
        }

        const response = await s3Client.send(listCommand);
        
        if (response.Contents) {
          totalCount += response.Contents.length;
        }

        continuationToken = response.NextContinuationToken;
      } while (continuationToken);

      return totalCount;
    } catch (error) {
      console.error('Error getting total file count from S3:', error);
      return 0;
    }
  }

  // Clear configuration cache (useful when config is updated)
  clearCache(): void {
    clearConfigCache();
    s3Client = null;
    s3Config = null;
    this.bucketName = '';
    this.s3Client = null;
  }
}

// Export singleton instance
export const s3MediaService = new S3MediaService();

