'use client';

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Plus, X, Upload, Loader2 } from 'lucide-react';
import { getBrandColor } from '@/config/brand-colors';
import VideoStatus from './VideoStatus';
import VideoPreview from './VideoPreview';
import ShareVideoDialog from './ShareVideoDialog';

interface VideoGenerationState {
  operationId: string | null;
  status: 'idle' | 'generating' | 'processing' | 'completed' | 'failed';
  s3Key: string | null;
  videoUrl: string | null;
  error: string | null;
}

export default function HeroVideoGenerator() {
  const [prompt, setPrompt] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [videoState, setVideoState] = useState<VideoGenerationState>({
    operationId: null,
    status: 'idle',
    s3Key: null,
    videoUrl: null,
    error: null,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert('Image size must be less than 10MB');
        return;
      }
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImage(null);
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

    setIsGenerating(true);
    setVideoState({
      operationId: null,
      status: 'generating',
      s3Key: null,
      videoUrl: null,
      error: null,
    });

    try {
      // Convert image to base64 if provided
      let imageBase64: string | undefined;
      let imageMimeType: string | undefined;

      if (image) {
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
      setVideoState({
        operationId: data.operationId,
        status: 'processing',
        s3Key: null,
        videoUrl: null,
        error: null,
      });
    } catch (error) {
      console.error('Error generating video:', error);
      
      let errorMessage = error instanceof Error ? error.message : 'Failed to generate video';
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
  };

  return (
    <div className="w-full max-w-2xl mx-auto mt-8">
      {/* Input Section */}
      <div className="flex gap-2 items-start">
        <div className="flex-1">
          <Textarea
            placeholder="Describe the video you want to create..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
            className="w-full resize-none"
            style={{
              borderColor: getBrandColor('greenAccent'),
              color: '#000000',
            }}
          />
        </div>
        <Button
          type="button"
          size="icon"
          className="flex-shrink-0"
          onClick={() => setIsDialogOpen(true)}
          style={{
            backgroundColor: getBrandColor('greenAccent'),
            color: getBrandColor('white'),
          }}
        >
          <Plus className="h-5 w-5" />
        </Button>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent
            className="max-w-md"
            style={{
              backgroundColor: getBrandColor('white'),
              borderColor: getBrandColor('greenAccent'),
              borderWidth: '2px',
            }}
          >
            <DialogHeader>
              <DialogTitle style={{ color: getBrandColor('greenAccent') }}>
                Upload Image
              </DialogTitle>
              <DialogDescription style={{ color: '#000000' }}>
                Add an image to enhance your video generation (optional)
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {imagePreview ? (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="max-h-64 mx-auto rounded-lg mb-4"
                  />
                  <button
                    onClick={handleRemoveImage}
                    className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-2 hover:bg-red-600"
                  >
                    <X size={20} />
                  </button>
                </div>
              ) : (
                <div
                  className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:opacity-70 transition-opacity"
                  style={{ borderColor: getBrandColor('greenAccent') }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload
                    className="mx-auto mb-4"
                    style={{ color: getBrandColor('greenAccent') }}
                    size={48}
                  />
                  <p style={{ color: '#000000' }} className="mb-4">
                    Click to select an image
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
        <Button
          onClick={handleGenerate}
          disabled={isGenerating || !prompt.trim()}
          className="flex-shrink-0"
          style={{
            backgroundColor: getBrandColor('accentOrange'),
            color: getBrandColor('black'),
          }}
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            'Generate'
          )}
        </Button>
      </div>

      {/* Video Status */}
      {videoState.operationId && (
        <div className="mt-6">
          <VideoStatus
            operationId={videoState.operationId}
            onStatusUpdate={handleStatusUpdate}
          />
        </div>
      )}

      {/* Video Preview */}
      {videoState.status === 'completed' && videoState.videoUrl && (
        <div className="mt-6 space-y-4">
          <VideoPreview videoUrl={videoState.videoUrl} />
          <div className="flex gap-4 justify-center">
            <Button
              asChild
              variant="outline"
              style={{
                borderColor: getBrandColor('greenAccent'),
                color: getBrandColor('greenAccent'),
              }}
            >
              <a href={videoState.videoUrl} download>
                Download Video
              </a>
            </Button>
            {videoState.s3Key && (
              <ShareVideoDialog s3Key={videoState.s3Key} videoUrl={videoState.videoUrl} />
            )}
          </div>
        </div>
      )}

      {/* Error Message */}
      {videoState.status === 'failed' && videoState.error && (
        <div
          className="mt-6 border rounded-lg p-4"
          style={{
            backgroundColor: '#fee2e2',
            borderColor: '#ef4444',
          }}
        >
          <p style={{ color: '#991b1b', fontWeight: 'bold' }}>Error:</p>
          <p style={{ color: '#dc2626' }}>{videoState.error}</p>
        </div>
      )}
    </div>
  );
}

