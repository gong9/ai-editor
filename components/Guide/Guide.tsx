import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Sparkles, X } from 'lucide-react';
import { useTranslation } from '../../contexts/I18nContext';

interface GuideProps {
  onClose: () => void;
}

export const Guide: React.FC<GuideProps> = ({ onClose }) => {
  const { t } = useTranslation();
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Short delay to ensure toolbar is rendered
    const timer = setTimeout(() => {
      const element = document.getElementById('toolbar-correction-btn');
      if (element) {
        setTargetRect(element.getBoundingClientRect());
        setIsVisible(true);
      }
    }, 500);

    const handleResize = () => {
      const element = document.getElementById('toolbar-correction-btn');
      if (element) {
        setTargetRect(element.getBoundingClientRect());
      }
    };

    window.addEventListener('resize', handleResize);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  if (!isVisible || !targetRect) return null;

  // Calculate position (below the button, slightly centered)
  const top = targetRect.bottom + 12;
  const left = targetRect.left + targetRect.width / 2 - 140; // Center the 280px wide tooltip

  return createPortal(
    <div className="fixed inset-0 z-[9999] pointer-events-none">
      {/* Backdrop - Optional, minimal dimming */}
      {/* <div className="absolute inset-0 bg-black/10" /> */}

      {/* Tooltip Container */}
      <div 
        className="absolute pointer-events-auto animate-in fade-in slide-in-from-top-2 duration-300"
        style={{ top, left }}
      >
        {/* Arrow */}
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-3 h-3 bg-white dark:bg-zinc-900 border-t border-l border-zinc-100 dark:border-zinc-800 rotate-45 z-10" />
        
        {/* Content */}
        <div className="relative bg-white dark:bg-zinc-900 p-4 rounded-lg shadow-[0_4px_20px_rgb(0,0,0,0.08)] w-[260px] flex flex-col gap-2.5 border border-zinc-100 dark:border-zinc-800 z-20">
           <div className="flex justify-between items-start">
              <div className="flex items-center gap-2 font-semibold text-sm text-zinc-900 dark:text-zinc-100">
                 <Sparkles size={14} className="text-amber-500 fill-amber-500" />
                 <span>{t('guide.title')}</span>
              </div>
              <button 
                onClick={onClose}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors p-0.5"
              >
                <X size={14} />
              </button>
           </div>
           
           <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
             {t('guide.description')}
           </p>

           <div className="flex justify-end pt-1">
             <button 
               onClick={onClose}
               className="text-xs font-medium bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 px-3 py-1.5 rounded transition-colors"
             >
               {t('guide.got_it')}
             </button>
           </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

