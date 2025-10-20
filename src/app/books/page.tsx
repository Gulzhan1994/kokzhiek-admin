'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import ApiService from '@/lib/api';
import Modal from '@/components/Modal';
import useLanguage from '@/hooks/useLanguage';

interface Book {
  id: string;
  title: string;
  author: string | null;
  class: string | null;
  createdAt: string;
  lastEditedAt: string | null;
  lastEditAction: string | null;
  lastEditDescription: string | null;
  ownerId: string;
  lastEditedBy: string | null;
  ownerEmail: string;
  lastEditorEmail: string | null;
  chaptersCount: number;
  lastAuditExtraData?: {
    oldValue?: any;
    newValue?: any;
    changes?: Array<{
      field: string;
      oldValue: any;
      newValue: any;
    }>;
  };
}

interface BooksResponse {
  success: boolean;
  message: string;
  data: {
    books: Book[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export default function BooksPage() {
  const { t } = useLanguage();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(10);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showFilterMenu, setShowFilterMenu] = useState<string | null>(null);
  const [filterOwner, setFilterOwner] = useState<string>('');
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

  // Для поиска в логах
  const [searchLogsModalOpen, setSearchLogsModalOpen] = useState(false);
  const [searchLogsQuery, setSearchLogsQuery] = useState('');
  const [searchLogsResults, setSearchLogsResults] = useState<any[]>([]);
  const [searchLogsLoading, setSearchLogsLoading] = useState(false);

  const fetchBooks = useCallback(async (silentRefresh = false) => {
    try {
      // Показываем индикатор загрузки только если это не фоновое обновление
      if (!silentRefresh) {
        setLoading(true);
      }

      const response: BooksResponse = await ApiService.getAllBooks({
        page: currentPage,
        limit,
        search: searchQuery || undefined,
        sortBy,
        sortOrder,
      });

      if (response.success) {
        setBooks(response.data.books);
        setTotal(response.data.total);
        setTotalPages(response.data.totalPages);
      }
    } catch (error) {
    } finally {
      if (!silentRefresh) {
        setLoading(false);
      }
    }
  }, [currentPage, limit, searchQuery, sortBy, sortOrder]);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  // Автоматическое обновление каждые 10 секунд
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchBooks(true); // Тихое обновление в фоне
    }, 10000); // 10 секунд

