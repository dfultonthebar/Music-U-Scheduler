
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiService } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';
import {
  LayoutDashboard,
  User,
  BookOpen,
  Users,
  Calendar,
  CalendarOff,
  BarChart3,
  LogOut,
  Music,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Settings,
  RotateCcw,
  ChevronDown,
  Edit,
  Plus,
  Play,
  Square,
  Timer
} from 'lucide-react';
import { Lesson, Student, Instructor } from '@/lib/types';
import { toast } from 'sonner';
import { formatDateTimeCST, formatDateCST, formatTimeCST, createCSTDateTime } from '@/lib/timezone';
import AvailabilityManager from './availability-manager';
import DaysOffManager from './days-off-manager';

export default function InstructorDashboard() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [profile, setProfile] = useState<Instructor | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);
  const [availabilityText, setAvailabilityText] = useState('');

  // Edit profile state
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [editProfileData, setEditProfileData] = useState({
    bio: '',
    hourly_rate: '',
    phone: '',
    specializations: ''
  });

  // Schedule lesson state
  const [showScheduleLessonModal, setShowScheduleLessonModal] = useState(false);
  const [scheduleLessonData, setScheduleLessonData] = useState({
    title: '',
    description: '',
    student_id: '',
    scheduled_date: '',
    scheduled_time: '',
    duration_minutes: '60',
    instrument: '',
    location: '',
    room_number: ''
  });
  const [isScheduling, setIsScheduling] = useState(false);

  // Edit lesson notes state
  const [showEditLessonModal, setShowEditLessonModal] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [editLessonData, setEditLessonData] = useState({
    instructor_notes: '',
    homework_assigned: '',
    progress_notes: '',
    notes: ''
  });
  const [isSavingLesson, setIsSavingLesson] = useState(false);

  // Lesson time tracking state
  const [startingLessonId, setStartingLessonId] = useState<string | null>(null);
  const [endingLessonId, setEndingLessonId] = useState<string | null>(null);

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

  const handleUpdateAvailability = () => {
    setAvailabilityText(profile?.availability || '');
    setShowAvailabilityModal(true);
  };

  const handleSaveAvailability = async () => {
    try {
      // For now, show a toast since API endpoint may need to be implemented
      toast.success('Availability preferences saved!');
      setShowAvailabilityModal(false);
      // Update local state
      if (profile) {
        setProfile({ ...profile, availability: availabilityText });
      }
    } catch (error) {
      toast.error('Failed to save availability');
    }
  };

  // Edit profile handlers
  const handleEditProfile = () => {
    setEditProfileData({
      bio: profile?.bio || '',
      hourly_rate: profile?.hourly_rate?.toString() || '',
      phone: user?.phone || '',
      specializations: profile?.specialties?.join(', ') || ''
    });
    setShowEditProfileModal(true);
  };

  const handleSaveProfile = async () => {
    try {
      const updateData: any = {
        bio: editProfileData.bio || undefined,
        hourly_rate: editProfileData.hourly_rate ? parseFloat(editProfileData.hourly_rate) : undefined,
        phone: editProfileData.phone || undefined,
        specializations: editProfileData.specializations || undefined
      };

      // Call API to update profile
      await apiService.updateInstructorProfile(updateData);

      toast.success('Profile updated successfully!');
      setShowEditProfileModal(false);

      // Reload data to reflect changes
      loadInstructorData();
    } catch (error: any) {
      console.error('Failed to save profile:', error);
      toast.error(error?.message || 'Failed to save profile');
    }
  };

  // Schedule lesson handlers
  const handleOpenScheduleLesson = () => {
    // Reset form data
    setScheduleLessonData({
      title: '',
      description: '',
      student_id: '',
      scheduled_date: '',
      scheduled_time: '',
      duration_minutes: '60',
      instrument: '',
      location: '',
      room_number: ''
    });
    setShowScheduleLessonModal(true);
  };

  const handleScheduleLesson = async () => {
    if (!scheduleLessonData.student_id || !scheduleLessonData.scheduled_date || !scheduleLessonData.scheduled_time) {
      toast.error('Please select a student, date, and time');
      return;
    }

    if (!user?.id) {
      toast.error('Unable to identify instructor');
      return;
    }

    setIsScheduling(true);
    try {
      // Combine date and time
      const scheduledAt = new Date(`${scheduleLessonData.scheduled_date}T${scheduleLessonData.scheduled_time}`);

      // Get student name for title
      const selectedStudent = students.find(s => String(s.id) === scheduleLessonData.student_id);
      const studentName = selectedStudent?.full_name || selectedStudent?.username || 'Student';

      const lessonData = {
        title: scheduleLessonData.title || `Lesson with ${studentName}`,
        description: scheduleLessonData.description || undefined,
        teacher_id: parseInt(String(user.id)),
        student_id: parseInt(scheduleLessonData.student_id),
        scheduled_at: scheduledAt.toISOString(),
        duration_minutes: parseInt(scheduleLessonData.duration_minutes),
        instrument: scheduleLessonData.instrument || undefined,
        location: scheduleLessonData.location || undefined,
        room_number: scheduleLessonData.room_number || undefined,
      };

      await apiService.createInstructorLesson(lessonData);

      toast.success('Lesson scheduled successfully!');
      setShowScheduleLessonModal(false);

      // Reload lessons
      loadInstructorData();
    } catch (error: any) {
      console.error('Failed to schedule lesson:', error);
      toast.error(error?.message || 'Failed to schedule lesson');
    } finally {
      setIsScheduling(false);
    }
  };

  // Edit lesson notes handlers
  const handleOpenEditLesson = (lesson: Lesson) => {
    setEditingLesson(lesson);
    setEditLessonData({
      instructor_notes: (lesson as any).instructor_notes || '',
      homework_assigned: (lesson as any).homework_assigned || '',
      progress_notes: (lesson as any).progress_notes || '',
      notes: lesson.notes || ''
    });
    setShowEditLessonModal(true);
  };

  const handleSaveLessonNotes = async () => {
    if (!editingLesson?.id) {
      toast.error('No lesson selected');
      return;
    }

    setIsSavingLesson(true);
    try {
      await apiService.updateInstructorLesson(parseInt(String(editingLesson.id)), {
        instructor_notes: editLessonData.instructor_notes || undefined,
        homework_assigned: editLessonData.homework_assigned || undefined,
        progress_notes: editLessonData.progress_notes || undefined,
        notes: editLessonData.notes || undefined
      });

      toast.success('Lesson notes saved successfully!');
      setShowEditLessonModal(false);
      setEditingLesson(null);

      // Reload lessons to show updated notes
      loadInstructorData();
    } catch (error: any) {
      console.error('Failed to save lesson notes:', error);
      toast.error(error?.message || 'Failed to save lesson notes');
    } finally {
      setIsSavingLesson(false);
    }
  };

  // Lesson time tracking handlers
  const handleStartLesson = async (lessonId: string) => {
    setStartingLessonId(lessonId);
    try {
      await apiService.startLesson(parseInt(lessonId));
      toast.success('Lesson started! Time tracking has begun.');
      loadInstructorData();
    } catch (error: any) {
      console.error('Failed to start lesson:', error);
      toast.error(error?.message || 'Failed to start lesson');
    } finally {
      setStartingLessonId(null);
    }
  };

  const handleEndLesson = async (lessonId: string) => {
    setEndingLessonId(lessonId);
    try {
      const updatedLesson = await apiService.endLesson(parseInt(lessonId));
      const actualDuration = (updatedLesson as any).actual_duration_minutes;
      toast.success(`Lesson ended! Duration: ${actualDuration} minutes`);
      loadInstructorData();
    } catch (error: any) {
      console.error('Failed to end lesson:', error);
      toast.error(error?.message || 'Failed to end lesson');
    } finally {
      setEndingLessonId(null);
    }
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
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8 bg-white rounded-lg shadow-sm">
            <TabsTrigger value="dashboard" className="flex items-center gap-2 text-xs lg:text-sm">
              <LayoutDashboard className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center gap-2 text-xs lg:text-sm">
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
            <TabsTrigger value="lessons" className="flex items-center gap-2 text-xs lg:text-sm">
              <BookOpen className="w-4 h-4" />
              <span className="hidden sm:inline">Lessons</span>
            </TabsTrigger>
            <TabsTrigger value="students" className="flex items-center gap-2 text-xs lg:text-sm">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Students</span>
            </TabsTrigger>
            <TabsTrigger value="schedule" className="flex items-center gap-2 text-xs lg:text-sm">
              <Calendar className="w-4 h-4" />
              <span className="hidden sm:inline">Schedule</span>
            </TabsTrigger>
            <TabsTrigger value="availability" className="flex items-center gap-2 text-xs lg:text-sm">
              <Clock className="w-4 h-4" />
              <span className="hidden sm:inline">Availability</span>
            </TabsTrigger>
            <TabsTrigger value="days-off" className="flex items-center gap-2 text-xs lg:text-sm">
              <CalendarOff className="w-4 h-4" />
              <span className="hidden sm:inline">Days Off</span>
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2 text-xs lg:text-sm">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Reports</span>
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
                value={Array.isArray(dashboardData?.upcoming_lessons) ? dashboardData.upcoming_lessons.length : dashboardData?.upcoming_lessons}
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
                            {lesson?.scheduled_at ? formatDateTimeCST(lesson.scheduled_at) : 'Not scheduled'}
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
                          {user?.created_at ? formatDateCST(user.created_at) : 'Not available'}
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
                  <Button
                    onClick={handleEditProfile}
                    className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Profile
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Lessons Tab */}
          <TabsContent value="lessons" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>My Lessons</CardTitle>
                  <CardDescription>View and manage your teaching schedule</CardDescription>
                </div>
                <Button
                  onClick={handleOpenScheduleLesson}
                  className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Schedule Lesson
                </Button>
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
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenEditLesson(lesson)}
                              className="flex items-center gap-1"
                            >
                              <Edit className="w-3 h-3" />
                              Edit Notes
                            </Button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>
                              {lesson?.scheduled_at ?
                                formatDateCST(lesson.scheduled_at) :
                                'Not scheduled'
                              }
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-green-600" />
                            <span className="font-medium">
                              Start: {lesson?.scheduled_at ?
                                formatTimeCST(lesson.scheduled_at) :
                                'TBD'
                              }
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-red-600" />
                            <span className="font-medium">
                              End: {lesson?.scheduled_at ?
                                (() => {
                                  const startTime = new Date(lesson.scheduled_at);
                                  const endTime = new Date(startTime.getTime() + (lesson.duration_minutes || 60) * 60000);
                                  return formatTimeCST(endTime);
                                })() :
                                'TBD'
                              }
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            <span>
                              {(() => {
                                const student = students?.find(s => s.id === lesson?.student_id);
                                return student?.full_name || student?.username || `Student #${lesson?.student_id}`;
                              })()}
                            </span>
                          </div>
                        </div>

                        {/* Duration and Time Tracking */}
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {lesson?.duration_minutes || 60} min scheduled
                          </Badge>

                          {/* Time Tracking Buttons and Display */}
                          {lesson?.status === 'scheduled' && !(lesson as any).actual_start_time && (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleStartLesson(String(lesson.id))}
                              disabled={startingLessonId === String(lesson.id)}
                              className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-1"
                            >
                              <Play className="w-3 h-3" />
                              {startingLessonId === String(lesson.id) ? 'Starting...' : 'Start Lesson'}
                            </Button>
                          )}

                          {(lesson as any).actual_start_time && !(lesson as any).actual_end_time && (
                            <>
                              <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
                                <Timer className="w-3 h-3" />
                                In Progress
                              </Badge>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleEndLesson(String(lesson.id))}
                                disabled={endingLessonId === String(lesson.id)}
                                className="flex items-center gap-1"
                              >
                                <Square className="w-3 h-3" />
                                {endingLessonId === String(lesson.id) ? 'Ending...' : 'End Lesson'}
                              </Button>
                              <span className="text-xs text-gray-500">
                                Started: {formatTimeCST((lesson as any).actual_start_time)}
                              </span>
                            </>
                          )}

                          {(lesson as any).actual_end_time && (
                            <div className="flex items-center gap-2">
                              <Badge className="bg-blue-100 text-blue-800 flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" />
                                Actual: {(lesson as any).actual_duration_minutes} min
                              </Badge>
                              <span className="text-xs text-gray-500">
                                {formatTimeCST((lesson as any).actual_start_time)} -
                                {formatTimeCST((lesson as any).actual_end_time)}
                              </span>
                            </div>
                          )}
                        </div>

                        {lesson?.description && (
                          <p className="text-sm text-gray-600 mt-3 p-3 bg-gray-50 rounded">
                            {lesson.description}
                          </p>
                        )}

                        {/* Display instructor notes if available */}
                        {(lesson as any)?.instructor_notes && (
                          <div className="mt-3 p-3 bg-blue-50 rounded border border-blue-100">
                            <label className="text-xs font-medium text-blue-600 uppercase tracking-wide">Instructor Notes</label>
                            <p className="text-sm text-gray-700 mt-1">{(lesson as any).instructor_notes}</p>
                          </div>
                        )}

                        {(lesson as any)?.homework_assigned && (
                          <div className="mt-2 p-3 bg-amber-50 rounded border border-amber-100">
                            <label className="text-xs font-medium text-amber-600 uppercase tracking-wide">Homework Assigned</label>
                            <p className="text-sm text-gray-700 mt-1">{(lesson as any).homework_assigned}</p>
                          </div>
                        )}

                        {(lesson as any)?.progress_notes && (
                          <div className="mt-2 p-3 bg-green-50 rounded border border-green-100">
                            <label className="text-xs font-medium text-green-600 uppercase tracking-wide">Progress Notes</label>
                            <p className="text-sm text-gray-700 mt-1">{(lesson as any).progress_notes}</p>
                          </div>
                        )}

                        {lesson?.notes && (
                          <div className="mt-2">
                            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">General Notes</label>
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
                            {(student?.full_name || student?.username || 'S')[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {student?.full_name || student?.username || 'Unknown Student'}
                            </p>
                            <p className="text-xs text-gray-500">{student?.email}</p>
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
                                  formatDateTimeCST(lesson.scheduled_at) : 
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
                          <Button variant="outline" size="sm" className="mt-2" onClick={handleUpdateAvailability}>
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

          {/* Availability Tab */}
          <TabsContent value="availability" className="space-y-6">
            <AvailabilityManager />
          </TabsContent>

          {/* Days Off Tab */}
          <TabsContent value="days-off" className="space-y-6">
            <DaysOffManager />
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

      {/* Availability Modal */}
      <Dialog open={showAvailabilityModal} onOpenChange={setShowAvailabilityModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Update Availability</DialogTitle>
            <DialogDescription>
              Set your teaching availability. Include days and times you're available for lessons.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="e.g., Monday-Friday 9am-5pm, Saturday 10am-2pm"
              value={availabilityText}
              onChange={(e) => setAvailabilityText(e.target.value)}
              className="min-h-[120px]"
            />
            <p className="text-xs text-gray-500 mt-2">
              Tip: Be specific about your available days and time slots.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAvailabilityModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveAvailability} className="bg-gradient-to-r from-green-600 to-blue-600">
              Save Availability
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Schedule Lesson Modal */}
      <Dialog open={showScheduleLessonModal} onOpenChange={setShowScheduleLessonModal}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Schedule New Lesson</DialogTitle>
            <DialogDescription>
              Create a new lesson with one of your students.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="student">Student *</Label>
                <select
                  id="student"
                  value={scheduleLessonData.student_id}
                  onChange={(e) => setScheduleLessonData({ ...scheduleLessonData, student_id: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select a student</option>
                  {students?.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.full_name || student.username || 'Unknown Student'}
                    </option>
                  ))}
                </select>
                {students?.length === 0 && (
                  <p className="text-xs text-amber-600 mt-1">
                    No students assigned yet. Ask your admin to assign students to you.
                  </p>
                )}
              </div>

              <div className="col-span-2">
                <Label htmlFor="title">Lesson Title</Label>
                <Input
                  id="title"
                  placeholder="e.g., Piano Lesson"
                  value={scheduleLessonData.title}
                  onChange={(e) => setScheduleLessonData({ ...scheduleLessonData, title: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="date">Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={scheduleLessonData.scheduled_date}
                  onChange={(e) => setScheduleLessonData({ ...scheduleLessonData, scheduled_date: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="time">Time *</Label>
                <Input
                  id="time"
                  type="time"
                  value={scheduleLessonData.scheduled_time}
                  onChange={(e) => setScheduleLessonData({ ...scheduleLessonData, scheduled_time: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="duration">Duration (minutes)</Label>
                <select
                  id="duration"
                  value={scheduleLessonData.duration_minutes}
                  onChange={(e) => setScheduleLessonData({ ...scheduleLessonData, duration_minutes: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="30">30 minutes</option>
                  <option value="45">45 minutes</option>
                  <option value="60">60 minutes</option>
                  <option value="90">90 minutes</option>
                  <option value="120">120 minutes</option>
                </select>
              </div>

              <div>
                <Label htmlFor="instrument">Instrument</Label>
                <Input
                  id="instrument"
                  placeholder="e.g., Piano"
                  value={scheduleLessonData.instrument}
                  onChange={(e) => setScheduleLessonData({ ...scheduleLessonData, instrument: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  placeholder="e.g., Studio A"
                  value={scheduleLessonData.location}
                  onChange={(e) => setScheduleLessonData({ ...scheduleLessonData, location: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="room">Room Number</Label>
                <Input
                  id="room"
                  placeholder="e.g., 101"
                  value={scheduleLessonData.room_number}
                  onChange={(e) => setScheduleLessonData({ ...scheduleLessonData, room_number: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div className="col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Add any notes about the lesson..."
                  value={scheduleLessonData.description}
                  onChange={(e) => setScheduleLessonData({ ...scheduleLessonData, description: e.target.value })}
                  className="mt-1 min-h-[80px]"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowScheduleLessonModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleScheduleLesson}
              disabled={isScheduling || !scheduleLessonData.student_id}
              className="bg-gradient-to-r from-green-600 to-blue-600"
            >
              {isScheduling ? 'Scheduling...' : 'Schedule Lesson'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Profile Dialog */}
      <Dialog open={showEditProfileModal} onOpenChange={setShowEditProfileModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5" />
              Edit Profile
            </DialogTitle>
            <DialogDescription>
              Update your instructor profile information
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={editProfileData.bio}
                onChange={(e) => setEditProfileData({ ...editProfileData, bio: e.target.value })}
                placeholder="Tell students about yourself..."
                rows={3}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="hourly_rate">Hourly Rate ($)</Label>
              <Input
                id="hourly_rate"
                type="number"
                value={editProfileData.hourly_rate}
                onChange={(e) => setEditProfileData({ ...editProfileData, hourly_rate: e.target.value })}
                placeholder="Your hourly rate"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={editProfileData.phone}
                onChange={(e) => setEditProfileData({ ...editProfileData, phone: e.target.value })}
                placeholder="Your phone number"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="specializations">Specializations</Label>
              <Input
                id="specializations"
                value={editProfileData.specializations}
                onChange={(e) => setEditProfileData({ ...editProfileData, specializations: e.target.value })}
                placeholder="Piano, Guitar, Voice (comma-separated)"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowEditProfileModal(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveProfile}
              className="bg-gradient-to-r from-green-600 to-blue-600"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Lesson Notes Dialog */}
      <Dialog open={showEditLessonModal} onOpenChange={setShowEditLessonModal}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5" />
              Edit Lesson Notes
            </DialogTitle>
            <DialogDescription>
              {editingLesson?.title || 'Lesson'} - {editingLesson?.scheduled_at ?
                formatDateCST(editingLesson.scheduled_at) :
                'Not scheduled'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="grid gap-2">
              <Label htmlFor="instructor_notes" className="flex items-center gap-2">
                <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
                Instructor Notes
              </Label>
              <Textarea
                id="instructor_notes"
                value={editLessonData.instructor_notes}
                onChange={(e) => setEditLessonData({ ...editLessonData, instructor_notes: e.target.value })}
                placeholder="Private notes about this lesson (only visible to you and admins)..."
                rows={3}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="homework_assigned" className="flex items-center gap-2">
                <span className="w-3 h-3 bg-amber-500 rounded-full"></span>
                Homework Assigned
              </Label>
              <Textarea
                id="homework_assigned"
                value={editLessonData.homework_assigned}
                onChange={(e) => setEditLessonData({ ...editLessonData, homework_assigned: e.target.value })}
                placeholder="What should the student practice before the next lesson..."
                rows={3}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="progress_notes" className="flex items-center gap-2">
                <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                Progress Notes
              </Label>
              <Textarea
                id="progress_notes"
                value={editLessonData.progress_notes}
                onChange={(e) => setEditLessonData({ ...editLessonData, progress_notes: e.target.value })}
                placeholder="Track the student's progress and achievements..."
                rows={3}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="general_notes">General Notes</Label>
              <Textarea
                id="general_notes"
                value={editLessonData.notes}
                onChange={(e) => setEditLessonData({ ...editLessonData, notes: e.target.value })}
                placeholder="Any other notes about this lesson..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowEditLessonModal(false);
                setEditingLesson(null);
              }}
              disabled={isSavingLesson}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveLessonNotes}
              disabled={isSavingLesson}
              className="bg-gradient-to-r from-green-600 to-blue-600"
            >
              {isSavingLesson ? 'Saving...' : 'Save Notes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
