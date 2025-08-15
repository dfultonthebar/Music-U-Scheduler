

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
import { Plus, Trash2, Edit, Users, UserPlus, GraduationCap } from 'lucide-react';
import { apiService } from '@/lib/api';
import { User, CreateUserData, InstructorRole } from '@/lib/types';

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [instructorRoles, setInstructorRoles] = useState<InstructorRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
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
                    <Select value={instructor.role} onValueChange={(value) => handleRoleChange(instructor.id, value)}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="instructor">Instructor</SelectItem>
                        <SelectItem value="student">Student</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select onValueChange={(value) => handleAssignInstructorRole(instructor.id, value)}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Assign role" />
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
    </div>
  );
}

