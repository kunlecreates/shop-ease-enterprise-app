import './globals.css';
import React from 'react';
import { AuthProvider } from '@/contexts/AuthContext';
import { Navigation } from '@/components/Navigation';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    template: '%s | ShopEase',
    default: 'ShopEase - Premium Shopping Experience',
  },
  description: 'Experience luxury shopping with curated collections',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{
        minHeight: '100vh',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        margin: 0,
        padding: 0,
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale'
      }}>
        <AuthProvider>
          <Navigation />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}