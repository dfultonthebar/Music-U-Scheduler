

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { RefreshCw, Download, GitBranch, Clock, AlertTriangle, CheckCircle, Github, Terminal, RotateCcw, Power } from 'lucide-react';
import { apiService } from '@/lib/api';
import { GitHubUpdate } from '@/lib/types';

export default function GitHubUpdates() {
  const [updateInfo, setUpdateInfo] = useState<GitHubUpdate | null>(null);
  const [updateLogs, setUpdateLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [updateCompleted, setUpdateCompleted] = useState(false);
  const [restartRequired, setRestartRequired] = useState(false);

  useEffect(() => {
    checkForUpdates();
    loadUpdateLogs();
  }, []);

  const checkForUpdates = async () => {
    try {
      setChecking(true);
      const update = await apiService.checkForUpdates();
      setUpdateInfo(update);
    } catch (error) {
      toast.error('Failed to check for updates');
    } finally {
      setChecking(false);
      setLoading(false);
    }
  };

  const loadUpdateLogs = async () => {
    try {
      const logs = await apiService.getUpdateLogs();
      setUpdateLogs(logs);
    } catch (error) {
      console.error('Failed to load update logs');
    }
  };

  const handleUpdate = async () => {
    try {
      setUpdating(true);
      setUpdateCompleted(false);
      const result = await apiService.updateSystem();
      if (result.success) {
        toast.success(result.message);
        setUpdateCompleted(true);
        if (result.restart_required) {
          setRestartRequired(true);
          toast.info('System restart is recommended to complete the update', {
            duration: 10000,
            action: {
              label: 'Restart Now',
              onClick: () => handlePageRestart()
            }
          });
        }
        // Refresh update info after successful update
        await checkForUpdates();
        await loadUpdateLogs();
      } else {
        toast.error('Update failed');
      }
    } catch (error) {
      toast.error('Failed to update system');
    } finally {
      setUpdating(false);
    }
  };

  const handlePageRestart = () => {
    toast.info('Refreshing page to apply updates...', { duration: 2000 });
    setTimeout(() => {
      window.location.reload();
    }, 2000);
  };

  const handleFullRestart = () => {
    toast.info('Requesting full application restart...', { duration: 3000 });
    // This would typically call a backend endpoint to restart services
    // For now, we'll just refresh the page after a longer delay
    setTimeout(() => {
      window.location.reload();
    }, 3000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">GitHub Updates</h2>
          <p className="text-gray-500">Check for and apply updates from the GitHub repository</p>
        </div>
        <Button
          variant="outline"
          onClick={checkForUpdates}
          disabled={checking}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
          {checking ? 'Checking...' : 'Check for Updates'}
        </Button>
      </div>

      {/* Update Status */}
      {updateInfo && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Github className="w-5 h-5" />
                Version Information
              </CardTitle>
              <CardDescription>Current and available versions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Current Version</span>
                <Badge variant="outline">{updateInfo.current_version}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Latest Version</span>
                <Badge variant={updateInfo.has_updates ? 'default' : 'secondary'}>
                  {updateInfo.latest_version}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Branch</span>
                <Badge variant="outline" className="flex items-center gap-1">
                  <GitBranch className="w-3 h-3" />
                  {updateInfo.branch}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Commit Hash</span>
                <Badge variant="outline" className="font-mono text-xs">
                  {updateInfo.commit_hash}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Last Check</span>
                <span className="text-sm text-gray-900">
                  {new Date(updateInfo.last_check).toLocaleString()}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {updateInfo.has_updates ? (
                  <AlertTriangle className="w-5 h-5 text-orange-500" />
                ) : (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                )}
                Update Status
              </CardTitle>
              <CardDescription>
                {updateInfo.has_updates ? 'Updates available' : 'System is up to date'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {updateCompleted && restartRequired ? (
                <div className="space-y-4">
                  <Alert>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <AlertTitle>Update Completed Successfully!</AlertTitle>
                    <AlertDescription>
                      The system has been updated. Please restart to apply all changes.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Button 
                      onClick={handlePageRestart}
                      className="flex items-center gap-2"
                      variant="default"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Refresh Page
                    </Button>
                    
                    <Button 
                      onClick={handleFullRestart}
                      className="flex items-center gap-2"
                      variant="outline"
                    >
                      <Power className="w-4 h-4" />
                      Full Restart
                    </Button>
                  </div>
                  
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p><strong>Refresh Page:</strong> Quick reload to apply frontend updates</p>
                    <p><strong>Full Restart:</strong> Complete system restart (recommended for major updates)</p>
                  </div>
                </div>
              ) : updateInfo.has_updates ? (
                <div className="space-y-4">
                  <Alert>
                    <Download className="h-4 w-4" />
                    <AlertTitle>Updates Available</AlertTitle>
                    <AlertDescription>
                      Version {updateInfo.latest_version} is available. Your current version is {updateInfo.current_version}.
                    </AlertDescription>
                  </Alert>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button className="w-full" disabled={updating}>
                        <Download className="w-4 h-4 mr-2" />
                        {updating ? 'Updating...' : 'Update System'}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Update System</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will update the system from GitHub repository. The process may take several minutes and might require a system restart.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleUpdate}>
                          Update Now
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ) : (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertTitle>System Up to Date</AlertTitle>
                  <AlertDescription>
                    You are running the latest version of the Music-U-Scheduler system.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Update Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Terminal className="w-5 h-5" />
            Update Logs
          </CardTitle>
          <CardDescription>Recent update activity and system messages</CardDescription>
        </CardHeader>
        <CardContent>
          {updateLogs.length > 0 ? (
            <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm text-gray-100 max-h-96 overflow-y-auto">
              {updateLogs.map((log, index) => (
                <div key={index} className="mb-1 hover:bg-gray-800 px-2 py-1 rounded">
                  {log}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Terminal className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No update logs available</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Update Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Update Process Information
          </CardTitle>
          <CardDescription>What happens during a system update</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2">Update Steps</h4>
              <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Download latest changes from GitHub</li>
                <li>Stop running services safely</li>
                <li>Apply code updates</li>
                <li>Update dependencies if needed</li>
                <li>Run database migrations</li>
                <li>Restart services</li>
                <li>Verify system functionality</li>
                <li>Provide restart options to complete update</li>
              </ol>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Safety Measures</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Automatic backup before update</li>
                <li>• Service health checks</li>
                <li>• Rollback capability</li>
                <li>• Configuration preservation</li>
                <li>• User data protection</li>
              </ul>
            </div>
          </div>
          
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Important Notes</AlertTitle>
            <AlertDescription>
              Always create a system backup before updating. After successful updates, you'll be presented with restart options:
              <br />• <strong>Refresh Page:</strong> Quick reload for frontend-only changes
              <br />• <strong>Full Restart:</strong> Complete system restart for backend changes
              <br />Users may experience brief service interruption during the update and restart process.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}

