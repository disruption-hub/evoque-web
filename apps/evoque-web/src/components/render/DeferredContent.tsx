'use client';

import React, { startTransition, useEffect, useState } from 'react';

interface DeferredContentProps {
  children: React.ReactNode;
  delay?: number; // Delay in milliseconds before rendering
}

/**
 * Component that defers rendering of children to allow priority content (like background video) to load first
 */
export default function DeferredContent({ children, delay = 50 }: DeferredContentProps) {
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    // Small delay to ensure video starts loading first
    const timer = setTimeout(() => {
      // Use startTransition to defer rendering as low priority
      startTransition(() => {
        setShouldRender(true);
      });
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  if (!shouldRender) {
    return null;
  }

  return <>{children}</>;
}

