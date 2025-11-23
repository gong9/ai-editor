/**
 * Position mapping between correction items and DOM text nodes
 */

import { TextNodePosition } from './types';
import { isInsideCodeBlock, isLineBreak, isBlockElement, isCodeBlock } from './dom-utils';

/**
 * Sort and group correction items by their start position
 */
export const groupByStartPosition = (items: any[]): Map<number, any[]> => {
  const grouped = new Map<number, any[]>();
  
  // Sort by start position
  const sorted = [...items].sort((a, b) => a.l - b.l);
  
  for (const item of sorted) {
    const startPos = item.l;
    if (!grouped.has(startPos)) {
      grouped.set(startPos, []);
    }
    grouped.get(startPos)!.push(item);
  }
  
  // Sort items at the same start position by end position
  for (const items of grouped.values()) {
    items.sort((a, b) => a.r - b.r);
  }
  
  return grouped;
};

/**
 * Map correction items to their corresponding DOM text nodes
 */
export const mapItemsToTextNodes = (
  container: HTMLElement,
  items: any[],
  textLength: number
): TextNodePosition[] => {
  const positionMap = groupByStartPosition(items);
  const results = new Map<string, TextNodePosition>();
  const endPositions = new Set<number>();
  const endNodeMap = new Map<number, { endNode: Node; endOffset: number }>();

  let textIndex = 0;

  const traverse = (node: Node) => {
    for (const child of Array.from(node.childNodes)) {
      // Handle text nodes
      if (child.nodeType === Node.TEXT_NODE) {
        if (isInsideCodeBlock(child, container)) continue;

        const text = child.textContent || '';
        
        for (let i = 0; i < text.length; i++) {
          // Record start positions
          if (positionMap.has(textIndex)) {
            const itemsAtPos = positionMap.get(textIndex)!;
            itemsAtPos.forEach((item, index) => {
              const key = `${textIndex}-${index}`;
              endPositions.add(item.r);
              results.set(key, {
                startNode: child,
                startOffset: i,
                id: item.id,
                original: {
                  ...item,
                  suggestionList: item.suggestionList,
                  category: item.category,
                },
              });
            });
          }

          textIndex++;

          // Record end positions
          if (endPositions.has(textIndex) && textIndex <= textLength) {
            endNodeMap.set(textIndex, {
              endNode: child,
              endOffset: i + 1,
            });
          }
        }
      }
      // Handle line breaks (counted in API text but not in UI offsets)
      else if (isLineBreak(child)) {
        // Don't increment textIndex - newlines are not counted for UI positioning
      }
      // Handle element nodes
      else {
        if (isCodeBlock(child)) continue;
        traverse(child);
        
        // Don't increment textIndex for block boundaries
        if (isBlockElement(child)) {
          // Block boundaries are not counted for UI positioning
        }
      }
    }
  };

  traverse(container);

  // Merge end node information
  for (const [key, position] of results.entries()) {
    const endInfo = endNodeMap.get((position.original as any).r);
    if (endInfo) {
      position.endNode = endInfo.endNode;
      position.endOffset = endInfo.endOffset;
    }
  }

  // Filter out incomplete positions
  return Array.from(results.values()).filter(pos => pos.endNode);
};

