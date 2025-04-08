import { Eye, EyeOff, GripVertical, Lock, Plus, Trash2, Unlock } from 'lucide-react';
import React from 'react';
import { useEditorStore } from '../store/editorStore';

const LayerPanel: React.FC = () => {
  const { 
    layers, 
    activeLayer, 
    addLayer, 
    deleteLayer, 
    updateLayer, 
    setActiveLayer,
    reorderLayers 
  } = useEditorStore();

  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    const sourceIndex = parseInt(e.dataTransfer.getData('text/plain'));
    if (sourceIndex !== targetIndex) {
      reorderLayers(sourceIndex, targetIndex);
    }
  };

  return (
    <div 
      className="absolute left-4 top-20 bg-white p-4 rounded-lg shadow-lg border border-gray-200 w-64"
      role="region"
      aria-label="Layer Management"
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-medium" id="layers-heading">Layers</h3>
        <button
          onClick={addLayer}
          aria-label="Add New Layer"
          className="p-1 hover:bg-gray-100 rounded"
          title="Add Layer"
        >
          <Plus size={16} />
        </button>
      </div>
      <div 
        className="space-y-2"
        role="list"
        aria-labelledby="layers-heading"
      >
        {layers.map((layer, index) => (
          <div
            key={layer.id}
            role="listitem"
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, index)}
            className={`flex items-center gap-2 p-2 rounded cursor-move focus-within:ring-2 focus-within:ring-blue-500 ${
              activeLayer === layer.id ? 'bg-blue-100' : 'hover:bg-gray-50'
            }`}
            aria-label={`Layer ${layer.name}`}
          >
            <GripVertical size={16} className="text-gray-400" />
            <button
              onClick={() => updateLayer(layer.id, { visible: !layer.visible })}
              aria-label={`${layer.visible ? 'Hide' : 'Show'} Layer ${layer.name}`}
              aria-pressed={layer.visible}
              className="p-1 hover:bg-gray-100 rounded"
            >
              {layer.visible ? (
                <Eye size={16} className="text-gray-600" />
              ) : (
                <EyeOff size={16} className="text-gray-400" />
              )}
            </button>
            <button
              onClick={() => updateLayer(layer.id, { locked: !layer.locked })}
              aria-label={`${layer.locked ? 'Unlock' : 'Lock'} Layer ${layer.name}`}
              aria-pressed={layer.locked}
              className="p-1 hover:bg-gray-100 rounded"
            >
              {layer.locked ? (
                <Lock size={16} className="text-gray-600" />
              ) : (
                <Unlock size={16} className="text-gray-400" />
              )}
            </button>
            <input
              type="text"
              value={layer.name}
              onChange={(e) => updateLayer(layer.id, { name: e.target.value })}
              onClick={() => setActiveLayer(layer.id)}
              className={`flex-1 px-2 py-1 rounded ${
                activeLayer === layer.id ? 'bg-blue-50' : 'bg-transparent'
              } focus:outline-none focus:ring-1 focus:ring-blue-500`}
            />
            {layers.length > 1 && (
              <button
                onClick={() => deleteLayer(layer.id)}
                className="p-1 hover:bg-gray-100 rounded text-red-500"
                title="Delete Layer"
                aria-label={`Delete Layer ${layer.name}`}
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default LayerPanel;