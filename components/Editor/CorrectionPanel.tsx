import React from 'react';
import type { CorrectionItem } from '../../utils/annotation';
import { Check, X, Sparkles, ArrowRight, AlertCircle } from 'lucide-react';

interface CorrectionPanelProps {
  items: CorrectionItem[];
  activeId: string | null;
  onAccept: (item: CorrectionItem) => void;
  onIgnore: (item: CorrectionItem) => void;
  onSelect: (item: CorrectionItem) => void;
  isOpen: boolean;
  onClose: () => void;
  isLoading?: boolean;
}

export const CorrectionPanel: React.FC<CorrectionPanelProps> = ({
  items,
  activeId,
  onAccept,
  onIgnore,
  onSelect,
  isOpen,
  onClose,
  isLoading = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="w-[400px] bg-white border-l border-gray-200 flex flex-col shrink-0 fixed right-0 top-[103px] bottom-0 z-20 shadow-[-4px_0_16px_rgba(0,0,0,0.05)] font-sans">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-white/80 backdrop-blur-sm z-10">
        <div className="flex items-center gap-2">
            <div className="bg-indigo-50 p-1.5 rounded-lg">
                <Sparkles size={16} className="text-indigo-600" />
            </div>
            <div>
                <h2 className="font-bold text-gray-800 text-sm leading-tight">智能校对</h2>
                <p className="text-[10px] text-gray-400 font-medium">AI 辅助文本优化</p>
            </div>
        </div>
        <div className="flex items-center gap-2">
            {items.length > 0 && (
                <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs font-bold">
                    {items.length}
                </span>
            )}
            <button onClick={onClose} className="text-gray-400 hover:text-gray-700 hover:bg-gray-50 p-1.5 rounded-md transition-all">
                <X size={16} />
            </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar bg-gray-50/30">
        {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center">
                <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-4 shadow-sm ring-4 ring-green-50/50">
                    <Check size={36} className="text-green-500" />
                </div>
                <h3 className="font-semibold text-gray-800 mb-1.5">太棒了！</h3>
                <p className="text-xs text-gray-500 max-w-[180px] leading-relaxed">
                    文章内容文采斐然，未发现明显的拼写或语义错误。
                </p>
            </div>
        ) : (
            items.map((item) => {
              const suggestionText = item.suggestion?.[0]?.[0] || '';
              // 2 is Semantic, others are Typo
              const isSemantic = item.suggestion?.[0]?.[1] === 2;
              const errorType = isSemantic ? '语义优化' : '拼写错误';
              const description = item.suggestion?.[0]?.[5] || item.suggestionList?.[0]?.desc1 || '建议修改';
              
              const isActive = activeId === item.id;
              const hasSuggestion = suggestionText && suggestionText.trim().length > 0;

              return (
                <div
                  key={item.id}
                  id={`correction-card-${item.id}`}
                  onClick={() => onSelect(item)}
                  className={`
                    group relative bg-white rounded-lg border transition-all duration-200 cursor-pointer overflow-hidden
                    ${isActive 
                        ? 'border-indigo-500 shadow-md z-10' 
                        : 'border-gray-200 shadow-sm hover:border-indigo-300 hover:shadow-md'}
                  `}
                >
                  {/* Left active strip */}
                  {isActive && <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-indigo-500" />}

                  <div className={`p-3 ${isActive ? 'pl-4' : ''}`}>
                      {/* Header: Badge */}
                      <div className="flex justify-between items-start mb-2">
                        <div className={`
                            inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border
                            ${isSemantic
                                ? 'bg-amber-50 text-amber-600 border-amber-100'
                                : 'bg-rose-50 text-rose-600 border-rose-100'}
                        `}>
                            {errorType}
                        </div>
                      </div>

                      {/* Main Comparison: Simplified Flow */}
                      <div className="flex items-center flex-wrap gap-2 text-sm mb-2.5 leading-relaxed">
                         <span className="text-gray-400 line-through decoration-rose-300/60 decoration-2 break-all">
                            {item.misspelledWord}
                         </span>
                         <ArrowRight size={14} className="text-gray-300 shrink-0" />
                         <span className="font-semibold text-gray-800 bg-indigo-50/50 px-1 py-0.5 rounded break-all border border-indigo-50">
                            {suggestionText}
                         </span>
                      </div>

                      {/* Description */}
                      <div className="flex items-start gap-1.5">
                          <AlertCircle size={12} className="text-gray-400 mt-0.5 shrink-0" />
                          <p className="text-xs text-gray-500 leading-relaxed">
                              {description}
                          </p>
                      </div>
                  </div>

                  {/* Footer Actions - Slimmer & Subtle */}
                  <div className={`
                      flex border-t border-gray-50 ${hasSuggestion ? 'divide-x divide-gray-50' : ''}
                  `}>
                      <button
                        onClick={(e) => { e.stopPropagation(); onIgnore(item); }}
                        disabled={isLoading}
                        className={`flex-1 py-2 flex items-center justify-center gap-1.5 text-xs font-medium transition-colors
                            ${isLoading ? 'cursor-not-allowed opacity-50 text-gray-300' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}
                        `}
                      >
                        <X size={13} />
                        忽略
                      </button>
                      {hasSuggestion && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onAccept(item); }}
                            disabled={isLoading}
                            className={`flex-1 py-2 flex items-center justify-center gap-1.5 text-xs font-bold transition-colors
                                ${isLoading ? 'cursor-not-allowed opacity-50 text-indigo-300' : 'text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50'}
                            `}
                        >
                            <Check size={13} />
                            采纳
                        </button>
                      )}
                  </div>
                </div>
              );
            })
        )}
      </div>
    </div>
  );
};
