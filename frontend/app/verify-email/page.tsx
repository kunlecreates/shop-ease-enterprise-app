'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

interface VerificationResponse {
  success: boolean;
  message: string;
}

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get('token');
      const email = searchParams.get('email');

      if (!token || !email) {
        setStatus('error');
        setMessage('Invalid verification link. Please check your email and try again.');
        return;
      }

      try {
        const response = await apiClient.post<VerificationResponse>('/auth/verify-email', { email, token });
        
        if (response.success) {
          setStatus('success');
          setMessage('Your email has been verified successfully! You can now log in.');
        } else {
          setStatus('error');
          setMessage(response.message || 'Verification failed. The link may be expired or invalid.');
        }
      } catch (error: any) {
        setStatus('error');
        setMessage(error.message || 'An error occurred during verification. Please try again.');
      }
    };

    verifyEmail();
  }, [searchParams]);

  const handleResendVerification = async () => {
    const email = searchParams.get('email');
    if (!email) return;

    try {
      await apiClient.post('/auth/resend-verification', { email });
      setMessage('A new verification email has been sent. Please check your inbox.');
    } catch (error: any) {
      setMessage(error.message || 'Failed to resend verification email.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {status === 'loading' && <Loader2 className="h-16 w-16 text-blue-500 dark:text-blue-400 animate-spin" />}
            {status === 'success' && <CheckCircle2 className="h-16 w-16 text-green-500 dark:text-green-400" />}
            {status === 'error' && <XCircle className="h-16 w-16 text-red-500 dark:text-red-400" />}
          </div>
          <CardTitle className="dark:text-white">
            {status === 'loading' && 'Verifying your email...'}
            {status === 'success' && 'Email Verified!'}
            {status === 'error' && 'Verification Failed'}
          </CardTitle>
          <CardDescription>{message}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === 'success' && (
            <Button
              onClick={() => router.push('/login')}
              className="w-full"
            >
              Go to Login
            </Button>
          )}
          {status === 'error' && (
            <>
              <Button
                onClick={handleResendVerification}
                variant="secondary"
                className="w-full"
              >
                Resend Verification Email
              </Button>
              <Button
                onClick={() => router.push('/register')}
                variant="ghost"
                className="w-full"
              >
                Back to Registration
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Loader2 className="h-16 w-16 text-blue-500 animate-spin" />
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
