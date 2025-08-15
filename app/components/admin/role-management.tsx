
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Music, Settings, User, Calendar, Eye } from 'lucide-react';
import { apiService } from '@/lib/api';
import { InstructorRole, CreateRoleData, UpdateRoleData } from '@/lib/types';

const AVAILABLE_PERMISSIONS = [
  { id: 'teach_piano', label: 'Teach Piano', category: 'Teaching', icon: Music },
  { id: 'teach_guitar', label: 'Teach Guitar', category: 'Teaching', icon: Music },
  { id: 'teach_vocals', label: 'Teach Vocals', category: 'Teaching', icon: Music },
  { id: 'teach_violin', label: 'Teach Violin', category: 'Teaching', icon: Music },
  { id: 'teach_drums', label: 'Teach Drums', category: 'Teaching', icon: Music },
  { id: 'teach_trumpet', label: 'Teach Trumpet', category: 'Teaching', icon: Music },
  { id: 'teach_clarinet', label: 'Teach Clarinet', category: 'Teaching', icon: Music },
  { id: 'teach_saxophone', label: 'Teach Saxophone', category: 'Teaching', icon: Music },
  { id: 'teach_flute', label: 'Teach Flute', category: 'Teaching', icon: Music },
  { id: 'teach_cello', label: 'Teach Cello', category: 'Teaching', icon: Music },
  { id: 'teach_trombone', label: 'Teach Trombone', category: 'Teaching', icon: Music },
  { id: 'teach_french_horn', label: 'Teach French Horn', category: 'Teaching', icon: Music },
  { id: 'teach_oboe', label: 'Teach Oboe', category: 'Teaching', icon: Music },
  { id: 'teach_bassoon', label: 'Teach Bassoon', category: 'Teaching', icon: Music },
  { id: 'teach_viola', label: 'Teach Viola', category: 'Teaching', icon: Music },
  { id: 'teach_double_bass', label: 'Teach Double Bass', category: 'Teaching', icon: Music },
  { id: 'teach_tuba', label: 'Teach Tuba', category: 'Teaching', icon: Music },
  { id: 'teach_harp', label: 'Teach Harp', category: 'Teaching', icon: Music },
  { id: 'teach_percussion', label: 'Teach Percussion', category: 'Teaching', icon: Music },
  { id: 'teach_ukulele', label: 'Teach Ukulele', category: 'Teaching', icon: Music },
  { id: 'teach_bass_guitar', label: 'Teach Bass Guitar', category: 'Teaching', icon: Music },
  { id: 'teach_banjo', label: 'Teach Banjo', category: 'Teaching', icon: Music },
  { id: 'teach_mandolin', label: 'Teach Mandolin', category: 'Teaching', icon: Music },
  { id: 'teach_accordion', label: 'Teach Accordion', category: 'Teaching', icon: Music },
  { id: 'teach_harmonica', label: 'Teach Harmonica', category: 'Teaching', icon: Music },
  { id: 'schedule_lessons', label: 'Schedule Lessons', category: 'Administration', icon: Calendar },
  { id: 'cancel_lessons', label: 'Cancel Lessons', category: 'Administration', icon: Calendar },
  { id: 'reschedule_lessons', label: 'Reschedule Lessons', category: 'Administration', icon: Calendar },
  { id: 'view_students', label: 'View Students', category: 'Access', icon: Eye },
  { id: 'view_all_students', label: 'View All Students', category: 'Access', icon: Eye },
  { id: 'manage_students', label: 'Manage Students', category: 'Administration', icon: User },
  { id: 'view_reports', label: 'View Reports', category: 'Access', icon: Eye },
  { id: 'generate_reports', label: 'Generate Reports', category: 'Administration', icon: Settings },
  { id: 'manage_schedule', label: 'Manage Schedule', category: 'Administration', icon: Settings },
  { id: 'admin_access', label: 'Admin Access', category: 'Special', icon: Settings }
];

