'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface User {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  role: string;
  teacherId: string | null;
  emailVerified: boolean;
  createdAt: string;
  school: {
    id: string;
    name: string;
  } | null;
}

interface UsersData {
  users: User[];
  totalUsers: number;
  usersByRole: Record<string, number>;
}

export default function UsersPage() {
  const [usersData, setUsersData] = useState<UsersData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterRole, setFilterRole] = useState<string>('all');

  const roles = [
    { value: 'all', label: 'Все роли', color: 'bg-gray-100 text-gray-800' },
    { value: 'admin', label: 'Администратор', color: 'bg-red-100 text-red-800' },
    { value: 'moderator', label: 'Модератор', color: 'bg-orange-100 text-orange-800' },
    { value: 'author', label: 'Автор', color: 'bg-purple-100 text-purple-800' },
    { value: 'school', label: 'Школа', color: 'bg-blue-100 text-blue-800' },
    { value: 'teacher', label: 'Учитель', color: 'bg-green-100 text-green-800' },
    { value: 'student', label: 'Ученик', color: 'bg-gray-100 text-gray-800' },
  ];

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      const result = await response.json();
      if (result.success) {
        setUsersData(result.data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUserName = (user: User) => {
    return `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRoleInfo = (role: string) => {
    return roles.find(r => r.value === role) || { label: role, color: 'bg-gray-100 text-gray-800' };
  };

  const filteredUsers = usersData?.users.filter(user =>
    filterRole === 'all' || user.role === filterRole
  ) || [];

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
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Все пользователи
            </h1>
            <p className="text-gray-600">
              Просмотр всех зарегистрированных пользователей системы
            </p>
          </div>
          <Link
            href="/"
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            ← Назад к панели
          </Link>
        </div>

        {/* Статистика по ролям */}
        {usersData && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            <div className="bg-white p-4 rounded-lg shadow text-center">
              <h3 className="text-sm font-medium text-gray-700 mb-1">Всего</h3>
              <p className="text-2xl font-bold text-gray-900">{usersData.totalUsers}</p>
            </div>
            {Object.entries(usersData.usersByRole).map(([role, count]) => {
              const roleInfo = getRoleInfo(role);
              return (
                <div key={role} className="bg-white p-4 rounded-lg shadow text-center">
                  <h3 className="text-sm font-medium text-gray-700 mb-1">{roleInfo.label}</h3>
                  <p className="text-2xl font-bold text-blue-600">{count}</p>
                </div>
              );
            })}
          </div>
        )}

        {/* Фильтр по ролям */}
        {usersData && (
          <div className="bg-white rounded-lg shadow mb-6 p-4">
            <div className="flex flex-wrap gap-2">
              <label className="text-sm font-medium text-gray-700 mr-4 flex items-center">
                Фильтр по роли:
              </label>
              {roles.map((role) => (
                <button
                  key={role.value}
                  onClick={() => setFilterRole(role.value)}
                  className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                    filterRole === role.value
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {role.label}
                  {role.value !== 'all' && usersData.usersByRole[role.value] &&
                    ` (${usersData.usersByRole[role.value]})`
                  }
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Список пользователей */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold">
              Пользователи ({filteredUsers.length})
            </h2>
          </div>

          {filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {loading ? 'Загрузка...' : 'Пользователи не найдены'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Пользователь
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Роль
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Школа
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email подтвержден
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Дата регистрации
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.map((user) => {
                    const roleInfo = getRoleInfo(user.role);
                    return (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {getUserName(user)}
                            </div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${roleInfo.color}`}>
                            {roleInfo.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {user.school ? (
                            <Link
                              href={`/schools/${user.school.id}`}
                              className="text-blue-600 hover:text-blue-800 hover:underline"
                            >
                              {user.school.name}
                            </Link>
                          ) : (
                            <span className="text-gray-400">Не указана</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            user.emailVerified
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {user.emailVerified ? '✓ Подтвержден' : '⏳ Не подтвержден'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(user.createdAt)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}