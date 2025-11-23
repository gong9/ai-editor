/**
 * Convert between text offsets and ProseMirror positions
 * 
 * CRITICAL: The text counting logic here MUST match extractTextFromDOM exactly
 * - Text nodes: count characters
 * - Line breaks (<br>): add \n (but don't count in offset)
 * - Block elements: add \n after (but don't count in offset)
 * - Code blocks: skip entirely
 */

import { EditorView } from '@tiptap/pm/view';
import { Editor } from '@tiptap/react';
import type { CorrectionItem } from './types';

/**
 * Convert text offset (excluding newlines and code blocks) to ProseMirror position
 * This uses the SAME logic as extractTextFromDOM for consistency
 */
export const convertTextOffsetToProseMirrorPos = (
  editorView: EditorView,
  textOffset: number
): number => {
  const doc = editorView.state.doc;
  let currentTextOffset = 0;
  let pmPos = 1;
  let found = false;
  
  doc.descendants((node, pos) => {
    if (found) return false;
    
    // Skip code blocks (same as extractTextFromDOM)
    if (node.type.name === 'codeBlock') {
      return false;
    }
    
    // Handle text nodes - count characters
    if (node.isText) {
      const textLength = node.text?.length || 0;
      
      if (currentTextOffset + textLength > textOffset) {
        // Found the position
        const offsetInNode = textOffset - currentTextOffset;
        pmPos = pos + offsetInNode;
        found = true;
        return false;
      }
      
      currentTextOffset += textLength;
    }
    
    // Handle hard breaks - extractTextFromDOM adds \n but we don't count it
    if (node.type.name === 'hardBreak') {
      // Don't increment currentTextOffset (newlines don't count)
    }
    
    // Handle block boundaries - extractTextFromDOM adds \n but we don't count it
    // Note: In ProseMirror, we need to check after processing children
    
    return true;
  });
  
  return pmPos;
};

/**
 * Convert ProseMirror position to text offset (excluding newlines and code blocks)
 */
export const convertProseMirrorPosToTextOffset = (
  editorView: EditorView,
  pmPos: number
): number => {
  const doc = editorView.state.doc;
  let textOffset = 0;
  let found = false;
  
  doc.descendants((node, pos) => {
    if (found) return false;
    
    // Skip code blocks
    if (node.type.name === 'codeBlock') {
      return false;
    }
    
    // Handle text nodes
    if (node.isText) {
      const textLength = node.text?.length || 0;
      const nodeEnd = pos + textLength;
      
      if (pmPos >= pos && pmPos <= nodeEnd) {
        textOffset += pmPos - pos;
        found = true;
        return false;
      }
      
      textOffset += textLength;
    }
    
    return true;
  });
  
  return textOffset;
};

/**
 * Convert correction items from text offsets to ProseMirror positions
 */
export const convertToProseMirrorPositions = (
  items: CorrectionItem[],
  editor: Editor
): CorrectionItem[] => {
  if (!editor.view) return items;
  
  return items.map(item => {
    // If already has from/to, return as is
    if (item.from !== undefined && item.to !== undefined) {
      return item;
    }
    
    // Convert from globalOffset
    if (item.globalOffset) {
      const from = convertTextOffsetToProseMirrorPos(editor.view, item.globalOffset[0]);
      const to = convertTextOffsetToProseMirrorPos(editor.view, item.globalOffset[1]);
      
      return {
        ...item,
        from,
        to,
      };
    }
    
    return item;
  });
};

/**
 * Convert correction items from ProseMirror positions to text offsets
 */
export const convertToTextOffsets = (
  items: CorrectionItem[],
  editor: Editor
): CorrectionItem[] => {
  if (!editor.view) return items;
  
  return items.map(item => {
    if (item.from === undefined || item.to === undefined) {
      return item;
    }
    
    const startOffset = convertProseMirrorPosToTextOffset(editor.view, item.from);
    const endOffset = convertProseMirrorPosToTextOffset(editor.view, item.to);
    
    return {
      ...item,
      globalOffset: [startOffset, endOffset],
    };
  });
};
