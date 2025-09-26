'use client';

import { useState, useEffect } from 'react';
import ApiService from '@/lib/api';
import { UserRole } from '@/lib/schema';

interface KeyDetails {
  id: string;
  keyCode: string;
  role: UserRole;
  description?: string | null;
  maxUses?: number;
  currentUses?: number;
  expiresAt?: string | Date | null;
  status: 'active' | 'expired' | 'exhausted' | 'inactive';
  createdAt?: string;
  updatedAt?: string;
  isActive: boolean;
  usesRemaining?: number;
}

interface KeyDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  keyCode: string;
}

export default function KeyDetailsModal({ isOpen, onClose, keyCode }: KeyDetailsModalProps) {
  const [keyDetails, setKeyDetails] = useState<KeyDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const roles: { value: UserRole; label: string; color: string }[] = [
    { value: 'admin', label: 'Администратор', color: 'bg-red-100 text-red-800' },
    { value: 'moderator', label: 'Модератор', color: 'bg-orange-100 text-orange-800' },
    { value: 'author', label: 'Автор', color: 'bg-purple-100 text-purple-800' },
    { value: 'school', label: 'Школа', color: 'bg-blue-100 text-blue-800' },
    { value: 'teacher', label: 'Учитель', color: 'bg-green-100 text-green-800' },
    { value: 'student', label: 'Ученик', color: 'bg-gray-100 text-gray-800' },
  ];

  useEffect(() => {
    if (isOpen && keyCode) {
      fetchKeyDetails();
    }
  }, [isOpen, keyCode]);

  const fetchKeyDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await ApiService.getRegistrationKey(keyCode);
      if (result.success) {
        // Данные приходят в result.data.keyInfo
        setKeyDetails(result.data.keyInfo);
      } else {
        setError(result.error?.message || 'Ошибка при загрузке данных ключа');
      }
    } catch (error) {
      console.error('Error fetching key details:', error);
      setError('Ошибка при загрузке данных ключа');
    } finally {
      setLoading(false);
    }
  };

  const getRoleInfo = (role: UserRole) => {
    return roles.find(r => r.value === role) || { label: role, color: 'bg-gray-100 text-gray-800' };
  };

  const formatDate = (dateString: string | Date | null | undefined) => {
    if (!dateString) return 'Не указано';
    return new Date(dateString).toLocaleString('ru-RU');
  };

  const getStatusInfo = (status: string, isActive: boolean) => {
    if (!isActive) {
      return { label: 'Неактивен', color: 'bg-red-100 text-red-800' };
    }

    switch (status) {
      case 'active':
        return { label: 'Активен', color: 'bg-green-100 text-green-800' };
      case 'expired':
        return { label: 'Истек', color: 'bg-yellow-100 text-yellow-800' };
      case 'exhausted':
        return { label: 'Исчерпан', color: 'bg-orange-100 text-orange-800' };
      default:
        return { label: 'Неизвестен', color: 'bg-gray-100 text-gray-800' };
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Детали ключа</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {loading && (
          <div className="text-center py-8">
            <div className="text-gray-600">Загрузка...</div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
            <div className="text-red-600">{error}</div>
          </div>
        )}

        {keyDetails && (
          <div className="space-y-6">
            {/* Основная информация */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Основная информация</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Код ключа</dt>
                  <dd className="mt-1 text-sm font-mono text-gray-900 bg-white px-3 py-2 rounded border break-all">
                    {keyDetails.keyCode}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Роль</dt>
                  <dd className="mt-1">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleInfo(keyDetails.role).color}`}>
                      {getRoleInfo(keyDetails.role).label}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Статус</dt>
                  <dd className="mt-1">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusInfo(keyDetails.status, keyDetails.isActive).color}`}>
                      {getStatusInfo(keyDetails.status, keyDetails.isActive).label}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">ID</dt>
                  <dd className="mt-1 text-sm font-mono text-gray-900">{keyDetails.id}</dd>
                </div>
              </div>
            </div>

            {/* Использование */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Использование</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Текущих использований</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    <span className="text-lg font-semibold">{keyDetails.currentUses || 0}</span>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Максимум использований</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    <span className="text-lg font-semibold">{keyDetails.maxUses || 'Без ограничений'}</span>
                  </dd>
                </div>
                {keyDetails.usesRemaining !== undefined && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Осталось использований</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      <span className="text-lg font-semibold text-green-600">{keyDetails.usesRemaining}</span>
                    </dd>
                  </div>
                )}
                <div className="md:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Прогресс использования</dt>
                  <dd className="mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{
                          width: keyDetails.maxUses
                            ? `${Math.min((keyDetails.currentUses || 0) / keyDetails.maxUses * 100, 100)}%`
                            : '0%'
                        }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {keyDetails.maxUses
                        ? `${keyDetails.currentUses || 0} из ${keyDetails.maxUses} использований`
                        : 'Без ограничений по использованию'
                      }
                    </div>
                  </dd>
                </div>
              </div>
            </div>

            {/* Дополнительная информация */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Дополнительная информация</h3>
              <div className="space-y-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Описание</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {keyDetails.description || '-'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Срок действия</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {keyDetails.expiresAt ? formatDate(keyDetails.expiresAt) : 'Без ограничений'}
                  </dd>
                </div>
                {keyDetails.createdAt && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Создан</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {formatDate(keyDetails.createdAt)}
                    </dd>
                  </div>
                )}
                {keyDetails.updatedAt && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Обновлен</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {formatDate(keyDetails.updatedAt)}
                    </dd>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
}