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