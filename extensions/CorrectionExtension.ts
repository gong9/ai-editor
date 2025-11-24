/**
 * Tiptap Extension for text correction
 */

import { Extension } from '@tiptap/core';
import { TextSelection } from '@tiptap/pm/state';
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
      /**
       * Scroll to a correction by ID using its current mapped position
       */
      scrollToCorrection: (id: string) => ReturnType;
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

      scrollToCorrection: (id: string) => ({ tr, dispatch, state, editor }) => {
        if (dispatch) {
          const pluginState = correctionPluginKey.getState(state);
          if (pluginState) {
            const item = pluginState.corrections.get(id);
            if (item) {
              // Ensure position is valid
              const docSize = tr.doc.content.size;
              const safePos = Math.min(Math.max(0, item.from), docSize);
              
              const selection = TextSelection.create(tr.doc, safePos);
              tr.setSelection(selection);
              tr.scrollIntoView();
              
              // Force DOM scroll if ProseMirror scrollIntoView fails for some reason
              // This is a backup for when decorations are hidden
              // AND always try to center
              setTimeout(() => {
                try {
                    const dom = editor.view.domAtPos(safePos);
                    
                    // Helper to execute scroll
                    const scrollElement = (el: Element) => {
                        el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
                    };

                    if (dom && dom.node) {
                        if (dom.node instanceof Element) {
                            scrollElement(dom.node);
                        } else if (dom.node.parentElement) {
                            scrollElement(dom.node.parentElement);
                        }
                    }
                } catch (e) {
                    console.warn('Manual scroll failed', e);
                }
              }, 50);
            }
          }
        }
        return true;
      },
    };
  },
});

