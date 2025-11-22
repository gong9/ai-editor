import React, { createContext, useContext, useState, ReactNode } from 'react';

type Language = 'zh-CN' | 'en-US';

const translations = {
  'zh-CN': {
    'nav.workspace': '我的空间',
    'nav.untitled': '无标题页面',
    'nav.saved': '已保存',
    'nav.saving': '保存中...',
    'nav.share': '分享',
    'nav.login': '登录',
    'footer.hint': '输入 / 使用命令',
    
    'editor.welcome': '欢迎使用 LarkLite',
    'editor.initial_text': '输入 "/" 查看命令或直接开始写作。',
    'editor.add_cover': '添加封面',
    'editor.change_cover': '随机切换',
    'editor.remove_cover': '移除封面',
    'editor.ai_loading': 'AI 正在写作...',
    'editor.image_upload_hint': '请使用工具栏的图片按钮或直接粘贴图片。',
    'editor.api_missing': '缺少 Gemini API Key！',
    'editor.ai_prompt_default': '写一段关于有趣内容的话。',

    'slash.basic': '基础组件',
    'slash.text': '文本',
    'slash.text.desc': '开始书写纯文本。',
    'slash.h1': '一级标题',
    'slash.h1.desc': '大标题，用于主要章节。',
    'slash.h2': '二级标题',
    'slash.h2.desc': '中标题，用于子章节。',
    'slash.h3': '三级标题',
    'slash.h3.desc': '小标题，用于细分内容。',
    'slash.bullet': '无序列表',
    'slash.bullet.desc': '创建简单的点状列表。',
    'slash.numbered': '有序列表',
    'slash.numbered.desc': '创建带序号的列表。',
    'slash.quote': '引用',
    'slash.quote.desc': '引用一段文字。',
    'slash.code': '代码块',
    'slash.code.desc': '插入代码片段。',
    'slash.table': '表格',
    'slash.table.desc': '插入一个简单的表格。',
    'slash.divider': '分割线',
    'slash.divider.desc': '视觉上的分隔。',
    'slash.image': '图片',
    'slash.image.desc': '上传或嵌入图片。',
    'slash.ai': '询问 AI',
    'slash.ai.desc': '使用 Gemini 生成内容。',

    'toolbar.h1': '一级标题',
    'toolbar.h2': '二级标题',
    'toolbar.h3': '三级标题',
    'toolbar.text': '正文',
    'toolbar.bold': '加粗 (Cmd+B)',
    'toolbar.italic': '斜体 (Cmd+I)',
    'toolbar.underline': '下划线 (Cmd+U)',
    'toolbar.strike': '删除线',
    'toolbar.highlight': '高亮',
    'toolbar.link': '插入链接',
    'toolbar.link.prompt': '输入链接地址:',
    'toolbar.bullet': '无序列表',
    'toolbar.numbered': '有序列表',
    'toolbar.quote': '引用',
    'toolbar.code': '代码块',
    'toolbar.image': '插入图片',
    'toolbar.table': '插入表格',

    'outline.title': '大纲',
    'outline.untitled': '无标题',

    'context.actions': '块操作',
    'context.table_actions': '表格操作',
    'context.copy': '复制文本',
    'context.duplicate': '创建副本',
    'context.turn_into': '转换为',
    'context.delete': '删除',
    'context.delete_table': '删除表格',
    'context.add_col_before': '向左插入列',
    'context.add_col_after': '向右插入列',
    'context.del_col': '删除列',
    'context.add_row_before': '向上插入行',
    'context.add_row_after': '向下插入行',
    'context.del_row': '删除行',
    'context.merge_cells': '合并单元格',
    'context.split_cells': '拆分单元格',

    'block.loading_image': '图片加载中...',
    'block.placeholder': '输入 "/" 使用命令',
    'block.placeholder.empty': '输入 "/" 使用命令',

    'sidebar.new_page': '新建页面',
    'sidebar.new_folder': '新建文件夹',
    'sidebar.search': '搜索...',
    'sidebar.my_space': '我的空间',
    'sidebar.trash': '回收站',
    'sidebar.settings': '设置',
    'sidebar.rename': '重命名',
    'sidebar.delete': '删除',
    'sidebar.confirm_delete': '确定要删除吗？',
    
    'workspace.welcome': '早安，开始创作吧',
    'workspace.recent': '最近打开',
    'workspace.create_new': '创建新页面',
    'workspace.empty': '还没有创建任何页面',

    'bubble.ai': 'AI 写作',
    'bubble.link': '链接',

    'modal.link.title': '插入链接',
    'modal.link.text': '显示文本',
    'modal.link.url': '链接',
    'modal.confirm': '确认',
    'modal.cancel': '取消',
  },
  'en-US': {
    'nav.workspace': 'My Workspace',
    'nav.untitled': 'Untitled Page',
    'nav.saved': 'Saved',
    'nav.saving': 'Saving...',
    'nav.share': 'Share',
    'nav.login': 'Login',
    'footer.hint': 'Type / for commands',

    'editor.welcome': 'Welcome to LarkLite',
    'editor.initial_text': 'Type "/" to browse commands or just start writing.',
    'editor.add_cover': 'Add Cover',
    'editor.change_cover': 'Random Cover',
    'editor.remove_cover': 'Remove',
    'editor.ai_loading': 'AI writing...',
    'editor.image_upload_hint': 'Please use the Image button in the toolbar or Paste an image.',
    'editor.api_missing': 'Gemini API Key is missing!',
    'editor.ai_prompt_default': 'Write a paragraph about something interesting.',

    'slash.basic': 'Basic Blocks',
    'slash.text': 'Text',
    'slash.text.desc': 'Start writing with plain text.',
    'slash.h1': 'Heading 1',
    'slash.h1.desc': 'Big section heading.',
    'slash.h2': 'Heading 2',
    'slash.h2.desc': 'Medium section heading.',
    'slash.h3': 'Heading 3',
    'slash.h3.desc': 'Small section heading.',
    'slash.bullet': 'Bullet List',
    'slash.bullet.desc': 'Create a simple bulleted list.',
    'slash.numbered': 'Numbered List',
    'slash.numbered.desc': 'Create a list with numbering.',
    'slash.quote': 'Quote',
    'slash.quote.desc': 'Capture a quote.',
    'slash.code': 'Code Block',
    'slash.code.desc': 'Capture a code snippet.',
    'slash.table': 'Table',
    'slash.table.desc': 'Insert a simple table.',
    'slash.divider': 'Divider',
    'slash.divider.desc': 'Visually divide blocks.',
    'slash.image': 'Image',
    'slash.image.desc': 'Upload or embed an image.',
    'slash.ai': 'Ask AI',
    'slash.ai.desc': 'Generate text with Gemini.',

    'toolbar.h1': 'Heading 1',
    'toolbar.h2': 'Heading 2',
    'toolbar.h3': 'Heading 3',
    'toolbar.text': 'Text',
    'toolbar.bold': 'Bold (Cmd+B)',
    'toolbar.italic': 'Italic (Cmd+I)',
    'toolbar.underline': 'Underline (Cmd+U)',
    'toolbar.strike': 'Strikethrough',
    'toolbar.highlight': 'Highlight',
    'toolbar.link': 'Insert Link',
    'toolbar.link.prompt': 'Enter URL:',
    'toolbar.bullet': 'Bullet List',
    'toolbar.numbered': 'Numbered List',
    'toolbar.quote': 'Quote',
    'toolbar.code': 'Code Block',
    'toolbar.image': 'Insert Image',
    'toolbar.table': 'Insert Table',

    'outline.title': 'Outline',
    'outline.untitled': 'Untitled',

    'context.actions': 'Block Actions',
    'context.table_actions': 'Table Actions',
    'context.copy': 'Copy Text',
    'context.duplicate': 'Duplicate',
    'context.turn_into': 'Turn Into',
    'context.delete': 'Delete',
    'context.delete_table': 'Delete Table',
    'context.add_col_before': 'Add Column Left',
    'context.add_col_after': 'Add Column Right',
    'context.del_col': 'Delete Column',
    'context.add_row_before': 'Add Row Above',
    'context.add_row_after': 'Add Row Below',
    'context.del_row': 'Delete Row',
    'context.merge_cells': 'Merge Cells',
    'context.split_cells': 'Split Cells',

    'block.loading_image': 'Loading Image...',
    'block.placeholder': "Type '/' for commands",
    'block.placeholder.empty': "Type '/' for commands",

    'sidebar.new_page': 'New Page',
    'sidebar.new_folder': 'New Folder',
    'sidebar.search': 'Search...',
    'sidebar.my_space': 'My Workspace',
    'sidebar.trash': 'Trash',
    'sidebar.settings': 'Settings',
    'sidebar.rename': 'Rename',
    'sidebar.delete': 'Delete',
    'sidebar.confirm_delete': 'Are you sure you want to delete this?',

    'workspace.welcome': 'Good morning, ready to write?',
    'workspace.recent': 'Recent Pages',
    'workspace.create_new': 'Create New Page',
    'workspace.empty': 'No pages created yet',

    'bubble.ai': 'AI Write',
    'bubble.link': 'Link',

    'modal.link.title': 'Insert Link',
    'modal.link.text': 'Text',
    'modal.link.url': 'URL',
    'modal.confirm': 'Confirm',
    'modal.cancel': 'Cancel',
  }
};

interface I18nContextProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof typeof translations['zh-CN']) => string;
}

const I18nContext = createContext<I18nContextProps | undefined>(undefined);

export const I18nProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('zh-CN');

  const t = (key: keyof typeof translations['zh-CN']) => {
    return translations[language][key] || key;
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useTranslation must be used within an I18nProvider');
  }
  return context;
};