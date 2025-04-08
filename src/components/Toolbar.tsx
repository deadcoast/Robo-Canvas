import
  {
    AlignCenter,
    AlignLeft,
    AlignRight,
    Eraser,
    Grid,
    Hash,
    Lasso,
    LayoutTemplate,
    Magnet,
    Minus,
    MoreHorizontal,
    MousePointer,
    Paintbrush,
    PenLine,
    ShapesIcon,
    Sparkles,
    Square,
    SquareDot,
    Stamp,
    Type,
    Wand,
    Wand2
  } from 'lucide-react';
import React from 'react';
import { useEditorStore } from '../store/editorStore';

const tools = [
  { id: 'line', icon: PenLine, label: 'Line Tool' },
  { id: 'box', icon: Square, label: 'Box Tool' },
  { id: 'contentAwareFill', icon: Wand, label: 'Content-Aware Fill' },
  { id: 'aiAssist', icon: Sparkles, label: 'AI Suggestions' },
  { id: 'fill', icon: Paintbrush, label: 'Fill Tool' },
  { id: 'shape', icon: ShapesIcon, label: 'Shape Recognition' },
  { id: 'text', icon: Type, label: 'Text Tool' },
  { id: 'eraser', icon: Eraser, label: 'Eraser' },
  { id: 'select', icon: MousePointer, label: 'Select' },
  { id: 'lasso', icon: Lasso, label: 'Lasso Select' },
  { id: 'magicWand', icon: Wand2, label: 'Magic Wand' },
  { id: 'specialChar', icon: Hash, label: 'Special Characters' },
  { id: 'pattern', icon: Stamp, label: 'Pattern Stamps' },
  { id: 'template', icon: LayoutTemplate, label: 'Apply Template' }
] as const;

// Enhanced tooltips with detailed descriptions
const tooltips: Record<string, string> = {
  line: 'Line Tool (Click and drag, hold Shift for straight lines)',
  box: 'Box Tool (Click and drag to draw rectangles)',
  contentAwareFill: 'Content-Aware Fill (Select an area and click to fill intelligently)',
  aiAssist: 'AI Suggestions (Get contextual suggestions based on your drawing)',
  fill: 'Fill Tool (Click to flood fill connected characters)',
  shape: 'Shape Recognition (Draw a shape to auto-recognize)',
  text: 'Text Tool (Click to insert text)',
  eraser: 'Eraser (Click to remove elements)',
  select: 'Select Tool (Click and drag to select, move, or copy)',
  lasso: 'Lasso Tool (Click points to create custom selection)',
  magicWand: 'Magic Wand (Click to select connected characters)',
  specialChar: 'Special Characters (Click to insert pre-defined characters)',
  pattern: 'Pattern Stamps (Click to place pre-made patterns)',
  fillBox: 'Toggle Fill Mode (Fill boxes with solid color)',
  snap: 'Toggle Grid Snap (Align to grid points)',
  grid: 'Toggle Grid (Show/hide alignment grid)',
  color: 'Color Picker (Choose drawing color)',
  templates: 'Templates (Pre-made ASCII structures)',
  solid: 'Solid Line Style',
  dashed: 'Dashed Line Style',
  dotted: 'Dotted Line Style'
};

