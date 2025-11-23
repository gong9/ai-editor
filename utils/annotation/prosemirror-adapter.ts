/**
 * ProseMirror integration utilities
 */

import { EditorView } from '@tiptap/pm/view';
import { isCodeBlock, isLineBreak, isBlockElement } from './dom-utils';

/**
 * Convert ProseMirror position to text offset (excluding newlines and code blocks)
 */
export const getTextOffsetFromPos = (editorView: EditorView, pmPos: number): number => {
  const dom = editorView.dom;
  let offset = 0;
  let found = false;

  const traverse = (node: Node) => {
    if (found) return;
    
    // Skip code blocks
    if (node.nodeType === Node.ELEMENT_NODE && isCodeBlock(node)) {
      return;
    }

    // Handle text nodes
    if (node.nodeType === Node.TEXT_NODE) {
      const nodePos = editorView.posAtDOM(node, 0);
      if (nodePos !== null) {
        const textLength = (node.nodeValue || '').length;
        
        if (nodePos + textLength >= pmPos) {
          offset += pmPos - nodePos;
          found = true;
          return;
        }
        
        offset += textLength;
      }
    }
    // Handle line breaks (don't count for UI offset)
    else if (isLineBreak(node)) {
      // Skip - newlines are not counted
    }
    // Handle element nodes
    else {
      for (const child of Array.from(node.childNodes)) {
        traverse(child);
        if (found) return;
      }
      
      // Don't count block boundaries
      if (isBlockElement(node)) {
        // Skip - block boundaries are not counted
      }
    }
  };

  traverse(dom);
  return offset;
};

