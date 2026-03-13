'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useCartStore } from '@/lib/cart-store';
import { ThemeToggle } from './theme-toggle';

export function Navigation() {
  const { user, isAuthenticated, logout } = useAuth();
  const itemCount = useCartStore((state) => state.getItemCount());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <nav className="bg-white/95 dark:bg-gray-900/95 border-b border-gray-100 dark:border-gray-800 sticky top-0 z-50 backdrop-blur-xl shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        {/* Desktop + mobile header row */}
        <div className="flex justify-between items-center h-16 sm:h-20">

          {/* Left: logo + desktop nav links */}
          <div className="flex items-center space-x-8 sm:space-x-12">
            <Link
              href="/"
              onClick={closeMobileMenu}
              className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-luxury-500 to-luxury-700 dark:from-luxury-400 dark:to-luxury-600 bg-clip-text text-transparent tracking-tight hover:opacity-80 transition-opacity"
            >
              ShopEase
            </Link>

            {/* Desktop-only links */}
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/products" className="text-[15px] font-medium text-gray-600 dark:text-gray-300 hover:text-luxury-600 dark:hover:text-luxury-400 transition-colors tracking-wide">
                Products
              </Link>
              {isAuthenticated && user?.role === 'ADMIN' && (
                <Link href="/admin" className="text-[15px] font-medium text-gray-600 dark:text-gray-300 hover:text-luxury-600 dark:hover:text-luxury-400 transition-colors tracking-wide">
                  Admin
                </Link>
              )}
            </div>
          </div>

          {/* Right: theme toggle, cart, desktop auth links, mobile hamburger */}
          <div className="flex items-center space-x-3 sm:space-x-6">
            <ThemeToggle />

            {/* Cart icon — always visible */}
            <Link href="/cart" onClick={closeMobileMenu} className="relative flex items-center text-gray-600 dark:text-gray-300 hover:text-luxury-600 dark:hover:text-luxury-400 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {itemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-luxury-500 dark:bg-luxury-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </Link>

            {/* Desktop-only auth links */}
            <div className="hidden md:flex items-center space-x-4">
              {isAuthenticated ? (
                <>
                  <Link href="/orders" className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-luxury-600 dark:hover:text-luxury-400 transition-colors">
                    Orders
                  </Link>
                  <Link href="/profile" className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-luxury-600 dark:hover:text-luxury-400 transition-colors">
                    Profile
                  </Link>
                  <button
                    onClick={logout}
                    className="px-5 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" className="px-5 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-all">
                    Login
                  </Link>
                  <Link href="/register" className="px-5 py-2 text-sm font-semibold text-white bg-luxury-500 hover:bg-luxury-600 dark:bg-luxury-600 dark:hover:bg-luxury-700 rounded-lg shadow-luxury hover:shadow-luxury-lg transition-all">
                    Register
                  </Link>
                </>
              )}
            </div>

            {/* Mobile hamburger button */}
            <button
              type="button"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileMenuOpen}
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="md:hidden p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              {mobileMenuOpen ? (
                /* X icon */
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                /* Hamburger icon */
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile dropdown menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-100 dark:border-gray-800 py-3 space-y-1">
            <Link
              href="/products"
              onClick={closeMobileMenu}
              className={`block px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                pathname === '/products'
                  ? 'bg-luxury-50 dark:bg-luxury-900/20 text-luxury-600 dark:text-luxury-400'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              Products
            </Link>

            {isAuthenticated && user?.role === 'ADMIN' && (
              <Link
                href="/admin"
                onClick={closeMobileMenu}
                className={`block px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  pathname?.startsWith('/admin')
                    ? 'bg-luxury-50 dark:bg-luxury-900/20 text-luxury-600 dark:text-luxury-400'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                Admin
              </Link>
            )}

            {isAuthenticated ? (
              <>
                <Link
                  href="/orders"
                  onClick={closeMobileMenu}
                  className={`block px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    pathname === '/orders'
                      ? 'bg-luxury-50 dark:bg-luxury-900/20 text-luxury-600 dark:text-luxury-400'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  Orders
                </Link>
                <Link
                  href="/profile"
                  onClick={closeMobileMenu}
                  className={`block px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    pathname === '/profile'
                      ? 'bg-luxury-50 dark:bg-luxury-900/20 text-luxury-600 dark:text-luxury-400'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  Profile
                </Link>
                <div className="pt-2 pb-1 border-t border-gray-100 dark:border-gray-800 mt-2">
                  <button
                    onClick={() => { logout(); closeMobileMenu(); }}
                    className="w-full text-left px-4 py-2.5 rounded-lg text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <div className="pt-2 pb-1 border-t border-gray-100 dark:border-gray-800 mt-2 flex flex-col gap-2 px-4">
                <Link
                  href="/login"
                  onClick={closeMobileMenu}
                  className="block text-center py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  onClick={closeMobileMenu}
                  className="block text-center py-2.5 text-sm font-semibold text-white bg-luxury-500 hover:bg-luxury-600 dark:bg-luxury-600 dark:hover:bg-luxury-700 rounded-lg transition-all"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
