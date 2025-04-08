import { X } from 'lucide-react';
import React from 'react';

interface HelpDialogProps {
  onClose: () => void;
}

const HelpDialog: React.FC<HelpDialogProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">ASCII Art Editor Help</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-6">
          <section>
            <h3 className="text-lg font-medium mb-3">Drawing Tools</h3>
            <div className="space-y-2">
              <p><strong>Line Tool:</strong> Click and drag to draw straight lines. Hold Shift for perfect horizontal/vertical lines.</p>
              <p><strong>Box Tool:</strong> Click and drag to create rectangles. Toggle fill mode in the toolbar.</p>
              <p><strong>Text Tool:</strong> Click anywhere to start typing. Use toolbar for effects, path, and wrapping options.</p>
              <p><strong>Special Characters:</strong> Select from the palette or manage character sets.</p>
              <p><strong>Eraser:</strong> Click to remove elements at the cursor position.</p>
              <p><strong>Selection Tool:</strong> Click and drag to select a region. Use for moving, copying, and pasting content.</p>
              <p><strong>Fill Tool:</strong> Click an area to fill with the current character/color (Flood Fill).</p>
              <p><strong>Content-Aware Fill:</strong> Select the tool and click to intelligently fill based on surrounding context.</p>
              <p><strong>Shape Recognition:</strong> Draw basic shapes (line, rectangle, circle, triangle) and the tool will attempt to perfect them.</p>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-medium mb-3">Working with Layers</h3>
            <div className="space-y-2">
              <p><strong>Creating Layers:</strong> Use the + button in the layers panel to add new layers.</p>
              <p><strong>Layer Controls:</strong> Toggle visibility, lock layers, and reorder by dragging.</p>
              <p><strong>Active Layer:</strong> Select a layer to make it active for drawing.</p>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-medium mb-3">File Operations</h3>
            <div className="space-y-2">
              <p><strong>New Canvas:</strong> Create a new canvas with custom dimensions.</p>
              <p><strong>Save/Open:</strong> Save your work as a project file (.json) to edit later.</p>
              <p><strong>Export Options:</strong> Export as Text (.txt), HTML, PNG, SVG, animated GIF, or ANSI.</p>
              <p><strong>Clipboard:</strong> Import text directly from your clipboard.</p>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-medium mb-3">Asset Library</h3>
            <div className="space-y-2">
              <p>Access reusable assets like Templates, Patterns, and Character Sets.</p>
              <p>Search, filter by tags, sort, and manage your assets.</p>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-medium mb-3">Advanced Features</h3>
            <div className="space-y-2">
              <p><strong>Text Effects:</strong> Apply outline and shadow effects from the toolbar.</p>
              <p><strong>Text on Path:</strong> Create text that follows a path (Implementation may vary).</p>
              <p><strong>Text Wrapping:</strong> Control how text wraps (None, Word, Character).</p>
              <p><strong>Collaboration:</strong> See other users and chat in real-time (If enabled).</p>
              <p><strong>Autosave:</strong> Work is automatically saved locally. Toggle in Settings.</p>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-medium mb-3">Tips & Tricks</h3>
            <div className="space-y-2">
              <p><strong>Grid & Snap:</strong> Toggle the grid and snapping for precise positioning (See Settings).</p>
              <p><strong>Keyboard Shortcuts:</strong> Check Settings for available shortcuts (e.g., Ctrl+Z for Undo).</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default HelpDialog