'use client';

import { useState, useEffect } from 'react';
import { Image as ImageIcon, Video, Monitor, Smartphone, X, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import S3FilePreview from '@/components/shared/S3FilePreview';
import MediaSelectorModal from './MediaSelectorModal';
import { Section } from '@/types';
import { ResponsiveBackgroundImage } from '@/types/sections';
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

interface SectionMediaEditorProps {
  section: Section;
  sectionData: Record<string, unknown>;
  onChange: (sectionData: Record<string, unknown>) => void;
}

export default function SectionMediaEditor({
  section,
  sectionData,
  onChange
}: SectionMediaEditorProps) {
  const [showMediaSelector, setShowMediaSelector] = useState(false);
  const [selectingFor, setSelectingFor] = useState<{
    field: string;
    mode?: 'desktop' | 'mobile';
  } | null>(null);
  const [backgroundImageMode, setBackgroundImageMode] = useState<'single' | 'responsive'>('responsive');

  // Helper to get preview URL
  const getPreviewUrl = (file: MediaFile | string): string => {
    if (typeof file === 'string') {
      return file;
    }
    if (file.s3Key) {
      return `/api/media/download?key=${encodeURIComponent(file.s3Key)}&view=true`;
    }
    return file.fileUrl;
  };

  // Helper to detect if URL is a video
  const isVideoUrl = (url: string | undefined): boolean => {
    if (!url) return false;
    const lower = url.toLowerCase();
    return lower.includes('.mp4') || lower.includes('.webm') || lower.includes('.mov') || lower.includes('video/');
  };

  // Helper to get file type from URL or MediaFile
  const getFileType = (url: string | undefined, file?: MediaFile): string => {
    if (file?.fileType) {
      return file.fileType;
    }
    if (isVideoUrl(url)) {
      return 'video/*';
    }
    return 'image/*';
  };

  // Get current background image value
  const getBackgroundImage = (): ResponsiveBackgroundImage | string | undefined => {
    const bgImage = sectionData.backgroundImage;
    if (!bgImage) return undefined;
    
    if (typeof bgImage === 'string') {
      return bgImage;
    }
    
    if (typeof bgImage === 'object' && bgImage !== null) {
      return bgImage as ResponsiveBackgroundImage;
    }
    
    return undefined;
  };

  // Get current image value
  const getImage = (): string | undefined => {
    const image = sectionData.image;
    if (typeof image === 'string') {
      return image;
    }
    return undefined;
  };

  // Check if section has backgroundImage field
  const hasBackgroundImage = (): boolean => {
    const sectionTypesWithBackground = [
      'HERO',
      'ABOUT',
      'MISSION',
      'VISION',
      'VALUES',
      'COMPETITIVE_ADVANTAGE',
      'BEYOND_STANDARDS',
      'WE_KNOW_OUR_PEOPLE'
    ];
    return sectionTypesWithBackground.includes(section.type || '');
  };

  // Check if section has image field
  const hasImage = (): boolean => {
    const sectionTypesWithImage = [
      'ABOUT',
      'SOLUTIONS_LIST',
      'LOCATION',
      'WHY_PERU',
      'TRAINING'
    ];
    return sectionTypesWithImage.includes(section.type || '');
  };

  // Handle media selection
  const handleMediaSelect = (file: MediaFile) => {
    if (!selectingFor) return;

    const { field, mode } = selectingFor;

    if (field === 'backgroundImage') {
      const currentBg = getBackgroundImage();
      
      if (mode === 'desktop' || mode === 'mobile') {
        // Responsive mode - update specific breakpoint
        const url = file.s3Key 
          ? `/api/media/download?key=${encodeURIComponent(file.s3Key)}&view=true`
          : file.fileUrl;
        
        const newBg: ResponsiveBackgroundImage = typeof currentBg === 'string'
          ? { desktop: currentBg }
          : (currentBg as ResponsiveBackgroundImage) || {};
        
        if (mode === 'desktop') {
          newBg.desktop = url;
        } else {
          newBg.mobile = url;
        }
        
        onChange({
          ...sectionData,
          backgroundImage: newBg
        });
        setBackgroundImageMode('responsive');
      } else {
        // Single mode - set desktop
        const url = file.s3Key 
          ? `/api/media/download?key=${encodeURIComponent(file.s3Key)}&view=true`
          : file.fileUrl;
        
        onChange({
          ...sectionData,
          backgroundImage: url
        });
        setBackgroundImageMode('single');
      }
    } else if (field === 'image') {
      // Single image selection
      const url = file.s3Key 
        ? `/api/media/download?key=${encodeURIComponent(file.s3Key)}&view=true`
        : file.fileUrl;
      
      onChange({
        ...sectionData,
        image: url
      });
    }

    setShowMediaSelector(false);
    setSelectingFor(null);
  };

  // Handle remove media
  const handleRemoveMedia = (field: string, mode?: 'desktop' | 'mobile') => {
    if (field === 'backgroundImage') {
      if (mode) {
        // Remove specific breakpoint
        const currentBg = getBackgroundImage();
        if (typeof currentBg === 'object' && currentBg !== null) {
          const newBg = { ...currentBg };
          if (mode === 'desktop') {
            delete newBg.desktop;
          } else {
            delete newBg.mobile;
          }
          
          // If both are empty, remove the field
          if (!newBg.desktop && !newBg.mobile) {
            const { backgroundImage, ...rest } = sectionData;
            onChange(rest);
          } else {
            onChange({
              ...sectionData,
              backgroundImage: newBg
            });
          }
        }
      } else {
        // Remove entire background image
        const { backgroundImage, ...rest } = sectionData;
        onChange(rest);
      }
    } else if (field === 'image') {
      const { image, ...rest } = sectionData;
      onChange(rest);
    }
  };

  // Get current background image mode
  useEffect(() => {
    const bgImage = getBackgroundImage();
    if (bgImage) {
      if (typeof bgImage === 'string') {
        setBackgroundImageMode('single');
      } else if (typeof bgImage === 'object' && bgImage !== null && (bgImage.mobile || bgImage.desktop)) {
        setBackgroundImageMode('responsive');
      }
    } else {
      // Default to responsive mode when no background image is set
      setBackgroundImageMode('responsive');
    }
  }, [sectionData.backgroundImage]);

  const currentBgImage = getBackgroundImage();
  const currentImage = getImage();

  return (
    <div className="space-y-6">
      {/* Background Image Editor */}
      {hasBackgroundImage() && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700">
              Background Image
            </label>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant={backgroundImageMode === 'single' ? 'default' : 'outline'}
                onClick={() => setBackgroundImageMode('single')}
              >
                Single
              </Button>
              <Button
                size="sm"
                variant={backgroundImageMode === 'responsive' ? 'default' : 'outline'}
                onClick={() => setBackgroundImageMode('responsive')}
              >
                Responsive
              </Button>
            </div>
          </div>

          {backgroundImageMode === 'single' ? (
            <div className="space-y-2">
              {currentBgImage && typeof currentBgImage === 'string' ? (
                <div className="relative group border-2 border-gray-200 rounded-lg overflow-hidden">
                  <div className="aspect-video bg-gray-100 flex items-center justify-center relative">
                    <S3FilePreview
                      src={currentBgImage}
                      alt="Background media"
                      fileName="background"
                      fileType={getFileType(currentBgImage)}
                      className="w-full h-full object-cover"
                      priority={false}
                    />
                    {/* Video badge indicator */}
                    {isVideoUrl(currentBgImage) && (
                      <div className="absolute top-2 left-2 z-10">
                        <Badge variant="default" className="bg-purple-600 text-white">
                          <Video className="h-3 w-3 mr-1" />
                          Video
                        </Badge>
                      </div>
                    )}
                  </div>
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleRemoveMedia('backgroundImage')}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectingFor({ field: 'backgroundImage' });
                    setShowMediaSelector(true);
                  }}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Select Background Image
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Desktop Background */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-600 flex items-center gap-2">
                  <Monitor className="h-4 w-4" />
                  Desktop
                </label>
                {currentBgImage && typeof currentBgImage === 'object' && currentBgImage.desktop ? (
                  <div className="relative group border-2 border-gray-200 rounded-lg overflow-hidden">
                    <div className="aspect-video bg-gray-100 flex items-center justify-center relative">
                      <S3FilePreview
                        src={currentBgImage.desktop}
                        alt="Desktop background"
                        fileName="background-desktop"
                        fileType={getFileType(currentBgImage.desktop)}
                        className="w-full h-full object-cover"
                        priority={false}
                      />
                      {/* Video badge indicator */}
                      {isVideoUrl(currentBgImage.desktop) && (
                        <div className="absolute top-2 left-2 z-10">
                          <Badge variant="default" className="bg-purple-600 text-white">
                            <Video className="h-3 w-3 mr-1" />
                            Video
                          </Badge>
                        </div>
                      )}
                    </div>
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleRemoveMedia('backgroundImage', 'desktop')}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectingFor({ field: 'backgroundImage', mode: 'desktop' });
                      setShowMediaSelector(true);
                    }}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Select Desktop Background
                  </Button>
                )}
              </div>

              {/* Mobile Background */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-600 flex items-center gap-2">
                  <Smartphone className="h-4 w-4" />
                  Mobile
                </label>
                {currentBgImage && typeof currentBgImage === 'object' && currentBgImage.mobile ? (
                  <div className="relative group border-2 border-gray-200 rounded-lg overflow-hidden">
                    <div className="aspect-video bg-gray-100 flex items-center justify-center relative">
                      <S3FilePreview
                        src={currentBgImage.mobile}
                        alt="Mobile background"
                        fileName="background-mobile"
                        fileType={getFileType(currentBgImage.mobile)}
                        className="w-full h-full object-cover"
                        priority={false}
                      />
                      {/* Video badge indicator */}
                      {isVideoUrl(currentBgImage.mobile) && (
                        <div className="absolute top-2 left-2 z-10">
                          <Badge variant="default" className="bg-purple-600 text-white">
                            <Video className="h-3 w-3 mr-1" />
                            Video
                          </Badge>
                        </div>
                      )}
                    </div>
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleRemoveMedia('backgroundImage', 'mobile')}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectingFor({ field: 'backgroundImage', mode: 'mobile' });
                      setShowMediaSelector(true);
                    }}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Select Mobile Background
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Image Editor */}
      {hasImage() && (
        <div className="space-y-4">
          <label className="block text-sm font-medium text-gray-700">Image</label>
          {currentImage ? (
            <div className="relative group border-2 border-gray-200 rounded-lg overflow-hidden">
              <div className="aspect-video bg-gray-100 flex items-center justify-center relative">
                <S3FilePreview
                  src={currentImage}
                  alt="Section image"
                  fileName="section-image"
                  fileType={getFileType(currentImage)}
                  className="w-full h-full object-cover"
                  priority={false}
                />
                {/* Video badge indicator */}
                {isVideoUrl(currentImage) && (
                  <div className="absolute top-2 left-2 z-10">
                    <Badge variant="default" className="bg-purple-600 text-white">
                      <Video className="h-3 w-3 mr-1" />
                      Video
                    </Badge>
                  </div>
                )}
              </div>
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleRemoveMedia('image')}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="outline"
              onClick={() => {
                setSelectingFor({ field: 'image' });
                setShowMediaSelector(true);
              }}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Select Image
            </Button>
          )}
        </div>
      )}

      {/* Media Selector Modal */}
      <MediaSelectorModal
        isOpen={showMediaSelector}
        onClose={() => {
          setShowMediaSelector(false);
          setSelectingFor(null);
        }}
        onSelect={handleMediaSelect}
        allowMultiple={false}
        title={selectingFor?.mode 
          ? `Select ${selectingFor.mode === 'desktop' ? 'Desktop' : 'Mobile'} Background (Image or Video)`
          : selectingFor?.field === 'image'
          ? 'Select Image or Video'
          : 'Select Background Image or Video'
        }
      />
    </div>
  );
}

