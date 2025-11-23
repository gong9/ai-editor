/**
 * ProseMirror plugin for managing correction decorations
 */

import { Plugin, PluginKey, Transaction, EditorState } from '@tiptap/pm/state';
import { Decoration, DecorationSet, EditorView } from '@tiptap/pm/view';
import type { CorrectionItem } from './types';
import { ERROR_COLORS } from './constants';

export const correctionPluginKey = new PluginKey('correction');

export interface CorrectionPluginState {
  decorations: DecorationSet;
  corrections: Map<string, CorrectionItem>;
  activeId: string | null;
  onCorrectionClick?: (id: string) => void;
}

interface CorrectionMeta {
  type: 'add' | 'remove' | 'clear' | 'setActive' | 'setClickHandler';
  items?: CorrectionItem[];
  id?: string;
  activeId?: string | null;
  onCorrectionClick?: (id: string) => void;
}

/**
 * Check if a position range is inside a code block
 */
const isPositionInCodeBlock = (doc: any, from: number, to: number): boolean => {
  let inCodeBlock = false;
  
  doc.nodesBetween(from, to, (node: any) => {
    if (node.type.name === 'codeBlock') {
      inCodeBlock = true;
      return false; // Stop traversal
    }
    return true;
  });
  
  return inCodeBlock;
};

/**
 * Create decoration for a correction item
 */
const createCorrectionDecoration = (item: CorrectionItem, isActive: boolean, doc: any): Decoration | null => {
  // Don't create decoration if position is in code block
  if (isPositionInCodeBlock(doc, item.from, item.to)) {
    return null;
  }
  
  const errorType = item.suggestion?.[0]?.[1];
  const color = errorType === 2 ? ERROR_COLORS.SEMANTIC : ERROR_COLORS.TYPO;
  
  const className = isActive 
    ? 'correction-highlight correction-highlight-active'
    : 'correction-highlight';
  
  return Decoration.inline(item.from, item.to, {
    class: className,
    style: `border-bottom: 2px solid rgba(${color}, 0.8); cursor: pointer;`,
    'data-correction-id': item.id,
    'data-color': color,
  });
};

/**
 * Check if a transaction modifies a correction range
 */
const isRangeModified = (tr: Transaction, from: number, to: number): boolean => {
  let modified = false;
  
  tr.steps.forEach((step: any) => {
    if (step.from !== undefined && step.to !== undefined) {
      const stepFrom = step.from;
      const stepTo = step.to;
      
      // Check if edit is within or overlaps the correction range
      if (
        (stepFrom >= from && stepFrom < to) ||
        (stepTo > from && stepTo <= to) ||
        (stepFrom <= from && stepTo >= to)
      ) {
        modified = true;
      }
    }
  });
  
  return modified;
};

/**
 * Create the correction plugin
 */
export const createCorrectionPlugin = (): Plugin<CorrectionPluginState> => {
  return new Plugin<CorrectionPluginState>({
    key: correctionPluginKey,
    
    state: {
      init(): CorrectionPluginState {
        return {
          decorations: DecorationSet.empty,
          corrections: new Map(),
          activeId: null,
          onCorrectionClick: undefined,
        };
      },
      
      apply(tr: Transaction, state: CorrectionPluginState, oldState: EditorState, newState: EditorState): CorrectionPluginState {
        const meta = tr.getMeta(correctionPluginKey) as CorrectionMeta | undefined;
        
        // Handle meta commands
        if (meta) {
          switch (meta.type) {
            case 'add': {
              if (!meta.items) return state;
              
              const newCorrections = new Map(state.corrections);
              const decorations: Decoration[] = [];
              
              meta.items.forEach(item => {
                newCorrections.set(item.id, item);
                const decoration = createCorrectionDecoration(item, item.id === state.activeId, tr.doc);
                if (decoration) {
                  decorations.push(decoration);
                }
              });
              
              return {
                ...state,
                corrections: newCorrections,
                decorations: state.decorations.add(tr.doc, decorations),
              };
            }
            
            case 'remove': {
              if (!meta.id) return state;
              
              const newCorrections = new Map(state.corrections);
              newCorrections.delete(meta.id);
              
              // Rebuild decorations without the removed item
              const decorations: Decoration[] = [];
              newCorrections.forEach(item => {
                const decoration = createCorrectionDecoration(item, item.id === state.activeId, tr.doc);
                if (decoration) {
                  decorations.push(decoration);
                }
              });
              
              return {
                ...state,
                corrections: newCorrections,
                decorations: DecorationSet.create(tr.doc, decorations),
              };
            }
            
            case 'clear': {
              return {
                ...state,
                corrections: new Map(),
                decorations: DecorationSet.empty,
                activeId: null,
              };
            }
            
            case 'setActive': {
              // Rebuild decorations with new active state
              const decorations: Decoration[] = [];
              state.corrections.forEach(item => {
                const decoration = createCorrectionDecoration(item, item.id === meta.activeId, tr.doc);
                if (decoration) {
                  decorations.push(decoration);
                }
              });
              
              return {
                ...state,
                activeId: meta.activeId ?? null,
                decorations: DecorationSet.create(tr.doc, decorations),
              };
            }
            
            case 'setClickHandler': {
              return {
                ...state,
                onCorrectionClick: meta.onCorrectionClick,
              };
            }
          }
        }
        
        // Handle document changes - check if any corrections were modified
        if (tr.docChanged) {
          const newCorrections = new Map(state.corrections);
          const toRemove: string[] = [];
          
          // Check each correction to see if it was modified
          state.corrections.forEach((item, id) => {
            // Map old positions to new positions
            const newFrom = tr.mapping.map(item.from);
            const newTo = tr.mapping.map(item.to);
            
            // Check if the range was directly edited
            if (isRangeModified(tr, item.from, item.to)) {
              toRemove.push(id);
            } else {
              // Update positions
              const updatedItem = { ...item, from: newFrom, to: newTo };
              newCorrections.set(id, updatedItem);
            }
          });
          
          // Remove modified corrections
          toRemove.forEach(id => newCorrections.delete(id));
          
          // Rebuild decorations with updated positions
          const decorations: Decoration[] = [];
          newCorrections.forEach(item => {
            const decoration = createCorrectionDecoration(item, item.id === state.activeId, tr.doc);
            if (decoration) {
              decorations.push(decoration);
            }
          });
          
          return {
            ...state,
            corrections: newCorrections,
            decorations: DecorationSet.create(tr.doc, decorations),
          };
        }
        
        // Map decorations through the transaction
        return {
          ...state,
          decorations: state.decorations.map(tr.mapping, tr.doc),
        };
      },
    },
    
    props: {
      decorations(state) {
        return this.getState(state)?.decorations;
      },
      
      handleClickOn(view: EditorView, pos: number, node: any, nodePos: number, event: MouseEvent): boolean {
        const target = event.target as HTMLElement;
        const correctionId = target.getAttribute('data-correction-id');
        
        if (correctionId) {
          const pluginState = correctionPluginKey.getState(view.state);
          if (pluginState?.onCorrectionClick) {
            pluginState.onCorrectionClick(correctionId);
            return true;
          }
        }
        
        return false;
      },
    },
  });
};

