import './globals.css';
import React from 'react';
import { AuthProvider } from '@/contexts/AuthContext';
import { Navigation } from '@/components/Navigation';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen font-sans antialiased bg-gray-50">
        <AuthProvider>
          <Navigation />
          <main className="max-w-7xl mx-auto">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}