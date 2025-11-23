/**
 * Tiptap Extension for text correction
 */

import { Extension } from '@tiptap/core';
import { createCorrectionPlugin, correctionPluginKey } from '../utils/annotation/correction-plugin';
import type { CorrectionItem } from '../utils/annotation/types';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    correction: {
      /**
       * Add correction items
       */
      addCorrections: (items: CorrectionItem[]) => ReturnType;
      /**
       * Remove a single correction by ID
       */
      removeCorrection: (id: string) => ReturnType;
      /**
       * Clear all corrections
       */
      clearCorrections: () => ReturnType;
      /**
       * Set active correction ID
       */
      setActiveCorrection: (id: string | null) => ReturnType;
      /**
       * Set click handler for corrections
       */
      setCorrectionClickHandler: (handler: (id: string) => void) => ReturnType;
    };
  }
}

export const CorrectionExtension = Extension.create({
  name: 'correction',
  
  addProseMirrorPlugins() {
    return [createCorrectionPlugin()];
  },
  
  addCommands() {
    return {
      addCorrections: (items: CorrectionItem[]) => ({ tr, dispatch }) => {
        if (dispatch) {
          tr.setMeta(correctionPluginKey, {
            type: 'add',
            items,
          });
        }
        return true;
      },
      
      removeCorrection: (id: string) => ({ tr, dispatch }) => {
        if (dispatch) {
          tr.setMeta(correctionPluginKey, {
            type: 'remove',
            id,
          });
        }
        return true;
      },
      
      clearCorrections: () => ({ tr, dispatch }) => {
        if (dispatch) {
          tr.setMeta(correctionPluginKey, {
            type: 'clear',
          });
        }
        return true;
      },
      
      setActiveCorrection: (activeId: string | null) => ({ tr, dispatch }) => {
        if (dispatch) {
          tr.setMeta(correctionPluginKey, {
            type: 'setActive',
            activeId,
          });
        }
        return true;
      },
      
      setCorrectionClickHandler: (handler: (id: string) => void) => ({ tr, dispatch }) => {
        if (dispatch) {
          tr.setMeta(correctionPluginKey, {
            type: 'setClickHandler',
            onCorrectionClick: handler,
          });
        }
        return true;
      },
    };
  },
});

