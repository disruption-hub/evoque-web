'use client';

import React from 'react';
import { Geist, Geist_Mono } from 'next/font/google';
import { HeaderProvider } from '@/contexts/HeaderContext';
import { AuthProvider } from '@/contexts/AuthContext';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

interface PreviewLayoutProps {
  children: React.ReactNode;
}

export default function PreviewLayout({ children }: PreviewLayoutProps) {
  return (
    <div 
      className="preview-layout-wrapper"
      style={{
        // Mimic html element
        width: '100%',
        height: '100%',
        minHeight: '100%',
        overflowX: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
      }}
    >
      <div
        className={`${geistSans.variable} ${geistMono.variable} antialiased overflow-x-hidden w-full h-full`}
        style={{
          // Mimic body element
          width: '100%',
          height: '100%',
          minHeight: '100%',
          overflowX: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
        }}
      >
        <AuthProvider>
          <HeaderProvider>
            {children}
          </HeaderProvider>
        </AuthProvider>
      </div>
    </div>
  );
}

