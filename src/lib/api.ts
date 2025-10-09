// Автоматическое определение backend URL в зависимости от окружения
const getBackendUrl = () => {
  // В продакшене (Vercel)
  if (process.env.NODE_ENV === 'production') {
    // Пытаемся использовать переменную окружения, если есть
    if (process.env.NEXT_PUBLIC_BACKEND_URL && process.env.NEXT_PUBLIC_BACKEND_URL !== 'http://localhost:3000') {
      return process.env.NEXT_PUBLIC_BACKEND_URL;
    }
    // Если нет валидного backend URL в продакшене, показываем ошибку
    console.warn('⚠️ Backend URL не настроен для продакшена');
    return null;
  }

  // В разработке используем localhost
  return process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';
};

const BACKEND_URL = getBackendUrl();

// Temporary simple auth - in production should use proper JWT handling
class ApiService {
  private static token: string | null = null;

  // Универсальный метод для API вызовов с проверкой backend URL
  private static async apiCall(endpoint: string, options: RequestInit = {}): Promise<Response> {
    if (!BACKEND_URL) {
      throw new Error('Backend не настроен. Обратитесь к администратору.');
    }

    const url = `${BACKEND_URL}${endpoint}`;
    const defaultHeaders = {
      'Content-Type': 'application/json',
      ...(this.token && { 'Authorization': `Bearer ${this.token}` }),
    };

    return fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    });
  }

  static async login(email: string, password: string): Promise<{ success: boolean; token?: string; error?: string }> {
    // Проверяем доступность backend URL
    if (!BACKEND_URL) {
      return {
        success: false,
        error: 'Backend не настроен. Обратитесь к администратору.'
      };
    }

    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success && data.data?.token) {
        this.token = data.data.token;
        // Store in localStorage for persistence
        if (typeof window !== 'undefined') {
          localStorage.setItem('admin_token', data.data.token);
        }
        return { success: true, token: data.data.token };
      }

      return { success: false, error: data.error?.message || 'Login failed' };
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  }

  static getToken(): string | null {
    if (this.token) return this.token;

    // Try to get from localStorage
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('admin_token');
    }

    return this.token;
  }

  static logout() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('admin_token');
    }
  }

  private static async makeRequest(endpoint: string, options: RequestInit = {}) {
    const token = this.getToken();

    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
      },
    };

    const response = await fetch(`${BACKEND_URL}${endpoint}`, config);

    if (response.status === 401) {
      // Token expired or invalid
      this.logout();
      throw new Error('Authentication required');
    }

    return response;
  }

  // Registration Keys API
  static async getRegistrationKeys(params: { page?: number; limit?: number; status?: string } = {}) {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());
    if (params.status) searchParams.append('status', params.status);

    const query = searchParams.toString();
    const endpoint = `/api/admin/registration-keys${query ? `?${query}` : ''}`;

    const response = await this.makeRequest(endpoint);
    return response.json();
  }

  static async createRegistrationKey(data: {
    role: string;
    description?: string;
    maxUses?: number;
    expiresAt?: string;
  }) {
    const response = await this.makeRequest('/api/admin/registration-keys', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.json();
  }

  static async createBulkRegistrationKeys(data: {
    role: string;
    count: number;
    description?: string;
    maxUses?: number;
    expiresAt?: string;
    keyPrefix?: string;
  }) {
    const response = await this.makeRequest('/api/admin/registration-keys/bulk', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.json();
  }

  static async getRegistrationKey(keyCode: string) {
    const response = await this.makeRequest(`/api/admin/registration-keys/${keyCode}`);
    return response.json();
  }

  static async deleteRegistrationKey(keyCode: string) {
    const response = await this.makeRequest(`/api/admin/registration-keys/${keyCode}`, {
      method: 'DELETE',
    });
    return response.json();
  }

  // Schools API
  static async getSchools() {
    const response = await this.makeRequest('/api/admin/schools');
    return response.json();
  }

  static async getSchoolUsers(schoolId: string) {
    const response = await this.makeRequest(`/api/admin/schools/${schoolId}/users`);
    return response.json();
  }

  // User Management API
  static async assignStudent(studentId: string, teacherId: string) {
    const response = await this.makeRequest('/api/admin/assign-student', {
      method: 'POST',
      body: JSON.stringify({ studentId, teacherId }),
    });
    return response.json();
  }

  // Dashboard Statistics API
  static async getDashboardStats() {
    const response = await this.makeRequest('/api/admin/dashboard/stats');
    return response.json();
  }

  // Books API
  static async getAllBooks(params: { page?: number; limit?: number; search?: string } = {}) {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());
    if (params.search) searchParams.append('search', params.search);

    const query = searchParams.toString();
    const endpoint = `/api/admin/books${query ? `?${query}` : ''}`;

    const response = await this.makeRequest(endpoint);
    return response.json();
  }

  // Export Data API
  static async exportData(format: 'csv' | 'json' = 'csv', dataType: 'all' | 'keys' | 'schools' | 'users' = 'all') {
    const token = this.getToken();
    const params = new URLSearchParams({ format, data: dataType });

    const response = await fetch(`${BACKEND_URL}/api/admin/export?${params}`, {
      headers: {
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
    });

    if (response.status === 401) {
      this.logout();
      throw new Error('Authentication required');
    }

    if (!response.ok) {
      throw new Error('Export failed');
    }

    return response;
  }
}

export default ApiService;