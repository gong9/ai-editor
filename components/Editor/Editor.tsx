
import React, { useState, useRef, useEffect } from 'react';
import { useEditor, EditorContent, ReactNodeViewRenderer } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Highlight from '@tiptap/extension-highlight';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import { common, createLowlight } from 'lowlight';
import { SlashMenu } from './SlashMenu';
import { Toolbar } from './Toolbar';
import { Outline } from './Outline';
import { ContextMenu } from './ContextMenu';
import { CodeBlockComponent } from './CodeBlockComponent';
import { generateCompletion } from '../../services/geminiService';
import { saveImage } from '../../services/imageService';
import { Loader2, Shuffle, X, ImageIcon as LucideImage } from 'lucide-react';
import { useTranslation } from '../../contexts/I18nContext';

// Initialize lowlight for syntax highlighting
const lowlight = createLowlight(common);

// The specific default cover requested (Sunset Beach)
const DEFAULT_COVER_URL = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=1200';

// Curated list of "Universal" covers for shuffling
const DEFAULT_COVERS = [
  'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=1200',
  'https://images.unsplash.com/photo-1557683316-973673baf926?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=1200',
  'https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=1200',
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=1200',
  'https://images.unsplash.com/photo-1506744038136-46273834b3fb?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=1200',
  'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=1200',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=1200',
  'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=1200',
  'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=1200',
  'https://images.unsplash.com/photo-1536514072410-250c33297c02?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=1200',
];

interface EditorProps {
  initialContent?: string;
  onChange?: (content: string) => void;
}

