
import ProtectedRoute from '@/components/layout/protected-route';
import InstructorDashboard from '@/components/instructor/instructor-dashboard';

export const metadata = {
  title: 'Instructor Dashboard - Music-U-Scheduler',
  description: 'Instructor dashboard for managing lessons and students',
};

export default function InstructorPage() {
  return (
    <ProtectedRoute allowedRoles={['instructor']}>
      <InstructorDashboard />
    </ProtectedRoute>
  );
}
