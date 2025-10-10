import React from 'react';
import { Trash2, Copy, Eye, CheckCircle, XCircle, Clock } from 'lucide-react';
import type { RegistrationKey } from '../types';
import { format } from 'date-fns';
import { useLanguage } from '../../../hooks/useLanguage';

interface KeysTableProps {
  keys: RegistrationKey[];
  onDelete: (keyCode: string) => void;
  onViewDetails: (keyCode: string) => void;
  onCopyKey: (keyCode: string) => void;
  loading?: boolean;
}

const getStatusIcon = (key: RegistrationKey) => {
  const now = new Date();
  const expiresAt = key.expiresAt ? new Date(key.expiresAt) : null;
  
  if (!key.isActive) {
    return <XCircle className="w-4 h-4 text-gray-500" />;
  }
  
  if (expiresAt && expiresAt < now) {
    return <Clock className="w-4 h-4 text-red-500" />;
  }
  
  if (key.maxUses && key.usedCount >= key.maxUses) {
    return <XCircle className="w-4 h-4 text-orange-500" />;
  }
  
  return <CheckCircle className="w-4 h-4 text-green-500" />;
};

const getStatusText = (key: RegistrationKey, t: any): { text: string; color: string } => {
  const now = new Date();
  const expiresAt = key.expiresAt ? new Date(key.expiresAt) : null;

  if (!key.isActive) {
    return { text: t('admin.table.status.inactive'), color: 'text-gray-600' };
  }

  if (expiresAt && expiresAt < now) {
    return { text: t('admin.table.status.expired'), color: 'text-red-600' };
  }

  if (key.maxUses && key.usedCount >= key.maxUses) {
    return { text: t('admin.table.status.exhausted'), color: 'text-orange-600' };
  }

  return { text: t('admin.table.status.active'), color: 'text-green-600' };
};

const getRoleBadgeColor = (role: string) => {
  const colors = {
    admin: 'bg-red-100 text-red-800',
    author: 'bg-purple-100 text-purple-800',
    teacher: 'bg-blue-100 text-blue-800',
    student: 'bg-green-100 text-green-800',
    school: 'bg-yellow-100 text-yellow-800',
    moderator: 'bg-orange-100 text-orange-800'
  };
  return colors[role as keyof typeof colors] || 'bg-gray-100 text-gray-800';
};

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

export const KeysTable: React.FC<KeysTableProps> = ({
  keys,
  onDelete,
  onViewDetails,
  onCopyKey,
  loading
}) => {
  const { t } = useLanguage();
  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (keys.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        {t('admin.table.noKeysFound')}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {t('admin.table.keyCode')}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {t('admin.table.role')}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {t('admin.table.description')}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {t('admin.table.uses')}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {t('admin.table.status')}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {t('admin.table.expires')}
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              {t('admin.table.actions')}
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {keys.map((key) => {
            const status = getStatusText(key, t);
            return (
              <tr key={key.keyCode} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                      {key.keyCode}
                    </code>
                    <button
                      onClick={() => onCopyKey(key.keyCode)}
                      className="text-gray-400 hover:text-gray-600"
                      title={t('admin.table.copyKey')}
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadgeColor(key.role)}`}>
                    {getRoleDisplayName(key.role, t)}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {key.description}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {key.maxUses || ''}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-1">
                    {getStatusIcon(key)}
                    <span className={`text-sm ${status.color}`}>
                      {status.text}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {key.expiresAt ? format(new Date(key.expiresAt), 'MMM d, yyyy') : t('admin.table.never')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end space-x-2">
                    <button
                      onClick={() => onViewDetails(key.keyCode)}
                      className="text-blue-600 hover:text-blue-900"
                      title={t('admin.table.viewDetails')}
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDelete(key.keyCode)}
                      className="text-red-600 hover:text-red-900"
                      title={t('admin.table.delete')}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};