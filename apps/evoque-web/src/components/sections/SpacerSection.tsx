'use client';

import React from 'react';

export default function SpacerSection() {
  // Empty section that just takes up space - shared background is already fixed
  return (
    <section 
      id="spacer" 
      className="relative min-h-screen overflow-hidden"
      style={{ position: 'relative', zIndex: 1 }}
    >
      {/* No content - just space for the shared background to show through */}
    </section>
  );
}

