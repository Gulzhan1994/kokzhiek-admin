'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AuthWrapper, { useAuth } from '@/components/AuthWrapper';
import ApiService from '@/lib/api';
import StatsCard from '@/components/StatsCard';
import { AdminHistoryPanel } from '@/components/AdminHistoryPanel';
import { ExportProgressModal } from '@/components/ExportProgressModal';
import { Key, CheckCircle, Building2, Users, TrendingUp, Calendar, Download, History, Undo2, BookOpen, UserCheck, GraduationCap } from 'lucide-react';
import * as XLSX from 'xlsx'; // Импортируем библиотеку xlsx

interface DashboardStats {
  totalKeys: number;
  usedKeys: number;
  availableKeys: number;
  totalSchools: number;
  totalUsers: number;
  activeUsers: number;
  totalTeachers: number;
  totalStudents: number;
  totalBooks: number;
}

function AdminPanel() {
  const { logout } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [historyPanelOpen, setHistoryPanelOpen] = useState(false);
  const [exportProgress, setExportProgress] = useState<{
    isExporting: boolean;
    progress: number;
    status: string;
  }>({ isExporting: false, progress: 0, status: '' });
  const [exportFormat, setExportFormat] = useState<'csv' | 'xlsx'>('csv'); // Состояние для выбора формата экспорта

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
      setExportProgress({ isExporting: true, progress: 0, status: 'Подготовка экспорта...' });

      const dataType = 'all'; // Пока экспортируем все данные

      if (exportFormat === 'csv') {
        const response = await ApiService.exportData('csv', dataType);

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Ошибка экспорта: ${response.status} ${response.statusText}`);
        }

        // Get content length for progress calculation
        const contentLength = response.headers.get('content-length');
        const total = contentLength ? parseInt(contentLength, 10) : 0;

        setExportProgress({ isExporting: true, progress: 10, status: 'Загрузка данных...' });

        // Read response as stream to track progress
        const reader = response.body?.getReader();
        const chunks: Uint8Array[] = [];
        let receivedLength = 0;

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();

            if (done) break;

            chunks.push(value);
            receivedLength += value.length;

            // Calculate progress (reserve last 10% for file creation)
            const downloadProgress = total > 0
              ? Math.min(90, Math.floor((receivedLength / total) * 90))
              : Math.min(90, 10 + Math.floor(receivedLength / 10000));

            setExportProgress({
              isExporting: true,
              progress: downloadProgress,
              status: `Загружено ${(receivedLength / 1024 / 1024).toFixed(2)} МБ...`
            });
          }
        }

        setExportProgress({ isExporting: true, progress: 95, status: 'Создание файла...' });

        // Combine chunks into blob with UTF-8 encoding
        const blob = new Blob(chunks as BlobPart[], { type: 'text/csv; charset=utf-8' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `kokzhiek_export_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();

        setExportProgress({ isExporting: true, progress: 100, status: 'Экспорт завершен!' });

        // Clean up
        setTimeout(() => {
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
          setExportProgress({ isExporting: false, progress: 0, status: '' });
        }, 2000);

      } else if (exportFormat === 'xlsx') {
        // Логика для экспорта в XLSX
        const response = await ApiService.exportData('xlsx', dataType); // Запрашиваем JSON
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Ошибка экспорта: ${response.status} ${response.statusText}`);
        }

        setExportProgress({ isExporting: true, progress: 50, status: 'Обработка данных...' });

        const rawData = await response.json(); // Получаем JSON данные
        let dataToExport = rawData;

        // Если данные приходят в виде объекта с полем 'data' или 'items', извлекаем массив
        if (rawData && typeof rawData === 'object' && (rawData.data || rawData.items)) {
          dataToExport = rawData.data || rawData.items;
        }

        // Убедимся, что dataToExport является массивом
        if (!Array.isArray(dataToExport)) {
          throw new Error('Полученные данные не являются массивом для экспорта.');
        }

        // Локализация заголовков (пример, нужно будет расширить для всех типов данных)
        const localizedHeaders: { [key: string]: string } = {
          id: 'ID',
          email: 'Email',
          firstName: 'Имя',
          lastName: 'Фамилия',
          role: 'Роль',
          createdAt: 'Дата создания',
          // Добавьте другие заголовки по мере необходимости
        };

        // Преобразование данных для XLSX с локализованными заголовками
        const wsData = dataToExport.map((row: any) => {
          const newRow: any = {};
          for (const key in row) {
            if (Object.prototype.hasOwnProperty.call(row, key)) {
              newRow[localizedHeaders[key] || key] = row[key];
            }
          }
          return newRow;
        });

        const ws = XLSX.utils.json_to_sheet(wsData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Данные');
        XLSX.writeFile(wb, `kokzhiek_export_${new Date().toISOString().split('T')[0]}.xlsx`);

        setExportProgress({ isExporting: true, progress: 100, status: 'Экспорт завершен!' });

        setTimeout(() => {
          setExportProgress({ isExporting: false, progress: 0, status: '' });
        }, 2000);
      }

    } catch (error) {
      console.error('Error exporting data:', error);

      let errorMessage = 'Ошибка при экспорте данных';

      if (error instanceof Error) {
        if (error.message === 'Authentication required') {
          logout();
          return;
        }
        errorMessage = error.message;
      }

      // Показать ошибку в модальном окне на 3 секунды
      setExportProgress({
        isExporting: true,
        progress: 0,
        status: `❌ ${errorMessage}`
      });

      setTimeout(() => {
        setExportProgress({ isExporting: false, progress: 0, status: '' });
        alert(errorMessage);
      }, 3000);
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
        <>
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
              title="Доступных ключей"
              value={stats?.availableKeys || 0}
              icon={Key}
              color="gray"
            />
            <StatsCard
              title="Школ"
              value={stats?.totalSchools || 0}
              icon={Building2}
              color="purple"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatsCard
              title="Пользователей"
              value={stats?.totalUsers || 0}
              subtitle={`Активных: ${stats?.activeUsers || 0}`}
              icon={Users}
              color="orange"
            />
            <StatsCard
              title="Учителей"
              value={stats?.totalTeachers || 0}
              icon={UserCheck}
              color="indigo"
            />
            <StatsCard
              title="Учеников"
              value={stats?.totalStudents || 0}
              icon={GraduationCap}
              color="pink"
            />
            <StatsCard
              title="Книг"
              value={stats?.totalBooks || 0}
              icon={BookOpen}
              color="yellow"
            />
          </div>
        </>
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
              href="/audit-logs"
              className="flex items-center justify-center space-x-2 px-4 py-3 border border-transparent text-sm font-medium rounded-md text-purple-700 bg-purple-50 hover:bg-purple-100 transition-colors"
            >
              <History className="w-5 h-5" />
              <span>История изменений</span>
            </Link>
            <div className="flex flex-col gap-2"> {/* Обертка для кнопок экспорта */}
              <button
                onClick={() => setHistoryPanelOpen(true)}
                className="flex items-center justify-center space-x-2 px-4 py-3 border border-transparent text-sm font-medium rounded-md text-orange-700 bg-orange-50 hover:bg-orange-100 transition-colors"
              >
                <Undo2 className="w-5 h-5" />
                <span>История действий (Undo/Redo)</span>
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => { setExportFormat('csv'); handleExportData(); }}
                  className={`flex items-center justify-center space-x-2 px-4 py-3 border border-transparent text-sm font-medium rounded-md ${
                    exportFormat === 'csv' ? 'bg-blue-600 text-white' : 'text-gray-700 bg-gray-50 hover:bg-gray-100'
                  } transition-colors`}
                >
                  <Download className="w-5 h-5" />
                  <span>Экспорт CSV</span>
                </button>
                <button
                  onClick={() => { setExportFormat('xlsx'); handleExportData(); }}
                  className={`flex items-center justify-center space-x-2 px-4 py-3 border border-transparent text-sm font-medium rounded-md ${
                    exportFormat === 'xlsx' ? 'bg-green-600 text-white' : 'text-gray-700 bg-gray-50 hover:bg-gray-100'
                  } transition-colors`}
                >
                  <Download className="w-5 h-5" />
                  <span>Экспорт XLSX</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Admin History Panel */}
      <AdminHistoryPanel
        isOpen={historyPanelOpen}
        onClose={() => setHistoryPanelOpen(false)}
        onActionUndone={() => {
          // Обновляем статистику после отмены действия
          fetchStats();
        }}
      />

      {/* Export Progress Modal */}
      <ExportProgressModal
        isOpen={exportProgress.isExporting}
        progress={exportProgress.progress}
        status={exportProgress.status}
        onClose={() => setExportProgress({ isExporting: false, progress: 0, status: '' })}
      />
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
