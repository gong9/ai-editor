/**
 * Text extraction utilities for converting DOM to plain text
 */

import { isBlockElement, isLineBreak, isCodeBlock } from './dom-utils';

/**
 * Extract plain text from DOM, preserving newlines for API consumption
 * Note: Code blocks are excluded
 */
export const extractTextFromDOM = (container: HTMLElement): string => {
  let text = '';
  
  const traverse = (node: Node) => {
    for (const child of Array.from(node.childNodes)) {
      // Skip code blocks entirely - don't process any of their content
      if (child.nodeType === Node.ELEMENT_NODE && isCodeBlock(child)) {
        continue;
      }
      
      if (child.nodeType === Node.TEXT_NODE) {
        text += child.textContent || '';
      } else if (isLineBreak(child)) {
        text += '\n';
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        // Recursively traverse element nodes
        traverse(child);
        
        // Add newline after block elements
        if (isBlockElement(child)) {
          text += '\n';
        }
      }
    }
  };
  
  traverse(container);
  return text;
};

