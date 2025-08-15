
'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, LoginCredentials } from '@/lib/types';
import { apiService } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credentials: LoginCredentials) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const refreshUser = async () => {
    try {
      const currentUser = await apiService.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error('Failed to refresh user:', error);
      setUser(null);
    }
  };

  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    try {
      setLoading(true);
      const response = await apiService.login(credentials);
      setUser(response.user);
      
      // Check if instructor has admin privileges
      const hasAdminPrivileges = response.user.role === 'admin' || 
        response.user.assigned_roles?.some((role: any) => 
          role.permissions?.includes('admin_access'));
      
      const isInstructor = response.user.role === 'instructor' ||
        response.user.assigned_roles?.some((role: any) => 
          role.permissions?.some((perm: string) => perm.startsWith('teach_')));
      
      // Redirect based on role and privileges
      if (hasAdminPrivileges && isInstructor) {
        // User has both instructor and admin privileges, show role selection
        router.push('/role-selection');
      } else if (response.user.role === 'admin') {
        router.push('/admin');
      } else if (response.user.role === 'instructor') {
        router.push('/instructor');
      } else {
        router.push('/dashboard');
      }
      
      toast.success('Successfully logged in!');
      return true;
    } catch (error: any) {
      toast.error(error.message || 'Login failed');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await apiService.logout();
      setUser(null);
      router.push('/login');
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        if (token) {
          await refreshUser();
        }
      } catch (error) {
        console.error('Auth initialization failed:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const value = {
    user,
    loading,
    login,
    logout,
    refreshUser,
    isAuthenticated: !!user,
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
