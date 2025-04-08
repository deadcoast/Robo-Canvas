# ASCII Art Editor Architecture

## Application Architecture

### Overview
The ASCII Art Editor follows a component-based architecture with centralized state management. The application is structured around a canvas-based drawing system with support for multiple layers, tools, and export capabilities.

### Core Components

#### State Management
- **EditorStore** (`src/store/editorStore.ts`)
  - Central state management using Zustand
  - Handles all editor operations and state
  - Manages undo/redo history
  - Controls layer management
  - Handles import/export operations

#### UI Components

1. **Canvas** (`src/components/Canvas.tsx`)
   - Core drawing surface
   - Handles mouse and keyboard interactions
   - Renders all drawing elements
   - Manages real-time preview
   - Implements grid system

2. **Toolbar** (`src/components/Toolbar.tsx`)
   - Tool selection
   - Drawing options
   - Grid controls
   - Color picker
   - Template management

3. **MenuBar** (`src/components/MenuBar.tsx`)
   - File operations
   - Export options
   - Canvas settings
   - Zoom controls

4. **LayerPanel** (`src/components/LayerPanel.tsx`)
   - Layer management
   - Visibility toggles
   - Layer ordering
   - Lock/unlock functionality

5. **SpecialCharPalette** (`src/components/SpecialCharPalette.tsx`)
   - Character set selection
   - Special character insertion
   - Custom character set management

### Data Flow

```
┌─────────────────┐
│    EditorStore  │
└───────┬─────────┘
        │
        ▼
┌───────────────────┐
│  React Components │
└─────────┬─────────┘
          │
    ┌─────┴─────┐
    ▼           ▼
┌─────────┐ ┌────────┐
│  Canvas │ │ UI     │
└─────────┘ └────────┘
```

### Type System

#### Core Types (`src/types/canvas.ts`)
- **Point**: Coordinate system
- **Line**: Vector-based lines
- **Box**: Rectangle elements
- **TextElement**: Text content
- **Layer**: Grouping structure
- **Selection**: Selection area
- **Tool**: Available tools
- **Template**: Reusable patterns

### Features

#### Drawing System
- Vector-based drawing
- Grid alignment
- Snap-to-grid functionality
- Multi-layer support
- Real-time preview

#### History Management
- Undo/redo stack
- State snapshots
- Action tracking

#### Export Capabilities
- JSON project files
- Plain text export
- PNG image export
- Clipboard operations

#### Layer System
- Multiple layers
- Layer visibility
- Layer locking
- Drag-and-drop reordering
- Layer-specific operations

### File Structure

```
src/
├── components/       # React components
├── store/           # State management
├── types/           # TypeScript definitions
├── utils/           # Helper functions
└── App.tsx          # Root component
```

### Best Practices

1. **State Management**
   - Centralized state in EditorStore
   - Immutable updates using Immer
   - Type-safe state operations

2. **Component Design**
   - Single responsibility principle
   - Controlled components
   - Props type safety
   - Performance optimization

3. **Error Handling**
   - Try-catch blocks for operations
   - User feedback for errors
   - Graceful fallbacks

4. **Performance**
   - Canvas optimization
   - Debounced updates
   - Memoized calculations

### Security Considerations

1. **File Operations**
   - Safe file handling
   - Sanitized imports
   - Validated exports

2. **User Input**
   - Input validation
   - Safe character handling
   - XSS prevention

### Future Considerations

1. **Extensibility**
   - Plugin system
   - Custom tool support
   - Additional export formats

2. **Performance**
   - WebAssembly integration
   - Worker thread support
   - Rendering optimizations

3. **Features**
   - Collaboration support
   - Cloud storage
   - Advanced templates