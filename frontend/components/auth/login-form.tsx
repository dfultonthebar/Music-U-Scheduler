
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/auth-context';
import { Eye, EyeOff, Music, User, Lock, Loader2, AlertCircle, CheckCircle, Home } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function LoginForm() {
  const [credentials, setCredentials] = useState({
    username: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState<{username?: string, password?: string}>({});
  
  const { login } = useAuth();
  const router = useRouter();

  const validateForm = () => {
    const errors: {username?: string, password?: string} = {};
    
    if (!credentials.username.trim()) {
      errors.username = 'Username is required';
    }
    
    if (!credentials.password) {
      errors.password = 'Password is required';
    } else if (credentials.password.length < 3) {
      errors.password = 'Password must be at least 3 characters';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      const success = await login(credentials);
      if (!success) {
        setError('Invalid username or password. Please try again.');
      }
    } catch (err) {
      setError('Login failed. Please check your credentials and try again.');
    }
    
    setIsLoading(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials({
      ...credentials,
      [name]: value,
    });
    
    // Clear validation error when user starts typing
    if (validationErrors[name as keyof typeof validationErrors]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
    
    // Clear general error
    if (error) {
      setError('');
    }
  };

  const handleDemoLogin = () => {
    setCredentials({
      username: 'admin',
      password: 'MusicU2025'
    });
    setError('');
    setValidationErrors({});
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back to Home Button */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.push('/')}
            className="text-gray-600 hover:text-gray-900 p-2"
          >
            <Home className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </div>

        <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm animate-in slide-in-from-bottom-4 duration-500">
          <CardHeader className="text-center pb-6">
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mb-4 animate-in zoom-in duration-300">
              <Music className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Music-U-Scheduler
            </CardTitle>
            <CardDescription className="text-gray-600 mt-2">
              Welcome back! Please sign in to your account.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* General Error Alert */}
              {error && (
                <Alert variant="destructive" className="animate-in slide-in-from-top-2 duration-300">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Demo Login Helper */}
              <Alert className="bg-blue-50 border-blue-200 text-blue-800 animate-in slide-in-from-top-2 duration-300">
                <CheckCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="flex items-center justify-between">
                  <span>Try the demo:</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleDemoLogin}
                    className="text-blue-600 hover:text-blue-800 hover:bg-blue-100 ml-2 px-2 py-1 h-auto"
                  >
                    Use Demo Account
                  </Button>
                </AlertDescription>
              </Alert>

              {/* Username Field */}
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium text-gray-700">
                  Username
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="username"
                    name="username"
                    type="text"
                    value={credentials.username}
                    onChange={handleChange}
                    className={`pl-10 transition-all duration-200 ${
                      validationErrors.username 
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
                        : 'focus:border-blue-500 focus:ring-blue-200'
                    }`}
                    placeholder="Enter your username"
                    disabled={isLoading}
                    autoComplete="username"
                  />
                </div>
                {validationErrors.username && (
                  <p className="text-sm text-red-600 animate-in slide-in-from-top-1 duration-200">
                    {validationErrors.username}
                  </p>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={credentials.password}
                    onChange={handleChange}
                    className={`pl-10 pr-10 transition-all duration-200 ${
                      validationErrors.password 
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
                        : 'focus:border-blue-500 focus:ring-blue-200'
                    }`}
                    placeholder="Enter your password"
                    disabled={isLoading}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 h-4 w-4 text-gray-400 hover:text-gray-600 transition-colors"
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {validationErrors.password && (
                  <p className="text-sm text-red-600 animate-in slide-in-from-top-1 duration-200">
                    {validationErrors.password}
                  </p>
                )}
              </div>

              {/* Login Button */}
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-2.5 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing In...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="text-center pt-6 border-t border-gray-100">
            <div className="w-full">
              <p className="text-sm text-gray-600 mb-2">
                Demo Credentials:
              </p>
              <div className="text-xs text-gray-500 bg-gray-50 rounded-lg p-3">
                <div className="font-mono">
                  <div><strong>Admin:</strong> admin / MusicU2025</div>
                  <div className="mt-1"><strong>Instructor:</strong> instructor1 / password123</div>
                  <div className="mt-1"><strong>Student:</strong> student1 / password123</div>
                </div>
              </div>
            </div>
          </CardFooter>
        </Card>

        {/* Additional Info */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Need help? Contact{' '}
            <a href="mailto:support@musicu.local" className="text-blue-600 hover:text-blue-800 transition-colors">
              support@musicu.local
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
