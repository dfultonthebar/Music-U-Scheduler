
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Settings, User, GraduationCap, Music, LogOut } from 'lucide-react';
import { toast } from 'sonner';

interface RoleSelectionProps {
  user: any;
}

export default function RoleSelection({ user }: RoleSelectionProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { logout } = useAuth();

  const hasAdminPrivileges = () => {
    // Check if user has admin role or admin permissions
    if (user?.role === 'admin') return true;
    
    // Check if instructor has admin_access permission
    if (user?.assigned_roles?.some((role: any) => 
      role.permissions?.includes('admin_access'))) {
      return true;
    }

    return false;
  };

  const isInstructor = () => {
    return user?.role === 'instructor' || 
           user?.assigned_roles?.some((role: any) => 
             role.permissions?.some((perm: string) => perm.startsWith('teach_')));
  };

  const handleRoleSelection = async (selectedRole: 'admin' | 'instructor') => {
    setIsLoading(true);
    
    try {
      // Store the selected role in session storage for this session
      sessionStorage.setItem('selected_role', selectedRole);
      
      // Redirect based on selection
      if (selectedRole === 'admin') {
        router.push('/admin');
      } else {
        router.push('/instructor');
      }
      
      toast.success(`Switched to ${selectedRole} dashboard`);
    } catch (error) {
      toast.error('Failed to switch roles');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  // If user doesn't have admin privileges or isn't an instructor, redirect them
  useEffect(() => {
    if (!hasAdminPrivileges() && user?.role !== 'instructor') {
      if (user?.role === 'admin') {
        router.push('/admin');
      } else if (user?.role === 'student') {
        router.push('/dashboard');
      } else {
        router.push('/login');
      }
    }
  }, [user, router]);

  if (!hasAdminPrivileges() && user?.role !== 'instructor') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm">
          <CardHeader className="text-center pb-6">
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mb-4">
              <Music className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Welcome, {user?.first_name} {user?.last_name}
            </CardTitle>
            <CardDescription className="text-gray-600 mt-2">
              Choose your role to access the appropriate dashboard
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Admin Role Card */}
              {hasAdminPrivileges() && (
                <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-blue-300 group">
                  <CardContent className="p-6">
                    <div className="text-center space-y-4">
                      <div className="mx-auto w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                        <Settings className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Admin Dashboard</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Manage users, system settings, and administrative tasks
                        </p>
                      </div>
                      <Button
                        onClick={() => handleRoleSelection('admin')}
                        disabled={isLoading}
                        className="w-full bg-blue-600 hover:bg-blue-700"
                      >
                        {isLoading ? 'Loading...' : 'Enter Admin Dashboard'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Instructor Role Card */}
              {isInstructor() && (
                <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-green-300 group">
                  <CardContent className="p-6">
                    <div className="text-center space-y-4">
                      <div className="mx-auto w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                        <GraduationCap className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Instructor Dashboard</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Manage lessons, students, and teaching schedule
                        </p>
                      </div>
                      <Button
                        onClick={() => handleRoleSelection('instructor')}
                        disabled={isLoading}
                        className="w-full bg-green-600 hover:bg-green-700"
                      >
                        {isLoading ? 'Loading...' : 'Enter Instructor Dashboard'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* User Info */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <User className="w-5 h-5 text-gray-500" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {user?.first_name} {user?.last_name}
                  </p>
                  <p className="text-sm text-gray-600">{user?.email}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Primary Role: {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
                  </p>
                </div>
              </div>
            </div>

            {/* Logout Button */}
            <div className="pt-4 border-t border-gray-200">
              <Button
                variant="outline"
                onClick={handleLogout}
                className="w-full hover:bg-gray-50"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Help Text */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            You can switch between roles at any time from your dashboard.
          </p>
        </div>
      </div>
    </div>
  );
}
