
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import RoleSelection from '@/components/auth/role-selection';

export default function RoleSelectionPage() {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !loading) {
      if (!isAuthenticated) {
        router.push('/login');
        return;
      }

      // Check if user needs role selection
      const hasAdminPrivileges = user?.role === 'admin' || 
        user?.assigned_roles?.some((role: any) => 
          role.permissions?.includes('admin_access'));
      
      const isInstructor = user?.role === 'instructor' ||
        user?.assigned_roles?.some((role: any) => 
          role.permissions?.some((perm: string) => perm.startsWith('teach_')));

      // If user doesn't have multiple roles, redirect them directly
      if (!hasAdminPrivileges || !isInstructor) {
        if (user?.role === 'admin') {
          router.push('/admin');
        } else if (user?.role === 'instructor') {
          router.push('/instructor');
        } else if (user?.role === 'student') {
          router.push('/dashboard');
        }
      }
    }
  }, [user, loading, isAuthenticated, mounted, router]);

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <RoleSelection user={user} />;
}
