/**
 * General utility functions
 */

/**
 * Generate a unique ID for correction items
 */
export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

