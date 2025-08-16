
'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, LoginCredentials } from '@/lib/types';
import { apiService } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useSession, signIn, signOut } from 'next-auth/react';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credentials: LoginCredentials) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  isAuthenticated: boolean;
  displayName: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const { data: session, status } = useSession() || {};
  const router = useRouter();

  const loading = status === 'loading';

  // Convert NextAuth session to our User type
  useEffect(() => {
    if (session?.user) {
      const nextAuthUser = session.user as any;
      const mappedUser: User = {
        id: nextAuthUser.id || nextAuthUser.sub,
        username: nextAuthUser.username || nextAuthUser.name,
        email: nextAuthUser.email,
        first_name: nextAuthUser.name?.split(' ')[0] || 'User',
        last_name: nextAuthUser.name?.split(' ').slice(1).join(' ') || '',
        role: nextAuthUser.role || 'student',
        phone: nextAuthUser.phone || '',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      setUser(mappedUser);
    } else {
      setUser(null);
    }
  }, [session]);

  const refreshUser = async () => {
    // With NextAuth, session refreshes automatically
    // No need for manual refresh
  };

  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    try {
      const result = await signIn('credentials', {
        username: credentials.username,
        password: credentials.password,
        redirect: false,
      });

      if (result?.error) {
        toast.error('Invalid username or password');
        return false;
      } else if (result?.ok) {
        toast.success('Successfully logged in!');
        return true;
      }
      
      return false;
    } catch (error: any) {
      toast.error(error.message || 'Login failed');
      return false;
    }
  };

  const logout = async () => {
    try {
      await signOut({ redirect: false });
      setUser(null);
      router.push('/login');
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const displayName = user ? `${user.first_name} ${user.last_name}`.trim() || user.username : '';

  const value = {
    user,
    loading,
    login,
    logout,
    refreshUser,
    isAuthenticated: !!session && !!user,
    displayName,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
