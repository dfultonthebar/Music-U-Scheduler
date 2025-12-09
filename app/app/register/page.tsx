import StudentRegistrationForm from '@/components/auth/student-registration-form';

export const metadata = {
  title: 'Student Registration | Music U Scheduler',
  description: 'Register for music lessons at Music U Scheduler'
};

export default function RegisterPage() {
  return <StudentRegistrationForm />;
}
