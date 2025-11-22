import React, { useState, useEffect } from 'react';
import { Editor } from '@tiptap/react';
import { 
  Bold, 
  Italic, 
  Underline, 
  Strikethrough, 
  Highlighter, 
  Code, 
  Link,
  Sparkles,
  ChevronDown
} from 'lucide-react';
import { useTranslation } from '../../contexts/I18nContext';

interface EditorBubbleMenuProps {
  editor: Editor;
  onAiClick: () => void;
  onLinkClick: () => void;
}

export const EditorBubbleMenu: React.FC<EditorBubbleMenuProps> = ({ editor, onAiClick, onLinkClick }) => {
  const { t } = useTranslation();
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<{ x: number; y: number } | null>(null);

  // 监听右键菜单
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      // 检查是否有选中文本
      const { state } = editor;
      if (state.selection.empty) return;
      if (editor.isActive('image') || editor.isActive('codeBlock')) return;

      // 检查是否在编辑器内
      const target = e.target as HTMLElement;
      if (!target.closest('.ProseMirror')) return;

      e.preventDefault();
      
      // 获取选中文本的位置
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        
        // 显示在选中文本上方，与第一行选中开始位置左对齐
        setMenuPosition({ 
          x: rect.left + window.scrollX,  // 左对齐
          y: rect.top + window.scrollY - 50
        });
      } else {
        // 降级方案：鼠标点击位置
        setMenuPosition({ x: e.clientX, y: e.clientY - 50 });
      }
    };

    const handleClick = () => {
      setMenuPosition(null);
      setIsSelectorOpen(false);
    };

    const handleScroll = () => {
      // 滚动时隐藏菜单
      setMenuPosition(null);
      setIsSelectorOpen(false);
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('click', handleClick);
    document.addEventListener('scroll', handleScroll, true); // true 表示捕获阶段，可以捕获所有滚动

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('click', handleClick);
      document.removeEventListener('scroll', handleScroll, true);
    };
  }, [editor]);

  if (!editor || !menuPosition) return null;

  const getCurrentNodeType = () => {
    if (editor.isActive('heading', { level: 1 })) return t('toolbar.h1');
    if (editor.isActive('heading', { level: 2 })) return t('toolbar.h2');
    if (editor.isActive('heading', { level: 3 })) return t('toolbar.h3');
    return t('toolbar.text');
  };

  return (
    <div
      className="fixed z-50 flex items-center gap-1 bg-white rounded-lg shadow-xl border border-gray-200 p-1 animate-in fade-in zoom-in-95 duration-100"
      style={{
        top: `${menuPosition.y}px`,
        left: `${menuPosition.x}px`,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Block Type Selector */}
      <div className="relative">
        <button 
          onClick={() => setIsSelectorOpen(!isSelectorOpen)}
          className="flex items-center gap-1 px-2 py-1 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded transition-colors w-24 justify-between"
        >
          <span className="truncate">{getCurrentNodeType()}</span>
          <ChevronDown size={12} className="text-gray-400" />
        </button>

        {isSelectorOpen && (
          <div className="absolute top-full left-0 mt-1 w-32 bg-white rounded-md shadow-lg border border-gray-100 py-1 z-50 flex flex-col">
            <button 
              onClick={() => { editor.chain().focus().setParagraph().run(); setIsSelectorOpen(false); }}
              className={`text-left px-3 py-1.5 text-sm hover:bg-gray-50 ${editor.isActive('paragraph') ? 'text-lark-blue bg-lark-50' : 'text-gray-700'}`}
            >
              {t('toolbar.text')}
            </button>
            <button 
              onClick={() => { editor.chain().focus().toggleHeading({ level: 1 }).run(); setIsSelectorOpen(false); }}
              className={`text-left px-3 py-1.5 text-sm hover:bg-gray-50 ${editor.isActive('heading', { level: 1 }) ? 'text-lark-blue bg-lark-50' : 'text-gray-700'}`}
            >
              {t('toolbar.h1')}
            </button>
            <button 
              onClick={() => { editor.chain().focus().toggleHeading({ level: 2 }).run(); setIsSelectorOpen(false); }}
              className={`text-left px-3 py-1.5 text-sm hover:bg-gray-50 ${editor.isActive('heading', { level: 2 }) ? 'text-lark-blue bg-lark-50' : 'text-gray-700'}`}
            >
              {t('toolbar.h2')}
            </button>
            <button 
              onClick={() => { editor.chain().focus().toggleHeading({ level: 3 }).run(); setIsSelectorOpen(false); }}
              className={`text-left px-3 py-1.5 text-sm hover:bg-gray-50 ${editor.isActive('heading', { level: 3 }) ? 'text-lark-blue bg-lark-50' : 'text-gray-700'}`}
            >
              {t('toolbar.h3')}
            </button>
          </div>
        )}
      </div>

      <div className="w-px h-4 bg-gray-200 mx-1" />

      {/* Formatting Buttons */}
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`p-1.5 rounded hover:bg-gray-100 transition-colors ${editor.isActive('bold') ? 'text-lark-blue bg-lark-50' : 'text-gray-600'}`}
        title={t('toolbar.bold')}
      >
        <Bold size={16} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`p-1.5 rounded hover:bg-gray-100 transition-colors ${editor.isActive('italic') ? 'text-lark-blue bg-lark-50' : 'text-gray-600'}`}
        title={t('toolbar.italic')}
      >
        <Italic size={16} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        className={`p-1.5 rounded hover:bg-gray-100 transition-colors ${editor.isActive('underline') ? 'text-lark-blue bg-lark-50' : 'text-gray-600'}`}
        title={t('toolbar.underline')}
      >
        <Underline size={16} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleStrike().run()}
        className={`p-1.5 rounded hover:bg-gray-100 transition-colors ${editor.isActive('strike') ? 'text-lark-blue bg-lark-50' : 'text-gray-600'}`}
        title={t('toolbar.strike')}
      >
        <Strikethrough size={16} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleHighlight().run()}
        className={`p-1.5 rounded hover:bg-gray-100 transition-colors ${editor.isActive('highlight') ? 'text-lark-blue bg-lark-50' : 'text-gray-600'}`}
        title={t('toolbar.highlight')}
      >
        <Highlighter size={16} />
      </button>
      
      <div className="w-px h-4 bg-gray-200 mx-1" />

      <button
        onClick={() => editor.chain().focus().toggleCode().run()}
        className={`p-1.5 rounded hover:bg-gray-100 transition-colors ${editor.isActive('code') ? 'text-lark-blue bg-lark-50' : 'text-gray-600'}`}
        title={t('slash.code')}
      >
        <Code size={16} />
      </button>

      <button
        onClick={onLinkClick}
        className={`p-1.5 rounded hover:bg-gray-100 transition-colors ${editor.isActive('link') ? 'text-lark-blue bg-lark-50' : 'text-gray-600'}`}
        title={t('bubble.link')}
      >
        <Link size={16} />
      </button>

      <div className="w-px h-4 bg-gray-200 mx-1" />

      {/* AI Action */}
      <button
        onClick={onAiClick}
        className="flex items-center gap-1.5 px-2 py-1 text-sm font-medium text-purple-600 hover:bg-purple-50 rounded transition-colors"
      >
        <Sparkles size={14} />
        {t('bubble.ai')}
      </button>

    </div>
  );
};