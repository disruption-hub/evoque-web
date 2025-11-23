'use client';

// Force dynamic rendering to avoid build-time Prisma issues

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Image, Upload, Trash2, Eye, Folder, LayoutGrid, List, Cloud, CheckCircle, ArrowRight, ExternalLink, RefreshCw, MoreVertical, Move, X, AlertTriangle, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { usePageActions } from '@/contexts/PageActionsContext';
import { useSearch } from '@/contexts/SearchContext';
import S3FilePreview from '@/components/shared/S3FilePreview';
import apiClient from '@/lib/api-client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { isVideoFile, formatFileSize as formatFileSizeUtil, getFileSizeMB } from '@/lib/video-compression';

interface MediaFile {
  id: string;
  title: string;
  fileName: string;
  fileUrl: string;
  s3Key?: string;
  fileSize: number;
  fileType: string;
  folder: string | null;
  altText: string | null;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  lastModified?: string;
  uploadedBy?: {
    firstName: string;
    lastName: string;
  };
}

interface MediaStats {
  totalFiles: number;
  totalImages: number;
  totalVideos: number;
  totalDocuments: number;
  totalSize: number;
  storageUsed: number;
  recentUploads: number;
  filesByType: Record<string, number>;
}

interface AwsConfiguration {
  id: string;
  bucketName: string;
  region: string;
  isActive: boolean;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export default function MediaPage() {
  const router = useRouter();
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [stats, setStats] = useState<MediaStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [folderFilter, setFolderFilter] = useState<string>('all');
  const [awsConfig, setAwsConfig] = useState<AwsConfiguration | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [sortField, setSortField] = useState<string>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<string>('');
  const [newFolderName, setNewFolderName] = useState<string>('');
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  // Upload flow states
  const [uploadStep, setUploadStep] = useState<'select' | 'confirm' | 'uploading' | 'complete'>('select');
  const [selectedFilesToUpload, setSelectedFilesToUpload] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<{ file: File; progress: number; status: 'pending' | 'uploading' | 'success' | 'error' }[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [showMoveDialog, setShowMoveDialog] = useState(false);
  const [moveFileId, setMoveFileId] = useState<string | null>(null);
  const [moveToFolder, setMoveToFolder] = useState<string>('');
  const [showNewMoveFolderInput, setShowNewMoveFolderInput] = useState(false);
  const [newMoveFolderName, setNewMoveFolderName] = useState<string>('');
  // Rename dialog state
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [renameFileId, setRenameFileId] = useState<string | null>(null);
  const [newFileName, setNewFileName] = useState<string>('');
  // Compression state management
  // Maps use original file key (before compression) as the key
  const [compressingFiles, setCompressingFiles] = useState<Map<string, boolean>>(new Map());
  const [compressedFiles, setCompressedFiles] = useState<Map<string, File>>(new Map());
  const [compressionProgress, setCompressionProgress] = useState<Map<string, number>>(new Map());
  const [originalFileSizes, setOriginalFileSizes] = useState<Map<string, number>>(new Map());
  const [fileKeyMap, setFileKeyMap] = useState<Map<number, string>>(new Map()); // Maps array index to original file key
  const { setActions, clearActions } = usePageActions();
  const { searchTerm: search, setPlaceholder } = useSearch();
  const { toast } = useToast();

  // Constants
  const VERCEL_MAX_SIZE = 4.5 * 1024 * 1024; // 4.5MB in bytes
  const TARGET_COMPRESSED_SIZE = 4 * 1024 * 1024; // 4MB target to stay under limit

  // Helper function to convert s3Key to API download URL
  const getPreviewUrl = (file: MediaFile): string => {
    if (file.s3Key) {
      return `/api/media/download?key=${encodeURIComponent(file.s3Key)}&view=true`;
    }
    // Fallback to fileUrl if s3Key is not available
    return file.fileUrl;
  };

  useEffect(() => {
    checkAwsConfiguration();
  }, []);

  useEffect(() => {
    if (awsConfig) {
      fetchMedia(1, false);
      fetchStats();
    }
  }, [awsConfig]);

  // Refetch when filters change
  useEffect(() => {
    if (awsConfig) {
      fetchMedia(1, false);
    }
  }, [typeFilter, folderFilter, search]);

  // Show/hide bulk actions based on selection
  useEffect(() => {
    setShowBulkActions(selectedFiles.size > 0);
  }, [selectedFiles]);

  // Set search placeholder
  useEffect(() => {
    setPlaceholder('Search files...');
  }, [setPlaceholder]);

  // Register page actions
  useEffect(() => {
    if (showOnboarding) {
      setActions([
        {
          id: 'configure',
          label: 'Configure S3',
          icon: <Cloud className="h-4 w-4 mr-2" />,
          variant: 'default',
          onClick: handleGoToSettings,
        },
      ]);
    } else {
      setActions([
        {
          id: 'refresh',
          label: 'Refresh',
          icon: <RefreshCw className="h-4 w-4 mr-2" />,
          variant: 'outline',
          onClick: () => {
            fetchMedia(1, false);
            fetchStats();
          },
        },
        {
          id: 'upload',
          label: 'Upload Files',
          icon: <Upload className="h-4 w-4 mr-2" />,
          variant: 'default',
          onClick: () => setShowUploadModal(true),
        },
      ]);
    }

    return () => clearActions();
  }, [showOnboarding, viewMode, clearActions]);

  const checkAwsConfiguration = async () => {
    try {
      const data = await apiClient.get<{ success: boolean; data: AwsConfiguration[] }>('/admin/configuration/aws');
      
      if (data.success && data.data && data.data.length > 0) {
        const activeConfig = data.data.find(config => config.isActive) || data.data[0];
        if (activeConfig) {
          setAwsConfig({
            id: activeConfig.id,
            bucketName: activeConfig.bucketName,
            region: activeConfig.region,
            isActive: activeConfig.isActive,
          });
        } else {
          setShowOnboarding(true);
        }
      } else {
        setShowOnboarding(true);
      }
    } catch (error) {
      console.error('Error checking AWS configuration:', error);
      setShowOnboarding(true);
    } finally {
      setLoading(false);
    }
  };

  const handleGoToSettings = () => {
    router.push('/admin/configuration');
  };

  const fetchMedia = async (page: number = 1, append: boolean = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(typeFilter !== 'all' && { fileType: typeFilter }),
        ...(folderFilter !== 'all' && { folder: folderFilter }),
        ...(search && { search })
      });
      
      const data = await apiClient.get<{ mediaFiles: MediaFile[]; pagination: PaginationInfo }>(`/admin/media?${params}`);

      if (data.mediaFiles) {
        if (append) {
          setFiles(prev => [...prev, ...data.mediaFiles]);
        } else {
          setFiles(data.mediaFiles);
        }
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error fetching media:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const fetchStats = async () => {
    try {
      // Calculate stats from files
      const allFiles = files.length > 0 ? files : await (async () => {
        const data = await apiClient.get<{ mediaFiles: MediaFile[]; pagination: PaginationInfo }>('/admin/media?page=1&limit=1000');
        return data.mediaFiles || [];
      })();

      const totalFiles = allFiles.length;
      const totalImages = allFiles.filter(f => f.fileType.startsWith('image/')).length;
      const totalVideos = allFiles.filter(f => f.fileType.startsWith('video/')).length;
      const totalDocuments = allFiles.filter(f => f.fileType.includes('pdf') || f.fileType.includes('document')).length;
      const totalSize = allFiles.reduce((sum, f) => sum + f.fileSize, 0);

      setStats({
        totalFiles,
        totalImages,
        totalVideos,
        totalDocuments,
        totalSize,
        storageUsed: totalSize,
        recentUploads: 0,
        filesByType: {},
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this file?')) return;

    try {
      // Delete from both database and S3 (default behavior)
      await apiClient.delete(`/admin/media/${id}?deleteFrom=both`);
      
      // Remove the deleted file from the current list
      setFiles(prev => prev.filter(file => file.id !== id));
      // Update pagination total
      if (pagination) {
        setPagination(prev => prev ? { ...prev, total: prev.total - 1 } : null);
      }
      fetchStats();
    } catch (error: any) {
      console.error('Error deleting file:', error);
      const errorMessage = error?.response?.data?.error || error?.message || 'Failed to delete file';
      alert(`Failed to delete file: ${errorMessage}`);
    }
  };

  const handleLoadMore = () => {
    if (pagination && pagination.page < pagination.pages) {
      fetchMedia(pagination.page + 1, true);
    }
  };

  // Bulk selection functions
  const handleSelectFile = (fileId: string) => {
    setSelectedFiles(prev => {
      const newSet = new Set(prev);
      if (newSet.has(fileId)) {
        newSet.delete(fileId);
      } else {
        newSet.add(fileId);
      }
      return newSet;
    });
  };

  const handleBulkDelete = async () => {
    if (selectedFiles.size === 0) return;
    
    if (!confirm(`Are you sure you want to delete ${selectedFiles.size} file(s)?`)) return;

    try {
      // Delete all selected files from both database and S3
      const deletePromises = Array.from(selectedFiles).map(id => 
        apiClient.delete(`/admin/media/${id}?deleteFrom=both`).catch(error => {
          console.error(`Error deleting file ${id}:`, error);
          return { id, error };
        })
      );
      
      const results = await Promise.all(deletePromises);
      
      // Check for any failures
      const failures = results.filter((result): result is { id: string; error: any } => 
        result !== null && typeof result === 'object' && 'error' in result
      );
      const successCount = results.length - failures.length;
      
      if (failures.length > 0) {
        console.error('Some files failed to delete:', failures);
        if (successCount === 0) {
          alert(`Failed to delete all files. Please try again.`);
          return;
        } else {
          alert(`Successfully deleted ${successCount} file(s), but ${failures.length} file(s) failed to delete.`);
        }
      }
      
      // Remove successfully deleted files from current list
      const deletedIds = new Set(selectedFiles);
      setFiles(prev => prev.filter(file => !deletedIds.has(file.id)));
      
      // Update pagination total
      if (pagination) {
        setPagination(prev => prev ? { ...prev, total: prev.total - successCount } : null);
      }
      
      // Clear selection and hide bulk actions
      setSelectedFiles(new Set());
      setShowBulkActions(false);
      
      // Refresh stats
      fetchStats();
    } catch (error: any) {
      console.error('Error deleting files:', error);
      const errorMessage = error?.response?.data?.error || error?.message || 'Failed to delete files';
      alert(`Failed to delete files: ${errorMessage}`);
    }
  };

  // Handle move file to folder
  const handleMoveFile = async () => {
    if (!moveFileId) return;

    try {
      const folderToUse = showNewMoveFolderInput && newMoveFolderName.trim() 
        ? newMoveFolderName.trim() 
        : moveToFolder || null;

      await apiClient.patch(`/admin/media/${moveFileId}`, { folder: folderToUse });
      
      toast({
        title: 'File moved successfully',
        description: `File moved to ${folderToUse || 'Root'}.`,
      });

      setShowMoveDialog(false);
      setMoveFileId(null);
      setMoveToFolder('');
      setNewMoveFolderName('');
      setShowNewMoveFolderInput(false);
      fetchMedia(1, false);
      fetchStats();
    } catch (error: any) {
      console.error('Error moving file:', error);
      const errorMessage = error?.response?.data?.error || error?.message || 'Failed to move file';
      toast({
        title: 'Move failed',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  // Handle rename file
  const handleRenameFile = async () => {
    if (!renameFileId || !newFileName.trim()) return;

    try {
      await apiClient.patch(`/admin/media/${renameFileId}`, { fileName: newFileName.trim() });
      
      toast({
        title: 'File renamed successfully',
        description: `File renamed to ${newFileName.trim()}.`,
      });

      setShowRenameDialog(false);
      setRenameFileId(null);
      setNewFileName('');
      fetchMedia(1, false);
      fetchStats();
    } catch (error: any) {
      console.error('Error renaming file:', error);
      const errorMessage = error?.response?.data?.error || error?.message || 'Failed to rename file';
      toast({
        title: 'Rename failed',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      // Check if click is outside any menu button or menu
      if (openMenuId && !target.closest('[data-menu-id]') && !target.closest('[data-menu-container]')) {
        setOpenMenuId(null);
      }
    };

    if (openMenuId) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [openMenuId]);

  // Drag and drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const filesArray = Array.from(e.dataTransfer.files);
      setSelectedFilesToUpload(filesArray);
      setUploadStep('confirm');
      setUploadError(null);
      // Clear compression state when new files are selected
      setCompressedFiles(new Map());
      setCompressingFiles(new Map());
      setCompressionProgress(new Map());
      setOriginalFileSizes(new Map());
      // Initialize file key map for new files
      const newFileKeyMap = new Map<number, string>();
      filesArray.forEach((file, index) => {
        newFileKeyMap.set(index, getFileKey(file));
      });
      setFileKeyMap(newFileKeyMap);
    }
  };

  // Helper function to format file size
  const formatFileSize = (bytes: number): string => {
    return formatFileSizeUtil(bytes);
  };

  // Helper function to check if file exceeds Vercel limit
  const exceedsVercelLimit = (file: File): boolean => {
    return file.size > VERCEL_MAX_SIZE;
  };

  // Helper function to get file key for tracking (using name + size as unique identifier)
  const getFileKey = (file: File): string => {
    return `${file.name}-${file.size}`;
  };

  // Helper function to check if file is an image
  const isImageFile = (file: File): boolean => {
    return file.type.startsWith('image/');
  };

  // Client-side image compression using Canvas API
  const compressImage = async (file: File, targetSizeMB: number = 4): Promise<File> => {
    const targetSizeBytes = targetSizeMB * 1024 * 1024;
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = document.createElement('img');
        img.onload = () => {
          // Calculate dimensions to fit within target size
          // Start with original dimensions and reduce quality/size iteratively
          let quality = 0.9;
          let width = img.width;
          let height = img.height;
          const maxDimension = 1920; // Max width or height
          
          // Scale down if too large
          if (width > maxDimension || height > maxDimension) {
            const ratio = Math.min(maxDimension / width, maxDimension / height);
            width = Math.floor(width * ratio);
            height = Math.floor(height * ratio);
          }
          
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            reject(new Error('Could not get canvas context'));
            return;
          }
          
          // Draw image to canvas
          ctx.drawImage(img, 0, 0, width, height);
          
          // Try different quality levels until we get under target size
          const tryCompress = (q: number): void => {
            canvas.toBlob(
              (blob) => {
                if (!blob) {
                  reject(new Error('Failed to compress image'));
                  return;
                }
                
                // If still too large and quality can be reduced further, try again
                if (blob.size > targetSizeBytes && q > 0.1) {
                  tryCompress(Math.max(0.1, q - 0.1));
                } else {
                  // Create new file from compressed blob
                  const compressedFile = new File(
                    [blob],
                    file.name.replace(/\.[^/.]+$/, '') + '-compressed.' + file.name.split('.').pop(),
                    {
                      type: file.type,
                      lastModified: Date.now()
                    }
                  );
                  resolve(compressedFile);
                }
              },
              file.type,
              q
            );
          };
          
          tryCompress(quality);
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  // Compression handler - handles both images and videos
  const handleCompressFile = async (file: File, index: number) => {
    const originalFileKey = getFileKey(file);
    
    // Store mapping of index to original file key
    setFileKeyMap(prev => new Map(prev).set(index, originalFileKey));
    
    // Check if already compressed
    if (compressedFiles.has(originalFileKey)) {
      console.log('[Compression] File already compressed:', file.name);
      return;
    }

    console.log('[Compression] Starting compression for:', file.name, 'Size:', formatFileSize(file.size));

    try {
      // Set compressing state
      setCompressingFiles(prev => new Map(prev).set(originalFileKey, true));
      setCompressionProgress(prev => new Map(prev).set(originalFileKey, 0));

      let compressedFile: File;

      if (isImageFile(file)) {
        // Client-side image compression
        setCompressionProgress(prev => new Map(prev).set(originalFileKey, 20));
        compressedFile = await compressImage(file, 4);
        setCompressionProgress(prev => new Map(prev).set(originalFileKey, 100));
      } else if (isVideoFile(file)) {
        // Server-side video compression via API
        // Create FormData to send to API
        const formData = new FormData();
        formData.append('file', file);
        formData.append('targetSizeMB', '4');

        // Simulate progress (since we can't track server-side progress easily)
        const progressInterval = setInterval(() => {
          setCompressionProgress(prev => {
            const current = prev.get(originalFileKey) || 0;
            if (current < 90) {
              return new Map(prev).set(originalFileKey, current + 10);
            }
            return prev;
          });
        }, 500);

        // Call compression API
        const response = await fetch('/api/admin/media/compress', {
          method: 'POST',
          body: formData,
          credentials: 'include',
        });

        clearInterval(progressInterval);
        setCompressionProgress(prev => new Map(prev).set(originalFileKey, 100));

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Compression failed' }));
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        // Get compressed file blob
        const blob = await response.blob();
        const compressedFileName = file.name.replace(/\.[^/.]+$/, '') + '-compressed.mp4';
        compressedFile = new File([blob], compressedFileName, {
          type: 'video/mp4',
          lastModified: Date.now()
        });
      } else {
        throw new Error('File type not supported for compression');
      }

      console.log('[Compression] Compression complete:', {
        original: formatFileSize(file.size),
        compressed: formatFileSize(compressedFile.size),
        reduction: `${((1 - compressedFile.size / file.size) * 100).toFixed(1)}%`
      });

      // Check if compression actually reduced size
      if (compressedFile.size >= file.size) {
        console.warn('[Compression] Compression did not reduce file size, using original file');
        toast({
          title: 'Compression warning',
          description: 'File size was not reduced. Using original file.',
          variant: 'destructive',
        });
      }

      // Store compressed file and original size
      setCompressedFiles(prev => new Map(prev).set(originalFileKey, compressedFile));
      setOriginalFileSizes(prev => new Map(prev).set(originalFileKey, file.size));

      // Replace file in selectedFilesToUpload array
      setSelectedFilesToUpload(prev => {
        const newFiles = [...prev];
        newFiles[index] = compressedFile;
        return newFiles;
      });

      // Clear compressing state
      setCompressingFiles(prev => {
        const newMap = new Map(prev);
        newMap.delete(originalFileKey);
        return newMap;
      });
      setCompressionProgress(prev => {
        const newMap = new Map(prev);
        newMap.delete(originalFileKey);
        return newMap;
      });

      toast({
        title: isImageFile(file) ? 'Image compressed' : 'Video compressed',
        description: `${file.name} has been compressed from ${formatFileSize(file.size)} to ${formatFileSize(compressedFile.size)}`,
      });
    } catch (error: any) {
      console.error('[Compression] Compression error:', error);
      
      // Clear compressing state on error
      setCompressingFiles(prev => {
        const newMap = new Map(prev);
        newMap.delete(originalFileKey);
        return newMap;
      });
      setCompressionProgress(prev => {
        const newMap = new Map(prev);
        newMap.delete(originalFileKey);
        return newMap;
      });

      toast({
        title: 'Compression failed',
        description: error.message || 'Failed to compress file. Please try again or use a smaller file.',
        variant: 'destructive',
      });
    }
  };

  // Legacy function name for backward compatibility
  const handleCompressVideo = handleCompressFile;

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const filesArray = Array.from(event.target.files);
      setSelectedFilesToUpload(filesArray);
      setUploadStep('confirm');
      setUploadError(null);
      // Clear compression state when new files are selected
      setCompressedFiles(new Map());
      setCompressingFiles(new Map());
      setCompressionProgress(new Map());
      setOriginalFileSizes(new Map());
      // Initialize file key map for new files
      const newFileKeyMap = new Map<number, string>();
      filesArray.forEach((file, index) => {
        newFileKeyMap.set(index, getFileKey(file));
      });
      setFileKeyMap(newFileKeyMap);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleConfirmUpload = async () => {
    if (selectedFilesToUpload.length === 0) return;

    setUploadStep('uploading');
    setUploadProgress(0);
    setUploadError(null);
    
    // Prepare files for upload (use compressed versions if available)
    const filesToUpload = selectedFilesToUpload.map((file, index) => {
      const originalFileKey = fileKeyMap.get(index) || getFileKey(file);
      if (compressedFiles.has(originalFileKey)) {
        return compressedFiles.get(originalFileKey)!;
      }
      return file;
    });

    // Separate files into those that can be uploaded and those that exceed limit
    const filesUnderLimit: File[] = [];
    const filesOverLimit: File[] = [];
    
    filesToUpload.forEach((file) => {
      if (exceedsVercelLimit(file)) {
        filesOverLimit.push(file);
      } else {
        filesUnderLimit.push(file);
      }
    });

    // Upload files that are under the limit
    if (filesUnderLimit.length === 0 && filesOverLimit.length > 0) {
      toast({
        title: 'Compression required',
        description: `All ${filesOverLimit.length} file(s) exceed 4.5MB limit. Please compress them before uploading.`,
        variant: 'destructive',
      });
      setUploadStep('confirm');
      return;
    }

    // Show warning if some files exceed limit but proceed with upload of permitted files
    if (filesOverLimit.length > 0) {
      toast({
        title: 'Partial upload',
        description: `${filesOverLimit.length} file(s) exceed 4.5MB and will be skipped. ${filesUnderLimit.length} file(s) will be uploaded.`,
        variant: 'default',
      });
    }
    
    // Initialize upload tracking
    const initialUploadingFiles = filesToUpload.map(file => ({
      file,
      progress: 0,
      status: 'pending' as const
    }));
    setUploadingFiles(initialUploadingFiles);

    const folderToUse = showNewFolderInput && newFolderName.trim() 
      ? newFolderName.trim() 
      : selectedFolder || null;

    // Initialize upload tracking for all files (including oversized ones marked as skipped)
    const allUploadingFiles = filesToUpload.map((file) => {
      const isOverLimit = filesOverLimit.includes(file);
      return {
        file,
        progress: 0,
        status: (isOverLimit ? 'error' : 'pending') as 'pending' | 'error'
      };
    });
    setUploadingFiles(allUploadingFiles);

    try {
      // Only upload files under the limit
      const uploadPromises = filesUnderLimit.map(async (file, index) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('title', file.name.split('.')[0]);
        
        if (folderToUse) {
          formData.append('folder', folderToUse);
        }

        // Find the index in the original uploadingFiles array
        const originalIndex = filesToUpload.findIndex(f => f === file);
        
        // Update status to uploading
        setUploadingFiles(prev => prev.map((item, i) => 
          i === originalIndex ? { ...item, status: 'uploading' } : item
        ));

        try {
          await apiClient.upload('/admin/media/upload', formData);
          
          // Update status to success
          setUploadingFiles(prev => prev.map((item, i) => 
            i === originalIndex ? { ...item, status: 'success', progress: 100 } : item
          ));
          
          // Update overall progress
          setUploadProgress(((index + 1) / filesUnderLimit.length) * 100);
        } catch (error: any) {
          // Update status to error
          setUploadingFiles(prev => prev.map((item, i) => 
            i === originalIndex ? { ...item, status: 'error' } : item
          ));
          throw error;
        }
      });

      await Promise.all(uploadPromises);
      
      setUploadStep('complete');
      // Clear compression state after successful upload
      setCompressedFiles(new Map());
      setCompressingFiles(new Map());
      setCompressionProgress(new Map());
      setOriginalFileSizes(new Map());
      setFileKeyMap(new Map());
      fetchMedia(1, false);
      fetchStats();
      toast({
        title: 'Upload complete',
        description: `${filesUnderLimit.length} file(s) uploaded successfully.${filesOverLimit.length > 0 ? ` ${filesOverLimit.length} file(s) skipped (exceed 4.5MB limit).` : ''}`,
      });
    } catch (error: any) {
      console.error('Error uploading files:', error);
      const errorMessage = error?.response?.data?.error || error?.message || 'Failed to upload files';
      setUploadError(errorMessage);
      toast({
        title: 'Upload failed',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  const handleSyncAfterUpload = async () => {
    try {
      const response = await fetch('/api/admin/media/sync', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Sync failed');
      }

      toast({
        title: 'Sync started',
        description: 'S3 sync is running in the background.',
      });

      // Refresh media after a short delay to allow sync to process
      setTimeout(() => {
        fetchMedia(1, false);
        fetchStats();
      }, 2000);
    } catch (error: any) {
      console.error('Error syncing:', error);
      toast({
        title: 'Sync failed',
        description: error?.message || 'Failed to start sync',
        variant: 'destructive',
      });
    }
  };

  const resetUploadModal = () => {
    setUploadStep('select');
    setSelectedFilesToUpload([]);
    setUploadProgress(0);
    setIsDragging(false);
    setUploadingFiles([]);
    setUploadError(null);
    setSelectedFolder('');
    setNewFolderName('');
    setShowNewFolderInput(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCloseUploadModal = () => {
    resetUploadModal();
    setShowUploadModal(false);
  };

  // Files are already filtered by the API, so we can use them directly
  const filteredFiles = files;

  // Group files by folder
  const filesByFolder = filteredFiles.reduce((acc, file) => {
    const folder = file.folder || 'Root';
    if (!acc[folder]) {
      acc[folder] = [];
    }
    acc[folder].push(file);
    return acc;
  }, {} as Record<string, MediaFile[]>);

  // Sort folders alphabetically, with 'Root' first
  const sortedFolders = Object.keys(filesByFolder).sort((a, b) => {
    if (a === 'Root') return -1;
    if (b === 'Root') return 1;
    return a.localeCompare(b);
  });

  // Get unique folders for filter dropdown
  const uniqueFolders = Array.from(new Set(files.map(file => file.folder || 'Root')))
    .sort((a, b) => {
      if (a === 'Root') return -1;
      if (b === 'Root') return 1;
      return a.localeCompare(b);
    });

  // Onboarding component for when no AWS config exists
  const OnboardingContent = () => (
    <div className="bg-white shadow-2xl rounded-2xl border border-gray-200 overflow-hidden">
      <div className="p-8 space-y-6">
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4">
            <div className="bg-blue-100 rounded-full p-6">
              <Cloud className="h-16 w-16 text-blue-600" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome to Media Library</h2>
          <p className="text-gray-600 text-lg">Let&apos;s set up your cloud storage to get started</p>
        </div>

        <div className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="bg-blue-100 rounded-full p-3 mt-1">
              <CheckCircle className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Secure Cloud Storage</h3>
              <p className="text-gray-600">Store your media files safely in AWS S3 with enterprise-grade security and reliability.</p>
            </div>
          </div>
          
          <div className="flex items-start gap-4">
            <div className="bg-blue-100 rounded-full p-3 mt-1">
              <CheckCircle className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Fast & Scalable</h3>
              <p className="text-gray-600">Upload and access your files quickly with automatic scaling as your needs grow.</p>
            </div>
          </div>
          
          <div className="flex items-start gap-4">
            <div className="bg-blue-100 rounded-full p-3 mt-1">
              <CheckCircle className="h-6 w-6 text-blue-600" />
            </div>
      <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Easy Management</h3>
              <p className="text-gray-600">Organize, search, and manage your media library with an intuitive interface.</p>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>First Step:</strong> You&apos;ll need AWS S3 credentials to configure your storage. If you don&apos;t have them yet, you can{' '}
            <a
              href="https://aws.amazon.com/free/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-semibold underline"
            >
              create a free AWS account
              <ExternalLink className="h-3 w-3" />
            </a>
            {' '}and get up to 5GB of S3 storage for free.
        </p>
      </div>

        <div className="flex gap-3 pt-4">
          <Button
            onClick={handleGoToSettings}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-6 text-lg"
          >
            <Cloud className="h-5 w-5 mr-2" />
            Configure S3 Storage
            <ArrowRight className="h-5 w-5 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Stats */}
      {!showOnboarding && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 md:gap-6">
          <div className="bg-white overflow-hidden shadow-lg rounded-xl border border-gray-200 hover:shadow-xl transition-all duration-300">
            <div className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Total Files</p>
                  <div className="mt-2 flex items-baseline">
                    {!stats ? (
                      <div className="animate-pulse bg-gray-200 h-8 w-24 rounded"></div>
                    ) : (
                      <p className="text-3xl font-bold text-gray-900">{stats.totalFiles}</p>
                    )}
                  </div>
                </div>
                <div className="bg-blue-600 rounded-xl p-4 shadow-lg">
                  <Image className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white overflow-hidden shadow-lg rounded-xl border border-gray-200 hover:shadow-xl transition-all duration-300">
            <div className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Images</p>
                  <div className="mt-2 flex items-baseline">
                    {!stats ? (
                      <div className="animate-pulse bg-gray-200 h-8 w-24 rounded"></div>
                    ) : (
                      <p className="text-3xl font-bold text-gray-900">{stats.totalImages}</p>
                    )}
                  </div>
                </div>
                <div className="bg-blue-600 rounded-xl p-4 shadow-lg">
                  <Image className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white overflow-hidden shadow-lg rounded-xl border border-gray-200 hover:shadow-xl transition-all duration-300">
            <div className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Videos</p>
                  <div className="mt-2 flex items-baseline">
                    {!stats ? (
                      <div className="animate-pulse bg-gray-200 h-8 w-24 rounded"></div>
                    ) : (
                      <p className="text-3xl font-bold text-gray-900">{stats.totalVideos}</p>
                    )}
                  </div>
                </div>
                <div className="bg-blue-600 rounded-xl p-4 shadow-lg">
                  <Image className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white overflow-hidden shadow-lg rounded-xl border border-gray-200 hover:shadow-xl transition-all duration-300">
            <div className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Documents</p>
                  <div className="mt-2 flex items-baseline">
                    {!stats ? (
                      <div className="animate-pulse bg-gray-200 h-8 w-24 rounded"></div>
                    ) : (
                      <p className="text-3xl font-bold text-gray-900">{stats.totalDocuments}</p>
                    )}
                  </div>
                </div>
                <div className="bg-blue-600 rounded-xl p-4 shadow-lg">
                  <Folder className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white overflow-hidden shadow-lg rounded-xl border border-gray-200 hover:shadow-xl transition-all duration-300">
            <div className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Storage</p>
                  <div className="mt-2 flex items-baseline">
                    {!stats ? (
                      <div className="animate-pulse bg-gray-200 h-8 w-24 rounded"></div>
                    ) : (
                      <p className="text-lg font-bold text-gray-900">{formatFileSize(stats.totalSize)}</p>
                    )}
                  </div>
                </div>
                <div className="bg-blue-600 rounded-xl p-4 shadow-lg">
                  <Folder className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pagination Info */}
      {!showOnboarding && pagination && (
        <div className="bg-white shadow-lg rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4 flex-wrap">
              {/* Filters */}
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Types</option>
                <option value="image">Images</option>
                <option value="video">Videos</option>
                <option value="document">Documents</option>
              </select>
              
              <select
                value={folderFilter}
                onChange={(e) => setFolderFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Folders</option>
                {uniqueFolders.map((folder) => (
                  <option key={folder} value={folder}>
                    {folder}
                  </option>
                ))}
              </select>

              <p className="text-sm text-gray-600">
                Showing {files.length} of {pagination.total} files
                {pagination.pages > 1 && ` (Page ${pagination.page} of ${pagination.pages})`}
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              {/* View Mode Selectors */}
              <div className="flex items-center gap-2 border border-gray-300 rounded-lg p-1">
                <Button
                  onClick={() => setViewMode('grid')}
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  className="h-8 px-3"
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button
                  onClick={() => setViewMode('list')}
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  className="h-8 px-3"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
              
              {pagination.page < pagination.pages && (
                <Button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  variant="secondary"
                  className="flex items-center gap-2"
                >
                  {loadingMore ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      Load More
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Floating Bulk Actions Bar */}
      {showBulkActions && (
        <div className="fixed top-16 left-0 right-0 z-50 bg-blue-600 text-white shadow-lg border-b border-blue-700">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="font-medium">
                  {selectedFiles.size} file{selectedFiles.size !== 1 ? 's' : ''} selected
                </span>
                <button
                  onClick={() => setSelectedFiles(new Set())}
                  className="text-sm underline hover:no-underline"
                >
                  Clear selection
                </button>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleBulkDelete}
                  variant="destructive"
                  className="flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Selected
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Media Grid/List */}
      <div className={showBulkActions ? 'pt-16' : ''}>
        {showOnboarding ? (
          <OnboardingContent />
        ) : loading ? (
          <div className="bg-white shadow-lg rounded-xl border border-gray-200 p-8">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        ) : filteredFiles.length === 0 ? (
        <div className="bg-white shadow-lg rounded-xl border border-gray-200 p-8 text-center">
          <div className="flex flex-col items-center justify-center py-12">
            <div className="bg-gray-100 rounded-full p-6 mb-4">
              <Image className="h-16 w-16 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No media files yet</h3>
            <p className="text-gray-600 mb-6 max-w-md text-center">
              Start building your media library by uploading images, videos, and documents.
            </p>
            <Button 
              onClick={() => setShowUploadModal(true)} 
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload Your First File
            </Button>
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="space-y-8">
          {sortedFolders.map((folder) => (
            <div key={folder} className="space-y-4">
              {/* Folder Header */}
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 rounded-lg p-2">
                  <Folder className="h-5 w-5 text-blue-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">{folder}</h2>
                <Badge variant="secondary">
                  {filesByFolder[folder].length} file{filesByFolder[folder].length !== 1 ? 's' : ''}
                </Badge>
              </div>
              
              {/* Files Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filesByFolder[folder].map((file) => (
                  <div
                    key={file.id}
                    className={`shadow-lg rounded-xl overflow-hidden transition-all relative group ${
                      selectedFiles.has(file.id)
                        ? 'bg-blue-50 border-2 border-blue-300'
                        : 'bg-white border border-gray-200 hover:shadow-xl hover:border-blue-400'
                    }`}
                  >
                    {/* Checkbox overlay */}
                    <div className={`absolute top-2 right-2 z-50 transition-opacity ${
                      selectedFiles.has(file.id) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                    }`}>
                      <input
                        type="checkbox"
                        checked={selectedFiles.has(file.id)}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleSelectFile(file.id);
                        }}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </div>
                    
                    <div className="aspect-square bg-gray-100 flex items-center justify-center">
                      <S3FilePreview
                        src={getPreviewUrl(file)}
                        alt={file.altText || file.title}
                        fileName={file.fileName}
                        fileType={file.fileType}
                        className="w-full h-full object-cover"
                        priority={false}
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="text-sm font-medium text-gray-900 truncate">{file.title}</h3>
                      <p className="text-xs text-gray-500 mt-1">{formatFileSize(file.fileSize)}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(file.createdAt).toLocaleDateString()}
                      </p>
                      <div className="mt-2 flex items-center justify-between">
                        <Badge variant={file.isPublic ? 'default' : 'secondary'}>
                          {file.isPublic ? 'Public' : 'Private'}
                        </Badge>
                        <div className="relative" data-menu-container>
                          <button
                            data-menu-id={file.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenuId(openMenuId === file.id ? null : file.id);
                            }}
                            className="text-gray-600 hover:text-gray-900 p-1 rounded hover:bg-gray-100 transition-colors"
                            title="Actions"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>
                          {openMenuId === file.id && (
                            <div className="absolute bottom-full right-0 mb-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[160px] py-1" data-menu-container>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.open(getPreviewUrl(file), '_blank');
                                  setOpenMenuId(null);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                              >
                                <Eye className="h-4 w-4" />
                                View
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setRenameFileId(file.id);
                                  setNewFileName(file.fileName);
                                  setShowRenameDialog(true);
                                  setOpenMenuId(null);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                              >
                                <RefreshCw className="h-4 w-4" />
                                Rename
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setMoveFileId(file.id);
                                  setShowMoveDialog(true);
                                  setOpenMenuId(null);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                              >
                                <Move className="h-4 w-4" />
                                Move to folder
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(file.id);
                                  setOpenMenuId(null);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                              >
                                <Trash2 className="h-4 w-4" />
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {sortedFolders.map((folder) => (
            <div key={folder} className="bg-white shadow-lg rounded-xl border border-gray-200 overflow-hidden">
              {/* Folder Header */}
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 rounded-lg p-2">
                    <Folder className="h-5 w-5 text-blue-600" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">{folder}</h2>
                  <Badge variant="secondary">
                    {filesByFolder[folder].length} file{filesByFolder[folder].length !== 1 ? 's' : ''}
                  </Badge>
                </div>
              </div>
              
              {/* Files Table */}
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      <input
                        type="checkbox"
                        checked={filesByFolder[folder].every(file => selectedFiles.has(file.id)) && filesByFolder[folder].length > 0}
                        onChange={() => {
                          const folderFiles = filesByFolder[folder];
                          const allSelected = folderFiles.every(file => selectedFiles.has(file.id));
                          if (allSelected) {
                            setSelectedFiles(prev => {
                              const newSet = new Set(prev);
                              folderFiles.forEach(file => newSet.delete(file.id));
                              return newSet;
                            });
                          } else {
                            setSelectedFiles(prev => {
                              const newSet = new Set(prev);
                              folderFiles.forEach(file => newSet.add(file.id));
                              return newSet;
                            });
                          }
                        }}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">File</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Size</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Uploaded</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filesByFolder[folder].map((file) => (
                    <tr 
                      key={file.id} 
                      className={`hover:bg-gray-50 ${
                        selectedFiles.has(file.id)
                          ? 'bg-blue-50 border-l-4 border-blue-300'
                          : ''
                      }`}
                    >
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedFiles.has(file.id)}
                          onChange={() => handleSelectFile(file.id)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0">
                            <S3FilePreview
                              src={getPreviewUrl(file)}
                              alt={file.title}
                              fileName={file.fileName}
                              fileType={file.fileType}
                              className="h-10 w-10 rounded object-cover"
                              priority={false}
                            />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{file.title}</div>
                            <div className="text-sm text-gray-500">{file.fileName}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{file.fileType}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{formatFileSize(file.fileSize)}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(file.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="relative" data-menu-container>
                          <button
                            data-menu-id={file.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenuId(openMenuId === file.id ? null : file.id);
                            }}
                            className="text-gray-600 hover:text-gray-900 p-1 rounded hover:bg-gray-100 transition-colors"
                            title="Actions"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>
                          {openMenuId === file.id && (
                            <div className="absolute right-0 bottom-full mb-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[160px] py-1" data-menu-container>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.open(getPreviewUrl(file), '_blank');
                                  setOpenMenuId(null);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                              >
                                <Eye className="h-4 w-4" />
                                View
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setRenameFileId(file.id);
                                  setNewFileName(file.fileName);
                                  setShowRenameDialog(true);
                                  setOpenMenuId(null);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                              >
                                <RefreshCw className="h-4 w-4" />
                                Rename
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setMoveFileId(file.id);
                                  setShowMoveDialog(true);
                                  setOpenMenuId(null);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                              >
                                <Move className="h-4 w-4" />
                                Move to folder
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(file.id);
                                  setOpenMenuId(null);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                              >
                                <Trash2 className="h-4 w-4" />
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={handleCloseUploadModal}
        >
          <div 
            className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 border border-gray-200 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                {uploadStep === 'select' && 'Upload Files'}
                {uploadStep === 'confirm' && 'Confirm Upload'}
                {uploadStep === 'uploading' && 'Uploading Files'}
                {uploadStep === 'complete' && 'Upload Complete'}
              </h2>
              <button
                onClick={handleCloseUploadModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              {/* Step 1: Select Files */}
              {uploadStep === 'select' && (
                <>
                  {/* Folder Selection */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Folder</label>
                    <select
                      value={showNewFolderInput ? 'new' : selectedFolder}
                      onChange={(e) => {
                        if (e.target.value === 'new') {
                          setShowNewFolderInput(true);
                          setSelectedFolder('');
                        } else {
                          setShowNewFolderInput(false);
                          setSelectedFolder(e.target.value);
                          setNewFolderName('');
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Root (No folder)</option>
                      {uniqueFolders.map((folder) => (
                        <option key={folder} value={folder}>
                          {folder}
                        </option>
                      ))}
                      <option value="new">+ Create new folder</option>
                    </select>
                    
                    {showNewFolderInput && (
                      <input
                        type="text"
                        value={newFolderName}
                        onChange={(e) => setNewFolderName(e.target.value)}
                        placeholder="Enter folder name"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    )}
                  </div>

                  {/* Drag and Drop Zone - Hidden on mobile */}
                  <div 
                    className={cn(
                      "hidden md:block border-2 border-dashed rounded-lg p-8 text-center transition-colors",
                      isDragging 
                        ? "border-blue-500 bg-blue-50" 
                        : "border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100"
                    )}
                    onDragEnter={handleDragEnter}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      Drag and drop files here
                    </p>
                    <p className="text-xs text-gray-500 mb-4">or</p>
                    <Button
                      onClick={triggerFileInput}
                      variant="outline"
                      className="mb-2"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Select Files
                    </Button>
                    <p className="text-xs text-gray-400 mt-2">
                      Supports images, videos, documents
                    </p>
                  </div>

                  {/* File Input Button - Visible on mobile, hidden on desktop */}
                  <div className="md:hidden">
                    <Button
                      onClick={triggerFileInput}
                      variant="outline"
                      className="w-full"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Select Files
                    </Button>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </>
              )}

              {/* Step 2: Confirm Upload */}
              {uploadStep === 'confirm' && selectedFilesToUpload.length > 0 && (() => {
                // Check for oversized files (both images and videos)
                const oversizedFiles = selectedFilesToUpload.filter((file, index) => {
                  const originalFileKey = fileKeyMap.get(index) || getFileKey(file);
                  const isVideo = isVideoFile(file);
                  const isImage = isImageFile(file);
                  const exceedsLimit = exceedsVercelLimit(file);
                  const isCompressed = compressedFiles.has(originalFileKey);
                  return (isVideo || isImage) && exceedsLimit && !isCompressed;
                });

                // Separate into images and videos for better messaging
                const oversizedImages = oversizedFiles.filter(f => isImageFile(f));
                const oversizedVideos = oversizedFiles.filter(f => isVideoFile(f));

                return (
                  <>
                    {/* Warning banner for oversized files */}
                    {oversizedFiles.length > 0 && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <h3 className="text-sm font-medium text-yellow-800 mb-1">
                              Large Files Detected
                            </h3>
                            <p className="text-xs text-yellow-700">
                              {oversizedFiles.length} file{oversizedFiles.length !== 1 ? 's' : ''} exceed{oversizedFiles.length === 1 ? 's' : ''} the 4.5MB upload limit.
                              {oversizedImages.length > 0 && ` ${oversizedImages.length} image${oversizedImages.length !== 1 ? 's' : ''}`}
                              {oversizedImages.length > 0 && oversizedVideos.length > 0 && ' and'}
                              {oversizedVideos.length > 0 && ` ${oversizedVideos.length} video${oversizedVideos.length !== 1 ? 's' : ''}`}
                              {oversizedFiles.length > 0 && '. Files under 4.5MB will be uploaded, but oversized files will be skipped unless compressed.'}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Folder</label>
                      <select
                        value={showNewFolderInput ? 'new' : selectedFolder}
                        onChange={(e) => {
                          if (e.target.value === 'new') {
                            setShowNewFolderInput(true);
                            setSelectedFolder('');
                          } else {
                            setShowNewFolderInput(false);
                            setSelectedFolder(e.target.value);
                            setNewFolderName('');
                          }
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Root (No folder)</option>
                        {uniqueFolders.map((folder) => (
                          <option key={folder} value={folder}>
                            {folder}
                          </option>
                        ))}
                        <option value="new">+ Create new folder</option>
                      </select>
                      
                      {showNewFolderInput && (
                        <input
                          type="text"
                          value={newFolderName}
                          onChange={(e) => setNewFolderName(e.target.value)}
                          placeholder="Enter folder name"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        Selected Files ({selectedFilesToUpload.length})
                      </label>
                      <div className="border border-gray-200 rounded-lg max-h-64 overflow-y-auto">
                        {selectedFilesToUpload.map((file, index) => {
                          // Get original file key from map, or generate new one
                          const originalFileKey = fileKeyMap.get(index) || getFileKey(file);
                          const isVideo = isVideoFile(file);
                          const isImage = isImageFile(file);
                          const exceedsLimit = exceedsVercelLimit(file);
                          const isCompressed = compressedFiles.has(originalFileKey);
                          const isCompressing = compressingFiles.get(originalFileKey) || false;
                          const progress = compressionProgress.get(originalFileKey) || 0;
                          const needsCompression = (isVideo || isImage) && exceedsLimit && !isCompressed;

                          return (
                            <div
                              key={index}
                              className={cn(
                                "p-3 border-b border-gray-100 last:border-b-0",
                                needsCompression && "bg-yellow-50 border-yellow-200"
                              )}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                                    {needsCompression && (
                                      <Badge variant="destructive" className="text-xs">
                                        <AlertTriangle className="h-3 w-3 mr-1" />
                                        Too Large
                                      </Badge>
                                    )}
                                    {isCompressed && (
                                      <Badge variant="default" className="text-xs bg-green-600">
                                        <CheckCircle className="h-3 w-3 mr-1" />
                                        Compressed
                                      </Badge>
                                    )}
                                  </div>
                                  <p className={cn(
                                    "text-xs mt-1",
                                    exceedsLimit ? "text-red-600 font-medium" : "text-gray-500"
                                  )}>
                                    {formatFileSize(file.size)}
                                    {isCompressed && originalFileSizes.has(originalFileKey) && (
                                      <span className="text-green-600 ml-2">
                                        (was {formatFileSize(originalFileSizes.get(originalFileKey) || file.size)})
                                      </span>
                                    )}
                                  </p>
                                  {isCompressing && (
                                    <div className="mt-2">
                                      <div className="flex items-center gap-2 text-xs text-blue-600">
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                        <span>Compressing... {Math.round(progress)}%</span>
                                      </div>
                                      <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                                        <div 
                                          className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                                          style={{ width: `${progress}%` }}
                                        />
                                      </div>
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  {needsCompression && !isCompressing && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleCompressFile(file, index)}
                                      className="text-xs"
                                    >
                                      Compress
                                    </Button>
                                  )}
                                  <button
                                    onClick={() => {
                                      const newFiles = selectedFilesToUpload.filter((_, i) => i !== index);
                                      setSelectedFilesToUpload(newFiles);
                                      // Clean up compression state for removed file
                                      setCompressedFiles(prev => {
                                        const newMap = new Map(prev);
                                        newMap.delete(originalFileKey);
                                        return newMap;
                                      });
                                      setCompressingFiles(prev => {
                                        const newMap = new Map(prev);
                                        newMap.delete(originalFileKey);
                                        return newMap;
                                      });
                                      setCompressionProgress(prev => {
                                        const newMap = new Map(prev);
                                        newMap.delete(originalFileKey);
                                        return newMap;
                                      });
                                      setOriginalFileSizes(prev => {
                                        const newMap = new Map(prev);
                                        newMap.delete(originalFileKey);
                                        return newMap;
                                      });
                                      setFileKeyMap(prev => {
                                        const newMap = new Map(prev);
                                        newMap.delete(index);
                                        return newMap;
                                      });
                                      if (newFiles.length === 0) {
                                        setUploadStep('select');
                                      }
                                    }}
                                    className="text-red-600 hover:text-red-800"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex gap-2 justify-end pt-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setUploadStep('select');
                          setSelectedFilesToUpload([]);
                          setCompressedFiles(new Map());
                          setCompressingFiles(new Map());
                          setCompressionProgress(new Map());
                          setOriginalFileSizes(new Map());
                          setFileKeyMap(new Map());
                        }}
                      >
                        Back
                      </Button>
                      <Button
                        onClick={handleConfirmUpload}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                        disabled={selectedFilesToUpload.length === 0}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Upload {selectedFilesToUpload.filter((file, index) => {
                          const originalFileKey = fileKeyMap.get(index) || getFileKey(file);
                          const fileToCheck = compressedFiles.has(originalFileKey) 
                            ? compressedFiles.get(originalFileKey)! 
                            : file;
                          return !exceedsVercelLimit(fileToCheck);
                        }).length} File{selectedFilesToUpload.filter((file, index) => {
                          const originalFileKey = fileKeyMap.get(index) || getFileKey(file);
                          const fileToCheck = compressedFiles.has(originalFileKey) 
                            ? compressedFiles.get(originalFileKey)! 
                            : file;
                          return !exceedsVercelLimit(fileToCheck);
                        }).length !== 1 ? 's' : ''}
                      </Button>
                    </div>
                  </>
                );
              })()}

              {/* Step 3: Uploading */}
              {uploadStep === 'uploading' && (
                <>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                        <span>Uploading files...</span>
                        <span>{Math.round(uploadProgress)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>

                    {uploadingFiles.length > 0 && (
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {uploadingFiles.map((item, index) => (
                          <div
                            key={index}
                            className="p-3 border border-gray-200 rounded-lg"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <p className="text-sm font-medium text-gray-900 truncate flex-1">
                                {item.file.name}
                              </p>
                              {item.status === 'success' && (
                                <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 ml-2" />
                              )}
                              {item.status === 'error' && (
                                <X className="h-4 w-4 text-red-600 flex-shrink-0 ml-2" />
                              )}
                            </div>
                            {item.status === 'uploading' && (
                              <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                                <div 
                                  className="bg-blue-600 h-1 rounded-full transition-all duration-300"
                                  style={{ width: `${item.progress}%` }}
                                />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {uploadError && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-700">{uploadError}</p>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Step 4: Complete */}
              {uploadStep === 'complete' && (
                <>
                  <div className="text-center py-4">
                    <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Upload Complete!
                    </h3>
                    <p className="text-sm text-gray-600 mb-6">
                      {selectedFilesToUpload.length} file(s) uploaded successfully.
                    </p>
                  </div>

                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="outline"
                      onClick={handleSyncAfterUpload}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Sync S3
                    </Button>
                    <Button
                      onClick={handleCloseUploadModal}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Done
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Rename Dialog */}
      {showRenameDialog && renameFileId && (() => {
        const file = files.find(f => f.id === renameFileId);
        return (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={() => {
              setShowRenameDialog(false);
              setRenameFileId(null);
              setNewFileName('');
            }}
          >
            <div 
              className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 border border-gray-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Rename File</h2>
                <button
                  onClick={() => {
                    setShowRenameDialog(false);
                    setRenameFileId(null);
                    setNewFileName('');
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">File name</label>
                  <input
                    type="text"
                    value={newFileName}
                    onChange={(e) => setNewFileName(e.target.value)}
                    placeholder="Enter new file name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleRenameFile();
                      } else if (e.key === 'Escape') {
                        setShowRenameDialog(false);
                        setRenameFileId(null);
                        setNewFileName('');
                      }
                    }}
                    autoFocus
                  />
                  {file && (
                    <p className="text-xs text-gray-500">
                      Current: {file.fileName}
                    </p>
                  )}
                </div>
                
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowRenameDialog(false);
                      setRenameFileId(null);
                      setNewFileName('');
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleRenameFile}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    disabled={!newFileName.trim() || (file && newFileName.trim() === file.fileName)}
                  >
                    Rename
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Move to Folder Dialog */}
      {showMoveDialog && moveFileId && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setShowMoveDialog(false)}
        >
          <div 
            className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 border border-gray-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Move to Folder</h2>
              <button
                onClick={() => {
                  setShowMoveDialog(false);
                  setMoveFileId(null);
                  setMoveToFolder('');
                  setNewMoveFolderName('');
                  setShowNewMoveFolderInput(false);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Select folder</label>
                <select
                  value={showNewMoveFolderInput ? 'new' : moveToFolder}
                  onChange={(e) => {
                    if (e.target.value === 'new') {
                      setShowNewMoveFolderInput(true);
                      setMoveToFolder('');
                    } else {
                      setShowNewMoveFolderInput(false);
                      setMoveToFolder(e.target.value);
                      setNewMoveFolderName('');
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Root (No folder)</option>
                  {uniqueFolders
                    .filter(f => {
                      const file = files.find(f => f.id === moveFileId);
                      return f !== (file?.folder || 'Root');
                    })
                    .map((folder) => (
                      <option key={folder} value={folder}>
                        {folder}
                      </option>
                    ))}
                  <option value="new">+ Create new folder</option>
                </select>
                
                {showNewMoveFolderInput && (
                  <input
                    type="text"
                    value={newMoveFolderName}
                    onChange={(e) => setNewMoveFolderName(e.target.value)}
                    placeholder="Enter folder name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                )}
              </div>
              
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowMoveDialog(false);
                    setMoveFileId(null);
                    setMoveToFolder('');
                    setNewMoveFolderName('');
                    setShowNewMoveFolderInput(false);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleMoveFile}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Move
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
