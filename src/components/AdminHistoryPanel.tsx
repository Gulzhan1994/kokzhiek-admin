'use client';

import React, { useEffect, useState } from 'react';
import { useAdminHistory, HistoryAction } from '@/hooks/useAdminHistory';
import { Undo2, History, X, AlertCircle, CheckCircle, XCircle, RefreshCw } from 'lucide-react';

interface AdminHistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onActionUndone?: () => void;
}

export function AdminHistoryPanel({ isOpen, onClose, onActionUndone }: AdminHistoryPanelProps) {
  const { history, loading, error, fetchHistory, undoAction, canUndo } = useAdminHistory();
  const [selectedAction, setSelectedAction] = useState<HistoryAction | null>(null);
  const [undoLoading, setUndoLoading] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchHistory();
    }
  }, [isOpen, fetchHistory]);

  // Автообновление каждые 10 секунд
  useEffect(() => {
    if (!autoRefresh || !isOpen) return;

    const interval = setInterval(() => {
      fetchHistory();
    }, 10000);

    return () => clearInterval(interval);
  }, [autoRefresh, isOpen, fetchHistory]);

  const handleUndo = async (actionId: string) => {
    if (!confirm('Вы уверены, что хотите отменить это действие?')) {
      return;
    }

    setUndoLoading(actionId);
    const success = await undoAction(actionId);
    setUndoLoading(null);

    if (success) {
      alert('Действие успешно отменено');
      onActionUndone?.();
    } else {
      alert('Не удалось отменить действие');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ru-RU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const translateAction = (action: string): string => {
    const translations: Record<string, string> = {
      'created': 'Создано',
      'updated': 'Обновлено',
      'deleted': 'Удалено',
      'logged_in': 'Вход',
      'logged_out': 'Выход'
    };
    return translations[action.toLowerCase()] || action;
  };

  const translateEntityType = (entityType: string): string => {
    const translations: Record<string, string> = {
      'book': 'Книга',
      'chapter': 'Глава',
      'block': 'Блок',
      'registration_key': 'Ключ регистрации',
      'school': 'Школа',
      'user': 'Пользователь'
    };
    return translations[entityType.toLowerCase()] || entityType;
  };

  const getActionIcon = (action: string) => {
    const lowerAction = action.toLowerCase();
    if (lowerAction.includes('created')) {
      return <CheckCircle className="w-4 h-4 text-green-600" />;
    } else if (lowerAction.includes('updated')) {
      return <RefreshCw className="w-4 h-4 text-blue-600" />;
    } else if (lowerAction.includes('deleted')) {
      return <XCircle className="w-4 h-4 text-red-600" />;
    }
    return <AlertCircle className="w-4 h-4 text-gray-600" />;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <History className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900">
              История действий
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-3 py-1.5 rounded-md text-sm flex items-center gap-2 ${
                autoRefresh
                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              title={autoRefresh ? 'Автообновление включено' : 'Автообновление выключено'}
            >
              <RefreshCw className={`w-4 h-4 ${autoRefresh ? 'animate-spin' : ''}`} />
              <span>{autoRefresh ? 'Авто' : 'Вкл'}</span>
            </button>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading && history.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
              <p className="mt-4 text-gray-600">Загрузка истории...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <p className="text-red-600">{error}</p>
              <button
                onClick={fetchHistory}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Попробовать снова
              </button>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <History className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p>История действий пуста</p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((action) => (
                <div
                  key={action.id}
                  className={`bg-gray-50 p-4 rounded-lg border transition-all ${
                    selectedAction?.id === action.id
                      ? 'border-blue-500 shadow-md'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedAction(action)}
                >
                  <div className="flex items-start justify-between gap-4">
                    {/* Left side: Action info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getActionIcon(action.action)}
                        <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded">
                          {translateAction(action.action)}
                        </span>
                        <span className="text-sm text-gray-600">
                          {translateEntityType(action.entityType)}
                        </span>
                        {action.canUndo && (
                          <span className="inline-block px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
                            Можно отменить
                          </span>
                        )}
                      </div>

                      <p className="text-base font-medium text-gray-900 mb-1">
                        {action.entityName || action.entityId}
                      </p>

                      <p className="text-sm text-gray-700 mb-2">
                        {action.description}
                      </p>

                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>
                          {formatDate(action.timestamp)}
                        </span>
                        {action.extraData?.userEmail && (
                          <span>
                            Пользователь: {action.extraData.userEmail}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right side: Undo button */}
                    {action.canUndo && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUndo(action.id);
                        }}
                        disabled={undoLoading === action.id}
                        className="px-4 py-2 bg-orange-100 text-orange-700 hover:bg-orange-200 rounded-md flex items-center gap-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Отменить это действие"
                      >
                        {undoLoading === action.id ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Отмена...</span>
                          </>
                        ) : (
                          <>
                            <Undo2 className="w-4 h-4" />
                            <span>Отменить</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {/* Extra data details (if selected) */}
                  {selectedAction?.id === action.id && action.extraData?.changes && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">
                        Детальные изменения:
                      </h4>
                      <div className="space-y-2">
                        {action.extraData.changes.map((change: any, index: number) => (
                          <div key={index} className="text-xs bg-white p-2 rounded border border-gray-200">
                            <span className="font-medium text-gray-700">{change.field}:</span>{' '}
                            <span className="text-red-600">{JSON.stringify(change.oldValue)}</span>
                            {' → '}
                            <span className="text-green-600">{JSON.stringify(change.newValue)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center">
          <p className="text-sm text-gray-600">
            Показано действий: {history.length}
          </p>
          <div className="flex gap-3">
            <button
              onClick={fetchHistory}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Обновить
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              Закрыть
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
