'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

function ProfileContent() {
  const { user } = useAuth();

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">My Profile</h1>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Account Information</h2>
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-gray-600">Username</label>
            <p className="text-lg">{user?.username}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600">Email</label>
            <p className="text-lg">{user?.email}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600">Role</label>
            <p className="text-lg">
              <span className={`inline-block px-3 py-1 rounded-full text-sm ${
                user?.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
              }`}>
                {user?.role}
              </span>
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link href="/orders" className="block">
          <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer">
            <h3 className="text-lg font-semibold mb-2">Order History</h3>
            <p className="text-gray-600">View your past orders and track current ones</p>
          </div>
        </Link>
        
        {user?.role === 'ADMIN' && (
          <Link href="/admin" className="block">
            <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <h3 className="text-lg font-semibold mb-2">Admin Dashboard</h3>
              <p className="text-gray-600">Manage products, orders, and users</p>
            </div>
          </Link>
        )}
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfileContent />
    </ProtectedRoute>
  );
}