export const Editor: React.FC<EditorProps> = ({ initialContent, onChange }) => {
  const { t } = useTranslation();
  const [slashMenuPos, setSlashMenuPos] = useState<{ x: number, y: number } | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [coverImage, setCoverImage] = useState<string | null>(DEFAULT_COVER_URL);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
      }),
      Placeholder.configure({
        placeholder: ({ node }) => {
            if (node.type.name === 'heading') {
                return t('block.placeholder.empty'); 
            }
            return t('block.placeholder');
        },
      }),
      Image,
      Link.configure({
          openOnClick: false,
          autolink: true,
      }),
      Highlight,
      CodeBlockLowlight.configure({
        lowlight,
      }).extend({
        addNodeView() {
          return ReactNodeViewRenderer(CodeBlockComponent)
        }
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: initialContent || '',
    editorProps: {
      attributes: {
        class: 'prose prose-lg focus:outline-none max-w-none mx-auto',
      },
      handleDOMEvents: {
        contextmenu: (view, event) => {
            event.preventDefault();
            const pos = view.posAtCoords({ left: event.clientX, top: event.clientY });
            
            if (pos) {
                const { tr } = view.state;
                const selection = view.state.selection.constructor.near(view.state.doc.resolve(pos.pos));
                view.dispatch(tr.setSelection(selection));
            }

            setContextMenu({ x: event.clientX, y: event.clientY });
            return true;
        }
      },
      handleClick: (view, pos, event) => {
        const { state } = view;
        const lastNode = state.doc.lastChild;
        if (lastNode && lastNode.type.name === 'codeBlock') {
          const lastNodePos = state.doc.content.size - lastNode.nodeSize;
          const nodeDom = view.nodeDOM(lastNodePos) as HTMLElement;
          if (nodeDom) {
            const rect = nodeDom.getBoundingClientRect();
            if (event.clientY > rect.bottom + 10) {
              const transaction = state.tr.insert(
                state.doc.content.size, 
                state.schema.nodes.paragraph.create()
              );
              const resolvedPos = transaction.doc.resolve(transaction.doc.content.size - 1);
              const selection = state.selection.constructor.near(resolvedPos);
              transaction.setSelection(selection);
              view.dispatch(transaction);
              return true;
            }
          }
        }
        return false;
      }
    },
    onUpdate: ({ editor }) => {
       const { state } = editor;
       const { selection } = state;
       const { $from } = selection;
       
       const charBefore = $from.parent.textBetween(Math.max(0, $from.parentOffset - 1), $from.parentOffset, undefined, '\uFFFC');
       
       if (charBefore === '/') {
           const coords = editor.view.coordsAtPos($from.pos);
           setSlashMenuPos({ x: coords.left, y: coords.bottom });
       } else {
           if (slashMenuPos && charBefore !== '/') {
               setSlashMenuPos(null);
           }
       }

       // Trigger onChange for auto-save
       if (onChange) {
           onChange(editor.getHTML());
       }
    },
  });

  const handleInsertImage = async (file: File) => {
    if (!editor) return;
    try {
        const reader = new FileReader();
        reader.onload = (e) => {
            const src = e.target?.result as string;
            editor.chain().focus().setImage({ src }).run();
        };
        reader.readAsDataURL(file);
        await saveImage(file);
    } catch (err) {
        console.error(err);
        alert("Failed to load image");
    }
  };

  const handleAddDefaultCover = () => {
    setCoverImage(DEFAULT_COVER_URL);
  };

  const handleRandomCover = () => {
    const randomIndex = Math.floor(Math.random() * DEFAULT_COVERS.length);
    setCoverImage(DEFAULT_COVERS[randomIndex]);
  };

  const handleAiGenerate = async () => {
      if (!editor) return;
      
      if (!process.env.API_KEY) {
          alert(t('editor.api_missing'));
          return;
      }

      setIsAiLoading(true);
      const context = editor.getText();
      const { selection } = editor.state;
      const prompt = editor.state.doc.textBetween(selection.from - 100, selection.from, '\n');
      const generated = await generateCompletion(prompt || t('editor.ai_prompt_default'), context);
      setIsAiLoading(false);
      if (generated) {
          editor.chain().focus().insertContent(generated).run();
      }
  };

  const handleContextAction = (action: string, payload?: any) => {
    if (!editor) return;
    editor.chain().focus();

    switch (action) {
        case 'copy':
            const { from, to } = editor.state.selection;
            let text = "";
            if (from === to) {
                 const node = editor.state.selection.$from.parent;
                 text = node.textContent;
            } else {
                 text = editor.state.doc.textBetween(from, to, '\n');
            }
            navigator.clipboard.writeText(text);
            break;
        case 'duplicate':
            const node = editor.state.selection.$head.parent;
            const json = node.toJSON();
            editor.chain().createParagraphNear().insertContent(json).run();
            break;
        case 'delete':
            editor.chain().deleteNode(editor.state.selection.$from.parent.type.name).run();
            break;
        case 'turn-into':
             if (payload === 'h1') editor.chain().setHeading({ level: 1 }).run();
             if (payload === 'h2') editor.chain().setHeading({ level: 2 }).run();
             if (payload === 'bullet-list') editor.chain().toggleBulletList().run();
            break;
        case 'table-add-col-before': editor.chain().addColumnBefore().run(); break;
        case 'table-add-col-after': editor.chain().addColumnAfter().run(); break;
        case 'table-delete-col': editor.chain().deleteColumn().run(); break;
        case 'table-add-row-before': editor.chain().addRowBefore().run(); break;
        case 'table-add-row-after': editor.chain().addRowAfter().run(); break;
        case 'table-delete-row': editor.chain().deleteRow().run(); break;
        case 'table-delete': editor.chain().deleteTable().run(); break;
        case 'table-merge-cells': editor.chain().mergeCells().run(); break;
        case 'table-split-cells': editor.chain().splitCell().run(); break;
    }
    setContextMenu(null);
  };

  const handleContainerClick = (e: React.MouseEvent) => {
    if (e.target !== e.currentTarget) return;
    if (editor) {
        const lastNode = editor.state.doc.lastChild;
        if (lastNode?.type.name === 'codeBlock') {
             editor.chain().insertContentAt(editor.state.doc.content.size, { type: 'paragraph' }).focus().run();
        } else {
            editor.commands.focus('end');
        }
    }
  };

  return (
    <div className="flex flex-col w-full min-h-full relative bg-white">
      <Toolbar editor={editor} onInsertImage={handleInsertImage} />

      <div className="flex flex-1 relative">
        <div 
          className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pb-32 min-h-full cursor-text"
          onClick={handleContainerClick}
        >
           <div className="group relative w-full mb-8 transition-all">
             {coverImage ? (
               <div className="relative w-full h-48 md:h-64 rounded-t-xl overflow-hidden shadow-sm group-hover:shadow-md transition-all">
                  <img src={coverImage} alt="Cover" className="w-full h-full object-cover object-center" />
                  <div className="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                     <button 
                       onClick={handleRandomCover}
                       className="bg-white/80 hover:bg-white text-xs font-medium text-gray-700 px-3 py-1.5 rounded backdrop-blur-sm flex items-center gap-1.5 shadow-sm transition-colors"
                     >
                        <Shuffle size={12} />
                        {t('editor.change_cover')}
                     </button>
                     <button 
                       onClick={() => setCoverImage(null)}
                       className="bg-white/80 hover:bg-white text-xs font-medium text-gray-700 px-3 py-1.5 rounded backdrop-blur-sm flex items-center gap-1.5 shadow-sm transition-colors"
                     >
                        <X size={12} />
                        {t('editor.remove_cover')}
                     </button>
                  </div>
               </div>
             ) : (
               <div 
                 onClick={handleAddDefaultCover}
                 className="h-12 border-b border-transparent hover:border-gray-200 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer transition-all px-2 -ml-2 rounded"
               >
                   <LucideImage size={16} className="mr-2" />
                   <span className="text-sm font-medium">{t('editor.add_cover')}</span>
               </div>
             )}
           </div>

           <EditorContent editor={editor} className="min-h-[500px]" />
        </div>

        <Outline editor={editor} />
      </div>

      <SlashMenu 
        position={slashMenuPos} 
        editor={editor!}
        onClose={() => setSlashMenuPos(null)}
        onAiSelect={handleAiGenerate}
        onImageSelect={() => fileInputRef.current?.click()}
      />
      
      {contextMenu && (
        <ContextMenu 
            position={contextMenu} 
            onClose={() => setContextMenu(null)}
            onAction={handleContextAction}
            isTableActive={editor?.isActive('table')}
        />
      )}

      <input 
            type="file" 
            ref={fileInputRef}
            className="hidden"
            style={{ display: 'none' }} 
            accept="image/*"
            onChange={(e) => {
                if (e.target.files?.[0]) handleInsertImage(e.target.files[0]);
            }}
        />

      {isAiLoading && (
          <div className="fixed bottom-8 right-8 bg-white shadow-lg rounded-full px-4 py-2 flex items-center gap-2 border border-lark-blue animate-in slide-in-from-bottom-5 z-50">
              <Loader2 className="animate-spin text-lark-blue" size={18} />
              <span className="text-sm font-medium text-lark-blue">{t('editor.ai_loading')}</span>
          </div>
      )}
    </div>
  );
};
