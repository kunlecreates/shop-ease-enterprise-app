'use client';

import { useState } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ApiClient } from '@/lib/api-client';

function ProfileContent() {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [formData, setFormData] = useState({
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
  });

  const handleSave = async () => {
    setIsSaving(true);
    setMessage('');
    try {
      await ApiClient.patch('/user/profile', {
        email: formData.email,
        ...(formData.newPassword && {
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
        }),
      });
      setMessage('Profile updated successfully!');
      setIsEditing(false);
      setFormData({ ...formData, currentPassword: '', newPassword: '' });
    } catch (error: any) {
      setMessage(error.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">My Profile</h1>
        {!isEditing && (
          <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
        )}
      </div>

      {message && (
        <div className={`mb-4 px-4 py-3 rounded ${
          message.includes('success') 
            ? 'bg-green-50 border border-green-200 text-green-700' 
            : 'bg-red-50 border border-red-200 text-red-600'
        }`}>
          {message}
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Account Information</h2>
        {isEditing ? (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-600">Username</label>
              <p className="text-lg text-gray-500">{user?.username} (cannot be changed)</p>
            </div>
            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            <div className="border-t pt-4 mt-4">
              <h3 className="font-semibold mb-3">Change Password (optional)</h3>
              <div className="space-y-4">
                <Input
                  label="Current Password"
                  type="password"
                  value={formData.currentPassword}
                  onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                />
                <Input
                  label="New Password"
                  type="password"
                  value={formData.newPassword}
                  onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                />
              </div>
            </div>
            <div className="flex space-x-4 pt-4">
              <Button onClick={handleSave} isLoading={isSaving}>
                Save Changes
              </Button>
              <Button variant="secondary" onClick={() => {
                setIsEditing(false);
                setFormData({ email: user?.email || '', currentPassword: '', newPassword: '' });
              }}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
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
        )}
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
