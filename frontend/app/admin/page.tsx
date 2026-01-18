'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';

function AdminContent() {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-2">Product Management</h2>
          <p className="text-gray-600 mb-4">Manage your product catalog</p>
          <p className="text-sm text-gray-500">Coming soon...</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-2">Order Management</h2>
          <p className="text-gray-600 mb-4">View and manage customer orders</p>
          <p className="text-sm text-gray-500">Coming soon...</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-2">User Management</h2>
          <p className="text-gray-600 mb-4">Manage user accounts and roles</p>
          <p className="text-sm text-gray-500">Coming soon...</p>
        </div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  return (
    <ProtectedRoute adminOnly>
      <AdminContent />
    </ProtectedRoute>
  );
}
