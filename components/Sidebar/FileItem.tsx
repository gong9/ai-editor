import React, { useState } from 'react';
import { FileText, Folder, FolderOpen, MoreHorizontal, ChevronRight, ChevronDown, Pencil, Trash2 } from 'lucide-react';
import { FileSystemItem } from '../../types';
import { useTranslation } from '../../contexts/I18nContext';

interface FileItemProps {
  item: FileSystemItem;
  level: number;
  isActive: boolean;
  hasChildren: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  onSelect: () => void;
  onDelete: () => void;
  onRename: (newName: string) => void;
}

export const FileItem: React.FC<FileItemProps> = ({
  item,
  level,
  isActive,
  hasChildren,
  isExpanded,
  onToggle,
  onSelect,
  onDelete,
  onRename
}) => {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(item.name);
  const [showMenu, setShowMenu] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editName.trim()) {
      onRename(editName);
      setIsEditing(false);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowMenu(true);
    // Simple "click outside to close" simulation
    const closeMenu = () => {
      setShowMenu(false);
      document.removeEventListener('click', closeMenu);
    };
    document.addEventListener('click', closeMenu);
  };

  return (
    <div className="relative select-none">
      <div 
        className={`flex items-center gap-2 px-3 py-1.5 cursor-pointer transition-colors group
          ${isActive ? 'bg-blue-50 text-lark-blue' : 'text-gray-700 hover:bg-gray-100'}
        `}
        style={{ paddingLeft: `${level * 12 + 12}px` }}
        onClick={() => {
          if (item.type === 'folder') {
            onToggle();
          } else {
            onSelect();
          }
        }}
        onContextMenu={handleContextMenu}
      >
        {/* Toggle Icon for Folders */}
        <div 
          className={`w-4 h-4 flex items-center justify-center text-gray-400 transition-transform
            ${!hasChildren && item.type === 'folder' ? 'invisible' : ''}
          `}
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
        >
          {item.type === 'folder' && (
            isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />
          )}
        </div>

        {/* Icon */}
        <div className={`${isActive ? 'text-lark-blue' : 'text-gray-500'}`}>
          {item.type === 'folder' ? (
            isExpanded ? <FolderOpen size={16} /> : <Folder size={16} />
          ) : (
            <FileText size={16} />
          )}
        </div>

        {/* Name or Edit Input */}
        {isEditing ? (
          <form onSubmit={handleSubmit} className="flex-1">
            <input 
              autoFocus
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={handleSubmit}
              onClick={(e) => e.stopPropagation()}
              className="w-full text-sm px-1 py-0.5 border border-lark-blue rounded bg-white outline-none"
            />
          </form>
        ) : (
          <span className="flex-1 text-sm truncate">{item.name}</span>
        )}

        {/* Action Menu Trigger (visible on hover or active) */}
        <button 
          className={`opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-gray-200 text-gray-500 transition-opacity ${showMenu ? 'opacity-100' : ''}`}
          onClick={(e) => {
             e.stopPropagation();
             setShowMenu(!showMenu);
          }}
        >
           <MoreHorizontal size={14} />
        </button>
      </div>

      {/* Context Menu */}
      {showMenu && (
        <div className="absolute right-2 top-8 z-50 w-32 bg-white rounded-lg shadow-xl border border-gray-200 py-1 animate-in fade-in zoom-in-95 duration-100">
           <button 
             className="flex items-center gap-2 w-full px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 text-left"
             onClick={(e) => {
                 e.stopPropagation();
                 setIsEditing(true);
                 setShowMenu(false);
             }}
            >
              <Pencil size={12} />
              {t('sidebar.rename')}
           </button>
           <button 
             className="flex items-center gap-2 w-full px-3 py-2 text-xs text-red-600 hover:bg-red-50 text-left"
             onClick={(e) => {
                 e.stopPropagation();
                 if (confirm(t('sidebar.confirm_delete'))) {
                    onDelete();
                 }
                 setShowMenu(false);
             }}
            >
              <Trash2 size={12} />
              {t('sidebar.delete')}
           </button>
        </div>
      )}
    </div>
  );
};
