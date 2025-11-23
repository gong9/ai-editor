/**
 * Text correction and annotation system
 * 
 * This module provides utilities for:
 * - Mapping correction items to DOM text nodes
 * - Rendering visual highlights for corrections
 * - Extracting text from DOM
 * - Updating positions during text editing
 * - Integrating with ProseMirror editor
 */

// Types
export type { CorrectionItem, Annotation, TextNodePosition } from './types';
export { ErrorType } from './types';

// Constants
export { ERROR_COLORS, HIGHLIGHT_STYLES } from './constants';

// Core functionality
export { createHighlight } from './highlight-renderer';
export { extractTextFromDOM } from './text-extraction';
export { handleUpdateDeletePosition, handleUpdateInsertPosition } from './position-updater';
export { getTextOffsetFromPos } from './prosemirror-adapter';

// Position conversion
export { 
  convertTextOffsetToProseMirrorPos,
  convertProseMirrorPosToTextOffset,
  convertToProseMirrorPositions,
  convertToTextOffsets
} from './position-converter';

// Plugin and extension
export { createCorrectionPlugin, correctionPluginKey } from './correction-plugin';

// Utilities
export { generateId } from './utils';

// DOM utilities (if needed externally)
export { 
  isBlockElement, 
  isLineBreak, 
  isCodeBlock, 
  isInsideCodeBlock,
  getCommonAncestor,
  getNodesBetween,
  createDOMRange
} from './dom-utils';

