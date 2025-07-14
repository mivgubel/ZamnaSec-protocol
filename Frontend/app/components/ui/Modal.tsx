import React, { useEffect } from 'react';
import type { ModalProps } from '../../types';

export default function Modal({ open, onClose, title, children }: ModalProps) {
  // Handle escape key press
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && open) {
        onClose();
      }
    };

    if (open) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 backdrop-blur-sm bg-white/10"
        aria-hidden="true"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative bg-white/50 border border-blue-200 rounded-2xl p-0 w-full max-w-md mx-4 shadow-xl font-sans text-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-4 pb-2 border-b border-blue-100">
          <h3
            id="modal-title"
            className="text-lg font-bold"
            style={{ color: '#1e293b' }}
          >
            {title}
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-[#1e293b] text-2xl font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded ml-2"
            aria-label="Close modal"
          >
            &times;
          </button>
        </div>
        
        {/* Body */}
        <div className="p-6 pt-4">
          {children}
        </div>
      </div>
    </div>
  );
} 