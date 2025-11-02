import ApiService from '@/lib/api';
import { toast } from 'react-hot-toast';
import type { CreateKeyData, BulkCreateData, KeysResponse, RegistrationKey, KeyStatus } from '@/types/registrationKey';

// Error messages in Russian
const errorMessages = {
  networkError: 'Ошибка сети. Проверьте подключение к интернету.',
  unauthorized: 'Нет доступа. Войдите как администратор.',
  notFound: 'Ключ не найден.',
  createError: 'Не удалось создать ключ.',
  deleteError: 'Не удалось удалить ключ.',
  fetchError: 'Не удалось загрузить ключи.',
  created: 'Ключ успешно создан!',
  deleted: 'Ключ успешно удален!',
  bulkCreated: 'Ключи успешно созданы!',
  activated: 'Ключ активирован!',
  deactivated: 'Ключ деактивирован!',
  activateError: 'Не удалось активировать ключ',
  deactivateError: 'Не удалось деактивировать ключ',
  valid: 'Ключ действителен!',
  invalid: 'Ключ недействителен!'
};

// Handle API errors with proper messages
const handleApiError = (error: any, defaultMessage: string) => {
  if (error.message === 'Authentication required') {
    toast.error(errorMessages.unauthorized);
    return;
  }

  toast.error(defaultMessage);
  throw error;
};

/**
 * Create a single registration key
 */
export const createRegistrationKey = async (data: CreateKeyData): Promise<RegistrationKey> => {
  try {
    const response = await ApiService.createRegistrationKey(data);

    const key = response.data?.data || response.data;
    toast.success(errorMessages.created);

    return key;
  } catch (error) {
    handleApiError(error, errorMessages.createError);
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
    const response = await ApiService.getRegistrationKeys({
      page: params.page || 1,
      limit: params.limit || 10,
      status: params.status
    });

    const data = response;

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
    if (error.message === 'Authentication required') {
      handleApiError(error, errorMessages.unauthorized);
    }

    return {
      keys: [],
      total: 0,
      page: params.page || 1,
      limit: params.limit || 10
    };
  }
};

/**
 * Create multiple registration keys at once
 */
export const createBulkKeys = async (data: BulkCreateData): Promise<RegistrationKey[]> => {
  try {
    const response = await ApiService.createBulkRegistrationKeys(data);

    const keys = response.data?.data || response.data?.keys || response.data || [];
    toast.success(errorMessages.bulkCreated);

    return keys;
  } catch (error) {
    handleApiError(error, errorMessages.createError);
    throw error;
  }
};

/**
 * Get details of a specific registration key
 */
export const getKeyDetails = async (keyCode: string): Promise<RegistrationKey | null> => {
  try {
    const response = await ApiService.getRegistrationKey(keyCode);

    // Backend returns: { success: true, data: { keyInfo: {...} } }
    const key = response.data?.keyInfo || response.data?.data || response.data;

    return key;
  } catch (error: any) {
    if (error.message === 'Authentication required') {
      handleApiError(error, errorMessages.unauthorized);
      return null;
    }

    return null;
  }
};

/**
 * Delete a registration key
 */
export const deleteKey = async (keyCode: string): Promise<void> => {
  try {
    await ApiService.deleteRegistrationKey(keyCode);

    toast.success(errorMessages.deleted);
  } catch (error) {
    handleApiError(error, errorMessages.deleteError);
    throw error;
  }
};

/**
 * Activate a registration key
 */
export const activateKey = async (keyCode: string): Promise<RegistrationKey> => {
  try {
    // ApiService doesn't have activate endpoint, would need to add it
    throw new Error('Not implemented');
  } catch (error) {
    handleApiError(error, errorMessages.activateError);
    throw error;
  }
};

/**
 * Deactivate a registration key
 */
export const deactivateKey = async (keyCode: string): Promise<RegistrationKey> => {
  try {
    // ApiService doesn't have deactivate endpoint, would need to add it
    throw new Error('Not implemented');
  } catch (error) {
    handleApiError(error, errorMessages.deactivateError);
    throw error;
  }
};

/**
 * Get statistics for registration keys
 */
export const getKeyStatistics = async (): Promise<any> => {
  try {
    // ApiService doesn't have stats endpoint, would need to add it
    // Return default stats for now
    return {
      total: 0,
      active: 0,
      expired: 0,
      exhausted: 0,
      inactive: 0
    };
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
    // ApiService doesn't have validate endpoint, would need to add it
    toast.error('Функция валидации не реализована');
    return false;
  } catch (error: any) {
    toast.error(errorMessages.invalid);
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