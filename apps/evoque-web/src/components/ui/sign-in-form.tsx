'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from './button';
import { Input } from './input';
import { getBrandColor } from '@/config/brand-colors';

export function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [rememberMe, setRememberMe] = React.useState(false);
  const [errors, setErrors] = React.useState<{ email?: string; password?: string; general?: string }>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const validateForm = (): boolean => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        setErrors({ general: data.error || 'Failed to sign in. Please try again.' });
        return;
      }

      // Success - redirect to admin dashboard or redirect URL
      const redirectUrl = searchParams?.get('redirect') || '/admin';
      router.push(redirectUrl);
    } catch (error) {
      console.error('Sign in error:', error);
      setErrors({ general: 'An error occurred. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="w-full max-w-md mx-auto p-8 rounded-lg shadow-lg"
      style={{
        backgroundColor: getBrandColor('white'),
        border: '1px solid #e5e7eb',
      }}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {errors.general && (
          <div className="p-3 rounded-md text-sm" style={{ backgroundColor: '#fee2e2', color: '#dc2626' }}>
            {errors.general}
          </div>
        )}
        <div>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (errors.email) {
                setErrors({ ...errors, email: undefined });
              }
            }}
            required
          />
        </div>

        <div>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (errors.password) {
                setErrors({ ...errors, password: undefined });
              }
            }}
            required
          />
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="mr-2 w-4 h-4 rounded"
              style={{
                accentColor: getBrandColor('secondaryBlue'),
              }}
            />
            <span className="text-sm" style={{ color: '#4a4a4a' }}>
              Remember me
            </span>
          </label>
          <a
            href="/forgot-password"
            className="text-sm hover:underline"
            style={{
              color: getBrandColor('secondaryBlue'),
            }}
          >
            Forgot password?
          </a>
        </div>

        <Button
          type="submit"
          variant="default"
          size="lg"
          className="w-full"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Signing in...' : 'Sign In'}
        </Button>
      </form>
    </div>
  );
}

