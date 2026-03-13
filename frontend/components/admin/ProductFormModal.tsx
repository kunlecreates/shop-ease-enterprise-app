'use client';

import { useState, useEffect } from 'react';
import { X, Upload, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Product } from '@/types';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (product: Partial<Product>) => void;
  product?: Product | null;
  title?: string;
}

interface ProductFormData {
  sku: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  imageUrl: string;
  aisle: string;
  section: string;
  shelfLocation: string;
}

export function ProductFormModal({
  isOpen,
  onClose,
  onSubmit,
  product,
  title = product ? 'Edit Product' : 'Add New Product',
}: ProductFormModalProps) {
  const [formData, setFormData] = useState<ProductFormData>({
    sku: '',
    name: '',
    description: '',
    price: 0,
    stock: 0,
    category: '',
    imageUrl: '',
    aisle: '',
    section: '',
    shelfLocation: '',
  });
  const [imagePreview, setImagePreview] = useState<string>('');
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    if (product) {
      const categoryStr = typeof product.category === 'string' 
        ? product.category 
        : Array.isArray(product.category) 
        ? product.category.map(c => typeof c === 'string' ? c : c.name).join(', ')
        : '';
      
      setFormData({
        sku: product.sku || '',
        name: product.name || '',
        description: product.description || '',
        price: product.price || 0,
        stock: product.stock || 0,
        category: categoryStr,
        imageUrl: product.imageUrl || '',
        aisle: product.aisle || '',
        section: product.section || '',
        shelfLocation: product.shelfLocation || '',
      });
      if (product.imageUrl) {
        setImagePreview(product.imageUrl);
      }
    } else {
      setFormData({
        sku: '',
        name: '',
        description: '',
        price: 0,
        stock: 0,
        category: '',
        imageUrl: '',
        aisle: '',
        section: '',
        shelfLocation: '',
      });
      setImagePreview('');
    }
    setImageError(false);
  }, [product, isOpen]);

  const handleImageUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setFormData({ ...formData, imageUrl: url });
    if (url) {
      setImagePreview(url);
      setImageError(false);
    } else {
      setImagePreview('');
      setImageError(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-gray-500 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-80 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-2xl bg-white dark:bg-gray-800 rounded-lg shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-6 py-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {/* SKU */}
              <div>
                <label htmlFor="sku" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  SKU <span className="text-red-500">*</span>
                </label>
                <Input
                  id="sku"
                  type="text"
                  required
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  disabled={!!product}
                  className="w-full"
                />
              </div>

              {/* Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Product Name <span className="text-red-500">*</span>
                </label>
                <Input
                  id="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full"
                />
              </div>

              {/* Description */}
              <div className="sm:col-span-2">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  id="description"
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white focus:border-luxury-500 focus:ring-luxury-500"
                />
              </div>

              {/* Price */}
              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Price <span className="text-red-500">*</span>
                </label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                  className="w-full"
                />
              </div>

              {/* Stock */}
              <div>
                <label htmlFor="stock" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Stock Quantity <span className="text-red-500">*</span>
                </label>
                <Input
                  id="stock"
                  type="number"
                  min="0"
                  required
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                  className="w-full"
                />
              </div>

              {/* Category */}
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Category
                </label>
                <Input
                  id="category"
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full"
                />
              </div>

              {/* Aisle */}
              <div>
                <label htmlFor="aisle" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Aisle
                </label>
                <Input
                  id="aisle"
                  type="text"
                  placeholder="e.g., A5"
                  value={formData.aisle}
                  onChange={(e) => setFormData({ ...formData, aisle: e.target.value })}
                  className="w-full"
                />
              </div>

              {/* Section */}
              <div>
                <label htmlFor="section" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Section
                </label>
                <Input
                  id="section"
                  type="text"
                  placeholder="e.g., Fresh Produce"
                  value={formData.section}
                  onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                  className="w-full"
                />
              </div>

              {/* Shelf Location */}
              <div>
                <label htmlFor="shelfLocation" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Shelf Location
                </label>
                <Input
                  id="shelfLocation"
                  type="text"
                  placeholder="e.g., Top shelf, bin 3"
                  value={formData.shelfLocation}
                  onChange={(e) => setFormData({ ...formData, shelfLocation: e.target.value })}
                  className="w-full"
                />
              </div>

              {/* Image URL */}
              <div className="sm:col-span-2">
                <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Upload className="inline h-4 w-4 mr-1" />
                  Image URL
                </label>
                <Input
                  id="imageUrl"
                  type="url"
                  placeholder="https://example.com/product-image.jpg"
                  value={formData.imageUrl}
                  onChange={handleImageUrlChange}
                  className="w-full"
                />

                {/* Image Preview */}
                {imagePreview && (
                  <div className="mt-4 border border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-900">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Preview:</p>
                    <div className="flex items-center justify-center h-48 bg-white dark:bg-gray-800 rounded">
                      {!imageError ? (
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-full h-full object-contain"
                          onError={() => setImageError(true)}
                        />
                      ) : (
                        <div className="flex flex-col items-center text-gray-400">
                          <ImageIcon className="h-16 w-16" />
                          <p className="mt-2 text-sm">Failed to load image</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="mt-6 flex justify-end gap-3">
              <Button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="px-4 py-2 bg-luxury-600 text-white rounded-md hover:bg-luxury-700"
              >
                {product ? 'Update Product' : 'Create Product'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
