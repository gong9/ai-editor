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
import { saveImage, compressImage, hydrateImages, loadImage } from '../../services/imageService';
import { Loader2, Shuffle, X, ImageIcon as LucideImage, Sparkles, AlertCircle } from 'lucide-react';
import { useTranslation } from '../../contexts/I18nContext';

import { CorrectionPanel } from './CorrectionPanel';
import { 
    type CorrectionItem
} from '../../utils/annotation';
import { extractTextFromProseMirror } from '../../utils/annotation/pm-text-extraction';
import { convertToProseMirrorPositions } from '../../utils/annotation/position-converter';
import { CorrectionExtension } from '../../extensions/CorrectionExtension';
import { correctionPluginKey } from '../../utils/annotation/correction-plugin';
import { streamCorrection } from '../../services/correctionService';

const EditorStyles = `
  .correction-highlight {
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .correction-highlight-active {
    background-color: rgba(254, 202, 202, 0.5) !important;
    border-bottom: 2px solid #b91c1c !important;
    /* Force high priority over other styles */
    z-index: 10;
    position: relative;
  }

  .correction-accepted {
    background-color: rgba(220, 252, 231, 0.5); /* green-100 */
    border-radius: 2px;
  }

  /* Increase specificity significantly */
  div.ProseMirror span.correction-accepted.correction-highlight-active {
    background-color: rgba(134, 239, 172, 0.8) !important; /* green-300, higher opacity */
    border-bottom: 3px solid #16a34a !important; /* green-600, thicker border */
  }
  
  /* Dark mode overrides */
  .dark .correction-highlight-active {
    background-color: rgba(153, 27, 27, 0.5) !important;
    border-bottom: 2px solid #ef4444 !important;
  }

  .dark .correction-accepted {
    background-color: rgba(20, 83, 45, 0.5); /* green-900 with opacity */
  }

  .dark div.ProseMirror span.correction-accepted.correction-highlight-active {
    background-color: rgba(34, 197, 94, 0.6) !important; /* green-500, higher opacity */
    border-bottom: 3px solid #4ade80 !important; /* green-400 */
  }

  .dark .ProseMirror {
    color: #e5e7eb;
    caret-color: #e5e7eb;
  }
  
  .dark .ProseMirror p.is-editor-empty:first-child::before {
    color: #6b7280;
    float: left;
    height: 0;
    pointer-events: none;
  }
`;

// Initialize lowlight for syntax highlighting
const lowlight = createLowlight(common);

const CustomImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      'data-storage-id': {
        default: null,
        parseHTML: element => element.getAttribute('data-storage-id'),
        renderHTML: attributes => {
          if (!attributes['data-storage-id']) {
            return {};
          }
          return {
            'data-storage-id': attributes['data-storage-id'],
          };
        },
      },
    };
  },
});

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
  const [isHydrated, setIsHydrated] = useState(false);
  
  // Link Modal State
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [linkModalData, setLinkModalData] = useState({ text: '', url: '' });

  // Correction State
  const [isCorrectionPanelOpen, setIsCorrectionPanelOpen] = useState(false);
  const [checkResult, setCheckResult] = useState<CorrectionItem[]>([]);
  const [activeHighlightId, setActiveHighlightId] = useState<string | null>(null);
  const [correctionProgress, setCorrectionProgress] = useState({ current: 0, total: 0 });
  const isInternalOperation = useRef(false);
  const isUndoRedo = useRef(false);
  
  // Correction Removal Confirmation State
  const [isRemovalModalOpen, setIsRemovalModalOpen] = useState(false);
  const [correctionRemovalCandidate, setCorrectionRemovalCandidate] = useState<string[]>([]);
  const [removalAction, setRemovalAction] = useState<'undo' | 'redo'>('undo');
  
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
      CustomImage,
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
    content: '', // Start empty, hydrate later
    editable: false, // Wait for hydration
    editorProps: {
      attributes: {
        // Updated classes: flex-1 and h-full to ensure it takes up space
        // Added dark:prose-invert to support dark mode text colors in typography plugin
        class: 'prose prose-lg dark:prose-invert focus:outline-none max-w-none flex-1 h-full min-h-[60vh]',
      },
      handleDOMEvents: {
        keydown: (view, event) => {
          // Detect Undo/Redo shortcuts
          if ((event.metaKey || event.ctrlKey) && (event.key === 'z' || event.key === 'y' || event.key === 'Z')) {
              isUndoRedo.current = true;
              // Reset after a short delay to allow onUpdate to fire
              setTimeout(() => {
                  isUndoRedo.current = false;
              }, 100);
          }

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

       // Sync corrections state if plugin removed them due to edits
       const pluginState = correctionPluginKey.getState(editor.state);
       
       // Check if we need to sync/confirm removal
       if (pluginState && !isInternalOperation.current) {
           const currentIds = new Set(pluginState.corrections.keys());
           
           // Find items that are about to be removed (exist in checkResult but not in plugin)
           const itemsToRemove = checkResult.filter(item => !currentIds.has(item.id));
           
           if (itemsToRemove.length > 0) {
               if (!isRemovalModalOpen && correctionRemovalCandidate.length === 0) {
                   const idsToRemove = itemsToRemove.map(i => i.id);
                   setCorrectionRemovalCandidate(idsToRemove);
                   // If triggered by Undo/Redo shortcut, we want to Redo/Undo to cancel.
                   // If triggered by Undo (Ctrl+Z), the action to Cancel is Redo.
                   // If triggered by Manual Edit, the action to Cancel is Undo.
                   setRemovalAction(isUndoRedo.current ? 'redo' : 'undo');
                   setIsRemovalModalOpen(true);
               }
           } else {
               if (!isRemovalModalOpen) {
                   setCheckResult(prev => {
                       const next = prev.filter(item => currentIds.has(item.id));
                       const pluginItems = Array.from(pluginState.corrections.values());
                       
                       // If plugin has more items (e.g. after Undo), use plugin's list to restore
                       // But we want to preserve our local state (like loading status? no, just result)
                       // The plugin stores the full item including result, so we can trust it.
                       
                       if (pluginItems.length > next.length) {
                           return pluginItems;
                       }
                       
                       return next.length !== prev.length ? next : prev;
                   });
               }
           }
       }
    },
  });

  // Hydrate content with images from IndexedDB
  useEffect(() => {
    // Only run if editor is initialized and not yet hydrated
    // We check !isHydrated to avoid re-running if not needed, but editor dependency might trigger
    if (!editor || isHydrated) return;

    const hydrate = async () => {
        try {
            if (!initialContent) {
                // If no content, just enable editing
                setIsHydrated(true);
                editor.setEditable(true);
                return;
            }

            // Replace placeholder images with blob URLs
            const content = await hydrateImages(initialContent);
            
            // Set content and enable editing
            // Note: This will reset cursor position, but since it's initial load, it's fine
            editor.commands.setContent(content);
            editor.setEditable(true);
            // editor.commands.clearHistory(); 
            setIsHydrated(true);
        } catch (err) {
            console.error("Failed to hydrate content:", err);
            // Fallback to initial content if hydration fails
            editor.commands.setContent(initialContent || '');
            editor.setEditable(true);
            setIsHydrated(true);
        }
    };

    hydrate();
  }, [editor, initialContent]); // Only depend on editor and initialContent

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
      
      isInternalOperation.current = true;
      
      const suggestionText = item.suggestion[0][0];
      const originalText = editor.state.doc.textBetween(item.from, item.to);
      
      const newItem: CorrectionItem = {
          ...item,
          // Update 'to' position based on new text length
          to: item.from + suggestionText.length,
          result: 'accepted',
          originalText,
          newText: suggestionText,
      };

      // Combine text change and state update into a SINGLE transaction
      // This ensures that Undo/Redo treats them as one atomic operation
      editor.chain()
        .focus()
        .insertContentAt({ from: item.from, to: item.to }, suggestionText)
        .addCorrections([newItem])
        .run();
      
      // Update state locally
      setCheckResult(prev => prev.map(i => i.id === item.id ? newItem : i));
      
      // Reset flag after a short delay to allow all updates to settle
      setTimeout(() => {
          isInternalOperation.current = false;
      }, 50);
  };

  const handleIgnoreCorrection = (item: CorrectionItem) => {
      if (!editor) return;

      isInternalOperation.current = true;

      const newItem: CorrectionItem = {
          ...item,
          result: 'ignored',
      };

      // Update in plugin
      editor.commands.addCorrections([newItem]);

      // Update state
      setCheckResult(prev => prev.map(i => i.id === item.id ? newItem : i));
      
      setTimeout(() => {
          isInternalOperation.current = false;
      }, 50);
  };

  const handleUndoCorrection = (item: CorrectionItem) => {
      if (!editor) return;
      
      isInternalOperation.current = true;
      
      if (item.result === 'ignored') {
          const newItem: CorrectionItem = {
              ...item,
              result: undefined,
          };
          
          // For ignored items, only state update is needed
          editor.chain()
              .addCorrections([newItem])
              .run();
              
          setCheckResult(prev => prev.map(i => i.id === item.id ? newItem : i));
          
      } else if (item.result === 'accepted') {
          const currentText = editor.state.doc.textBetween(item.from, item.to);
          
          // Try to revert if text matches
          if (currentText === item.newText && item.originalText !== undefined) {
              const newItem: CorrectionItem = {
                  ...item,
                  to: item.from + item.originalText.length,
                  result: undefined,
                  originalText: undefined,
                  newText: undefined,
              };
              
              // Combine text revert and state update
              editor.chain()
                  .focus()
                  .insertContentAt({ from: item.from, to: item.to }, item.originalText)
                  .addCorrections([newItem])
                  .run();
              
              setCheckResult(prev => prev.map(i => i.id === item.id ? newItem : i));
          } else {
              // Text changed, just reset status
              const newItem: CorrectionItem = {
                  ...item,
                  result: undefined,
              };
              
              editor.chain()
                  .addCorrections([newItem])
                  .run();
                  
              setCheckResult(prev => prev.map(i => i.id === item.id ? newItem : i));
          }
      }
      
      setTimeout(() => {
          isInternalOperation.current = false;
      }, 50);
  };

  const handleSelectCorrection = (item: CorrectionItem) => {
      if (!editor) return;
      
      setActiveHighlightId(item.id);
      editor.commands.setActiveCorrection(item.id);
      editor.commands.scrollToCorrection(item.id);
  };

  const handleInsertImage = async (file: File) => {
    if (!editor) return;
    try {
        // Compress image before inserting to reduce size
        // Note: saveImage also compresses, so we do it once inside saveImage?
        // Actually saveImage returns ID, we need to load it to get blob URL
        
        // 1. Save to IDB (handles compression)
        const id = await saveImage(file);
        
        // 2. Get Blob URL for display
        const blobUrl = await loadImage(id);
        
        if (blobUrl) {
             editor.chain().focus().setImage({ 
                 src: blobUrl,
                 // @ts-ignore
                 'data-storage-id': id
             }).run();
        }
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
    // 这样可以定位到该行的开始位置
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

  const handleRemovalConfirm = () => {
      // Remove the items from our local state that match the candidates
      setCheckResult(prev => prev.filter(item => !correctionRemovalCandidate.includes(item.id)));
      
      // Also ensure they are removed from plugin? 
      // They are already gone from plugin, that's why this flow triggered.
      
      setCorrectionRemovalCandidate([]);
      setIsRemovalModalOpen(false);
  };

  const handleRemovalCancel = () => {
      // Execute the reverse action to cancel the change
      if (removalAction === 'redo') {
          editor?.chain().redo().run();
      } else {
          editor?.chain().undo().run();
      }
      
      // Manually restore the items to the plugin
      // This is necessary because the history undo/redo mechanism might not automatically 
      // restore the plugin state for custom plugins, or the restoration itself might 
      // have triggered a "modification" check that removed the item again.
      const itemsToRestore = checkResult.filter(item => correctionRemovalCandidate.includes(item.id));
      
      if (itemsToRestore.length > 0) {
          // Add back with a slight delay to ensure the transaction is processed
          setTimeout(() => {
             editor?.commands.addCorrections(itemsToRestore);
          }, 50);
      }
      
      setCorrectionRemovalCandidate([]);
      setIsRemovalModalOpen(false);
  };

  return (
    <div className="flex flex-col w-full min-h-full relative bg-white dark:bg-gray-900 transition-colors duration-200">
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
                        className="h-12 border-b border-transparent hover:border-gray-200 dark:hover:border-gray-700 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer transition-all px-2 -ml-2 rounded"
                    >
                        <LucideImage size={16} className="mr-2" />
                        <span className="text-sm font-medium">{t('editor.add_cover')}</span>
                    </div>
                    )}
                </div>

                <div className="relative flex-1 px-16 pb-12">
                    {/* Blocking Overlay & Loading State */}
                    {(isAiLoading || !isHydrated) && (
                        <>
                            {/* Transparent overlay to block interactions */}
                            <div className="absolute inset-0 z-[9998] bg-white/0 dark:bg-black/0 cursor-wait" />
                            
                            {/* Floating Status Capsule - Positioned at Bottom */}
                            <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[9999] animate-in slide-in-from-bottom-2 fade-in duration-300 pointer-events-none">
                                <div className="bg-white dark:bg-gray-800 shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-indigo-100 dark:border-indigo-900 rounded-xl px-5 py-3 flex items-center gap-4">
                                    <div className="flex items-center gap-2">
                                        <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400 animate-pulse" />
                                        <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                                            {isAiLoading ? '正在校对中' : '加载内容中...'}
                                        </span>
                                    </div>
                                    
                                    {isAiLoading && correctionProgress.total > 0 && (
                                        <>
                                            <div className="w-px h-4 bg-gray-200 dark:bg-gray-700"></div>
                                            <div className="flex items-center gap-2 min-w-[120px]">
                                                <div className="h-1.5 flex-1 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                                    <div 
                                                        className="h-full bg-indigo-600 dark:bg-indigo-500 rounded-full transition-all duration-300 ease-out"
                                                        style={{ width: `${(correctionProgress.current / correctionProgress.total) * 100}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 w-8 text-right">
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
                      className={`relative z-0 min-h-full cursor-text flex flex-col flex-1 transition-opacity duration-300 ${!isHydrated ? 'opacity-0' : 'opacity-100'} dark:text-gray-100`}
                      onClick={handleEditorClick}
                    >
                        <EditorContent editor={editor} className="flex-1 h-full flex flex-col dark:prose-invert" />
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
                onUndo={handleUndoCorrection}
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

      {/* Removal Confirmation Modal */}
      {isRemovalModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/20 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-5 max-w-[320px] w-full mx-4 border border-gray-100 dark:border-gray-700 transform scale-100 transition-all">
                <div className="flex flex-col items-center text-center mb-5">
                    <div className="mb-3 text-amber-500 dark:text-amber-400">
                        <AlertCircle size={32} strokeWidth={1.5} />
                    </div>
                    <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-1.5">
                        移除校对建议？
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                        修改相关文本将导致当前建议失效。
                    </p>
                </div>
                <div className="flex gap-2.5">
                    <button
                        onClick={handleRemovalCancel}
                        className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-md text-xs font-medium transition-colors"
                    >
                        取消
                    </button>
                    <button
                        onClick={handleRemovalConfirm}
                        className="flex-1 px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md text-xs font-medium shadow-sm transition-colors"
                    >
                        确认移除
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Floating Correction Result Toggle - Only visible if we have results but panel is closed */}
      {!isCorrectionPanelOpen && checkResult.length > 0 && (
        <button
            onClick={() => setIsCorrectionPanelOpen(true)}
            className="fixed right-8 bottom-8 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg p-3 rounded-full hover:bg-gray-50 dark:hover:bg-gray-700 transition-all group flex items-center gap-2 animate-in fade-in slide-in-from-bottom-4"
            title="查看校对结果"
        >
            <div className="bg-indigo-100 dark:bg-indigo-900 p-1.5 rounded-full">
                <Sparkles size={18} className="text-indigo-600 dark:text-indigo-400" />
            </div>
            <span className="font-medium text-gray-700 dark:text-gray-200 pr-1 text-sm">校对结果</span>
            <span className="bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300 text-xs font-bold px-2 py-0.5 rounded-full">
                {checkResult.length}
            </span>
        </button>
      )}
    </div>
  );
};
