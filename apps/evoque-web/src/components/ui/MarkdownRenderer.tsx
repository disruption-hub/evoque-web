import React from 'react';
import ReactMarkdown from 'react-markdown';
import Image from 'next/image';
import { getBrandColor } from '@/config/brand-colors';

interface MarkdownRendererProps {
  content?: string;
  className?: string;
}

export function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  if (!content) {
    return null;
  }

  return (
    <div className={className}>
      <ReactMarkdown
        components={{
        // Customize headings with brand colors - reduced for mobile
        h1: ({ children }) => (
          <h1 
            className="text-2xl md:text-4xl lg:text-5xl"
            style={{ 
              color: getBrandColor('deepNavy'),
              fontWeight: 'bold',
              marginTop: '1rem',
              marginBottom: '0.75rem'
            }}
          >
            {children}
          </h1>
        ),
        h2: ({ children }) => (
          <h2 
            className="text-xl md:text-3xl lg:text-4xl"
            style={{ 
              color: getBrandColor('deepNavy'),
              fontWeight: '600',
              marginTop: '1rem',
              marginBottom: '0.5rem'
            }}
          >
            {children}
          </h2>
        ),
        h3: ({ children }) => (
          <h3 
            className="text-lg md:text-2xl lg:text-3xl"
            style={{ 
              color: getBrandColor('deepNavy'),
              fontWeight: '600',
              marginTop: '0.75rem',
              marginBottom: '0.5rem'
            }}
          >
            {children}
          </h3>
        ),
        // Customize paragraphs - reduced for mobile
        p: ({ children }) => (
          <p 
            className="text-sm md:text-base lg:text-lg"
            style={{ 
              color: '#4a4a4a',
              lineHeight: '1.6',
              marginBottom: '0.75rem'
            }}
          >
            {children}
          </p>
        ),
        // Customize links
        a: ({ href, children }) => (
          <a
            href={href}
            style={{
              color: getBrandColor('secondaryBlue'),
              textDecoration: 'underline',
              transition: 'color 0.3s ease'
            }}
            className="mdx-link"
          >
            {children}
          </a>
        ),
        // Customize images with Next.js Image component
        img: (props: any) => {
          const { src, alt, width, height } = props;
          if (!src || typeof src !== 'string') return null;
          // Extract numeric width/height from props
          const imgWidth = typeof width === 'number' ? width : typeof width === 'string' ? parseInt(width) || 800 : 800;
          const imgHeight = typeof height === 'number' ? height : typeof height === 'string' ? parseInt(height) || 600 : 600;
          return (
            <Image
              src={src}
              alt={alt || ''}
              width={imgWidth}
              height={imgHeight}
              sizes="100vw"
              style={{ width: '100%', height: 'auto', borderRadius: '0.5rem', margin: '1rem 0' }}
            />
          );
        },
        // Customize lists
        ul: ({ children }) => (
          <ul style={{ marginLeft: '1.5rem', marginBottom: '1rem', color: '#4a4a4a' }}>
            {children}
          </ul>
        ),
        ol: ({ children }) => (
          <ol style={{ marginLeft: '1.5rem', marginBottom: '1rem', color: '#4a4a4a' }}>
            {children}
          </ol>
        ),
        li: ({ children }) => (
          <li style={{ marginBottom: '0.5rem', lineHeight: '1.6' }}>
            {children}
          </li>
        ),
        // Customize blockquotes
        blockquote: ({ children }) => (
          <blockquote
            style={{
              borderLeft: `4px solid ${getBrandColor('accentOrange')}`,
              paddingLeft: '1rem',
              margin: '1rem 0',
              fontStyle: 'italic',
              color: '#666'
            }}
          >
            {children}
          </blockquote>
        ),
        // Customize code blocks
        code: ({ children, className }) => {
          const isInline = !className;
          return isInline ? (
            <code
              style={{
                backgroundColor: '#f3f4f6',
                padding: '0.2rem 0.4rem',
                borderRadius: '0.25rem',
                fontSize: '0.9em',
                fontFamily: 'monospace'
              }}
            >
              {children}
            </code>
          ) : (
            <code className={className}>{children}</code>
          );
        },
        // Customize tables
        table: ({ children }) => (
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              margin: '1rem 0'
            }}
          >
            {children}
          </table>
        ),
        th: ({ children }) => (
          <th
            style={{
              backgroundColor: getBrandColor('deepNavy'),
              color: getBrandColor('white'),
              padding: '0.75rem',
              textAlign: 'left',
              border: `1px solid ${getBrandColor('deepNavy')}`
            }}
          >
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td
            style={{
              padding: '0.75rem',
              border: '1px solid #e5e7eb'
            }}
          >
            {children}
          </td>
        ),
      }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

