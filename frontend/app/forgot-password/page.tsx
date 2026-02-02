'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ApiClient } from '@/lib/api-client';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setIsSubmitting(true);

    try {
      const response = await ApiClient.post<{ message?: string }>('/auth/password-reset-request', {
        email,
      });
      const successMessage =
        response?.message ||
        `If an account exists for ${email}, we sent instructions to that address.`;
      setMessage(successMessage);
    } catch (err: any) {
      setError(err?.message || 'Unable to send password reset instructions.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex items-center justify-center min-h-[calc(100vh-4rem)] px-4">
      <div className="max-w-md w-full space-y-6 bg-white p-8 rounded-lg shadow">
        <div>
          <h1 className="text-3xl font-bold text-center text-gray-900">Reset your password</h1>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter the email address associated with your account and we'll email you a secure link to reset your password.
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
            label="Email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            placeholder="Enter your email"
          />

          <Button type="submit" className="w-full" isLoading={isSubmitting}>
            Send reset link
          </Button>
        </form>

        <div className="text-center text-sm text-gray-600 space-y-1">
          <p>
            Remembered your password?{' '}
            <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
              Sign in
            </Link>
          </p>
          <p>
            Already have a token?{' '}
            <Link href="/reset-password" className="font-medium text-blue-600 hover:text-blue-500">
              Enter it here
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}