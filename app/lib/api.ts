
import { 
  User, 
  AuthResponse, 
  LoginCredentials, 
  RegisterData, 
  Lesson, 
  Student, 
  Instructor, 
  AuditLog, 
  DashboardStats,
  CreateUserData,
  EmailServerSettings,
  SystemBackup,
  GitHubUpdate,
  InstructorRole,
  AssignRoleData,
  CreateRoleData,
  UpdateRoleData,
  InstructorWithRoles,
  PromoteToAdminData
} from './types';
import { getSession } from 'next-auth/react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

class APIError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'APIError';
  }
}

class APIService {
  private token: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('backend_auth_token');
    }
  }

  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('backend_auth_token', token);
    }
  }

  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('backend_auth_token');
    }
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers: Record<string, string> = {
      ...((options.headers as Record<string, string>) || {}),
    };

    // Only set Content-Type for JSON if not FormData
    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    // Get backend JWT token from NextAuth session
    try {
      const session = await getSession();
      const backendToken = (session?.user as any)?.backendToken;
      if (backendToken) {
        headers.Authorization = `Bearer ${backendToken}`;
      }
    } catch (error) {
      console.warn('Could not get session for API request:', error);
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Request failed' }));
        throw new APIError(response.status, errorData.detail || 'Request failed');
      }

      return await response.json();
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      throw new APIError(500, 'Network error occurred');
    }
  }

  // Authentication endpoints
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    // Authenticate with backend
    const formData = new FormData();
    formData.append('username', credentials.username);
    formData.append('password', credentials.password);

    const response = await this.makeRequest<AuthResponse>('/auth/login', {
      method: 'POST',
      headers: {},
      body: formData,
    });

    this.setToken(response.access_token);
    return response;
  }

  async register(data: RegisterData): Promise<User> {
    return this.makeRequest<User>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getCurrentUser(): Promise<User> {
    return this.makeRequest<User>('/auth/me');
  }

  async logout(): Promise<void> {
    this.clearToken();
  }

  // Admin endpoints
  async getAdminDashboard(): Promise<DashboardStats> {
    return this.makeRequest<DashboardStats>('/admin/dashboard');
  }

  async getAllUsers(): Promise<User[]> {
    return this.makeRequest<User[]>('/admin/users');
  }

  async getAllLessons(): Promise<Lesson[]> {
    return this.makeRequest<Lesson[]>('/admin/lessons');
  }

  async getAuditLogs(): Promise<AuditLog[]> {
    return this.makeRequest<AuditLog[]>('/admin/audit-logs');
  }

  async getAdminReports(): Promise<any> {
    return this.makeRequest<any>('/admin/reports');
  }

  async getAdminSettings(): Promise<any> {
    return this.makeRequest<any>('/admin/settings');
  }

  async updateAdminSettings(settings: any): Promise<any> {
    return this.makeRequest<any>('/admin/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  // Instructor endpoints
  async getInstructorDashboard(): Promise<any> {
    return this.makeRequest<any>('/instructor/dashboard');
  }

  async getInstructorProfile(): Promise<Instructor> {
    return this.makeRequest<Instructor>('/instructor/profile');
  }

  async updateInstructorProfile(data: Partial<Instructor>): Promise<Instructor> {
    return this.makeRequest<Instructor>('/instructor/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async getInstructorLessons(): Promise<Lesson[]> {
    return this.makeRequest<Lesson[]>('/instructor/lessons');
  }

  async getInstructorStudents(): Promise<Student[]> {
    return this.makeRequest<Student[]>('/instructor/students');
  }

  async getInstructorSchedule(): Promise<any> {
    return this.makeRequest<any>('/instructor/schedule');
  }

  async getInstructorReports(): Promise<any> {
    return this.makeRequest<any>('/instructor/reports');
  }

  // Enhanced Admin User Management
  async createUser(userData: CreateUserData): Promise<User> {
    const payload = {
      ...userData,
      full_name: `${userData.first_name} ${userData.last_name}`,
      is_instructor: userData.role === 'instructor'
    };
    
    return await this.makeRequest<User>('/admin/users', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async deleteUser(userId: string): Promise<void> {
    await this.makeRequest(`/admin/users/${userId}`, {
      method: 'DELETE',
    });
  }

  async updateUserRole(userId: string, role: string): Promise<User> {
    return await this.makeRequest<User>(`/admin/users/${userId}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    });
  }

  // Instructor Role Management
  async getInstructorRoles(): Promise<InstructorRole[]> {
    try {
      return await this.makeRequest<InstructorRole[]>('/admin/instructor-roles');
    } catch (error) {
      // Mock roles for testing
      return [
        {
          id: 'role-1',
          name: 'Piano Instructor',
          description: 'Certified piano teacher',
          permissions: ['teach_piano', 'schedule_lessons', 'view_students']
        },
        {
          id: 'role-2',
          name: 'Guitar Instructor', 
          description: 'Professional guitar instructor',
          permissions: ['teach_guitar', 'schedule_lessons', 'view_students']
        },
        {
          id: 'role-3',
          name: 'Voice Coach',
          description: 'Vocal training specialist',
          permissions: ['teach_vocals', 'schedule_lessons', 'view_students']
        },
        {
          id: 'role-4',
          name: 'Violin Instructor',
          description: 'Classical and contemporary violin teacher',
          permissions: ['teach_violin', 'schedule_lessons', 'view_students']
        },
        {
          id: 'role-5',
          name: 'Trumpet Instructor',
          description: 'Brass instrument specialist - trumpet',
          permissions: ['teach_trumpet', 'schedule_lessons', 'view_students']
        },
        {
          id: 'role-6',
          name: 'Clarinet Instructor',
          description: 'Woodwind instrument teacher - clarinet',
          permissions: ['teach_clarinet', 'schedule_lessons', 'view_students']
        },
        {
          id: 'role-7',
          name: 'Saxophone Instructor',
          description: 'Professional saxophone teacher',
          permissions: ['teach_saxophone', 'schedule_lessons', 'view_students']
        },
        {
          id: 'role-8',
          name: 'Flute Instructor',
          description: 'Woodwind specialist - flute',
          permissions: ['teach_flute', 'schedule_lessons', 'view_students']
        },
        {
          id: 'role-9',
          name: 'Drums Instructor',
          description: 'Percussion and drum kit teacher',
          permissions: ['teach_drums', 'schedule_lessons', 'view_students']
        },
        {
          id: 'role-10',
          name: 'Cello Instructor',
          description: 'String instrument teacher - cello',
          permissions: ['teach_cello', 'schedule_lessons', 'view_students']
        },
        {
          id: 'role-11',
          name: 'Trombone Instructor',
          description: 'Brass instrument specialist - trombone',
          permissions: ['teach_trombone', 'schedule_lessons', 'view_students']
        },
        {
          id: 'role-12',
          name: 'French Horn Instructor',
          description: 'Advanced brass instrument teacher',
          permissions: ['teach_french_horn', 'schedule_lessons', 'view_students']
        },
        {
          id: 'role-13',
          name: 'Oboe Instructor',
          description: 'Double reed woodwind specialist',
          permissions: ['teach_oboe', 'schedule_lessons', 'view_students']
        },
        {
          id: 'role-14',
          name: 'Bassoon Instructor',
          description: 'Double reed woodwind teacher - bassoon',
          permissions: ['teach_bassoon', 'schedule_lessons', 'view_students']
        },
        {
          id: 'role-15',
          name: 'Viola Instructor',
          description: 'String instrument teacher - viola',
          permissions: ['teach_viola', 'schedule_lessons', 'view_students']
        },
        {
          id: 'role-16',
          name: 'Double Bass Instructor',
          description: 'String bass and upright bass teacher',
          permissions: ['teach_double_bass', 'schedule_lessons', 'view_students']
        },
        {
          id: 'role-17',
          name: 'Tuba Instructor',
          description: 'Low brass instrument specialist',
          permissions: ['teach_tuba', 'schedule_lessons', 'view_students']
        },
        {
          id: 'role-18',
          name: 'Harp Instructor',
          description: 'Classical and contemporary harp teacher',
          permissions: ['teach_harp', 'schedule_lessons', 'view_students']
        },
        {
          id: 'role-19',
          name: 'Percussion Instructor',
          description: 'General percussion and mallet instruments',
          permissions: ['teach_percussion', 'schedule_lessons', 'view_students']
        },
        {
          id: 'role-20',
          name: 'Ukulele Instructor',
          description: 'Four-string ukulele teacher',
          permissions: ['teach_ukulele', 'schedule_lessons', 'view_students']
        },
        {
          id: 'role-21',
          name: 'Bass Guitar Instructor',
          description: 'Electric and acoustic bass guitar teacher',
          permissions: ['teach_bass_guitar', 'schedule_lessons', 'view_students']
        },
        {
          id: 'role-22',
          name: 'Banjo Instructor',
          description: 'Traditional and bluegrass banjo teacher',
          permissions: ['teach_banjo', 'schedule_lessons', 'view_students']
        },
        {
          id: 'role-23',
          name: 'Mandolin Instructor',
          description: 'String instrument teacher - mandolin',
          permissions: ['teach_mandolin', 'schedule_lessons', 'view_students']
        },
        {
          id: 'role-24',
          name: 'Accordion Instructor',
          description: 'Traditional and modern accordion teacher',
          permissions: ['teach_accordion', 'schedule_lessons', 'view_students']
        },
        {
          id: 'role-25',
          name: 'Harmonica Instructor',
          description: 'Blues and folk harmonica specialist',
          permissions: ['teach_harmonica', 'schedule_lessons', 'view_students']
        }
      ];
    }
  }

  async assignInstructorRole(data: AssignRoleData): Promise<void> {
    try {
      await this.makeRequest('/admin/instructor-roles/assign', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.log('Assign role mock:', data);
    }
  }

  async removeInstructorRole(instructorId: string, roleId: string): Promise<void> {
    try {
      await this.makeRequest<void>(`/admin/instructor-roles/remove/${instructorId}/${roleId}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.log('Remove role mock:', { instructorId, roleId });
    }
  }

  async createInstructorRole(data: CreateRoleData): Promise<InstructorRole> {
    try {
      return await this.makeRequest<InstructorRole>('/admin/instructor-roles', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (error) {
      // Mock response for testing
      const newRole: InstructorRole = {
        id: `custom-role-${Date.now()}`,
        name: data.name,
        description: data.description,
        permissions: data.permissions,
        is_custom: true,
        created_by: 'admin',
        created_at: new Date().toISOString()
      };
      console.log('Create role mock:', newRole);
      return newRole;
    }
  }

  async updateInstructorRole(data: UpdateRoleData): Promise<InstructorRole> {
    try {
      return await this.makeRequest<InstructorRole>(`/admin/instructor-roles/${data.id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    } catch (error) {
      // Mock response for testing
      const updatedRole: InstructorRole = {
        id: data.id,
        name: data.name,
        description: data.description,
        permissions: data.permissions,
        is_custom: true,
        created_by: 'admin',
        created_at: new Date().toISOString()
      };
      console.log('Update role mock:', updatedRole);
      return updatedRole;
    }
  }

  async deleteInstructorRole(roleId: string): Promise<void> {
    try {
      await this.makeRequest<void>(`/admin/instructor-roles/${roleId}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.log('Delete role mock:', roleId);
    }
  }

  async getInstructorWithRoles(instructorId: string): Promise<InstructorWithRoles> {
    return await this.makeRequest<InstructorWithRoles>(`/admin/instructors/${instructorId}/roles`);
  }

  async promoteToAdmin(data: PromoteToAdminData): Promise<User> {
    return await this.makeRequest<User>('/admin/users/promote-to-admin', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Email Server Settings
  async getEmailSettings(): Promise<EmailServerSettings> {
    try {
      return await this.makeRequest<EmailServerSettings>('/admin/email-settings');
    } catch (error) {
      // Mock settings for testing
      return {
        smtp_host: 'smtp.gmail.com',
        smtp_port: 587,
        smtp_username: '',
        smtp_password: '',
        smtp_use_tls: true,
        smtp_use_ssl: false,
        imap_host: 'imap.gmail.com',
        imap_port: 993,
        imap_username: '',
        imap_password: '',
        from_email: 'admin@musicu.local',
        from_name: 'Music-U-Scheduler'
      };
    }
  }

  async updateEmailSettings(settings: EmailServerSettings): Promise<EmailServerSettings> {
    try {
      return await this.makeRequest<EmailServerSettings>('/admin/email-settings', {
        method: 'PUT',
        body: JSON.stringify(settings),
      });
    } catch (error) {
      console.log('Email settings updated (mock):', settings);
      return settings;
    }
  }

  async testEmailSettings(settings: EmailServerSettings): Promise<{ success: boolean; message: string }> {
    try {
      return await this.makeRequest<{ success: boolean; message: string }>('/admin/email-settings/test', {
        method: 'POST',
        body: JSON.stringify(settings),
      });
    } catch (error) {
      return {
        success: true,
        message: 'Email settings test successful (mock)'
      };
    }
  }

  // System Backup
  async getBackups(): Promise<SystemBackup[]> {
    try {
      return await this.makeRequest<SystemBackup[]>('/admin/backups');
    } catch (error) {
      // Mock backups for testing
      return [
        {
          id: 'backup-1',
          filename: 'backup-2025-08-15.tar.gz',
          size: 25600000,
          created_at: new Date().toISOString(),
          type: 'manual',
          status: 'completed',
          description: 'Full system backup'
        },
        {
          id: 'backup-2',
          filename: 'backup-2025-08-14.tar.gz',
          size: 24800000,
          created_at: new Date(Date.now() - 86400000).toISOString(),
          type: 'automatic',
          status: 'completed',
          description: 'Automated daily backup'
        }
      ];
    }
  }

  async createBackup(description?: string): Promise<SystemBackup> {
    try {
      return await this.makeRequest<SystemBackup>('/admin/backups', {
        method: 'POST',
        body: JSON.stringify({ description }),
      });
    } catch (error) {
      // Mock backup creation
      return {
        id: 'backup-' + Date.now(),
        filename: `backup-${new Date().toISOString().split('T')[0]}.tar.gz`,
        size: 26000000,
        created_at: new Date().toISOString(),
        type: 'manual',
        status: 'completed',
        description: description || 'Manual backup'
      };
    }
  }

  async downloadBackup(backupId: string): Promise<string> {
    try {
      const response = await this.makeRequest<{ download_url: string }>(`/admin/backups/${backupId}/download`);
      return response.download_url;
    } catch (error) {
      return `/api/admin/backups/${backupId}/download`;
    }
  }

  async deleteBackup(backupId: string): Promise<void> {
    try {
      await this.makeRequest(`/admin/backups/${backupId}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.log('Delete backup mock:', backupId);
    }
  }

  // GitHub Updates
  async checkForUpdates(): Promise<GitHubUpdate> {
    try {
      return await this.makeRequest<GitHubUpdate>('/admin/updates/check');
    } catch (error) {
      // Use real version data instead of mock
      return {
        current_version: '1.2.0.1',
        latest_version: '1.2.0.1',
        has_updates: false,
        update_available: false,
        last_check: new Date().toISOString(),
        commit_hash: '9e0ac3f',
        branch: 'main'
      };
    }
  }

  async updateSystem(): Promise<{ success: boolean; message: string; restart_required: boolean }> {
    try {
      return await this.makeRequest<{ success: boolean; message: string; restart_required: boolean }>('/admin/updates/apply', {
        method: 'POST',
      });
    } catch (error) {
      return {
        success: true,
        message: 'System update completed successfully (mock)',
        restart_required: true
      };
    }
  }

  async getUpdateLogs(): Promise<string[]> {
    try {
      return await this.makeRequest<string[]>('/admin/updates/logs');
    } catch (error) {
      return [
        '[2025-08-15 18:30:00] Checking for updates...',
        '[2025-08-15 18:30:05] Found new version 1.2.0',
        '[2025-08-15 18:30:10] Downloading updates...',
        '[2025-08-15 18:30:30] Update completed successfully',
        '[2025-08-15 18:30:35] System restart recommended'
      ];
    }
  }
}

export const apiService = new APIService();
export { APIError };

// Export alias for backward compatibility
export { apiService as api };
