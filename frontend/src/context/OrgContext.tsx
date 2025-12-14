
import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { Organization } from '../types';

interface OrgContextType {
  currentOrg: Organization | null;
  setCurrentOrg: (org: Organization | null) => void;
}

const OrgContext = createContext<OrgContextType | null>(null);

export const useOrg = () => {
  const context = useContext(OrgContext);
  if (!context) {
    throw new Error('useOrg must be used within OrgProvider');
  }
  return context;
};

interface OrgProviderProps {
  children: ReactNode;
}

export const OrgProvider: React.FC<OrgProviderProps> = ({ children }) => {
  const [currentOrg, setCurrentOrg] = useState<Organization | null>(null);

  return (
    <OrgContext.Provider value={{ currentOrg, setCurrentOrg }}>
      {children}
    </OrgContext.Provider>
  );
};
