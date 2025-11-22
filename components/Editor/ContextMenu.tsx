import React, { useEffect } from 'react';
import { 
  Trash2, 
  Copy, 
  CopyPlus, 
  Heading1, 
  Heading2, 
  List,
  Table,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Merge,
  Split
} from 'lucide-react';
import { useTranslation } from '../../contexts/I18nContext';

interface ContextMenuProps {
  position: { x: number; y: number };
  onClose: () => void;
  onAction: (action: string, payload?: any) => void;
  isTableActive?: boolean;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({ position, onClose, onAction, isTableActive }) => {
  const { t } = useTranslation();

  useEffect(() => {
    const handleClickOutside = () => onClose();
    const handleScroll = () => onClose();
    
    window.addEventListener('click', handleClickOutside);
    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('click', handleClickOutside);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [onClose]);

  const MenuButton = ({ icon: Icon, label, onClick, danger }: any) => (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`flex items-center w-full px-3 py-2 text-sm text-left hover:bg-gray-50 transition-colors gap-3
        ${danger ? 'text-red-600 hover:bg-red-50' : 'text-gray-700'}
      `}
    >
      <Icon size={16} className={danger ? 'text-red-500' : 'text-gray-500'} />
      {label}
    </button>
  );

  return (
    <div 
      className="fixed z-[100] w-64 bg-white rounded-lg shadow-xl border border-gray-200 py-1 animate-in fade-in zoom-in-95 duration-75 max-h-[80vh] overflow-y-auto"
      style={{ top: position.y, left: position.x }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {isTableActive ? (
        <>
          <div className="px-3 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            {t('context.table_actions')}
          </div>
          <MenuButton icon={ArrowUp} label={t('context.add_row_before')} onClick={() => onAction('table-add-row-before')} />
          <MenuButton icon={ArrowDown} label={t('context.add_row_after')} onClick={() => onAction('table-add-row-after')} />
          <MenuButton icon={ArrowLeft} label={t('context.add_col_before')} onClick={() => onAction('table-add-col-before')} />
          <MenuButton icon={ArrowRight} label={t('context.add_col_after')} onClick={() => onAction('table-add-col-after')} />
          <div className="my-1 border-t border-gray-100" />
          <MenuButton icon={Trash2} label={t('context.del_row')} onClick={() => onAction('table-delete-row')} />
          <MenuButton icon={Trash2} label={t('context.del_col')} onClick={() => onAction('table-delete-col')} />
          <div className="my-1 border-t border-gray-100" />
          <MenuButton icon={Merge} label={t('context.merge_cells')} onClick={() => onAction('table-merge-cells')} />
          <MenuButton icon={Split} label={t('context.split_cells')} onClick={() => onAction('table-split-cells')} />
          <div className="my-1 border-t border-gray-100" />
          <MenuButton icon={Trash2} label={t('context.delete_table')} danger onClick={() => onAction('table-delete')} />
          <div className="my-1 border-t border-gray-100" />
        </>
      ) : (
        <>
          <div className="px-3 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            {t('context.actions')}
          </div>
          
          <MenuButton 
            icon={Copy} 
            label={t('context.copy')}
            onClick={() => onAction('copy')} 
          />
          <MenuButton 
            icon={CopyPlus} 
            label={t('context.duplicate')}
            onClick={() => onAction('duplicate')} 
          />
          
          <div className="my-1 border-t border-gray-100" />
          
          <div className="px-3 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            {t('context.turn_into')}
          </div>
          <MenuButton 
            icon={Heading1} 
            label={t('slash.h1')}
            onClick={() => onAction('turn-into', 'h1')} 
          />
          <MenuButton 
            icon={Heading2} 
            label={t('slash.h2')}
            onClick={() => onAction('turn-into', 'h2')} 
          />
           <MenuButton 
            icon={List} 
            label={t('slash.bullet')}
            onClick={() => onAction('turn-into', 'bullet-list')} 
          />
          
          <div className="my-1 border-t border-gray-100" />
          
          <MenuButton 
            icon={Trash2} 
            label={t('context.delete')}
            danger
            onClick={() => onAction('delete')} 
          />
        </>
      )}
    </div>
  );
};