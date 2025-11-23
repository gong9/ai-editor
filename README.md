# AI Editor

一个现代化的、支持 AI 智能校对的富文本编辑器。基于 React、Tiptap 和 Tailwind CSS 构建。

## ✨ 核心特性

- **📝 富文本编辑**
- **🤖 AI 智能校对**：
- **⚡️ 高效操作**：

## 🛠 技术栈

- **核心框架**: [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **编辑器内核**: [Tiptap](https://tiptap.dev/) (基于 ProseMirror)
- **样式方案**: [Tailwind CSS](https://tailwindcss.com/) + [Lucide Icons](https://lucide.dev/)
- **构建工具**: [Vite](https://vitejs.dev/)

## 📂 核心目录
```txt
src/
├── components/
│   └── Editor/          # 编辑器核心组件
│       ├── Editor.tsx       # 主编辑器入口
│       ├── CorrectionPanel/ # 右侧校对面板
│       └── Toolbar.tsx      # 顶部工具栏
├── extensions/          # Tiptap 自定义扩展 (如校对高亮)
├── utils/
│   └── annotation/      # AI 校对核心算法 (位置计算、文本提取)
└── services/            # API 服务集成## 
```

## 🚀 快速开始

1. **安装依赖**
   npm install
2. **启动开发环境**
   npm run dev
   