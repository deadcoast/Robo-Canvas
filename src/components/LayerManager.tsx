import { ChevronsUpDown, Eye, EyeOff, Lock, Plus, Trash2, Unlock } from 'lucide-react';
import React from 'react';
import { useEditorStore } from '../store/editorStore';
import { Layer } from '../types/canvas';

// Basic drag-and-drop implementation for reordering
const DraggableLayerItem: React.FC<{
  layer: Layer;
  index: number;
  activeLayer: string;
  setActiveLayer: (id: string) => void;
  updateLayer: (id: string, updates: Partial<Layer>) => void;
  deleteLayer: (id: string) => void;
  handleDragStart: (e: React.DragEvent<HTMLDivElement>, index: number) => void;
  handleDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  handleDrop: (e: React.DragEvent<HTMLDivElement>, index: number) => void;
}> = ({ layer, index, activeLayer, setActiveLayer, updateLayer, deleteLayer, handleDragStart, handleDragOver, handleDrop }) => {
  return (
    <div
      key={layer.id}
      draggable
      onDragStart={(e) => handleDragStart(e, index)}
      onDragOver={handleDragOver}
      onDrop={(e) => handleDrop(e, index)}
      onClick={() => setActiveLayer(layer.id)}
      className={`flex items-center justify-between p-2 rounded mb-1 cursor-pointer transition-colors ${
        activeLayer === layer.id ? 'bg-blue-100 border border-blue-300' : 'hover:bg-gray-100 border border-transparent'
      }`}
    >
      <div className="flex items-center gap-2">
        <ChevronsUpDown size={14} className="text-gray-400 cursor-grab" />
        <span className="text-sm truncate" title={layer.name}>{layer.name}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <button
          onClick={(e) => { e.stopPropagation(); updateLayer(layer.id, { locked: !layer.locked }); }}
          className="p-1 hover:bg-gray-200 rounded"
          title={layer.locked ? 'Unlock Layer' : 'Lock Layer'}
        >
          {layer.locked ? <Lock size={14} /> : <Unlock size={14} />}
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); updateLayer(layer.id, { visible: !layer.visible }); }}
          className="p-1 hover:bg-gray-200 rounded"
          title={layer.visible ? 'Hide Layer' : 'Show Layer'}
        >
          {layer.visible ? <Eye size={14} /> : <EyeOff size={14} className="text-gray-400" />}
        </button>
        <button
          onClick={(e) => { 
            e.stopPropagation(); 
            if (confirm('Are you sure you want to delete this layer?')) {
              deleteLayer(layer.id); 
            }
          }}
          className="p-1 hover:bg-gray-200 rounded text-red-500"
          title="Delete Layer"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
};

const LayerManager: React.FC = () => {
  const { 
    layers, 
    activeLayer, 
    setActiveLayer, 
    addLayer, 
    deleteLayer, 
    updateLayer, 
    reorderLayers 
  } = useEditorStore();

  const dragItem = React.useRef<number | null>(null);
  const dragOverItem = React.useRef<number | null>(null);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    dragItem.current = index;
    // Optional: style the dragged item
    e.currentTarget.style.opacity = '0.5';
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); // Necessary to allow drop
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    e.currentTarget.style.opacity = '1'; // Reset opacity
    if (dragItem.current === null) {
      return;
    }

    if (dragItem.current !== index) {
      reorderLayers(dragItem.current, index);
    }
    
    dragItem.current = null;
    dragOverItem.current = null;
  };

  return (
    <div className="p-4 border-b border-gray-200">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-medium text-sm">Layers</h3>
        <button
          onClick={addLayer}
          className="p-1 hover:bg-gray-100 rounded"
          title="Add New Layer"
        >
          <Plus size={16} />
        </button>
      </div>
      <div className="max-h-60 overflow-y-auto">
        {layers.map((layer, index) => (
          <DraggableLayerItem
            key={layer.id}
            layer={layer}
            index={index}
            activeLayer={activeLayer}
            setActiveLayer={setActiveLayer}
            updateLayer={updateLayer}
            deleteLayer={deleteLayer}
            handleDragStart={handleDragStart}
            handleDragOver={handleDragOver}
            handleDrop={handleDrop}
          />
        ))}
      </div>
    </div>
  );
};

export default LayerManager; 