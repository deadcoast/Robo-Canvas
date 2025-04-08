import { Redo, Undo } from 'lucide-react';
import React from 'react';
import { useEditorStore } from '../store/editorStore';

const HistoryPanel: React.FC = () => {
  const {
    history,
    historyIndex,
    undo,
    redo,
  } = useEditorStore(state => ({
    history: state.history,
    historyIndex: state.historyIndex,
    undo: state.undo,
    redo: state.redo,
  }));

  const canUndo = historyIndex >= 0;
  const canRedo = historyIndex < history.length - 1;

  // Simple representation of history states - maybe show timestamps or action types later?
  // For now, just show count and provide buttons.

  return (
    <div className="p-4 bg-gray-100 border-t border-gray-200">
      <h3 className="font-medium mb-2 text-sm">History</h3>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-500">
          {history.length} state(s)
        </span>
        <div className="flex gap-1">
          <button
            onClick={undo}
            disabled={!canUndo}
            className="p-1 hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            title="Undo"
          >
            <Undo size={16} />
          </button>
          <button
            onClick={redo}
            disabled={!canRedo}
            className="p-1 hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            title="Redo"
          >
            <Redo size={16} />
          </button>
        </div>
      </div>
       {/* Optional: Display list of history items later */}
       {/* <div className="max-h-32 overflow-y-auto text-xs space-y-1">
        {history.map((_, index) => (
          <div key={index} className={`p-1 rounded ${index === historyIndex ? 'bg-blue-100' : ''}`}>
            State {index + 1}
          </div>
        ))}
      </div> */}
    </div>
  );
};

export default HistoryPanel; 