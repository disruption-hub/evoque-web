'use client';

import React from 'react';

interface VideoPreviewProps {
  videoUrl: string;
}

export default function VideoPreview({ videoUrl }: VideoPreviewProps) {
  return (
    <div className="bg-gray-900 rounded-lg overflow-hidden">
      <video
        src={videoUrl}
        controls
        className="w-full h-auto"
        style={{ maxHeight: '600px' }}
      >
        Your browser does not support the video tag.
      </video>
    </div>
  );
}

