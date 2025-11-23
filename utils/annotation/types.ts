/**
 * Type definitions for text correction and annotation system
 */

export interface CorrectionItem {
  id: string;
  // ProseMirror positions (used by Decoration system)
  from: number;
  to: number;
  // Keep globalOffset for API compatibility (will be converted)
  globalOffset?: [number, number];
  misspelledWord: string;
  suggestion: [string, number, string, [number, string], string, string | null, string | null, number, number][];
  suggestionList: any[];
  category: any;
  is_adopt?: number;
  select?: boolean;
}

export interface Annotation extends CorrectionItem {
  // Legacy fields - kept for backward compatibility during migration
  l?: number;
  r?: number;
  textColor?: string;
  startNode?: Node;
  startOffset?: number;
  endNode?: Node;
  endOffset?: number;
  highlightBoxes?: HTMLElement[];
  nodesBetween?: Node[];
  range?: Range;
  viewPosition?: [string, string];
}

export interface TextNodePosition {
  startNode: Node;
  startOffset: number;
  endNode?: Node;
  endOffset?: number;
  id: string;
  original: CorrectionItem;
}

export enum ErrorType {
  TYPO = 1,
  SEMANTIC = 2
}

