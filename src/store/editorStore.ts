import { produce } from 'immer';
import { create } from 'zustand';
import { SymmetryMode } from '../hooks/useSymmetry';
import { Asset, AssetLibrary, BackgroundGradient, BackgroundPattern, Box, CanvasHistory, Selection as CanvasSelection, CharacterSet, EditorState, Layer, Line, Pattern, Point, TextAlignment, TextElement, Tool } from '../types/canvas';
import { generateSuggestions } from '../utils/aiAssistant';
import { getContentSamples, synthesizeFill } from '../utils/contentAwareFill';
import { isBoxInSelection, isPointInSelection } from '../utils/selection';

// Helper functions
const createGridFromElements = (elements: Layer['elements']) => {
  // Create an empty grid (consider making this dynamic based on canvas size)
  const rows = 100;
  const cols = 100;
  const grid: string[][] = Array(rows).fill([]).map(() => Array(cols).fill(' '));
  
  // Draw boxes on the grid
  elements.boxes.forEach(box => {
    const minX = Math.min(box.start.x, box.end.x);
    const maxX = Math.max(box.start.x, box.end.x);
    const minY = Math.min(box.start.y, box.end.y);
    const maxY = Math.max(box.start.y, box.end.y);
    
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        if (y >= 0 && y < rows && x >= 0 && x < cols) {
          if (box.filled) {
            grid[y][x] = '█';
          } else if (y === minY && x === minX) {
            grid[y][x] = '┌';
          } else if (y === minY && x === maxX) {
            grid[y][x] = '┐';
          } else if (y === maxY && x === minX) {
            grid[y][x] = '└';
          } else if (y === maxY && x === maxX) {
            grid[y][x] = '┘';
          } else if (y === minY || y === maxY) {
            grid[y][x] = '─';
          } else if (x === minX || x === maxX) {
            grid[y][x] = '│';
          }
        }
      }
    }
  });
  
  // Draw lines on the grid
  elements.lines.forEach(line => {
    const dx = line.end.x - line.start.x;
    const dy = line.end.y - line.start.y;
    const steps = Math.max(Math.abs(dx), Math.abs(dy));
    
    for (let i = 0; i <= steps; i++) {
      const x = Math.round(line.start.x + (dx * i) / steps);
      const y = Math.round(line.start.y + (dy * i) / steps);
      
      if (y >= 0 && y < rows && x >= 0 && x < cols) {
          if (Math.abs(dx) > Math.abs(dy)) {
            grid[y][x] = '─';
          } else if (Math.abs(dy) > Math.abs(dx)) {
            grid[y][x] = '│';
          } else {
            grid[y][x] = '┼';
        }
      }
    }
  });
  
  // Draw text on the grid
  elements.textElements.forEach(text => {
    const x = Math.floor(text.position.x);
    const y = Math.floor(text.position.y);
    
    if (y >= 0 && y < rows) {
      text.content.split('').forEach((char, i) => {
        const posX = x + i;
        if (posX >= 0 && posX < cols) {
          grid[y][posX] = char;
        }
      });
    }
  });
  
  return grid;
};

// Define the structure for the exported file state
interface ExportedFileState {
  version: string;
  content: {
    layers: Layer[];
    canvasWidth: number;
    canvasHeight: number;
    zoom: number;
    fontSize: number;
    currentColor: string;
    theme: 'light' | 'dark';
    // Add other properties saved in the actual exportToFile implementation if needed
  };
}

// Template interface
interface Template {
  id: string;
  name: string;
  preview: string;
  content: {
    lines: Line[];
    boxes: Box[];
    textElements: TextElement[];
  };
}

