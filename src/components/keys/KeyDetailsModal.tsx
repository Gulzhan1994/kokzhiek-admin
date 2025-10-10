import React, { useEffect, useState } from 'react';
import { X, Copy, Trash2, CheckCircle } from 'lucide-react';
import type { RegistrationKey } from '../types';
import { getKeyDetails } from '../api/registrationKeys';
import { format } from 'date-fns';
import { useLanguage } from '../../../hooks/useLanguage';

// Helper function to get role display name
const getRoleDisplayName = (role: string, t: any) => {
  const roleMap = {
    admin: 'admin.table.roles.admin',
    author: 'admin.table.roles.author',
    teacher: 'admin.table.roles.teacher',
    student: 'admin.table.roles.student',
    school: 'admin.table.roles.school',
    moderator: 'admin.table.roles.moderator'
  };
  return t(roleMap[role as keyof typeof roleMap] || 'admin.table.roles.student');
};

// Helper function to safely format dates
const formatDate = (dateValue: string | null | undefined, formatStr: string = 'MMM d, yyyy HH:mm'): string => {
  if (!dateValue) return 'N/A';

  try {
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }
    return format(date, formatStr);
  } catch (error) {
    return 'Invalid date';
  }
};

interface KeyDetailsModalProps {
  isOpen: boolean;
  keyCode: string | null;
  onClose: () => void;
  onDelete: (keyCode: string) => void;
}


export const KeyDetailsModal: React.FC<KeyDetailsModalProps> = ({
  isOpen,
  keyCode,
  onClose,
  onDelete
}) => {
  const { t } = useLanguage();
  
  const [keyDetails, setKeyDetails] = useState<RegistrationKey | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    if (isOpen && keyCode) {
      loadKeyDetails();
    }
  }, [isOpen, keyCode]);

  const loadKeyDetails = async () => {
    if (!keyCode) return;
    
    setLoading(true);
    try {
      const details = await getKeyDetails(keyCode);
      setKeyDetails(details);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const handleCopyKey = () => {
    if (keyDetails) {
      navigator.clipboard.writeText(keyDetails.keyCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCopyLink = () => {
    if (keyDetails) {
      const link = `${window.location.origin}/register?key=${keyDetails.keyCode}`;
      navigator.clipboard.writeText(link);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const getStatus = () => {
    if (!keyDetails) return '';

    // Используем поле status из API если оно есть
    if (keyDetails.status) {
      const statusMap = {
        'active': t('admin.table.status.active'),
        'inactive': t('admin.table.status.inactive'),
        'expired': t('admin.table.status.expired'),
        'exhausted': t('admin.table.status.exhausted')
      };
      return statusMap[keyDetails.status as keyof typeof statusMap] || keyDetails.status;
    }

    // Fallback логика если нет поля status
    const now = new Date();
    const expiresAt = keyDetails.expiresAt ? new Date(keyDetails.expiresAt) : null;

    if (!keyDetails.isActive) return t('admin.table.status.inactive');
    if (expiresAt && expiresAt < now) return t('admin.table.status.expired');
    if (keyDetails.maxUses && keyDetails.usedCount >= keyDetails.maxUses) return t('admin.table.status.exhausted');
    return t('admin.table.status.active');
  };

  const getStatusColor = () => {
    const status = getStatus();
    if (status === t('admin.table.status.active')) return 'text-green-600';
    if (status === t('admin.table.status.expired')) return 'text-red-600';
    if (status === t('admin.table.status.exhausted')) return 'text-orange-600';
    return 'text-gray-600';
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">{t('admin.modal.keyDetails.title')}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : keyDetails ? (
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{t('admin.modal.keyDetails.keyCode')}</p>
                  <code className="text-2xl font-mono font-bold">{keyDetails.keyCode}</code>
                </div>
                <button
                  onClick={handleCopyKey}
                  className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {copied ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      <span>{t('admin.modal.keyDetails.copied')}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>{t('admin.modal.keyDetails.copy')}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">{t('admin.modal.keyDetails.role')}</p>
                <p className="font-semibold">{getRoleDisplayName(keyDetails.role, t)}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600">{t('admin.modal.keyDetails.status')}</p>
                <p className={`font-semibold ${getStatusColor()}`}>{getStatus()}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600">{t('admin.modal.keyDetails.expiresAt')}</p>
                <p className="font-semibold">
                  {keyDetails.expiresAt
                    ? formatDate(keyDetails.expiresAt)
                    : t('admin.modal.keyDetails.never')}
                </p>
              </div>

              <div className="md:col-span-2">
                <p className="text-sm text-gray-600">{t('admin.modal.keyDetails.description')}</p>
                <p className="font-semibold">{keyDetails.description}</p>
              </div>
            </div>
            
            {keyDetails.usedBy && keyDetails.usedBy.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">{t('admin.modal.keyDetails.usageHistory')}</h3>
                <div className="bg-gray-50 rounded-lg p-3 max-h-40 overflow-y-auto">
                  <div className="space-y-2">
                    {keyDetails.usedBy.map((usage, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>{t('admin.modal.keyDetails.userId')}: {usage.userId}</span>
                        <span className="text-gray-500">
                          {formatDate(usage.usedAt)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex justify-end pt-4 border-t">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                {t('admin.modal.keyDetails.close')}
              </button>
            </div>
          </div>
        ) : (
          <p className="text-center text-gray-500 py-8">{t('admin.modal.keyDetails.noDetails')}</p>
        )}
      </div>
    </div>
  );
};