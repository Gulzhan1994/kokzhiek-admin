'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AuthWrapper, { useAuth } from '@/components/AuthWrapper';
import ApiService from '@/lib/api';

interface DashboardStats {
  totalKeys: number;
  usedKeys: number;
  totalSchools: number;
  totalUsers: number;
  activeUsers: number;
}

function AdminPanel() {
  const { logout } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const result = await ApiService.getDashboardStats();
      if (result.success) {
        setStats(result.data);
      } else {
        console.error('Error fetching stats:', result.error);
        if (result.error?.code === 'UNAUTHORIZED') {
          logout();
        }
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      if (error instanceof Error && error.message === 'Authentication required') {
        logout();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleExportData = async () => {
    try {
      const response = await ApiService.exportData('csv', 'all');

      // Create download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `kokzhiek_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exporting data:', error);
      if (error instanceof Error && error.message === 'Authentication required') {
        logout();
      } else {
        alert('Ошибка при экспорте данных');
      }
    }
  };
  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Дашборд</h1>
        <p className="text-gray-600 mt-2">Обзор системы и статистика</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="text-2xl">🔑</span>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Всего ключей
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {loading ? '-' : stats?.totalKeys || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="text-2xl">✅</span>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Использованных
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {loading ? '-' : stats?.usedKeys || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="text-2xl">🏫</span>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Школ
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {loading ? '-' : stats?.totalSchools || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="text-2xl">👥</span>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Пользователей
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {loading ? '-' : stats?.totalUsers || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Быстрые действия
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/keys"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
            >
              🔑 Создать ключи
            </Link>
            <Link
              href="/schools"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200"
            >
              🏫 Посмотреть школы
            </Link>
            <button
              onClick={handleExportData}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200"
            >
              📊 Экспорт данных
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <AuthWrapper>
      <AdminPanel />
    </AuthWrapper>
  );
}
