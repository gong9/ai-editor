import React from 'react';
import { Editor } from '@tiptap/react';
import { AlignLeft } from 'lucide-react';
import { useTranslation } from '../../contexts/I18nContext';

interface OutlineProps {
  editor: Editor | null;
}

interface HeadingNode {
  text: string;
  level: number;
  id: string; // Tiptap doesn't give IDs to headings by default, we'll rely on scrolling to index or similar, or just text match. 
  // Actually, for outline to work perfectly, we need IDs. 
  // For now, let's just scrollTo using simple logic or add IDs via extension later.
  // I'll implement a simple "find first occurrence" scroll logic.
  pos: number;
}

export const Outline: React.FC<OutlineProps> = ({ editor }) => {
  const { t } = useTranslation();

  if (!editor) return null;

  const headings: HeadingNode[] = [];
  
  editor.state.doc.descendants((node, pos) => {
    if (node.type.name === 'heading') {
      headings.push({
        text: node.textContent,
        level: node.attrs.level,
        id: `heading-${pos}`, // Virtual ID
        pos: pos
      });
    }
  });

  const scrollToHeading = (pos: number) => {
    const dom = editor.view.nodeDOM(pos) as HTMLElement;
    if (dom) {
      dom.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  if (headings.length === 0) return null;

  return (
    <div className="w-64 hidden xl:block fixed right-8 top-32 bottom-0 overflow-y-auto pr-2">
      <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 pl-2">
        <AlignLeft size={14} />
        {t('outline.title')}
      </div>
      <div className="border-l border-gray-100 relative">
        {headings.map((heading, index) => (
          <button
            key={index}
            onClick={() => scrollToHeading(heading.pos)}
            className={`
              text-left w-full py-1.5 pr-2 text-sm text-gray-500 hover:text-lark-blue hover:bg-lark-50 rounded-r transition-all truncate
              ${heading.level === 1 ? 'pl-4 font-medium' : ''}
              ${heading.level === 2 ? 'pl-8' : ''}
              ${heading.level === 3 ? 'pl-12 text-xs' : ''}
            `}
          >
            {heading.text || <span className="italic text-gray-300">{t('outline.untitled')}</span>}
          </button>
        ))}
      </div>
    </div>
  );
};