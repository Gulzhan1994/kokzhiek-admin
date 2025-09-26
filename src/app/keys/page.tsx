'use client';

import { useState, useEffect } from 'react';
import { UserRole } from '@/lib/schema';
import ApiService from '@/lib/api';
import AuthWrapper, { useAuth } from '@/components/AuthWrapper';
import SuccessModal from '@/components/SuccessModal';
import DeleteConfirmModal from '@/components/DeleteConfirmModal';
import KeyDetailsModal from '@/components/KeyDetailsModal';
import Pagination from '@/components/Pagination';

interface RegistrationKey {
  id: string;
  keyCode: string;
  role: UserRole;
  description?: string;
  maxUses?: number;
  currentUses?: number;
  expiresAt?: string | Date | null;
  status: 'active' | 'expired' | 'exhausted' | 'inactive';
}

interface KeyFormData {
  role: UserRole;
  count: number;
  description: string;
  maxUses: number;
  expiresAt: string;
  keyPrefix: string;
}

function KeysManagement() {
  const { logout } = useAuth();
  const [keys, setKeys] = useState<RegistrationKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdKeyInfo, setCreatedKeyInfo] = useState<{ keyCode: string; message: string; count: number } | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [keyToDelete, setKeyToDelete] = useState<string | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [keyToView, setKeyToView] = useState<string | null>(null);

  // Пагинация
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalKeys, setTotalKeys] = useState(0);
  const [pageSize] = useState(20); // Ключей на странице
  const [formData, setFormData] = useState<KeyFormData>({
    role: 'student',
    count: 1,
    description: '',
    maxUses: 1,
    expiresAt: '',
    keyPrefix: '',
  });

  const roles: { value: UserRole; label: string; color: string }[] = [
    { value: 'admin', label: 'Администратор', color: 'bg-red-100 text-red-800' },
    { value: 'moderator', label: 'Модератор', color: 'bg-orange-100 text-orange-800' },
    { value: 'author', label: 'Автор', color: 'bg-purple-100 text-purple-800' },
    { value: 'school', label: 'Школа', color: 'bg-blue-100 text-blue-800' },
    { value: 'teacher', label: 'Учитель', color: 'bg-green-100 text-green-800' },
    { value: 'student', label: 'Ученик', color: 'bg-gray-100 text-gray-800' },
  ];

  useEffect(() => {
    fetchKeys();
  }, [currentPage]);

  const fetchKeys = async () => {
    try {
      const result = await ApiService.getRegistrationKeys({
        page: currentPage,
        limit: pageSize
      });
      if (result.success) {
        setKeys(result.data.keys || []);
        setTotalPages(result.data.totalPages || 1);
        setTotalKeys(result.data.total || 0);
      } else {
        console.error('Error fetching keys:', result.error);
        if (result.error?.code === 'UNAUTHORIZED') {
          logout();
        }
      }
    } catch (error) {
      console.error('Error fetching keys:', error);
      if (error instanceof Error && error.message === 'Authentication required') {
        logout();
      }
    } finally {
      setLoading(false);
    }
  };

  const createKeys = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    try {
      const data = {
        role: formData.role,
        count: formData.count,
        description: formData.description || undefined,
        maxUses: formData.maxUses,
        expiresAt: formData.expiresAt ? new Date(formData.expiresAt + 'T23:59:59.999Z').toISOString() : undefined,
        keyPrefix: formData.keyPrefix || undefined,
      };

      let result;
      if (formData.count > 1) {
        result = await ApiService.createBulkRegistrationKeys(data);
      } else {
        result = await ApiService.createRegistrationKey(data);
      }

      if (result.success) {
        // Извлекаем информацию о созданном ключе
        let keyCode = '';
        if (formData.count === 1 && result.data?.keyInfo?.keyCode) {
          keyCode = result.data.keyInfo.keyCode;
        }

        setCreatedKeyInfo({
          keyCode: keyCode,
          message: formData.count === 1
            ? 'Ключ успешно создан!'
            : `Создано ${formData.count} ключей успешно!`,
          count: formData.count
        });
        setShowSuccessModal(true);
        fetchKeys();
        setFormData({
          role: 'student',
          count: 1,
          description: '',
          maxUses: 1,
          expiresAt: '',
          keyPrefix: '',
        });
      } else {
        alert('Ошибка при создании ключей: ' + (result.error?.message || JSON.stringify(result.error)));
      }
    } catch (error) {
      console.error('Error creating keys:', error);
      if (error instanceof Error && error.message === 'Authentication required') {
        logout();
      } else {
        alert('Ошибка при создании ключей');
      }
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteClick = (keyCode: string) => {
    setKeyToDelete(keyCode);
    setShowDeleteModal(true);
  };

  const handleDetailsClick = (keyCode: string) => {
    setKeyToView(keyCode);
    setShowDetailsModal(true);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setLoading(true);
  };

  const confirmDelete = async () => {
    if (!keyToDelete) return;

    console.log('Attempting to deactivate key:', keyToDelete);

    try {
      const result = await ApiService.deleteRegistrationKey(keyToDelete);
      console.log('Deactivation result:', result);

      if (result.success) {
        fetchKeys();
        setShowDeleteModal(false);
      } else {
        console.error('Deletion failed:', result.error);
        alert('Ошибка при удалении ключа: ' + (result.error?.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error deactivating key:', error);
      if (error instanceof Error && error.message === 'Authentication required') {
        logout();
      } else {
        alert('Ошибка при деактивации ключа');
      }
    } finally {
      setKeyToDelete(null);
    }
  };

  const getRoleInfo = (role: UserRole) => {
    return roles.find(r => r.value === role) || { label: role, color: 'bg-gray-100 text-gray-800' };
  };

  const formatDate = (dateString: string | Date | null | undefined) => {
    if (!dateString) return 'Без ограничений';
    return new Date(dateString).toLocaleDateString('ru-RU');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center">Загрузка...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Управление регистрационными ключами
        </h1>
        <p className="text-gray-600">
          Создавайте и управляйте ключами для регистрации пользователей разных ролей
        </p>
      </div>

        {/* Form для создания ключей */}
        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Создать новые ключи</h2>
          <form onSubmit={createKeys} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Роль
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {roles.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Количество
              </label>
              <input
                type="number"
                min="1"
                max="1000"
                value={formData.count}
                onChange={(e) => setFormData({ ...formData, count: parseInt(e.target.value) || 1 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Макс. использований
              </label>
              <input
                type="number"
                min="1"
                value={formData.maxUses}
                onChange={(e) => setFormData({ ...formData, maxUses: parseInt(e.target.value) || 1 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Срок действия
              </label>
              <input
                type="date"
                value={formData.expiresAt}
                onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Описание
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Описание для группы ключей"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Префикс ключа
              </label>
              <input
                type="text"
                value={formData.keyPrefix}
                onChange={(e) => setFormData({ ...formData, keyPrefix: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Например: SCHOOL01"
              />
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                disabled={creating}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {creating ? 'Создание...' : 'Создать ключи'}
              </button>
            </div>
          </form>
        </div>

        {/* Список ключей */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold">
              Все ключи ({totalKeys})
              {totalPages > 1 && (
                <span className="text-sm text-gray-500 font-normal ml-2">
                  Страница {currentPage} из {totalPages}
                </span>
              )}
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ключ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Роль
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Использования
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Срок действия
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Описание
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Действия
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {keys.map((key) => {
                  const roleInfo = getRoleInfo(key.role);
                  return (
                    <tr key={key.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                        {key.keyCode}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${roleInfo.color}`}>
                          {roleInfo.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {key.currentUses} / {key.maxUses}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(key.expiresAt)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {key.description || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-3">
                          <button
                            onClick={() => handleDetailsClick(key.keyCode)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Подробнее
                          </button>
                          <button
                            onClick={() => handleDeleteClick(key.keyCode)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Удалить
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {keys.length === 0 && !loading && (
              <div className="text-center py-8 text-gray-500">
                Ключи не найдены. Создайте первый ключ выше.
              </div>
            )}
          </div>

          {/* Пагинация */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            isLoading={loading}
          />
        </div>

      {/* Success Modal */}
      {createdKeyInfo && (
        <SuccessModal
          isOpen={showSuccessModal}
          onClose={() => setShowSuccessModal(false)}
          title="Успешно!"
          message={createdKeyInfo.message}
          keyCode={createdKeyInfo.keyCode}
        />
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setKeyToDelete(null);
        }}
        onConfirm={confirmDelete}
        title="Удалить регистрационный ключ"
        message={`Вы уверены, что хотите удалить ключ "${keyToDelete}"? Это действие необратимо.`}
        confirmText="Удалить"
        cancelText="Отмена"
      />

      {/* Key Details Modal */}
      {keyToView && (
        <KeyDetailsModal
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setKeyToView(null);
          }}
          keyCode={keyToView}
        />
      )}
    </div>
  );
}

export default function KeysPage() {
  return (
    <AuthWrapper>
      <KeysManagement />
    </AuthWrapper>
  );
}