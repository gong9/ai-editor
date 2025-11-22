import React, { useCallback, useEffect } from 'react';
import { Editor } from './components/Editor/Editor';
import { Sidebar } from './components/Sidebar/Sidebar';
import { WorkspaceHome } from './components/Workspace/WorkspaceHome';
import { CheckCircle2, Languages, Loader2 } from 'lucide-react';
import { I18nProvider, useTranslation } from './contexts/I18nContext';
import { FileSystemProvider, useFileSystem } from './contexts/FileSystemContext';

const AppContent = () => {
  const { t, language, setLanguage } = useTranslation();
  const { getActiveFile, activeFileId, setActiveFileId, updateItemContent, updateItemName, isLoading } = useFileSystem();
  
  const activeFile = getActiveFile();
  const [saveStatus, setSaveStatus] = React.useState<'saved' | 'saving'>('saved');
  const [documentTitle, setDocumentTitle] = React.useState<string>('');
  const currentContentRef = React.useRef<string>('');

  const toggleLanguage = () => {
    setLanguage(language === 'zh-CN' ? 'en-US' : 'zh-CN');
  };

  // 从 HTML 内容中提取第一个 H1 标题
  const extractH1Title = (htmlContent: string): string => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    const h1 = doc.querySelector('h1');
    return h1 ? h1.textContent?.trim() || '' : '';
  };

  // 手动保存时提取标题并保存
  const handleManualSave = useCallback(() => {
    if (activeFileId && currentContentRef.current) {
      // 提取并更新标题
      const title = extractH1Title(currentContentRef.current);
      
      if (title) {
        setDocumentTitle(title);
        // 同时更新侧边栏的文件名
        updateItemName(activeFileId, title);
      }
      
      // 保存内容
      setSaveStatus('saving');
      updateItemContent(activeFileId, currentContentRef.current).then(() => {
        setTimeout(() => setSaveStatus('saved'), 500);
      });
    }
  }, [activeFileId, updateItemContent, updateItemName]);

  const handleEditorChange = useCallback((content: string) => {
    currentContentRef.current = content;
    if (activeFileId) {
        setSaveStatus('saving');
        updateItemContent(activeFileId, content).then(() => {
            // Small delay to show "Saving..." state briefly
            setTimeout(() => setSaveStatus('saved'), 500);
        });
    }
  }, [activeFileId, updateItemContent]);

  // 当打开文件时，初始化标题
  useEffect(() => {
    if (activeFile && activeFile.content) {
      const title = extractH1Title(activeFile.content);
      setDocumentTitle(title);
      currentContentRef.current = activeFile.content;
    } else {
      setDocumentTitle('');
      currentContentRef.current = '';
    }
  }, [activeFileId, activeFile?.content]);

  if (isLoading) {
      return <div className="min-h-screen flex items-center justify-center text-lark-blue"><Loader2 className="animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen bg-white text-gray-900 selection:bg-lark-blue/20 selection:text-lark-blueHover flex overflow-hidden h-screen">
      {/* Sidebar - Always visible on desktop */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
          
          {activeFile ? (
              <>
                {/* Navbar for Editor */}
                <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100 h-14 flex items-center justify-between px-4 lg:px-8 shrink-0">
                    <div className="flex items-center gap-3">
                        {/* Breadcrumb */}
                        <span className="font-medium text-gray-600 text-sm flex items-center gap-2">
                            <span 
                                className="cursor-pointer hover:text-gray-900 hover:underline transition-colors"
                                onClick={() => setActiveFileId(null)} // Go back to home
                            >
                                {t('nav.workspace')}
                            </span> 
                            <span className="text-gray-300">/</span> 
                            <span className="text-gray-900">{documentTitle || activeFile.name || t('nav.untitled')}</span>
                        </span>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5 text-xs text-gray-500 transition-all">
                            {saveStatus === 'saved' ? (
                                <>
                                    <CheckCircle2 size={14} className="text-green-500" />
                                    <span>{t('nav.saved')}</span>
                                </>
                            ) : (
                                <>
                                    <Loader2 size={14} className="animate-spin text-gray-400" />
                                    <span>{t('nav.saving')}</span>
                                </>
                            )}
                        </div>
                        
                        <button 
                        onClick={toggleLanguage}
                        className="text-gray-600 hover:bg-gray-100 p-1.5 rounded-md transition-colors"
                        title="Switch Language"
                        >
                        <Languages size={18} />
                        </button>

                        <button className="text-sm font-medium text-gray-600 hover:bg-gray-100 px-3 py-1.5 rounded-md transition-colors">
                            {t('nav.share')}
                        </button>
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-400 to-lark-blue"></div>
                    </div>
                </nav>
                
                {/* Editor Container - Scrollable */}
                <div className="flex-1 overflow-y-auto bg-white">
                    <Editor 
                        key={activeFile.id} // Force re-mount when file changes
                        initialContent={activeFile.content || ''}
                        onChange={handleEditorChange}
                        onSave={handleManualSave}
                    />
                </div>
              </>
          ) : (
              // Workspace Home (Dashboard)
              <div className="flex-1 flex flex-col h-full">
                   <nav className="h-14 border-b border-gray-100 px-4 flex items-center justify-end">
                        <button 
                            onClick={toggleLanguage}
                            className="text-gray-600 hover:bg-gray-100 p-1.5 rounded-md transition-colors mr-2"
                            title="Switch Language"
                        >
                            <Languages size={18} />
                        </button>
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-400 to-lark-blue"></div>
                   </nav>
                   <WorkspaceHome />
              </div>
          )}

          {/* Help / Footer Hint */}
          {activeFile && (
            <div className="fixed bottom-4 left-64 text-xs text-gray-400 hidden lg:block pl-4">
                {t('footer.hint').split('/').map((part, i, arr) => (
                    <React.Fragment key={i}>
                        {part}
                        {i < arr.length - 1 && (
                            <kbd className="bg-gray-100 px-1 py-0.5 rounded border border-gray-200 text-gray-500 font-sans mx-1">/</kbd>
                        )}
                    </React.Fragment>
                ))}
            </div>
          )}
      </div>
    </div>
  );
};

function App() {
  return (
    <I18nProvider>
      <FileSystemProvider>
        <AppContent />
      </FileSystemProvider>
    </I18nProvider>
  );
}

export default App;
