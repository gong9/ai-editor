import localforage from 'localforage';
import { generateId } from '../utils/uid';

// Initialize localforage
localforage.config({
  name: 'LarkLiteEditor',
  storeName: 'images',
  description: 'Storage for editor images'
});

export const compressImage = async (file: File): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.src = objectUrl;
    
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) { 
          reject(new Error('Could not get canvas context')); 
          return; 
      }

      // Target constraints
      const MAX_WIDTH = 1200;
      const QUALITY = 0.8;

      let width = img.width;
      let height = img.height;

      // Calculate new dimensions
      if (width > MAX_WIDTH) {
        height = Math.round((height * MAX_WIDTH) / width);
        width = MAX_WIDTH;
      }

      canvas.width = width;
      canvas.height = height;

      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Canvas to Blob conversion failed'));
          }
        },
        'image/jpeg', 
        QUALITY
      );
    };
    
    img.onerror = (e) => {
        URL.revokeObjectURL(objectUrl);
        reject(e);
    };
  });
};

export const saveImage = async (file: File): Promise<string> => {
    try {
        const compressedBlob = await compressImage(file);
        const id = generateId();
        await localforage.setItem(id, compressedBlob);
        return id;
    } catch (error) {
        console.error("Error saving image:", error);
        throw error;
    }
};

export const loadImage = async (id: string): Promise<string | null> => {
    try {
        // If it's already a URL, just return it
        if (id.startsWith('http') || id.startsWith('data:')) {
            return id;
        }
        
        const blob = await localforage.getItem<Blob>(id);
        if (blob) {
            return URL.createObjectURL(blob);
        }
        return null;
    } catch (error) {
        console.error("Error loading image:", error);
        return null;
    }
};