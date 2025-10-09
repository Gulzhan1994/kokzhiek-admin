'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ApiService from '@/lib/api';
import Modal from '@/components/Modal';

interface Book {
  id: string;
  title: string;
  author: string | null;
  class: string | null;
  createdAt: string;
  lastEditedAt: string | null;
  lastEditAction: string | null;
  ownerId: string;
  lastEditedBy: string | null;
  ownerEmail: string;
  lastEditorEmail: string | null;
  chaptersCount: number;
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
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(10);
  const [selectedBooks, setSelectedBooks] = useState<Set<string>>(new Set());
  const [exportingFormat, setExportingFormat] = useState<string | null>(null);
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
    fetchBooks();
  }, [currentPage, searchQuery, limit]);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      const response: BooksResponse = await ApiService.getAllBooks({
        page: currentPage,
        limit,
        search: searchQuery || undefined,
      });

      if (response.success) {
        setBooks(response.data.books);
        setTotal(response.data.total);
        setTotalPages(response.data.totalPages);
      }
    } catch (error) {
      console.error('Error fetching books:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedBooks(new Set(books.map(b => b.id)));
    } else {
      setSelectedBooks(new Set());
    }
  };

  const handleSelectBook = (bookId: string, checked: boolean) => {
    const newSelected = new Set(selectedBooks);
    if (checked) {
      newSelected.add(bookId);
    } else {
      newSelected.delete(bookId);
    }
    setSelectedBooks(newSelected);
  };

  const showModal = (title: string, message: string, type: 'success' | 'error' | 'warning' | 'info') => {
    setModal({ isOpen: true, title, message, type });
  };

  const closeModal = () => {
    setModal({ ...modal, isOpen: false });
  };

  const handleExportSelected = async (format: 'html' | 'docx' | 'pdf') => {
    if (selectedBooks.size === 0) {
      showModal('Ошибка', 'Выберите книги для экспорта', 'warning');
      return;
    }

    try {
      setExportingFormat(format);

      const token = ApiService.getToken();
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';

      if (format === 'pdf') {
        showModal(
          'Информация',
          'PDF генерация будет реализована в следующей версии. Используйте HTML или DOCX формат.',
          'info'
        );
        setExportingFormat(null);
        return;
      }

      let successCount = 0;
      let errorCount = 0;

      // Экспортируем каждую выбранную книгу
      for (const bookId of Array.from(selectedBooks)) {
        const book = books.find(b => b.id === bookId);

        try {
          const response = await fetch(`${backendUrl}/api/export/book/${bookId}/${format}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || 'Ошибка экспорта');
          }

          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${book?.title || 'book'}.${format}`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);

          successCount++;

          // Небольшая задержка между загрузками
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
          console.error(`Export error for book ${bookId}:`, error);
          errorCount++;
        }
      }

      // Очищаем выбор после экспорта
      setSelectedBooks(new Set());

      // Показываем результат
      if (errorCount === 0) {
        showModal(
          'Успешно',
          `Экспортировано ${successCount} ${successCount === 1 ? 'книга' : 'книг'} в формате ${format.toUpperCase()}`,
          'success'
        );
      } else if (successCount === 0) {
        showModal(
          'Ошибка',
          `Не удалось экспортировать ни одну книгу. Проверьте подключение к серверу.`,
          'error'
        );
      } else {
        showModal(
          'Частичный успех',
          `Экспортировано: ${successCount}, Ошибок: ${errorCount}`,
          'warning'
        );
      }
    } catch (error) {
      console.error('Export error:', error);
      showModal(
        'Ошибка',
        error instanceof Error ? error.message : 'Ошибка при экспорте книг',
        'error'
      );
    } finally {
      setExportingFormat(null);
    }
  };

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setCurrentPage(1);
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
              Все книги
            </h1>
            <p className="text-gray-600">
              Просмотр всех книг в системе с историей редактирования
            </p>
          </div>
          <div className="flex gap-3 items-center">
            {selectedBooks.size > 0 && (
              <div className="flex gap-2 items-center">
                <span className="text-sm text-gray-600">
                  Выбрано: {selectedBooks.size}
                </span>
                <button
                  onClick={() => handleExportSelected('html')}
                  disabled={!!exportingFormat}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm"
                >
                  {exportingFormat === 'html' ? 'Экспорт...' : '📄 HTML'}
                </button>
                <button
                  onClick={() => handleExportSelected('docx')}
                  disabled={!!exportingFormat}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 text-sm"
                >
                  {exportingFormat === 'docx' ? 'Экспорт...' : '📝 DOCX'}
                </button>
                <button
                  onClick={() => handleExportSelected('pdf')}
                  disabled={!!exportingFormat}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 text-sm"
                >
                  {exportingFormat === 'pdf' ? 'Экспорт...' : '📕 PDF'}
                </button>
              </div>
            )}
            <Link
              href="/"
              className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
            >
              ← Назад
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
                    <th className="px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedBooks.size === books.length && books.length > 0}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Название книги
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Класс
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Глав
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Создана
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Последнее изменение
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Редактор (логин)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Что изменено
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {books.map((book) => (
                    <tr key={book.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedBooks.has(book.id)}
                          onChange={(e) => handleSelectBook(book.id, e.target.checked)}
                          className="w-4 h-4 text-blue-600 rounded"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {book.title}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {book.class || <span className="text-gray-400">—</span>}
                      </td>
                      <td className="px-6 py-4 text-sm text-center text-gray-900">
                        {book.chaptersCount}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                        {formatDate(book.createdAt)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                        {formatDate(book.lastEditedAt)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {book.lastEditorEmail ? (
                          <span
                            className="font-medium cursor-help"
                            title={`Email: ${book.lastEditorEmail}`}
                          >
                            {book.lastEditorEmail.split('@')[0]}
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {translateEditAction(book.lastEditAction)}
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
      </div>
    </div>
  );
}
