import React, { useState } from 'react';
import { X } from 'lucide-react';
import type { CreateKeyData } from '../types';
import { useLanguage } from '../../../hooks/useLanguage';

interface CreateKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateKeyData) => Promise<void>;
}


export const CreateKeyModal: React.FC<CreateKeyModalProps> = ({
  isOpen,
  onClose,
  onSubmit
}) => {
  const { t } = useLanguage();
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateKeyData>({
    role: 'student',
    description: '',
    maxUses: undefined,
    expiresAt: undefined
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const submitData = {
        ...formData,
        maxUses: formData.maxUses || undefined,
        expiresAt: formData.expiresAt ? new Date(formData.expiresAt).toISOString() : undefined
      };
      await onSubmit(submitData);
      onClose();
      setFormData({
        role: 'student',
        description: '',
        maxUses: undefined,
        expiresAt: undefined
      });
    } catch (error) {
      // Error handling is managed by parent component
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">{t('admin.modal.createKey.title')}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('admin.modal.createKey.role')} <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="student">{t('admin.modal.createKey.roles.student')}</option>
                <option value="teacher">{t('admin.modal.createKey.roles.teacher')}</option>
                <option value="author">{t('admin.modal.createKey.roles.author')}</option>
                <option value="admin">{t('admin.modal.createKey.roles.admin')}</option>
                <option value="school">{t('admin.modal.createKey.roles.school')}</option>
                <option value="moderator">{t('admin.modal.createKey.roles.moderator')}</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('admin.modal.createKey.description')} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={t('admin.modal.createKey.descriptionPlaceholder')}
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('admin.modal.createKey.maxUses')}
              </label>
              <input
                type="number"
                value={formData.maxUses || ''}
                onChange={(e) => setFormData({ ...formData, maxUses: e.target.value ? parseInt(e.target.value) : undefined })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={t('admin.modal.createKey.unlimited')}
                min="1"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('admin.modal.createKey.expiresAt')}
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
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
              disabled={loading}
            >
              {t('admin.modal.createKey.cancel')}
            </button>
            <button
              type="submit"
              disabled={loading || !formData.description}
              className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md disabled:opacity-50"
            >
              {loading ? t('admin.modal.createKey.creating') : t('admin.modal.createKey.create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};