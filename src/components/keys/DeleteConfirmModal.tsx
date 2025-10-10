import React, { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { useLanguage } from '../../../hooks/useLanguage';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  keyCode: string | null;
  onClose: () => void;
  onConfirm: (keyCode: string) => Promise<void>;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  keyCode,
  onClose,
  onConfirm
}) => {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!keyCode) return;

    setLoading(true);
    try {
      await onConfirm(keyCode);
      onClose();
    } catch (error) {
      // Ошибка уже обработана в API
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !keyCode) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-6 h-6 text-red-500" />
            <h2 className="text-xl font-bold text-gray-900">{t('admin.modal.deleteConfirm.title')}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            disabled={loading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-6">
          <p className="text-gray-700 mb-4">
            {t('admin.modal.deleteConfirm.message')}
          </p>

          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-sm text-gray-600 mb-1">
              {t('admin.modal.deleteConfirm.keyCode')}:
            </div>
            <code className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
              {keyCode}
            </code>
          </div>
        </div>

        <div className="flex justify-end space-x-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
            disabled={loading}
          >
            {t('admin.modal.deleteConfirm.cancel')}
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-md disabled:opacity-50 flex items-center space-x-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>{t('admin.modal.deleteConfirm.deleting')}</span>
              </>
            ) : (
              <span>{t('admin.modal.deleteConfirm.delete')}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};