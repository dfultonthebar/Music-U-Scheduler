
import ProtectedRoute from '@/components/layout/protected-route';
import AdminDashboard from '@/components/admin/admin-dashboard';

export const metadata = {
  title: 'Admin Dashboard - Music-U-Scheduler',
  description: 'Admin dashboard for Music-U-Scheduler system management',
};

export default function AdminPage() {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <AdminDashboard />
    </ProtectedRoute>
  );
}
