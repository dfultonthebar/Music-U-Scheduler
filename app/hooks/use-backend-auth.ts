
/**
 * Hook for managing backend API authentication alongside NextAuth
 */

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { apiService } from '@/lib/api';

export function useBackendAuth() {
  const { data: session, status } = useSession();

  useEffect(() => {
    const authenticateWithBackend = async () => {
      if (status === 'authenticated' && session?.user) {
        try {
          // Check if we already have a backend token
          const hasToken = localStorage.getItem('backend_auth_token');
          if (hasToken) {
            return; // Already authenticated with backend
          }

          // For the admin user, get backend token
          if (session.user.name === 'Music U Admin') {
            const credentials = {
              username: 'admin',
              password: 'MusicU2025'
            };

            console.log('🔐 Authenticating with backend for admin user...');
            await apiService.login(credentials);
            console.log('✅ Backend authentication successful');
          }
        } catch (error) {
          console.error('❌ Backend authentication failed:', error);
          // Don't throw error to avoid breaking the UI
        }
      }
    };

    authenticateWithBackend();
  }, [session, status]);

  return {
    isAuthenticated: status === 'authenticated',
    user: session?.user
  };
}
