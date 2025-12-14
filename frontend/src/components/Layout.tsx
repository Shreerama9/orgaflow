/**
 * Layout - Wrapper component that includes Navbar and main content area.
 * Used for authenticated pages.
 */

import React from 'react';
import { Navbar } from './Navbar';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-surface-50">
      <Navbar />
      <main>{children}</main>
    </div>
  );
};
