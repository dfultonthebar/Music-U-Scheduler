'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  UserPlus,
  UserCheck,
  UserX,
  Mail,
  Phone,
  Music,
  Calendar,
  FileText,
  Award,
  CheckCircle2,
  XCircle,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';
import { apiService } from '@/lib/api';

interface Registration {
  id: number;
  email: string;
  full_name: string;
  phone?: string;
  instrument: string;
  experience_level: string;
  notes?: string;
  approval_status: string;
  created_at: string;
}

export default function RegistrationApproval() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRegistration, setSelectedRegistration] = useState<Registration | null>(null);
  const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [approvalData, setApprovalData] = useState({
    username: '',
    password: ''
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'pending' | 'all'>('pending');

  useEffect(() => {
    loadRegistrations();
  }, [filterStatus]);

  const loadRegistrations = async () => {
    setIsLoading(true);
    try {
      const data = filterStatus === 'pending'
        ? await apiService.getPendingRegistrations()
        : await apiService.getAllRegistrations();
      setRegistrations(data);
    } catch (error: any) {
      console.error('Error loading registrations:', error);
      toast.error('Failed to load registrations');
    } finally {
      setIsLoading(false);
    }
  };

  const openApprovalDialog = (registration: Registration) => {
    setSelectedRegistration(registration);
    // Suggest username from email
    const suggestedUsername = registration.email.split('@')[0].toLowerCase();
    setApprovalData({
      username: suggestedUsername,
      password: generatePassword()
    });
    setIsApprovalDialogOpen(true);
  };

  const openRejectDialog = (registration: Registration) => {
    setSelectedRegistration(registration);
    setIsRejectDialogOpen(true);
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const handleApprove = async () => {
    if (!selectedRegistration) return;

    if (!approvalData.username || !approvalData.password) {
      toast.error('Please provide username and password');
      return;
    }

    setIsProcessing(true);
    try {
      const response = await apiService.approveRegistration(
        selectedRegistration.id,
        approvalData.username,
        approvalData.password
      );

      toast.success('Registration approved successfully!');
      setIsApprovalDialogOpen(false);
      setSelectedRegistration(null);
      setApprovalData({ username: '', password: '' });
      loadRegistrations();
    } catch (error: any) {
      console.error('Error approving registration:', error);
      toast.error(error.message || 'Failed to approve registration');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRegistration) return;

    setIsProcessing(true);
    try {
      await apiService.rejectRegistration(selectedRegistration.id);
      toast.success('Registration rejected');
      setIsRejectDialogOpen(false);
      setSelectedRegistration(null);
      loadRegistrations();
    } catch (error: any) {
      console.error('Error rejecting registration:', error);
      toast.error(error.message || 'Failed to reject registration');
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300"><CheckCircle2 className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="w-5 h-5" />
                Student Registration Approvals
              </CardTitle>
              <CardDescription>
                Review and approve pending student registration requests
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant={filterStatus === 'pending' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('pending')}
                size="sm"
              >
                Pending Only
              </Button>
              <Button
                variant={filterStatus === 'all' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('all')}
                size="sm"
              >
                All Registrations
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Loading registrations...</div>
          ) : registrations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {filterStatus === 'pending' ? 'No pending registrations' : 'No registrations found'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Instrument</TableHead>
                    <TableHead>Experience</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {registrations.map((registration) => (
                    <TableRow key={registration.id}>
                      <TableCell>
                        <div className="font-medium">{registration.full_name}</div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center gap-1 text-gray-600">
                            <Mail className="w-3 h-3" />
                            {registration.email}
                          </div>
                          {registration.phone && (
                            <div className="flex items-center gap-1 text-gray-600">
                              <Phone className="w-3 h-3" />
                              {registration.phone}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Music className="w-4 h-4 text-purple-600" />
                          {registration.instrument}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="capitalize">
                          <Award className="w-3 h-3 mr-1" />
                          {registration.experience_level}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Calendar className="w-3 h-3" />
                          {formatDate(registration.created_at)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(registration.approval_status)}
                      </TableCell>
                      <TableCell className="text-right">
                        {registration.approval_status === 'pending' ? (
                          <div className="flex gap-2 justify-end">
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => openApprovalDialog(registration)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <UserCheck className="w-4 h-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => openRejectDialog(registration)}
                            >
                              <UserX className="w-4 h-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">
                            {registration.approval_status === 'approved' ? 'Approved' : 'Rejected'}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Approval Dialog */}
      <Dialog open={isApprovalDialogOpen} onOpenChange={setIsApprovalDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Approve Registration</DialogTitle>
            <DialogDescription>
              Create account for {selectedRegistration?.full_name}
            </DialogDescription>
          </DialogHeader>

          {selectedRegistration && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
                <div><strong>Email:</strong> {selectedRegistration.email}</div>
                <div><strong>Instrument:</strong> {selectedRegistration.instrument}</div>
                <div><strong>Experience:</strong> {selectedRegistration.experience_level}</div>
                {selectedRegistration.notes && (
                  <div><strong>Notes:</strong> {selectedRegistration.notes}</div>
                )}
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={approvalData.username}
                    onChange={(e) => setApprovalData({ ...approvalData, username: e.target.value })}
                    placeholder="student username"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Initial Password</Label>
                  <div className="flex gap-2">
                    <Input
                      id="password"
                      value={approvalData.password}
                      onChange={(e) => setApprovalData({ ...approvalData, password: e.target.value })}
                      placeholder="Password"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setApprovalData({ ...approvalData, password: generatePassword() })}
                    >
                      Generate
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">
                    This password will be shared with the student. They can change it later.
                  </p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsApprovalDialogOpen(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleApprove}
              disabled={isProcessing}
              className="bg-green-600 hover:bg-green-700"
            >
              {isProcessing ? 'Approving...' : 'Approve & Create Account'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Registration</DialogTitle>
            <DialogDescription>
              Are you sure you want to reject this registration?
            </DialogDescription>
          </DialogHeader>

          {selectedRegistration && (
            <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
              <div><strong>Name:</strong> {selectedRegistration.full_name}</div>
              <div><strong>Email:</strong> {selectedRegistration.email}</div>
              <div><strong>Instrument:</strong> {selectedRegistration.instrument}</div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsRejectDialogOpen(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={isProcessing}
            >
              {isProcessing ? 'Rejecting...' : 'Reject Registration'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
