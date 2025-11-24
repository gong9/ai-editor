import React from 'react';
import { NodeViewWrapper, NodeViewContent } from '@tiptap/react';
import { Copy, Check, ChevronDown, Sparkles, BookOpen, Trash2 } from 'lucide-react';
import { useTranslation } from '../../contexts/I18nContext';

interface CodeBlockComponentProps {
  node: {
    attrs: {
      language: string;
    };
    textContent: string;
  };
  updateAttributes: (attrs: { language: string }) => void;
  deleteNode: () => void;
  extension: any;
}

export const CodeBlockComponent: React.FC<CodeBlockComponentProps> = ({
  node,
  updateAttributes,
  deleteNode,
  extension,
}) => {
  const { t } = useTranslation();
  const [isCopied, setIsCopied] = React.useState(false);

  const languages = extension.options.lowlight.listLanguages();

  const handleCopy = () => {
    const code = node.textContent;
    navigator.clipboard.writeText(code);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <NodeViewWrapper className="code-block-wrapper relative group rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 my-6 shadow-sm transition-colors duration-200">
      {/* Header */}
      <div 
        className="flex items-center justify-between px-3 py-2 bg-[#f5f6f7] dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 select-none transition-colors duration-200" 
        contentEditable={false}
      >
        {/* Left: Language Selector */}
        <div className="relative flex items-center gap-2">
          <div className="relative">
            <select
              contentEditable={false}
              value={node.attrs.language || 'null'} // Changed from defaultValue to value for controlled component
              onChange={(event) => updateAttributes({ language: event.target.value })}
              className="appearance-none bg-transparent text-xs font-medium text-gray-600 dark:text-gray-300 uppercase cursor-pointer pr-4 focus:outline-none hover:text-lark-blue dark:hover:text-lark-blueHover transition-colors"
            >
              <option value="null" className="dark:bg-gray-800">Text</option>
              {languages.map((lang: string) => (
                <option key={lang} value={lang} className="dark:bg-gray-800">
                  {lang}
                </option>
              ))}
              {/* Fallback option if the current language (alias) isn't in the list */}
              {node.attrs.language && node.attrs.language !== 'null' && !languages.includes(node.attrs.language) && (
                 <option value={node.attrs.language} className="dark:bg-gray-800">{node.attrs.language}</option>
              )}
            </select>
            <ChevronDown size={12} className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none" />
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-4 text-xs">
          <button 
            onClick={handleCopy}
            className="flex items-center gap-1 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            title="Copy code"
          >
            {isCopied ? <Check size={12} className="text-green-600 dark:text-green-400" /> : <Copy size={12} />}
            <span>{isCopied ? 'Copied' : 'Copy'}</span>
          </button>

          <div className="w-px h-3 bg-gray-300 dark:bg-gray-600 hidden sm:block"></div>

          <button 
            onClick={deleteNode}
            className="flex items-center gap-1 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"
            title="Delete block"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {/* Content (Code Area) */}
      <pre className="!m-0 !rounded-none !bg-[#282c34] dark:!bg-[#1e2025] !p-4 text-sm leading-relaxed">
        <NodeViewContent as="code" />
      </pre>
    </NodeViewWrapper>
  );
};
