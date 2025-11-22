import React, { useEffect, useState } from 'react';
import { 
  Type, 
  Heading1, 
  Heading2, 
  Heading3, 
  List, 
  ListOrdered, 
  Quote, 
  Code, 
  Minus, 
  Image as ImageIcon,
  Sparkles,
  Table
} from 'lucide-react';
import { Editor } from '@tiptap/react';
import { useTranslation } from '../../contexts/I18nContext';

interface SlashMenuProps {
  position: { x: number; y: number } | null;
  editor: Editor;
  onClose: () => void;
  onAiSelect: () => void;
  onImageSelect: () => void;
}

export const SlashMenu: React.FC<SlashMenuProps> = ({ position, editor, onClose, onAiSelect, onImageSelect }) => {
  const { t } = useTranslation();
  const [selectedIndex, setSelectedIndex] = useState(0);

  const ITEMS = [
    { 
      id: 'paragraph', 
      label: t('slash.text'), 
      icon: Type, 
      desc: t('slash.text.desc'),
      command: () => editor.chain().focus().setParagraph().run() 
    },
    { 
      id: 'h1', 
      label: t('slash.h1'), 
      icon: Heading1, 
      desc: t('slash.h1.desc'),
      command: () => editor.chain().focus().toggleHeading({ level: 1 }).run()
    },
    { 
      id: 'h2', 
      label: t('slash.h2'), 
      icon: Heading2, 
      desc: t('slash.h2.desc'),
      command: () => editor.chain().focus().toggleHeading({ level: 2 }).run()
    },
    { 
      id: 'h3', 
      label: t('slash.h3'), 
      icon: Heading3, 
      desc: t('slash.h3.desc'),
      command: () => editor.chain().focus().toggleHeading({ level: 3 }).run()
    },
    { 
      id: 'bullet-list', 
      label: t('slash.bullet'), 
      icon: List, 
      desc: t('slash.bullet.desc'),
      command: () => editor.chain().focus().toggleBulletList().run()
    },
    { 
      id: 'numbered-list', 
      label: t('slash.numbered'), 
      icon: ListOrdered, 
      desc: t('slash.numbered.desc'),
      command: () => editor.chain().focus().toggleOrderedList().run()
    },
    { 
      id: 'quote', 
      label: t('slash.quote'), 
      icon: Quote, 
      desc: t('slash.quote.desc'),
      command: () => editor.chain().focus().toggleBlockquote().run()
    },
    { 
      id: 'code', 
      label: t('slash.code'), 
      icon: Code, 
      desc: t('slash.code.desc'),
      command: () => editor.chain().focus().toggleCodeBlock().run()
    },
    { 
      id: 'table', 
      label: t('slash.table'), 
      icon: Table, 
      desc: t('slash.table.desc'),
      command: () => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
    },
    { 
      id: 'divider', 
      label: t('slash.divider'), 
      icon: Minus, 
      desc: t('slash.divider.desc'),
      command: () => editor.chain().focus().setHorizontalRule().run()
    },
    { 
      id: 'image', 
      label: t('slash.image'), 
      icon: ImageIcon, 
      desc: t('slash.image.desc'),
      command: onImageSelect
    },
    { 
      id: 'ai', 
      label: t('slash.ai'), 
      icon: Sparkles, 
      desc: t('slash.ai.desc'), 
      special: true,
      command: onAiSelect
    },
  ];

  const execute = (index: number) => {
    const item = ITEMS[index];
    
    // Delete the slash command text "/"
    // We simply delete the last character which triggered the menu
    editor.chain().focus().deleteRange({ from: editor.state.selection.from - 1, to: editor.state.selection.from }).run();
    
    item.command();
    onClose();
  };

  // Reset selection when menu opens
  useEffect(() => {
    if (position) {
      setSelectedIndex(0);
    }
  }, [position]);

  useEffect(() => {
    // Only attach listeners if the menu is actually visible (position is not null)
    if (!position) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % ITEMS.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + ITEMS.length) % ITEMS.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        execute(selectedIndex);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, onClose, ITEMS, editor, position]);

  if (!position) return null;

  return (
    <div 
      className="fixed z-50 w-72 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden flex flex-col max-h-80 overflow-y-auto animate-in fade-in zoom-in-95 duration-100"
      style={{ top: position.y + 24, left: position.x }}
    >
      <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
        {t('slash.basic')}
      </div>
      {ITEMS.map((item, index) => {
        const Icon = item.icon;
        const isSelected = index === selectedIndex;
        return (
          <button
            key={item.id}
            className={`flex items-center px-3 py-2 text-left w-full transition-colors ${
              isSelected ? 'bg-lark-100' : 'hover:bg-gray-50'
            }`}
            onClick={() => execute(index)}
            onMouseEnter={() => setSelectedIndex(index)}
          >
            <div className={`p-1 mr-3 rounded border ${item.special ? 'bg-lark-blue text-white border-lark-blue' : 'bg-white border-gray-200 text-gray-600'}`}>
              <Icon size={18} />
            </div>
            <div>
              <div className="text-sm font-medium text-gray-800">{item.label}</div>
              <div className="text-xs text-gray-500">{item.desc}</div>
            </div>
          </button>
        );
      })}
    </div>
  );
};