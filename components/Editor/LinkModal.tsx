import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from '../../contexts/I18nContext';

interface LinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (text: string, url: string) => void;
  initialText: string;
  initialUrl: string;
}

export const LinkModal: React.FC<LinkModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  initialText,
  initialUrl,
}) => {
  const { t } = useTranslation();
  const [text, setText] = useState(initialText);
  const [url, setUrl] = useState(initialUrl);
  const modalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setText(initialText);
      setUrl(initialUrl);
      // Focus URL input if text is present, otherwise focus text
      setTimeout(() => {
        if (initialText) {
          inputRef.current?.focus();
        } else {
           // Find text input
           const inputs = modalRef.current?.querySelectorAll('input');
           if(inputs && inputs[0]) inputs[0].focus();
        }
      }, 50);
    }
  }, [isOpen, initialText, initialUrl]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(text, url);
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/20 backdrop-blur-sm">
      <div 
        ref={modalRef}
        className="bg-white rounded-lg shadow-2xl w-96 p-6 animate-in fade-in zoom-in-95 duration-200 border border-gray-100"
      >
        <h3 className="text-lg font-semibold text-gray-800 mb-4">{t('modal.link.title')}</h3>
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('modal.link.text')}
            </label>
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-lark-blue focus:ring-2 focus:ring-lark-blue/20 transition-all"
              placeholder="Display text"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('modal.link.url')}
            </label>
            <input
              ref={inputRef}
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-lark-blue focus:ring-2 focus:ring-lark-blue/20 transition-all"
              placeholder="https://..."
            />
          </div>

          <div className="flex items-center justify-end gap-3 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
            >
              {t('modal.cancel')}
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-lark-blue hover:bg-lark-blueHover rounded-md transition-colors shadow-sm"
            >
              {t('modal.confirm')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};