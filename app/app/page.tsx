
'use client';

import { useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { Loader2, Music } from 'lucide-react';

export default function HomePage() {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return; // Still loading

    if (!isAuthenticated) {
      router.push('/login');
    } else if (user) {
      if (user.role === 'admin') {
        router.push('/admin');
      } else if (user.role === 'instructor') {
        router.push('/instructor');
      } else {
        router.push('/dashboard');
      }
    }
  }, [user, loading, isAuthenticated, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <Music className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Music-U-Scheduler</h1>
        <div className="flex items-center justify-center gap-2 text-gray-600">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading your dashboard...</span>
        </div>
      </div>
    </div>
  );
}
