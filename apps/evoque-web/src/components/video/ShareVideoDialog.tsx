'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Share2, Mail, Copy, Check } from 'lucide-react';
import { getBrandColor } from '@/config/brand-colors';

interface ShareVideoDialogProps {
  s3Key: string;
  videoUrl: string;
}

export default function ShareVideoDialog({ s3Key, videoUrl }: ShareVideoDialogProps) {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [isLinkCopied, setIsLinkCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleShare = async () => {
    if (!email.trim()) {
      setError('Please enter an email address');
      return;
    }

    setIsSending(true);
    setError(null);

    try {
      const response = await fetch('/api/video/share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          s3Key,
          message: message.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to share video');
      }

      setIsSent(true);
      setTimeout(() => {
        setIsSent(false);
        setEmail('');
        setMessage('');
      }, 3000);
    } catch (error) {
      console.error('Error sharing video:', error);
      setError(error instanceof Error ? error.message : 'Failed to share video');
    } finally {
      setIsSending(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(videoUrl);
    setIsLinkCopied(true);
    setTimeout(() => setIsLinkCopied(false), 2000);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          style={{
            backgroundColor: getBrandColor('greenAccent'),
            color: getBrandColor('white'),
          }}
        >
          <Share2 className="mr-2 h-4 w-4" />
          Share Video
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Your Video</DialogTitle>
          <DialogDescription>
            Share your generated video via email or copy the link.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {/* Email Share */}
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="recipient@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSending || isSent}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message (Optional)</Label>
            <Textarea
              id="message"
              placeholder="Add a personal message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              disabled={isSending || isSent}
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded p-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {isSent && (
            <div className="bg-green-50 border border-green-200 rounded p-3">
              <p className="text-sm text-green-800 flex items-center gap-2">
                <Check className="h-4 w-4" />
                Email sent successfully!
              </p>
            </div>
          )}

          <Button
            onClick={handleShare}
            disabled={isSending || isSent || !email.trim()}
            className="w-full"
            style={{
              backgroundColor: getBrandColor('accentOrange'),
              color: getBrandColor('black'),
            }}
          >
            {isSending ? (
              <>
                <Mail className="mr-2 h-4 w-4 animate-pulse" />
                Sending...
              </>
            ) : (
              <>
                <Mail className="mr-2 h-4 w-4" />
                Send Email
              </>
            )}
          </Button>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-500">Or</span>
            </div>
          </div>

          {/* Copy Link */}
          <div className="space-y-2">
            <Label>Video Link</Label>
            <div className="flex gap-2">
              <Input
                value={videoUrl}
                readOnly
                className="flex-1 font-mono text-sm"
              />
              <Button
                onClick={handleCopyLink}
                variant="outline"
                size="icon"
              >
                {isLinkCopied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            {isLinkCopied && (
              <p className="text-sm text-green-600">Link copied to clipboard!</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

