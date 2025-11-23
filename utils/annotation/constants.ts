/**
 * Constants for annotation system
 */

export const BLOCK_TAGS = new Set([
  'P', 'DIV', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'LI', 'BLOCKQUOTE', 'PRE'
]);

export const CODE_TAGS = new Set(['PRE', 'CODE']);

export const CODE_BLOCK_CLASS = 'code-block';

export const ERROR_COLORS = {
  TYPO: '220, 38, 38',      // Red-600
  SEMANTIC: '245, 158, 11'   // Amber-500
} as const;

export const HIGHLIGHT_STYLES = {
  UNDERLINE_WIDTH: '2px',
  UNDERLINE_OPACITY: 0.8,
  BACKGROUND_OPACITY: 0,
  HEIGHT_OFFSET: 4,
  Z_INDEX: '2',
  TRANSITION: 'all 0.2s ease'
} as const;

