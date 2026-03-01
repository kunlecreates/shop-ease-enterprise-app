'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { ApiClient } from '@/lib/api-client';
import { Order } from '@/types';

function OrdersContent() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const success = searchParams.get('success');

  useEffect(() => {
    ApiClient.get<Order[]>('/order')
      .then(setOrders)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 max-w-5xl mx-auto dark:bg-gray-900 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 dark:text-white">Order History</h1>

      {success && (
        <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 px-4 py-3 rounded mb-6">
          ✓ Order placed successfully!
        </div>
      )}

      {loading && <p className="text-center py-8 dark:text-gray-300">Loading orders...</p>}
      
      {!loading && orders.length === 0 && (
        <div className="text-center py-12 text-gray-600 dark:text-gray-400">
          <p>You haven't placed any orders yet.</p>
        </div>
      )}

      {!loading && orders.length > 0 && (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-700 p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold text-lg dark:text-white">Order #{order.id}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {new Date(order.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  order.status === 'DELIVERED' ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' :
                  order.status === 'SHIPPED' ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200' :
                  order.status === 'PAID' ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200' :
                  'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                }`}>
                  {order.status}
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {/* Shipping Information */}
                {order.shippingRecipient && (
                  <div className="border dark:border-gray-700 rounded-lg p-3 bg-gray-50 dark:bg-gray-700">
                    <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Shipping To</h4>
                    <p className="text-sm font-medium dark:text-white">{order.shippingRecipient}</p>
                    {order.shippingStreet1 && <p className="text-sm dark:text-gray-300">{order.shippingStreet1}</p>}
                    {order.shippingStreet2 && <p className="text-sm dark:text-gray-300">{order.shippingStreet2}</p>}
                    <p className="text-sm dark:text-gray-300">
                      {order.shippingCity}{order.shippingState && `, ${order.shippingState}`} {order.shippingPostalCode}
                    </p>
                    {order.shippingCountry && <p className="text-sm dark:text-gray-300">{order.shippingCountry}</p>}
                  </div>
                )}
                
                {/* Payment Information */}
                {order.paymentMethodType && (
                  <div className="border dark:border-gray-700 rounded-lg p-3 bg-gray-50 dark:bg-gray-700">
                    <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Payment Method</h4>
                    <p className="text-sm font-medium dark:text-white">
                      {order.paymentBrand || order.paymentMethodType}
                      {order.paymentLast4 && ` •••• ${order.paymentLast4}`}
                    </p>
                  </div>
                )}
              </div>
              
              <div className="border-t dark:border-gray-700 pt-4">
                <div className="flex justify-between font-bold text-lg">
                  <span className="dark:text-white">Total</span>
                  <span className="text-blue-600 dark:text-blue-400">${order.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function OrdersPage() {
  return (
    <ProtectedRoute>
      <OrdersContent />
    </ProtectedRoute>
  );
}
