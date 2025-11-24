import React from 'react';
import type { CorrectionItem } from '../../utils/annotation';
import { Check, X, Sparkles, ArrowRight, AlertCircle, RotateCcw, CheckCircle2, XCircle } from 'lucide-react';

interface CorrectionPanelProps {
  items: CorrectionItem[];
  activeId: string | null;
  onAccept: (item: CorrectionItem) => void;
  onIgnore: (item: CorrectionItem) => void;
  onUndo: (item: CorrectionItem) => void;
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
  onUndo,
  onSelect,
  isOpen,
  onClose,
  isLoading = false,
}) => {
  if (!isOpen) return null;

  const pendingItems = items.filter(i => !i.result);
  const historyItems = items.filter(i => i.result);

  const renderItem = (item: CorrectionItem, isHistory: boolean = false) => {
      const suggestionText = item.suggestion?.[0]?.[0] || '';
      // 2 is Semantic, others are Typo
      const isSemantic = item.suggestion?.[0]?.[1] === 2;
      const errorType = isSemantic ? '语义优化' : '拼写错误';
      const description = item.suggestion?.[0]?.[5] || item.suggestionList?.[0]?.desc1 || '建议修改';
      
      const isActive = activeId === item.id;
      const hasSuggestion = suggestionText && suggestionText.trim().length > 0;
      const isAccepted = item.result === 'accepted';
      const isIgnored = item.result === 'ignored';

      return (
        <div
          key={item.id}
          id={`correction-card-${item.id}`}
          onClick={() => {
              console.log("Clicking item:", item.id);
              onSelect(item);
          }}
          className={`
            group relative bg-white dark:bg-gray-800 rounded-lg border transition-all duration-200 cursor-pointer overflow-hidden
            ${isActive 
                ? 'border-indigo-500 dark:border-indigo-500 shadow-md z-10' 
                : 'border-gray-200 dark:border-gray-700 shadow-sm hover:border-indigo-300 dark:hover:border-indigo-500/50 hover:shadow-md'}
            ${isHistory ? 'opacity-75 hover:opacity-100 grayscale-[0.3] hover:grayscale-0' : ''}
          `}
        >
          {/* Left active strip */}
          {isActive && <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-indigo-500" />}

          <div className={`p-3 ${isActive ? 'pl-4' : ''}`}>
              {/* Header: Badge */}
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                    <div className={`
                        inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border
                        ${isSemantic
                            ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/50'
                            : 'bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-900/50'}
                    `}>
                        {errorType}
                    </div>
                    
                    {/* History Status Badge */}
                    {isHistory && (
                        <div className={`
                            inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border
                            ${isAccepted 
                                ? 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 border-green-100 dark:border-green-900/50' 
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-600'}
                        `}>
                            {isAccepted ? (
                                <>
                                    <CheckCircle2 size={10} /> 已采纳
                                </>
                            ) : (
                                <>
                                    <XCircle size={10} /> 已忽略
                                </>
                            )}
                        </div>
                    )}
                </div>
              </div>

              {/* Main Comparison: Simplified Flow */}
              <div className="flex items-center flex-wrap gap-2 text-sm mb-2.5 leading-relaxed">
                 <span className="text-gray-400 dark:text-gray-500 line-through decoration-rose-300/60 decoration-2 break-all">
                    {item.misspelledWord}
                 </span>
                 <ArrowRight size={14} className="text-gray-300 dark:text-gray-600 shrink-0" />
                 <span className="font-semibold text-gray-800 dark:text-gray-100 bg-indigo-50/50 dark:bg-indigo-900/20 px-1 py-0.5 rounded break-all border border-indigo-50 dark:border-indigo-900/30">
                    {suggestionText}
                 </span>
              </div>

              {/* Description */}
              <div className="flex items-start gap-1.5">
                  <AlertCircle size={12} className="text-gray-400 dark:text-gray-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                      {description}
                  </p>
              </div>
          </div>

          {/* Footer Actions */}
          <div className={`
              flex border-t border-gray-50 dark:border-gray-700 
              ${!isHistory && hasSuggestion ? 'divide-x divide-gray-50 dark:divide-gray-700' : ''}
          `}>
              {isHistory ? (
                  <button
                    onClick={(e) => { e.stopPropagation(); onUndo(item); }}
                    className="flex-1 py-2 flex items-center justify-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <RotateCcw size={13} />
                    撤销操作
                  </button>
              ) : (
                  <>
                      <button
                        onClick={(e) => { e.stopPropagation(); onIgnore(item); }}
                        disabled={isLoading}
                        className={`flex-1 py-2 flex items-center justify-center gap-1.5 text-xs font-medium transition-colors
                            ${isLoading 
                                ? 'cursor-not-allowed opacity-50 text-gray-300 dark:text-gray-600' 
                                : 'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}
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
                                ${isLoading 
                                    ? 'cursor-not-allowed opacity-50 text-indigo-300 dark:text-indigo-800' 
                                    : 'text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20'}
                            `}
                        >
                            <Check size={13} />
                            采纳
                        </button>
                      )}
                  </>
              )}
          </div>
        </div>
      );
  };

  return (
    <div className="w-[400px] bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 flex flex-col shrink-0 fixed right-0 top-[103px] bottom-0 z-20 shadow-[-4px_0_16px_rgba(0,0,0,0.05)] font-sans transition-colors duration-200">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-10">
        <div className="flex items-center gap-2">
            <div className="bg-indigo-50 dark:bg-indigo-900/30 p-1.5 rounded-lg">
                <Sparkles size={16} className="text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
                <h2 className="font-bold text-gray-800 dark:text-gray-100 text-sm leading-tight">智能校对</h2>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">AI 辅助文本优化</p>
            </div>
        </div>
        <div className="flex items-center gap-2">
            {(items.length > 0) && (
                <span className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full text-xs font-bold">
                    {pendingItems.length} / {items.length}
                </span>
            )}
            <button onClick={onClose} className="text-gray-400 hover:text-gray-700 dark:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 p-1.5 rounded-md transition-all">
                <X size={16} />
            </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar bg-gray-50/30 dark:bg-black/20">
        {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center">
                <div className="w-20 h-20 bg-green-50 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-4 shadow-sm ring-4 ring-green-50/50 dark:ring-green-900/10">
                    <Check size={36} className="text-green-500 dark:text-green-400" />
                </div>
                <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-1.5">太棒了！</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 max-w-[180px] leading-relaxed">
                    文章内容文采斐然，未发现明显的拼写或语义错误。
                </p>
            </div>
        ) : (
            <div className="space-y-3">
                {items.map(item => renderItem(item, !!item.result))}
            </div>
        )}
      </div>
    </div>
  );
};
