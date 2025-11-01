'use client';

import React, { useEffect, useState } from 'react';
import { Plus, Search, Download, Copy, Eye, EyeOff, Trash2, X, CheckCircle, XCircle, Clock } from 'lucide-react';
import AuthWrapper, { useAuth } from '@/components/AuthWrapper';
import ApiService from '@/lib/api';
import toast from 'react-hot-toast';

interface ApiKey {
  id: string;
  name: string;
  key: string;
  keyPrefix?: string;
  organizationId?: string;
  organizationName?: string;
  permissions: string[];
  isActive: boolean;
  createdAt: string;
  expiresAt: string | null;
  usageCount: number;
  maxUses?: number;
  lastUsedAt?: string | null;
}

function KeysManagement() {
  const { logout } = useAuth();
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [filteredKeys, setFilteredKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive' | 'expired'>('all');
  const [selectedOrg, setSelectedOrg] = useState<string>('all');
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());

  // Modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showBulkResultsModal, setShowBulkResultsModal] = useState(false);
  const [selectedKey, setSelectedKey] = useState<ApiKey | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [creationMode, setCreationMode] = useState<'single' | 'bulk'>('single');
  const [bulkCreatedKeys, setBulkCreatedKeys] = useState<string[]>([]);

  // Create key form state
  const [newKeyForm, setNewKeyForm] = useState({
    name: '',
    organizationName: '',
    permissions: [] as string[],
    expiresAt: '',
    count: 1,
    keyPrefix: '',
  });

  useEffect(() => {
    loadApiKeys();
  }, []);

  useEffect(() => {
    filterKeys();
  }, [keys, searchQuery, filterStatus, selectedOrg]);

  const loadApiKeys = async () => {
    try {
      setLoading(true);
      const result = await ApiService.getRegistrationKeys();

      if (result.success && result.data) {
        // Convert registration keys to ApiKey format
        const convertedKeys = result.data.keys?.map((key: any) => ({
          id: key.id,
          name: key.description || `Ключ ${key.role}`,
          key: key.keyCode,
          keyPrefix: key.keyPrefix,
          organizationId: key.organizationId,
          organizationName: key.organizationName,
          permissions: [key.role], // role as permission
          isActive: key.isActive && key.status === 'active',
          createdAt: key.createdAt || new Date().toISOString(),
          expiresAt: key.expiresAt,
          usageCount: key.currentUses || key.usedCount || 0,
          maxUses: key.maxUses,
          lastUsedAt: key.lastUsedAt || null,
        })) || [];

        setKeys(convertedKeys);
        setFilteredKeys(convertedKeys);
      } else {
        console.error('Error fetching registration keys:', result.error);
        if (result.error?.code === 'UNAUTHORIZED') {
          logout();
        } else {
          toast.error(result.error?.message || 'Ошибка загрузки ключей');
        }
      }
    } catch (error) {
      console.error('Error fetching registration keys:', error);
      if (error instanceof Error && error.message === 'Authentication required') {
        logout();
      } else {
        toast.error('Ошибка загрузки ключей');
      }
    } finally {
      setLoading(false);
    }
  };

  const filterKeys = () => {
    let filtered = [...keys];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(key =>
        key.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        key.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
        key.organizationName?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Status filter
    if (filterStatus !== 'all') {
      const now = new Date();
      filtered = filtered.filter(key => {
        const isExpired = key.expiresAt && new Date(key.expiresAt) < now;
        if (filterStatus === 'active') return key.isActive && !isExpired;
        if (filterStatus === 'inactive') return !key.isActive;
        if (filterStatus === 'expired') return isExpired;
        return true;
      });
    }

    // Organization filter
    if (selectedOrg !== 'all') {
      filtered = filtered.filter(key => key.organizationName === selectedOrg);
    }

    setFilteredKeys(filtered);
  };

  const handleDeleteClick = (key: ApiKey) => {
    setSelectedKey(key);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!selectedKey) return;

    try {
      setIsDeleting(true);
      const result = await ApiService.deleteRegistrationKey(selectedKey.key); // Use keyCode instead of id

      if (result.success) {
        toast.success('Ключ успешно удален');

        // Небольшая задержка перед закрытием модалки
        await new Promise(resolve => setTimeout(resolve, 300));

        setShowDeleteModal(false);
        setSelectedKey(null);
        await loadApiKeys();
      } else {
        toast.error(result.error?.message || 'Ошибка удаления ключа');
      }
    } catch (error) {
      console.error('Error deleting key:', error);
      if (error instanceof Error && error.message === 'Authentication required') {
        logout();
      } else {
        toast.error('Ошибка удаления ключа');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCreateKey = async () => {
    if (!newKeyForm.name) {
      toast.error('Введите описание ключа');
      return;
    }

    if (newKeyForm.permissions.length === 0) {
      toast.error('Выберите роль для ключа');
      return;
    }

    if (creationMode === 'bulk' && newKeyForm.count < 1) {
      toast.error('Количество ключей должно быть больше 0');
      return;
    }

    try {
      setIsCreating(true);

      // Registration keys API expects role (not permissions array)
      const role = newKeyForm.permissions[0]; // Use first permission as role

      // Convert date to ISO datetime format if provided
      let expiresAtISO: string | undefined;
      if (newKeyForm.expiresAt) {
        // Add time to make it end of day in ISO format
        const date = new Date(newKeyForm.expiresAt + 'T23:59:59.999Z');
        expiresAtISO = date.toISOString();
      }

      if (creationMode === 'bulk') {
        // Bulk creation
        const result = await ApiService.createBulkRegistrationKeys({
          role,
          count: newKeyForm.count,
          description: newKeyForm.name,
          maxUses: 1,
          expiresAt: expiresAtISO,
          keyPrefix: newKeyForm.keyPrefix || undefined,
        });

        if (result.success && result.data?.keys) {
          const keyCodes = result.data.keys.map((k: any) => {
            return k.keyCode || k.key || k.code || k.registrationKey;
          });
          setBulkCreatedKeys(keyCodes);

          toast.success(`Успешно создано ${keyCodes.length} ключей!`);

          // Небольшая задержка перед закрытием модалки
          await new Promise(resolve => setTimeout(resolve, 500));

          setShowCreateModal(false);
          setShowBulkResultsModal(true);
          setNewKeyForm({
            name: '',
            organizationName: '',
            permissions: [],
            expiresAt: '',
            count: 1,
            keyPrefix: '',
          });
          setCreationMode('single');
          await loadApiKeys();
        } else {
          toast.error(result.error?.message || 'Ошибка создания ключей');
        }
      } else {
        // Single creation
        const result = await ApiService.createRegistrationKey({
          role,
          description: newKeyForm.name,
          maxUses: 1, // Default to single use
          expiresAt: expiresAtISO,
          keyPrefix: newKeyForm.keyPrefix || undefined,
        });

        if (result.success && result.data?.keyInfo) {
          toast.success('Ключ успешно создан!');

          // Copy to clipboard
          await navigator.clipboard.writeText(result.data.keyInfo.keyCode);
          toast.success('Ключ скопирован в буфер обмена');

          // Небольшая задержка перед закрытием модалки
          await new Promise(resolve => setTimeout(resolve, 500));

          setShowCreateModal(false);
          setNewKeyForm({
            name: '',
            organizationName: '',
            permissions: [],
            expiresAt: '',
            count: 1,
            keyPrefix: '',
          });
          await loadApiKeys();
        } else {
          toast.error(result.error?.message || 'Ошибка создания ключа');
        }
      }
    } catch (error) {
      console.error('Error creating key:', error);
      if (error instanceof Error && error.message === 'Authentication required') {
        logout();
      } else {
        toast.error('Ошибка создания ключа');
      }
    } finally {
      setIsCreating(false);
    }
  };

  const exportKeys = () => {
    // Use tab as delimiter for Excel compatibility
    const delimiter = '\t';

    // Build CSV content
    let csvContent = '';

    // Add headers
    csvContent += ['Название', 'Организация', 'Разрешения', 'Статус', 'Создан', 'Истекает', 'Использований'].join(delimiter) + '\n';

    // Add data rows
    csvContent += filteredKeys.map(key => {
      const escapeValue = (val: string | number) => {
        const stringVal = String(val);
        // For tab-delimited, we need to escape tabs and newlines
        return stringVal.replace(/\t/g, ' ').replace(/\n/g, ' ').replace(/\r/g, '');
      };

      return [
        escapeValue(key.name),
        escapeValue(key.organizationName || '-'),
        escapeValue(key.permissions.join(', ')),
        escapeValue(key.isActive ? 'Да' : 'Нет'),
        escapeValue(new Date(key.createdAt).toLocaleDateString('ru-RU')),
        escapeValue(key.expiresAt ? new Date(key.expiresAt).toLocaleDateString('ru-RU') : 'Никогда'),
        escapeValue(key.usageCount)
      ].join(delimiter);
    }).join('\n');

    // Create UTF-16LE BOM (0xFF, 0xFE)
    const BOM = new Uint8Array([0xFF, 0xFE]);

    // Encode content as UTF-16LE
    const utf16Content = new Uint16Array(csvContent.length);
    for (let i = 0; i < csvContent.length; i++) {
      utf16Content[i] = csvContent.charCodeAt(i);
    }

    // Convert to bytes (little-endian)
    const contentBytes = new Uint8Array(utf16Content.buffer);

    // Combine BOM + content
    const combined = new Uint8Array(BOM.length + contentBytes.length);
    combined.set(BOM, 0);
    combined.set(contentBytes, BOM.length);

    const blob = new Blob([combined], { type: 'text/csv; charset=utf-16le' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `registration-keys-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Данные экспортированы');
  };

  const toggleKeyVisibility = (keyId: string) => {
    setVisibleKeys(prev => {
      const newSet = new Set(prev);
      if (newSet.has(keyId)) {
        newSet.delete(keyId);
      } else {
        newSet.add(keyId);
      }
      return newSet;
    });
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} скопирован в буфер обмена`);
    } catch (error) {
      toast.error('Ошибка копирования');
    }
  };

  const maskApiKey = (key: string): string => {
    if (key.length <= 12) return key;
    const start = key.substring(0, 8);
    const end = key.substring(key.length - 4);
    return `${start}...${end}`;
  };

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusIcon = (apiKey: ApiKey) => {
    const now = new Date();
    const expiresAt = apiKey.expiresAt ? new Date(apiKey.expiresAt) : null;

    if (!apiKey.isActive) {
      return <XCircle className="w-4 h-4 text-gray-500" />;
    }

    if (expiresAt && expiresAt < now) {
      return <Clock className="w-4 h-4 text-red-500" />;
    }

    if (apiKey.maxUses && apiKey.usageCount >= apiKey.maxUses) {
      return <XCircle className="w-4 h-4 text-orange-500" />;
    }

    return <CheckCircle className="w-4 h-4 text-green-500" />;
  };

  const getStatusText = (apiKey: ApiKey): { text: string; color: string } => {
    const now = new Date();
    const expiresAt = apiKey.expiresAt ? new Date(apiKey.expiresAt) : null;

    if (!apiKey.isActive) {
      return { text: 'Неактивен', color: 'text-gray-600' };
    }

    if (expiresAt && expiresAt < now) {
      return { text: 'Истек', color: 'text-red-600' };
    }

    if (apiKey.maxUses && apiKey.usageCount >= apiKey.maxUses) {
      return { text: 'Исчерпан', color: 'text-orange-600' };
    }

    return { text: 'Активен', color: 'text-green-600' };
  };

  const getRoleBadgeColor = (role: string) => {
    const colors: Record<string, string> = {
      admin: 'bg-red-100 text-red-800',
      author: 'bg-purple-100 text-purple-800',
      teacher: 'bg-blue-100 text-blue-800',
      student: 'bg-green-100 text-green-800',
      school: 'bg-yellow-100 text-yellow-800',
      moderator: 'bg-orange-100 text-orange-800',
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  const getRoleDisplayName = (role: string) => {
    const roleMap: Record<string, string> = {
      admin: 'Администратор',
      author: 'Автор',
      teacher: 'Учитель',
      student: 'Ученик',
      school: 'Школа',
      moderator: 'Модератор',
    };
    return roleMap[role] || 'Ученик';
  };

  const getPermissionBadges = (permissions: string[]) => {
    return (
      <div className="flex flex-wrap gap-1">
        {permissions.map((permission, index) => (
          <span
            key={index}
            className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadgeColor(permission)}`}
          >
            {getRoleDisplayName(permission)}
          </span>
        ))}
      </div>
    );
  };

  const getStatusBadge = (isActive: boolean, expiresAt: string | null) => {
    const now = new Date();
    const expiration = expiresAt ? new Date(expiresAt) : null;
    const isExpired = expiration && expiration < now;

    let statusText = 'Активен';
    let statusColor = 'text-green-600';
    let icon = <CheckCircle className="w-4 h-4 text-green-500" />;

    if (!isActive) {
      statusText = 'Неактивен';
      statusColor = 'text-gray-600';
      icon = <XCircle className="w-4 h-4 text-gray-500" />;
    } else if (isExpired) {
      statusText = 'Истек';
      statusColor = 'text-red-600';
      icon = <Clock className="w-4 h-4 text-red-500" />;
    }

    return (
      <div className="flex items-center space-x-1">
        {icon}
        <span className={`text-sm ${statusColor}`}>{statusText}</span>
      </div>
    );
  };

  const uniqueOrgs = Array.from(new Set(keys.map(k => k.organizationName).filter(Boolean)));

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-900">Управление ключами</h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Создать ключ</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Всего ключей</p>
          <p className="text-2xl font-bold text-gray-900">{keys.length}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Активных</p>
          <p className="text-2xl font-bold text-green-600">
            {keys.filter(k => k.isActive).length}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Истекает скоро</p>
          <p className="text-2xl font-bold text-yellow-600">
            {keys.filter(k => {
              if (!k.expiresAt) return false;
              const daysUntilExpiry = (new Date(k.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
              return daysUntilExpiry > 0 && daysUntilExpiry <= 30;
            }).length}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Организаций</p>
          <p className="text-2xl font-bold text-blue-600">{uniqueOrgs.length}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Поиск по названию, ключу или организации..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
            >
              <option value="all">Все статусы</option>
              <option value="active">Активные</option>
              <option value="inactive">Неактивные</option>
              <option value="expired">Истекшие</option>
            </select>
            <select
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              value={selectedOrg}
              onChange={(e) => setSelectedOrg(e.target.value)}
            >
              <option value="all">Все организации</option>
              {uniqueOrgs.map(org => (
                <option key={org} value={org}>{org}</option>
              ))}
            </select>
            <button
              onClick={exportKeys}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center space-x-2"
            >
              <Download className="w-5 h-5" />
              <span>Экспорт</span>
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200">
        {loading ? (
          <div className="animate-pulse p-6">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-gray-100 h-16 mb-2 rounded"></div>
            ))}
          </div>
        ) : filteredKeys.length === 0 ? (
          <div className="text-center py-12 bg-gray-50">
            <p className="text-gray-600">Ключи не найдены</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Код ключа
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Роль
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Префикс
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Количество пользователей
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Статус
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Срок действия
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Действия
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredKeys.map((apiKey) => (
                  <tr key={apiKey.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                          {apiKey.key}
                        </code>
                        <button
                          onClick={() => copyToClipboard(apiKey.key, apiKey.name)}
                          className="text-gray-400 hover:text-gray-600"
                          title="Копировать ключ"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getPermissionBadges(apiKey.permissions)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {apiKey.keyPrefix || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {apiKey.usageCount || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(apiKey.isActive, apiKey.expiresAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {apiKey.expiresAt ? formatDate(apiKey.expiresAt) : 'Бессрочно'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleDeleteClick(apiKey)}
                          className="text-red-600 hover:text-red-900"
                          title="Удалить"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Modal */}
      {showDeleteModal && selectedKey && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Удалить ключ</h3>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedKey(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-gray-700 mb-4">
                Вы уверены, что хотите удалить ключ?
              </p>
              <code className="block text-sm font-mono bg-gray-100 px-3 py-2 rounded mb-4">
                {selectedKey.key}
              </code>
              <p className="text-sm text-gray-500">
                Это действие необратимо. Все приложения, использующие этот ключ, перестанут работать.
              </p>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedKey(null);
                }}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Отмена
              </button>
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isDeleting && (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                )}
                <span>{isDeleting ? 'Удаление...' : 'Удалить'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Key Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b flex-shrink-0">
              <h3 className="text-lg font-semibold text-gray-900">Создать новый ключ</h3>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewKeyForm({
                    name: '',
                    organizationName: '',
                    permissions: [],
                    expiresAt: '',
                    count: 1,
                    keyPrefix: '',
                  });
                  setCreationMode('single');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              {/* Mode Toggle */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Режим создания
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setCreationMode('single')}
                    className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                      creationMode === 'single'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Один ключ
                  </button>
                  <button
                    type="button"
                    onClick={() => setCreationMode('bulk')}
                    className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                      creationMode === 'bulk'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Массовое создание
                  </button>
                </div>
              </div>

              {/* Count field for bulk mode */}
              {creationMode === 'bulk' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Количество ключей <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={newKeyForm.count}
                    onChange={(e) => setNewKeyForm({ ...newKeyForm, count: parseInt(e.target.value) || 1 })}
                    placeholder="Введите количество"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Описание <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newKeyForm.name}
                  onChange={(e) => setNewKeyForm({ ...newKeyForm, name: e.target.value })}
                  placeholder="Например: Ключ для школы №1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Роль <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2">
                  {[
                    { value: 'admin', label: 'Администратор' },
                    { value: 'moderator', label: 'Модератор' },
                    { value: 'author', label: 'Автор' },
                    { value: 'school', label: 'Школа' },
                    { value: 'teacher', label: 'Учитель' },
                    { value: 'student', label: 'Ученик' }
                  ].map(role => (
                    <label key={role.value} className="flex items-center">
                      <input
                        type="radio"
                        name="role"
                        checked={newKeyForm.permissions[0] === role.value}
                        onChange={() => setNewKeyForm({ ...newKeyForm, permissions: [role.value] })}
                        className="border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        {role.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Дата истечения (опционально)
                </label>
                <input
                  type="date"
                  value={newKeyForm.expiresAt}
                  onChange={(e) => setNewKeyForm({ ...newKeyForm, expiresAt: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Префикс ключа <span className="text-gray-400 text-xs">(опционально)</span>
                </label>
                <input
                  type="text"
                  value={newKeyForm.keyPrefix}
                  onChange={(e) => setNewKeyForm({ ...newKeyForm, keyPrefix: e.target.value.toUpperCase() })}
                  placeholder="например: SUMMER2024"
                  maxLength={10}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  💡 {creationMode === 'bulk'
                    ? 'Ключи будут созданы и показаны в отдельном окне для скачивания'
                    : 'Ключ будет автоматически создан и скопирован в буфер обмена'}
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t bg-gray-50 flex-shrink-0">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewKeyForm({
                    name: '',
                    organizationName: '',
                    permissions: [],
                    expiresAt: '',
                    count: 1,
                    keyPrefix: '',
                  });
                  setCreationMode('single');
                }}
                disabled={isCreating}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Отмена
              </button>
              <button
                onClick={handleCreateKey}
                disabled={isCreating}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isCreating && (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                )}
                <span>{isCreating ? 'Создание...' : (creationMode === 'bulk' ? `Создать ${newKeyForm.count} ключей` : 'Создать ключ')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Results Modal */}
      {showBulkResultsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                Созданные ключи ({bulkCreatedKeys.length})
              </h3>
              <button
                onClick={() => {
                  setShowBulkResultsModal(false);
                  setBulkCreatedKeys([]);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              {bulkCreatedKeys.length === 0 ? (
                <p className="text-gray-900 text-center font-bold">Нет ключей для отображения</p>
              ) : (
                <div className="space-y-2">
                  {bulkCreatedKeys.map((key, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <code className="text-sm font-mono text-gray-900 flex-1 break-all">{key}</code>
                      <button
                        onClick={() => copyToClipboard(key, `Ключ ${index + 1}`)}
                        className="ml-2 text-blue-600 hover:text-blue-800 flex-shrink-0"
                        title="Копировать"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
              <button
                onClick={() => {
                  const keysText = bulkCreatedKeys.join('\n');
                  const blob = new Blob([keysText], { type: 'text/plain' });
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `registration-keys-${new Date().toISOString().split('T')[0]}.txt`;
                  a.click();
                  window.URL.revokeObjectURL(url);
                  toast.success('Ключи скачаны');
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <Download className="w-4 h-4 inline mr-2" />
                Скачать все
              </button>
              <button
                onClick={() => {
                  copyToClipboard(bulkCreatedKeys.join('\n'), 'Все ключи');
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                <Copy className="w-4 h-4 inline mr-2" />
                Скопировать все
              </button>
            </div>
          </div>
        </div>
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
