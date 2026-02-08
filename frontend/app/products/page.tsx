'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Product } from '@/types';
import { useCartStore } from '@/lib/cart-store';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sortBy, setSortBy] = useState('name');
  
  const addItem = useCartStore((state) => state.addItem);
  const [addedProducts, setAddedProducts] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetch('/api/product')
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const data = await r.json();
        const productList = Array.isArray(data) ? data : [];
        setProducts(productList);
        setFilteredProducts(productList);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let filtered = products;

    if (searchQuery) {
      filtered = filtered.filter((p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (categoryFilter) {
      filtered = filtered.filter((p) => {
        if (typeof p.category === 'string') {
          return p.category === categoryFilter;
        }
        if (Array.isArray(p.category)) {
          return p.category.some((c: any) => c.name === categoryFilter || c === categoryFilter);
        }
        return false;
      });
    }

    filtered = [...filtered].sort((a, b) => {
      if (sortBy === 'price_asc') return a.price - b.price;
      if (sortBy === 'price_desc') return b.price - a.price;
      return a.name.localeCompare(b.name);
    });

    setFilteredProducts(filtered);
  }, [searchQuery, categoryFilter, sortBy, products]);

  const categories = Array.from(
    new Set(
      products.flatMap((p) => {
        if (typeof p.category === 'string') return [p.category];
        if (Array.isArray(p.category)) return p.category.map((c: any) => c.name || c);
        return [];
      }).filter(Boolean)
    )
  );

  const handleAddToCart = (product: Product) => {
    addItem(product, 1);
    setAddedProducts(new Set(addedProducts).add(product.id));
    setTimeout(() => {
      setAddedProducts((prev) => {
        const next = new Set(prev);
        next.delete(product.id);
        return next;
      });
    }, 2000);
  };

  return (
    <main className="p-6 dark:bg-gray-900 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 dark:text-white">Products</h1>

      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow mb-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            type="search"
            placeholder="Search by name or SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          <select
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <select
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="name">Sort by Name</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
          </select>
        </div>
      </div>

      {loading && <p className="text-center py-8 dark:text-white">Loading products...</p>}
      {error && <p className="text-center text-red-600 dark:text-red-400 py-8">Error: {error}</p>}
      
      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <div key={product.id} role="article" data-testid="product-card" className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden">
              {/* Product Image */}
              <div className="aspect-square bg-gray-100 dark:bg-gray-900 flex items-center justify-center overflow-hidden">
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      const svg = e.currentTarget.nextElementSibling as HTMLElement;
                      if (svg) svg.style.display = 'block';
                    }}
                  />
                ) : null}
                <svg className={product.imageUrl ? 'hidden w-24 h-24 text-gray-400 dark:text-gray-600' : 'w-24 h-24 text-gray-400 dark:text-gray-600'} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-2 dark:text-white">{product.name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">SKU: {product.sku}</p>
                {product.category && (
                  <span className="inline-block bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs px-2 py-1 rounded mb-3">
                    {typeof product.category === 'string' 
                      ? product.category 
                      : Array.isArray(product.category) && product.category.length > 0
                        ? (product.category[0] as any).name || product.category[0]
                        : ''}
                  </span>
                )}
                {product.description && (
                  <p className="text-gray-700 dark:text-gray-300 mb-4 line-clamp-2">{product.description}</p>
                )}
                <div className="flex items-center justify-between mt-4">
                  <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">${product.price.toFixed(2)}</span>
                  <div className="flex items-center space-x-2">
                    {product.stock > 0 ? (
                      <span className="text-sm text-green-600 dark:text-green-400">In stock: {product.stock}</span>
                    ) : (
                      <span className="text-sm text-red-600 dark:text-red-400">Out of stock</span>
                    )}
                  </div>
                </div>
                <div className="flex space-x-2 mt-4">
                  <Link href={`/products/${product.sku}`} className="flex-1">
                    <Button variant="secondary" className="w-full" size="sm">
                      View Details
                    </Button>
                  </Link>
                  <Button
                    onClick={() => handleAddToCart(product)}
                    disabled={product.stock === 0 || addedProducts.has(product.id)}
                    className="flex-1"
                    size="sm"
                  >
                    {addedProducts.has(product.id) ? '✓ Added' : 'Add to Cart'}
                  </Button>
                </div>
              </div>
            </div>
          ))}
          {filteredProducts.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-600 dark:text-gray-400">
              No products found matching your criteria.
            </div>
          )}
        </div>
      )}
    </main>
  );
}
