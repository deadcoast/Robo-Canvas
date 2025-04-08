export interface Point {
  x: number;
  y: number;
}

export interface Layer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  elements: {
    lines: Line[];
    boxes: Box[];
    textElements: TextElement[];
  };
}

export interface Line {
  start: Point;
  end: Point;
  style?: 'solid' | 'dashed' | 'dotted';
  color?: string;
  layerId?: string;
}

export interface Box {
  start: Point;
  end: Point;
  filled: boolean;
  color?: string;
  fillColor?: string;
  layerId?: string;
}

export interface TextElement {
  position: Point;
  content: string;
  fontSize: number;
  color?: string;
  layerId?: string;
  alignment?: TextAlignment;
  effects?: {
    outline?: {
      color: string;
      width: number;
    };
    shadow?: {
      color: string;
      offset: Point;
      blur: number;
    };
  };
  path?: {
    points: Point[];
    tension: number;
    closed: boolean;
  };
  wrapping?: {
    width: number;
    mode: 'word' | 'char' | 'none';
  };
}

export interface Selection {
  start: Point;
  end: Point;
}

export interface CanvasState {
  width: number;
  height: number;
  content: string[][];
  history: string[][][];
  historyIndex: number;
  selection: Selection | null;
  selectionMode: 'replace' | 'add' | 'subtract';
  selectionConstraint: 'none' | 'square' | 'fixed-ratio';
  selectionRatio: number;
  selectionTransform: {
    rotate: number;
    scaleX: number;
    scaleY: number;
  };
}

export type Tool = 
  | 'line'
  | 'box'
  | 'text'
  | 'eraser'
  | 'select'
  | 'lasso'
  | 'magicWand'
  | 'specialChar'
  | 'fill'
  | 'shape'
  | 'pattern'
  | 'contentAwareFill'
  | 'aiAssist'
  | 'template';

export type TextAlignment = 'left' | 'center' | 'right';

export interface Pattern {
  id: string;
  name: string;
  content: string[][];
  preview: string;
}

export interface TransformData {
  rotate: number;
  scaleX: number;
  scaleY: number;
}

export interface EditorState {
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
  backgroundType: 'solid' | 'gradient' | 'pattern';
  backgroundColor: string;
  backgroundGradient: {
    startColor: string;
    endColor: string;
    angle: number;
  };
  backgroundPattern: {
    type: 'dots' | 'lines' | 'grid' | 'custom';
    primaryColor: string;
    secondaryColor: string;
    scale: number;
  };
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
  lineStyle: 'solid' | 'dashed' | 'dotted';
  setLineStyle: (style: 'solid' | 'dashed' | 'dotted') => void;
  importFromClipboard: () => Promise<void>;
  autosaveEnabled: boolean;
  toggleAutosave: () => void;
  lines: Line[];
  layers: Layer[];
  activeLayer: string;
  addLayer: () => void;
  deleteLayer: (id: string) => void;
  updateLayer: (id: string, updates: Partial<Layer>) => void;
  setActiveLayer: (id: string) => void;
  reorderLayers: (fromIndex: number, toIndex: number) => void;
  fillBox: boolean;
  snapToGrid: boolean;
  boxes: Box[];
  textElements: TextElement[];
  specialChars: string[];
  clipboard: CanvasClipboard | null;
  toggleFillBox: () => void;
  toggleSnapToGrid: () => void;
  deleteAtPoint: (point: Point) => void;
  setCanvasSize: (width: number, height: number) => void;
  setZoom: (zoom: number) => void;
  toggleCharCount: () => void;
  toggleDimensions: () => void;
  exportToText: () => string;
  exportToImage: () => string;
  setColor: (color: string) => void;
  applyTemplate: (template: Template) => void;
  characterSets: CharacterSet[];
  currentCharacterSet: string;
  addCharacterSet: (set: CharacterSet) => void;
  editCharacterSet: (id: string, set: Partial<CharacterSet>) => void;
  deleteCharacterSet: (id: string) => void;
  setCurrentCharacterSet: (id: string) => void;
  textAlignment: TextAlignment;
  textEffects: {
    outline: boolean;
    shadow: boolean;
  };
  textPath: boolean;
  textWrapping: 'none' | 'word' | 'char';
  toggleTextEffect: (effect: 'outline' | 'shadow') => void;
  toggleTextPath: () => void;
  cycleTextWrapping: () => void;
  exportToSvg: () => string;
  exportToGif: () => Promise<Blob | null>;
  exportToAnsi: () => string;
  handleFill: (point: Point) => void;
  handleShapeRecognition: (points: Point[]) => void;
  handleContentAwareFill: (point: Point) => void;
  updateAISuggestions: (point: Point) => Promise<void>;
  applyPattern: (pattern: Pattern, position: Point) => void;
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
}

export interface Template {
  id: string;
  name: string;
  preview: string;
  content: {
    lines: Line[];
    boxes: Box[];
    textElements: TextElement[];
  };
}

export interface CanvasClipboard {
    lines: Line[];
    boxes: Box[];
    textElements: TextElement[];
}

export interface CanvasHistory {
  layers: Layer[];
  canvasWidth: number;
  canvasHeight: number;
  activeLayer: string;
}

export interface CharacterSet {
  id: string;
  name: string;
  characters: string[];
  isBuiltIn?: boolean;
}

export interface Asset {
  id: string;
  name: string;
  type: 'template' | 'pattern' | 'character-set';
  tags: string[];
  content: any;
  preview?: string;
  createdAt: number;
  updatedAt: number;
}

export interface AssetLibrary {
  assets: Asset[];
  tags: string[];
  searchQuery: string;
  selectedTags: string[];
  view: 'grid' | 'list';
  sortBy: 'name' | 'date' | 'type';
  sortOrder: 'asc' | 'desc';
}

export interface BackgroundGradient {
  startColor: string;
  endColor: string;
  angle: number;
}

export interface BackgroundPattern {
  type: 'dots' | 'lines' | 'grid';
  primaryColor: string;
  secondaryColor: string;
  scale: number;
}