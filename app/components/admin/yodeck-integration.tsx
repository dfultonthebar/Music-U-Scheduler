'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Monitor,
  RefreshCw,
  Check,
  X,
  AlertCircle,
  Users,
  Eye,
  Clock,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { apiService } from '@/lib/api';

interface YodeckStatus {
  api_token: string;
  is_configured: boolean;
  last_sync: string | null;
  instructor_count: number;
  playlist_id: string | null;
}

interface InstructorSlide {
  instructor_id: number;
  instructor_name: string;
  instruments: string[];
  bio: string | null;
  photo_url: string | null;
  sync_status: string;
}

export default function YodeckIntegration() {
  const [status, setStatus] = useState<YodeckStatus | null>(null);
  const [instructorSlides, setInstructorSlides] = useState<InstructorSlide[]>([]);
  const [apiToken, setApiToken] = useState('');
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<{
    success: boolean;
    message: string;
    status: string;
  } | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    loadYodeckStatus();
    loadInstructorSlides();
  }, []);

  const loadYodeckStatus = async () => {
    try {
      setLoading(true);
      const data = await apiService.getYodeckStatus();
      setStatus(data);
    } catch (error: any) {
      toast.error('Failed to load Yodeck status');
      console.error('Error loading Yodeck status:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadInstructorSlides = async () => {
    try {
      const data = await apiService.getYodeckInstructorSlides();
      setInstructorSlides(data);
    } catch (error: any) {
      console.error('Error loading instructor slides:', error);
    }
  };

  const handleSaveApiToken = async () => {
    if (!apiToken.trim()) {
      toast.error('Please enter an API token');
      return;
    }

    try {
      setLoading(true);
      const data = await apiService.saveYodeckSettings(apiToken);
      setStatus(data);
      setApiToken('');
      toast.success('API token saved successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to save API token');
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    if (!status?.is_configured) {
      toast.error('Please configure API token first');
      return;
    }

    try {
      setTesting(true);
      const result = await apiService.testYodeckConnection();
      setConnectionStatus(result);

      if (result.success) {
        toast.success('Connection successful!');
      } else {
        toast.error(result.message);
      }
    } catch (error: any) {
      toast.error('Connection test failed');
      setConnectionStatus({
        success: false,
        message: error.message || 'Connection test failed',
        status: 'error'
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSyncInstructors = async () => {
    if (!status?.is_configured) {
      toast.error('Please configure API token first');
      return;
    }

    try {
      setSyncing(true);
      const result = await apiService.syncInstructorsToYodeck();

      if (result.success) {
        toast.success(result.message);
        await loadYodeckStatus();
        await loadInstructorSlides();
      } else {
        toast.error(result.message);
      }
    } catch (error: any) {
      toast.error('Sync failed: ' + (error.message || 'Unknown error'));
    } finally {
      setSyncing(false);
    }
  };

  const formatLastSync = (lastSync: string | null) => {
    if (!lastSync) return 'Never';
    try {
      const date = new Date(lastSync);
      return date.toLocaleString();
    } catch {
      return 'Invalid date';
    }
  };

  if (loading && !status) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Monitor className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <CardTitle>Yodeck Digital Signage</CardTitle>
                <CardDescription>
                  Display instructor slideshow cards on digital signage screens
                </CardDescription>
              </div>
            </div>
            <Badge
              variant={status?.is_configured ? 'default' : 'outline'}
              className={status?.is_configured ? 'bg-green-100 text-green-800' : ''}
            >
              {status?.is_configured ? 'Configured' : 'Not Configured'}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Connection Status */}
      {connectionStatus && (
        <Alert variant={connectionStatus.success ? 'default' : 'destructive'}>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {connectionStatus.message}
          </AlertDescription>
        </Alert>
      )}

      {/* Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Configuration</CardTitle>
          <CardDescription>
            Configure Yodeck API token to enable digital signage integration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="api-token">API Token</Label>
            <div className="flex gap-2">
              <Input
                id="api-token"
                type="password"
                placeholder="Enter your Yodeck API token"
                value={apiToken}
                onChange={(e) => setApiToken(e.target.value)}
                disabled={loading}
              />
              <Button
                onClick={handleSaveApiToken}
                disabled={loading || !apiToken.trim()}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              Get your API token from Yodeck: Account Settings → Advanced Settings → API Tokens
            </p>
          </div>

          {status?.is_configured && (
            <div className="pt-4 border-t">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Check className="w-4 h-4 text-green-600" />
                  <span>Current Token: {status.api_token}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleTestConnection}
                  disabled={testing}
                >
                  {testing ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <RefreshCw className="w-4 h-4 mr-2" />
                  )}
                  Test Connection
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sync Status */}
      {status?.is_configured && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Sync Status</CardTitle>
                <CardDescription>
                  Instructor slideshow synchronization status
                </CardDescription>
              </div>
              <Button
                onClick={handleSyncInstructors}
                disabled={syncing}
              >
                {syncing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Sync Instructors
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                  <Users className="w-4 h-4" />
                  <span>Total Instructors</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{status.instructor_count}</p>
              </div>

              <div className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                  <Clock className="w-4 h-4" />
                  <span>Last Sync</span>
                </div>
                <p className="text-sm font-medium text-gray-900">
                  {formatLastSync(status.last_sync)}
                </p>
              </div>

              <div className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                  <Monitor className="w-4 h-4" />
                  <span>Playlist ID</span>
                </div>
                <p className="text-sm font-medium text-gray-900">
                  {status.playlist_id || 'Not created'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructor Slides Preview */}
      {status?.is_configured && instructorSlides.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Instructor Slides</CardTitle>
                <CardDescription>
                  Preview of instructor slideshow cards
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
              >
                <Eye className="w-4 h-4 mr-2" />
                {showPreview ? 'Hide Preview' : 'Show Preview'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {instructorSlides.map((slide) => (
                <div
                  key={slide.instructor_id}
                  className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{slide.instructor_name}</h3>
                      <p className="text-sm text-gray-600">
                        {slide.instruments.length > 0
                          ? slide.instruments.join(', ')
                          : 'No instruments specified'}
                      </p>
                      {slide.bio && showPreview && (
                        <p className="text-sm text-gray-500 mt-2">{slide.bio}</p>
                      )}
                    </div>
                    <Badge
                      variant={
                        slide.sync_status === 'synced' ? 'default' :
                        slide.sync_status === 'failed' ? 'destructive' :
                        'outline'
                      }
                      className={slide.sync_status === 'synced' ? 'bg-green-100 text-green-800' : ''}
                    >
                      {slide.sync_status}
                    </Badge>
                  </div>

                  {/* Slide Preview */}
                  {showPreview && (
                    <div className="mt-4 p-6 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg text-white">
                      <div className="text-center">
                        <h2 className="text-3xl font-bold mb-2">{slide.instructor_name}</h2>
                        <p className="text-xl mb-3 opacity-90">
                          {slide.instruments.join(', ')}
                        </p>
                        <p className="text-sm opacity-80">
                          {slide.bio || 'Professional music instructor'}
                        </p>
                      </div>
                      <div className="text-right mt-4 text-sm opacity-70">
                        Music U
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Setup Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium text-gray-900">1. Get Your API Token</h4>
            <p className="text-sm text-gray-600">
              Log in to your Yodeck account, go to Account Settings → Advanced Settings → API Tokens,
              and create a new token.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium text-gray-900">2. Configure Integration</h4>
            <p className="text-sm text-gray-600">
              Enter your API token above and click "Save". Then test the connection to ensure it's working.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium text-gray-900">3. Sync Instructors</h4>
            <p className="text-sm text-gray-600">
              Click "Sync Instructors" to create slideshow cards for all active instructors.
              This will create a playlist in your Yodeck account.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium text-gray-900">4. Assign to Displays</h4>
            <p className="text-sm text-gray-600">
              In your Yodeck dashboard, assign the "Instructor Slideshow" playlist to your digital signage screens.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
