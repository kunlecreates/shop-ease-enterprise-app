'use client';

import React from 'react';
import Link from 'next/link';
import { useCartStore } from '@/lib/cart-store';
import { Button } from '@/components/ui/Button';

export default function CartPage() {
  const { items, updateQuantity, removeItem, getTotal, clearCart } = useCartStore();

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6">
        <svg className="w-24 h-24 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
        <p className="text-gray-600 mb-6">Add some products to get started</p>
        <Link href="/products">
          <Button>Browse Products</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Shopping Cart</h1>
        <Button variant="danger" size="sm" onClick={clearCart}>
          Clear Cart
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div key={item.id} className="bg-white rounded-lg shadow p-4 flex items-center space-x-4">
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{item.product.name}</h3>
                <p className="text-sm text-gray-600">SKU: {item.product.sku}</p>
                <p className="text-lg font-bold text-blue-600 mt-2">
                  ${item.price.toFixed(2)}
                </p>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                  className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
                  disabled={item.quantity <= 1}
                >
                  −
                </button>
                <span className="w-12 text-center font-semibold">{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                  className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
                  disabled={item.quantity >= item.product.stock}
                >
                  +
                </button>
              </div>
              
              <div className="text-right">
                <p className="font-bold text-lg">
                  ${(item.price * item.quantity).toFixed(2)}
                </p>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => removeItem(item.productId)}
                  className="mt-2"
                >
                  Remove
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-6 sticky top-6">
            <h2 className="text-xl font-bold mb-4">Order Summary</h2>
            
            <div className="space-y-2 mb-4">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>${getTotal().toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>Free</span>
              </div>
              <div className="border-t pt-2 flex justify-between font-bold text-lg">
                <span>Total</span>
                <span className="text-blue-600">${getTotal().toFixed(2)}</span>
              </div>
            </div>

            <Link href="/checkout">
              <Button className="w-full">Proceed to Checkout</Button>
            </Link>
            
            <Link href="/products">
              <Button variant="ghost" className="w-full mt-2">
                Continue Shopping
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
