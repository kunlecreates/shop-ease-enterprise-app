'use client';

import { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { ApiClient } from '@/lib/api-client';
import { Product } from '@/types';
import { Button } from '@/components/ui/Button';
import { ProductFormModal } from '@/components/admin/ProductFormModal';
import { Edit, Trash2, Plus } from 'lucide-react';

function ProductManagementContent() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const data = await ApiClient.get<Product[]>('/product');
      setProducts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (productData: any) => {
    try {
      const dataToSend: any = { 
        sku: productData.sku,
        name: productData.name,
        description: productData.description,
        price: productData.price,
        imageUrl: productData.imageUrl,
        aisle: productData.aisle,
        section: productData.section,
        shelfLocation: productData.shelfLocation,
      };
      
      // Parse categories from comma-separated string to array
      if (productData.category && typeof productData.category === 'string') {
        const categories = productData.category.split(',').map((c: string) => c.trim()).filter(Boolean);
        if (categories.length > 0) {
          dataToSend.categoryCodes = categories;
        }
      }
      
      if (editingProduct) {
        // For now, we don't have an update endpoint, so skip
        console.warn('Update not implemented yet');
      } else {
        // Include initial stock for new products
        dataToSend.initialStock = productData.stock || 0;
        await ApiClient.post('/product', dataToSend);
      }
      await loadProducts();
      setIsModalOpen(false);
      setEditingProduct(null);
    } catch (error) {
      console.error('Failed to save product:', error);
    }
  };

  const handleDelete = async (sku: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      await ApiClient.delete(`/product/${sku}`);
      await loadProducts();
    } catch (error) {
      console.error('Failed to delete product:', error);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Product Management</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Manage your product catalog, inventory, and pricing
          </p>
        </div>
        <Button 
          onClick={handleCreate}
          className="inline-flex items-center gap-2 bg-luxury-500 hover:bg-luxury-600 dark:bg-luxury-600 dark:hover:bg-luxury-700"
        >
          <Plus className="w-4 h-4" />
          Add Product
        </Button>
      </div>

      {loading ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
          <div className="animate-spin h-8 w-8 border-4 border-luxury-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading products...</p>
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">No products found</p>
          <Button onClick={handleCreate}>Create Your First Product</Button>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Image
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  SKU
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {products.map((product, index) => (
                <tr 
                  key={product.id}
                  className={`${index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-750'} hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors`}
                >
                  <td className="px-6 py-4">
                    {product.imageUrl ? (
                      <img 
                        src={product.imageUrl} 
                        alt={product.name}
                        className="w-12 h-12 object-cover rounded-lg"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/48?text=No+Image';
                        }}
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-200 dark:bg-gray-600 rounded-lg flex items-center justify-center">
                        <span className="text-xs text-gray-400 dark:text-gray-500">No img</span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900 dark:text-gray-100">
                    {product.sku}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                    {product.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                    {(() => {
                      // Handle categories array from backend (Product.categories)
                      const cats = (product as any).categories || product.category;
                      if (Array.isArray(cats) && cats.length > 0) {
                        const firstCat = typeof cats[0] === 'string' ? cats[0] : cats[0]?.name;
                        return (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                            {firstCat}
                            {cats.length > 1 && <span className="ml-1 text-blue-600 dark:text-blue-300">+{cats.length - 1}</span>}
                          </span>
                        );
                      }
                      if (typeof cats === 'string') {
                        return (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                            {cats}
                          </span>
                        );
                      }
                      return <span className="text-gray-400 dark:text-gray-500 italic">Uncategorized</span>;
                    })()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-gray-100">
                    ${product.price.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      product.stock > 20 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                        : product.stock > 5 
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' 
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}>
                      {product.stock} units
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm space-x-2">
                    <button
                      onClick={() => handleEdit(product)}
                      className="inline-flex items-center gap-1 text-luxury-600 dark:text-luxury-400 hover:text-luxury-700 dark:hover:text-luxury-300 font-medium transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(product.sku)}
                      className="inline-flex items-center gap-1 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ProductFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingProduct(null);
        }}
        onSubmit={handleSubmit}
        product={editingProduct}
        title={editingProduct ? 'Edit Product' : 'Create New Product'}
      />
    </div>
  );
}

export default function ProductManagementPage() {
  return (
    <ProtectedRoute adminOnly>
      <ProductManagementContent />
    </ProtectedRoute>
  );
}
