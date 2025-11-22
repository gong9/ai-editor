import React from 'react';
import { useFileSystem } from '../../contexts/FileSystemContext';
import { Plus, FileText, Clock } from 'lucide-react';
import { useTranslation } from '../../contexts/I18nContext';

export const WorkspaceHome: React.FC = () => {
  const { items, createItem, setActiveFileId } = useFileSystem();
  const { t } = useTranslation();

  const recentFiles = items
    .filter(i => i.type === 'file')
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 6);

  return (
    <div className="flex-1 h-full bg-white overflow-y-auto">
      <div className="max-w-5xl mx-auto px-8 py-12">
        {/* Welcome Header */}
        <div className="mb-12">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">{t('workspace.welcome')}</h1>
          <p className="text-gray-500">Everything starts with an idea.</p>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
           <button 
             onClick={() => createItem('file', null, 'New Page')}
             className="flex flex-col items-center justify-center gap-4 p-6 bg-lark-blue/5 border border-lark-blue/20 rounded-xl hover:bg-lark-blue/10 hover:shadow-md transition-all group"
           >
              <div className="w-12 h-12 bg-lark-blue rounded-full flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                <Plus size={24} />
              </div>
              <span className="font-semibold text-lark-blue">{t('workspace.create_new')}</span>
           </button>
           {/* Placeholder actions */}
           <div className="p-6 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-center text-gray-400 text-sm">
               Templates (Coming Soon)
           </div>
           <div className="p-6 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-center text-gray-400 text-sm">
               Import (Coming Soon)
           </div>
        </div>

        {/* Recent Files */}
        <div>
           <div className="flex items-center gap-2 mb-6 text-gray-500 text-sm font-medium uppercase tracking-wider">
              <Clock size={16} />
              {t('workspace.recent')}
           </div>

           {recentFiles.length > 0 ? (
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
               {recentFiles.map(file => (
                 <div 
                   key={file.id}
                   onClick={() => setActiveFileId(file.id)}
                   className="p-4 border border-gray-200 rounded-lg hover:border-lark-blue hover:shadow-md cursor-pointer transition-all bg-white group"
                 >
                    <div className="flex items-start justify-between mb-3">
                       <FileText className="text-gray-400 group-hover:text-lark-blue transition-colors" size={24} />
                       <span className="text-xs text-gray-400">
                         {new Date(file.createdAt).toLocaleDateString()}
                       </span>
                    </div>
                    <h3 className="font-medium text-gray-800 truncate">{file.name}</h3>
                    <p className="text-xs text-gray-400 mt-1 truncate">
                        {file.content?.replace(/<[^>]*>?/gm, '').slice(0, 50) || 'No content...'}
                    </p>
                 </div>
               ))}
             </div>
           ) : (
             <div className="text-center py-12 text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                {t('workspace.empty')}
             </div>
           )}
        </div>
      </div>
    </div>
  );
};
