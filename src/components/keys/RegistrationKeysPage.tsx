'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Download, RefreshCw, Filter, Search, Key } from 'lucide-react';
import { KeysTable } from './KeysTable';
import { CreateKeyModal } from './CreateKeyModal';
import { BulkCreateModal } from './BulkCreateModal';
import { KeyDetailsModal } from './KeyDetailsModal';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import {
  getRegistrationKeys,
  createRegistrationKey,
  createBulkKeys,
  deleteKey
} from '@/lib/registrationKeys';
import type { RegistrationKey, KeyStatus } from '@/types/registrationKey';
import { toast } from 'react-hot-toast';

export const RegistrationKeysPage: React.FC = () => {
  const [keys, setKeys] = useState<RegistrationKey[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [statusFilter, setStatusFilter] = useState<KeyStatus | ''>('');
  const [searchTerm, setSearchTerm] = useState('');

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedKeyCode, setSelectedKeyCode] = useState<string | null>(null);
  const [keyToDelete, setKeyToDelete] = useState<string | null>(null);

  const loadKeys = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getRegistrationKeys({
        page,
        limit,
        status: statusFilter || undefined,
        keyCode: searchTerm || undefined
      });
      setKeys(response.keys);
      setTotal(response.total);
    } catch (error) {
      toast.error('Ошибка при загрузке ключей');
    } finally {
      setLoading(false);
    }
  }, [page, limit, statusFilter, searchTerm]);

  useEffect(() => {
    loadKeys();
  }, [loadKeys]);

  const handleCreateKey = async (data: any) => {
    try {
      await createRegistrationKey(data);
      toast.success('Ключ успешно создан');
      loadKeys();
    } catch (error) {
      toast.error('Ошибка при создании ключа');
      throw error;
    }
  };

  const handleBulkCreate = async (data: any) => {
    try {
      const result = await createBulkKeys(data);
      toast.success(`Создано ключей: ${result.length}`);
      loadKeys();
      return result;
    } catch (error) {
      toast.error('Ошибка при создании ключей');
      throw error;
    }
  };

  const handleDeleteKey = (keyCode: string) => {
    setKeyToDelete(keyCode);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async (keyCode: string) => {
    try {
      await deleteKey(keyCode);
      toast.success('Ключ успешно удалён');
      loadKeys();
    } catch (error) {
      toast.error('Ошибка при удалении ключа');
      throw error;
    }
  };

  const handleCopyKey = (keyCode: string) => {
    navigator.clipboard.writeText(keyCode);
    toast.success('Ключ скопирован в буфер обмена');
  };

  const handleViewDetails = (keyCode: string) => {
    setSelectedKeyCode(keyCode);
    setDetailsModalOpen(true);
  };

  const handleExport = () => {
    const csvContent = [
      [
        'Код ключа',
        'Роль',
        'Описание',
        'Использований',
        'Статус',
        'Срок действия'
      ],
      ...keys.map(key => {
        const now = new Date();
        const expiresAt = key.expiresAt ? new Date(key.expiresAt) : null;
        let status = 'Активен';

        if (!key.isActive) {
          status = 'Неактивен';
        } else if (expiresAt && expiresAt < now) {
          status = 'Истёк';
        } else if (key.maxUses && key.usedCount >= key.maxUses) {
          status = 'Исчерпан';
        }

        return [
          key.keyCode || '',
          key.role || '',
          key.description || '',
          key.maxUses?.toString() || '∞',
          status,
          key.expiresAt ? new Date(key.expiresAt).toLocaleDateString() : 'Бессрочно'
        ];
      })
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `keys-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Key className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Ключи регистрации</h1>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCreateModalOpen(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              <span>Создать ключ</span>
            </button>

            <button
              onClick={() => setBulkModalOpen(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              <Plus className="w-4 h-4" />
              <span>Массовое создание</span>
            </button>

            <button
              onClick={handleExport}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              <Download className="w-4 h-4" />
              <span>Экспорт</span>
            </button>

            <button
              onClick={loadKeys}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Обновить</span>
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              placeholder="Поиск по коду ключа..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Filter className="text-gray-500 w-5 h-5" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as KeyStatus | '');
                setPage(1);
              }}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Все статусы</option>
              <option value="active">Активные</option>
              <option value="expired">Истёкшие</option>
              <option value="inactive">Неактивные</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <KeysTable
          keys={keys}
          loading={loading}
          onDelete={handleDeleteKey}
          onViewDetails={handleViewDetails}
          onCopyKey={handleCopyKey}
        />

        {totalPages > 1 && (
          <div className="px-6 py-4 border-t flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Показано {(page - 1) * limit + 1}-{Math.min(page * limit, total)} из {total} ключей
            </p>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 hover:bg-gray-50"
              >
                Назад
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                .map((p, i, arr) => (
                  <React.Fragment key={p}>
                    {i > 0 && arr[i - 1] !== p - 1 && <span>...</span>}
                    <button
                      onClick={() => setPage(p)}
                      className={`px-3 py-1 rounded-md ${
                        p === page
                          ? 'bg-blue-600 text-white'
                          : 'border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {p}
                    </button>
                  </React.Fragment>
                ))}

              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 hover:bg-gray-50"
              >
                Вперёд
              </button>
            </div>
          </div>
        )}
      </div>

      <CreateKeyModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSubmit={handleCreateKey}
      />

      <BulkCreateModal
        isOpen={bulkModalOpen}
        onClose={() => setBulkModalOpen(false)}
        onSubmit={handleBulkCreate}
      />

      <KeyDetailsModal
        isOpen={detailsModalOpen}
        keyCode={selectedKeyCode}
        onClose={() => {
          setDetailsModalOpen(false);
          setSelectedKeyCode(null);
        }}
        onDelete={handleDeleteKey}
      />

      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        keyCode={keyToDelete}
        onClose={() => {
          setDeleteModalOpen(false);
          setKeyToDelete(null);
        }}
        onConfirm={confirmDelete}
      />
    </div>
  );
};
