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
      const data = await ApiClient.get<Order[]>('/orders/all');
      setOrders(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      await ApiClient.patch(`/orders/${orderId}/status`, { status: newStatus });
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
                  <h3 className="font-semibold text-lg">Order #{order.orderNumber}</h3>
                  <p className="text-sm text-gray-600">Customer: {order.userId}</p>
                  <p className="text-sm text-gray-600">
                    Date: {new Date(order.createdAt).toLocaleString()}
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

              <div className="border-t pt-4 mb-4">
                <h4 className="font-semibold mb-2">Order Items:</h4>
                {order.items.map((item) => (
                  <div key={item.id} className="flex justify-between py-1 text-sm">
                    <span>{item.product.name} × {item.quantity}</span>
                    <span className="font-medium">${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
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
