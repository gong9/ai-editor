import React, { useState, useRef, useEffect } from 'react';
import { useEditor, EditorContent, ReactNodeViewRenderer } from '@tiptap/react';
import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { StarterKit } from '@tiptap/starter-kit';
import { Placeholder } from '@tiptap/extension-placeholder';
import { Image } from '@tiptap/extension-image';
import { Link } from '@tiptap/extension-link';
import { Highlight } from '@tiptap/extension-highlight';
import { CodeBlockLowlight } from '@tiptap/extension-code-block-lowlight';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { Underline } from '@tiptap/extension-underline';
import { Markdown } from '@tiptap/markdown';
import { common, createLowlight } from 'lowlight';
import { SlashMenu } from './SlashMenu';
import { Toolbar } from './Toolbar';
import { Outline } from './Outline';
import { EditorBubbleMenu } from './EditorBubbleMenu';
import { CodeBlockComponent } from './CodeBlockComponent';
import { LinkModal } from './LinkModal';
import { generateCompletion } from '../../services/geminiService';
import { saveImage } from '../../services/imageService';
import { Loader2, Shuffle, X, ImageIcon as LucideImage, Sparkles } from 'lucide-react';
import { useTranslation } from '../../contexts/I18nContext';

import { CorrectionPanel } from './CorrectionPanel';
import { 
    type CorrectionItem
} from '../../utils/annotation';
import { extractTextFromProseMirror } from '../../utils/annotation/pm-text-extraction';
import { convertToProseMirrorPositions } from '../../utils/annotation/position-converter';
import { CorrectionExtension } from '../../extensions/CorrectionExtension';
import { streamCorrection } from '../../services/correctionService';

const EditorStyles = `
  .correction-highlight {
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .correction-highlight-active {
    background-color: rgba(254, 202, 202, 0.5) !important;
    border-bottom: 2px solid #b91c1c !important;
  }
`;

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
  onSave?: () => void;
}

