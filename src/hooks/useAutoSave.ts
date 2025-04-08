import { useEffect, useCallback } from 'react';
import { useEditorStore } from '../store/editorStore';

const AUTO_SAVE_INTERVAL = 60000; // 1 minute

export const useAutoSave = () => {
  const { exportToFile } = useEditorStore();

  const saveToLocalStorage = useCallback(() => {
    try {
      const state = exportToFile();
      localStorage.setItem('ascii-editor-autosave', JSON.stringify(state));
      localStorage.setItem('ascii-editor-autosave-time', Date.now().toString());
    } catch (error) {
      console.error('Failed to auto-save:', error);
    }
  }, [exportToFile]);

  const loadFromLocalStorage = useCallback(() => {
    try {
      const savedState = localStorage.getItem('ascii-editor-autosave');
      const savedTime = localStorage.getItem('ascii-editor-autosave-time');

      if (savedState && savedTime) {
        return {
          state: JSON.parse(savedState),
          timestamp: parseInt(savedTime)
        };
      }
    } catch (error) {
      console.error('Failed to load auto-save:', error);
    }
    return null;
  }, []);

  useEffect(() => {
    const interval = setInterval(saveToLocalStorage, AUTO_SAVE_INTERVAL);
    return () => clearInterval(interval);
  }, [saveToLocalStorage]);

  return {
    saveToLocalStorage,
    loadFromLocalStorage
  };
};