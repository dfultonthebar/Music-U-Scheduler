
// Core types for the Music-U-Scheduler application
export interface User {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role: 'admin' | 'instructor' | 'student';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role?: string;
}

export interface Lesson {
  id: string;
  title: string;
  description?: string;
  instructor_id: string;
  student_id: string;
  scheduled_at: string;
  duration_minutes: number;
  status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Student {
  id: string;
  user_id: string;
  instrument?: string;
  skill_level?: string;
  emergency_contact?: string;
  parent_email?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  user: User;
}

export interface Instructor {
  id: string;
  user_id: string;
  bio?: string;
  specialties?: string[];
  hourly_rate?: number;
  availability?: string;
  created_at: string;
  updated_at: string;
  user: User;
}

export interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  details?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface DashboardStats {
  total_users: number;
  total_instructors: number;
  total_students: number;
  total_lessons: number;
  upcoming_lessons: number;
  completed_lessons: number;
  cancelled_lessons: number;
  active_users_today: number;
}

export interface APIError {
  detail: string;
  status_code?: number;
}

// New types for enhanced admin features
export interface CreateUserData {
  username: string;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role: 'instructor' | 'student';
  full_name?: string;
  is_instructor?: boolean;
}

export interface EmailServerSettings {
  smtp_host: string;
  smtp_port: number;
  smtp_username: string;
  smtp_password: string;
  smtp_use_tls: boolean;
  smtp_use_ssl: boolean;
  imap_host?: string;
  imap_port?: number;
  imap_username?: string;
  imap_password?: string;
  from_email: string;
  from_name: string;
}

export interface SystemBackup {
  id: string;
  filename: string;
  size: number;
  created_at: string;
  type: 'manual' | 'automatic';
  status: 'completed' | 'in_progress' | 'failed';
  description?: string;
}

export interface GitHubUpdate {
  current_version: string;
  latest_version: string;
  has_updates: boolean;
  update_available: boolean;
  last_check: string;
  commit_hash: string;
  branch: string;
}

export interface InstructorRole {
  id: string;
  name: string;
  description: string;
  permissions: string[];
}

export interface AssignRoleData {
  instructor_id: string;
  role_id: string;
}
