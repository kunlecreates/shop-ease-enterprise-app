'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useCartStore } from '@/lib/cart-store';

export function Navigation() {
  const { user, isAuthenticated, logout } = useAuth();
  const itemCount = useCartStore((state) => state.getItemCount());

  return (
    <nav className="bg-white/95 border-b border-gray-100 sticky top-0 z-50 backdrop-blur-xl shadow-sm">
      <div className="max-w-7xl mx-auto px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center space-x-12">
            <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-luxury-500 to-luxury-700 bg-clip-text text-transparent tracking-tight hover:opacity-80 transition-opacity">
              ShopEase
            </Link>
            <Link href="/products" className="text-[15px] font-medium text-gray-600 hover:text-luxury-600 transition-colors tracking-wide">
              Products
            </Link>
            {isAuthenticated && user?.role === 'ADMIN' && (
              <Link href="/admin" className="text-[15px] font-medium text-gray-600 hover:text-luxury-600 transition-colors tracking-wide">
                Admin
              </Link>
            )}
          </div>
          
          <div className="flex items-center space-x-6">
            <Link href="/cart" className="relative flex items-center text-gray-600 hover:text-luxury-600 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {itemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-luxury-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </Link>

            {isAuthenticated ? (
              <>
                <Link href="/orders" className="text-sm font-medium text-gray-600 hover:text-luxury-600 transition-colors">
                  Orders
                </Link>
                <Link href="/profile" className="text-sm font-medium text-gray-600 hover:text-luxury-600 transition-colors">
                  Profile
                </Link>
                <button
                  onClick={logout}
                  className="px-5 py-2 text-sm font-semibold text-gray-700 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="px-5 py-2 text-sm font-semibold text-gray-700 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-all">
                  Login
                </Link>
                <Link href="/register" className="px-5 py-2 text-sm font-semibold text-white bg-luxury-500 hover:bg-luxury-600 rounded-lg shadow-luxury hover:shadow-luxury-lg transition-all">
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