    return () => clearInterval(interval);
  }, [autoRefresh, fetchBooks]);

  // Обновление при возврате фокуса на вкладку
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && autoRefresh) {
        fetchBooks(true); // Тихое обновление в фоне
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [autoRefresh, fetchBooks]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    const datePart = date.toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
    const timePart = date.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit'
    });
    return `${datePart} ${timePart}`;
  };

  const translateEditAction = (action: string | null) => {
    if (!action) return '—';
    const translations: Record<string, string> = {
      'updated_title': 'Изменён заголовок',
      'updated_description': 'Изменено описание',
      'updated_author': 'Изменён автор',
      'updated_settings': 'Изменены настройки',
      'updated_book': 'Обновлена книга',
    };
    return translations[action] || action;
  };

  const translateFieldName = (fieldName: string): string => {
    const translations: Record<string, string> = {
      title: 'Название',
      description: 'Описание',
      author: 'Автор',
      authors: 'Авторы',
      grade: 'Класс',
      class: 'Класс',
      coverImageUrl: 'Обложка',
      isPublic: 'Публичность',
      visibility: 'Видимость',
      isbn: 'ISBN',
      year: 'Год издания',
      publisher: 'Издательство',
      edition: 'Издание',
      subject: 'Предмет',
      language: 'Язык',
      schoolId: 'Школа',
      ownerId: 'Владелец',
    };
    return translations[fieldName] || fieldName;
  };

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return '—';
    if (typeof value === 'boolean') return value ? 'Да' : 'Нет';
    if (Array.isArray(value)) {
      return value.length === 0 ? '—' : value.join(', ');
    }
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchBooks();
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const showModal = (title: string, message: string, type: 'success' | 'error' | 'warning' | 'info') => {
    setModal({ isOpen: true, title, message, type });
  };

  const closeModal = () => {
    setModal({ ...modal, isOpen: false });
  };

  const handleBookClick = (book: Book) => {
    setSelectedBook(book);
  };

  const closeBookModal = () => {
    setSelectedBook(null);
  };

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setCurrentPage(1);
  };

  // Обработчик экспорта логов
  const handleExportLogs = async () => {
    try {
      const token = localStorage.getItem('admin_token');

      if (!token) {
        showModal('Ошибка', 'Необходима авторизация', 'error');
        return;
      }

      const response = await fetch('http://localhost:3000/api/admin/audit-logs/export?format=csv', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Ошибка экспорта логов');
      }

      const csvData = await response.text();
      const blob = new Blob([csvData], { type: 'text/csv; charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit_logs_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      showModal('Успех', 'Логи успешно экспортированы', 'success');
    } catch (error) {
      console.error('Error exporting logs:', error);
      showModal('Ошибка', 'Не удалось экспортировать логи', 'error');
    }
  };

  // Обработчик поиска логов
  const handleSearchLogs = async () => {
    if (!searchLogsQuery.trim()) {
      showModal('Внимание', 'Введите поисковый запрос', 'warning');
      return;
    }

    setSearchLogsLoading(true);
    try {
      const token = localStorage.getItem('admin_token');

      if (!token) {
        showModal('Ошибка', 'Необходима авторизация', 'error');
        setSearchLogsLoading(false);
        return;
      }

      const url = `http://localhost:3000/api/admin/audit-logs/search?query=${encodeURIComponent(searchLogsQuery)}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Ошибка поиска логов');
      }

      const data = await response.json();
      setSearchLogsResults(data.data.logs);
    } catch (error) {
      console.error('Error searching logs:', error);
      showModal('Ошибка', 'Не удалось выполнить поиск', 'error');
    } finally {
      setSearchLogsLoading(false);
    }
  };

  if (loading && books.length === 0) {
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
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {t('books.title')}
            </h1>
            <p className="text-gray-600">
              {t('books.subtitle')}
            </p>
          </div>
          <div className="flex gap-3 items-center">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-4 py-2 rounded-md flex items-center gap-2 ${
                autoRefresh
                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              title={autoRefresh ? 'Автообновление включено (каждые 10 сек)' : 'Автообновление выключено'}
            >
              <svg
                className={`w-5 h-5 ${autoRefresh ? 'animate-spin' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              <span className="text-sm">
                {autoRefresh ? 'Автообновление ВКЛ' : 'Автообновление ВЫКЛ'}
              </span>
            </button>
            <Link
              href="/"
              className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
            >
              {t('books.back')}
            </Link>
          </div>
        </div>

        {/* Статистика */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-4 rounded-lg shadow text-center">
            <h3 className="text-sm font-medium text-gray-700 mb-1">Всего книг</h3>
            <p className="text-2xl font-bold text-gray-900">{total}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow text-center">
            <h3 className="text-sm font-medium text-gray-700 mb-1">Текущая страница</h3>
            <p className="text-2xl font-bold text-blue-600">{currentPage} / {totalPages}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow text-center">
            <h3 className="text-sm font-medium text-gray-700 mb-1">Показано</h3>
            <p className="text-2xl font-bold text-green-600">{books.length}</p>
          </div>
        </div>

        {/* Кнопки для работы с логами */}
        <div className="bg-white rounded-lg shadow mb-6 p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Управление логами</h3>
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={handleExportLogs}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Экспортировать логи
            </button>
            <button
              onClick={() => setSearchLogsModalOpen(true)}
              className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Поиск в логах
            </button>
          </div>
        </div>

        {/* Поиск и фильтры */}
        <div className="bg-white rounded-lg shadow mb-6 p-4">
          <div className="flex gap-4 items-center">
            <form onSubmit={handleSearch} className="flex-1 flex gap-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск по названию или автору..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                spellCheck={true}
                lang="ru"
              />
              <button
                type="submit"
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
              >
                Поиск
              </button>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setCurrentPage(1);
                  }}
                  className="bg-gray-200 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-300"
                >
                  Сбросить
                </button>
              )}
            </form>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Показать:</label>
              <select
                value={limit}
                onChange={(e) => handleLimitChange(Number(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>
        </div>

        {/* Список книг */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold">
              Книги ({books.length} из {total})
            </h2>
          </div>

          {books.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {loading ? 'Загрузка...' : searchQuery ? 'Книги не найдены' : 'Книг пока нет'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {/* Столбец "Книга" */}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <span>{t('books.table.book')}</span>
                        <div className="flex items-center gap-1">
                          {/* Сортировка */}
                          <div className="flex flex-col">
                            <button
                              onClick={() => {
                                setSortBy('title');
                                setSortOrder('asc');
                                setCurrentPage(1);
                              }}
                              className={`hover:text-blue-600 ${sortBy === 'title' && sortOrder === 'asc' ? 'text-blue-600' : 'text-gray-400'}`}
                              title="Сортировка по возрастанию"
                            >
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => {
                                setSortBy('title');
                                setSortOrder('desc');
                                setCurrentPage(1);
                              }}
                              className={`hover:text-blue-600 ${sortBy === 'title' && sortOrder === 'desc' ? 'text-blue-600' : 'text-gray-400'}`}
                              title="Сортировка по убыванию"
                            >
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" />
                              </svg>
                            </button>
                          </div>
                          {/* Фильтр */}
                          <button
                            onClick={() => setShowFilterMenu(showFilterMenu === 'title' ? null : 'title')}
                            className="hover:text-blue-600 text-gray-400"
                            title="Фильтр"
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </th>

                    {/* Столбец "Пользователь" */}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <span>{t('books.table.user')}</span>
                        <div className="flex items-center gap-1">
                          {/* Сортировка */}
                          <div className="flex flex-col">
                            <button
                              onClick={() => {
                                setSortBy('ownerEmail');
                                setSortOrder('asc');
                                setCurrentPage(1);
                              }}
                              className={`hover:text-blue-600 ${sortBy === 'ownerEmail' && sortOrder === 'asc' ? 'text-blue-600' : 'text-gray-400'}`}
                              title="Сортировка по возрастанию"
                            >
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => {
                                setSortBy('ownerEmail');
                                setSortOrder('desc');
                                setCurrentPage(1);
                              }}
                              className={`hover:text-blue-600 ${sortBy === 'ownerEmail' && sortOrder === 'desc' ? 'text-blue-600' : 'text-gray-400'}`}
                              title="Сортировка по убыванию"
                            >
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" />
                              </svg>
                            </button>
                          </div>
                          {/* Фильтр */}
                          <button
                            onClick={() => setShowFilterMenu(showFilterMenu === 'owner' ? null : 'owner')}
                            className="hover:text-blue-600 text-gray-400"
                            title="Фильтр"
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </th>

                    {/* Столбец "Дата/Время" */}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <span>{t('books.table.datetime')}</span>
                        <div className="flex items-center gap-1">
                          {/* Сортировка */}
                          <div className="flex flex-col">
                            <button
                              onClick={() => {
                                setSortBy('createdAt');
                                setSortOrder('asc');
                                setCurrentPage(1);
                              }}
                              className={`hover:text-blue-600 ${sortBy === 'createdAt' && sortOrder === 'asc' ? 'text-blue-600' : 'text-gray-400'}`}
                              title="Сортировка по возрастанию"
                            >
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => {
                                setSortBy('createdAt');
                                setSortOrder('desc');
                                setCurrentPage(1);
                              }}
                              className={`hover:text-blue-600 ${sortBy === 'createdAt' && sortOrder === 'desc' ? 'text-blue-600' : 'text-gray-400'}`}
                              title="Сортировка по убыванию"
                            >
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    </th>

                    {/* Столбец "Описание" (без сортировки/фильтра) */}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('books.table.description')}
                    </th>
                  </tr>

                  {/* Строка с фильтрами */}
                  {showFilterMenu && (
                    <tr className="bg-blue-50">
                      <td colSpan={4} className="px-6 py-3">
                        {showFilterMenu === 'title' && (
                          <div className="flex items-center gap-3">
                            <label className="text-sm font-medium text-gray-700">Фильтр по названию:</label>
                            <input
                              type="text"
                              placeholder="Введите название книги..."
                              className="flex-1 px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  setSearchQuery((e.target as HTMLInputElement).value);
                                  setShowFilterMenu(null);
                                  setCurrentPage(1);
                                }
                              }}
                            />
                            <button
                              onClick={() => setShowFilterMenu(null)}
                              className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm"
                            >
                              Закрыть
                            </button>
                          </div>
                        )}

                        {showFilterMenu === 'owner' && (
                          <div className="flex items-center gap-3">
                            <label className="text-sm font-medium text-gray-700">Фильтр по пользователю:</label>
                            <input
                              type="text"
                              placeholder="Введите email пользователя..."
                              value={filterOwner}
                              onChange={(e) => setFilterOwner(e.target.value)}
                              className="flex-1 px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <button
                              onClick={() => {
                                // Здесь можно добавить логику фильтрации по ownerId
                                setShowFilterMenu(null);
                              }}
                              className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                            >
                              Применить
                            </button>
                            <button
                              onClick={() => {
                                setFilterOwner('');
                                setShowFilterMenu(null);
                              }}
                              className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm"
                            >
                              Очистить
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {books.map((book) => (
                    <tr key={book.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleBookClick(book)}
                          className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline text-left"
                        >
                          {book.title}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {book.ownerEmail || <span className="text-gray-400">—</span>}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                        {formatDate(book.lastEditedAt || book.createdAt)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {book.lastEditDescription || translateEditAction(book.lastEditAction) || '—'}
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
              className="px-4 py-2 bg-white border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              ← Предыдущая
            </button>

            <div className="flex gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                // Показываем первую, последнюю, текущую и по одной с каждой стороны от текущей
                if (
                  page === 1 ||
                  page === totalPages ||
                  (page >= currentPage - 1 && page <= currentPage + 1)
                ) {
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
                } else if (
                  page === currentPage - 2 ||
                  page === currentPage + 2
                ) {
                  return <span key={page} className="px-2">...</span>;
                }
                return null;
              })}
            </div>

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-white border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Следующая →
            </button>
          </div>
        )}

        {/* Modal */}
        <Modal
          isOpen={modal.isOpen}
          onClose={closeModal}
          title={modal.title}
          message={modal.message}
          type={modal.type}
        />

        {/* Book Details Modal */}
        {selectedBook && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Детали книги
                  </h2>
                  <button
                    onClick={closeBookModal}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="border-b pb-4">
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">Основная информация</h3>
                    <div className="grid grid-cols-1 gap-3">
                      <div>
                        <span className="text-sm font-medium text-gray-500">Название:</span>
                        <p className="text-base text-gray-900">{selectedBook.title}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Автор:</span>
                        <p className="text-base text-gray-900">{selectedBook.author || '—'}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Класс:</span>
                        <p className="text-base text-gray-900">{selectedBook.class || '—'}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Количество глав:</span>
                        <p className="text-base text-gray-900">{selectedBook.chaptersCount}</p>
                      </div>
                    </div>
                  </div>

                  <div className="border-b pb-4">
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">Пользователь</h3>
                    <div className="grid grid-cols-1 gap-3">
                      <div>
                        <span className="text-sm font-medium text-gray-500">ID пользователя:</span>
                        <p className="text-base text-gray-900 font-mono text-sm">{selectedBook.ownerId}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Email пользователя:</span>
                        <p className="text-base text-gray-900">{selectedBook.ownerEmail}</p>
                      </div>
                    </div>
                  </div>

                  <div className="border-b pb-4">
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">Даты</h3>
                    <div className="grid grid-cols-1 gap-3">
                      <div>
                        <span className="text-sm font-medium text-gray-500">Создана:</span>
                        <p className="text-base text-gray-900">{formatDate(selectedBook.createdAt)}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Последнее изменение:</span>
                        <p className="text-base text-gray-900">{formatDate(selectedBook.lastEditedAt)}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">История редактирования</h3>
                    <div className="grid grid-cols-1 gap-3">
                      <div>
                        <span className="text-sm font-medium text-gray-500">Описание:</span>
                        <p className="text-base text-gray-900">{selectedBook.lastEditDescription || translateEditAction(selectedBook.lastEditAction) || '—'}</p>
                      </div>
                      {selectedBook.lastEditorEmail && (
                        <>
                          <div>
                            <span className="text-sm font-medium text-gray-500">ID редактора:</span>
                            <p className="text-base text-gray-900 font-mono text-sm">{selectedBook.lastEditedBy}</p>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-gray-500">Email редактора:</span>
                            <p className="text-base text-gray-900">{selectedBook.lastEditorEmail}</p>
                          </div>
                        </>
                      )}

                      {/* Детальные изменения */}
                      {selectedBook.lastAuditExtraData?.changes && selectedBook.lastAuditExtraData.changes.length > 0 && (
                        <div className="mt-4 border-t pt-4">
                          <h4 className="text-md font-semibold text-gray-700 mb-3">Детальные изменения:</h4>
                          <div className="space-y-3">
                            {selectedBook.lastAuditExtraData.changes
                              .filter((change) => {
                                // Показываем только поля где значения действительно изменились
                                const oldFormatted = formatValue(change.oldValue);
                                const newFormatted = formatValue(change.newValue);
                                return oldFormatted !== newFormatted;
                              })
                              .map((change, index) => {
                                const isImageField = change.field === 'coverImageUrl';
                                const oldFormatted = formatValue(change.oldValue);
                                const newFormatted = formatValue(change.newValue);

                                return (
                                  <div key={index} className="bg-gray-50 p-3 rounded-md border border-gray-200">
                                    <div className="flex items-start gap-2">
                                      <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded">
                                        {translateFieldName(change.field)}
                                      </span>
                                    </div>
                                    {isImageField ? (
                                      <div className="mt-2">
                                        <p className="text-sm text-gray-600">Изменена</p>
                                      </div>
                                    ) : (
                                      <div className="mt-2">
                                        <p className="text-sm text-gray-700">
                                          <span className="text-red-600">{oldFormatted}</span>
                                          {' → '}
                                          <span className="text-green-600">{newFormatted}</span>
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={closeBookModal}
                    className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                  >
                    Закрыть
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Search Logs Modal */}
        {searchLogsModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Поиск в логах
                  </h2>
                  <button
                    onClick={() => {
                      setSearchLogsModalOpen(false);
                      setSearchLogsQuery('');
                      setSearchLogsResults([]);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Search Input */}
                <div className="mb-6">
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={searchLogsQuery}
                      onChange={(e) => setSearchLogsQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleSearchLogs();
                        }
                      }}
                      placeholder="Введите поисковый запрос (например: 'название', 'класс')..."
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      disabled={searchLogsLoading}
                    />
                    <button
                      onClick={handleSearchLogs}
                      disabled={searchLogsLoading}
                      className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {searchLogsLoading ? 'Поиск...' : 'Найти'}
                    </button>
                  </div>
                </div>

                {/* Search Results */}
                {searchLogsLoading ? (
                  <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-green-500 border-t-transparent"></div>
                    <p className="mt-2 text-gray-600">Поиск...</p>
                  </div>
                ) : searchLogsResults.length > 0 ? (
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-gray-700 mb-3">
                      Найдено результатов: {searchLogsResults.length}
                    </h3>
                    {searchLogsResults.map((log: any) => (
                      <div key={log.id} className="bg-gray-50 p-4 rounded-md border border-gray-200">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded">
                                {log.action}
                              </span>
                              <span className="text-sm text-gray-500">
                                {log.entityType}
                              </span>
                            </div>
                            <p className="text-base font-medium text-gray-900 mb-1">
                              {log.entityName || log.entityId}
                            </p>
                            <p className="text-sm text-gray-700">
                              {log.description}
                            </p>
                          </div>
                        </div>
                        <div className="mt-2 pt-2 border-t border-gray-200">
                          <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                            <div>
                              <span className="font-medium">Пользователь:</span> {log.userEmail}
                            </div>
                            <div>
                              <span className="font-medium">Дата:</span> {formatDate(log.createdAt)}
                            </div>
                            {log.ipAddress && (
                              <div>
                                <span className="font-medium">IP:</span> {log.ipAddress}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : searchLogsQuery && !searchLogsLoading ? (
                  <div className="text-center py-8 text-gray-500">
                    Ничего не найдено
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    Введите запрос для поиска в логах
                  </div>
                )}

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => {
                      setSearchLogsModalOpen(false);
                      setSearchLogsQuery('');
                      setSearchLogsResults([]);
                    }}
                    className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                  >
                    Закрыть
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
