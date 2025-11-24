import React from 'react';
import { useFileSystem } from '../../contexts/FileSystemContext';
import { Plus, FileText, Clock } from 'lucide-react';
import { useTranslation } from '../../contexts/I18nContext';
import { useNavigate } from 'react-router-dom';

export const WorkspaceHome: React.FC = () => {
  const { items, createItem, setActiveFileId } = useFileSystem();
  const { t, language } = useTranslation();
  const navigate = useNavigate();

  // Handle file navigation
  const handleFileClick = (id: string) => {
      setActiveFileId(id);
      navigate(`/article/${id}`);
  };

  // 根据北京时间获取问候语
  const getGreeting = () => {
    // 获取北京时间（UTC+8）
    const now = new Date();
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const beijingTime = new Date(utc + (3600000 * 8));
    const hour = beijingTime.getHours();

    if (language === 'zh-CN') {
      if (hour >= 0 && hour < 6) return '凌晨好，夜猫子';
      if (hour >= 6 && hour < 12) return '早安，开始创作吧';
      if (hour >= 12 && hour < 14) return '午安，继续加油';
      if (hour >= 14 && hour < 18) return '下午好，创作愉快';
      if (hour >= 18 && hour < 22) return '晚上好，灵感之夜';
      return '夜深了，注意休息';
    } else {
      if (hour >= 0 && hour < 6) return 'Late Night, Night Owl';
      if (hour >= 6 && hour < 12) return 'Good Morning';
      if (hour >= 12 && hour < 14) return 'Good Noon';
      if (hour >= 14 && hour < 18) return 'Good Afternoon';
      if (hour >= 18 && hour < 22) return 'Good Evening';
      return 'Good Night, Take a Rest';
    }
  };

  const recentFiles = items
    .filter(i => i.type === 'file')
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 6);

  return (
    <div className="flex-1 h-full bg-white dark:bg-gray-900 overflow-y-auto transition-colors duration-200">
      <div className="max-w-5xl mx-auto px-8 py-12">
        {/* Welcome Header */}
        <div className="mb-12">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">{getGreeting()}</h1>
          <p className="text-gray-500 dark:text-gray-400">{language === 'zh-CN' ? '一切始于一个想法。' : 'Everything starts with an idea.'}</p>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
           <button 
             onClick={() => createItem('file', null, 'New Page')}
             className="flex flex-col items-center justify-center gap-4 p-6 bg-lark-blue/5 dark:bg-lark-blue/10 border border-lark-blue/20 dark:border-lark-blue/30 rounded-xl hover:bg-lark-blue/10 dark:hover:bg-lark-blue/20 hover:shadow-md transition-all group"
           >
              <div className="w-12 h-12 bg-lark-blue rounded-full flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                <Plus size={24} />
              </div>
              <span className="font-semibold text-lark-blue dark:text-lark-blueHover">{t('workspace.create_new')}</span>
           </button>
           {/* Placeholder actions */}
           <div className="p-6 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm">
               Templates (Coming Soon)
           </div>
           <div className="p-6 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm">
               Import (Coming Soon)
           </div>
        </div>

        {/* Recent Files */}
        <div>
           <div className="flex items-center gap-2 mb-6 text-gray-500 dark:text-gray-400 text-sm font-medium uppercase tracking-wider">
              <Clock size={16} />
              {t('workspace.recent')}
           </div>

           {recentFiles.length > 0 ? (
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
               {recentFiles.map(file => (
                 <div 
                   key={file.id}
                   onClick={() => handleFileClick(file.id)}
                   className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-lark-blue dark:hover:border-lark-blue hover:shadow-md cursor-pointer transition-all bg-white dark:bg-gray-800 group"
                 >
                    <div className="flex items-start justify-between mb-3">
                       <FileText className="text-gray-400 dark:text-gray-500 group-hover:text-lark-blue dark:group-hover:text-lark-blue transition-colors" size={24} />
                       <span className="text-xs text-gray-400 dark:text-gray-500">
                         {new Date(file.createdAt).toLocaleDateString()}
                       </span>
                    </div>
                    <h3 className="font-medium text-gray-800 dark:text-gray-200 truncate">{file.name}</h3>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 truncate">
                        {file.content?.replace(/<[^>]*>?/gm, '').slice(0, 50) || 'No content...'}
                    </p>
                 </div>
               ))}
             </div>
           ) : (
             <div className="text-center py-12 text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
                {t('workspace.empty')}
             </div>
           )}
        </div>
      </div>
    </div>
  );
};
