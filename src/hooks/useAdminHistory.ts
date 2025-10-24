'use client';

import { useState, useCallback } from 'react';

export interface HistoryAction {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  entityName?: string;
  description: string;
  timestamp: string;
  canUndo: boolean;
  extraData?: any;
}

export interface UseAdminHistoryReturn {
  history: HistoryAction[];
  loading: boolean;
  error: string | null;
  fetchHistory: () => Promise<void>;
  undoAction: (actionId: string) => Promise<boolean>;
  canUndo: (actionId: string) => boolean;
}

/**
 * Хук для управления историей действий администратора
 * Позволяет просматривать и отменять действия
 */
export function useAdminHistory(): UseAdminHistoryReturn {
  const [history, setHistory] = useState<HistoryAction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Загрузка истории действий из audit-логов
   */
  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('admin_token');
      if (!token) {
        throw new Error('Необходима авторизация');
      }

      const response = await fetch('http://localhost:3000/api/admin/audit-logs?limit=50', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Не удалось загрузить историю');
      }

      const data = await response.json();

      // Преобразуем audit-логи в HistoryAction
      const actions: HistoryAction[] = data.data.logs.map((log: any) => ({
        id: log.id,
        action: log.action,
        entityType: log.entityType,
        entityId: log.entityId,
        entityName: log.entityName,
        description: log.description,
        timestamp: log.createdAt,
        canUndo: canUndoAction(log.action, log.entityType),
        extraData: log.extraData
      }));

      setHistory(actions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки истории');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Определяет, можно ли отменить действие
   */
  const canUndo = useCallback((actionId: string): boolean => {
    const action = history.find(a => a.id === actionId);
    return action?.canUndo ?? false;
  }, [history]);

  /**
   * Отменить действие
   */
  const undoAction = useCallback(async (actionId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('admin_token');
      if (!token) {
        throw new Error('Необходима авторизация');
      }

      const response = await fetch(`http://localhost:3000/api/admin/audit-logs/${actionId}/undo`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Не удалось отменить действие');
      }

      // Обновляем историю после отмены
      await fetchHistory();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка отмены действия');
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchHistory]);

  return {
    history,
    loading,
    error,
    fetchHistory,
    undoAction,
    canUndo
  };
}

/**
 * Определяет, можно ли отменить действие на основе его типа
 */
function canUndoAction(action: string, entityType: string): boolean {
  // Действия, которые можно отменить
  const undoableActions = [
    'created',
    'updated',
    'deleted'
  ];

  // Сущности, для которых поддерживается отмена
  const undoableEntities = [
    'book',
    'chapter',
    'block',
    'registration_key',
    'school'
  ];

  // Проверяем, что действие и сущность поддерживают отмену
  const actionMatch = undoableActions.some(a => action.toLowerCase().includes(a));
  const entityMatch = undoableEntities.some(e => entityType.toLowerCase().includes(e));

  return actionMatch && entityMatch;
}