interface EditorStore extends EditorState {
  assetLibrary: AssetLibrary;
  addAsset: (asset: Omit<Asset, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateAsset: (id: string, updates: Partial<Asset>) => void;
  deleteAsset: (id: string) => void;
  addTag: (tag: string) => void;
  removeTag: (tag: string) => void;
  setSearchQuery: (query: string) => void;
  toggleSelectedTag: (tag: string) => void;
  setView: (view: 'grid' | 'list') => void;
  setSortBy: (sortBy: 'name' | 'date' | 'type') => void;
  setSortOrder: (order: 'asc' | 'desc') => void;
  suggestions: {
    enabled: boolean;
    predictions: {
      type: 'line' | 'box' | 'text';
      points: Point[];
      confidence: number;
    }[];
  };
  contentAwareFillSettings: {
    sampleRadius: number;
    matchThreshold: number;
    blendMode: 'replace' | 'blend';
  };
  currentTool: Tool;
  isDrawing: boolean;
  backgroundColor: string;
  backgroundType: 'solid' | 'gradient' | 'pattern';
  backgroundGradient: {
    startColor: string;
    endColor: string;
    angle: number;
  };
  backgroundPattern: {
    type: 'dots' | 'lines' | 'grid';
    primaryColor: string;
    secondaryColor: string;
    scale: number;
  };
  textAlignment: TextAlignment;
  theme: 'light' | 'dark';
  zoom: number;
  canvasWidth: number;
  canvasHeight: number;
  showGrid: boolean;
  fontSize: number;
  showCharCount: boolean;
  showDimensions: boolean;
  currentColor: string;
  templates: Template[];
  patterns: Pattern[];
  lineStyle: 'solid' | 'dashed' | 'dotted';
  selectionMode: 'replace' | 'add' | 'subtract';
  selectionConstraint: 'none' | 'square' | 'custom';
  selectionRatio: number;
  selectionTransform: {
    rotate: number;
    scaleX: number;
    scaleY: number;
  };
  setLineStyle: (style: 'solid' | 'dashed' | 'dotted') => void;
  importFromClipboard: () => Promise<void>;
  setTool: (tool: Tool) => void;
  toggleGrid: () => void;
  setFontSize: (size: number) => void;
  startDrawing: (point: Point) => void;
  stopDrawing: () => void;
  addLine: (start: Point, end: Point, style?: 'solid' | 'dashed' | 'dotted', color?: string) => void;
  lines: Line[];
  addBox: (start: Point, end: Point, color?: string, fillColor?: string) => void;
  boxes: Box[];
  addText: (position: Point, content: string, color?: string) => void;
  textElements: TextElement[];
  selection: CanvasSelection | null;
  setSelection: (selection: CanvasSelection | null) => void;
  moveSelection: (deltaX: number, deltaY: number) => void;
  copySelection: () => void;
  paste: (position: Point) => void;
  undo: () => void;
  redo: () => void;
  saveToHistory: () => void;
  exportToFile: () => ExportedFileState;
  exportToSvg: () => string;
  exportToGif: () => Promise<Blob | null>;
  exportToAnsi: () => string;
  loadFromFile: (content: string) => void;
  clearCanvas: () => void;
  setCanvasSize: (width: number, height: number) => void;
  setZoom: (zoom: number) => void;
  setColor: (color: string) => void;
  addCharacterSet: (characterSet: CharacterSet) => void;
  editCharacterSet: (id: string, updates: Partial<CharacterSet>) => void;
  deleteCharacterSet: (id: string) => void;
  setCurrentCharacterSet: (id: string) => void;
  applyTemplate: (template: Template) => void;
  toggleCharCount: () => void;
  toggleDimensions: () => void;
  exportToText: () => string;
  exportToImage: () => string;
  addLayer: () => void;
  deleteLayer: (id: string) => void;
  updateLayer: (id: string, updates: Partial<Layer>) => void;
  setActiveLayer: (id: string) => void;
  reorderLayers: (fromIndex: number, toIndex: number) => void;
  fillBox: boolean;
  toggleFillBox: () => void;
  snapToGrid: boolean;
  toggleSnapToGrid: () => void;
  deleteAtPoint: (point: Point) => void;
  setSelectionMode: (mode: 'replace' | 'add' | 'subtract') => void;
  setSelectionConstraint: (constraint: 'none' | 'square' | 'custom') => void;
  setSelectionRatio: (ratio: number) => void;
  setSelectionTransform: (transform: Partial<EditorStore['selectionTransform']>) => void;
  history: CanvasHistory[];
  historyIndex: number;
  textEffects: {
    outline: boolean;
    shadow: boolean;
  };
  textPath: boolean;
  textWrapping: 'none' | 'word' | 'char';
  autosaveEnabled: boolean;
  toggleAutosave: () => void;
  setTextAlignment: (alignment: TextAlignment) => void;
  handleContentAwareFill: (point: Point) => void;
  updateAISuggestions: (point: Point) => Promise<void>;
  applyPattern: (pattern: Pattern, position: Point) => void;
  setBackgroundColor: (color: string) => void;
  setBackgroundType: (type: EditorState['backgroundType']) => void;
  setBackgroundGradient: (gradient: Partial<BackgroundGradient>) => void;
  setBackgroundPattern: (pattern: Partial<BackgroundPattern>) => void;
  toggleTextEffect: (effect: 'outline' | 'shadow') => void;
  toggleTextPath: () => void;
  cycleTextWrapping: () => void;
  selectedSpecialChar: string | null;
  setSelectedSpecialChar: (char: string | null) => void;
  addSpecialCharacter: (point: Point) => void;
  symmetryMode: SymmetryMode;
  symmetryCenter: Point;
  setSymmetryMode: (mode: SymmetryMode) => void;
  setSymmetryCenter: (point: Point) => void;
  setTheme: (theme: 'light' | 'dark') => void;
}

export const useEditorStore = create<EditorStore>((set, get) => ({
  assetLibrary: {
    assets: [],
    tags: [],
    searchQuery: '',
    selectedTags: [],
    view: 'grid',
    sortBy: 'date',
    sortOrder: 'desc'
  },
  suggestions: {
    enabled: true,
    predictions: []
  },
  contentAwareFillSettings: {
    sampleRadius: 5,
    matchThreshold: 0.7,
    blendMode: 'replace'
  },
  currentTool: 'line',
  isDrawing: false,
  backgroundType: 'solid',
  backgroundColor: '#ffffff',
  backgroundGradient: {
    startColor: '#ffffff',
    endColor: '#f0f0f0',
    angle: 45
  },
  backgroundPattern: {
    type: 'dots',
    primaryColor: '#ffffff',
    secondaryColor: '#f0f0f0',
    scale: 1
  },
  textAlignment: 'left',
  textEffects: {
    outline: false,
    shadow: false
  },
  textPath: false,
  textWrapping: 'none',
  theme: 'light',
  zoom: 1,
  canvasWidth: 1600,
  canvasHeight: 900,
  showGrid: true,
  fontSize: 16,
  showCharCount: true,
  showDimensions: true,
  currentColor: '#000000',
  lineStyle: 'solid',
  layers: [
    {
      id: 'default',
      name: 'Layer 1',
      visible: true,
      locked: false,
      elements: {
        lines: [],
        boxes: [],
        textElements: []
      }
    }
  ],
  activeLayer: 'default',
  characterSets: [
    {
      id: 'default',
      name: 'Box Drawing',
      characters: ['█', '▀', '▄', '░', '▒', '▓', '│', '─', '┌', '┐', '└', '┘',
        '├', '┤', '┬', '┴', '┼', '═', '║', '╒', '╓', '╔', '╕', '╖',
        '╗', '╘', '╙', '╚', '╛', '╜', '╝', '╞', '╟', '╠', '╡', '╢',
        '╣', '╤', '╥', '╦', '╧', '╨', '╩', '╪', '╫', '╬'],
      isBuiltIn: true
    },
    {
      id: 'blocks',
      name: 'Block Elements',
      characters: [' ', '▂', '▃', '▄', '▅', '▆', '▇', '█', '▉', '▊', '▋', '▌',
        '▍', '▎', '▏', '▐', '▔', '▕', '▖', '▗', '▘', '▙', '▚', '▛',
        '▜', '▝', '▞', '▟'],
      isBuiltIn: true
    },
    {
      id: 'geometric',
      name: 'Geometric Shapes',
      characters: ['■', '□', '▢', '▣', '▤', '▥', '▦', '▧', '▨', '▩', '▪', '▫',
        '▬', '▭', '▮', '▯', '▰', '▱', '▲', '▼', '◄', '►', '◆', '◇',
        '○', '●', '◐', '◑', '◒', '◓', '◔', '◕'],
      isBuiltIn: true
    }
  ],
  currentCharacterSet: 'default',
  templates: [
    {
      id: 'table-2x2',
      name: '2x2 Table',
      preview: '┌─┬─┐\n├─┼─┤\n└─┴─┘',
      content: {
        lines: [],
        boxes: [
          { start: { x: 0, y: 0 }, end: { x: 4, y: 2 }, filled: false },
          { start: { x: 0, y: 1 }, end: { x: 4, y: 1 }, filled: false },
          { start: { x: 2, y: 0 }, end: { x: 2, y: 2 }, filled: false }
        ],
        textElements: []
      }
    },
    {
      id: 'thought-bubble',
      name: 'Thought Bubble',
      preview: ' ╭─────╮\n(  Hi!  )\n ╰○○○○○╯',
      content: {
        lines: [],
        boxes: [
          { start: { x: 1, y: 0 }, end: { x: 7, y: 2 }, filled: false }
        ],
        textElements: [
          { position: { x: 3, y: 1 }, content: 'Hi!', fontSize: 16 }
        ]
      }
    },
    {
      id: 'flowchart-decision',
      name: 'Decision Diamond',
      preview: '   ╱─────╲\n  ╱ Yes/No ╲\n ╱─────────╲\n',
      content: {
        lines: [
          { start: { x: 3, y: 0 }, end: { x: 8, y: 0 } },
          { start: { x: 2, y: 1 }, end: { x: 9, y: 1 } },
          { start: { x: 1, y: 2 }, end: { x: 10, y: 2 } },
          { start: { x: 3, y: 0 }, end: { x: 1, y: 2 } },
          { start: { x: 8, y: 0 }, end: { x: 10, y: 2 } }
        ],
        boxes: [],
        textElements: [
          { position: { x: 3, y: 1 }, content: 'Yes/No', fontSize: 16 }
        ]
      }
    }
  ],
  specialChars: [
    '█', '▀', '▄', '░', '▒', '▓', '│', '─', '┌', '┐', '└', '┘',
    '├', '┤', '┬', '┴', '┼', '═', '║', '╒', '╓', '╔', '╕', '╖',
    '╗', '╘', '╙', '╚', '╛', '╜', '╝', '╞', '╟', '╠', '╡', '╢',
    '╣', '╤', '╥', '╦', '╧', '╨', '╩', '╪', '╫', '╬',
    ' ', '▂', '▃', '▄', '▅', '▆', '▇', '█', '▉', '▊', '▋', '▌',
    '▍', '▎', '▏', '▐', '▔', '▕', '▖', '▗', '▘', '▙', '▚', '▛',
    '▜', '▝', '▞', '▟', '■', '□', '▢', '▣', '▤', '▥', '▦', '▧',
    '▨', '▩', '▪', '▫', '▬', '▭', '▮', '▯', '▰', '▱', '▲', '▼',
    '◄', '►', '◆', '◇', '○', '●', '◐', '◑', '◒', '◓', '◔', '◕'
  ],
  lines: [],
  boxes: [],
  textElements: [],
  selection: null,
  clipboard: null,
  history: [],
  historyIndex: -1,
  selectionMode: 'replace',
  selectionConstraint: 'none',
  selectionRatio: 1,
  selectionTransform: {
    rotate: 0,
    scaleX: 1,
    scaleY: 1
  },
  patterns: [
    {
      id: 'border-single',
      name: 'Single Border',
      content: [
        ['┌', '─', '┐'],
        ['│', ' ', '│'],
        ['└', '─', '┘']
      ],
      preview: '┌─┐\n│ │\n└─┘'
    },
    {
      id: 'border-double',
      name: 'Double Border',
      content: [
        ['╔', '═', '╗'],
        ['║', ' ', '║'],
        ['╚', '═', '╝']
      ],
      preview: '╔═╗\n║ ║\n╚═╝'
    },
    {
      id: 'arrow-right',
      name: 'Right Arrow',
      content: [
        [' ', '─', '►'],
        ['─', '─', '─'],
        [' ', '─', '►']
      ],
      preview: ' ─►\n───\n ─►'
    }
  ],
  fillBox: false,
  snapToGrid: true,
  autosaveEnabled: false,
  setTool: (tool) => set({ currentTool: tool }),
  toggleGrid: () => set((state) => ({ showGrid: !state.showGrid })),
  setFontSize: (size) => set({ fontSize: size }),
  startDrawing: () => set({ isDrawing: true }),
  stopDrawing: () => set({ isDrawing: false }),
  addLine: (start, end, style, color) => set(
    produce((state) => {
      state.saveToHistory();
      const activeLayer = state.layers.find((l: Layer) => l.id === state.activeLayer);
      if (activeLayer && !activeLayer.locked) {
        activeLayer.elements.lines.push({ 
          start, 
          end, 
          style: style || state.lineStyle,
          color: color || state.currentColor,
          layerId: state.activeLayer 
        });
      }
    })
  ),
  addBox: (start, end, color, fillColor) => set(
    produce((state) => {
      state.saveToHistory();
      const activeLayer = state.layers.find((l: Layer) => l.id === state.activeLayer);
      if (activeLayer && !activeLayer.locked) {
        activeLayer.elements.boxes.push({ 
          start, 
          end, 
          filled: state.fillBox,
          color: color || state.currentColor,
          fillColor: fillColor,
          layerId: state.activeLayer 
        });
      }
    })
  ),
  addText: (position, content, color) => set(
    produce((state) => {
      state.saveToHistory();
      const activeLayer = state.layers.find((l: Layer) => l.id === state.activeLayer);
      if (activeLayer && !activeLayer.locked) {
        activeLayer.elements.textElements.push({ 
          position, 
          content, 
          fontSize: state.fontSize,
          color: color || state.currentColor,
          layerId: state.activeLayer 
        });
      }
    })
  ),
  addLayer: () => set(
    produce((state) => {
      const newLayer: Layer = {
        id: `layer-${Date.now()}`,
        name: `Layer ${state.layers.length + 1}`,
        visible: true,
        locked: false,
        elements: {
          lines: [],
          boxes: [],
          textElements: []
        }
      };
      state.layers.push(newLayer);
      state.activeLayer = newLayer.id;
    })
  ),
  deleteLayer: (id: string) => set(
    produce((state) => {
      if (state.layers.length <= 1) {
        return;
      }
      state.layers = state.layers.filter((layer: Layer) => layer.id !== id);
      if (state.activeLayer === id) {
        state.activeLayer = state.layers[0].id;
      }
    })
  ),
  updateLayer: (id: string, updates: Partial<Layer>) => set(
    produce((state) => {
      const layer = state.layers.find((l: Layer) => l.id === id);
      if (layer) {
        Object.assign(layer, updates);
      }
    })
  ),
  setActiveLayer: (id: string) => set({ activeLayer: id }),
  reorderLayers: (fromIndex: number, toIndex: number) => set(
    produce((state) => {
      const [removed] = state.layers.splice(fromIndex, 1);
        state.layers.splice(toIndex, 0, removed);
    })
  ),
  toggleFillBox: () => set(state => ({ fillBox: !state.fillBox })),
  toggleSnapToGrid: () => set(state => ({ snapToGrid: !state.snapToGrid })),
  deleteAtPoint: (point: Point) => set(
    produce((state) => {
      state.saveToHistory();
      
      // Delete lines that start or end at this point
      state.lines = state.lines.filter((line: Line) => 
        !(Math.abs(line.start.x - point.x) <= 0.5 && Math.abs(line.start.y - point.y) <= 0.5) &&
        !(Math.abs(line.end.x - point.x) <= 0.5 && Math.abs(line.end.y - point.y) <= 0.5)
      );
      
      // Delete boxes that contain this point
      state.boxes = state.boxes.filter((box: Box) => {
                  const minX = Math.min(box.start.x, box.end.x);
                  const maxX = Math.max(box.start.x, box.end.x);
                  const minY = Math.min(box.start.y, box.end.y);
                  const maxY = Math.max(box.start.y, box.end.y);
                  return !(point.x >= minX && point.x <= maxX && point.y >= minY && point.y <= maxY);
      });
      
      // Delete text elements at this point
      state.textElements = state.textElements.filter((text: TextElement) =>
        !(Math.abs(text.position.x - point.x) <= 0.5 && Math.abs(text.position.y - point.y) <= 0.5)
      );
    })
  ),
  setSelection: (selection) => set({ selection }),
  moveSelection: (deltaX, deltaY) => set(
    produce((state) => {
      if (!state.selection) {
        return;
      }
      state.saveToHistory();

      // Iterate through each layer and move elements within selection
          state.layers.forEach((layer: Layer) => {
        // Skip locked layers
        if (layer.locked) {
          return;
        }

        // Move lines within selection
        layer.elements.lines = layer.elements.lines.map((line: Line) => {
          const isStartInSelection = isPointInSelection(line.start, state.selection!);
          const isEndInSelection = isPointInSelection(line.end, state.selection!);
          
          if (!isStartInSelection && !isEndInSelection) {
            return line;
          }
          
          return {
            ...line,
            start: isStartInSelection ? { x: line.start.x + deltaX, y: line.start.y + deltaY } : line.start,
            end: isEndInSelection ? { x: line.end.x + deltaX, y: line.end.y + deltaY } : line.end
          };
        });

        // Move boxes within selection
        layer.elements.boxes = layer.elements.boxes.map((box: Box) => {
          if (!isBoxInSelection(box, state.selection!)) {
            return box;
          }
          
          return {
            ...box,
            start: { x: box.start.x + deltaX, y: box.start.y + deltaY },
            end: { x: box.end.x + deltaX, y: box.end.y + deltaY },
            filled: box.filled
          };
        });

        // Move text elements within selection
        layer.elements.textElements = layer.elements.textElements.map((text: TextElement) => {
          if (!isPointInSelection(text.position, state.selection!)) {
            return text;
          }
          
          return {
            ...text,
            position: {
              x: text.position.x + deltaX,
              y: text.position.y + deltaY
            }
          };
        });
      });

      // Move selection box itself
          state.selection = {
        start: {
          x: state.selection.start.x + deltaX,
          y: state.selection.start.y + deltaY
        },
        end: {
          x: state.selection.end.x + deltaX,
          y: state.selection.end.y + deltaY
        }
          };
      })
  ),
  copySelection: () => set(
    produce((state) => {
          if (!state.selection) {
              return;
          }

      // Collect all elements from visible layers
          const lines: Line[] = [];
          const boxes: Box[] = [];
          const textElements: TextElement[] = [];

          state.layers.forEach((layer: Layer) => {
        if (!layer.visible || !layer.elements) {
          return;
        }

        // Get lines from this layer that are in the selection
        const selectedLines = layer.elements.lines.filter((line: Line) => 
          isPointInSelection(line.start, state.selection!) || 
          isPointInSelection(line.end, state.selection!)
        );
        
        // Get boxes from this layer that are in the selection
        const selectedBoxes = layer.elements.boxes.filter((box: Box) => 
          isBoxInSelection(box, state.selection!)
        );
        
        // Get text elements from this layer that are in the selection
        const selectedTextElements = layer.elements.textElements.filter((text: TextElement) => 
          isPointInSelection(text.position, state.selection!)
        );

        lines.push(...selectedLines);
        boxes.push(...selectedBoxes);
        textElements.push(...selectedTextElements);
      });

          state.clipboard = {
        lines,
        boxes,
        textElements
          };
      })
  ),
  paste: (position: Point) => set(
    produce((state) => {
      if (!state.clipboard) {
        return;
      }
      state.saveToHistory();

      // Calculate offset from original selection
      const originX = state.selection?.start.x ?? position.x;
      const originY = state.selection?.start.y ?? position.y;
      const offsetX = position.x - originX;
      const offsetY = position.y - originY;

      // Find the active layer to paste into
          const activeLayer = state.layers.find((layer: Layer) => layer.id === state.activeLayer);
          if (!activeLayer || activeLayer.locked) {
        console.warn('Cannot paste into locked or non-existent active layer');
              return;
          }

      // Ensure elements and sub-arrays exist
          if (!activeLayer.elements) {
            activeLayer.elements = { lines: [], boxes: [], textElements: [] };
          }
          if (!activeLayer.elements.lines) {
            activeLayer.elements.lines = [];
          }
          if (!activeLayer.elements.boxes) {
            activeLayer.elements.boxes = [];
          }
          if (!activeLayer.elements.textElements) {
            activeLayer.elements.textElements = [];
          }

      // Paste lines
      activeLayer.elements.lines.push(...state.clipboard.lines.map((line: Line) => ({
        ...line,
        start: {
          x: line.start.x + offsetX,
          y: line.start.y + offsetY
        },
        end: {
          x: line.end.x + offsetX,
          y: line.end.y + offsetY
        },
        layerId: activeLayer.id
      })));

      // Paste boxes
      activeLayer.elements.boxes.push(...state.clipboard.boxes.map((box: Box) => ({
        ...box,
        start: {
          x: box.start.x + offsetX,
          y: box.start.y + offsetY
        },
        end: {
          x: box.end.x + offsetX,
          y: box.end.y + offsetY
        },
        filled: box.filled,
        layerId: activeLayer.id
      })));

      // Paste text elements
      activeLayer.elements.textElements.push(...state.clipboard.textElements.map((text: TextElement) => ({
        ...text,
        position: {
          x: text.position.x + offsetX,
          y: text.position.y + offsetY
        },
        layerId: activeLayer.id
      })));
      })
  ),
  saveToHistory: () => set(
    produce((state) => {
      // Remove any future history if we're not at the latest state
          if (state.historyIndex < state.history.length - 1) {
              state.history = state.history.slice(0, state.historyIndex + 1);
          }

      // Save current layer state to history (deep copy needed)
      state.history.push(JSON.parse(JSON.stringify({
        layers: state.layers,
        activeLayer: state.activeLayer,
      })));
      state.historyIndex++;
      })
  ),
  undo: () => set(
    produce((state) => {
      if (state.historyIndex < 0) {
        return;
      }
      
      const previousHistoryState = state.history[state.historyIndex];
      
      if (previousHistoryState?.layers) {
          state.layers = JSON.parse(JSON.stringify(previousHistoryState.layers));
          state.activeLayer = previousHistoryState.activeLayer;
              state.historyIndex--;
      } else {
          console.warn("Cannot undo: Invalid history state.");
          }
      })
  ),
  redo: () => set(
    produce((state) => {
      if (state.historyIndex >= state.history.length - 1) {
        return;
      }
      
              state.historyIndex++;
      const nextHistoryState = state.history[state.historyIndex];
      
      if (nextHistoryState?.layers) {
        state.layers = JSON.parse(JSON.stringify(nextHistoryState.layers));
        state.activeLayer = nextHistoryState.activeLayer;
      } else {
         console.warn("Cannot redo: Invalid history state.");
         state.historyIndex--;
      }
    })
  ),
  exportToFile: (): ExportedFileState => {
    const state = get();
    const exportedContent = {
      layers: state.layers,
      canvasWidth: state.canvasWidth,
      canvasHeight: state.canvasHeight,
      zoom: state.zoom,
      fontSize: state.fontSize,
      currentColor: state.currentColor,
      theme: state.theme,
      // Include other relevant state properties here based on actual needs
      // Example: activeLayer: state.activeLayer,
      //          backgroundColor: state.backgroundColor,
      //          etc.
    };
    return {
      version: '1.0.4', // Or get dynamically if needed
      content: exportedContent
    };
  },
  loadFromFile: (fileContent: string) => set(
    produce((state) => {
      try {
        const content = JSON.parse(fileContent);
        if (typeof content !== 'object' || content === null) {
          throw new Error('Invalid file format');
        }
        if (content.version !== 1) {
          throw new Error('Unsupported file version');
        }
        if (!Array.isArray(content.layers)) {
          throw new Error('Missing or invalid layers data');
        }

        state.layers = content.layers;
        state.activeLayer = content.activeLayer || (content.layers[0]?.id || 'default');
        state.canvasWidth = content.canvasWidth || 1600;
        state.canvasHeight = content.canvasHeight || 900;
        state.backgroundColor = content.backgroundColor || '#ffffff';

        state.history = [];
        state.historyIndex = -1;
        state.saveToHistory();
      } catch (error) {
        console.error('Failed to load file:', error);
          }
      })
  ),
  clearCanvas: () => set(
    produce((state) => {
      state.saveToHistory();
      state.layers = [
        {
          id: 'default-cleared',
          name: 'Layer 1',
          visible: true,
          locked: false,
          elements: { lines: [], boxes: [], textElements: [] }
        }
      ];
      state.activeLayer = 'default-cleared';
      state.selection = null;
    })
  ),
  setCanvasSize: (width: number, height: number) => set(
    produce((state) => {
      state.canvasWidth = width;
      state.canvasHeight = height;
    })
  ),
  setZoom: (zoom: number) => set(
    produce((state) => {
      state.zoom = Math.max(0.1, Math.min(5, zoom));
    })
  ),
  setColor: (color: string) => set({ currentColor: color }),
  addCharacterSet: (characterSet: CharacterSet) => set(
    produce((state: EditorStore) => {
      if (!state.characterSets.some(cs => cs.id === characterSet.id)) {
        state.characterSets.push(characterSet);
      }
    })
  ),
  editCharacterSet: (id: string, updates: Partial<CharacterSet>) => set(
    produce((state) => {
      const index = state.characterSets.findIndex((set: CharacterSet) => set.id === id);
      if (index !== -1 && !state.characterSets[index].isBuiltIn) {
        state.characterSets[index] = {
          ...state.characterSets[index],
          ...updates
        };
      }
    })
  ),
  deleteCharacterSet: (id: string) => set(
    produce((state) => {
      const index = state.characterSets.findIndex((set: CharacterSet) => set.id === id);
      if (index !== -1 && !state.characterSets[index].isBuiltIn) {
        state.characterSets = state.characterSets.filter((set: CharacterSet) => set.id !== id);
        if (state.currentCharacterSet === id) {
          state.currentCharacterSet = 'default';
        }
      }
    })
  ),
  setCurrentCharacterSet: (id: string) => set(
      produce((state) => {
          if (state.characterSets.some((cs: CharacterSet) => cs.id === id)) {
              state.currentCharacterSet = id;
          }
      })
  ),
  applyTemplate: (template: Template) => set(
    produce((state) => {
      state.saveToHistory();
      const activeLayer = state.layers.find((l: Layer) => l.id === state.activeLayer);
       if (!activeLayer || activeLayer.locked) {
            console.warn('Cannot apply template to locked or non-existent layer.');
            return; 
          }
       if (!activeLayer.elements) {
         activeLayer.elements = { lines: [], boxes: [], textElements: [] };
       }
       if (!activeLayer.elements.lines) {
         activeLayer.elements.lines = [];
       }
       if (!activeLayer.elements.boxes) {
         activeLayer.elements.boxes = [];
       }
       if (!activeLayer.elements.textElements) {
         activeLayer.elements.textElements = [];
       }

      const offsetX = 10;
      const offsetY = 10;
      
      template.content.lines?.forEach(line => {
        activeLayer.elements.lines?.push({
          ...line,
          start: { x: line.start.x + offsetX, y: line.start.y + offsetY },
          end: { x: line.end.x + offsetX, y: line.end.y + offsetY },
          layerId: activeLayer.id
        });
      });
      
      template.content.boxes?.forEach(box => {
        activeLayer.elements.boxes?.push({
           ...box,
          start: { x: box.start.x + offsetX, y: box.start.y + offsetY },
          end: { x: box.end.x + offsetX, y: box.end.y + offsetY },
          layerId: activeLayer.id
        });
      });
      
      template.content.textElements?.forEach(text => {
        activeLayer.elements.textElements?.push({
          ...text,
          position: { x: text.position.x + offsetX, y: text.position.y + offsetY },
          layerId: activeLayer.id
        });
      });
    })
  ),
  toggleCharCount: () => set(state => ({ showCharCount: !state.showCharCount })),
  toggleDimensions: () => set(state => ({ showDimensions: !state.showDimensions })),
  exportToText: () => {
    const state = get();
    let textContent = '';
    state.layers.forEach(layer => {
        if (layer.visible && layer.elements?.textElements) {
            layer.elements.textElements.forEach(text => {
                textContent += `(${text.position.x},${text.position.y}): ${text.content}\n`;
            });
        }
    });
    console.warn("exportToText is a basic implementation.");
    return textContent;
  },
  exportToImage: () => {
    console.warn("exportToImage requires implementation using a canvas rendering library.");
    return "data:image/png;base64,...";
  },
  setLineStyle: (style: 'solid' | 'dashed' | 'dotted') => set({ lineStyle: style }),
  
  setBackgroundColor: (color: string) => set(
    produce((state) => {
      state.saveToHistory();
      state.backgroundColor = color;
      state.backgroundType = 'solid';
    })
  ),
  setBackgroundType: (type) => set(
    produce((state) => {
      state.saveToHistory();
      state.backgroundType = type;
    })
  ),
  setBackgroundGradient: (gradientUpdate) => set(
    produce((state) => {
      state.saveToHistory();
      state.backgroundGradient = { ...state.backgroundGradient, ...gradientUpdate };
      state.backgroundType = 'gradient';
    })
  ),
  setBackgroundPattern: (patternUpdate) => set(
    produce((state) => {
      state.saveToHistory();
      state.backgroundPattern = { ...state.backgroundPattern, ...patternUpdate };
      state.backgroundType = 'pattern';
    })
  ),
  toggleTextEffect: (effect) => set(
    produce((state) => {
      state.textEffects[effect] = !state.textEffects[effect];
    })
  ),
  toggleTextPath: () => set(state => ({ textPath: !state.textPath })),
  cycleTextWrapping: () => set(state => ({
    textWrapping: state.textWrapping === 'none'
      ? 'word'
      : state.textWrapping === 'word'
      ? 'char'
      : 'none'
  })),
  handleContentAwareFill: (point: Point) => set(
    produce((state) => {
      state.saveToHistory();
      const activeLayer = state.layers.find((l: Layer) => l.id === state.activeLayer);
      if (!activeLayer || activeLayer.locked) {
        return;
      }

      if (!activeLayer.elements) {
         activeLayer.elements = { lines: [], boxes: [], textElements: [] };
      }

      const samples = getContentSamples(
        activeLayer,
        point,
        state.contentAwareFillSettings.sampleRadius
      );

      const targetArea = {
        start: {
          x: Math.max(0, point.x - state.contentAwareFillSettings.sampleRadius),
          y: Math.max(0, point.y - state.contentAwareFillSettings.sampleRadius)
        },
        end: {
          x: point.x + state.contentAwareFillSettings.sampleRadius,
          y: point.y + state.contentAwareFillSettings.sampleRadius
        }
      };

      const synthesis = synthesizeFill(
        samples,
        targetArea,
        state.contentAwareFillSettings.matchThreshold
      );

      // Apply synthesized content
      // Define expected cell type based on context
      type SynthesizedCell = { content: string; color: string } | null | undefined;
      synthesis?.forEach((row: SynthesizedCell[], y: number) => {
        row?.forEach((cell: SynthesizedCell, x: number) => {
          if (cell) {
            const absX = targetArea.start.x + x;
            const absY = targetArea.start.y + y;

            if (!activeLayer.elements.textElements) {
                activeLayer.elements.textElements = [];
            }

            activeLayer.elements.textElements = activeLayer.elements.textElements
              .filter((el: TextElement) => !(el.position.x === absX && el.position.y === absY));

            activeLayer.elements.textElements.push({
              position: { x: absX, y: absY },
              content: cell.content,
              fontSize: state.fontSize,
              color: cell.color,
              layerId: activeLayer.id
            });
          }
        });
      });
    })
  ),
  updateAISuggestions: async (point: Point) => {
    const state = get();
    if (!state.suggestions.enabled) {
      return;
    }

    try {
      const canvasGrid = state.layers ? createGridFromElements(state.layers[0].elements) : [];
      const predictions = await generateSuggestions(canvasGrid, point);
      set(produce((draftState) => {
         draftState.suggestions.predictions = predictions;
      }));
      } catch (error) {
        console.error("Failed to update AI suggestions:", error);
        set(produce((draftState) => {
           draftState.suggestions.predictions = [];
        }));
      }
  },
  addAsset: (asset) => set(
    produce((state) => {
          const newAsset: Asset = {
        ...asset,
        id: `asset-${Date.now()}`,
              createdAt: Date.now(),
        updatedAt: Date.now()
          };
          state.assetLibrary.assets.push(newAsset);
      asset.tags?.forEach((tag: string) => {
             if (!state.assetLibrary.tags.includes(tag)) {
                 state.assetLibrary.tags.push(tag);
             }
          });
      })
  ),
  updateAsset: (id, updates) => set(
    produce((state) => {
      const asset = state.assetLibrary.assets.find((a: Asset) => a.id === id);
      if (asset) {
        Object.assign(asset, { ...updates, updatedAt: Date.now() });
        if (updates.tags) {
          updates.tags.forEach((tag: string) => {
                 if (!state.assetLibrary.tags.includes(tag)) {
                     state.assetLibrary.tags.push(tag);
                 }
              });
        }
          }
      })
  ),
  deleteAsset: (id) => set(
    produce((state) => {
      state.assetLibrary.assets = state.assetLibrary.assets.filter((a: Asset) => a.id !== id);
      })
  ),
  addTag: (tag) => set(
    produce((state) => {
      if (!state.assetLibrary.tags.includes(tag)) {
        state.assetLibrary.tags.push(tag);
          }
      })
  ),
  removeTag: (tag) => set(
    produce((state) => {
      state.assetLibrary.tags = state.assetLibrary.tags.filter((t: string) => t !== tag);
      state.assetLibrary.assets = state.assetLibrary.assets.map((asset: Asset) => ({
        ...asset,
        tags: asset.tags?.filter((t: string) => t !== tag) ?? []
      }));
      state.assetLibrary.selectedTags = state.assetLibrary.selectedTags.filter((t: string) => t !== tag);
    })
  ),
  setSearchQuery: (query) => set(
    produce((state) => {
          state.assetLibrary.searchQuery = query;
      })
  ),
  toggleSelectedTag: (tag) => set(
    produce((state) => {
          const index = state.assetLibrary.selectedTags.indexOf(tag);
          if (index === -1) {
        if (state.assetLibrary.tags.includes(tag)) {
              state.assetLibrary.selectedTags.push(tag);
        }
          } else {
              state.assetLibrary.selectedTags.splice(index, 1);
          }
      })
  ),
  setView: (view) => set(
    produce((state) => {
          state.assetLibrary.view = view;
      })
  ),
  setSortBy: (sortBy) => set(
    produce((state) => {
          state.assetLibrary.sortBy = sortBy;
      })
  ),
  setSortOrder: (order) => set(
    produce((state) => {
          state.assetLibrary.sortOrder = order;
      })
  ),
  setTheme: (theme: 'light' | 'dark') => set({ theme }),
  selectedSpecialChar: null,
  setSelectedSpecialChar: (char) => set({ selectedSpecialChar: char }),
  addSpecialCharacter: (point: Point) => set(
    produce((state) => {
      if (state.selectedSpecialChar) {
        state.addText(point, state.selectedSpecialChar, state.currentColor);
      }
    })
  ),
  symmetryMode: 'none',
  symmetryCenter: { x: 50, y: 50 },
  setSymmetryMode: (mode) => set({ symmetryMode: mode }),
  setSymmetryCenter: (point) => set({ symmetryCenter: point }),
  toggleAutosave: () => set(state => ({ autosaveEnabled: !state.autosaveEnabled })),
  setTextAlignment: (alignment) => set({ textAlignment: alignment }),
  importFromClipboard: async () => {
    console.warn("importFromClipboard not implemented yet");
    // Implementation needed: Read from clipboard API, parse, and call loadFromFile or add elements
    // Example:
    // try {
    //   const text = await navigator.clipboard.readText();
    //   // Parse text and update state...
    //   get().loadFromFile(text); // Assuming JSON format for simplicity
    // } catch (err) {
    //   console.error('Failed to read clipboard contents: ', err);
    // }
  },
  exportToSvg: () => {
    console.warn("exportToSvg not implemented yet");
    // Implementation needed: Generate SVG string from layers
    return '<svg></svg>'; // Placeholder
  },
  exportToGif: async () => {
    console.warn("exportToGif not implemented yet");
    // Implementation needed: Use a library like gif.js or similar
    return null; // Placeholder
  },
  exportToAnsi: () => {
    console.warn("exportToAnsi not implemented yet");
    // Implementation needed: Convert layers to ANSI escape code string
    return ''; // Placeholder
  },
  handleFill: (point: Point) => set(
    produce((state) => {
      console.warn("handleFill not implemented yet", point);
      // Implementation needed: Flood fill algorithm on the active layer
      state.saveToHistory();
      // ... flood fill logic ...
    })
  ),
  handleShapeRecognition: (points: Point[]) => set(
    produce((state) => {
      console.warn("handleShapeRecognition not implemented yet", points);
      // Implementation needed: Call shape recognition util, replace points with recognized shape
      state.saveToHistory();
      // ... shape recognition and element replacement logic ...
    })
  ),
  applyPattern: (pattern: Pattern, position: Point) => set(
    produce((state) => {
      console.warn("applyPattern implementation used", pattern, position);
      // Implementation: Place pattern content onto the active layer at the position
      state.saveToHistory();
      const activeLayer = state.layers.find((l: Layer) => l.id === state.activeLayer);
      if (!activeLayer || activeLayer.locked) {
        return;
      }
      if (!activeLayer.elements.textElements) {
        activeLayer.elements.textElements = [];
      }
      
      pattern.content.forEach((row, y) => {
        row.forEach((char, x) => {
          if (char !== ' ') { 
            const targetX = position.x + x;
            const targetY = position.y + y;
            // Remove existing char at target position first
            activeLayer.elements.textElements = activeLayer.elements.textElements.filter(
              (el: TextElement) => !(el.position.x === targetX && el.position.y === targetY)
            );
            // Add new char from pattern
            activeLayer.elements.textElements.push({
              position: { x: targetX, y: targetY },
              content: char,
              fontSize: state.fontSize,
              color: state.currentColor, 
              layerId: activeLayer.id
            });
          }
        });
      });
    })
  ),
  setSelectionMode: (mode) => set({ selectionMode: mode }),
  setSelectionConstraint: (constraint) => set({ selectionConstraint: constraint }),
  setSelectionRatio: (ratio) => set({ selectionRatio: ratio }),
  setSelectionTransform: (transform) => set(
    produce((state) => {
      state.selectionTransform = { ...state.selectionTransform, ...transform };
    })
  ),
}));