
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { apiService } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';
import { 
  LayoutDashboard,
  User,
  BookOpen,
  Users,
  Calendar,
  BarChart3,
  LogOut,
  Music,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Settings,
  RotateCcw,
  ChevronDown
} from 'lucide-react';
import { Lesson, Student, Instructor } from '@/lib/types';
import { toast } from 'sonner';

export default function InstructorDashboard() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [profile, setProfile] = useState<Instructor | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Check if user can switch to admin role
  const canSwitchToAdmin = () => {
    return user?.role === 'admin' || 
           user?.assigned_roles?.some((role: any) => 
             role.permissions?.includes('admin_access'));
  };

  const handleRoleSwitch = (role: 'admin' | 'role-selection') => {
    if (role === 'admin') {
      router.push('/admin');
    } else {
      router.push('/role-selection');
    }
    toast.success(`Switched to ${role} view`);
  };

  useEffect(() => {
    loadInstructorData();
  }, []);

  const loadInstructorData = async () => {
    try {
      setLoading(true);
      const [instructorProfile, instructorLessons, instructorStudents, dashboard] = await Promise.all([
        apiService.getInstructorProfile().catch(() => null),
        apiService.getInstructorLessons().catch(() => []),
        apiService.getInstructorStudents().catch(() => []),
        apiService.getInstructorDashboard().catch(() => ({
          total_lessons: 45,
          upcoming_lessons: 8,
          completed_lessons: 37,
          total_students: 12,
          this_week_lessons: 5,
          completion_rate: 92
        }))
      ]);

      setProfile(instructorProfile);
      setLessons(instructorLessons);
      setStudents(instructorStudents);
      setDashboardData(dashboard);
    } catch (error) {
      toast.error('Failed to load instructor data');
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, description, color = "blue" }: any) => (
    <Card className="relative overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
        <Icon className={`h-4 w-4 text-${color}-500`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-gray-900">{value?.toString() || '0'}</div>
        {description && (
          <p className="text-xs text-gray-500 mt-1">{description}</p>
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
            <div className="w-8 h-8 bg-gradient-to-r from-green-600 to-blue-600 rounded-lg flex items-center justify-center">
              <Music className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Instructor Dashboard</h1>
              <p className="text-sm text-gray-500">Welcome back, {user?.first_name}!</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">{user?.first_name} {user?.last_name}</p>
              <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
            </div>
            
            {/* Role Switch Dropdown (only if user can switch to admin) */}
            {canSwitchToAdmin() && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="flex items-center gap-2">
                    <RotateCcw className="w-4 h-4" />
                    Switch Role
                    <ChevronDown className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => handleRoleSwitch('admin')}>
                    <Settings className="w-4 h-4 mr-2" />
                    Switch to Admin
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
              onClick={logout}
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
          <TabsList className="grid w-full grid-cols-6 bg-white rounded-lg shadow-sm">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="lessons" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Lessons
            </TabsTrigger>
            <TabsTrigger value="students" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Students
            </TabsTrigger>
            <TabsTrigger value="schedule" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Schedule
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Reports
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <StatCard
                title="Total Lessons"
                value={dashboardData?.total_lessons}
                icon={BookOpen}
                description="All time lessons taught"
                color="blue"
              />
              <StatCard
                title="Upcoming Lessons"
                value={dashboardData?.upcoming_lessons}
                icon={Clock}
                description="Lessons scheduled ahead"
                color="orange"
              />
              <StatCard
                title="Total Students"
                value={dashboardData?.total_students}
                icon={Users}
                description="Active students"
                color="green"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Lessons</CardTitle>
                  <CardDescription>Your recent teaching activities</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {lessons?.slice(0, 5).map((lesson, index) => (
                      <div key={lesson?.id || index} className="flex items-center gap-3 pb-3 border-b border-gray-100 last:border-0">
                        <div className={`w-2 h-2 rounded-full ${
                          lesson?.status === 'completed' ? 'bg-green-500' :
                          lesson?.status === 'cancelled' ? 'bg-red-500' :
                          'bg-blue-500'
                        }`}></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{lesson?.title || 'Lesson'}</p>
                          <p className="text-xs text-gray-500">
                            {lesson?.scheduled_at ? new Date(lesson.scheduled_at).toLocaleString() : 'Not scheduled'}
                          </p>
                        </div>
                        <Badge variant={
                          lesson?.status === 'completed' ? 'default' :
                          lesson?.status === 'cancelled' ? 'destructive' :
                          'secondary'
                        } className={lesson?.status === 'completed' ? 'bg-green-100 text-green-800' : ''}>
                          {lesson?.status || 'scheduled'}
                        </Badge>
                      </div>
                    )) || (
                      <div className="text-center py-8 text-gray-500">
                        <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>No lessons found</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Performance Overview</CardTitle>
                  <CardDescription>Your teaching performance metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-sm text-gray-600">Completion Rate</span>
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-bold text-gray-900">{dashboardData?.completion_rate || 0}%</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-blue-500" />
                        <span className="text-sm text-gray-600">This Week</span>
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-bold text-gray-900">{dashboardData?.this_week_lessons || 0}</span>
                        <p className="text-xs text-gray-500">lessons</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-orange-500" />
                        <span className="text-sm text-gray-600">Average Rating</span>
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-bold text-gray-900">4.8</span>
                        <p className="text-xs text-gray-500">out of 5</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Instructor Profile</CardTitle>
                <CardDescription>Manage your professional information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-r from-green-500 to-blue-500 flex items-center justify-center text-white text-2xl font-bold">
                    {user?.first_name?.[0] || 'I'}{user?.last_name?.[0] || ''}
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-gray-900">{user?.first_name} {user?.last_name}</h2>
                    <p className="text-gray-600">{user?.email}</p>
                    <Badge variant="secondary">{user?.role}</Badge>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900">Professional Details</h3>
                    <div className="space-y-3">
                      <div className="p-3 border border-gray-200 rounded-lg">
                        <label className="text-sm font-medium text-gray-500">Bio</label>
                        <p className="text-sm text-gray-900 mt-1">
                          {profile?.bio || 'No bio available. Add your professional background here.'}
                        </p>
                      </div>
                      <div className="p-3 border border-gray-200 rounded-lg">
                        <label className="text-sm font-medium text-gray-500">Specialties</label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {profile?.specialties && profile.specialties.length > 0 ? (
                            profile.specialties.map((specialty, index) => (
                              <Badge key={index} variant="outline">{specialty}</Badge>
                            ))
                          ) : (
                            <span className="text-sm text-gray-500">No specialties listed</span>
                          )}
                        </div>
                      </div>
                      <div className="p-3 border border-gray-200 rounded-lg">
                        <label className="text-sm font-medium text-gray-500">Hourly Rate</label>
                        <p className="text-sm text-gray-900 mt-1">
                          {profile?.hourly_rate ? `$${profile.hourly_rate}/hour` : 'Not set'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900">Account Information</h3>
                    <div className="space-y-3">
                      <div className="p-3 border border-gray-200 rounded-lg">
                        <label className="text-sm font-medium text-gray-500">Username</label>
                        <p className="text-sm text-gray-900 mt-1">{user?.username}</p>
                      </div>
                      <div className="p-3 border border-gray-200 rounded-lg">
                        <label className="text-sm font-medium text-gray-500">Join Date</label>
                        <p className="text-sm text-gray-900 mt-1">
                          {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Not available'}
                        </p>
                      </div>
                      <div className="p-3 border border-gray-200 rounded-lg">
                        <label className="text-sm font-medium text-gray-500">Status</label>
                        <Badge variant={user?.is_active ? 'default' : 'destructive'} className={user?.is_active ? 'bg-green-100 text-green-800' : ''}>
                          {user?.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <Button className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700">
                    Edit Profile
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Lessons Tab */}
          <TabsContent value="lessons" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>My Lessons</CardTitle>
                <CardDescription>View and manage your teaching schedule</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {lessons?.length > 0 ? (
                    lessons.map((lesson, index) => (
                      <div key={lesson?.id || index} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-medium text-gray-900">{lesson?.title || 'Untitled Lesson'}</h3>
                          <div className="flex items-center gap-2">
                            <Badge variant={
                              lesson?.status === 'completed' ? 'default' :
                              lesson?.status === 'cancelled' ? 'destructive' :
                              'secondary'
                            } className={lesson?.status === 'completed' ? 'bg-green-100 text-green-800' : ''}>
                              {lesson?.status || 'scheduled'}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            <span>{lesson?.duration_minutes || 60} minutes</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>
                              {lesson?.scheduled_at ? 
                                new Date(lesson.scheduled_at).toLocaleDateString() : 
                                'Not scheduled'
                              }
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            <span>Student ID: {lesson?.student_id || 'Not assigned'}</span>
                          </div>
                        </div>

                        {lesson?.description && (
                          <p className="text-sm text-gray-600 mt-3 p-3 bg-gray-50 rounded">
                            {lesson.description}
                          </p>
                        )}

                        {lesson?.notes && (
                          <div className="mt-3">
                            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Notes</label>
                            <p className="text-sm text-gray-600 mt-1">{lesson.notes}</p>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium">No lessons scheduled</p>
                      <p className="text-sm">Your lessons will appear here once scheduled</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Students Tab */}
          <TabsContent value="students" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>My Students</CardTitle>
                <CardDescription>Manage your student roster</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {students?.length > 0 ? (
                    students.map((student, index) => (
                      <div key={student?.id || index} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-medium">
                            {student?.user?.first_name?.[0] || 'S'}{student?.user?.last_name?.[0] || ''}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {student?.user?.first_name || 'Unknown'} {student?.user?.last_name || 'Student'}
                            </p>
                            <p className="text-xs text-gray-500">{student?.user?.email}</p>
                          </div>
                        </div>
                        
                        <div className="space-y-2 text-sm">
                          {student?.instrument && (
                            <div className="flex items-center justify-between">
                              <span className="text-gray-600">Instrument:</span>
                              <Badge variant="outline">{student.instrument}</Badge>
                            </div>
                          )}
                          {student?.skill_level && (
                            <div className="flex items-center justify-between">
                              <span className="text-gray-600">Level:</span>
                              <Badge variant="secondary">{student.skill_level}</Badge>
                            </div>
                          )}
                        </div>

                        {student?.notes && (
                          <div className="mt-3 p-2 bg-gray-50 rounded text-xs text-gray-600">
                            <strong>Notes:</strong> {student.notes}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full text-center py-12 text-gray-500">
                      <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium">No students assigned</p>
                      <p className="text-sm">Students will appear here once enrolled</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Schedule Tab */}
          <TabsContent value="schedule" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Teaching Schedule</CardTitle>
                <CardDescription>Your upcoming lessons and availability</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-medium text-gray-900 mb-4">This Week's Lessons</h3>
                      <div className="space-y-3">
                        {lessons?.filter(lesson => lesson?.status === 'scheduled').slice(0, 5).map((lesson, index) => (
                          <div key={lesson?.id || index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                            <div>
                              <p className="font-medium text-gray-900">{lesson?.title || 'Lesson'}</p>
                              <p className="text-sm text-gray-500">
                                {lesson?.scheduled_at ? 
                                  new Date(lesson.scheduled_at).toLocaleString() : 
                                  'Time TBD'
                                }
                              </p>
                            </div>
                            <Badge variant="secondary">{lesson?.duration_minutes || 60} min</Badge>
                          </div>
                        )) || (
                          <div className="text-center py-6 text-gray-500">
                            <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p>No scheduled lessons</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <h3 className="font-medium text-gray-900 mb-4">Availability</h3>
                      <div className="space-y-3">
                        <div className="p-4 border border-gray-200 rounded-lg">
                          <p className="text-sm text-gray-600 mb-2">Current Availability:</p>
                          <p className="text-sm text-gray-900">
                            {profile?.availability || 'Please set your availability'}
                          </p>
                          <Button variant="outline" size="sm" className="mt-2">
                            Update Availability
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Teaching Reports</CardTitle>
                <CardDescription>View your teaching performance and statistics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="p-6 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                    <BarChart3 className="w-8 h-8 text-blue-600 mb-4" />
                    <h3 className="font-medium text-gray-900 mb-2">Lesson Performance</h3>
                    <p className="text-sm text-gray-500 mb-4">View lesson completion rates and student feedback</p>
                    <Button variant="outline" size="sm">View Report</Button>
                  </div>
                  
                  <div className="p-6 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                    <TrendingUp className="w-8 h-8 text-green-600 mb-4" />
                    <h3 className="font-medium text-gray-900 mb-2">Student Progress</h3>
                    <p className="text-sm text-gray-500 mb-4">Track your students' learning progress</p>
                    <Button variant="outline" size="sm">View Report</Button>
                  </div>
                  
                  <div className="p-6 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                    <Calendar className="w-8 h-8 text-purple-600 mb-4" />
                    <h3 className="font-medium text-gray-900 mb-2">Monthly Summary</h3>
                    <p className="text-sm text-gray-500 mb-4">Monthly teaching activity and earnings summary</p>
                    <Button variant="outline" size="sm">View Report</Button>
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
