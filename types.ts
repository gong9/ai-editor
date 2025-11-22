export type BlockType = 
  | 'paragraph' 
  | 'h1' 
  | 'h2' 
  | 'h3' 
  | 'bullet-list' 
  | 'numbered-list' 
  | 'quote' 
  | 'code'
  | 'divider'
  | 'image';

export interface BlockData {
  id: string;
  type: BlockType;
  content: string;
  props?: Record<string, any>;
}

export interface Coordinates {
  x: number;
  y: number;
}

export type FileType = 'file' | 'folder';

export interface FileSystemItem {
  id: string;
  parentId: string | null;
  name: string;
  type: FileType;
  content?: string; // Only for files
  createdAt: number;
  children?: string[]; // IDs of children
}
