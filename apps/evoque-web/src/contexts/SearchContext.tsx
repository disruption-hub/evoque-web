'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface SearchContextType {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  placeholder: string;
  setPlaceholder: (placeholder: string) => void;
  clearSearch: () => void;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export function SearchProvider({ children }: { children: ReactNode }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [placeholder, setPlaceholder] = useState('Search...');

  const clearSearch = useCallback(() => {
    setSearchTerm('');
  }, []);

  return (
    <SearchContext.Provider value={{ searchTerm, setSearchTerm, placeholder, setPlaceholder, clearSearch }}>
      {children}
    </SearchContext.Provider>
  );
}

export function useSearch() {
  const context = useContext(SearchContext);
  if (context === undefined) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
}

