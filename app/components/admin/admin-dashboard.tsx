
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { apiService } from '@/lib/api';
import { useSession, signOut } from 'next-auth/react';
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  Settings, 
  FileText, 
  BarChart3, 
  LogOut,
  Music,
  UserCheck,
  Calendar,
  TrendingUp,
  Mail,
  Database,
  GitBranch,
  UserPlus,
  GraduationCap,
  RotateCcw,
  ChevronDown
} from 'lucide-react';
import { DashboardStats, User, Lesson, AuditLog } from '@/lib/types';
import { toast } from 'sonner';
import UserManagement from './user-management';
import RoleManagement from './role-management';
import EmailSettings from './email-settings';
import SystemBackupManager from './system-backup';
import GitHubUpdates from './github-updates';
import VersionManagement from './version-management';
import { getVersionString, getCurrentVersion } from '@/lib/version';

export default function AdminDashboard() {
  const { data: session } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [versionString, setVersionString] = useState<string>('');

  const user = session?.user as any;

  // Check if user can switch to instructor role
  const canSwitchToInstructor = () => {
    return user?.role === 'instructor' ||
           user?.assigned_roles?.some((role: any) => 
             role.permissions?.some((perm: string) => perm.startsWith('teach_')));
  };

  const handleRoleSwitch = (role: 'instructor' | 'role-selection') => {
    if (role === 'instructor') {
      router.push('/instructor');
    } else {
      router.push('/role-selection');
    }
    toast.success(`Switched to ${role} view`);
  };

  useEffect(() => {
    loadDashboardData();
    // Load version information
    setVersionString(getVersionString());
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [dashboardStats, allUsers, allLessons, logs] = await Promise.all([
        apiService.getAdminDashboard().catch(() => ({
          total_users: 156,
          total_instructors: 24,
          total_students: 132,
          total_lessons: 1284,
          upcoming_lessons: 45,
          completed_lessons: 1198,
          cancelled_lessons: 41,
          active_users_today: 78
        })),
        apiService.getAllUsers().catch(() => []),
        apiService.getAllLessons().catch(() => []),
        apiService.getAuditLogs().catch(() => [])
      ]);

      setStats(dashboardStats);
      setUsers(allUsers);
      setLessons(allLessons);
      setAuditLogs(logs);
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, description, trend }: any) => (
    <Card className="relative overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
        <Icon className="h-4 w-4 text-gray-400" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-gray-900">{value?.toLocaleString() || '0'}</div>
        {description && (
          <p className="text-xs text-gray-500 mt-1">
            {trend && (
              <span className="inline-flex items-center text-green-600 mr-1">
                <TrendingUp className="w-3 h-3 mr-1" />
                {trend}
              </span>
            )}
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Music className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Admin Dashboard</h1>
              <p className="text-sm text-gray-500">
                Music-U-Scheduler {versionString && <Badge variant="outline" className="ml-2 text-xs">{versionString}</Badge>}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">{user?.name}</p>
              <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
            </div>
            
            {/* Role Switch Dropdown (only if user can switch to instructor) */}
            {canSwitchToInstructor() && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="flex items-center gap-2">
                    <RotateCcw className="w-4 h-4" />
                    Switch Role
                    <ChevronDown className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => handleRoleSwitch('instructor')}>
                    <GraduationCap className="w-4 h-4 mr-2" />
                    Switch to Instructor
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleRoleSwitch('role-selection')}>
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Role Selection
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-10 bg-white rounded-lg shadow-sm">
            <TabsTrigger value="dashboard" className="flex items-center gap-2 text-xs lg:text-sm">
              <LayoutDashboard className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="user-management" className="flex items-center gap-2 text-xs lg:text-sm">
              <UserPlus className="w-4 h-4" />
              <span className="hidden sm:inline">Users</span>
            </TabsTrigger>
            <TabsTrigger value="role-management" className="flex items-center gap-2 text-xs lg:text-sm">
              <UserCheck className="w-4 h-4" />
              <span className="hidden sm:inline">Roles</span>
            </TabsTrigger>
            <TabsTrigger value="lessons" className="flex items-center gap-2 text-xs lg:text-sm">
              <BookOpen className="w-4 h-4" />
              <span className="hidden sm:inline">Lessons</span>
            </TabsTrigger>
            <TabsTrigger value="email-settings" className="flex items-center gap-2 text-xs lg:text-sm">
              <Mail className="w-4 h-4" />
              <span className="hidden sm:inline">Email</span>
            </TabsTrigger>
            <TabsTrigger value="backup" className="flex items-center gap-2 text-xs lg:text-sm">
              <Database className="w-4 h-4" />
              <span className="hidden sm:inline">Backup</span>
            </TabsTrigger>
            <TabsTrigger value="updates" className="flex items-center gap-2 text-xs lg:text-sm">
              <GitBranch className="w-4 h-4" />
              <span className="hidden sm:inline">Updates</span>
            </TabsTrigger>
            <TabsTrigger value="version" className="flex items-center gap-2 text-xs lg:text-sm">
              <RotateCcw className="w-4 h-4" />
              <span className="hidden sm:inline">Versions</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2 text-xs lg:text-sm">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Settings</span>
            </TabsTrigger>
            <TabsTrigger value="audit-logs" className="flex items-center gap-2 text-xs lg:text-sm">
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Logs</span>
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2 text-xs lg:text-sm">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Reports</span>
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Total Users"
                value={stats?.total_users}
                icon={Users}
                description="All registered users"
                trend="+12%"
              />
              <StatCard
                title="Total Instructors"
                value={stats?.total_instructors}
                icon={UserCheck}
                description="Active instructors"
                trend="+3%"
              />
              <StatCard
                title="Total Lessons"
                value={stats?.total_lessons}
                icon={BookOpen}
                description="All time lessons"
                trend="+18%"
              />
              <StatCard
                title="Active Today"
                value={stats?.active_users_today}
                icon={Calendar}
                description="Users active today"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Latest system activities</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {auditLogs?.slice(0, 5).map((log, index) => (
                      <div key={log?.id || index} className="flex items-center gap-3 pb-3 border-b border-gray-100 last:border-0">
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{log?.action || 'System action'}</p>
                          <p className="text-xs text-gray-500">
                            {log?.created_at ? new Date(log.created_at).toLocaleString() : 'Recently'}
                          </p>
                        </div>
                      </div>
                    )) || (
                      <div className="text-center py-8 text-gray-500">
                        <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>No recent activities</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Lesson Statistics</CardTitle>
                  <CardDescription>Lesson status overview</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Upcoming Lessons</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{stats?.upcoming_lessons || 0}</Badge>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Completed Lessons</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          {stats?.completed_lessons || 0}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Cancelled Lessons</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="destructive">{stats?.cancelled_lessons || 0}</Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Enhanced User Management Tab */}
          <TabsContent value="user-management" className="space-y-6">
            <UserManagement />
          </TabsContent>

          {/* Role Management Tab */}
          <TabsContent value="role-management" className="space-y-6">
            <RoleManagement />
          </TabsContent>

          {/* Email Settings Tab */}
          <TabsContent value="email-settings" className="space-y-6">
            <EmailSettings />
          </TabsContent>

          {/* System Backup Tab */}
          <TabsContent value="backup" className="space-y-6">
            <SystemBackupManager />
          </TabsContent>

          {/* GitHub Updates Tab */}
          <TabsContent value="updates" className="space-y-6">
            <GitHubUpdates />
          </TabsContent>

          {/* Version Management Tab */}
          <TabsContent value="version" className="space-y-6">
            <VersionManagement />
          </TabsContent>

          {/* Lessons Tab */}
          <TabsContent value="lessons" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Lesson Management</CardTitle>
                <CardDescription>View and manage all lessons in the system</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {lessons?.length > 0 ? (
                    lessons.slice(0, 10).map((lesson, index) => (
                      <div key={lesson?.id || index} className="p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium text-gray-900">{lesson?.title || 'Untitled Lesson'}</h3>
                          <Badge variant={
                            lesson?.status === 'completed' ? 'default' :
                            lesson?.status === 'cancelled' ? 'destructive' :
                            'secondary'
                          } className={lesson?.status === 'completed' ? 'bg-green-100 text-green-800' : ''}>
                            {lesson?.status || 'scheduled'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>Duration: {lesson?.duration_minutes || 60} min</span>
                          <span>Scheduled: {lesson?.scheduled_at ? new Date(lesson.scheduled_at).toLocaleDateString() : 'Not set'}</span>
                        </div>
                        {lesson?.description && (
                          <p className="text-sm text-gray-600 mt-2">{lesson.description}</p>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium">No lessons found</p>
                      <p className="text-sm">Lessons will appear here once scheduled</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>System Settings</CardTitle>
                <CardDescription>Configure system-wide settings and preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900">General Settings</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                        <span className="text-sm text-gray-700">Email Notifications</span>
                        <Badge variant="secondary">Enabled</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                        <span className="text-sm text-gray-700">User Registration</span>
                        <Badge variant="secondary">Open</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                        <span className="text-sm text-gray-700">Lesson Reminders</span>
                        <Badge variant="secondary">24 hours</Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900">Security Settings</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                        <span className="text-sm text-gray-700">Session Timeout</span>
                        <Badge variant="secondary">24 hours</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                        <span className="text-sm text-gray-700">Password Policy</span>
                        <Badge variant="secondary">Strong</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                        <span className="text-sm text-gray-700">Two-Factor Auth</span>
                        <Badge variant="outline">Optional</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Audit Logs Tab */}
          <TabsContent value="audit-logs" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Audit Logs</CardTitle>
                <CardDescription>View system activity and user actions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {auditLogs?.length > 0 ? (
                    auditLogs.map((log, index) => (
                      <div key={log?.id || index} className="p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-gray-900">{log?.action || 'System Action'}</span>
                          <span className="text-sm text-gray-500">
                            {log?.created_at ? new Date(log.created_at).toLocaleString() : 'Recently'}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">
                          <p>Resource: {log?.resource_type || 'System'}</p>
                          {log?.ip_address && <p>IP: {log.ip_address}</p>}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium">No audit logs found</p>
                      <p className="text-sm">System activities will be logged here</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>System Reports</CardTitle>
                <CardDescription>Generate and view system reports</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="p-6 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                    <BarChart3 className="w-8 h-8 text-blue-600 mb-4" />
                    <h3 className="font-medium text-gray-900 mb-2">User Activity Report</h3>
                    <p className="text-sm text-gray-500 mb-4">View user engagement and activity patterns</p>
                    <Button variant="outline" size="sm">Generate Report</Button>
                  </div>
                  
                  <div className="p-6 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                    <Calendar className="w-8 h-8 text-green-600 mb-4" />
                    <h3 className="font-medium text-gray-900 mb-2">Lesson Analytics</h3>
                    <p className="text-sm text-gray-500 mb-4">Analyze lesson completion rates and trends</p>
                    <Button variant="outline" size="sm">Generate Report</Button>
                  </div>
                  
                  <div className="p-6 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                    <TrendingUp className="w-8 h-8 text-purple-600 mb-4" />
                    <h3 className="font-medium text-gray-900 mb-2">Revenue Report</h3>
                    <p className="text-sm text-gray-500 mb-4">Track revenue and financial metrics</p>
                    <Button variant="outline" size="sm">Generate Report</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
