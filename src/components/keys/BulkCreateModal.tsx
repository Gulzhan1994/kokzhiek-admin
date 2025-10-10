import React, { useState } from 'react';
import { X } from 'lucide-react';
import type { BulkCreateData, RegistrationKey } from '../types';
import { useLanguage } from '../../../hooks/useLanguage';

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
  const { t } = useLanguage();
  
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
          <h2 className="text-xl font-bold">{t('admin.modal.bulkCreate.title')}</h2>
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
                  {t('admin.modal.bulkCreate.role')} <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="student">{t('admin.modal.bulkCreate.roles.student')}</option>
                  <option value="teacher">{t('admin.modal.bulkCreate.roles.teacher')}</option>
                  <option value="author">{t('admin.modal.bulkCreate.roles.author')}</option>
                  <option value="admin">{t('admin.modal.bulkCreate.roles.admin')}</option>
                  <option value="school">{t('admin.modal.bulkCreate.roles.school')}</option>
                  <option value="moderator">{t('admin.modal.bulkCreate.roles.moderator')}</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('admin.modal.bulkCreate.count')} <span className="text-red-500">*</span>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('admin.modal.bulkCreate.description')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={t('admin.modal.bulkCreate.description')}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('admin.modal.bulkCreate.maxUses')}
                </label>
                <input
                  type="number"
                  value={formData.maxUses || ''}
                  onChange={(e) => setFormData({ ...formData, maxUses: e.target.value ? parseInt(e.target.value) : undefined })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={t('admin.modal.bulkCreate.unlimited')}
                  min="1"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('admin.modal.bulkCreate.keyPrefix')} <span className="text-gray-400 text-xs">({t('admin.modal.bulkCreate.optional')})</span>
                </label>
                <input
                  type="text"
                  value={formData.keyPrefix}
                  onChange={(e) => setFormData({ ...formData, keyPrefix: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., SUMMER2024"
                  maxLength={10}
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('admin.modal.bulkCreate.expiresAt')}
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
                {t('admin.modal.bulkCreate.cancel')}
              </button>
              <button
                type="submit"
                disabled={loading || !formData.description}
                className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md disabled:opacity-50"
              >
                {loading ? t('admin.modal.bulkCreate.generating') : t('admin.modal.bulkCreate.generate')}
              </button>
            </div>
          </form>
      </div>
    </div>
  );
};