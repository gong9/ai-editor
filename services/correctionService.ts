import type { CorrectionItem } from '../utils/annotation';
import { generateId } from '../utils/annotation';

export interface CorrectionResponse {
  [key: string]: any;
}

const API_URL = 'http://43.138.104.109:8000/correct/fulltext/stream';

interface StreamCallbacks {
    onData: (items: CorrectionItem[]) => void;
    onError: (error: any) => void;
    onComplete: () => void;
    onProgress?: (current: number, total: number) => void;
}

export const streamCorrection = async (
  text: string,
  callbacks: StreamCallbacks
) => {
  const { onData, onError, onComplete, onProgress } = callbacks;
  
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxLCJleHAiOjE3NjQ0ODA5NzR9.78bhMMhcOLEC921TfKyU3_11AV-FmfuSpHrd_B4fR-8',
      },
      body: JSON.stringify({ 
        text: text,
        model_type: 'gpt',
        qwen_model_type: 'standard',
        use_ensemble: true
      }), 
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    if (!response.body) {
      throw new Error('No response body');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    let searchStartIndex = 0;
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      buffer += chunk;

      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; 

      const newItems: CorrectionItem[] = [];

      for (const line of lines) {
        if (line.trim()) {
          try {
            const cleanLine = line.startsWith('data:') ? line.slice(5) : line;
            const eventData = JSON.parse(cleanLine);
            
            if (eventData.event === 'progress' && eventData.result) {
                const { source, errors } = eventData.result;
                
                // Update progress
                if (onProgress && eventData.line_index !== undefined && eventData.total_lines !== undefined) {
                  onProgress(eventData.line_index + 1, eventData.total_lines);
                }
                
                // Find source in full text to determine global offset (with newlines)
                const relativeIndex = text.indexOf(source, searchStartIndex);
                
                if (relativeIndex !== -1) {
                    const lineStartOffset = relativeIndex;
                    searchStartIndex = lineStartOffset + source.length;

                    if (errors && Array.isArray(errors)) {
                        errors.forEach((error: any) => {
                            const globalStart = lineStartOffset + error.position;
                            const globalEnd = lineStartOffset + error.end_position;
                            
                            // Map Global Offsets (with newlines) to UI Offsets (without newlines)
                            const newlinesBeforeStart = (text.slice(0, globalStart).match(/\n/g) || []).length;
                            const newlinesBeforeEnd = (text.slice(0, globalEnd).match(/\n/g) || []).length;

                            const uiStart = globalStart - newlinesBeforeStart;
                            const uiEnd = globalEnd - newlinesBeforeEnd;

                            const item: CorrectionItem = {
                                id: generateId(),
                                globalOffset: [uiStart, uiEnd],
                                misspelledWord: error.original,
                                suggestion: [[
                                    error.corrected || '', 
                                    error.error_type === 'semantic' ? 2 : 1, 
                                    '', 
                                    [-1, ''], 
                                    '', 
                                    error.explanation || '', 
                                    null,
                                    0,
                                    0
                                ]],
                                suggestionList: [],
                                category: {},
                                is_adopt: 0
                            };
                            newItems.push(item);
                        });
                    }
                } else {
                    console.warn('Could not find source text in full text:', source);
                }
            }
          } catch (e) {
            console.warn('Failed to parse chunk:', line, e);
          }
        }
      }
      
      if (newItems.length > 0) {
          onData(newItems);
      }
    }
    
    if (buffer.trim()) {
         try {
            const cleanLine = buffer.startsWith('data:') ? buffer.slice(5) : buffer;
            // ... final chunk processing if needed
        } catch (e) {}
    }

    onComplete();
  } catch (error) {
    console.error('Correction stream error:', error);
    onError(error);
  }
};
