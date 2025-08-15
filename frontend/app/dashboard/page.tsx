
import ProtectedRoute from '@/components/layout/protected-route';
import StudentDashboard from '@/components/student/student-dashboard';

export const metadata = {
  title: 'Student Dashboard - Music-U-Scheduler',
  description: 'Student dashboard for viewing lessons and progress',
};

export default function DashboardPage() {
  return (
    <ProtectedRoute allowedRoles={['student']}>
      <StudentDashboard />
    </ProtectedRoute>
  );
}
