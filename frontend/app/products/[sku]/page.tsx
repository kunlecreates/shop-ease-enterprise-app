'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Product } from '@/types';
import { useCartStore } from '@/lib/cart-store';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  
  const addItem = useCartStore((state) => state.addItem);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/product/${params.sku}`)
      .then(async (r) => {
        if (!r.ok) {
          const errorData = await r.json().catch(() => ({ message: `HTTP ${r.status}` }));
          throw new Error(errorData.message || `HTTP ${r.status}`);
        }
        const data = await r.json();
        setProduct(data);
      })
      .catch((err) => {
        console.error('Failed to load product:', err);
        setError(err.message);
        // Redirect after showing error briefly
        setTimeout(() => router.push('/products'), 2000);
      })
      .finally(() => setLoading(false));
  }, [params.sku, router]);

  const handleAddToCart = () => {
    if (product) {
      addItem(product, quantity);
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen"><div className="text-xl">Loading...</div></div>;
  }

  if (!product) return null;

  return (
    <div className="p-6 max-w-6xl mx-auto dark:bg-gray-900 min-h-screen">
      <Link href="/products"><Button variant="ghost" className="mb-6">← Back to Products</Button></Link>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <div className="bg-gray-100 dark:bg-gray-900 rounded-lg aspect-square flex items-center justify-center overflow-hidden">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-contain"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                const svg = e.currentTarget.parentElement?.querySelector('svg');
                if (svg) svg.classList.remove('hidden');
              }}
            />
          ) : null}
          <svg className={product.imageUrl ? 'hidden w-48 h-48 text-gray-400 dark:text-gray-600' : 'w-48 h-48 text-gray-400 dark:text-gray-600'} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        </div>
        <div>
          <div className="mb-2">
            {(() => {
              const cats = (product as any).categories || product.category;
              if (Array.isArray(cats) && cats.length > 0) {
                return (
                  <div className="flex flex-wrap gap-2">
                    {cats.slice(0, 3).map((cat: any, idx: number) => {
                      const catName = typeof cat === 'string' ? cat : (cat.name || cat.code);
                      return (
                        <span key={idx} className="inline-block px-4 py-2 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm font-medium rounded-full">
                          {catName}
                        </span>
                      );
                    })}
                    {cats.length > 3 && (
                      <span className="inline-block px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-sm font-medium rounded-full">
                        +{cats.length - 3} more
                      </span>
                    )}
                  </div>
                );
              }
              if (typeof cats === 'string') {
                return (
                  <span className="inline-block px-4 py-2 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm font-medium rounded-full">
                    {cats}
                  </span>
                );
              }
              return null;
            })()}
          </div>
          <h1 className="text-4xl font-bold mb-4 dark:text-white">{product.name}</h1>
          <div className="mb-6"><span className="text-3xl font-bold text-blue-600 dark:text-blue-400">${product.price.toFixed(2)}</span></div>
          {product.description && <div className="mb-6"><h2 className="text-lg font-semibold mb-2 dark:text-white">Description</h2><p className="text-gray-700 dark:text-gray-300 leading-relaxed">{product.description}</p></div>}
          <div className="mb-6"><h2 className="text-lg font-semibold mb-2 dark:text-white">Product Details</h2>
            <dl className="space-y-2">
              <div><dt className="inline font-medium dark:text-gray-300">SKU:</dt><dd className="inline ml-2 text-gray-600 dark:text-gray-400">{product.sku}</dd></div>
              {(product as any).unit && <div><dt className="inline font-medium dark:text-gray-300">Unit:</dt><dd className="inline ml-2 text-gray-600 dark:text-gray-400">{(product as any).unit}</dd></div>}
              <div><dt className="inline font-medium dark:text-gray-300">Availability:</dt><dd className="inline ml-2"><span className={`px-2 py-1 rounded text-sm ${product.stock > 10 ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : product.stock > 0 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>{product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}</span></dd></div>
            </dl>
          </div>
          {(product.aisle || product.section || product.shelfLocation) && (
            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold mb-3 dark:text-white flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                In-Store Location
              </h2>
              <dl className="space-y-2">
                {product.aisle && (
                  <div><dt className="inline font-medium dark:text-gray-300">Aisle:</dt><dd className="inline ml-2 text-gray-600 dark:text-gray-400">{product.aisle}</dd></div>
                )}
                {product.section && (
                  <div><dt className="inline font-medium dark:text-gray-300">Section:</dt><dd className="inline ml-2 text-gray-600 dark:text-gray-400">{product.section}</dd></div>
                )}
                {product.shelfLocation && (
                  <div><dt className="inline font-medium dark:text-gray-300">Shelf:</dt><dd className="inline ml-2 text-gray-600 dark:text-gray-400">{product.shelfLocation}</dd></div>
                )}
              </dl>
            </div>
          )}
          {product.stock > 0 && (
            <div className="border-t dark:border-gray-700 pt-6">
              <div className="flex items-center space-x-4 mb-6">
                <label className="font-semibold dark:text-white">Quantity:</label>
                <div className="flex items-center space-x-2">
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200">−</button>
                  <span className="w-16 text-center font-semibold text-lg dark:text-white">{quantity}</span>
                  <button onClick={() => setQuantity(Math.min(product.stock, quantity + 1))} className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200">+</button>
                </div>
              </div>
              <Button size="lg" onClick={handleAddToCart} className="w-full md:w-auto">{added ? '✓ Added to Cart!' : 'Add to Cart'}</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