export const Editor: React.FC<EditorProps> = ({ initialContent, onChange, onSave }) => {
  const { t } = useTranslation();
  const [slashMenuPos, setSlashMenuPos] = useState<{ x: number, y: number } | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [coverImage, setCoverImage] = useState<string | null>(DEFAULT_COVER_URL);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Link Modal State
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [linkModalData, setLinkModalData] = useState({ text: '', url: '' });

  // Correction State
  const [isCorrectionPanelOpen, setIsCorrectionPanelOpen] = useState(false);
  const [checkResult, setCheckResult] = useState<CorrectionItem[]>([]);
  const [activeHighlightId, setActiveHighlightId] = useState<string | null>(null);
  const [correctionProgress, setCorrectionProgress] = useState({ current: 0, total: 0 });
  
  // Refs
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const outerRef = useRef<HTMLDivElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
      }),
      CorrectionExtension,
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
      Underline,
      // BubbleMenuExtension Removed: Handled by React Component <BubbleMenu />
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
      Markdown,
      // Markdown 粘贴增强
      Extension.create({
        name: 'PasteMarkdown',
        addProseMirrorPlugins() {
          const editor = this.editor;
          return [
            new Plugin({
              key: new PluginKey('pasteMarkdown'),
              props: {
                handlePaste: (view: any, event: ClipboardEvent) => {
                  const text = event.clipboardData?.getData('text/plain');
                  const html = event.clipboardData?.getData('text/html');
                  
                  // 如果已经有 HTML，说明是富文本粘贴，使用默认处理
                  if (html && html.trim()) {
                    return false;
                  }
                  
                  if (!text || !text.trim()) return false;
                  
                  // 检测是否包含 Markdown 语法
                  const hasMarkdown = /(\*\*|__|\*|_|#{1,6}\s|```|~~|\[.*\]\(.*\)|^[-*]\s|^\d+\.\s)/m.test(text);
                  
                  if (hasMarkdown) {
                    // 把 Markdown → JSON
                    const json = (editor as any).markdown.parse(text);
                    
                    // 插入
                    editor.commands.insertContent(json);
                    return true;
                  }
                  
                  return false;
                },
              },
            }),
          ];
        },
      }),
    ],
    content: initialContent || '',
    editorProps: {
      attributes: {
        // Updated classes: flex-1 and h-full to ensure it takes up space
        class: 'prose prose-lg focus:outline-none max-w-none flex-1 h-full min-h-[60vh]',
      },
      handleDOMEvents: {
        keydown: (view, event) => {
          // 拦截 Cmd+S / Ctrl+S，阻止浏览器默认保存对话框
          if ((event.metaKey || event.ctrlKey) && event.key === 's') {
            event.preventDefault();
            // 触发保存回调
            if (onSave) {
              onSave();
            }
            return true;
          }
          return false;
        },
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
              // @ts-ignore
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
    onUpdate: ({ editor, transaction }) => {
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

  // Set up click handler for corrections
  useEffect(() => {
    if (!editor) return;
    
    const handleCorrectionClickInternal = (id: string) => {
      setActiveHighlightId(id);
      setIsCorrectionPanelOpen(true);
      
      // Update active state in plugin
      editor.commands.setActiveCorrection(id);
      
      // Scroll panel to item
      const cardId = `correction-card-${id}`;
      const card = document.getElementById(cardId);
      if (card) {
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    };
    
    editor.commands.setCorrectionClickHandler(handleCorrectionClickInternal);
  }, [editor]);


  const handleCorrectionClick = () => {
      if (!editor) return;
      
      setIsCorrectionPanelOpen(true);
      setCheckResult([]);
      editor.commands.clearCorrections();
      setCorrectionProgress({ current: 0, total: 0 });

      // Extract text directly from ProseMirror model to ensure consistency
      const text = extractTextFromProseMirror(editor);
      
      setIsAiLoading(true);
      streamCorrection(
          text,
          {
            onData: (newItems) => {
              // Convert text offsets to ProseMirror positions
              const pmItems = convertToProseMirrorPositions(newItems, editor);
              
              // Add to editor decorations
              editor.commands.addCorrections(pmItems);
              
              // Update state for panel
              setCheckResult(prev => [...prev, ...pmItems]);
            },
            onProgress: (current, total) => {
              setCorrectionProgress({ current, total });
            },
            onError: (err) => {
              console.error(err);
              setIsAiLoading(false);
              setCorrectionProgress({ current: 0, total: 0 });
              alert(t('editor.ai_error') || "Correction failed");
            },
            onComplete: () => {
              setIsAiLoading(false);
              setCorrectionProgress({ current: 0, total: 0 });
            }
          }
      );
  };

  const handleAcceptCorrection = (item: CorrectionItem) => {
      if (!editor) return;
      
      const suggestionText = item.suggestion[0][0];
      
      // Use ProseMirror positions directly
      editor.chain()
        .focus()
        .insertContentAt({ from: item.from, to: item.to }, suggestionText)
        .removeCorrection(item.id)
        .run();
      
      // Remove from state
      setCheckResult(prev => prev.filter(i => i.id !== item.id));
  };

  const handleIgnoreCorrection = (item: CorrectionItem) => {
      if (editor) {
        editor.commands.removeCorrection(item.id);
      }
      setCheckResult(prev => prev.filter(i => i.id !== item.id));
  };

  const handleSelectCorrection = (item: CorrectionItem) => {
      if (!editor) return;
      
      setActiveHighlightId(item.id);
      editor.commands.setActiveCorrection(item.id);
      
      // Scroll to the correction position in the editor
      const pos = item.from;
      editor.commands.focus();
      editor.commands.setTextSelection(pos);
      
      // Scroll the editor view to show the correction
      const coords = editor.view.coordsAtPos(pos);
      const editorElement = editor.view.dom;
      const scrollParent = editorElement.closest('.overflow-y-auto');
      
      if (scrollParent && coords) {
        const parentRect = scrollParent.getBoundingClientRect();
        const relativeTop = coords.top - parentRect.top;
        
        scrollParent.scrollBy({
          top: relativeTop - parentRect.height / 2,
          behavior: 'smooth'
        });
      }
  };

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

  const openLinkModal = () => {
      if (!editor) return;
      const { from, to } = editor.state.selection;
      const text = editor.state.doc.textBetween(from, to, ' ');
      const href = editor.getAttributes('link').href || '';
      setLinkModalData({ text, url: href });
      setIsLinkModalOpen(true);
  };

  const handleLinkConfirm = (text: string, url: string) => {
      if (!editor) return;
      
      if (url === '') {
        editor.chain().focus().extendMarkRange('link').unsetLink().run();
      } else {
        // Check if we need to update the text content as well
        editor.chain().focus()
            .extendMarkRange('link')
            .insertContent({
                type: 'text',
                text: text,
                marks: [
                    {
                        type: 'link',
                        attrs: { href: url }
                    }
                ]
            })
            .run();
      }
      setIsLinkModalOpen(false);
  };

  // Helper to ensure focus when clicking empty space
  const handleEditorClick = (e: React.MouseEvent) => {
    if (!editor) return;
    
    // 只处理点击容器本身的情况（不是子元素）
    if (e.target !== e.currentTarget) {
      return;
    }
    
    // 获取点击的坐标
    let clickX = e.clientX;
    const clickY = e.clientY;
    
    // 使用编辑器的 coordsAtPos 来找到最接近的位置
    const editorView = editor.view;
    const editorRect = editorView.dom.getBoundingClientRect();
    
    // 如果点击在编辑器下方的空白区域，定位到末尾
    if (clickY > editorRect.bottom) {
      editor.commands.focus('end');
      return;
    }
    
    // 如果点击在编辑器上方，定位到开头
    if (clickY < editorRect.top) {
      editor.commands.focus('start');
      return;
    }
    
    // 如果点击在编辑器左侧的 padding 区域，调整 x 到编辑器左边界
    // 这样可以定位到该行的开始位置
    if (clickX < editorRect.left) {
      clickX = editorRect.left + 1;
    }
    
    // 如果点击在编辑器右侧的 padding 区域，调整 x 到编辑器右边界
    if (clickX > editorRect.right) {
      clickX = editorRect.right - 1;
    }
    
    // 尝试在点击位置附近找到合适的位置
    // 使用 posAtCoords 来找到最接近的文档位置
    const pos = editorView.posAtCoords({ left: clickX, top: clickY });
    
    if (pos) {
      editor.commands.focus();
      editor.commands.setTextSelection(pos.pos);
    } else {
      editor.commands.focus('end');
    }
  };

  return (
    <div className="flex flex-col w-full min-h-full relative bg-white">
      <style>{EditorStyles}</style>
      <Toolbar 
        editor={editor} 
        onInsertImage={handleInsertImage} 
        onLinkClick={openLinkModal}
        onCorrectionClick={handleCorrectionClick}
      />

      <div className="flex flex-1 relative overflow-hidden">
        <div 
            className={`flex-1 relative h-full overflow-y-auto transition-all duration-300 ease-in-out ${isCorrectionPanelOpen ? 'mr-[400px]' : ''}`} 
            ref={outerRef}
        >
            <div className="max-w-4xl mx-auto relative min-h-full flex flex-col">
                
                {/* Cover Image Section - Moved outside editorContainerRef to avoid indexing text */}
                <div className="group relative w-full mb-8 transition-all shrink-0 px-16 pt-12">
                    {coverImage ? (
                    <div className="relative w-full h-48 md:h-64 rounded-xl overflow-hidden shadow-sm group-hover:shadow-md transition-all">
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

                <div className="relative flex-1 px-16 pb-12">
                    {/* Blocking Overlay & Loading State */}
                    {isAiLoading && (
                        <>
                            {/* Transparent overlay to block interactions */}
                            <div className="absolute inset-0 z-[9998] bg-white/0 cursor-wait" />
                            
                            {/* Floating Status Capsule - Positioned at Bottom */}
                            <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[9999] animate-in slide-in-from-bottom-2 fade-in duration-300 pointer-events-none">
                                <div className="bg-white shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-indigo-100 rounded-xl px-5 py-3 flex items-center gap-4">
                                    <div className="flex items-center gap-2">
                                        <Sparkles className="w-4 h-4 text-indigo-600 animate-pulse" />
                                        <span className="text-sm font-semibold text-gray-800">正在校对中</span>
                                    </div>
                                    
                                    {correctionProgress.total > 0 && (
                                        <>
                                            <div className="w-px h-4 bg-gray-200"></div>
                                            <div className="flex items-center gap-2 min-w-[120px]">
                                                <div className="h-1.5 flex-1 bg-gray-100 rounded-full overflow-hidden">
                                                    <div 
                                                        className="h-full bg-indigo-600 rounded-full transition-all duration-300 ease-out"
                                                        style={{ width: `${(correctionProgress.current / correctionProgress.total) * 100}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs font-bold text-indigo-600 w-8 text-right">
                                                    {Math.round((correctionProgress.current / correctionProgress.total) * 100)}%
                                                </span>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                    
                    <div 
                      ref={editorContainerRef} 
                      className="relative z-0 min-h-full cursor-text flex flex-col flex-1"
                      onClick={handleEditorClick}
                    >
                        <EditorContent editor={editor} className="flex-1 h-full flex flex-col" />
                    </div>
                </div>
            </div>
        </div>

        {/* Right Sidebar */}
        {isCorrectionPanelOpen ? (
             <CorrectionPanel 
                items={checkResult}
                activeId={activeHighlightId}
                onAccept={handleAcceptCorrection}
                onIgnore={handleIgnoreCorrection}
                onSelect={handleSelectCorrection}
                isOpen={isCorrectionPanelOpen}
                onClose={() => setIsCorrectionPanelOpen(false)}
                isLoading={isAiLoading}
             />
        ) : (
            <Outline editor={editor} />
        )}
      </div>

      <SlashMenu 
        position={slashMenuPos} 
        editor={editor!}
        onClose={() => setSlashMenuPos(null)}
        onAiSelect={handleAiGenerate}
        onImageSelect={() => fileInputRef.current?.click()}
      />
      
      {editor && (
        <EditorBubbleMenu 
            editor={editor} 
            onAiClick={handleAiGenerate} 
            onLinkClick={openLinkModal}
        />
      )}
      
      <LinkModal 
        isOpen={isLinkModalOpen}
        onClose={() => setIsLinkModalOpen(false)}
        onConfirm={handleLinkConfirm}
        initialText={linkModalData.text}
        initialUrl={linkModalData.url}
      />


      {/* Floating Correction Result Toggle - Only visible if we have results but panel is closed */}
      {!isCorrectionPanelOpen && checkResult.length > 0 && (
        <button
            onClick={() => setIsCorrectionPanelOpen(true)}
            className="fixed right-8 bottom-8 z-50 bg-white border border-gray-200 shadow-lg p-3 rounded-full hover:bg-gray-50 transition-all group flex items-center gap-2 animate-in fade-in slide-in-from-bottom-4"
            title="查看校对结果"
        >
            <div className="bg-indigo-100 p-1.5 rounded-full">
                <Sparkles size={18} className="text-indigo-600" />
            </div>
            <span className="font-medium text-gray-700 pr-1 text-sm">校对结果</span>
            <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full">
                {checkResult.length}
            </span>
        </button>
      )}
    </div>
  );
};
