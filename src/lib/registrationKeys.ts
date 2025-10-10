import { apiClient } from '../../../api/config';
import { toast } from 'react-hot-toast';
import type { CreateKeyData, BulkCreateData, KeysResponse, RegistrationKey, KeyStatus } from '../types';

// Error messages in multiple languages
const errorMessages = {
  networkError: {
    ru: 'Ошибка сети. Проверьте подключение к интернету.',
    kz: 'Желі қатесі. Интернет байланысын тексеріңіз.'
  },
  unauthorized: {
    ru: 'Нет доступа. Войдите как администратор.',
    kz: 'Қол жетімділік жоқ. Әкімші ретінде кіріңіз.'
  },
  notFound: {
    ru: 'Ключ не найден.',
    kz: 'Кілт табылмады.'
  },
  createError: {
    ru: 'Не удалось создать ключ.',
    kz: 'Кілт жасау мүмкін болмады.'
  },
  deleteError: {
    ru: 'Не удалось удалить ключ.',
    kz: 'Кілтті жою мүмкін болмады.'
  },
  fetchError: {
    ru: 'Не удалось загрузить ключи.',
    kz: 'Кілттерді жүктеу мүмкін болмады.'
  },
  success: {
    created: {
      ru: 'Ключ успешно создан!',
      kz: 'Кілт сәтті жасалды!'
    },
    deleted: {
      ru: 'Ключ успешно удален!',
      kz: 'Кілт сәтті жойылды!'
    },
    bulkCreated: {
      ru: 'Ключи успешно созданы!',
      kz: 'Кілттер сәтті жасалды!'
    }
  }
};

// Get current language from localStorage
const getLanguage = (): 'ru' | 'kz' => {
  const lang = localStorage.getItem('language');
  return (lang === 'kz' || lang === 'kk') ? 'kz' : 'ru';
};

// Get error message in current language
const getMessage = (path: string, defaultMessage: string = 'Error'): string => {
  const lang = getLanguage();
  const keys = path.split('.');
  let message: any = errorMessages;
  
  for (const key of keys) {
    message = message?.[key];
    if (!message) break;
  }
  
  return message?.[lang] || defaultMessage;
};

// Handle API errors with proper messages
const handleApiError = (error: any, defaultMessage: string) => {
  if (error.response) {
    switch (error.response.status) {
      case 400:
        const errorData = error.response.data;
        const details = errorData?.error?.details || [];

        let errorMsg = errorData?.error?.message || errorData?.message || defaultMessage;
        if (details.length > 0) {
          const detailMessages = details.map((d: any) => d.message || d).join(', ');
          errorMsg = `${errorMsg}: ${detailMessages}`;
        }
        toast.error(`Validation Error: ${errorMsg}`);
        break;
      case 401:
        toast.error(getMessage('unauthorized'));
        // Redirect to login if unauthorized
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
        break;
      case 403:
        toast.error(getMessage('unauthorized'));
        break;
      case 404:
        toast.error(getMessage('notFound'));
        break;
      default:
        toast.error(defaultMessage);
    }
  } else if (error.request) {
    toast.error(getMessage('networkError'));
  } else {
    toast.error(defaultMessage);
  }
  
  throw error;
};

/**
 * Create a single registration key
 */
export const createRegistrationKey = async (data: CreateKeyData): Promise<RegistrationKey> => {
  try {
    
    const response = await apiClient.post('/api/admin/registration-keys', data);
    
    const key = response.data?.data || response.data;
    toast.success(getMessage('success.created'));
    
    return key;
  } catch (error) {
    handleApiError(error, getMessage('createError'));
    throw error;
  }
};

/**
 * Get registration keys with pagination and filters
 */
export const getRegistrationKeys = async (params: {
  page?: number;
  limit?: number;
  status?: KeyStatus;
  keyCode?: string;
} = {}): Promise<KeysResponse> => {
  try {
    
    const response = await apiClient.get('/api/admin/registration-keys', {
      params: {
        page: params.page || 1,
        limit: params.limit || 10,
        ...params
      }
    });

    const data = response.data;

    // Handle different response structures
    let keys = data.keys || data.data || [];

    // If keys is an object instead of array, try to extract array from it
    if (keys && typeof keys === 'object' && !Array.isArray(keys)) {
      // Try common object properties that might contain the array
      keys = keys.keys || keys.data || keys.items || Object.values(keys);
    }

    // Ensure keys is an array
    if (!Array.isArray(keys)) {
      keys = [];
    }

    const keysResponse: KeysResponse = {
      keys: keys,
      total: data.total || keys.length || 0,
      page: data.page || params.page || 1,
      limit: data.limit || params.limit || 10
    };
    
    return keysResponse;
  } catch (error: any) {
    
    // Return empty response on error instead of throwing
    if (error.response?.status === 404 || error.response?.status === 403) {
      return {
        keys: [],
        total: 0,
        page: params.page || 1,
        limit: params.limit || 10
      };
    }
    
    handleApiError(error, getMessage('fetchError'));
    throw error;
  }
};

