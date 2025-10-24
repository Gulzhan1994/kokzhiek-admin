'use client';

import React, { useState, useEffect } from 'react';
import { Search, Replace, X, AlertCircle, CheckCircle, Loader } from 'lucide-react';

interface FindReplaceResult {
  bookId: string;
  bookTitle: string;
  field: string;
  oldValue: string;
  newValue: string;
  matchCount: number;
}

interface FindReplaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

export function FindReplaceModal({ isOpen, onClose, onComplete }: FindReplaceModalProps) {
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [searchField, setSearchField] = useState<'title' | 'author' | 'all'>('all');
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);
  const [useRegex, setUseRegex] = useState(false);

  const [searching, setSearching] = useState(false);
  const [replacing, setReplacing] = useState(false);
  const [searchResults, setSearchResults] = useState<FindReplaceResult[]>([]);
  const [replaceResults, setReplaceResults] = useState<FindReplaceResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Очистка состояния при закрытии
  useEffect(() => {
    if (!isOpen) {
      setFindText('');
      setReplaceText('');
      setSearchResults([]);
      setReplaceResults([]);
      setError(null);
      setSuccess(null);
    }
  }, [isOpen]);

  const handleSearch = async () => {
    if (!findText.trim()) {
      setError('Введите текст для поиска');
      return;
    }

    setSearching(true);
    setError(null);
    setSearchResults([]);

    try {
      const token = localStorage.getItem('admin_token');
      if (!token) {
        throw new Error('Необходима авторизация');
      }

      const response = await fetch('http://localhost:3000/api/admin/books/find', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          findText,
          searchField,
          caseSensitive,
          wholeWord,
          useRegex
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Ошибка поиска');
      }

      const data = await response.json();
      setSearchResults(data.data.results);

      if (data.data.results.length === 0) {
        setError('Совпадений не найдено');
      } else {
        setSuccess(`Найдено совпадений: ${data.data.results.length}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при поиске');
      console.error('Search error:', err);
    } finally {
      setSearching(false);
    }
  };

  const handleReplace = async () => {
    if (!findText.trim()) {
      setError('Введите текст для поиска');
      return;
    }

    if (!replaceText && replaceText !== '') {
      setError('Введите текст для замены');
      return;
    }

    if (!confirm(`Вы уверены, что хотите заменить "${findText}" на "${replaceText}"?\n\nЭто действие нельзя будет отменить.`)) {
      return;
    }

    setReplacing(true);
    setError(null);
    setReplaceResults([]);

    try {
      const token = localStorage.getItem('admin_token');
      if (!token) {
        throw new Error('Необходима авторизация');
      }

      const response = await fetch('http://localhost:3000/api/admin/books/replace', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          findText,
          replaceText,
          searchField,
          caseSensitive,
          wholeWord,
          useRegex
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Ошибка замены');
      }

      const data = await response.json();
      setReplaceResults(data.data.results);
      setSuccess(`Успешно заменено в ${data.data.results.length} книгах`);

      // Очищаем результаты поиска после замены
      setSearchResults([]);

      // Вызываем callback для обновления списка книг
      if (onComplete) {
        onComplete();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при замене');
      console.error('Replace error:', err);
    } finally {
      setReplacing(false);
    }
  };

  const handleReplaceAll = async () => {
    await handleReplace();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <Replace className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900">
              Найти и заменить
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Find Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Найти:
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={findText}
                onChange={(e) => setFindText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSearch();
                  }
                }}
                placeholder="Введите текст для поиска..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={searching || replacing}
              />
            </div>
          </div>

          {/* Replace Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Заменить на:
            </label>
            <input
              type="text"
              value={replaceText}
              onChange={(e) => setReplaceText(e.target.value)}
              placeholder="Введите текст для замены..."
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={searching || replacing}
            />
          </div>

          {/* Search Options */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Область поиска:
            </label>
            <select
              value={searchField}
              onChange={(e) => setSearchField(e.target.value as 'title' | 'author' | 'all')}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={searching || replacing}
            >
              <option value="all">Во всех полях</option>
              <option value="title">Только в названиях</option>
              <option value="author">Только в авторах</option>
            </select>
          </div>

          {/* Advanced Options */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Дополнительные параметры:
            </label>
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={caseSensitive}
                  onChange={(e) => setCaseSensitive(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  disabled={searching || replacing}
                />
                <span className="text-sm text-gray-700">Учитывать регистр (Аа)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={wholeWord}
                  onChange={(e) => setWholeWord(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  disabled={searching || replacing}
                />
                <span className="text-sm text-gray-700">Только целые слова</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useRegex}
                  onChange={(e) => setUseRegex(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  disabled={searching || replacing}
                />
                <span className="text-sm text-gray-700">Регулярное выражение (regex)</span>
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleSearch}
              disabled={searching || replacing || !findText.trim()}
              className="flex-1 bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {searching ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  <span>Поиск...</span>
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  <span>Найти</span>
                </>
              )}
            </button>
            <button
              onClick={handleReplaceAll}
              disabled={searching || replacing || !findText.trim() || replaceText === null}
              className="flex-1 bg-orange-600 text-white px-6 py-2 rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {replacing ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  <span>Замена...</span>
                </>
              ) : (
                <>
                  <Replace className="w-5 h-5" />
                  <span>Заменить всё</span>
                </>
              )}
            </button>
          </div>

          {/* Messages */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 rounded-md p-3 flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-green-800">{success}</p>
            </div>
          )}

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-3">
                Результаты поиска ({searchResults.length}):
              </h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {searchResults.map((result, index) => (
                  <div key={index} className="bg-gray-50 p-3 rounded-md border border-gray-200">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{result.bookTitle}</p>
                        <p className="text-sm text-gray-600">
                          Поле: <span className="font-medium">{result.field}</span>
                        </p>
                        <p className="text-sm text-gray-600">
                          Совпадений: <span className="font-medium">{result.matchCount}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Replace Results */}
          {replaceResults.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-3">
                Результаты замены ({replaceResults.length}):
              </h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {replaceResults.map((result, index) => (
                  <div key={index} className="bg-green-50 p-3 rounded-md border border-green-200">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{result.bookTitle}</p>
                        <p className="text-sm text-gray-600">
                          Поле: <span className="font-medium">{result.field}</span>
                        </p>
                        <p className="text-sm text-gray-700">
                          <span className="text-red-600">{result.oldValue}</span>
                          {' → '}
                          <span className="text-green-600">{result.newValue}</span>
                        </p>
                        <p className="text-sm text-gray-600">
                          Заменено: <span className="font-medium">{result.matchCount}</span> совпадений
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3 sticky bottom-0 bg-white">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
}
