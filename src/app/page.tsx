'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AuthWrapper, { useAuth } from '@/components/AuthWrapper';
import ApiService from '@/lib/api';
import StatsCard from '@/components/StatsCard';
import { Key, CheckCircle, Building2, Users, TrendingUp, Calendar, Download, History } from 'lucide-react';

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
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Всего ключей"
            value={stats?.totalKeys || 0}
            icon={Key}
            color="blue"
          />
          <StatsCard
            title="Использованных"
            value={stats?.usedKeys || 0}
            icon={CheckCircle}
            color="green"
          />
          <StatsCard
            title="Школ"
            value={stats?.totalSchools || 0}
            icon={Building2}
            color="purple"
          />
          <StatsCard
            title="Пользователей"
            value={stats?.totalUsers || 0}
            subtitle={`Активных: ${stats?.activeUsers || 0}`}
            icon={Users}
            color="orange"
          />
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white shadow rounded-lg border border-gray-200">
        <div className="px-6 py-5">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Быстрые действия
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              href="/keys"
              className="flex items-center justify-center space-x-2 px-4 py-3 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
            >
              <Key className="w-5 h-5" />
              <span>Создать ключи</span>
            </Link>
            <Link
              href="/schools"
              className="flex items-center justify-center space-x-2 px-4 py-3 border border-transparent text-sm font-medium rounded-md text-green-700 bg-green-50 hover:bg-green-100 transition-colors"
            >
              <Building2 className="w-5 h-5" />
              <span>Посмотреть школы</span>
            </Link>
            <Link
              href="/books"
              className="flex items-center justify-center space-x-2 px-4 py-3 border border-transparent text-sm font-medium rounded-md text-purple-700 bg-purple-50 hover:bg-purple-100 transition-colors"
            >
              <History className="w-5 h-5" />
              <span>История изменений книг</span>
            </Link>
            <button
              onClick={handleExportData}
              className="flex items-center justify-center space-x-2 px-4 py-3 border border-transparent text-sm font-medium rounded-md text-gray-700 bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <Download className="w-5 h-5" />
              <span>Экспорт данных</span>
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