/**
 * Create multiple registration keys at once
 */
export const createBulkKeys = async (data: BulkCreateData): Promise<RegistrationKey[]> => {
  try {
    
    const response = await apiClient.post('/api/admin/registration-keys/bulk', data);
    
    const keys = response.data?.data || response.data?.keys || response.data || [];
    toast.success(getMessage('success.bulkCreated'));
    
    return keys;
  } catch (error) {
    handleApiError(error, getMessage('createError'));
    throw error;
  }
};

/**
 * Get details of a specific registration key
 */
export const getKeyDetails = async (keyCode: string): Promise<RegistrationKey | null> => {
  try {
    
    const response = await apiClient.get(`/api/admin/registration-keys/${keyCode}`);
    
    const key = response.data?.data || response.data;
    
    return key;
  } catch (error: any) {
    if (error.response?.status === 404) {
      return null;
    }
    
    handleApiError(error, getMessage('fetchError'));
    throw error;
  }
};

/**
 * Delete a registration key
 */
export const deleteKey = async (keyCode: string): Promise<void> => {
  try {
    
    await apiClient.delete(`/api/admin/registration-keys/${keyCode}`);
    
    toast.success(getMessage('success.deleted'));
  } catch (error) {
    handleApiError(error, getMessage('deleteError'));
    throw error;
  }
};

/**
 * Activate a registration key
 */
export const activateKey = async (keyCode: string): Promise<RegistrationKey> => {
  try {
    
    const response = await apiClient.put(`/api/admin/registration-keys/${keyCode}/activate`);
    
    const key = response.data?.data || response.data;
    toast.success(getLanguage() === 'kz' ? 'Кілт белсендірілді!' : 'Ключ активирован!');
    
    return key;
  } catch (error) {
    handleApiError(error, getLanguage() === 'kz' ? 'Кілтті белсендіру мүмкін болмады' : 'Не удалось активировать ключ');
    throw error;
  }
};

/**
 * Deactivate a registration key
 */
export const deactivateKey = async (keyCode: string): Promise<RegistrationKey> => {
  try {
    
    const response = await apiClient.put(`/api/admin/registration-keys/${keyCode}/deactivate`);
    
    const key = response.data?.data || response.data;
    toast.success(getLanguage() === 'kz' ? 'Кілт өшірілді!' : 'Ключ деактивирован!');
    
    return key;
  } catch (error) {
    handleApiError(error, getLanguage() === 'kz' ? 'Кілтті өшіру мүмкін болмады' : 'Не удалось деактивировать ключ');
    throw error;
  }
};

/**
 * Get statistics for registration keys
 */
export const getKeyStatistics = async (): Promise<any> => {
  try {
    
    const response = await apiClient.get('/api/admin/registration-keys/stats');
    
    const stats = response.data?.data || response.data;
    
    return stats;
  } catch (error: any) {
    
    // Return default stats on error
    return {
      total: 0,
      active: 0,
      expired: 0,
      exhausted: 0,
      inactive: 0
    };
  }
};

/**
 * Validate a registration key (for testing)
 */
export const validateKey = async (keyCode: string): Promise<boolean> => {
  try {
    
    const response = await apiClient.post('/api/auth/validate-key', {
      registrationKey: keyCode
    });
    
    const isValid = response.data?.valid || response.data?.success || false;
    
    if (isValid) {
      toast.success(getLanguage() === 'kz' ? 'Кілт жарамды!' : 'Ключ действителен!');
    } else {
      toast.error(getLanguage() === 'kz' ? 'Кілт жарамсыз!' : 'Ключ недействителен!');
    }
    
    return isValid;
  } catch (error: any) {
    if (error.response?.status === 400 || error.response?.status === 404) {
      toast.error(getLanguage() === 'kz' ? 'Кілт жарамсыз!' : 'Ключ недействителен!');
      return false;
    }
    
    handleApiError(error, getMessage('fetchError'));
    return false;
  }
};

// Export default object with all methods for convenience
export default {
  createRegistrationKey,
  getRegistrationKeys,
  createBulkKeys,
  getKeyDetails,
  deleteKey,
  activateKey,
  deactivateKey,
  getKeyStatistics,
  validateKey
};