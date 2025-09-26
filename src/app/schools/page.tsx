'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AuthWrapper, { useAuth } from '@/components/AuthWrapper';
import ApiService from '@/lib/api';

interface School {
  id: string;
  name: string;
  description: string | null;
  address: string | null;
  isActive: boolean;
  createdAt: string;
  teachersCount: number;
  studentsCount: number;
  admin: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
  } | null;
  keyStats?: {
    totalKeys: number;
    usedKeys: number;
    activeKeys: number;
  };
}

function SchoolsManagement() {
  const { logout } = useAuth();
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSchools();
  }, []);

  const fetchSchools = async () => {
    try {
      const result = await ApiService.getSchools();
      if (result.success) {
        setSchools(result.data);
      } else {
        console.error('Error fetching schools:', result.error);
        if (result.error?.code === 'UNAUTHORIZED') {
          logout();
        }
      }
    } catch (error) {
      console.error('Error fetching schools:', error);
      if (error instanceof Error && error.message === 'Authentication required') {
        logout();
      }
    } finally {
      setLoading(false);
    }
  };

  const getAdminName = (admin: School['admin']) => {
    if (!admin) return 'Не назначен';
    return `${admin.firstName || ''} ${admin.lastName || ''}`.trim() || admin.email;
  };

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
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Школы</h1>
        <p className="text-gray-600">
          Управление школами и их участниками
        </p>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Всего школ</h3>
          <p className="text-3xl font-bold text-blue-600">{schools.length}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Активные школы</h3>
          <p className="text-3xl font-bold text-green-600">
            {schools.filter(s => s.isActive).length}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Всего учителей</h3>
          <p className="text-3xl font-bold text-purple-600">
            {schools.reduce((sum, s) => sum + s.teachersCount, 0)}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Всего учеников</h3>
          <p className="text-3xl font-bold text-orange-600">
            {schools.reduce((sum, s) => sum + s.studentsCount, 0)}
          </p>
        </div>
      </div>

      {/* Таблица школ */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold">Все школы ({schools.length})</h2>
        </div>

        {schools.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Школы не найдены
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Название школы
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Статус
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Администратор
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Учителя
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ученики
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Дата создания
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Действия
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {schools.map((school) => (
                  <tr key={school.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {school.name}
                        </div>
                        {school.description && (
                          <div className="text-sm text-gray-500">
                            {school.description}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        school.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {school.isActive ? 'Активна' : 'Неактивна'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {getAdminName(school.admin)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                      {school.teachersCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                      {school.studentsCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(school.createdAt).toLocaleDateString('ru-RU')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        href={`/schools/${school.id}`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Подробнее
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SchoolsPage() {
  return (
    <AuthWrapper>
      <SchoolsManagement />
    </AuthWrapper>
  );
}