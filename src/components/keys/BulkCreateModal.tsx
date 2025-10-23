'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import type { BulkCreateData, RegistrationKey } from '@/types/registrationKey';
import { SpellCheckInput } from '../SpellCheckInput';

interface BulkCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: BulkCreateData) => Promise<RegistrationKey[]>;
}

export const BulkCreateModal: React.FC<BulkCreateModalProps> = ({
  isOpen,
  onClose,
  onSubmit
}) => {
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<BulkCreateData>({
    role: 'student',
    count: 5,
    description: '',
    maxUses: undefined,
    expiresAt: undefined,
    keyPrefix: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const submitData = {
        ...formData,
        maxUses: formData.maxUses || undefined,
        expiresAt: formData.expiresAt ? new Date(formData.expiresAt).toISOString() : undefined,
        keyPrefix: formData.keyPrefix || undefined
      };
      await onSubmit(submitData);
      handleClose();
    } catch (error) {
      // Error handling is managed by parent component
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
    setFormData({
      role: 'student',
      count: 5,
      description: '',
      maxUses: undefined,
      expiresAt: undefined,
      keyPrefix: ''
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Массовое создание ключей</h2>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Роль <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="student">Ученик</option>
                  <option value="teacher">Учитель</option>
                  <option value="author">Автор</option>
                  <option value="admin">Администратор</option>
                  <option value="school">Школа</option>
                  <option value="moderator">Модератор</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Количество <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.count}
                  onChange={(e) => setFormData({ ...formData, count: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="1"
                  max="100"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <SpellCheckInput
                  label="Описание"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Описание ключей"
                  required
                  lang="ru"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Макс. использований
                </label>
                <input
                  type="number"
                  value={formData.maxUses || ''}
                  onChange={(e) => setFormData({ ...formData, maxUses: e.target.value ? parseInt(e.target.value) : undefined })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Без ограничений"
                  min="1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Префикс ключа <span className="text-gray-400 text-xs">(необязательно)</span>
                </label>
                <input
                  type="text"
                  value={formData.keyPrefix}
                  onChange={(e) => setFormData({ ...formData, keyPrefix: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Например: SUMMER2024"
                  maxLength={10}
                  spellCheck={true}
                  lang="en"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Срок действия
                </label>
                <input
                  type="datetime-local"
                  value={formData.expiresAt || ''}
                  onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min={new Date().toISOString().slice(0, 16)}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 mt-6">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                disabled={loading}
              >
                Отмена
              </button>
              <button
                type="submit"
                disabled={loading || !formData.description}
                className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md disabled:opacity-50"
              >
                {loading ? 'Создание...' : 'Создать'}
              </button>
            </div>
          </form>
      </div>
    </div>
  );
};