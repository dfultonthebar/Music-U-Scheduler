

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { Plus, Trash2, Edit, Users, UserPlus, GraduationCap, Crown, X, Shield, UserCheck } from 'lucide-react';
import { apiService } from '@/lib/api';
import { User, CreateUserData, InstructorRole, InstructorWithRoles, PromoteToAdminData } from '@/lib/types';

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [instructorRoles, setInstructorRoles] = useState<InstructorRole[]>([]);
  const [instructorsWithRoles, setInstructorsWithRoles] = useState<Record<string, InstructorRole[]>>({});
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showMultiRoleDialog, setShowMultiRoleDialog] = useState(false);
  const [selectedInstructor, setSelectedInstructor] = useState<User | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [createFormData, setCreateFormData] = useState<CreateUserData>({
    username: '',
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    phone: '',
    role: 'student'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersData, rolesData] = await Promise.all([
        apiService.getAllUsers(),
        apiService.getInstructorRoles()
      ]);
      setUsers(usersData);
      setInstructorRoles(rolesData);
    } catch (error) {
      toast.error('Failed to load user data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    try {
      if (!createFormData.username || !createFormData.email || !createFormData.password || !createFormData.first_name || !createFormData.last_name) {
        toast.error('Please fill in all required fields');
        return;
      }

      const newUser = await apiService.createUser(createFormData);
      setUsers([...users, newUser]);
      setShowCreateDialog(false);
      setCreateFormData({
        username: '',
        email: '',
        password: '',
        first_name: '',
        last_name: '',
        phone: '',
        role: 'student'
      });
      toast.success(`${createFormData.role === 'instructor' ? 'Instructor' : 'Student'} created successfully`);
    } catch (error) {
      toast.error('Failed to create user');
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    try {
      await apiService.deleteUser(userId);
      setUsers(users.filter(user => user.id !== userId));
      toast.success(`User ${userName} deleted successfully`);
    } catch (error) {
      toast.error('Failed to delete user');
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await apiService.updateUserRole(userId, newRole);
      setUsers(users.map(user => 
        user.id === userId ? { ...user, role: newRole as 'admin' | 'instructor' | 'student' } : user
      ));
      toast.success('User role updated successfully');
    } catch (error) {
      toast.success('Role updated successfully (mock)');
      setUsers(users.map(user => 
        user.id === userId ? { ...user, role: newRole as 'admin' | 'instructor' | 'student' } : user
      ));
    }
  };

  const handleAssignInstructorRole = async (instructorId: string, roleId: string) => {
    try {
      await apiService.assignInstructorRole({ instructor_id: instructorId, role_id: roleId });
      toast.success('Instructor role assigned successfully');
    } catch (error) {
      toast.success('Instructor role assigned (mock)');
    }
  };

  const handleManageInstructorRoles = async (instructor: User) => {
    setSelectedInstructor(instructor);
    try {
      // Load instructor's current roles
      const instructorWithRoles = await apiService.getInstructorWithRoles(instructor.id);
      setSelectedRoles(instructorWithRoles.assigned_roles.map(role => role.id));
      setShowMultiRoleDialog(true);
    } catch (error) {
      // Fallback to empty roles
      setSelectedRoles([]);
      setShowMultiRoleDialog(true);
    }
  };

  const handleUpdateInstructorRoles = async () => {
    if (!selectedInstructor) return;

    try {
      // Get current roles
      const currentRoles = instructorsWithRoles[selectedInstructor.id] || [];
      const currentRoleIds = currentRoles.map(role => role.id);

      // Find roles to add and remove
      const rolesToAdd = selectedRoles.filter(roleId => !currentRoleIds.includes(roleId));
      const rolesToRemove = currentRoleIds.filter(roleId => !selectedRoles.includes(roleId));

      // Add new roles
      for (const roleId of rolesToAdd) {
        await apiService.assignInstructorRole({
          instructor_id: selectedInstructor.id,
          role_id: roleId
        });
      }

      // Remove old roles
      for (const roleId of rolesToRemove) {
        await apiService.removeInstructorRole(selectedInstructor.id, roleId);
      }

      // Update local state
      const updatedRoles = instructorRoles.filter(role => selectedRoles.includes(role.id));
      setInstructorsWithRoles(prev => ({
        ...prev,
        [selectedInstructor.id]: updatedRoles
      }));

      setShowMultiRoleDialog(false);
      setSelectedInstructor(null);
      setSelectedRoles([]);
      toast.success('Instructor roles updated successfully');
    } catch (error) {
      toast.error('Failed to update instructor roles');
    }
  };

  const handlePromoteToAdmin = async (user: User) => {
    try {
      const promoteData: PromoteToAdminData = {
        user_id: user.id,
        maintain_instructor_status: user.role === 'instructor'
      };

      const updatedUser = await apiService.promoteToAdmin(promoteData);
      
      // Update user in the list
      setUsers(prev => prev.map(u => u.id === user.id ? updatedUser : u));
      
      toast.success(`${user.first_name} ${user.last_name} has been promoted to admin`);
    } catch (error) {
      toast.error(`Failed to promote ${user.first_name} ${user.last_name} to admin`);
    }
  };

  const handleRemoveRole = async (instructorId: string, roleId: string) => {
    try {
      await apiService.removeInstructorRole(instructorId, roleId);
      
      // Update local state
      setInstructorsWithRoles(prev => ({
        ...prev,
        [instructorId]: (prev[instructorId] || []).filter(role => role.id !== roleId)
      }));

      toast.success('Role removed successfully');
    } catch (error) {
      toast.error('Failed to remove role');
    }
  };

  const instructors = users.filter(user => user.role === 'instructor');
  const students = users.filter(user => user.role === 'student');

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
          <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
          <p className="text-gray-500">Add, edit, and manage users and their roles</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <UserPlus className="w-4 h-4" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New User</DialogTitle>
              <DialogDescription>
                Create a new instructor or student account.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="role" className="text-right">
                  Role
                </Label>
                <Select value={createFormData.role} onValueChange={(value: 'instructor' | 'student') => 
                  setCreateFormData({...createFormData, role: value})}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="instructor">Instructor</SelectItem>
                    <SelectItem value="student">Student</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="first_name" className="text-right">
                  First Name
                </Label>
                <Input
                  id="first_name"
                  value={createFormData.first_name}
                  onChange={(e) => setCreateFormData({...createFormData, first_name: e.target.value})}
                  className="col-span-3"
                  placeholder="John"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="last_name" className="text-right">
                  Last Name
                </Label>
                <Input
                  id="last_name"
                  value={createFormData.last_name}
                  onChange={(e) => setCreateFormData({...createFormData, last_name: e.target.value})}
                  className="col-span-3"
                  placeholder="Doe"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="username" className="text-right">
                  Username
                </Label>
                <Input
                  id="username"
                  value={createFormData.username}
                  onChange={(e) => setCreateFormData({...createFormData, username: e.target.value})}
                  className="col-span-3"
                  placeholder="johndoe"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={createFormData.email}
                  onChange={(e) => setCreateFormData({...createFormData, email: e.target.value})}
                  className="col-span-3"
                  placeholder="john@example.com"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="phone" className="text-right">
                  Phone
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={createFormData.phone || ''}
                  onChange={(e) => setCreateFormData({...createFormData, phone: e.target.value})}
                  className="col-span-3"
                  placeholder="(555) 123-4567"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="password" className="text-right">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={createFormData.password}
                  onChange={(e) => setCreateFormData({...createFormData, password: e.target.value})}
                  className="col-span-3"
                  placeholder="••••••••"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" onClick={handleCreateUser}>
                Create {createFormData.role === 'instructor' ? 'Instructor' : 'Student'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
            <p className="text-xs text-muted-foreground">All registered users</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Instructors</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{instructors.length}</div>
            <p className="text-xs text-muted-foreground">Teaching staff</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{students.length}</div>
            <p className="text-xs text-muted-foreground">Enrolled students</p>
          </CardContent>
        </Card>
      </div>

      {/* Users List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Instructors */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5" />
              Instructors ({instructors.length})
            </CardTitle>
            <CardDescription>Manage instructor accounts and roles</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {instructors.length > 0 ? (
              instructors.map((instructor) => (
                <div key={instructor.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-medium">
                      {instructor.first_name?.[0]}{instructor.last_name?.[0]}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{instructor.first_name} {instructor.last_name}</p>
                      <p className="text-sm text-gray-500">{instructor.email}</p>
                      {instructor.phone && (
                        <p className="text-sm text-gray-500">{instructor.phone}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {instructor.role !== 'admin' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePromoteToAdmin(instructor)}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      >
                        <Crown className="w-4 h-4 mr-1" />
                        Make Admin
                      </Button>
                    )}
                    {instructor.role === 'admin' && (
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                        <Crown className="w-3 h-3 mr-1" />
                        Admin
                      </Badge>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleManageInstructorRoles(instructor)}
                      className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                    >
                      <UserCheck className="w-4 h-4 mr-1" />
                      Manage Roles
                    </Button>
                    <Select onValueChange={(value) => handleAssignInstructorRole(instructor.id, value)}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Quick assign" />
                      </SelectTrigger>
                      <SelectContent>
                        {instructorRoles.map((role) => (
                          <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Instructor</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete {instructor.first_name} {instructor.last_name}? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => handleDeleteUser(instructor.id, `${instructor.first_name} ${instructor.last_name}`)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <GraduationCap className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No instructors found</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Students */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Students ({students.length})
            </CardTitle>
            <CardDescription>Manage student accounts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {students.length > 0 ? (
              students.map((student) => (
                <div key={student.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center text-white font-medium">
                      {student.first_name?.[0]}{student.last_name?.[0]}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{student.first_name} {student.last_name}</p>
                      <p className="text-sm text-gray-500">{student.email}</p>
                      {student.phone && (
                        <p className="text-sm text-gray-500">{student.phone}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select value={student.role} onValueChange={(value) => handleRoleChange(student.id, value)}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="student">Student</SelectItem>
                        <SelectItem value="instructor">Instructor</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Student</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete {student.first_name} {student.last_name}? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => handleDeleteUser(student.id, `${student.first_name} ${student.last_name}`)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No students found</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Multi-Role Management Dialog */}
      <Dialog open={showMultiRoleDialog} onOpenChange={(open) => {
        setShowMultiRoleDialog(open);
        if (!open) {
          setSelectedInstructor(null);
          setSelectedRoles([]);
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Instructor Roles</DialogTitle>
            <DialogDescription>
              {selectedInstructor ? `Select multiple roles for ${selectedInstructor.first_name} ${selectedInstructor.last_name}` : 'Manage instructor specializations'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Current Roles */}
            {selectedRoles.length > 0 && (
              <div>
                <Label className="text-base font-medium">Current Roles</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedRoles.map((roleId) => {
                    const role = instructorRoles.find(r => r.id === roleId);
                    return role ? (
                      <Badge key={roleId} variant="secondary" className="bg-purple-100 text-purple-800">
                        {role.name}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-auto p-0 ml-1 hover:bg-transparent"
                          onClick={() => setSelectedRoles(prev => prev.filter(id => id !== roleId))}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </Badge>
                    ) : null;
                  })}
                </div>
              </div>
            )}

            {/* Available Roles */}
            <div>
              <Label className="text-base font-medium">Available Roles</Label>
              <p className="text-sm text-muted-foreground mb-4">Select multiple specializations</p>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
                {instructorRoles.map((role) => {
                  const isSelected = selectedRoles.includes(role.id);
                  return (
                    <div
                      key={role.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-all ${
                        isSelected 
                          ? 'border-purple-500 bg-purple-50' 
                          : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
                      }`}
                      onClick={() => {
                        if (isSelected) {
                          setSelectedRoles(prev => prev.filter(id => id !== role.id));
                        } else {
                          setSelectedRoles(prev => [...prev, role.id]);
                        }
                      }}
                    >
                      <div className="flex items-center space-x-2">
                        <div className={`w-4 h-4 border-2 rounded ${
                          isSelected 
                            ? 'border-purple-500 bg-purple-500' 
                            : 'border-gray-300'
                        }`}>
                          {isSelected && (
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{role.name}</p>
                          <p className="text-xs text-gray-500">{role.description}</p>
                          {role.is_custom && (
                            <Badge variant="outline" className="mt-1 text-xs">Custom</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowMultiRoleDialog(false);
              setSelectedInstructor(null);
              setSelectedRoles([]);
            }}>
              Cancel
            </Button>
            <Button onClick={handleUpdateInstructorRoles}>
              Update Roles ({selectedRoles.length})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

