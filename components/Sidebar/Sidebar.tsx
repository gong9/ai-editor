import React, { useState } from 'react';
import { useFileSystem } from '../../contexts/FileSystemContext';
import { FileItem } from './FileItem';
import { FileSystemItem } from '../../types';
import { Plus, FolderPlus, Search, Settings, Trash2 } from 'lucide-react';
import { useTranslation } from '../../contexts/I18nContext';

export const Sidebar: React.FC = () => {
  const { items, activeFileId, setActiveFileId, createItem, deleteItem, updateItemName } = useFileSystem();
  const { t } = useTranslation();
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  const toggleFolder = (id: string) => {
    const newSet = new Set(expandedFolders);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setExpandedFolders(newSet);
  };

  // Recursive render
  const renderTree = (parentId: string | null, level = 0) => {
    const children = items.filter(item => item.parentId === parentId);
    
    return children.map(item => {
      const hasChildren = items.some(i => i.parentId === item.id);
      
      return (
        <React.Fragment key={item.id}>
          <FileItem 
            item={item}
            level={level}
            isActive={activeFileId === item.id}
            hasChildren={hasChildren}
            isExpanded={expandedFolders.has(item.id)}
            onToggle={() => toggleFolder(item.id)}
            onSelect={() => setActiveFileId(item.id)}
            onDelete={() => deleteItem(item.id)}
            onRename={(newName) => updateItemName(item.id, newName)}
          />
          {item.type === 'folder' && expandedFolders.has(item.id) && (
            renderTree(item.id, level + 1)
          )}
        </React.Fragment>
      );
    });
  };

  return (
    <div className="w-64 bg-[#f9f9fa] dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col h-full select-none hidden md:flex transition-colors duration-200">
      {/* Header */}
      <div className="p-4">
         <div className="flex items-center gap-2 font-semibold text-gray-700 dark:text-gray-200 mb-4 px-2">
             <div className="w-6 h-6 bg-lark-blue rounded flex items-center justify-center text-white text-xs">L</div>
             {t('sidebar.my_space')}
         </div>
         
         {/* Actions */}
         <div className="flex gap-2 mb-4">
             <button 
                onClick={() => createItem('file', null, 'New Page')}
                className="flex-1 flex items-center justify-center gap-1 bg-lark-blue hover:bg-lark-blueHover text-white text-xs py-1.5 rounded transition-colors shadow-sm"
             >
                <Plus size={14} />
                {t('sidebar.new_page')}
             </button>
             <button 
                onClick={() => createItem('folder', null, 'New Folder')}
                className="px-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 rounded transition-colors shadow-sm"
                title={t('sidebar.new_folder')}
             >
                <FolderPlus size={14} />
             </button>
         </div>

         {/* Search */}
         <div className="relative mb-2">
             <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
             <input 
               type="text" 
               placeholder={t('sidebar.search')}
               className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded pl-8 pr-2 py-1.5 text-xs text-gray-900 dark:text-gray-200 focus:outline-none focus:border-lark-blue dark:focus:border-lark-blue transition-colors placeholder:text-gray-400 dark:placeholder:text-gray-500"
             />
         </div>
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-y-auto pb-4 custom-scrollbar">
         {renderTree(null)}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50">
          <button className="flex items-center gap-3 w-full px-2 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors">
             <Trash2 size={16} className="text-gray-400 dark:text-gray-500" />
             {t('sidebar.trash')}
          </button>
          <button className="flex items-center gap-3 w-full px-2 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors">
             <Settings size={16} className="text-gray-400 dark:text-gray-500" />
             {t('sidebar.settings')}
          </button>
      </div>
    </div>
  );
};
