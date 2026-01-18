'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useCartStore } from '@/lib/cart-store';
import { Button } from './ui/Button';

export function Navigation() {
  const { user, isAuthenticated, logout } = useAuth();
  const itemCount = useCartStore((state) => state.getItemCount());

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex space-x-8">
            <Link href="/" className="flex items-center text-xl font-bold text-blue-600">
              ShopEase
            </Link>
            <Link href="/products" className="flex items-center text-gray-700 hover:text-blue-600">
              Products
            </Link>
            {isAuthenticated && user?.role === 'ADMIN' && (
              <Link href="/admin" className="flex items-center text-gray-700 hover:text-blue-600">
                Admin
              </Link>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            <Link href="/cart" className="relative flex items-center text-gray-700 hover:text-blue-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {itemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </Link>
            
            {isAuthenticated ? (
              <>
                <Link href="/profile" className="text-gray-700 hover:text-blue-600">
                  {user?.username}
                </Link>
                <Button variant="ghost" size="sm" onClick={logout}>
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm">Login</Button>
                </Link>
                <Link href="/register">
                  <Button variant="primary" size="sm">Register</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
