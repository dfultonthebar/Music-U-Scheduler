
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Music, 
  Calendar, 
  Users, 
  Star, 
  Clock, 
  BookOpen, 
  ArrowRight,
  Play,
  CheckCircle,
  Loader2
} from 'lucide-react';

export default function HomePage() {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [showWelcome, setShowWelcome] = useState(true);

  useEffect(() => {
    if (!loading) {
      if (isAuthenticated && user) {
        // Show welcome message for a moment before redirecting
        setTimeout(() => {
          if (user.role === 'admin') {
            router.push('/admin');
          } else if (user.role === 'instructor') {
            router.push('/instructor');
          } else {
            router.push('/dashboard');
          }
        }, 2000);
      } else {
        setShowWelcome(true);
      }
    }
  }, [user, loading, isAuthenticated, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Music className="w-8 h-8 text-white animate-pulse" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Music-U-Scheduler</h1>
          <div className="flex items-center justify-center gap-2 text-gray-600">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Loading your dashboard...</span>
          </div>
        </div>
      </div>
    );
  }

  if (isAuthenticated && user && showWelcome) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center animate-in fade-in duration-1000">
          <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
            <Music className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Welcome back, {user.first_name}! 🎵
          </h1>
          <div className="flex items-center justify-center gap-2 text-gray-600 mb-4">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span>Redirecting to your {user.role} dashboard...</span>
          </div>
          <div className="w-64 bg-gray-200 rounded-full h-2 mx-auto">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full animate-pulse" style={{width: '100%'}}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-16">
          <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-8">
            <Music className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Music-U-Scheduler
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            The professional way to manage music lessons, schedule sessions, and track student progress. 
            Built for music schools, private instructors, and students.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3"
              onClick={() => router.push('/login')}
            >
              Get Started <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-2 border-blue-600 text-blue-600 hover:bg-blue-50 px-8 py-3"
            >
              <Play className="mr-2 w-5 h-5" />
              Watch Demo
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card className="text-center p-6 shadow-lg hover:shadow-xl transition-shadow duration-300 bg-white/80 backdrop-blur-sm border-0">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-blue-600" />
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="text-xl text-gray-900">Smart Scheduling</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-gray-600">
                Intelligent lesson scheduling with automatic conflict detection and optimal time slot suggestions.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center p-6 shadow-lg hover:shadow-xl transition-shadow duration-300 bg-white/80 backdrop-blur-sm border-0">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-purple-600" />
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="text-xl text-gray-900">Multi-Role Support</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-gray-600">
                Separate dashboards for administrators, instructors, and students with role-specific features.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center p-6 shadow-lg hover:shadow-xl transition-shadow duration-300 bg-white/80 backdrop-blur-sm border-0">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-green-600" />
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="text-xl text-gray-900">Progress Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-gray-600">
                Comprehensive progress tracking with lesson notes, practice logs, and performance analytics.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* Stats Section */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Trusted by Music Educators</h2>
            <p className="text-gray-600">Join thousands of music professionals using Music-U-Scheduler</p>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">1,200+</div>
              <div className="text-gray-600">Active Users</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">15,000+</div>
              <div className="text-gray-600">Lessons Scheduled</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">98%</div>
              <div className="text-gray-600">Satisfaction Rate</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600 mb-2">24/7</div>
              <div className="text-gray-600">Support Available</div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Ready to Get Started?</h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Transform your music teaching experience with professional scheduling tools.
          </p>
          <Button 
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-12 py-4 text-lg"
            onClick={() => router.push('/login')}
          >
            Start Your Journey <Star className="ml-2 w-6 h-6" />
          </Button>
        </div>
      </div>
    </div>
  );
}
