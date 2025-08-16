
'use client';

import ProtectedRoute from '@/components/layout/protected-route';
import AdminDashboard from '@/components/admin/admin-dashboard';
import { BackendAuthHandler } from '@/components/auth/backend-auth-handler';

export default function AdminPage() {
  return (
    <>
      <BackendAuthHandler />
      <ProtectedRoute allowedRoles={['admin']}>
        <AdminDashboard />
      </ProtectedRoute>
    </>
  );
}
