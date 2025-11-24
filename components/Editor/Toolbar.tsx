import React, { useRef } from 'react';
import { Editor } from '@tiptap/react';
import { 
  Bold, 
  Italic, 
  Underline, 
  Strikethrough, 
  Heading1, 
  Heading2, 
  Heading3, 
  Type, 
  List, 
  ListOrdered, 
  Quote, 
  Code,
  Highlighter,
  Link as LinkIcon,
  Image as ImageIcon,
  Table,
  Sparkles
} from 'lucide-react';
import { useTranslation } from '../../contexts/I18nContext';

interface ToolbarProps {
  editor: Editor | null;
  onInsertImage: (file: File) => void;
  onLinkClick: () => void;
  onCorrectionClick: () => void;
}

interface ToolbarButtonProps {
  isActive?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  title?: string;
  disabled?: boolean;
}

const ToolbarButton: React.FC<ToolbarButtonProps> = ({ 
  isActive, 
  onClick, 
  children, 
  title,
  disabled
}) => (
  <button
    onClick={(e) => {
      e.preventDefault(); // Prevent losing focus from editor
      onClick();
    }}
    disabled={disabled}
    className={`p-1.5 rounded transition-colors ${
      isActive 
        ? 'bg-lark-100 text-lark-blue dark:bg-lark-blue/20 dark:text-lark-blueHover' 
        : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
    } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    title={title}
  >
    {children}
  </button>
);

const Divider = () => <div className="w-px h-4 bg-gray-200 dark:bg-gray-700 mx-1" />;

export const Toolbar: React.FC<ToolbarProps> = ({ editor, onInsertImage, onLinkClick, onCorrectionClick }) => {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!editor) return null;

  const handleImageClick = () => {
      fileInputRef.current?.click();
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          onInsertImage(e.target.files[0]);
          // Reset input so same file can be selected again
          e.target.value = '';
      }
  };

  return (
    <div className="sticky top-0 z-30 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-4 py-2 flex items-center gap-1 shadow-sm overflow-x-auto no-scrollbar transition-colors duration-200">
      <div className="flex items-center gap-1 pr-2">
        <ToolbarButton 
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} 
          isActive={editor.isActive('heading', { level: 1 })} 
          title={t('toolbar.h1')}
        >
          <Heading1 size={18} />
        </ToolbarButton>
        <ToolbarButton 
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} 
          isActive={editor.isActive('heading', { level: 2 })} 
          title={t('toolbar.h2')}
        >
          <Heading2 size={18} />
        </ToolbarButton>
        <ToolbarButton 
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} 
          isActive={editor.isActive('heading', { level: 3 })} 
          title={t('toolbar.h3')}
        >
          <Heading3 size={18} />
        </ToolbarButton>
        <ToolbarButton 
          onClick={() => editor.chain().focus().setParagraph().run()} 
          isActive={editor.isActive('paragraph')} 
          title={t('toolbar.text')}
        >
          <Type size={18} />
        </ToolbarButton>
      </div>

      <Divider />

      <div className="flex items-center gap-1 px-2">
        <ToolbarButton 
          onClick={() => editor.chain().focus().toggleBold().run()} 
          isActive={editor.isActive('bold')} 
          title={t('toolbar.bold')}
        >
          <Bold size={18} />
        </ToolbarButton>
        <ToolbarButton 
          onClick={() => editor.chain().focus().toggleItalic().run()} 
          isActive={editor.isActive('italic')} 
          title={t('toolbar.italic')}
        >
          <Italic size={18} />
        </ToolbarButton>
        <ToolbarButton 
          onClick={() => editor.chain().focus().toggleUnderline().run()} 
          isActive={editor.isActive('underline')} 
          title={t('toolbar.underline')}
        >
          <Underline size={18} />
        </ToolbarButton>
        <ToolbarButton 
          onClick={() => editor.chain().focus().toggleStrike().run()} 
          isActive={editor.isActive('strike')} 
          title={t('toolbar.strike')}
        >
          <Strikethrough size={18} />
        </ToolbarButton>
        <ToolbarButton 
          onClick={() => editor.chain().focus().toggleHighlight().run()} 
          isActive={editor.isActive('highlight')} 
          title={t('toolbar.highlight')}
        >
          <Highlighter size={18} />
        </ToolbarButton>
        <ToolbarButton 
          onClick={onLinkClick} 
          isActive={editor.isActive('link')} 
          title={t('toolbar.link')}
        >
            <LinkIcon size={18} />
        </ToolbarButton>
      </div>

      <Divider />

      <div className="flex items-center gap-1 px-2">
        <ToolbarButton 
          onClick={() => editor.chain().focus().toggleBulletList().run()} 
          isActive={editor.isActive('bulletList')} 
          title={t('toolbar.bullet')}
        >
          <List size={18} />
        </ToolbarButton>
        <ToolbarButton 
          onClick={() => editor.chain().focus().toggleOrderedList().run()} 
          isActive={editor.isActive('orderedList')} 
          title={t('toolbar.numbered')}
        >
          <ListOrdered size={18} />
        </ToolbarButton>
        <ToolbarButton 
          onClick={() => editor.chain().focus().toggleBlockquote().run()} 
          isActive={editor.isActive('blockquote')} 
          title={t('toolbar.quote')}
        >
          <Quote size={18} />
        </ToolbarButton>
        <ToolbarButton 
          onClick={() => editor.chain().focus().toggleCodeBlock().run()} 
          isActive={editor.isActive('codeBlock')} 
          title={t('toolbar.code')}
        >
          <Code size={18} />
        </ToolbarButton>
        <ToolbarButton 
          onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} 
          isActive={editor.isActive('table')} 
          title={t('toolbar.table')}
        >
          <Table size={18} />
        </ToolbarButton>
        <ToolbarButton 
          onClick={handleImageClick} 
          isActive={editor.isActive('image')} 
          title={t('toolbar.image')}
        >
            <ImageIcon size={18} />
        </ToolbarButton>
        <input 
            type="file" 
            ref={fileInputRef}
            className="hidden"
            style={{ display: 'none' }} 
            accept="image/*"
            onChange={onFileChange}
        />
      </div>

      <Divider />

      <div className="flex items-center gap-1 px-2">
        <ToolbarButton
          onClick={onCorrectionClick}
          title="AI 校对"
          isActive={false} // Never active state, just a trigger
        >
           <Sparkles size={18} className="text-purple-500 dark:text-purple-400" />
        </ToolbarButton>
      </div>
    </div>
  );
};
