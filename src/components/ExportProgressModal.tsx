'use client';

import React from 'react';
import { Download, CheckCircle, X } from 'lucide-react';

interface ExportProgressModalProps {
  isOpen: boolean;
  progress: number;
  status: string;
  onClose?: () => void;
}

export function ExportProgressModal({
  isOpen,
  progress,
  status,
  onClose
}: ExportProgressModalProps) {
  if (!isOpen) return null;

  const isComplete = progress >= 100;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            {isComplete ? (
              <CheckCircle className="w-6 h-6 text-green-600" />
            ) : (
              <Download className="w-6 h-6 text-blue-600 animate-bounce" />
            )}
            <h2 className="text-xl font-bold text-gray-900">
              {isComplete ? 'Экспорт завершен' : 'Экспорт данных'}
            </h2>
          </div>
          {isComplete && onClose && (
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                isComplete
                  ? 'bg-green-600'
                  : 'bg-blue-600 animate-pulse'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between items-center mt-2">
            <span className="text-sm text-gray-600">{status}</span>
            <span className="text-sm font-semibold text-gray-900">
              {progress}%
            </span>
          </div>
        </div>

        {/* Additional Info */}
        {!isComplete && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <p className="text-sm text-blue-800">
              Пожалуйста, подождите. Экспорт больших файлов может занять некоторое время.
            </p>
          </div>
        )}

        {isComplete && (
          <div className="bg-green-50 border border-green-200 rounded-md p-3">
            <p className="text-sm text-green-800">
              Файл успешно загружен. Проверьте папку загрузок.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
