'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { ApiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface ResetPasswordFormProps {
  presetToken?: string;
}

export default function ResetPasswordForm({ presetToken = '' }: ResetPasswordFormProps) {
  const [token, setToken] = useState(presetToken);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setToken(presetToken);
  }, [presetToken]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setMessage('');

    if (!token) {
      setError('Token is required.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords must match.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await ApiClient.post<{ message?: string }>('/auth/password-reset-confirm', {
        token,
        newPassword,
      });
      const successMessage = response?.message || 'Your password has been reset successfully.';
      setMessage(successMessage);
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err?.message || 'Unable to reset your password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex items-center justify-center min-h-[calc(100vh-4rem)] px-4">
      <div className="max-w-md w-full space-y-6 bg-white p-8 rounded-lg shadow">
        <div>
          <h1 className="text-3xl font-bold text-center text-gray-900">Set a new password</h1>
          <p className="mt-2 text-center text-sm text-gray-600">
            Paste your reset token and create a strong password to unlock your account again.
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {message && (
            <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded">
              {message}
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <Input
            label="Token"
            type="text"
            value={token}
            onChange={(event) => setToken(event.target.value)}
            required
            placeholder="Paste your reset token"
          />

          <Input
            label="New Password"
            type="password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            required
            placeholder="Choose a new password"
          />

          <Input
            label="Confirm New Password"
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
            placeholder="Re-enter your password"
          />

          <Button type="submit" className="w-full" isLoading={isSubmitting}>
            Set new password
          </Button>
        </form>

        <div className="text-center text-sm text-gray-600 space-y-1">
          <p>
            Need a new token?{' '}
            <Link href="/forgot-password" className="font-medium text-blue-600 hover:text-blue-500">
              Send another reset link
            </Link>
          </p>
          <p>
            Remembered your password?{' '}
            <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}