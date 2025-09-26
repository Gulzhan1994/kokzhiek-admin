'use client';

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  keyCode?: string;
}

export default function SuccessModal({ isOpen, onClose, title, message, keyCode }: SuccessModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" onClick={onClose}>
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white" onClick={e => e.stopPropagation()}>
        <div className="mt-3 text-center">
          {/* Success Icon */}
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
            <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>

          {/* Title */}
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-2">
            {title}
          </h3>

          {/* Message */}
          <div className="mt-2 px-7 py-3">
            <p className="text-sm text-gray-500 mb-3">
              {message}
            </p>

            {/* Key Code Display */}
            {keyCode && (
              <div className="bg-gray-100 rounded-md p-3 mb-4">
                <p className="text-xs text-gray-600 mb-1">Код ключа:</p>
                <p className="font-mono text-sm font-medium text-gray-900 select-all">
                  {keyCode}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Кликните чтобы выделить
                </p>
              </div>
            )}
          </div>

          {/* Close Button */}
          <div className="items-center px-4 py-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-green-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-300"
            >
              Понятно
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}