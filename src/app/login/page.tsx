'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { signIn } from 'next-auth/react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { Lock, Mail } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Invalid credentials. Please try again.');
        toast({
          title: 'Sign In Failed',
          description: 'Please verify your email and password.',
          variant: 'danger',
        });
      } else {
        toast({
          title: 'Welcome Back!',
          description: 'Successfully signed in.',
          variant: 'success',
        });
        // Redirect will be handled by middleware or root page
        router.push('/');
        router.refresh();
      }
    } catch (err: any) {
      setError('An unexpected error occurred.');
      toast({
        title: 'Error',
        description: err.message || 'Unable to connect to auth server.',
        variant: 'danger',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-850 to-slate-950 px-4">
      <div className="w-full max-w-md">
        <Card className="border-slate-800 bg-slate-900/90 text-white shadow-2xl backdrop-blur-md">
          <CardHeader className="space-y-2 text-center flex flex-col items-center">
            <div className="relative w-72 h-20 mb-2">
              <Image
                src="/logo.png"
                alt="AasaMedChem Logo"
                fill
                priority
                className="object-contain"
              />
            </div>
            <CardDescription className="text-slate-400">
              Sign in to manage inventory & orders
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <div className="rounded-md bg-red-950/50 border border-red-800 p-3 text-sm text-red-200">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300" htmlFor="email">
                  Email Address
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                    <Mail className="h-4 w-4" />
                  </span>
                  <input
                    id="email"
                    type="email"
                    required
                    placeholder="name@aasamedchem.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-slate-700 bg-slate-950 pl-10 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent disabled:opacity-50"
                    disabled={loading}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300" htmlFor="password">
                  Password
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                    <Lock className="h-4 w-4" />
                  </span>
                  <input
                    id="password"
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-slate-700 bg-slate-950 pl-10 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent disabled:opacity-50"
                    disabled={loading}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col border-t border-slate-800 pt-6">
              <Button
                id="btn-login-submit"
                type="submit"
                className="w-full bg-white hover:bg-slate-200 text-slate-950 focus:ring-slate-400"
                disabled={loading}
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </Button>
              <div className="mt-4 text-center text-xs text-slate-500">
                Authorized access only. Use your assigned credentials.
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