const Toolbar: React.FC = () => {
  const { 
    currentTool, 
    setTool,
    toggleGrid, 
    showGrid,
    currentColor,
    setColor,
    templates,
    applyTemplate,
    fillBox,
    toggleFillBox,
    snapToGrid,
    toggleSnapToGrid,
    lineStyle,
    setLineStyle,
    textAlignment,
    setTextAlignment,
    patterns,
    applyPattern
  } = useEditorStore();

  const renderTextAlignmentControls = () => {
    if (currentTool !== 'text') {
      return null;
    }
    
    return (
      <div className="flex gap-1 p-2 bg-gray-50 rounded">
        <button
          onClick={() => setTextAlignment('left')}
          className={`p-1 rounded ${textAlignment === 'left' ? 'bg-blue-100' : 'hover:bg-gray-100'}`}
          aria-label="Align Left"
          aria-pressed={textAlignment === 'left'}
        >
          <AlignLeft size={16} />
        </button>
        <button
          onClick={() => setTextAlignment('center')}
          className={`p-1 rounded ${textAlignment === 'center' ? 'bg-blue-100' : 'hover:bg-gray-100'}`}
          aria-label="Align Center"
          aria-pressed={textAlignment === 'center'}
        >
          <AlignCenter size={16} />
        </button>
        <button
          onClick={() => setTextAlignment('right')}
          className={`p-1 rounded ${textAlignment === 'right' ? 'bg-blue-100' : 'hover:bg-gray-100'}`}
          aria-label="Align Right"
          aria-pressed={textAlignment === 'right'}
        >
          <AlignRight size={16} />
        </button>
      </div>
    );
  };

  return (
    <div 
      className="flex flex-col gap-2 bg-white p-2 rounded-lg shadow-lg"
      role="toolbar"
      aria-label="Drawing Tools"
    >
      {tools.map(({ id, icon: Icon, label }) => (
        <button
          key={id}
          onClick={() => setTool(id)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              const currentIndex = tools.findIndex(t => t.id === id);
              const nextIndex = (currentIndex + 1) % tools.length;
              const nextButton = e.currentTarget.parentElement?.children[nextIndex] as HTMLElement;
              nextButton?.focus();
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              const currentIndex = tools.findIndex(t => t.id === id);
              const prevIndex = (currentIndex - 1 + tools.length) % tools.length;
              const prevButton = e.currentTarget.parentElement?.children[prevIndex] as HTMLElement;
              prevButton?.focus();
            }
          }}
          className={`p-2 rounded hover:bg-gray-100 transition-colors ${
            currentTool === id ? 'bg-blue-700 text-white' : 'text-gray-700'
          }`}
          aria-pressed={currentTool === id}
          aria-label={label}
          title={tooltips[id]}
        >
          <Icon size={20} />
        </button>
      ))}
      <div className="h-px bg-gray-200 my-2" />
      {renderTextAlignmentControls()}
      <button
        onClick={toggleFillBox}
        className={`p-2 rounded hover:bg-gray-100 transition-colors ${
          fillBox ? 'bg-blue-700 text-white' : 'text-gray-700'
        }`}
        aria-pressed={fillBox}
        aria-label="Fill Mode"
        title={tooltips.fillBox}
      >
        <SquareDot size={20} />
      </button>
      <button
        onClick={toggleSnapToGrid}
        className={`p-2 rounded hover:bg-gray-100 transition-colors ${
          snapToGrid ? 'bg-blue-100 text-blue-600' : 'text-gray-600'
        }`}
        aria-pressed={snapToGrid}
        aria-label="Snap to Grid"
        title={tooltips.snap}
      >
        <Magnet size={20} />
      </button>
      <button
        onClick={toggleGrid}
        className={`p-2 rounded hover:bg-gray-100 transition-colors ${
          showGrid ? 'bg-blue-100 text-blue-600' : 'text-gray-600'
        }`}
        aria-pressed={showGrid}
        aria-label="Show Grid"
        title={tooltips.grid}
      >
        <Grid size={20} />
      </button>
      <div className="h-px bg-gray-200 my-2" />
      
      {currentTool === 'line' && (
        <div className="flex flex-col gap-1 mb-2">
          <button
            onClick={() => setLineStyle('solid')}
            className={`p-2 rounded hover:bg-gray-100 transition-colors ${ 
              lineStyle === 'solid' ? 'bg-blue-100 text-blue-600' : 'text-gray-600' 
            }`}
            aria-pressed={lineStyle === 'solid'}
            aria-label="Solid Line Style"
            title={tooltips.solid}
          >
            <Minus size={20} />
          </button>
          <button
            onClick={() => setLineStyle('dashed')}
            className={`p-2 rounded hover:bg-gray-100 transition-colors ${ 
              lineStyle === 'dashed' ? 'bg-blue-100 text-blue-600' : 'text-gray-600' 
            }`}
            aria-pressed={lineStyle === 'dashed'}
            aria-label="Dashed Line Style"
            title={tooltips.dashed}
          >
            <div className="flex items-center justify-center w-5 h-5">
              <svg width="20" height="2" viewBox="0 0 20 2" fill="none" xmlns="http://www.w3.org/2000/svg">
                <line y1="1" x2="6" y2="1" stroke="currentColor" strokeWidth="2"/>
                <line x1="10" y1="1" x2="16" y2="1" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </div>
          </button>
          <button
            onClick={() => setLineStyle('dotted')}
            className={`p-2 rounded hover:bg-gray-100 transition-colors ${ 
              lineStyle === 'dotted' ? 'bg-blue-100 text-blue-600' : 'text-gray-600' 
            }`}
            aria-pressed={lineStyle === 'dotted'}
            aria-label="Dotted Line Style"
            title={tooltips.dotted}
          >
            <MoreHorizontal size={20} />
          </button>
          <div className="h-px bg-gray-200 my-1" />
        </div>
      )}
      
      {currentTool === 'pattern' && (
        <div className="relative group">
          <button
            className="p-2 rounded hover:bg-gray-100 transition-colors w-full"
            title="Select Pattern"
            aria-label="Select Pattern"
            aria-haspopup="true"
          >
            <Stamp size={20} />
          </button>
          <div 
            className="absolute left-full top-0 ml-2 hidden group-hover:block bg-white p-2 rounded-lg shadow-lg border border-gray-200 w-48 z-20"
            role="menu"
            aria-label="Pattern Options"
          >
            <div className="text-sm font-medium text-gray-700 mb-2">Patterns</div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {patterns?.map((pattern) => (
                <button
                  key={pattern.id}
                  onClick={() => applyPattern(pattern, { x: 0, y: 0 })}
                  className="w-full text-left p-2 hover:bg-gray-50 rounded transition-colors"
                  role="menuitem"
                >
                  <div className="font-medium text-sm mb-1">{pattern.name}</div>
                  <pre className="text-xs text-gray-600 font-mono whitespace-pre">{pattern.preview}</pre>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {currentTool === 'template' && (
         <div className="relative group">
          <button
            className="p-2 rounded hover:bg-gray-100 transition-colors w-full"
            title={tooltips.templates}
            aria-label="Templates"
            aria-haspopup="true"
          >
            <LayoutTemplate size={20} />
          </button>
          <div 
            className="absolute left-full top-0 ml-2 hidden group-hover:block bg-white p-2 rounded-lg shadow-lg border border-gray-200 w-48 z-20"
            role="menu"
            aria-label="Template Options"
          >
            <div className="text-sm font-medium text-gray-700 mb-2">Templates</div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {templates?.map((template) => (
                <button
                  key={template.id}
                  onClick={() => applyTemplate(template)}
                  className="w-full text-left p-2 hover:bg-gray-50 rounded transition-colors"
                  role="menuitem"
                >
                  <div className="font-medium text-sm mb-1">{template.name}</div>
                  <pre className="text-xs text-gray-600 font-mono whitespace-pre-wrap">{template.preview}</pre>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      
      <div className="relative">
        <button
          className="p-2 rounded hover:bg-gray-100 transition-colors w-full relative"
          title={tooltips.color}
          aria-label="Color Picker"
        >
          <div 
            className="w-5 h-5 rounded-full border border-gray-300"
            style={{ backgroundColor: currentColor }}
          />
          <input
            type="color"
            value={currentColor}
            onChange={(e) => setColor(e.target.value)}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            aria-label="Select Color"
          />
        </button>
      </div>
    </div>
  );
};

export default Toolbar;