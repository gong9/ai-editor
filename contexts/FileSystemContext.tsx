import React, { createContext, useContext, useEffect, useState } from 'react';
import localforage from 'localforage';
import { FileSystemItem, FileType } from '../types';
import { generateId } from '../utils/uid';

interface FileSystemContextProps {
  items: FileSystemItem[];
  activeFileId: string | null;
  setActiveFileId: (id: string | null) => void;
  createItem: (type: FileType, parentId: string | null, name: string) => Promise<string>;
  updateItemContent: (id: string, content: string) => Promise<void>;
  updateItemName: (id: string, name: string) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  getActiveFile: () => FileSystemItem | undefined;
  isLoading: boolean;
}

const FileSystemContext = createContext<FileSystemContextProps | undefined>(undefined);

const STORE_KEY = 'larklite_fs_v1';

// Default initial data
const INITIAL_ITEMS: FileSystemItem[] = [
  {
    id: 'root_welcome',
    parentId: null,
    name: '欢迎使用 LarkLite',
    type: 'file',
    content: `<h1>👋 欢迎使用 LarkLite</h1>
<p>LarkLite 是一个现代化的智能文档编辑器，致力于提供流畅的写作体验。</p>
<h2>✨ AI 智能校对</h2>
<p>我们内置了强大的 AI 校对助手，可以帮助你发现并修正文中的拼写错误、语法问题和润色建议。</p>
<blockquote>
<p><strong>试一试：</strong><br>
点击顶部工具栏右侧的 <strong>✨ 校对按钮</strong>，AI 将自动分析本文内容。</p>
</blockquote>
<h3>👇 这是一个包含错误的示例段落：</h3>
<p>Welcome to LarkLite! This is a inteligent editor that help you writting better. It can fix speling errors and grammer misstakes automatically.</p>
<p>中文测试：这一段话里有几个错别字，比如我们将“既然”写成了“技然”，把“以后”写成了“以侯”。请尝试使用校对功能来修复它们。</p>
<hr>
<p>祝你创作愉快！</p>`,
    createdAt: Date.now()
  }
];

export const FileSystemProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<FileSystemItem[]>([]);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const stored = await localforage.getItem<FileSystemItem[]>(STORE_KEY);
        if (stored) {
          setItems(stored);
        } else {
          setItems(INITIAL_ITEMS);
          await localforage.setItem(STORE_KEY, INITIAL_ITEMS);
        }
      } catch (err) {
        console.error('Failed to load filesystem:', err);
        setItems(INITIAL_ITEMS);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  // Save data whenever items change
  useEffect(() => {
    if (!isLoading && items.length > 0) {
      localforage.setItem(STORE_KEY, items).catch(err => console.error('Failed to save filesystem:', err));
    }
  }, [items, isLoading]);

  const createItem = async (type: FileType, parentId: string | null, name: string): Promise<string> => {
    const newItem: FileSystemItem = {
      id: generateId(),
      parentId,
      name,
      type,
      content: type === 'file' ? '' : undefined,
      createdAt: Date.now(),
    };

    setItems(prev => [...prev, newItem]);
    
    if (type === 'file') {
      setActiveFileId(newItem.id);
    }
    return newItem.id;
  };

  const updateItemContent = async (id: string, content: string) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, content } : item
    ));
  };

  const updateItemName = async (id: string, name: string) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, name } : item
    ));
  };

  const deleteItem = async (id: string) => {
    // Recursive delete? For now just simple delete
    // Also need to delete children if folder
    const idsToDelete = new Set<string>([id]);
    
    // Simple approach: Find all descendants (inefficient but works for small depth)
    let changed = true;
    while(changed) {
      changed = false;
      items.forEach(item => {
        if (item.parentId && idsToDelete.has(item.parentId) && !idsToDelete.has(item.id)) {
          idsToDelete.add(item.id);
          changed = true;
        }
      });
    }

    setItems(prev => prev.filter(item => !idsToDelete.has(item.id)));
    if (activeFileId && idsToDelete.has(activeFileId)) {
      setActiveFileId(null);
    }
  };

  const getActiveFile = () => items.find(i => i.id === activeFileId);

  return (
    <FileSystemContext.Provider value={{
      items,
      activeFileId,
      setActiveFileId,
      createItem,
      updateItemContent,
      updateItemName,
      deleteItem,
      getActiveFile,
      isLoading
    }}>
      {children}
    </FileSystemContext.Provider>
  );
};

export const useFileSystem = () => {
  const context = useContext(FileSystemContext);
  if (!context) {
    throw new Error('useFileSystem must be used within a FileSystemProvider');
  }
  return context;
};
