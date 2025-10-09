'use client';

import { useState } from 'react';
import Link from 'next/link';
import ApiService from '@/lib/api';

interface SearchResult {
  type: 'book' | 'chapter' | 'block';
  id: string;
  title?: string;
  description?: string;
  author?: string;
  class?: string;
  bookId?: string;
  bookTitle?: string;
  chapterId?: string;
  chapterTitle?: string;
  textSnippet?: string;
  matchedIn?: string[];
  createdAt: string;
}

interface SearchResults {
  books: SearchResult[];
  chapters: SearchResult[];
  blocks: SearchResult[];
  total: number;
}

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchType, setSearchType] = useState<'all' | 'books' | 'chapters' | 'blocks'>('all');
  const [error, setError] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!query.trim() || query.trim().length < 2) {
      setError('Введите минимум 2 символа');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = ApiService.getToken();
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';

      const response = await fetch(
        `${backendUrl}/api/search?q=${encodeURIComponent(query)}&type=${searchType}&limit=50`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        setResults(data.data.results);
      } else {
        setError(data.error?.message || 'Ошибка поиска');
      }
    } catch (error) {
      console.error('Search error:', error);
      setError('Ошибка подключения к серверу');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              🔍 Поиск по содержимому
            </h1>
            <p className="text-gray-600">
              Поиск по книгам, главам и блокам контента
            </p>
          </div>
          <Link
            href="/"
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            ← Назад к панели
          </Link>
        </div>

        {/* Форма поиска */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex gap-4">
              <input
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setError('');
                }}
                placeholder="Введите запрос для поиска..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                minLength={2}
                spellCheck={true}
                lang="ru"
              />
              <button
                type="submit"
                disabled={loading || query.trim().length < 2}
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Поиск...' : 'Искать'}
              </button>
            </div>

            {error && (
              <div className="text-red-600 text-sm">{error}</div>
            )}

            {/* Фильтры типа поиска */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSearchType('all')}
                className={`px-4 py-2 rounded-md text-sm ${
                  searchType === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Все
              </button>
              <button
                type="button"
                onClick={() => setSearchType('books')}
                className={`px-4 py-2 rounded-md text-sm ${
                  searchType === 'books'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                📚 Книги
              </button>
              <button
                type="button"
                onClick={() => setSearchType('chapters')}
                className={`px-4 py-2 rounded-md text-sm ${
                  searchType === 'chapters'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                📖 Главы
              </button>
              <button
                type="button"
                onClick={() => setSearchType('blocks')}
                className={`px-4 py-2 rounded-md text-sm ${
                  searchType === 'blocks'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                📝 Блоки контента
              </button>
            </div>
          </form>
        </div>

        {/* Результаты поиска */}
        {results && (
          <div className="space-y-6">
            {/* Заголовок результатов */}
            <div className="bg-white p-4 rounded-lg shadow">
              <p className="text-gray-700">
                Найдено результатов: <span className="font-bold">{results.total}</span>
                {query && <span className="text-gray-500"> по запросу "{query}"</span>}
              </p>
            </div>

            {/* Книги */}
            {results.books.length > 0 && (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                  <h2 className="text-xl font-semibold">📚 Книги ({results.books.length})</h2>
                </div>
                <div className="divide-y divide-gray-200">
                  {results.books.map((book) => (
                    <div key={book.id} className="px-6 py-4 hover:bg-gray-50">
                      <h3 className="text-lg font-medium text-gray-900 mb-2">{book.title}</h3>
                      {book.author && (
                        <p className="text-sm text-gray-600 mb-1">Автор: {book.author}</p>
                      )}
                      {book.description && (
                        <p className="text-sm text-gray-700 mb-2">{book.description}</p>
                      )}
                      <div className="flex gap-4 text-xs text-gray-500">
                        {book.class && <span>Класс: {book.class}</span>}
                        <span>Создана: {formatDate(book.createdAt)}</span>
                        {book.matchedIn && book.matchedIn.length > 0 && (
                          <span className="text-blue-600 font-medium">
                            Совпадения в: {book.matchedIn.join(', ')}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Главы */}
            {results.chapters.length > 0 && (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                  <h2 className="text-xl font-semibold">📖 Главы ({results.chapters.length})</h2>
                </div>
                <div className="divide-y divide-gray-200">
                  {results.chapters.map((chapter) => (
                    <div key={chapter.id} className="px-6 py-4 hover:bg-gray-50">
                      <h3 className="text-lg font-medium text-gray-900 mb-2">{chapter.title}</h3>
                      {chapter.description && (
                        <p className="text-sm text-gray-700 mb-2">{chapter.description}</p>
                      )}
                      <div className="flex gap-4 text-xs text-gray-500">
                        <span>Книга: <span className="font-medium">{chapter.bookTitle}</span></span>
                        <span>Создана: {formatDate(chapter.createdAt)}</span>
                        {chapter.matchedIn && chapter.matchedIn.length > 0 && (
                          <span className="text-blue-600 font-medium">
                            Совпадения в: {chapter.matchedIn.join(', ')}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Блоки */}
            {results.blocks.length > 0 && (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                  <h2 className="text-xl font-semibold">📝 Блоки контента ({results.blocks.length})</h2>
                </div>
                <div className="divide-y divide-gray-200">
                  {results.blocks.map((block) => (
                    <div key={block.id} className="px-6 py-4 hover:bg-gray-50">
                      <div className="mb-2">
                        <span className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded">
                          {block.blockType}
                        </span>
                      </div>
                      {block.textSnippet && (
                        <p className="text-sm text-gray-700 mb-3 bg-yellow-50 p-3 rounded border border-yellow-200">
                          {block.textSnippet}
                        </p>
                      )}
                      <div className="flex gap-4 text-xs text-gray-500">
                        <span>Книга: <span className="font-medium">{block.bookTitle}</span></span>
                        <span>Глава: <span className="font-medium">{block.chapterTitle}</span></span>
                        <span>Создан: {formatDate(block.createdAt)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Нет результатов */}
            {results.total === 0 && (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <div className="text-gray-400 text-6xl mb-4">🔍</div>
                <p className="text-gray-500 text-lg mb-2">
                  По запросу "{query}" ничего не найдено
                </p>
                <p className="text-gray-400 text-sm">
                  Попробуйте изменить запрос или выбрать другой тип поиска
                </p>
              </div>
            )}
          </div>
        )}

        {/* Инструкция если нет результатов */}
        {!results && !loading && (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="text-gray-300 text-6xl mb-4">🔍</div>
            <p className="text-gray-500 text-lg mb-4">
              Введите запрос для начала поиска
            </p>
            <div className="text-left max-w-md mx-auto text-sm text-gray-600">
              <p className="font-semibold mb-2">Где ведется поиск:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>В названиях и описаниях книг</li>
                <li>В названиях и описаниях глав</li>
                <li>В текстовом содержимом блоков</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
