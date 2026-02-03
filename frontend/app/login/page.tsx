'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { apiClient } from '@/lib/api-client';
import { AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showVerificationError, setShowVerificationError] = useState(false);
  const [resendingEmail, setResendingEmail] = useState(false);
  
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setShowVerificationError(false);
    setIsLoading(true);

    try {
      await login(email, password);
      
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        router.push(user.role === 'ADMIN' ? '/admin' : '/profile');
      } else {
        router.push('/profile');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Login failed. Please check your credentials.';
      setError(errorMessage);
      
      if (errorMessage.toLowerCase().includes('email') && 
          errorMessage.toLowerCase().includes('verif')) {
        setShowVerificationError(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setResendingEmail(true);
    try {
      await apiClient.post('/auth/resend-verification', { email });
      setError('');
      alert('Verification email has been resent! Please check your inbox.');
    } catch (err: any) {
      setError(err.message || 'Failed to resend verification email.');
    } finally {
      setResendingEmail(false);
    }
  };

  return (
    <main className="flex items-center justify-center min-h-[calc(100vh-4rem)] px-4">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow">
        <div>
          <h2 className="text-3xl font-bold text-center text-gray-900">
            Sign in
          </h2>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded space-y-2">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
              {showVerificationError && (
                <Button
                  type="button"
                  onClick={handleResendVerification}
                  variant="secondary"
                  size="sm"
                  isLoading={resendingEmail}
                  className="w-full mt-2"
                >
                  Resend Verification Email
                </Button>
              )}
            </div>
          )}
          
          <div className="space-y-4">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Enter your email"
            />
            
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter your password"
            />
          </div>

          <Button type="submit" className="w-full" isLoading={isLoading}>
            Sign in
          </Button>
          
          <div className="text-center text-sm text-gray-600 space-y-1">
            <p>
              Forgot your password?{' '}
              <Link href="/forgot-password" className="font-medium text-blue-600 hover:text-blue-500">
                Reset it
              </Link>
            </p>
            <p>
              Don't have an account?{' '}
              <Link href="/register" className="font-medium text-blue-600 hover:text-blue-500">
                Register here
              </Link>
            </p>
          </div>
        </form>
      </div>
    </main>
  );
}
