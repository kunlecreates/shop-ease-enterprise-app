'use client';

import { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { ApiClient } from '@/lib/api-client';
import { Order } from '@/types';
import { Button } from '@/components/ui/Button';

function OrderManagementContent() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const data = await ApiClient.get<Order[]>('/order');
      setOrders(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      await ApiClient.patch(`/order/${orderId}/status`, { status: newStatus });
      await loadOrders();
    } catch (error) {
      console.error('Failed to update order status:', error);
    }
  };

  const filteredOrders = filter === 'all' 
    ? orders 
    : orders.filter(o => o.status === filter);

  const statusOptions = ['PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Order Management</h1>
        <div className="flex space-x-2">
          <select
            className="px-4 py-2 border rounded-lg"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All Orders</option>
            {statusOptions.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <p className="text-center py-8">Loading orders...</p>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div key={order.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold text-lg">Order #{order.id}</h3>
                  <p className="text-sm text-gray-600">Customer ID: {order.userRef || order.userId || 'N/A'}</p>
                  <p className="text-sm text-gray-600">
                    Date: {new Date(order.createdAt).toLocaleString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold mb-2 ${
                    order.status === 'DELIVERED' ? 'bg-green-100 text-green-800' :
                    order.status === 'SHIPPED' ? 'bg-blue-100 text-blue-800' :
                    order.status === 'PAID' ? 'bg-yellow-100 text-yellow-800' :
                    order.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {order.status}
                  </span>
                  <p className="text-xl font-bold text-blue-600">${order.total.toFixed(2)}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {/* Shipping Information */}
                {order.shippingRecipient ? (
                  <div className="border rounded-lg p-3 bg-gray-50">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Shipping Address</h4>
                    <p className="text-sm font-medium">{order.shippingRecipient}</p>
                    {order.shippingStreet1 && <p className="text-sm">{order.shippingStreet1}</p>}
                    {order.shippingStreet2 && <p className="text-sm">{order.shippingStreet2}</p>}
                    <p className="text-sm">
                      {order.shippingCity}{order.shippingState && `, ${order.shippingState}`} {order.shippingPostalCode}
                    </p>
                    {order.shippingCountry && <p className="text-sm">{order.shippingCountry}</p>}
                    {order.shippingPhone && <p className="text-sm text-gray-600">📞 {order.shippingPhone}</p>}
                  </div>
                ) : (
                  <div className="border rounded-lg p-3 bg-yellow-50">
                    <h4 className="text-xs font-semibold text-yellow-700 uppercase mb-1">Shipping Address</h4>
                    <p className="text-sm text-yellow-600">⚠️ No shipping information</p>
                  </div>
                )}
                
                {/* Payment Information */}
                {order.paymentMethodType ? (
                  <div className="border rounded-lg p-3 bg-gray-50">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Payment Method</h4>
                    <p className="text-sm font-medium">
                      {order.paymentBrand || order.paymentMethodType}
                      {order.paymentLast4 && ` •••• ${order.paymentLast4}`}
                    </p>
                  </div>
                ) : (
                  <div className="border rounded-lg p-3 bg-yellow-50">
                    <h4 className="text-xs font-semibold text-yellow-700 uppercase mb-1">Payment Method</h4>
                    <p className="text-sm text-yellow-600">⚠️ No payment information</p>
                  </div>
                )}
              </div>

              <div className="flex space-x-2">
                <select
                  className="px-3 py-2 border rounded-lg text-sm"
                  value={order.status}
                  onChange={(e) => handleStatusUpdate(order.id, e.target.value)}
                >
                  {statusOptions.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
            </div>
          ))}

          {filteredOrders.length === 0 && (
            <div className="text-center py-12 text-gray-600">
              No orders found for the selected filter.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function OrderManagementPage() {
  return (
    <ProtectedRoute adminOnly>
      <OrderManagementContent />
    </ProtectedRoute>
  );
}
