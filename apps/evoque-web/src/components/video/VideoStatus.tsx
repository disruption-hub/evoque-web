'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Loader2, CheckCircle2, XCircle, Library, Plus } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

interface VideoStatusProps {
  operationId: string;
  onStatusUpdate: (status: any) => void;
}

export default function VideoStatus({ operationId, onStatusUpdate }: VideoStatusProps) {
  const [status, setStatus] = useState<'processing' | 'completed' | 'failed'>('processing');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!operationId) return;

    let isPolling = true;

    const pollStatus = async () => {
      if (!isPolling) return;

      try {
        const response = await fetch(`/api/video/status/${operationId}`);
        
        if (!response.ok) {
          throw new Error('Failed to check status');
        }

        const data = await response.json();

        if (data.status === 'completed') {
          // Stop all polling
          isPolling = false;
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
          }

          setStatus('completed');
          setProgress(100);
          setVideoUrl(data.videoUrl);
          onStatusUpdate({
            operationId,
            status: 'completed',
            s3Key: data.s3Key,
            videoUrl: data.videoUrl,
            error: null,
          });
        } else if (data.status === 'failed') {
          // Stop all polling
          isPolling = false;
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
          }

          setStatus('failed');
          setError(data.error || 'Video generation failed');
          onStatusUpdate({
            operationId,
            status: 'failed',
            s3Key: null,
            videoUrl: null,
            error: data.error || 'Video generation failed',
          });
        } else {
          // Still processing - update progress (simplified, could be more sophisticated)
          setProgress((prev) => Math.min(prev + 10, 90));
          // Schedule next poll only if still polling
          if (isPolling) {
            timeoutRef.current = setTimeout(pollStatus, 10000);
          }
        }
      } catch (error) {
        console.error('Error polling status:', error);
        
        // Stop all polling on error
        isPolling = false;
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }

        setStatus('failed');
        setError(error instanceof Error ? error.message : 'Failed to check status');
        onStatusUpdate({
          operationId,
          status: 'failed',
          s3Key: null,
          videoUrl: null,
          error: error instanceof Error ? error.message : 'Failed to check status',
        });
      }
    };

    // Start polling
    pollStatus();

    // Poll every 10 seconds as backup (will be cleared when completed/failed)
    intervalRef.current = setInterval(() => {
      if (isPolling) {
        pollStatus();
      }
    }, 10000);

    return () => {
      isPolling = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [operationId, onStatusUpdate]);

  const handleViewLibrary = () => {
    router.push('/admin/media?fileType=video');
  };

  const handleContinueGenerating = () => {
    // Reset state by calling onStatusUpdate with idle state
    onStatusUpdate({
      operationId: null,
      status: 'idle',
      s3Key: null,
      videoUrl: null,
      error: null,
    });
    // Scroll to top of form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="bg-gray-50 rounded-lg p-6 space-y-4">
      <div className="flex items-center gap-3">
        {status === 'processing' && (
          <>
            <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
            <div className="flex-1">
              <p className="font-semibold">Generating your video...</p>
              <p className="text-sm text-gray-600">This may take a few minutes</p>
            </div>
          </>
        )}
        {status === 'completed' && (
          <>
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            <div className="flex-1">
              <p className="font-semibold text-green-700">Video Generated Successfully!</p>
              <p className="text-sm text-gray-600">Your video is ready to view</p>
            </div>
          </>
        )}
        {status === 'failed' && (
          <>
            <XCircle className="h-5 w-5 text-red-500" />
            <p className="font-semibold text-red-700">Video generation failed</p>
          </>
        )}
      </div>

      {status === 'processing' && (
        <div className="space-y-2">
          <Progress value={progress} className="w-full" />
          <p className="text-sm text-gray-600 text-center">{progress}%</p>
        </div>
      )}

      {status === 'completed' && (
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-800 font-medium mb-2">
              🎉 Your video has been generated and saved to your library!
            </p>
            <p className="text-xs text-green-700">
              You can preview it in your media library. For the best viewing experience, please use the "View in library" option.
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={handleViewLibrary}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            >
              <Library className="h-4 w-4 mr-2" />
              View in Library
            </Button>
            <Button
              onClick={handleContinueGenerating}
              variant="outline"
              className="flex-1"
            >
              <Plus className="h-4 w-4 mr-2" />
              Continue Generating
            </Button>
          </div>
        </div>
      )}

      {status === 'failed' && error && (
        <div className="bg-red-50 border border-red-200 rounded p-3">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}
    </div>
  );
}

