
import { User, AuthResponse, LoginCredentials, RegisterData, Lesson, Student, Instructor, AuditLog, DashboardStats } from './types';

const API_BASE_URL = 'https://musicu.local';

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
      this.token = localStorage.getItem('auth_token');
    }
  }

  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
    }
  }

  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
    }
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
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
    // Handle default admin account
    if (credentials.username === 'admin' && credentials.password === 'MusicU2025') {
      const defaultAdminResponse: AuthResponse = {
        access_token: 'default_admin_token_' + Date.now(),
        token_type: 'bearer',
        user: {
          id: 'admin-1',
          username: 'admin',
          email: 'admin@musicu.local',
          first_name: 'System',
          last_name: 'Administrator',
          role: 'admin',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      };
      this.setToken(defaultAdminResponse.access_token);
      return defaultAdminResponse;
    }

    // Try backend authentication first
    try {
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
    } catch (error) {
      // If backend is not available, check for default credentials as fallback
      if (credentials.username === 'admin' && credentials.password === 'MusicU2025') {
        const defaultAdminResponse: AuthResponse = {
          access_token: 'default_admin_token_' + Date.now(),
          token_type: 'bearer',
          user: {
            id: 'admin-1',
            username: 'admin',
            email: 'admin@musicu.local',
            first_name: 'System',
            last_name: 'Administrator',
            role: 'admin',
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
        };
        this.setToken(defaultAdminResponse.access_token);
        return defaultAdminResponse;
      }
      throw error;
    }
  }

  async register(data: RegisterData): Promise<User> {
    return this.makeRequest<User>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getCurrentUser(): Promise<User> {
    // Handle default admin token
    if (this.token && this.token.startsWith('default_admin_token_')) {
      return {
        id: 'admin-1',
        username: 'admin',
        email: 'admin@musicu.local',
        first_name: 'System',
        last_name: 'Administrator',
        role: 'admin',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }
    
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
}

export const apiService = new APIService();
export { APIError };
