'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface HeaderContextType {
  isHeaderVisible: boolean;
  setIsHeaderVisible: (visible: boolean) => void;
  hideHeader: () => void;
}

const HeaderContext = createContext<HeaderContextType | undefined>(undefined);

export function HeaderProvider({ children }: { children: ReactNode }) {
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);

  const hideHeader = useCallback(() => {
    // Only hide if currently visible
    setIsHeaderVisible((prev) => {
      if (prev) {
        return false;
      }
      return prev;
    });
  }, []);

  return (
    <HeaderContext.Provider value={{ isHeaderVisible, setIsHeaderVisible, hideHeader }}>
      {children}
    </HeaderContext.Provider>
  );
}

export function useHeader() {
  const context = useContext(HeaderContext);
  if (context === undefined) {
    throw new Error('useHeader must be used within a HeaderProvider');
  }
  return context;
}

