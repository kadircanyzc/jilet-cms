'use client';

import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: 'danger' | 'primary' | 'success';
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = 'Onayla',
  cancelText = 'İptal',
  confirmVariant = 'primary',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  const confirmButtonStyles = {
    danger: 'bg-red-600 hover:bg-red-700 text-white',
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    success: 'bg-green-600 hover:bg-green-700 text-white',
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-md w-full shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${
              confirmVariant === 'danger' ? 'bg-red-100' : 
              confirmVariant === 'success' ? 'bg-green-100' : 
              'bg-blue-100'
            }`}>
              <AlertTriangle className={`w-6 h-6 ${
                confirmVariant === 'danger' ? 'text-red-600' : 
                confirmVariant === 'success' ? 'text-green-600' : 
                'text-blue-600'
              }`} />
            </div>
            <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-700 text-base leading-relaxed">{message}</p>
        </div>

        {/* Actions */}
        <div className="flex space-x-3 p-6 bg-gray-50 rounded-b-xl">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 transition-colors font-medium"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 px-4 py-3 rounded-xl transition-colors font-medium ${confirmButtonStyles[confirmVariant]}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
