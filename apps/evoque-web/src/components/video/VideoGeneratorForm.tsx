'use client';

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Upload, X, Loader2 } from 'lucide-react';
import VideoStatus from './VideoStatus';
import VideoPreview from './VideoPreview';
import ShareVideoDialog from './ShareVideoDialog';
import { getBrandColor } from '@/config/brand-colors';

interface VideoGenerationState {
  operationId: string | null;
  status: 'idle' | 'generating' | 'processing' | 'completed' | 'failed';
  s3Key: string | null;
  videoUrl: string | null;
  error: string | null;
}

export default function VideoGeneratorForm() {
  const [prompt, setPrompt] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
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
    <div className="space-y-8">
      {/* Image Upload Section */}
      <div>
        <Label htmlFor="image-upload" className="text-lg font-semibold mb-2 block">
          Upload Image (Optional)
        </Label>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
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
            <div>
              <Upload className="mx-auto mb-4 text-gray-400" size={48} />
              <p className="text-gray-600 mb-4">
                Drag and drop an image here, or click to select
              </p>
              <input
                ref={fileInputRef}
                id="image-upload"
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
              >
                Select Image
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Text Prompt Section */}
      <div>
        <Label htmlFor="prompt" className="text-lg font-semibold mb-2 block">
          Text Prompt <span className="text-red-500">*</span>
        </Label>
        <Textarea
          id="prompt"
          placeholder="Describe the video you want to create... (e.g., 'Panning wide shot of a calico kitten sleeping in the sunshine')"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={6}
          className="w-full"
        />
        <p className="text-sm text-gray-500 mt-2">
          {prompt.length} characters
        </p>
      </div>

      {/* Generate Button */}
      <Button
        onClick={handleGenerate}
        disabled={isGenerating || !prompt.trim()}
        className="w-full"
        style={{
          backgroundColor: getBrandColor('accentOrange'),
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
          'Generate Video'
        )}
      </Button>

      {/* Video Status */}
      {videoState.operationId && (
        <VideoStatus
          operationId={videoState.operationId}
          onStatusUpdate={handleStatusUpdate}
        />
      )}

      {/* Video Preview */}
      {videoState.status === 'completed' && videoState.videoUrl && (
        <div className="space-y-4">
          <VideoPreview videoUrl={videoState.videoUrl} />
          <div className="flex gap-4">
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
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 font-semibold">Error:</p>
          <p className="text-red-600">{videoState.error}</p>
        </div>
      )}
    </div>
  );
}

