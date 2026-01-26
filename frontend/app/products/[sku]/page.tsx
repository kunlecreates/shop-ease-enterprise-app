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

  useEffect(() => {
    const apiBase = process.env.NEXT_PUBLIC_PRODUCT_API || '/api';
    fetch(`${apiBase}/products/${params.sku}`)
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const data = await r.json();
        setProduct(data);
      })
      .catch(() => router.push('/products'))
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
    <div className="p-6 max-w-6xl mx-auto">
      <Link href="/products"><Button variant="ghost" className="mb-6">← Back to Products</Button></Link>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <div className="bg-gray-100 rounded-lg aspect-square flex items-center justify-center">
          <svg className="w-48 h-48 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        </div>
        <div>
          <div className="mb-2">
            {product.category && (
              <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                {typeof product.category === 'string' 
                  ? product.category 
                  : Array.isArray(product.category) && product.category.length > 0
                    ? (typeof product.category[0] === 'string' ? product.category[0] : product.category[0].name)
                    : ''}
              </span>
            )}
          </div>
          <h1 className="text-4xl font-bold mb-4">{product.name}</h1>
          <div className="mb-6"><span className="text-3xl font-bold text-blue-600">${product.price.toFixed(2)}</span></div>
          {product.description && <div className="mb-6"><h2 className="text-lg font-semibold mb-2">Description</h2><p className="text-gray-700 leading-relaxed">{product.description}</p></div>}
          <div className="mb-6"><h2 className="text-lg font-semibold mb-2">Product Details</h2>
            <dl className="space-y-2">
              <div><dt className="inline font-medium">SKU:</dt><dd className="inline ml-2 text-gray-600">{product.sku}</dd></div>
              <div><dt className="inline font-medium">Availability:</dt><dd className="inline ml-2"><span className={`px-2 py-1 rounded text-sm ${product.stock > 10 ? 'bg-green-100 text-green-800' : product.stock > 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>{product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}</span></dd></div>
            </dl>
          </div>
          {product.stock > 0 && (
            <div className="border-t pt-6">
              <div className="flex items-center space-x-4 mb-6">
                <label className="font-semibold">Quantity:</label>
                <div className="flex items-center space-x-2">
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-10 h-10 rounded-full bg-gray-200 hover:bg-gray-300">−</button>
                  <span className="w-16 text-center font-semibold text-lg">{quantity}</span>
                  <button onClick={() => setQuantity(Math.min(product.stock, quantity + 1))} className="w-10 h-10 rounded-full bg-gray-200 hover:bg-gray-300">+</button>
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
