'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ApiService from '@/lib/api';
import Modal from '@/components/Modal';
import { History, Download, Filter, Search, X, ChevronLeft, ChevronRight } from 'lucide-react';

interface AuditLog {
  id: string;
  userId: string | null;
  action: 'create' | 'update' | 'delete' | 'login' | 'logout' | 'access';
  entityType: string;
  entityId: string | null;
  description: string;
  extraData?: {
    oldValue?: any;
    newValue?: any;
    changes?: Array<{
      field: string;
      oldValue: any;
      newValue: any;
    }>;
  };
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

interface AuditLogsResponse {
  success: boolean;
  data: AuditLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function AuditHistoryPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(25);

  // Фильтры
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [entityTypeFilter, setEntityTypeFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Модальное окно с деталями
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [modal, setModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
  });

  useEffect(() => {
    fetchLogs();
  }, [currentPage, limit]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const response: AuditLogsResponse = await ApiService.getAuditLogs({
        page: currentPage,
        limit,
        search: searchQuery || undefined,
        action: actionFilter || undefined,
        entityType: entityTypeFilter || undefined,
      });

      if (response.success) {
        setLogs(response.data);
        setTotal(response.pagination.total);
        setTotalPages(response.pagination.totalPages);
      }
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      showModal('Ошибка', 'Не удалось загрузить историю изменений', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchLogs();
  };

  const handleExportCSV = async () => {
    try {
      const response = await ApiService.exportAuditLogs({
        search: searchQuery || undefined,
        action: actionFilter || undefined,
        entityType: entityTypeFilter || undefined,
      });

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit_logs_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      showModal('Успешно', 'История экспортирована в CSV', 'success');
    } catch (error) {
      console.error('Export error:', error);
      showModal('Ошибка', 'Не удалось экспортировать историю', 'error');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ru-RU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const translateAction = (action: string): string => {
    const translations: Record<string, string> = {
      'create': 'Создание',
      'update': 'Изменение',
      'delete': 'Удаление',
      'login': 'Вход',
      'logout': 'Выход',
      'access': 'Доступ',
    };
    return translations[action] || action;
  };

  const getActionColor = (action: string): string => {
    const colors: Record<string, string> = {
      'create': 'bg-green-100 text-green-800',
      'update': 'bg-blue-100 text-blue-800',
      'delete': 'bg-red-100 text-red-800',
      'login': 'bg-purple-100 text-purple-800',
      'logout': 'bg-gray-100 text-gray-800',
      'access': 'bg-yellow-100 text-yellow-800',
    };
    return colors[action] || 'bg-gray-100 text-gray-800';
  };

  const showModal = (title: string, message: string, type: 'success' | 'error' | 'warning' | 'info') => {
    setModal({ isOpen: true, title, message, type });
  };

  const closeModal = () => {
    setModal({ ...modal, isOpen: false });
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setActionFilter('');
    setEntityTypeFilter('');
    setCurrentPage(1);
  };

  if (loading && logs.length === 0) {
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
        {/* Header */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <History className="w-8 h-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-900">
                История изменений
              </h1>
            </div>
            <p className="text-gray-600">
              Полная история действий пользователей в системе
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
            >
              <Download className="w-4 h-4" />
              Экспорт CSV
            </button>
            <Link
              href="/"
              className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
            >
              ← Назад
            </Link>
          </div>
        </div>

        {/* Статистика */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-4 rounded-lg shadow text-center">
            <h3 className="text-sm font-medium text-gray-700 mb-1">Всего записей</h3>
            <p className="text-2xl font-bold text-gray-900">{total}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow text-center">
            <h3 className="text-sm font-medium text-gray-700 mb-1">Текущая страница</h3>
            <p className="text-2xl font-bold text-blue-600">{currentPage} / {totalPages}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow text-center">
            <h3 className="text-sm font-medium text-gray-700 mb-1">Показано</h3>
            <p className="text-2xl font-bold text-green-600">{logs.length}</p>
          </div>
        </div>

        {/* Поиск и фильтры */}
        <div className="bg-white rounded-lg shadow mb-6 p-4">
          <div className="flex gap-4 items-start flex-col">
            {/* Поиск */}
            <form onSubmit={handleSearch} className="w-full flex gap-4">
              <div className="flex-1 flex gap-4">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Поиск по описанию..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2"
                >
                  <Search className="w-4 h-4" />
                  Поиск
                </button>
                <button
                  type="button"
                  onClick={() => setShowFilters(!showFilters)}
                  className="bg-gray-200 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-300 flex items-center gap-2"
                >
                  <Filter className="w-4 h-4" />
                  Фильтры
                </button>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">Показать:</label>
                <select
                  value={limit}
                  onChange={(e) => handleLimitChange(Number(e.target.value))}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </form>

            {/* Расширенные фильтры */}
            {showFilters && (
              <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Тип действия
                  </label>
                  <select
                    value={actionFilter}
                    onChange={(e) => setActionFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Все действия</option>
                    <option value="create">Создание</option>
                    <option value="update">Изменение</option>
                    <option value="delete">Удаление</option>
                    <option value="login">Вход</option>
                    <option value="logout">Выход</option>
                    <option value="access">Доступ</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Тип сущности
                  </label>
                  <select
                    value={entityTypeFilter}
                    onChange={(e) => setEntityTypeFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Все типы</option>
                    <option value="book">Книги</option>
                    <option value="chapter">Главы</option>
                    <option value="block">Блоки</option>
                    <option value="user">Пользователи</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={clearFilters}
                    className="w-full bg-red-100 text-red-700 px-4 py-2 rounded-md hover:bg-red-200 flex items-center justify-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    Сбросить фильтры
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Таблица логов */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold">
              История ({logs.length} из {total})
            </h2>
          </div>

          {logs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {loading ? 'Загрузка...' : 'Записи не найдены'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Дата/Время
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Действие
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Сущность
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Описание
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Пользователь
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Изменения
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Детали
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(log.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getActionColor(log.action)}`}>
                          {translateAction(log.action)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="font-medium">{log.entityType}</div>
                        {log.entityId && (
                          <div className="text-xs text-gray-500">{log.entityId.slice(0, 8)}...</div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-md">
                        <div className="truncate" title={log.description}>
                          {log.description}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {log.userId ? (
                          <div className="text-xs">{log.userId.slice(0, 8)}...</div>
                        ) : (
                          <span className="text-gray-400">Система</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                        {log.extraData?.changes?.length ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {log.extraData.changes.length}
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="text-blue-600 hover:text-blue-900 font-medium"
                        >
                          Подробнее →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Пагинация */}
        {totalPages > 1 && (
          <div className="mt-6 flex justify-center items-center gap-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-white border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 flex items-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Предыдущая
            </button>

            <div className="flex gap-1">
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                let page;
                if (totalPages <= 7) {
                  page = i + 1;
                } else if (currentPage <= 4) {
                  page = i + 1;
                } else if (currentPage >= totalPages - 3) {
                  page = totalPages - 6 + i;
                } else {
                  page = currentPage - 3 + i;
                }

                return (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-4 py-2 rounded-md ${
                      currentPage === page
                        ? 'bg-blue-600 text-white'
                        : 'bg-white border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-white border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 flex items-center gap-2"
            >
              Следующая
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Modal с деталями */}
        {selectedLog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
                <h3 className="text-lg font-semibold">Детали записи</h3>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="px-6 py-4 space-y-4">
                {/* Основная информация */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">ID записи</label>
                    <p className="text-sm text-gray-900 font-mono">{selectedLog.id}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Дата и время</label>
                    <p className="text-sm text-gray-900">{formatDate(selectedLog.createdAt)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Действие</label>
                    <p className="text-sm">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getActionColor(selectedLog.action)}`}>
                        {translateAction(selectedLog.action)}
                      </span>
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Тип сущности</label>
                    <p className="text-sm text-gray-900">{selectedLog.entityType}</p>
                  </div>
                  {selectedLog.entityId && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">ID сущности</label>
                      <p className="text-sm text-gray-900 font-mono">{selectedLog.entityId}</p>
                    </div>
                  )}
                  {selectedLog.userId && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">ID пользователя</label>
                      <p className="text-sm text-gray-900 font-mono">{selectedLog.userId}</p>
                    </div>
                  )}
                  {selectedLog.ipAddress && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">IP адрес</label>
                      <p className="text-sm text-gray-900 font-mono">{selectedLog.ipAddress}</p>
                    </div>
                  )}
                </div>

                {/* Описание */}
                <div>
                  <label className="text-sm font-medium text-gray-700">Описание</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md">{selectedLog.description}</p>
                </div>

                {/* Изменения */}
                {selectedLog.extraData?.changes && selectedLog.extraData.changes.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Изменения ({selectedLog.extraData.changes.length})
                    </label>
                    <div className="space-y-2">
                      {selectedLog.extraData.changes.map((change, index) => (
                        <div key={index} className="bg-gray-50 p-3 rounded-md">
                          <div className="font-medium text-sm text-gray-900 mb-2">{change.field}</div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <div className="text-xs text-gray-500 mb-1">Старое значение:</div>
                              <pre className="bg-red-50 p-2 rounded text-xs overflow-x-auto">
                                {JSON.stringify(change.oldValue, null, 2)}
                              </pre>
                            </div>
                            <div>
                              <div className="text-xs text-gray-500 mb-1">Новое значение:</div>
                              <pre className="bg-green-50 p-2 rounded text-xs overflow-x-auto">
                                {JSON.stringify(change.newValue, null, 2)}
                              </pre>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* User Agent */}
                {selectedLog.userAgent && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">User Agent</label>
                    <p className="text-xs text-gray-600 bg-gray-50 p-2 rounded-md font-mono break-all">
                      {selectedLog.userAgent}
                    </p>
                  </div>
                )}
              </div>

              <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
                <button
                  onClick={() => setSelectedLog(null)}
                  className="bg-gray-600 text-white px-6 py-2 rounded-md hover:bg-gray-700"
                >
                  Закрыть
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal для уведомлений */}
        <Modal
          isOpen={modal.isOpen}
          onClose={closeModal}
          title={modal.title}
          message={modal.message}
          type={modal.type}
        />
      </div>
    </div>
  );
}
