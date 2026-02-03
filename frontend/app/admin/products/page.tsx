'use client';

import { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { ApiClient } from '@/lib/api-client';
import { Product } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

function ProductManagementContent() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    description: '',
    price: 0,
    stock: 0,
    category: '',
  });

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const productData = {
        ...formData,
        initialStock: formData.stock,
      };
      delete (productData as any).stock;
      
      if (editingProduct) {
        await ApiClient.put(`/product/${editingProduct.sku}`, productData);
      } else {
        await ApiClient.post('/product', productData);
      }
      await loadProducts();
      resetForm();
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
    setIsCreating(true);
    const categoryValue = typeof product.category === 'string' 
      ? product.category 
      : Array.isArray(product.category) && product.category.length > 0
        ? (typeof product.category[0] === 'string' ? product.category[0] : product.category[0].name)
        : '';
    setFormData({
      sku: product.sku,
      name: product.name,
      description: product.description || '',
      price: product.price,
      stock: product.stock,
      category: categoryValue,
    });
  };

  const resetForm = () => {
    setEditingProduct(null);
    setIsCreating(false);
    setFormData({
      sku: '',
      name: '',
      description: '',
      price: 0,
      stock: 0,
      category: '',
    });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Product Management</h1>
        <Button onClick={() => setIsCreating(true)}>Add New Product</Button>
      </div>

      {isCreating && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">
            {editingProduct ? 'Edit Product' : 'Create New Product'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="SKU"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                required
                disabled={!!editingProduct}
              />
              <Input
                label="Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <Input
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
            <div className="grid grid-cols-3 gap-4">
              <Input
                label="Price ($)"
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                required
              />
              <Input
                label="Stock"
                type="number"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) })}
                required
              />
              <Input
                label="Category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              />
            </div>
            <div className="flex space-x-4">
              <Button type="submit">{editingProduct ? 'Update' : 'Create'} Product</Button>
              <Button type="button" variant="secondary" onClick={resetForm}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <p className="text-center py-8">Loading products...</p>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {products.map((product) => (
                <tr key={product.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{product.sku}</td>
                  <td className="px-6 py-4 text-sm">{product.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {typeof product.category === 'string' 
                      ? product.category 
                      : Array.isArray(product.category) && product.category.length > 0
                        ? (typeof product.category[0] === 'string' ? product.category[0] : product.category[0].name)
                        : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">${product.price.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 py-1 rounded ${product.stock > 10 ? 'bg-green-100 text-green-800' : product.stock > 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                      {product.stock}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                    <Button size="sm" onClick={() => handleEdit(product)}>Edit</Button>
                    <Button size="sm" variant="danger" onClick={() => handleDelete(product.sku)}>Delete</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
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
