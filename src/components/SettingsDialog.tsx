import { X } from 'lucide-react';
import React from 'react';
import { useEditorStore } from '../store/editorStore';

interface SettingsDialogProps {
  onClose: () => void;
}

const SettingsDialog: React.FC<SettingsDialogProps> = ({ onClose }) => {
  const {
    showCharCount,
    showDimensions,
    toggleCharCount,
    toggleDimensions,
    fontSize,
    setFontSize,
    theme,
    setTheme,
    showGrid,
    toggleGrid,
    snapToGrid,
    toggleSnapToGrid,
    autosaveEnabled,
    toggleAutosave
  } = useEditorStore();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Settings</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="space-y-6">
          <div className="space-y-4">
            <h3 className="font-medium text-gray-700">Display</h3>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showCharCount}
                onChange={toggleCharCount}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span>Show Character Count</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showDimensions}
                onChange={toggleDimensions}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span>Show Canvas Dimensions</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showGrid}
                onChange={toggleGrid}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span>Show Grid</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={snapToGrid}
                onChange={toggleSnapToGrid}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span>Snap to Grid</span>
            </label>
          </div>

          <div className="space-y-4">
            <h3 className="font-medium text-gray-700">Editor</h3>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={autosaveEnabled}
                onChange={toggleAutosave}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span>Enable Autosave</span>
            </label>
            <div className="flex items-center gap-4">
              <label className="text-sm text-gray-600">Theme:</label>
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value as 'light' | 'dark')}
                className="px-3 py-1 border rounded-md"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-medium text-gray-700">Font</h3>
            <div className="flex items-center gap-4">
              <label className="text-sm text-gray-600">Size:</label>
              <input
                type="range"
                min="12"
                max="24"
                value={fontSize}
                onChange={(e) => setFontSize(parseInt(e.target.value))}
                className="flex-1"
              />
              <span className="text-sm text-gray-600 w-12">{fontSize}px</span>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-medium text-gray-700">Keyboard Shortcuts</h3>
            <div className="text-sm space-y-2 bg-gray-50 p-3 rounded">
              <div className="grid grid-cols-2 gap-2">
                <span className="text-gray-600">New Canvas</span>
                <kbd className="font-mono">Ctrl + N</kbd>
                <span className="text-gray-600">Open File</span>
                <kbd className="font-mono">Ctrl + O</kbd>
                <span className="text-gray-600">Save File</span>
                <kbd className="font-mono">Ctrl + S</kbd>
                <span className="text-gray-600">Zoom In</span>
                <kbd className="font-mono">Ctrl + +</kbd>
                <span className="text-gray-600">Zoom Out</span>
                <kbd className="font-mono">Ctrl + -</kbd>
                <span className="text-gray-600">Reset Zoom</span>
                <kbd className="font-mono">Ctrl + 0</kbd>
                <span className="text-gray-600">Undo</span>
                <kbd className="font-mono">Ctrl + Z</kbd>
                <span className="text-gray-600">Redo</span>
                <kbd className="font-mono">Ctrl + Y</kbd>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsDialog