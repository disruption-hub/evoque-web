'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export interface PageAction {
  id: string;
  label: string;
  icon?: ReactNode;
  variant?: 'default' | 'outline' | 'ghost' | 'destructive';
  onClick: () => void;
  disabled?: boolean;
}

interface PageActionsContextType {
  actions: PageAction[];
  setActions: (actions: PageAction[]) => void;
  clearActions: () => void;
}

const PageActionsContext = createContext<PageActionsContextType | undefined>(undefined);

export function PageActionsProvider({ children }: { children: ReactNode }) {
  const [actions, setActions] = useState<PageAction[]>([]);

  const clearActions = useCallback(() => {
    setActions([]);
  }, []);

  return (
    <PageActionsContext.Provider value={{ actions, setActions, clearActions }}>
      {children}
    </PageActionsContext.Provider>
  );
}

export function usePageActions() {
  const context = useContext(PageActionsContext);
  if (context === undefined) {
    throw new Error('usePageActions must be used within a PageActionsProvider');
  }
  return context;
}

