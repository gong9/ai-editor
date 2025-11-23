/**
 * Position update utilities for dynamic text editing
 */

import { CorrectionItem } from './types';

/**
 * Update correction item positions after text deletion
 */
export const handleUpdateDeletePosition = (
  items: CorrectionItem[],
  deletedLength: number,
  deleteStart: number
): CorrectionItem[] => {
  return items.map(item => {
    const [start, end] = item.globalOffset;
    
    // Item is completely after deletion point
    if (start > deleteStart - 1) {
      item.globalOffset = [
        start - deletedLength,
        end - deletedLength
      ];
    }
    // Item spans across deletion point
    else if (start <= deleteStart - 1 && end >= deleteStart - 1) {
      item.globalOffset = [
        start,
        Math.max(start, end - deletedLength)
      ];
    }
    // Item is completely before deletion point - no change needed
    
    return item;
  });
};

/**
 * Update correction item positions after text insertion
 */
export const handleUpdateInsertPosition = (
  items: CorrectionItem[],
  insertedLength: number,
  insertStart: number
): CorrectionItem[] => {
  return items.map(item => {
    const [start, end] = item.globalOffset;
    
    // Item is completely after insertion point
    if (start > insertStart - 1) {
      item.globalOffset = [
        start + insertedLength,
        end + insertedLength
      ];
    }
    // Item is completely before insertion point - no change needed
    
    return item;
  });
};

