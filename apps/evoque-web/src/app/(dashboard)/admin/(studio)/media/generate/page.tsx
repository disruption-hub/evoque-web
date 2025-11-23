'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Upload, X, Loader2, Image as ImageIcon, Video, Plus } from 'lucide-react';
import VideoStatus from '@/components/video/VideoStatus';
import VideoPreview from '@/components/video/VideoPreview';
import S3FilePreview from '@/components/shared/S3FilePreview';
import apiClient from '@/lib/api-client';
import { getBrandColor } from '@/config/brand-colors';

interface VideoGenerationState {
  operationId: string | null;
  status: 'idle' | 'generating' | 'processing' | 'completed' | 'failed';
  s3Key: string | null;
  videoUrl: string | null;
  error: string | null;
}

interface MediaFile {
  id: string;
  title: string;
  fileName: string;
  fileUrl: string;
  s3Key?: string;
  fileType: string;
  createdAt: string;
}

export default function GeneratePage() {
  const [prompt, setPrompt] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedMediaFile, setSelectedMediaFile] = useState<MediaFile | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isMediaDialogOpen, setIsMediaDialogOpen] = useState(false);
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [isLoadingMedia, setIsLoadingMedia] = useState(false);
  const [generationMode, setGenerationMode] = useState<'video' | 'image'>('video');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [videoState, setVideoState] = useState<VideoGenerationState>({
    operationId: null,
    status: 'idle',
    s3Key: null,
    videoUrl: null,
    error: null,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadMediaFiles = useCallback(async () => {
    setIsLoadingMedia(true);
    try {
      const data = await apiClient.get<{ mediaFiles: MediaFile[]; pagination?: any }>('/admin/media?fileType=image&limit=100');
      if (data && data.mediaFiles) {
        setMediaFiles(data.mediaFiles);
        console.log('Loaded media files:', data.mediaFiles.length);
      } else {
        console.warn('No mediaFiles in response:', data);
        setMediaFiles([]);
      }
    } catch (error) {
      console.error('Error loading media files:', error);
      setMediaFiles([]);
    } finally {
      setIsLoadingMedia(false);
    }
  }, []);

  useEffect(() => {
    loadMediaFiles();
  }, [loadMediaFiles]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert('Image size must be less than 10MB');
        return;
      }
      setImage(file);
      setSelectedMediaFile(null);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMediaFileSelect = (mediaFile: MediaFile) => {
    setSelectedMediaFile(mediaFile);
    setImage(null);
    setImagePreview(mediaFile.fileUrl);
    setIsMediaDialogOpen(false);
  };

  const handleRemoveImage = () => {
    setImage(null);
    setSelectedMediaFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      alert('Please enter a text prompt');
      return;
    }

    const isImageMode = generationMode === 'image';

    setIsGenerating(true);
    setGeneratedImage(null);
    if (isImageMode) {
      setVideoState({
        operationId: null,
        status: 'idle',
        s3Key: null,
        videoUrl: null,
        error: null,
      });
    } else {
      setVideoState({
        operationId: null,
        status: 'generating',
        s3Key: null,
        videoUrl: null,
        error: null,
      });
    }

    try {
      // Convert image to base64 if provided
      let imageBase64: string | undefined;
      let imageMimeType: string | undefined;

      if (selectedMediaFile) {
        // Use image from media library
        try {
          const response = await fetch(selectedMediaFile.fileUrl);
          const blob = await response.blob();
          const reader = new FileReader();
          imageBase64 = await new Promise<string>((resolve, reject) => {
            reader.onload = () => {
              const result = reader.result as string;
              resolve(result);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
          imageMimeType = selectedMediaFile.fileType;
        } catch (error) {
          console.error('Error loading image from media library:', error);
        }
      } else if (image) {
        // Use uploaded file
        const reader = new FileReader();
        imageBase64 = await new Promise<string>((resolve, reject) => {
          reader.onload = () => {
            const result = reader.result as string;
            resolve(result);
          };
          reader.onerror = reject;
          reader.readAsDataURL(image);
        });
        imageMimeType = image.type;
      }

      // Call generate API
      const response = await fetch('/api/video/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          image: imageBase64,
          imageMimeType,
          mode: generationMode,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        // Create error with additional information
        const error = new Error(errorData.error || 'Failed to generate video');
        (error as any).retryAfter = errorData.retryAfter;
        (error as any).actionable = errorData.actionable;
        (error as any).links = errorData.links;
        (error as any).code = response.status;
        
        throw error;
      }

      const data = await response.json();
      
      if (isImageMode) {
        if (data.image?.data) {
          const imageUrl = `data:${data.image.mimeType || 'image/png'};base64,${data.image.data}`;
          setGeneratedImage(imageUrl);
        }
        setVideoState({
          operationId: null,
          status: 'idle',
          s3Key: null,
          videoUrl: null,
          error: null,
        });
      } else {
        setVideoState({
          operationId: data.operationId,
          status: 'processing',
          s3Key: null,
          videoUrl: null,
          error: null,
        });
      }
    } catch (error) {
      console.error('Error generating media:', error);
      
      const actionLabel = isImageMode ? 'image' : 'video';
      let errorMessage = error instanceof Error ? error.message : `Failed to generate ${actionLabel}`;
      const errorObj = error as any;
      
      // Add retry information if available
      if (errorObj.retryAfter) {
        const seconds = errorObj.retryAfter;
        if (seconds < 60) {
          errorMessage += ` Please wait ${seconds} seconds before trying again.`;
        } else {
          const minutes = Math.ceil(seconds / 60);
          errorMessage += ` Please wait ${minutes} ${minutes === 1 ? 'minute' : 'minutes'} before trying again.`;
        }
      }
      
      setVideoState({
        operationId: null,
        status: 'failed',
        s3Key: null,
        videoUrl: null,
        error: errorMessage,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleStatusUpdate = (status: VideoGenerationState) => {
    setVideoState(status);
    
    // When video is completed, refresh media library
    if (status.status === 'completed' && status.videoUrl) {
      loadMediaFiles();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">AI Media Generator</h1>
        <p className="mt-2 text-gray-600">
          Create Veo video previews or Gemini images from a single prompt. Upload an image or select from your media library for additional guidance.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Form */}
        <Card>
          <CardHeader>
            <CardTitle>Generate Video or Image</CardTitle>
            <CardDescription>
              Enter a prompt and optionally upload or select an image
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="prompt">Text Prompt *</Label>
              <Textarea
                id="prompt"
                placeholder="Describe the video you want to create... (e.g., 'Panning wide shot of a calico kitten sleeping in the sunshine')"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={4}
                className="w-full"
              />
            </div>

            {/* Image Selection */}
            <div>
              <Label>Image (Optional)</Label>
              <div className="mt-2 space-y-2">
                {imagePreview ? (
                  <div className="relative">
                    {selectedMediaFile ? (
                      <div className="max-h-64 w-full rounded-lg border border-gray-200 overflow-hidden">
                        <S3FilePreview
                          src={selectedMediaFile.s3Key || selectedMediaFile.fileUrl}
                          alt={selectedMediaFile.title}
                          fileName={selectedMediaFile.fileName}
                          fileType={selectedMediaFile.fileType}
                          className="w-full max-h-64 object-contain"
                          disablePreviewModal={false}
                        />
                      </div>
                    ) : (
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="max-h-64 w-full object-contain rounded-lg border border-gray-200"
                      />
                    )}
                    <button
                      onClick={handleRemoveImage}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 z-10"
                    >
                      <X size={16} />
                    </button>
                    {selectedMediaFile && (
                      <div className="mt-2 text-sm text-gray-500">
                        From Media Library: {selectedMediaFile.title}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <div className="space-y-3">
                      <div className="flex justify-center gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                          className="flex items-center gap-2"
                        >
                          <Upload className="h-4 w-4" />
                          Upload Image
                        </Button>
                        <Dialog open={isMediaDialogOpen} onOpenChange={(open) => {
                          setIsMediaDialogOpen(open);
                          // Reload media files when dialog opens
                          if (open) {
                            loadMediaFiles();
                          }
                        }}>
                          <DialogTrigger asChild>
                            <Button
                              type="button"
                              variant="outline"
                              className="flex items-center gap-2"
                            >
                              <ImageIcon className="h-4 w-4" />
                              From Media Library
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Select Image from Media Library</DialogTitle>
                              <DialogDescription>
                                Choose an image from your media library to use for video generation
                              </DialogDescription>
                            </DialogHeader>
                            <div className="flex justify-end mb-4">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={loadMediaFiles}
                                disabled={isLoadingMedia}
                                className="flex items-center gap-2"
                              >
                                {isLoadingMedia ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <ImageIcon className="h-4 w-4" />
                                )}
                                Refresh
                              </Button>
                            </div>
                            {isLoadingMedia ? (
                              <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                                <span className="ml-2 text-gray-600">Loading images...</span>
                              </div>
                            ) : mediaFiles.length === 0 ? (
                              <div className="text-center py-8 text-gray-500">
                                <ImageIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                                <p className="font-medium">No images found in media library</p>
                                <p className="text-sm mt-1">Upload images to your media library first</p>
                              </div>
                            ) : (
                              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {mediaFiles.map((file) => (
                                  <div
                                    key={file.id}
                                    className={`relative cursor-pointer rounded-lg border-2 overflow-hidden transition-all ${
                                      selectedMediaFile?.id === file.id
                                        ? 'border-green-500 ring-2 ring-green-200'
                                        : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                    onClick={() => handleMediaFileSelect(file)}
                                  >
                                    <div className="w-full h-32 bg-gray-100">
                                      <S3FilePreview
                                        src={file.s3Key || file.fileUrl}
                                        alt={file.title}
                                        fileName={file.fileName}
                                        fileType={file.fileType}
                                        className="w-full h-32 object-cover"
                                        priority={false}
                                        disablePreviewModal={true}
                                      />
                                    </div>
                                    <div className="p-2 bg-white">
                                      <p className="text-xs text-gray-600 truncate">{file.title}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                      </div>
                      <p className="text-sm text-gray-500">
                        Upload a new image or select from your media library
                      </p>
                    </div>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
              </div>
            </div>

            {/* Generation Mode */}
            <div className="space-y-2">
              <Label>Generation Mode</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={generationMode === 'video' ? 'default' : 'outline'}
                  onClick={() => {
                    setGenerationMode('video');
                    setGeneratedImage(null);
                  }}
                  className="w-full"
                >
                  <Video className="mr-2 h-4 w-4" />
                  Video
                </Button>
                <Button
                  type="button"
                  variant={generationMode === 'image' ? 'default' : 'outline'}
                  onClick={() => setGenerationMode('image')}
                  className="w-full"
                >
                  <ImageIcon className="mr-2 h-4 w-4" />
                  Image
                </Button>
              </div>
              <p className="text-xs text-gray-500">
                Video uses Veo 3.1 preview. Image uses Gemini 2.5 Flash Preview Image.
              </p>
            </div>

            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              className="w-full"
              style={{
                backgroundColor: getBrandColor('accentElectricBlue'),
                color: getBrandColor('black'),
              }}
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  {generationMode === 'video' ? (
                    <>
                      <Video className="mr-2 h-4 w-4" />
                      Generate Video
                    </>
                  ) : (
                    <>
                      <ImageIcon className="mr-2 h-4 w-4" />
                      Generate Image
                    </>
                  )}
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Video Status and Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Generation Status</CardTitle>
            <CardDescription>
              Monitor your current video jobs or view generated images
            </CardDescription>
          </CardHeader>
          <CardContent>
            {videoState.operationId && (
              <div className="space-y-4">
                <VideoStatus
                  operationId={videoState.operationId}
                  onStatusUpdate={handleStatusUpdate}
                />
              </div>
            )}

            {videoState.status === 'completed' && videoState.videoUrl && (
              <div className="mt-4 space-y-4">
                <VideoPreview videoUrl={videoState.videoUrl} />
                <div className="flex gap-2">
                  <Button
                    asChild
                    variant="outline"
                    style={{
                      borderColor: getBrandColor('greenAccent'),
                      color: getBrandColor('greenAccent'),
                    }}
                    className="flex-1"
                  >
                    <a href={videoState.videoUrl} download>
                      Download Video
                    </a>
                  </Button>
                </div>
              </div>
            )}

            {generatedImage && (
              <div className="mt-4 space-y-4">
                <div className="rounded-lg border border-gray-200 bg-white p-4">
                  <p className="text-sm font-semibold text-gray-700 mb-2">Generated Image</p>
                  <img
                    src={generatedImage}
                    alt="Generated result"
                    className="w-full rounded-lg border border-gray-100 object-contain"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    asChild
                    variant="outline"
                    style={{
                      borderColor: getBrandColor('greenAccent'),
                      color: getBrandColor('greenAccent'),
                    }}
                    className="flex-1"
                  >
                    <a href={generatedImage} download={`generated-image-${Date.now()}.png`}>
                      Download Image
                    </a>
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setGeneratedImage(null)}
                  >
                    Clear Image
                  </Button>
                </div>
              </div>
            )}

            {videoState.status === 'failed' && videoState.error && (
              <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800 font-semibold">Error:</p>
                <p className="text-red-600">{videoState.error}</p>
              </div>
            )}

            {videoState.status === 'idle' && !generatedImage && (
              <div className="text-center py-8 text-gray-500">
                <Video className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>No video generation in progress</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

