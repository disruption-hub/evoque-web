'use client';

import { useState, useEffect } from 'react';
import { X, Search, LayoutGrid, List, CheckCircle, Image as ImageIcon, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import S3FilePreview from '@/components/shared/S3FilePreview';
import apiClient from '@/lib/api-client';
import { cn } from '@/lib/utils';

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
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

interface MediaSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (file: MediaFile) => void;
  allowMultiple?: boolean;
  selectedFiles?: MediaFile[];
  title?: string;
}

export default function MediaSelectorModal({
  isOpen,
  onClose,
  onSelect,
  allowMultiple = false,
  selectedFiles = [],
  title = 'Select Media'
}: MediaSelectorModalProps) {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [folderFilter, setFolderFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);

  // Filter to only images and videos
  const filteredFiles = files.filter(file => {
    const isImage = file.fileType.startsWith('image/');
    const isVideo = file.fileType.startsWith('video/');
    return isImage || isVideo;
  });

  // Get unique folders
  const uniqueFolders = Array.from(new Set(filteredFiles.map(file => file.folder || 'Root')))
    .sort((a, b) => {
      if (a === 'Root') return -1;
      if (b === 'Root') return 1;
      return a.localeCompare(b);
    });

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

  // Filter by search term
  const searchFilteredFiles = searchTerm
    ? filteredFiles.filter(file =>
        file.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        file.fileName.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : filteredFiles;

  // Filter by folder
  const folderFilteredFiles = folderFilter === 'all'
    ? searchFilteredFiles
    : searchFilteredFiles.filter(file => (file.folder || 'Root') === folderFilter);

  // Helper function to get preview URL
  const getPreviewUrl = (file: MediaFile): string => {
    if (file.s3Key) {
      return `/api/media/download?key=${encodeURIComponent(file.s3Key)}&view=true`;
    }
    return file.fileUrl;
  };

  // Check if file is selected
  const isSelected = (file: MediaFile): boolean => {
    return selectedFiles.some(selected => selected.id === file.id);
  };

  // Fetch media files
  const fetchMedia = async (page: number = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '100', // Load more for selector
        ...(folderFilter !== 'all' && { folder: folderFilter }),
        ...(searchTerm && { search: searchTerm })
      });

      const data = await apiClient.get<{ mediaFiles: MediaFile[]; pagination: PaginationInfo }>(
        `/admin/media?${params}`
      );

      if (data.mediaFiles) {
        setFiles(data.mediaFiles);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error fetching media:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchMedia(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, folderFilter, searchTerm]);

  if (!isOpen) return null;

  const handleSelect = (file: MediaFile) => {
    if (allowMultiple) {
      // Toggle selection
      if (isSelected(file)) {
        // Deselect - handled by parent
        onSelect(file);
      } else {
        onSelect(file);
      }
    } else {
      // Single selection - select and close
      onSelect(file);
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl max-w-6xl w-full mx-4 border border-gray-200 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-gray-200 space-y-3">
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search media..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Folder Filter */}
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

            {/* View Mode */}
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
          </div>

          {selectedFiles.length > 0 && (
            <div className="text-sm text-gray-600">
              {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''} selected
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : folderFilteredFiles.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <ImageIcon className="h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No media found</h3>
              <p className="text-sm text-gray-600">
                {searchTerm ? 'Try a different search term' : 'Upload some media files to get started'}
              </p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="space-y-6">
              {sortedFolders.map((folder) => {
                const folderFiles = filesByFolder[folder].filter(file =>
                  folderFilteredFiles.includes(file)
                );
                if (folderFiles.length === 0) return null;

                return (
                  <div key={folder} className="space-y-4">
                    {/* Folder Header */}
                    <div className="flex items-center gap-3">
                      <h3 className="text-sm font-semibold text-gray-900">{folder}</h3>
                      <Badge variant="secondary">
                        {folderFiles.length} file{folderFiles.length !== 1 ? 's' : ''}
                      </Badge>
                    </div>

                    {/* Files Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                      {folderFiles.map((file) => {
                        const selected = isSelected(file);
                        const isImage = file.fileType.startsWith('image/');
                        const isVideo = file.fileType.startsWith('video/');

                        return (
                          <div
                            key={file.id}
                            onClick={() => handleSelect(file)}
                            className={cn(
                              "relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all",
                              selected
                                ? "border-blue-500 bg-blue-50"
                                : "border-gray-200 hover:border-blue-400 hover:shadow-lg"
                            )}
                          >
                            {/* Selection Indicator */}
                            {selected && (
                              <div className="absolute top-2 right-2 z-10 bg-blue-500 rounded-full p-1">
                                <CheckCircle className="h-4 w-4 text-white" />
                              </div>
                            )}

                            {/* File Type Badge */}
                            <div className="absolute top-2 left-2 z-10">
                              {isImage ? (
                                <Badge variant="default" className="text-xs">
                                  <ImageIcon className="h-3 w-3 mr-1" />
                                  Image
                                </Badge>
                              ) : isVideo ? (
                                <Badge variant="default" className="text-xs bg-purple-600">
                                  <Video className="h-3 w-3 mr-1" />
                                  Video
                                </Badge>
                              ) : null}
                            </div>

                            {/* Preview */}
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

                            {/* File Info */}
                            <div className="p-2 bg-white">
                              <p className="text-xs font-medium text-gray-900 truncate" title={file.title}>
                                {file.title}
                              </p>
                              <p className="text-xs text-gray-500 truncate">{file.fileName}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-4">
              {sortedFolders.map((folder) => {
                const folderFiles = filesByFolder[folder].filter(file =>
                  folderFilteredFiles.includes(file)
                );
                if (folderFiles.length === 0) return null;

                return (
                  <div key={folder} className="space-y-2">
                    <h3 className="text-sm font-semibold text-gray-900">{folder}</h3>
                    <div className="space-y-2">
                      {folderFiles.map((file) => {
                        const selected = isSelected(file);
                        const isImage = file.fileType.startsWith('image/');
                        const isVideo = file.fileType.startsWith('video/');

                        return (
                          <div
                            key={file.id}
                            onClick={() => handleSelect(file)}
                            className={cn(
                              "flex items-center gap-4 p-3 rounded-lg border-2 cursor-pointer transition-all",
                              selected
                                ? "border-blue-500 bg-blue-50"
                                : "border-gray-200 hover:border-blue-400 hover:bg-gray-50"
                            )}
                          >
                            {/* Preview */}
                            <div className="h-16 w-16 flex-shrink-0 rounded overflow-hidden bg-gray-100">
                              <S3FilePreview
                                src={getPreviewUrl(file)}
                                alt={file.altText || file.title}
                                fileName={file.fileName}
                                fileType={file.fileType}
                                className="h-full w-full object-cover"
                                priority={false}
                              />
                            </div>

                            {/* File Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium text-gray-900 truncate">{file.title}</p>
                                {selected && (
                                  <CheckCircle className="h-4 w-4 text-blue-500 flex-shrink-0" />
                                )}
                              </div>
                              <p className="text-xs text-gray-500 truncate">{file.fileName}</p>
                              <div className="flex items-center gap-2 mt-1">
                                {isImage && (
                                  <Badge variant="default" className="text-xs">
                                    <ImageIcon className="h-3 w-3 mr-1" />
                                    Image
                                  </Badge>
                                )}
                                {isVideo && (
                                  <Badge variant="default" className="text-xs bg-purple-600">
                                    <Video className="h-3 w-3 mr-1" />
                                    Video
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {allowMultiple && (
          <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={onClose}
              className="bg-blue-600 hover:bg-blue-700 text-white"
              disabled={selectedFiles.length === 0}
            >
              Select {selectedFiles.length} File{selectedFiles.length !== 1 ? 's' : ''}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

