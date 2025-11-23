/**
 * Text extraction utilities directly from ProseMirror document
 * This ensures 100% consistency with the positioning logic
 */

import { Editor } from '@tiptap/react';
import { Node } from '@tiptap/pm/model';

/**
 * Extract text from ProseMirror document for API consumption
 * Logic:
 * - Text nodes: include text
 * - Code blocks: skip entirely
 * - Block boundaries: add \n
 * - Hard breaks: add \n
 */
export const extractTextFromProseMirror = (editor: Editor): string => {
  const doc = editor.state.doc;
  let text = '';
  
  // Recursive traversal function
  const traverse = (node: Node) => {
    // Skip code blocks entirely
    if (node.type.name === 'codeBlock') {
      return;
    }
    
    // Handle text nodes
    if (node.isText) {
      text += node.text || '';
      return;
    }
    
    // Handle hard breaks
    if (node.type.name === 'hardBreak') {
      text += '\n';
      return;
    }
    
    // Traverse children
    node.content.forEach((child) => {
      traverse(child);
    });
    
    // Add newline after block nodes (except the doc itself)
    if (node.isBlock && node.type.name !== 'doc') {
      text += '\n';
    }
  };
  
  traverse(doc);
  return text;
};

