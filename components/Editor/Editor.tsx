
import React, { useState, useRef } from 'react';
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
import { Loader2 } from 'lucide-react';
import { useTranslation } from '../../contexts/I18nContext';

// Initialize lowlight for syntax highlighting
const lowlight = createLowlight(common);

export const Editor: React.FC = () => {
  const { t } = useTranslation();
  const [slashMenuPos, setSlashMenuPos] = useState<{ x: number, y: number } | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false, // Disable default code block to use Lowlight
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
    content: `
      <h1>${t('editor.welcome')}</h1>
      <p>${t('editor.initial_text')}</p>
    `,
    editorProps: {
      attributes: {
        class: 'prose prose-lg focus:outline-none max-w-none mx-auto',
      },
      handleDOMEvents: {
        contextmenu: (view, event) => {
            event.preventDefault();
            const pos = view.posAtCoords({ left: event.clientX, top: event.clientY });
            
            if (pos) {
                // Move cursor to the right-clicked position so actions apply there
                const { tr } = view.state;
                const selection = view.state.selection.constructor.near(view.state.doc.resolve(pos.pos));
                view.dispatch(tr.setSelection(selection));
            }

            setContextMenu({ x: event.clientX, y: event.clientY });
            return true;
        }
      },
      handleClick: (view, pos, event) => {
        // Logic to escape CodeBlock if clicking below it
        const { state } = view;
        const lastNode = state.doc.lastChild;
        
        if (lastNode && lastNode.type.name === 'codeBlock') {
          const lastNodePos = state.doc.content.size - lastNode.nodeSize;
          const nodeDom = view.nodeDOM(lastNodePos) as HTMLElement;
          
          if (nodeDom) {
            const rect = nodeDom.getBoundingClientRect();
            // If click is significantly below the last code block
            if (event.clientY > rect.bottom + 10) {
              const transaction = state.tr.insert(
                state.doc.content.size, 
                state.schema.nodes.paragraph.create()
              );
              // Move selection to the new paragraph
              const resolvedPos = transaction.doc.resolve(transaction.doc.content.size - 1);
              const selection = state.selection.constructor.near(resolvedPos);
              transaction.setSelection(selection);
              view.dispatch(transaction);
              return true; // Prevent default behavior
            }
          }
        }
        return false;
      }
    },
    onUpdate: ({ editor }) => {
       // Simple Slash Menu Trigger: Check if the last char is '/'
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
    },
    onSelectionUpdate: () => {
        // If user clicks elsewhere, close context menu
        // setContextMenu(null); // Handled by ContextMenu component's click listener
    }
  });

  const handleInsertImage = async (file: File) => {
    if (!editor) return;
    try {
        // Create object URL for immediate display
        const reader = new FileReader();
        reader.onload = (e) => {
            const src = e.target?.result as string;
            editor.chain().focus().setImage({ src }).run();
        };
        reader.readAsDataURL(file);
        
        // Persist
        await saveImage(file);
    } catch (err) {
        console.error(err);
        alert("Failed to load image");
    }
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
            // Copy text of the current block
            const { from, to } = editor.state.selection;
            // If selection is empty, select the whole node text
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
            // Insert after current block
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
        // Table Actions
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
    // Only handle clicks directly on the container (whitespace)
    if (e.target !== e.currentTarget) return;

    if (editor) {
        const lastNode = editor.state.doc.lastChild;
        if (lastNode?.type.name === 'codeBlock') {
             editor.chain().insertContentAt(editor.state.doc.content.size, { type: 'paragraph' }).focus().run();
        } else {
            // Ensure focus is at the end
            editor.commands.focus('end');
        }
    }
  };

  return (
    <div className="flex flex-col w-full min-h-screen relative">
      <Toolbar 
        editor={editor} 
        onInsertImage={handleInsertImage}
      />

      <div className="flex flex-1 relative">
        <div 
          className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pb-32 min-h-screen bg-white cursor-text"
          onClick={handleContainerClick}
        >
           {/* Cover Image Placeholder */}
           <div className="group relative w-full h-48 bg-gradient-to-r from-lark-100 to-gray-200 rounded-t-xl mb-8 overflow-hidden">
               <div className="absolute inset-0 flex items-center justify-center text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                   {t('editor.add_cover')}
               </div>
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