export default function RoleManagement() {
  const [roles, setRoles] = useState<InstructorRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingRole, setEditingRole] = useState<InstructorRole | null>(null);
  const [formData, setFormData] = useState<CreateRoleData>({
    name: '',
    description: '',
    permissions: []
  });

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    try {
      setLoading(true);
      const rolesData = await apiService.getInstructorRoles();
      setRoles(rolesData);
    } catch (error) {
      toast.error('Failed to load roles');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', description: '', permissions: [] });
    setEditingRole(null);
  };

  const handleCreateRole = async () => {
    if (!formData.name.trim() || !formData.description.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (formData.permissions.length === 0) {
      toast.error('Please select at least one permission');
      return;
    }

    try {
      const newRole = await apiService.createInstructorRole(formData);
      setRoles([...roles, newRole]);
      resetForm();
      setShowCreateDialog(false);
      toast.success('Role created successfully');
    } catch (error) {
      toast.error('Failed to create role');
    }
  };

  const handleUpdateRole = async () => {
    if (!editingRole || !formData.name.trim() || !formData.description.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (formData.permissions.length === 0) {
      toast.error('Please select at least one permission');
      return;
    }

    try {
      const updateData: UpdateRoleData = {
        id: editingRole.id,
        name: formData.name,
        description: formData.description,
        permissions: formData.permissions
      };
      
      const updatedRole = await apiService.updateInstructorRole(updateData);
      setRoles(roles.map(role => role.id === editingRole.id ? updatedRole : role));
      resetForm();
      setEditingRole(null);
      toast.success('Role updated successfully');
    } catch (error) {
      toast.error('Failed to update role');
    }
  };

  const handleDeleteRole = async (role: InstructorRole) => {
    if (!role.is_custom) {
      toast.error('Cannot delete built-in roles');
      return;
    }

    try {
      await apiService.deleteInstructorRole(role.id);
      setRoles(roles.filter(r => r.id !== role.id));
      toast.success('Role deleted successfully');
    } catch (error) {
      toast.error('Failed to delete role');
    }
  };

  const handleEditRole = (role: InstructorRole) => {
    setEditingRole(role);
    setFormData({
      name: role.name,
      description: role.description,
      permissions: [...role.permissions]
    });
  };

  const handlePermissionToggle = (permissionId: string, checked: boolean) => {
    if (checked) {
      setFormData(prev => ({
        ...prev,
        permissions: [...prev.permissions, permissionId]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        permissions: prev.permissions.filter(p => p !== permissionId)
      }));
    }
  };

  const groupedPermissions = AVAILABLE_PERMISSIONS.reduce((acc, permission) => {
    if (!acc[permission.category]) {
      acc[permission.category] = [];
    }
    acc[permission.category].push(permission);
    return acc;
  }, {} as Record<string, typeof AVAILABLE_PERMISSIONS>);

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading roles...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Role Management</h2>
          <p className="text-muted-foreground">Create and manage instructor roles and permissions</p>
        </div>
        
        <Dialog open={showCreateDialog} onOpenChange={(open) => {
          setShowCreateDialog(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Role
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Role</DialogTitle>
              <DialogDescription>Define a new instructor role with specific permissions</DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Role Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Advanced Piano Instructor"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief description of the role"
                    rows={3}
                  />
                </div>
              </div>

              <div>
                <Label className="text-base font-medium">Permissions *</Label>
                <p className="text-sm text-muted-foreground mb-4">Select the permissions for this role</p>
                
                <div className="space-y-6">
                  {Object.entries(groupedPermissions).map(([category, permissions]) => (
                    <div key={category} className="space-y-3">
                      <h4 className="font-medium text-sm text-gray-900">{category}</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {permissions.map((permission) => {
                          const Icon = permission.icon;
                          return (
                            <div key={permission.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={permission.id}
                                checked={formData.permissions.includes(permission.id)}
                                onCheckedChange={(checked) => 
                                  handlePermissionToggle(permission.id, checked as boolean)
                                }
                              />
                              <div className="flex items-center space-x-2">
                                <Icon className="w-4 h-4 text-muted-foreground" />
                                <Label
                                  htmlFor={permission.id}
                                  className="text-sm font-normal cursor-pointer"
                                >
                                  {permission.label}
                                </Label>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setShowCreateDialog(false);
                resetForm();
              }}>
                Cancel
              </Button>
              <Button onClick={handleCreateRole}>Create Role</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Role Dialog */}
      <Dialog open={!!editingRole} onOpenChange={(open) => {
        if (!open) {
          setEditingRole(null);
          resetForm();
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Role</DialogTitle>
            <DialogDescription>Modify role permissions and details</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-name">Role Name *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Advanced Piano Instructor"
                />
              </div>
              <div>
                <Label htmlFor="edit-description">Description *</Label>
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of the role"
                  rows={3}
                />
              </div>
            </div>

            <div>
              <Label className="text-base font-medium">Permissions *</Label>
              <p className="text-sm text-muted-foreground mb-4">Select the permissions for this role</p>
              
              <div className="space-y-6">
                {Object.entries(groupedPermissions).map(([category, permissions]) => (
                  <div key={category} className="space-y-3">
                    <h4 className="font-medium text-sm text-gray-900">{category}</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {permissions.map((permission) => {
                        const Icon = permission.icon;
                        return (
                          <div key={permission.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`edit-${permission.id}`}
                              checked={formData.permissions.includes(permission.id)}
                              onCheckedChange={(checked) => 
                                handlePermissionToggle(permission.id, checked as boolean)
                              }
                            />
                            <div className="flex items-center space-x-2">
                              <Icon className="w-4 h-4 text-muted-foreground" />
                              <Label
                                htmlFor={`edit-${permission.id}`}
                                className="text-sm font-normal cursor-pointer"
                              >
                                {permission.label}
                              </Label>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setEditingRole(null);
              resetForm();
            }}>
              Cancel
            </Button>
            <Button onClick={handleUpdateRole}>Update Role</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Roles List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {roles.map((role) => (
          <Card key={role.id} className={`${role.is_custom ? 'border-blue-200' : 'border-gray-200'}`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{role.name}</CardTitle>
                <div className="flex items-center space-x-2">
                  {role.is_custom && (
                    <Badge variant="secondary" className="text-xs">Custom</Badge>
                  )}
                  <div className="flex space-x-1">
                    {role.is_custom && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditRole(role)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Role</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete the "{role.name}" role? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteRole(role)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <CardDescription>{role.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Permissions ({role.permissions.length})</Label>
                <div className="flex flex-wrap gap-1">
                  {role.permissions.slice(0, 3).map((permission) => {
                    const permissionInfo = AVAILABLE_PERMISSIONS.find(p => p.id === permission);
                    return (
                      <Badge key={permission} variant="outline" className="text-xs">
                        {permissionInfo?.label || permission}
                      </Badge>
                    );
                  })}
                  {role.permissions.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{role.permissions.length - 3} more
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {roles.length === 0 && (
        <div className="text-center py-12">
          <Settings className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No roles found</h3>
          <p className="text-gray-500 mb-4">Create your first instructor role to get started</p>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Role
          </Button>
        </div>
      )}
    </div>
  );
}
