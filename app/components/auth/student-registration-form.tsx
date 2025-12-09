'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Music, Mail, User as UserIcon, Phone, Instrument, GraduationCap, FileText, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { apiService } from '@/lib/api';

const INSTRUMENTS = [
  'Piano',
  'Guitar',
  'Violin',
  'Cello',
  'Viola',
  'Double Bass',
  'Flute',
  'Clarinet',
  'Oboe',
  'Bassoon',
  'Saxophone',
  'Trumpet',
  'Trombone',
  'French Horn',
  'Tuba',
  'Drums',
  'Percussion',
  'Voice',
  'Ukulele',
  'Bass Guitar',
  'Banjo',
  'Mandolin',
  'Accordion',
  'Harmonica',
  'Harp',
  'Other'
];

const EXPERIENCE_LEVELS = [
  { value: 'beginner', label: 'Beginner - New to this instrument' },
  { value: 'intermediate', label: 'Intermediate - Some experience' },
  { value: 'advanced', label: 'Advanced - Significant experience' }
];

export default function StudentRegistrationForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    phone: '',
    instrument: '',
    experience_level: '',
    notes: ''
  });

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validate required fields
      if (!formData.email || !formData.full_name || !formData.instrument || !formData.experience_level) {
        toast.error('Please fill in all required fields');
        setIsLoading(false);
        return;
      }

      // Submit registration
      const response = await apiService.registerStudent({
        email: formData.email,
        full_name: formData.full_name,
        phone: formData.phone || undefined,
        instrument: formData.instrument,
        experience_level: formData.experience_level,
        notes: formData.notes || undefined
      });

      setIsSuccess(true);
      toast.success('Registration submitted successfully!');

      // Reset form
      setFormData({
        email: '',
        full_name: '',
        phone: '',
        instrument: '',
        experience_level: '',
        notes: ''
      });

    } catch (error: any) {
      console.error('Registration error:', error);
      const errorMessage = error.message || 'Registration failed. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
          <CardContent className="pt-12 pb-8 text-center">
            <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Registration Submitted!
            </h2>
            <p className="text-gray-600 mb-8">
              Thank you for registering with Music U Scheduler. Your application has been received and is pending approval.
              You will be notified via email once your account is approved.
            </p>
            <div className="space-y-3">
              <Button
                onClick={() => setIsSuccess(false)}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                Submit Another Registration
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push('/login')}
                className="w-full"
              >
                Go to Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-6">
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mb-4">
              <Music className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Student Registration
            </CardTitle>
            <CardDescription className="text-gray-600 mt-2">
              Register for music lessons at Music U Scheduler
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="full_name" className="text-sm font-medium text-gray-700">
                  Full Name <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="full_name"
                    name="full_name"
                    type="text"
                    required
                    value={formData.full_name}
                    onChange={(e) => handleChange('full_name', e.target.value)}
                    className="pl-10 h-11 border-gray-200"
                    placeholder="Enter your full name"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email Address <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    className="pl-10 h-11 border-gray-200"
                    placeholder="your.email@example.com"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                  Phone Number
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    className="pl-10 h-11 border-gray-200"
                    placeholder="(555) 123-4567"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Instrument */}
              <div className="space-y-2">
                <Label htmlFor="instrument" className="text-sm font-medium text-gray-700">
                  Instrument <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.instrument}
                  onValueChange={(value) => handleChange('instrument', value)}
                  disabled={isLoading}
                  required
                >
                  <SelectTrigger className="h-11 border-gray-200">
                    <SelectValue placeholder="Select an instrument" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {INSTRUMENTS.map((instrument) => (
                      <SelectItem key={instrument} value={instrument}>
                        {instrument}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Experience Level */}
              <div className="space-y-2">
                <Label htmlFor="experience_level" className="text-sm font-medium text-gray-700">
                  Experience Level <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.experience_level}
                  onValueChange={(value) => handleChange('experience_level', value)}
                  disabled={isLoading}
                  required
                >
                  <SelectTrigger className="h-11 border-gray-200">
                    <SelectValue placeholder="Select your experience level" />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPERIENCE_LEVELS.map((level) => (
                      <SelectItem key={level.value} value={level.value}>
                        {level.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes" className="text-sm font-medium text-gray-700">
                  Additional Information
                </Label>
                <Textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={(e) => handleChange('notes', e.target.value)}
                  className="min-h-24 border-gray-200 resize-none"
                  placeholder="Tell us about your musical goals, previous experience, or any questions you have..."
                  disabled={isLoading}
                />
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Submitting...
                  </div>
                ) : (
                  'Submit Registration'
                )}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex flex-col gap-4 text-center border-t pt-6">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <a href="/login" className="text-blue-600 hover:text-blue-800 hover:underline font-medium">
                Sign In
              </a>
            </p>
            <p className="text-xs text-gray-500">
              Your registration will be reviewed by an administrator. You will receive an email when your account is approved.
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
