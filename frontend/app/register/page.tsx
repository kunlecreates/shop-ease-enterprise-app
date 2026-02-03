'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { apiClient } from '@/lib/api-client';
import { Mail, CheckCircle } from 'lucide-react';

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const [resendingEmail, setResendingEmail] = useState(false);
  
  const { register } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setIsLoading(true);

    try {
      await register(username, email, password);
      setRegistrationComplete(true);
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendEmail = async () => {
    setResendingEmail(true);
    try {
      await apiClient.post('/auth/resend-verification', { email });
      setError('');
      alert('Verification email has been resent! Please check your inbox.');
    } catch (err: any) {
      setError(err.message || 'Failed to resend email. Please try again.');
    } finally {
      setResendingEmail(false);
    }
  };

  if (registrationComplete) {
    return (
      <main className="flex items-center justify-center min-h-[calc(100vh-4rem)] px-4">
        <div className="max-w-md w-full space-y-6 bg-white p-8 rounded-lg shadow text-center">
          <div className="flex justify-center">
            <Mail className="h-16 w-16 text-blue-500" />
          </div>
          
          <h2 className="text-3xl font-bold text-gray-900">
            Check your email
          </h2>
          
          <div className="space-y-4 text-gray-600">
            <p>
              We've sent a verification email to:
            </p>
            <p className="font-semibold text-gray-900 text-lg">
              {email}
            </p>
            <p>
              Please click the verification link in the email to activate your account.
            </p>
            <p className="text-sm">
              Didn't receive the email? Check your spam folder or click the button below to resend.
            </p>
          </div>

          <div className="space-y-3 pt-4">
            <Button
              onClick={handleResendEmail}
              variant="secondary"
              className="w-full"
              isLoading={resendingEmail}
            >
              Resend Verification Email
            </Button>
            
            <Button
              onClick={() => router.push('/login')}
              variant="ghost"
              className="w-full"
            >
              Back to Login
            </Button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex items-center justify-center min-h-[calc(100vh-4rem)] px-4">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow">
        <div>
          <h2 className="text-3xl font-bold text-center text-gray-900">
            Create your account
          </h2>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            <Input
              label="Username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder="Choose a username"
            />
            
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
            />
            
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="At least 8 characters"
            />
            
            <Input
              label="Confirm Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder="Confirm your password"
            />
          </div>

          <Button type="submit" className="w-full" isLoading={isLoading}>
            Create account
          </Button>
          
          <p className="text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
              Sign in here
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}
