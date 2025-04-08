import { PenLine, Pointer, Square, Type } from 'lucide-react';
import React from 'react';
import { useEditorStore } from '../store/editorStore';

// Use React.ElementType for more flexible icon typing
const toolIcons: Record<string, React.ElementType> = {
  select: Pointer,
  box: Square,
  text: Type,
  line: PenLine,
  // Add other tools as needed
};

const PropertiesPanel: React.FC = () => {
  const {
    currentTool,
    selection,
    currentColor,
    fontSize,
    lineStyle,
    fillBox
  } = useEditorStore(state => ({
    currentTool: state.currentTool,
    selection: state.selection,
    currentColor: state.currentColor,
    fontSize: state.fontSize,
    lineStyle: state.lineStyle,
    fillBox: state.fillBox
  }));

  const CurrentToolIcon = toolIcons[currentTool] || Pointer; // Default to Pointer

  return (
    <div className="p-4 border-t border-gray-200">
      <h3 className="font-medium text-sm mb-3">Properties</h3>
      <div className="space-y-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-gray-500 w-20">Current Tool:</span>
          <div className="flex items-center gap-1 capitalize">
             <CurrentToolIcon size={14} />
             <span>{currentTool}</span>
           </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-500 w-20">Selection:</span>
          <span>{selection ? `Active (${Math.abs(selection.end.x - selection.start.x)} x ${Math.abs(selection.end.y - selection.start.y)})` : 'None'}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-500 w-20">Color:</span>
          <div className="w-4 h-4 rounded border border-gray-300" style={{ backgroundColor: currentColor }}></div>
          <span>{currentColor}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-500 w-20">Font Size:</span>
          <span>{fontSize}px</span>
        </div>
        {/* Conditionally show tool-specific properties */}       
        {currentTool === 'line' && (
           <div className="flex items-center gap-2">
             <span className="text-gray-500 w-20">Line Style:</span>
             <span className="capitalize">{lineStyle}</span>
          </div>
        )}
         {currentTool === 'box' && (
           <div className="flex items-center gap-2">
             <span className="text-gray-500 w-20">Fill Mode:</span>
             <span>{fillBox ? 'On' : 'Off'}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default PropertiesPanel; 