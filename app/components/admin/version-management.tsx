
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { 
  Tag, 
  Calendar, 
  User, 
  GitBranch, 
  Plus, 
  History, 
  Info, 
  Clock,
  CheckCircle,
  AlertTriangle,
  ArrowUp
} from 'lucide-react';
import { versionManager, VersionInfo, VersionChange, incrementVersion } from '@/lib/version';

export default function VersionManagement() {
  const [versionInfo, setVersionInfo] = useState<VersionInfo | null>(null);
  const [showNewVersionDialog, setShowNewVersionDialog] = useState(false);
  const [newVersionData, setNewVersionData] = useState({
    type: 'patch' as 'major' | 'minor' | 'patch' | 'build',
    description: '',
    changes: '',
    author: 'Admin'
  });

  useEffect(() => {
    loadVersionInfo();
  }, []);

  const loadVersionInfo = () => {
    const info = versionManager.getCurrentVersion();
    setVersionInfo(info);
  };

  const handleCreateVersion = () => {
    if (!newVersionData.description.trim() || !newVersionData.changes.trim()) {
      toast.error('Please fill in description and changes');
      return;
    }

    const changes = newVersionData.changes
      .split('\n')
      .map(change => change.trim())
      .filter(change => change.length > 0);

    if (changes.length === 0) {
      toast.error('Please add at least one change');
      return;
    }

    try {
      const newVersion = incrementVersion(
        newVersionData.type,
        newVersionData.description,
        changes,
        newVersionData.author
      );

      setVersionInfo(newVersion);
      setShowNewVersionDialog(false);
      setNewVersionData({
        type: 'patch',
        description: '',
        changes: '',
        author: 'Admin'
      });

      toast.success(`Version ${newVersion.version} created successfully!`);
    } catch (error) {
      toast.error('Failed to create new version');
    }
  };

  const getVersionTypeColor = (type: string) => {
    switch (type) {
      case 'major': return 'destructive';
      case 'minor': return 'default';
      case 'patch': return 'secondary';
      case 'build': return 'outline';
      default: return 'outline';
    }
  };

  const getVersionTypeIcon = (type: string) => {
    switch (type) {
      case 'major': return <ArrowUp className="w-3 h-3" />;
      case 'minor': return <GitBranch className="w-3 h-3" />;
      case 'patch': return <CheckCircle className="w-3 h-3" />;
      case 'build': return <Plus className="w-3 h-3" />;
      default: return <Info className="w-3 h-3" />;
    }
  };

  if (!versionInfo) {
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
          <h2 className="text-2xl font-bold text-gray-900">Version Management</h2>
          <p className="text-gray-500">Track and manage system versions and changelog</p>
        </div>
        <Dialog open={showNewVersionDialog} onOpenChange={setShowNewVersionDialog}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              New Version
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Version</DialogTitle>
              <DialogDescription>
                Increment the version number and add changelog information
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="version-type">Version Type</Label>
                <Select value={newVersionData.type} onValueChange={(value: any) => 
                  setNewVersionData({...newVersionData, type: value})
                }>
                  <SelectTrigger>
                    <SelectValue placeholder="Select version type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="major">Major (Breaking changes)</SelectItem>
                    <SelectItem value="minor">Minor (New features)</SelectItem>
                    <SelectItem value="patch">Patch (Bug fixes)</SelectItem>
                    <SelectItem value="build">Build (Internal changes)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  placeholder="Brief description of this version"
                  value={newVersionData.description}
                  onChange={(e) => setNewVersionData({...newVersionData, description: e.target.value})}
                />
              </div>
              
              <div>
                <Label htmlFor="changes">Changes (one per line)</Label>
                <Textarea
                  id="changes"
                  placeholder="- Added new feature&#10;- Fixed bug in authentication&#10;- Improved performance"
                  value={newVersionData.changes}
                  onChange={(e) => setNewVersionData({...newVersionData, changes: e.target.value})}
                  rows={4}
                />
              </div>
              
              <div>
                <Label htmlFor="author">Author</Label>
                <Input
                  id="author"
                  placeholder="Your name"
                  value={newVersionData.author}
                  onChange={(e) => setNewVersionData({...newVersionData, author: e.target.value})}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNewVersionDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateVersion}>
                Create Version
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Current Version Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="w-5 h-5" />
              Current Version
            </CardTitle>
            <CardDescription>System version information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Version</span>
              <Badge variant="default" className="text-lg px-3 py-1">
                v{versionInfo.version}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Short Version</span>
              <Badge variant="outline">
                v{versionInfo.major}.{versionInfo.minor}.{versionInfo.patch}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Build Number</span>
              <Badge variant="secondary">{versionInfo.build}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Last Updated</span>
              <span className="text-sm text-gray-900 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {new Date(versionInfo.lastUpdated).toLocaleDateString()}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="w-5 h-5" />
              Latest Changes
            </CardTitle>
            <CardDescription>Most recent version changes</CardDescription>
          </CardHeader>
          <CardContent>
            {versionInfo.changelog.length > 0 ? (
              <div className="space-y-3">
                {versionInfo.changelog[0].changes.slice(0, 4).map((change, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{change}</span>
                  </div>
                ))}
                {versionInfo.changelog[0].changes.length > 4 && (
                  <p className="text-xs text-muted-foreground">
                    +{versionInfo.changelog[0].changes.length - 4} more changes
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No recent changes</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Changelog */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Version History
          </CardTitle>
          <CardDescription>Complete changelog of all versions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {versionInfo.changelog.map((change, index) => (
              <div key={change.id} className="relative">
                {index !== versionInfo.changelog.length - 1 && (
                  <div className="absolute left-4 top-8 bottom-0 w-px bg-gray-200"></div>
                )}
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-white border-2 border-gray-200 rounded-full flex items-center justify-center">
                      {getVersionTypeIcon(change.type)}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant={getVersionTypeColor(change.type) as any}>
                        v{change.version}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {change.type.charAt(0).toUpperCase() + change.type.slice(1)} Release
                      </span>
                    </div>
                    <h3 className="text-sm font-medium text-gray-900 mb-2">
                      {change.description}
                    </h3>
                    <ul className="space-y-1 mb-3">
                      {change.changes.map((changeItem, changeIndex) => (
                        <li key={changeIndex} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="text-gray-400">•</span>
                          <span>{changeItem}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(change.date).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {change.author}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Version Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="w-5 h-5" />
            Version Types
          </CardTitle>
          <CardDescription>Understanding version numbering system</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3">Version Format: MAJOR.MINOR.PATCH.BUILD</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="destructive" className="w-16">MAJOR</Badge>
                  <span className="text-sm">Breaking changes, new architecture</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="default" className="w-16">MINOR</Badge>
                  <span className="text-sm">New features, backward compatible</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="w-16">PATCH</Badge>
                  <span className="text-sm">Bug fixes, security patches</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="w-16">BUILD</Badge>
                  <span className="text-sm">Internal changes, optimizations</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-3">Best Practices</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Use semantic versioning principles</li>
                <li>• Include clear change descriptions</li>
                <li>• Document breaking changes in major releases</li>
                <li>• Keep changelog entries concise but informative</li>
                <li>• Tag versions after significant deployments</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
