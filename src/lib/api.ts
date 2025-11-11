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
  private static initialized = false;

  static init() {
    if (typeof window !== 'undefined' && !this.initialized) {
      this.token = localStorage.getItem('admin_token');
      this.initialized = true;
    }
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
        this.initialized = true;
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
    if (!this.initialized) {
      this.init();
    }
    return this.token;
  }

  static logout() {
    this.token = null;
    this.initialized = false;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('admin_token');
    }
  }

  private static async makeRequest(endpoint: string, options: RequestInit = {}) {
    if (!BACKEND_URL) {
      throw new Error('Backend не настроен. Обратитесь к администратору.');
    }
    
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
    keyPrefix?: string;
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
  static async getAllBooks(params: {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
    ownerId?: string;
    isPublic?: boolean;
  } = {}) {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());
    if (params.search) searchParams.append('search', params.search);
    if (params.sortBy) searchParams.append('sortBy', params.sortBy);
    if (params.sortOrder) searchParams.append('sortOrder', params.sortOrder);
    if (params.ownerId) searchParams.append('ownerId', params.ownerId);
    if (params.isPublic !== undefined) searchParams.append('isPublic', params.isPublic.toString());

    const query = searchParams.toString();
    const endpoint = `/api/admin/books${query ? `?${query}` : ''}`;

    const response = await this.makeRequest(endpoint);
    return response.json();
  }

  // Export Data API
  static async exportData(format: 'csv' | 'json' | 'xlsx' = 'csv', dataType: 'all' | 'keys' | 'schools' | 'users' = 'all') {
    // Если запрошен XLSX, запрашиваем JSON у бэкенда для последующей обработки на фронтенде
    const requestFormat = format === 'xlsx' ? 'json' : format;
    const params = new URLSearchParams({ format: requestFormat, data: dataType });

    const response = await this.makeRequest(`/api/admin/export?${params}`, {
        headers: {
            // 'Content-Type' is not needed for this GET request, makeRequest will add it, but it's harmless
        }
    });

    if (!response.ok) {
      throw new Error('Export failed');
    }

    return response;
  }

  // Audit Logs API
  static async getAuditLogs(params: {
    page?: number;
    limit?: number;
    userId?: string;
    action?: string;
    entityType?: string;
    entityId?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
  } = {}) {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());
    if (params.userId) searchParams.append('userId', params.userId);
    if (params.action) searchParams.append('action', params.action);
    if (params.entityType) searchParams.append('entityType', params.entityType);
    if (params.entityId) searchParams.append('entityId', params.entityId);
    if (params.search) searchParams.append('search', params.search);
    if (params.startDate) searchParams.append('startDate', params.startDate);
    if (params.endDate) searchParams.append('endDate', params.endDate);

    const query = searchParams.toString();
    const endpoint = `/api/admin/audit-logs${query ? `?${query}` : ''}`;

    const response = await this.makeRequest(endpoint);
    return response.json();
  }

  static async getAuditStats(params: { startDate?: string; endDate?: string } = {}) {
    const searchParams = new URLSearchParams();
    if (params.startDate) searchParams.append('startDate', params.startDate);
    if (params.endDate) searchParams.append('endDate', params.endDate);

    const query = searchParams.toString();
    const endpoint = `/api/audit/stats${query ? `?${query}` : ''}`;

    const response = await this.makeRequest(endpoint);
    return response.json();
  }

  static async exportAuditLogs(params: {
    userId?: string;
    action?: string;
    entityType?: string;
    entityId?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
  } = {}) {
    const searchParams = new URLSearchParams();
    if (params.userId) searchParams.append('userId', params.userId);
    if (params.action) searchParams.append('action', params.action);
    if (params.entityType) searchParams.append('entityType', params.entityType);
    if (params.entityId) searchParams.append('entityId', params.entityId);
    if (params.search) searchParams.append('search', params.search);
    if (params.startDate) searchParams.append('startDate', params.startDate);
    if (params.endDate) searchParams.append('endDate', params.endDate);

    const query = searchParams.toString();
    const endpoint = `/api/audit/export${query ? `?${query}` : ''}`;
    
    const response = await this.makeRequest(endpoint, {
        headers: {
            // 'Content-Type' is not needed for this GET request
        }
    });

    if (!response.ok) {
      throw new Error('Export failed');
    }

    return response;
  }

}

export default ApiService;