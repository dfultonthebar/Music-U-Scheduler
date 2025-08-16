
'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { api } from '@/lib/api';

/**
 * Component that handles backend authentication when NextAuth session is active
 */
export function BackendAuthHandler() {
  const { data: session, status } = useSession();

  useEffect(() => {
    const authenticateWithBackend = async () => {
      if (status === 'authenticated' && session?.user) {
        try {
          // Check if we already have a backend token
          const hasToken = localStorage.getItem('backend_auth_token');
          if (hasToken) {
            console.log('✅ Backend token already exists');
            return;
          }

          // For the admin user, authenticate with backend
          if (session.user.name === 'Music U Admin') {
            const credentials = {
              username: 'admin',
              password: 'MusicU2025'
            };

            console.log('🔐 Authenticating with backend API...');
            await api.login(credentials);
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

  // This component doesn't render anything visible
  return null;
}
