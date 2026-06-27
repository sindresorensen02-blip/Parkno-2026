import React, { createContext, useContext, useState } from 'react';

// Shared parking-search query so the single SearchBar works whether it's the
// map's bar (closed list) or the list's editable bar (open list). Keeping the
// query here means it survives opening/closing the list overlay.
const SearchContext = createContext(null);

export function SearchProvider({ children }) {
  const [query, setQuery] = useState('');
  return (
    <SearchContext.Provider value={{ query, setQuery }}>
      {children}
    </SearchContext.Provider>
  );
}

export function useSearch() {
  const ctx = useContext(SearchContext);
  if (!ctx) throw new Error('useSearch must be used within SearchProvider');
  return ctx;
}
