# Changelog

## 1.0.1

### UPDATES

Menu Bar:
- Replace the separate export buttons with a single dropdown menu
- Add a state variable to control the dropdown visibility
- Style the dropdown menu with a clean, modern look
- Include icons for each export option
- Close the dropdown after selecting an option
- Add a chevron indicator that rotates when the menu is open

HTML export functionality:
- Imported the exportToHtml function from the exporters utility
- Added layers and fontSize to the destructured store values since they're needed for HTML export
- Implemented the handleExportHtml function that:
  - Calls exportToHtml with the current layers and font size
  - Creates a blob with HTML content type
  - Saves the file as 'ascii-art.html'
  - Includes error handling

Created a proper Settings Dialog component with:
- Character count toggle
- Canvas dimensions toggle
- Font size control
- Keyboard shortcuts reference

Added a Help Dialog component with:
- Detailed tool descriptions
- Layer management guide
- File operations guide
- Tips and tricks

Enhanced tooltips for all tools with:
- Detailed descriptions
- Usage instructions
- Keyboard shortcuts where applicable

Improved the MenuBar with:
  - Proper Settings button integration
  - New Help button
  - Better organized layout

Autosave functionality:
- Automatically saves every minute
- Saves to localStorage
- Can be toggled in settings
- Loads autosaved content on startup

Import from clipboard:
- New "Import" button in the menu bar
- Converts clipboard text to ASCII art
- Preserves line breaks and spacing
- Adds each character as a text element

Line style options:
- Added solid, dashed, and dotted line styles
- Line style selector appears when line tool is active
- Styles are preserved in saves/exports
- Visual preview in the canvas

Color support for all elements:
  - Lines with custom stroke colors
  - Boxes with separate stroke and fill colors
  - Text elements with custom colors

Color persistence:
- Colors are saved with each element
- Colors are preserved when copying/pasting
- Colors are included in file exports

UI Improvements:
- Color picker shows current color preview
- Color is applied to new elements as they're created
- Default to black if no color is specified

## 1.0.2

### UPDATES

**Staging Files**: [changelog](docs/changelog)
docs/
└── changelog/
    ├── components/
    │   ├── [✅] [Canvas.tsx](docs/changelog/components/Canvas.tsx) 
    │   ├── [LayerPanel.tsx](docs/changelog/components/LayerPanel.tsx)
    │   └── [Toolbar.tsx](docs/changelog/components/Toolbar.tsx)
    ├── store/
    │   └── [editorStore.ts](docs/changelog/store/editorStore.ts)
    ├── types/
    │   └── [✅] [canvas.ts](docs/changelog/types/canvas.ts) 
    └── utils/
        └── [selection.ts](docs/changelog/utils/selection.ts)

**New Files/Modules:**
- New files do not require seperation from the src directory, since they are not duplications of existing files.

src/
├── components/
│   └── [CollaborationPanel.tsx](src/components/CollaborationPanel.tsx)
├── hooks/
│   ├── [useCanvasRenderer.ts](src/hooks/useCanvasRenderer.ts)
│   └── [useCollaberation.ts](src/hooks/useCollaberation.ts)
├── types/
│   └── [collaboration.ts](src/types/collaboration.ts)
├── utils/
│   ├── [a11y.ts](src/utils/a11y.ts)
│   ├── [exporters.ts](src/utils/exporters.ts)
│   ├── [floodFill.ts](src/utils/floodFill.ts)
│   ├── [shapeRecognition.ts](src/utils/shapeRecognition.ts)
│   └── [wasmLoader.ts](src/utils/wasmLoader.ts)
├── wasm/
│   └── [geometry.wat](src/wasm/geometry.wat)
└── workers/
    ├── [canvasWorkers.ts](src/workers/canvasWorkers.ts)
    └── [floodFill.ts](src/workers/floodFill.ts)


#### VISUAL ENHANCEMENTS

Enhanced Canvas Background:
- Multiple background types:
  - Solid color
  - Gradient with adjustable angle
  - Patterns (dots, lines, grid)
  - Customizable colors and scales
  - Smooth transitions between types

Advanced Selection Tools:
- Multiple selection modes:
  - Replace (default)
  - Add to selection
  - Subtract from selection
  - Selection constraints:
  - Free-form
  - Square/1:1 ratio
  - Custom aspect ratio

Transform capabilities:
  - Rotation with visual handle
  - Scale from corners/edges
  - Maintain aspect ratio option

Visual feedback:
  - Transform handles
  - Rotation indicator
  - Selection bounds
  - Interactive cursors

The implementation includes:
- Type-safe state management
- Efficient canvas rendering
- Smooth transformations
- Proper handle hit detection
- Responsive visual feedback

#### Performance Optimizations

Canvas Rendering Optimization:
- Added a Web Worker for offloading calculations
- Implemented efficient line drawing using Bresenham's algorithm
- Added layer caching to prevent unnecessary redraws
- Batch processing of drawing operations

Layer Caching:
- Created a caching system for rendered layers
- Cache invalidation on layer changes
- Memory-efficient caching using ImageData

WebAssembly Integration:
- Added geometry calculations in WebAssembly
- Implemented fast point-in-rectangle checks
- Distance calculations for selection operations

Worker-based Processing:
- Offloaded heavy calculations to Web Worker
- Batch processing of drawing elements
- Parallel processing of layer rendering

Rendering Optimizations:
- Reduced unnecessary canvas redraws
- Efficient grid rendering
- Smart cache invalidation
- Optimized selection rendering

#### COLLABORATIVE FEATURES

We'll use a lightweight WebSocket client for the real-time functionality.

Real-time cursor sharing:
- See other users' cursors in real-time
- Each user gets a unique color
- Cursor positions update smoothly

User presence:
- Shows who's currently online
- Automatic connection/disconnection handling
- Visual status indicators

Chat functionality:
- Real-time messaging
- User-specific message styling
- Message history
- Collapsible chat panel

Canvas synchronization:
- Real-time drawing updates
- Syncs lines, boxes, and text
- Preserves tool settings

The collaboration panel is positioned in the bottom-right corner and includes:
- Online users list with colored indicators
- Real-time chat with message history
- Connection status indicator
- Collapsible interface

### 1.0.3
### ACCESSIBILITY IMPROVEMENTS

ARIA Labels and Roles:
- Added semantic roles to components
- Included descriptive ARIA labels
- Added live regions for dynamic content
- Improved status announcements

Keyboard Navigation:
- Added focus management
- Implemented arrow key navigation
- Added keyboard shortcuts for tools
- Created focus traps for modals

Screen Reader Support:
- Added screen reader announcements
- Improved status messages
- Enhanced tool descriptions
- Added live regions for updates

Color Contrast:
- Improved text contrast ratios
- Enhanced button states
- Added focus indicators
- Made selection states more visible

#### ADDITIONAL FEATURES

Fill Tool:
- Flood fill algorithm for filling connected regions
- Smart boundary detection
- Color-aware filling
- Optimized for large areas

Shape Recognition:
- Intelligent shape detection (rectangle, circle, triangle, line)
- Smoothing and optimization
- Auto-correction for hand-drawn shapes
- Uses perfect-freehand for better recognition

Text Alignment Options:
- Left, center, and right alignment
- Visual alignment controls
- Maintains spacing and indentation
- Works with multi-line text

Pattern Stamps:
- Pre-defined ASCII patterns
- Single/double borders
- Arrows and decorative elements
- Easy to extend with custom patterns