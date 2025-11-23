'use client';

import React from 'react';

interface MDXEditorProps {
  value?: string;
  onChange?: (value: string) => void;
  [key: string]: unknown;
}

export default function MDXEditor({ value = '', onChange, ...props }: MDXEditorProps) {
  return (
    <div className="p-4 border border-gray-200 rounded-lg">
      <p className="text-sm text-gray-500 mb-2">MDX Editor (Not implemented)</p>
      <textarea
        className="w-full h-64 font-mono text-sm border border-gray-300 rounded p-2"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        {...props}
      />
    </div>
  );
}
