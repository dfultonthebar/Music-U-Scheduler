
'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { apiService } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';
import { 
  Calendar, 
  Clock, 
  BookOpen, 
  Music, 
  User, 
  Star, 
  TrendingUp, 
  CheckCircle, 
  AlertCircle,
  PlayCircle,
  LogOut,
  Award,
  Target,
  Bell,
  FileText
} from 'lucide-react';
import { Lesson } from '@/lib/types';
import { toast } from 'sonner';

export default function StudentDashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Mock student data (replace with actual API calls)
  const studentStats = {
    total_lessons: 24,
    completed_lessons: 20,
    upcoming_lessons: 4,
    practice_hours: 45.5,
    skill_level: "Intermediate",
    current_song: "Canon in D Major",
    next_lesson: "2024-08-16T14:00:00Z",
    instructor_name: "Sarah Wilson",
    progress_this_month: 85
  };

  useEffect(() => {
    loadStudentData();
  }, []);

  const loadStudentData = async () => {
    try {
      setLoading(true);
      // Mock data - replace with actual API calls
      const mockLessons: Lesson[] = [
        {
          id: '1',
          title: 'Piano Basics - Scales',
          description: 'Practice major and minor scales',
          instructor_id: 'inst-1',
          student_id: user?.id || '',
          scheduled_at: '2024-08-16T14:00:00Z',
          duration_minutes: 60,
          status: 'scheduled',
          notes: 'Focus on finger positioning',
          created_at: '2024-08-01T00:00:00Z',
          updated_at: '2024-08-01T00:00:00Z',
        },
        {
          id: '2',
          title: 'Music Theory - Chords',
          description: 'Major and minor chord progressions',
          instructor_id: 'inst-1',
          student_id: user?.id || '',
          scheduled_at: '2024-08-14T14:00:00Z',
          duration_minutes: 45,
          status: 'completed',
          notes: 'Great progress on chord transitions!',
          created_at: '2024-08-01T00:00:00Z',
          updated_at: '2024-08-14T15:00:00Z',
        }
      ];
      setLessons(mockLessons);
    } catch (error) {
      toast.error('Failed to load student data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'rescheduled': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const StatCard = ({ title, value, icon: Icon, description, color = "blue" }: any) => (
    <Card className="relative overflow-hidden hover:shadow-md transition-shadow duration-200">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
        <Icon className={`h-5 w-5 text-${color}-500`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-gray-900 mb-1">{value}</div>
        {description && (
          <p className="text-xs text-gray-500">{description}</p>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back, {user?.first_name}! 🎵
        </h1>
        <p className="text-gray-600">
          Track your progress, view upcoming lessons, and continue your musical journey.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-white/80 backdrop-blur-sm">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="lessons" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            My Lessons
          </TabsTrigger>
          <TabsTrigger value="progress" className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            Progress
          </TabsTrigger>
          <TabsTrigger value="practice" className="flex items-center gap-2">
            <PlayCircle className="w-4 h-4" />
            Practice
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Total Lessons"
              value={studentStats.total_lessons}
              icon={BookOpen}
              description="All time"
              color="blue"
            />
            <StatCard
              title="Completed"
              value={studentStats.completed_lessons}
              icon={CheckCircle}
              description="Lessons finished"
              color="green"
            />
            <StatCard
              title="Upcoming"
              value={studentStats.upcoming_lessons}
              icon={Clock}
              description="Scheduled lessons"
              color="yellow"
            />
            <StatCard
              title="Practice Hours"
              value={`${studentStats.practice_hours}h`}
              icon={PlayCircle}
              description="This month"
              color="purple"
            />
          </div>

          {/* Quick Info Cards */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-500" />
                  Current Instructor
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{studentStats.instructor_name}</p>
                    <p className="text-sm text-gray-600">Piano & Music Theory</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Music className="w-5 h-5 text-purple-500" />
                  Current Skill Level
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-900">{studentStats.skill_level}</span>
                    <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                      Level 3
                    </Badge>
                  </div>
                  <Progress value={65} className="h-2" />
                  <p className="text-sm text-gray-600">Progress to Advanced level</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Next Lesson Card */}
          <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Next Lesson
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-blue-100">Date & Time</p>
                  <p className="text-xl font-semibold">
                    August 16, 2024 at 2:00 PM
                  </p>
                </div>
                <div>
                  <p className="text-blue-100">Currently Working On</p>
                  <p className="text-xl font-semibold">{studentStats.current_song}</p>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <Button variant="secondary" size="sm">
                  Join Lesson
                </Button>
                <Button variant="outline" size="sm" className="border-white text-white hover:bg-white hover:text-blue-600">
                  Reschedule
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Lessons Tab */}
        <TabsContent value="lessons" className="space-y-6">
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-500" />
                My Lesson History
              </CardTitle>
              <CardDescription>
                View all your scheduled, completed, and upcoming lessons
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {lessons.map((lesson) => (
                  <div key={lesson.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <Music className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{lesson.title}</h4>
                        <p className="text-sm text-gray-600">{lesson.description}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(lesson.scheduled_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={getStatusColor(lesson.status)}>
                        {lesson.status}
                      </Badge>
                      <Badge variant="outline">
                        {lesson.duration_minutes}min
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Progress Tab */}
        <TabsContent value="progress" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                  Monthly Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Overall Progress</span>
                    <span className="text-2xl font-bold text-green-600">{studentStats.progress_this_month}%</span>
                  </div>
                  <Progress value={studentStats.progress_this_month} className="h-3" />
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Lessons Attended</p>
                      <p className="font-semibold">8 / 8</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Practice Hours</p>
                      <p className="font-semibold">{studentStats.practice_hours}h</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-yellow-500" />
                  Achievements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                      <Star className="w-4 h-4 text-yellow-600" />
                    </div>
                    <div>
                      <p className="font-medium">First Song Mastered</p>
                      <p className="text-sm text-gray-600">Completed "Twinkle Twinkle"</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium">Practice Streak</p>
                      <p className="text-sm text-gray-600">7 days in a row!</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <BookOpen className="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium">Theory Expert</p>
                      <p className="text-sm text-gray-600">Mastered basic chords</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Practice Tab */}
        <TabsContent value="practice" className="space-y-6">
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PlayCircle className="w-5 h-5 text-purple-500" />
                Practice Log
              </CardTitle>
              <CardDescription>
                Track your daily practice sessions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <PlayCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Practice Tracking Coming Soon</h3>
                <p className="text-gray-600 mb-4">
                  Start logging your practice sessions and track your daily progress.
                </p>
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                  <PlayCircle className="w-4 h-4 mr-2" />
                  Start Practice Session
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
