/**
 * Highlight rendering for correction annotations
 */

import { Annotation, TextNodePosition, CorrectionItem } from './types';
import { ERROR_COLORS, HIGHLIGHT_STYLES } from './constants';
import { createDOMRange, getNodesBetween } from './dom-utils';
import { mapItemsToTextNodes } from './position-mapper';

/**
 * Create highlight boxes for a single text position
 */
const createHighlightBoxes = (
  position: TextNodePosition,
  container: HTMLElement,
  highlightLayer: HTMLElement,
  onHighlightClick?: (item: any, box: HTMLElement) => void
): Annotation => {
  const range = createDOMRange(
    position.startNode,
    position.startOffset,
    position.endNode,
    position.endOffset
  );
  
  const rects = Array.from(range.getClientRects()).filter(
    rect => rect.width > 0 && rect.height > 0
  );
  
  const containerRect = container.getBoundingClientRect();
  const highlightBoxes: HTMLElement[] = [];
  const color = (position.original as any).textColor || ERROR_COLORS.TYPO;

  for (const rect of rects) {
    const box = document.createElement('div');
    box.className = 'highlight-box';
    
    // Position
    box.style.position = 'absolute';
    box.style.top = `${rect.top - containerRect.top}px`;
    box.style.left = `${rect.left - containerRect.left}px`;
    box.style.width = `${rect.width}px`;
    box.style.height = `${rect.height + HIGHLIGHT_STYLES.HEIGHT_OFFSET}px`;
    
    // Style (underline only, no background for unselected)
    box.style.backgroundColor = `rgba(${color}, ${HIGHLIGHT_STYLES.BACKGROUND_OPACITY})`;
    box.style.borderBottom = `${HIGHLIGHT_STYLES.UNDERLINE_WIDTH} solid rgba(${color}, ${HIGHLIGHT_STYLES.UNDERLINE_OPACITY})`;
    box.style.cursor = 'pointer';
    box.style.zIndex = HIGHLIGHT_STYLES.Z_INDEX;
    box.style.transition = HIGHLIGHT_STYLES.TRANSITION;
    
    // Store color for active state
    box.dataset.color = color;

    // Event handler
    if (onHighlightClick) {
      box.addEventListener('click', (e) => {
        e.stopPropagation();
        onHighlightClick(annotation, box);
      });
    }

    highlightLayer.appendChild(box);
    highlightBoxes.push(box);
  }

  const nodesBetween = position.endNode 
    ? getNodesBetween(position.startNode, position.endNode)
    : [];

  const annotation: Annotation = {
    ...(position.original as any),
    startNode: position.startNode,
    startOffset: position.startOffset,
    endNode: position.endNode,
    endOffset: position.endOffset,
    highlightBoxes,
    nodesBetween,
    range,
    viewPosition: highlightBoxes.length > 0 
      ? [highlightBoxes[0].style.top, highlightBoxes[0].style.left]
      : undefined,
  };

  return annotation;
};

/**
 * Create all highlights for correction items
 */
export const createHighlight = (
  items: CorrectionItem[],
  container: HTMLElement,
  highlightLayer: HTMLElement,
  onHighlightClick: (item: any, box: HTMLElement) => void,
  textLength: number
): Annotation[] => {
  // Prepare data with colors
  const dataWithColors = items.map(item => {
    const errorType = item.suggestion?.[0]?.[1];
    const color = errorType === 2 ? ERROR_COLORS.SEMANTIC : ERROR_COLORS.TYPO;
    
    return {
      l: item.globalOffset[0],
      r: item.globalOffset[1],
      id: item.id,
      misspelledWord: item.misspelledWord,
      suggestion: item.suggestion,
      suggestionList: item.suggestionList,
      category: item.category,
      textColor: color,
    };
  });

  // Map to text nodes
  const positions = mapItemsToTextNodes(container, dataWithColors, textLength);
  
  // Create highlight boxes
  const annotations = positions.map(pos => 
    createHighlightBoxes(pos, container, highlightLayer, onHighlightClick)
  );

  return annotations;
};

