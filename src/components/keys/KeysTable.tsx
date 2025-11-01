'use client';

import React from 'react';
import { Trash2, Copy, Eye, CheckCircle, XCircle, Clock } from 'lucide-react';
import type { RegistrationKey } from '@/types/registrationKey';
import { format } from 'date-fns';

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

const getStatusText = (key: RegistrationKey): { text: string; color: string } => {
  const now = new Date();
  const expiresAt = key.expiresAt ? new Date(key.expiresAt) : null;

  if (!key.isActive) {
    return { text: 'Неактивен', color: 'text-gray-600' };
  }

  if (expiresAt && expiresAt < now) {
    return { text: 'Истёк', color: 'text-red-600' };
  }

  if (key.maxUses && key.usedCount >= key.maxUses) {
    return { text: 'Исчерпан', color: 'text-orange-600' };
  }

  return { text: 'Активен', color: 'text-green-600' };
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

const getRoleDisplayName = (role: string) => {
  const roleMap = {
    admin: 'Администратор',
    author: 'Автор',
    teacher: 'Учитель',
    student: 'Ученик',
    school: 'Школа',
    moderator: 'Модератор'
  };
  return roleMap[role as keyof typeof roleMap] || 'Ученик';
};

export const KeysTable: React.FC<KeysTableProps> = ({
  keys,
  onDelete,
  onViewDetails,
  onCopyKey,
  loading
}) => {
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
        Ключи не найдены
      </div>
    );
  }

  return (
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
          {keys.map((key) => {
            const status = getStatusText(key);
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
                      title="Копировать ключ"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadgeColor(key.role)}`}>
                    {getRoleDisplayName(key.role)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {key.keyPrefix || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {key.usedCount || 0}
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
                  {key.expiresAt ? format(new Date(key.expiresAt), 'MMM d, yyyy') : 'Бессрочно'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end space-x-2">
                    <button
                      onClick={() => onViewDetails(key.keyCode)}
                      className="text-blue-600 hover:text-blue-900"
                      title="Просмотр деталей"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDelete(key.keyCode)}
                      className="text-red-600 hover:text-red-900"
                      title="Удалить"
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
