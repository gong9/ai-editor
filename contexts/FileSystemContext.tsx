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
    name: 'Welcome to LarkLite',
    type: 'file',
    content: `<h1>Welcome to LarkLite</h1><p>This is your new workspace. Go ahead and edit this page!</p>`,
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
