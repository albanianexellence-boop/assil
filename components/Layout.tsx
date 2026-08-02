import React from 'react';
import { useGlobalSearch } from '../context/GlobalSearchContext';
import DexSearchModal from './DexSearchModal';

export const Layout = ({ children }: { children: React.ReactNode }) => {
  const { isSearchOpen, closeSearch } = useGlobalSearch();

  return (
    <div style={{ minHeight: '100vh', background: '#0b0e11' }}>
      {children}
      <DexSearchModal isOpen={isSearchOpen} onClose={closeSearch} />
    </div>
  );
};
