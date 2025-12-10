
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/layout/protected-route';
import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Music, LogOut, User, BookOpen, Edit } from 'lucide-react';
import { apiService } from '@/lib/api';
import { toast } from 'sonner';

function GeneralDashboard() {
  const { user, logout, displayName, refreshUser } = useAuth();
  const router = useRouter();

  // Edit profile state
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [editProfileData, setEditProfileData] = useState({
    full_name: '',
    phone: '',
    address: '',
    emergency_contact: '',
    instrument: ''
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleEditProfile = () => {
    setEditProfileData({
      full_name: user?.full_name || '',
      phone: user?.phone || '',
      address: user?.address || '',
      emergency_contact: user?.emergency_contact || '',
      instrument: user?.instrument || ''
    });
    setShowEditProfileModal(true);
  };

  const handleSaveProfile = async () => {
    if (!user?.id) {
      toast.error('Unable to identify user');
      return;
    }

    setIsSaving(true);
    try {
      await apiService.updateMyProfile(parseInt(String(user.id)), {
        full_name: editProfileData.full_name || undefined,
        phone: editProfileData.phone || undefined,
        address: editProfileData.address || undefined,
        emergency_contact: editProfileData.emergency_contact || undefined,
        instrument: editProfileData.instrument || undefined
      });

      toast.success('Profile updated successfully!');
      setShowEditProfileModal(false);

      // Refresh user data
      if (refreshUser) {
        await refreshUser();
      }
    } catch (error: any) {
      console.error('Failed to save profile:', error);
      toast.error(error?.message || 'Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

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
              <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
              <p className="text-sm text-gray-500">Welcome to Music-U-Scheduler</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">{displayName}</p>
              <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
            </div>
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
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Music className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl">Welcome to Music-U-Scheduler!</CardTitle>
              <CardDescription>
                Hello, {displayName}! You're signed in as a {user?.role}.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-md mx-auto">
                <button
                  onClick={handleEditProfile}
                  className="p-4 border border-gray-200 rounded-lg hover:border-blue-400 hover:shadow-md transition-all cursor-pointer text-left"
                >
                  <User className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                  <h3 className="font-medium text-gray-900">Profile</h3>
                  <p className="text-sm text-gray-500">Manage your account</p>
                </button>

                <button
                  onClick={() => router.push('/instructor')}
                  className="p-4 border border-gray-200 rounded-lg hover:border-green-400 hover:shadow-md transition-all cursor-pointer text-left"
                >
                  <BookOpen className="w-8 h-8 mx-auto mb-2 text-green-600" />
                  <h3 className="font-medium text-gray-900">Lessons</h3>
                  <p className="text-sm text-gray-500">View your lessons</p>
                </button>
              </div>

              <div className="pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-600 mb-4">
                  For full access to features, please contact your administrator to assign you the appropriate role.
                </p>
                <Button onClick={logout} variant="outline">
                  Sign Out
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Profile Dialog */}
      <Dialog open={showEditProfileModal} onOpenChange={setShowEditProfileModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5" />
              Edit Profile
            </DialogTitle>
            <DialogDescription>
              Update your personal information
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                value={editProfileData.full_name}
                onChange={(e) => setEditProfileData({ ...editProfileData, full_name: e.target.value })}
                placeholder="Your full name"
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
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={editProfileData.address}
                onChange={(e) => setEditProfileData({ ...editProfileData, address: e.target.value })}
                placeholder="Your address"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="emergency_contact">Emergency Contact</Label>
              <Input
                id="emergency_contact"
                value={editProfileData.emergency_contact}
                onChange={(e) => setEditProfileData({ ...editProfileData, emergency_contact: e.target.value })}
                placeholder="Emergency contact info"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="instrument">Instrument</Label>
              <Input
                id="instrument"
                value={editProfileData.instrument}
                onChange={(e) => setEditProfileData({ ...editProfileData, instrument: e.target.value })}
                placeholder="Your instrument"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowEditProfileModal(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveProfile}
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <GeneralDashboard />
    </ProtectedRoute>
  );
}
