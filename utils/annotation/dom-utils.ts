/**
 * DOM manipulation and traversal utilities
 */

import { BLOCK_TAGS, CODE_TAGS, CODE_BLOCK_CLASS } from './constants';

/**
 * Check if a node is a block-level element
 */
export const isBlockElement = (node: Node): boolean => {
  if (node.nodeType !== Node.ELEMENT_NODE) return false;
  return BLOCK_TAGS.has((node as HTMLElement).tagName);
};

/**
 * Check if a node is a line break
 */
export const isLineBreak = (node: Node): boolean => {
  if (node.nodeType !== Node.ELEMENT_NODE) return false;
  return (node as HTMLElement).tagName === 'BR';
};

/**
 * Check if a node is a code block itself
 */
export const isCodeBlock = (node: Node): boolean => {
  if (node.nodeType !== Node.ELEMENT_NODE) return false;
  const element = node as HTMLElement;
  
  // Check for standard code tags
  if (CODE_TAGS.has(element.tagName)) return true;
  
  // Check for code block classes (Tiptap uses various classes)
  if (element.classList?.contains(CODE_BLOCK_CLASS)) return true;
  if (element.classList?.contains('code-block-wrapper')) return true;
  if (element.classList?.contains('hljs')) return true;
  
  // Check if it has data-language attribute (Tiptap code blocks)
  if (element.hasAttribute('data-language')) return true;
  
  // Check if parent is a PRE tag (common code block structure)
  if (element.parentElement?.tagName === 'PRE') return true;
  
  return false;
};

/**
 * Check if a node is inside a code block
 */
export const isInsideCodeBlock = (node: Node, container: HTMLElement): boolean => {
  let parent = node.parentElement;
  while (parent && parent !== container) {
    if (CODE_TAGS.has(parent.tagName)) return true;
    if (parent.classList?.contains(CODE_BLOCK_CLASS)) return true;
    if (parent.classList?.contains('code-block-wrapper')) return true;
    if (parent.classList?.contains('hljs')) return true;
    if (parent.hasAttribute?.('data-language')) return true;
    parent = parent.parentElement;
  }
  return false;
};

/**
 * Find the common ancestor of two nodes
 */
export const getCommonAncestor = (nodeA: Node | null, nodeB: Node | null): Node | null => {
  if (!nodeA || !nodeB) return null;
  
  const ancestors = new Set<Node>();
  for (let node = nodeA; node; node = node.parentNode!) {
    ancestors.add(node);
  }
  
  for (let node = nodeB; node; node = node.parentNode!) {
    if (ancestors.has(node)) return node;
  }
  
  return null;
};

/**
 * Get all nodes between start and end nodes
 */
export const getNodesBetween = (startNode: Node, endNode: Node): Node[] => {
  if (startNode === endNode) return [];

  // Ensure correct order
  if (startNode.compareDocumentPosition(endNode) & Node.DOCUMENT_POSITION_PRECEDING) {
    [startNode, endNode] = [endNode, startNode];
  }

  const commonAncestor = getCommonAncestor(startNode, endNode);
  if (!commonAncestor) return [];

  const walker = document.createTreeWalker(commonAncestor, NodeFilter.SHOW_ALL, null);
  const result: Node[] = [];
  let started = false;

  while (walker.nextNode()) {
    const node = walker.currentNode;
    if (node === startNode) {
      started = true;
      continue;
    }
    if (node === endNode) break;
    if (started) result.push(node);
  }

  return result;
};

/**
 * Create a DOM Range from text node positions
 */
export const createDOMRange = (startNode: Node, startOffset: number, endNode?: Node, endOffset?: number): Range => {
  const range = document.createRange();
  
  try {
    range.setStart(startNode, startOffset);
    if (endNode && endOffset !== undefined) {
      range.setEnd(endNode, endOffset);
    }
  } catch (error) {
    console.error('Failed to create DOM range:', error);
  }
  
  return range;
};

