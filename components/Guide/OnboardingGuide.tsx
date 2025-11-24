import React, { useEffect, useState, useRef } from 'react';
import { Sparkles, X } from 'lucide-react';

interface OnboardingGuideProps {
  onClose?: () => void;
}

export const OnboardingGuide: React.FC<OnboardingGuideProps> = ({ onClose }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const guideRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check if user has seen the guide
    const hasSeen = localStorage.getItem('larklite_correction_guide_seen');
    if (hasSeen) return;

    // Try to find the target button
    const findTarget = () => {
      const target = document.getElementById('toolbar-correction-btn');
      if (target) {
        const rect = target.getBoundingClientRect();
        setPosition({
          top: rect.bottom + 12, // 12px offset
          left: rect.left + rect.width / 2
        });
        setIsVisible(true);
      } else {
        // Retry if not found yet (e.g. animation/loading)
        requestAnimationFrame(findTarget);
      }
    };

    // Delay slightly to ensure layout is stable
    const timer = setTimeout(findTarget, 1000);
    
    // Handle resize
    window.addEventListener('resize', findTarget);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', findTarget);
    };
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('larklite_correction_guide_seen', 'true');
    if (onClose) onClose();
  };

  if (!isVisible || !position) return null;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      {/* Spotlight Effect (Optional: Darken rest of screen slightly?) -> No, keep it non-intrusive */}
      
      {/* Tooltip Container */}
      <div 
        ref={guideRef}
        className="absolute pointer-events-auto flex flex-col items-center animate-in fade-in slide-in-from-top-2 duration-500"
        style={{ 
          top: position.top, 
          left: position.left,
          transform: 'translateX(-50%)' 
        }}
      >
        {/* Arrow */}
        <div className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-b-[8px] border-b-indigo-600 dark:border-b-indigo-500 -mb-px"></div>
        
        {/* Card */}
        <div className="bg-indigo-600 dark:bg-indigo-500 text-white p-4 rounded-xl shadow-xl max-w-xs w-72 relative">
          <button 
            onClick={handleDismiss}
            className="absolute top-2 right-2 text-indigo-200 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>

          <div className="flex items-start gap-3">
            <div className="bg-white/20 p-2 rounded-lg shrink-0">
              <Sparkles size={20} className="text-white" />
            </div>
            <div>
              <h3 className="font-bold text-sm mb-1">试试 AI 智能校对</h3>
              <p className="text-xs text-indigo-100 leading-relaxed mb-3">
                点击这里，让 AI 帮你检查拼写错误、语法问题，并提供润色建议。
              </p>
              <button
                onClick={handleDismiss}
                className="bg-white text-indigo-600 text-xs font-bold px-3 py-1.5 rounded hover:bg-indigo-50 transition-colors shadow-sm"
              >
                知道了
              </button>
            </div>
          </div>
          
          {/* Pulse Ring Animation on the button area (visual only, rendered here but positioned at button) */}
        </div>
      </div>
      
      {/* Ping Animation at the target source */}
      <span 
        className="absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75 animate-ping"
        style={{
            top: position.top - 40, // Approximate back to button center
            left: position.left - 15, 
            width: 30,
            height: 30,
            display: 'none' // Disabled for now, might conflict with layout
        }}
      ></span>
    </div>
  );
};

