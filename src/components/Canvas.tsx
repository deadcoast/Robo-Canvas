import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useCanvasRenderer } from '../hooks/useCanvasRenderer';
import { useCollaboration } from '../hooks/useCollaboration';
import { useInfiniteCanvas } from '../hooks/useInfiniteCanvas';
import { Guide, useSmartGuides } from '../hooks/useSmartGuides';
import { useSymmetry } from '../hooks/useSymmetry';
import { useEditorStore } from '../store/editorStore';
import { BackgroundGradient, BackgroundPattern, Box, Selection as CanvasSelection, Layer, Line, Point, TextElement, TransformData } from '../types/canvas';
import { drawTransformHandles, getSelectionBounds, isBoxInSelection, isPointInSelection } from '../utils/selection';
import SpecialCharPalette from './SpecialCharPalette';


// Helper function for screen reader announcements
const announceToScreenReader = (message: string) => {
  const announcer = document.getElementById('a11y-announcer');
  if (announcer) {
    announcer.textContent = message;
  }
};

const Canvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { renderLayer, invalidateLayerCache, clearCache } = useCanvasRenderer();
  const {users, updateCursor, broadcastCanvasUpdate, userId} = useCollaboration();
  const { offset, isDragging: isPanning, startPan, pan, stopPan, getRelativePoint } = useInfiniteCanvas();
  const { findSnapPoints, snapToGuides, clearGuides } = useSmartGuides();
  const { 
    zoom,
    canvasWidth,
    canvasHeight,
    fontSize, 
    showGrid, 
    snapToGrid,
    currentTool,
    showCharCount,
    showDimensions,
    isDrawing,
    layers,
    selection,
    backgroundColor,
    backgroundType,
    backgroundGradient,
    backgroundPattern,
    selectionConstraint,
    selectionTransform: selectionTransformState,
    deleteAtPoint,
    startDrawing,
    stopDrawing,
    addLine,
    addBox,
    addText,
    handleFill,
    handleShapeRecognition,
    applyPattern,
    setSelection,
    moveSelection,
    copySelection,
    paste,
    undo,
    redo,
    fillBox,
    currentColor,
    lineStyle,
    patterns,
    setSelectionTransform,
    addSpecialCharacter,
    symmetryMode,
    symmetryCenter
  } = useEditorStore();
  const { reflectPoint, reflectLine, reflectBox, reflectText } = useSymmetry(symmetryMode, symmetryCenter);
  const [cursor, setCursor] = useState<Point>({ x: 0, y: 0 });
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [currentText, setCurrentText] = useState('');
  const [isDraggingSelection, setIsDraggingSelection] = useState(false);
  const [lastDragPosition, setLastDragPosition] = useState<Point | null>(null);
  const [previewLine, setPreviewLine] = useState<Line | null>(null);
  const [previewBox, setPreviewBox] = useState<Box | null>(null);
  const [previewSelection, setPreviewSelection] = useState<CanvasSelection | null>(null);
  const [drawPoints, setDrawPoints] = useState<Point[]>([]);
  const [isTransforming, setIsTransforming] = useState(false);
  
  const [isDraggingRotationHandle, setIsDraggingRotationHandle] = useState(false);
  const [isDraggingScaleHandle, setIsDraggingScaleHandle] = useState(false);
  const [activeScaleHandle, setActiveScaleHandle] = useState<string | null>(null);
  
  const [activeGuides, setActiveGuides] = useState<Guide[]>([]);
  
  // Explicitly type the selectionTransform state using TransformData
  const selectionTransform: Partial<TransformData> | null = selectionTransformState;
  
  const renderCanvas = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    // Set up canvas
    ctx.font = `${fontSize}px monospace`;
    ctx.textBaseline = 'top';
    
    // Draw background based on type
    switch (backgroundType) {
      case 'gradient': {
        const gradient = ctx.createLinearGradient(
          0, 0,
          Math.cos((backgroundGradient?.angle ?? 0) * Math.PI / 180) * canvas.width,
          Math.sin(((backgroundGradient as BackgroundGradient)?.angle ?? 0) * Math.PI / 180) * canvas.height
        );
        gradient.addColorStop(0, (backgroundGradient as BackgroundGradient)?.startColor ?? '#ffffff');
        gradient.addColorStop(1, (backgroundGradient as BackgroundGradient)?.endColor ?? '#f0f0f0');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        break;
      }
      case 'pattern': {
        ctx.fillStyle = (backgroundPattern as BackgroundPattern)?.primaryColor ?? '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = (backgroundPattern as BackgroundPattern)?.secondaryColor ?? '#e5e7eb';
        const scale = ((backgroundPattern as BackgroundPattern)?.scale ?? 1) * fontSize;
        
        switch ((backgroundPattern as BackgroundPattern)?.type) {
          case 'dots':
            for (let x = scale; x < canvas.width; x += scale * 2) {
              for (let y = scale; y < canvas.height; y += scale * 2) {
                ctx.beginPath();
                ctx.arc(x, y, scale / 4, 0, Math.PI * 2);
                ctx.fill();
              }
            }
            break;
          
          case 'lines':
            ctx.strokeStyle = (backgroundPattern as BackgroundPattern)?.secondaryColor ?? '#e5e7eb';
            ctx.lineWidth = 1;
            for (let y = scale; y < canvas.height; y += scale * 2) {
              ctx.beginPath();
              ctx.moveTo(0, y);
              ctx.lineTo(canvas.width, y);
              ctx.stroke();
            }
            break;
            
          case 'grid':
            ctx.strokeStyle = (backgroundPattern as BackgroundPattern)?.secondaryColor ?? '#e5e7eb';
            ctx.lineWidth = 1;
            ctx.beginPath();
            for (let x = scale; x < canvas.width; x += scale) {
              ctx.moveTo(x, 0);
              ctx.lineTo(x, canvas.height);
            }
            for (let y = scale; y < canvas.height; y += scale) {
              ctx.moveTo(0, y);
              ctx.lineTo(canvas.width, y);
            }
            ctx.stroke();
            break;
        }
        break;
      }
      default:
        ctx.fillStyle = backgroundColor || '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Draw grid if enabled
    if (showGrid) {
      ctx.strokeStyle = '#e5e7eb';
      ctx.beginPath();
      for (let x = 0; x < canvas.width; x += fontSize) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
      }
      for (let y = 0; y < canvas.height; y += fontSize) {
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
      }
      ctx.stroke();
    }
    
    // Render layers using worker and caching
    layers.forEach(layer => {
      if (layer.visible) {
        renderLayer(ctx, layer, fontSize);
      }
    });
    
    // Draw current text being typed
    if (isTyping && currentText) {
      ctx.fillStyle = currentColor;
      ctx.fillText(currentText, cursor.x * fontSize, cursor.y * fontSize);
    }

    // Draw shape recognition preview
    if (currentTool === 'shape' && drawPoints.length > 1) {
      ctx.strokeStyle = currentColor || '#3b82f6';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(drawPoints[0].x * fontSize, drawPoints[0].y * fontSize);
      
      for (let i = 1; i < drawPoints.length; i++) {
        ctx.lineTo(drawPoints[i].x * fontSize, drawPoints[i].y * fontSize);
      }
      
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Draw line preview if drawing a line
    if (isDrawing && currentTool === 'line' && startPoint && previewLine) {
      ctx.strokeStyle = currentColor || '#3b82f6';
      ctx.lineWidth = 2;
      
      // Apply line style to preview
      if (lineStyle === 'dashed') {
        ctx.setLineDash([5, 5]);
      } else if (lineStyle === 'dotted') {
        ctx.setLineDash([2, 2]);
      } else {
        ctx.setLineDash([]);
      }
      
      ctx.beginPath();
      ctx.moveTo(previewLine.start.x * fontSize, previewLine.start.y * fontSize);
      ctx.lineTo(previewLine.end.x * fontSize, previewLine.end.y * fontSize);
      ctx.stroke();
      ctx.setLineDash([]); // Reset dash pattern
    }

    // Draw box preview if drawing a box
    if (isDrawing && currentTool === 'box' && startPoint && previewBox) {
      ctx.strokeStyle = currentColor || '#3b82f6';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]); // Dashed line for preview
      
      const x = Math.min(previewBox.start.x, previewBox.end.x) * fontSize;
      const y = Math.min(previewBox.start.y, previewBox.end.y) * fontSize;
      const width = Math.abs(previewBox.end.x - previewBox.start.x) * fontSize;
      const height = Math.abs(previewBox.end.y - previewBox.start.y) * fontSize;
      
      if (fillBox) {
        ctx.fillStyle = `${currentColor}33` || 'rgba(59, 130, 246, 0.2)'; // Light transparency
        ctx.fillRect(x, y, width, height);
      }
      
      ctx.strokeRect(x, y, width, height);
      ctx.setLineDash([]); // Reset dash pattern
    }

    // Draw selection preview if it exists
    if (previewSelection && currentTool === 'select' && !isDraggingSelection) {
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      
      let x, y, width, height;
      
      // Apply selection constraint if needed
      if (selectionConstraint === 'square') {
        const dx = previewSelection.end.x - previewSelection.start.x;
        const dy = previewSelection.end.y - previewSelection.start.y;
        const size = Math.max(Math.abs(dx), Math.abs(dy));
        
        width = Math.sign(dx) * size;
        height = Math.sign(dy) * size;
        
        x = Math.min(previewSelection.start.x, previewSelection.start.x + width) * fontSize;
        y = Math.min(previewSelection.start.y, previewSelection.start.y + height) * fontSize;
        width = Math.abs(width) * fontSize;
        height = Math.abs(height) * fontSize;
      } else {
        x = Math.min(previewSelection.start.x, previewSelection.end.x) * fontSize;
        y = Math.min(previewSelection.start.y, previewSelection.end.y) * fontSize;
        width = Math.abs(previewSelection.end.x - previewSelection.start.x) * fontSize;
        height = Math.abs(previewSelection.end.y - previewSelection.start.y) * fontSize;
      }
      
      // Add a semi-transparent fill
      ctx.fillStyle = 'rgba(59, 130, 246, 0.1)'; 
      ctx.fillRect(x, y, width, height);
      
      ctx.strokeRect(x, y, width, height);
      ctx.setLineDash([]);
    }
    
    // Draw other users' cursors
    if (users && users.length > 0) {
      users.forEach(user => {
        if (user.cursor && user.id !== userId) {
          ctx.fillStyle = user.color || '#ff0000';
          ctx.beginPath();
          ctx.moveTo(user.cursor.x * fontSize, user.cursor.y * fontSize);
          ctx.lineTo(user.cursor.x * fontSize + 8, user.cursor.y * fontSize + 8);
          ctx.lineTo(user.cursor.x * fontSize + 4, user.cursor.y * fontSize + 12);
          ctx.closePath();
          ctx.fill();
          
          ctx.font = '12px sans-serif';
          ctx.fillText(user.name || 'User', user.cursor.x * fontSize + 12, user.cursor.y * fontSize + 16);
        }
      });
    }

    // Draw actual selection box if exists
    if (selection) {
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      
      // Apply selection transform
      ctx.save();
      const centerX = (selection.start.x + selection.end.x) * fontSize / 2;
      const centerY = (selection.start.y + selection.end.y) * fontSize / 2;
      
      ctx.translate(centerX, centerY);
      ctx.rotate((selectionTransform?.rotate ?? 0) * Math.PI / 180);
      ctx.scale(selectionTransform?.scaleX ?? 1, selectionTransform?.scaleY ?? 1);
      ctx.translate(-centerX, -centerY);
      
      // Draw selection bounds
      const currentTransformForBounds: TransformData = selectionTransform ? 
        { rotate: selectionTransform.rotate ?? 0, scaleX: selectionTransform.scaleX ?? 1, scaleY: selectionTransform.scaleY ?? 1 } : 
        { rotate: 0, scaleX: 1, scaleY: 1 };
      const bounds = getSelectionBounds(selection, currentTransformForBounds);
      ctx.strokeRect(
        bounds.x * fontSize,
        bounds.y * fontSize,
        bounds.width * fontSize,
        bounds.height * fontSize
      );
      
      // Draw transform handles
      drawTransformHandles(ctx, bounds, fontSize);
      
      ctx.restore();
      ctx.setLineDash([]);
    }

    // Draw smart guides
    if (activeGuides.length > 0) {
      ctx.strokeStyle = '#FF00FF'; // Magenta for guides
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);

      activeGuides.forEach(guide => {
        ctx.beginPath();
        if (guide.type === 'horizontal') {
          ctx.moveTo(guide.start * fontSize, guide.position * fontSize);
          ctx.lineTo(guide.end * fontSize, guide.position * fontSize);
        } else { // vertical
          ctx.moveTo(guide.position * fontSize, guide.start * fontSize);
          ctx.lineTo(guide.position * fontSize, guide.end * fontSize);
        }
        ctx.stroke();
      });

      ctx.setLineDash([]); // Reset dash pattern
    }
  }, [
    fontSize, showGrid, layers, isTyping, currentText, cursor, selection, 
    zoom, isDrawing, startPoint, previewLine, previewBox, previewSelection, 
    fillBox, currentTool, isDraggingSelection, currentColor, lineStyle,
    backgroundType, backgroundColor, backgroundGradient, backgroundPattern,
    users, renderLayer, drawPoints, selectionConstraint, selectionTransform, userId,
    offset, isPanning, activeGuides
  ]);

  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  // Invalidate cache when layer content changes
  useEffect(() => {
    layers.forEach(layer => {
      invalidateLayerCache(layer.id);
    });
    renderCanvas();
  }, [layers, invalidateLayerCache, renderCanvas]);

  // Clear cache when canvas size changes
  useEffect(() => {
    clearCache();
    renderCanvas();
  }, [canvasWidth, canvasHeight, clearCache, renderCanvas]);

  // Update rendering when offset changes due to panning
  useEffect(() => {
    renderCanvas();
  }, [offset, renderCanvas]);

  const handleMouseMove = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    // Handle panning
    if (isPanning) {
      pan({ x: e.clientX, y: e.clientY });
      return; // Stop other mouse move logic when panning
    }

    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / fontSize);
    const y = Math.floor((e.clientY - rect.top) / fontSize);
    setCursor({ x, y });
    
    // Share cursor position with collaborators
    if (updateCursor) {
      updateCursor(x, y);
    }

    // Handle transform operations based on specific dragging state
    if (selection && (isDraggingRotationHandle || isDraggingScaleHandle)) {
      const centerX = (selection.start.x + selection.end.x) / 2;
      const centerY = (selection.start.y + selection.end.y) / 2;
      
      // Handle rotation
      if (isDraggingRotationHandle) {
        const dx = x - centerX;
        const dy = y - centerY;
        const currentAngle = Math.atan2(dy, dx) * 180 / Math.PI;
        const currentTransform = useEditorStore.getState().selectionTransform;
        setSelectionTransform({ 
          rotate: currentAngle + 90, 
          scaleX: currentTransform?.scaleX ?? 1, 
          scaleY: currentTransform?.scaleY ?? 1
        });
        return;
      }
      
      // Handle scaling
      if (isDraggingScaleHandle && activeScaleHandle) {
        const originalWidth = Math.abs(selection.end.x - selection.start.x);
        const originalHeight = Math.abs(selection.end.y - selection.start.y);
        if (originalWidth === 0 || originalHeight === 0) {
          return;
        }

        const distX = x - centerX;
        const distY = y - centerY;

        const currentTransformForScale = useEditorStore.getState().selectionTransform;

        const calculateScaleX = () => {
          if (activeScaleHandle.includes('e')) {
            return Math.max(0.1, distX / (originalWidth / 2));
          }
          if (activeScaleHandle.includes('w')) {
            return Math.max(0.1, -distX / (originalWidth / 2));
          }
          return currentTransformForScale?.scaleX ?? 1;
        };

        const calculateScaleY = () => {
          if (activeScaleHandle.includes('s')) {
            return Math.max(0.1, distY / (originalHeight / 2));
          }
          if (activeScaleHandle.includes('n')) {
            return Math.max(0.1, -distY / (originalHeight / 2));
          }
          return currentTransformForScale?.scaleY ?? 1;
        };

        let newScaleX = calculateScaleX();
        let newScaleY = calculateScaleY();

        // TODO: Implement aspect ratio lock if Shift key is held (requires access to event object here)
        // if (e.shiftKey && handle.length === 2) { ... }

        setSelectionTransform({ 
          rotate: currentTransformForScale?.rotate ?? 0, 
          scaleX: newScaleX, 
          scaleY: newScaleY 
        });
        return;
      }
      
      return;
    }

    // Handle selection dragging with smart guides
    if (isDraggingSelection && lastDragPosition && selection) {
      const currentPoint = { x, y };
      const deltaX = currentPoint.x - lastDragPosition.x;
      const deltaY = currentPoint.y - lastDragPosition.y;

      // Calculate potential new selection bounds
      const newSelection = {
        start: { x: selection.start.x + deltaX, y: selection.start.y + deltaY },
        end: { x: selection.end.x + deltaX, y: selection.end.y + deltaY }
      };

      // Get snap points from all layers (excluding selection itself for snapping)
      const allElements = layers.reduce((acc, layer) => {
          if (!layer.visible) {
            return acc;
          }
          // Filter out elements within the current selection to avoid self-snapping
          const layerLines = layer.elements.lines.filter(line => 
              !isPointInSelection(line.start, selection) || !isPointInSelection(line.end, selection)
          );
          const layerBoxes = layer.elements.boxes.filter(box => 
              !isBoxInSelection(box, selection)
          );
          return {
              lines: [...acc.lines, ...layerLines],
              boxes: [...acc.boxes, ...layerBoxes]
          };
      }, { lines: [] as Line[], boxes: [] as Box[] });
      const snapPoints = findSnapPoints(allElements);

      // Check snapping for corners and center of the moving selection
      const selectionPointsToCheck = [
          newSelection.start,
          { x: newSelection.end.x, y: newSelection.start.y },
          newSelection.end,
          { x: newSelection.start.x, y: newSelection.end.y },
          { x: (newSelection.start.x + newSelection.end.x) / 2, y: (newSelection.start.y + newSelection.end.y) / 2 }
      ];
      
      let snappedDeltaX = deltaX;
      let snappedDeltaY = deltaY;
      let guidesToShow: Guide[] = [];

      for (const checkPoint of selectionPointsToCheck) {
          const snapResult = snapToGuides(checkPoint, snapPoints);
          if (snapResult.guides.length > 0) {
              guidesToShow = [...guidesToShow, ...snapResult.guides];
              // Adjust delta based on the first snap found (can be refined)
              if (snapResult.x !== checkPoint.x) {
                 snappedDeltaX += (snapResult.x - checkPoint.x);
              }
              if (snapResult.y !== checkPoint.y) {
                 snappedDeltaY += (snapResult.y - checkPoint.y);
              }
              // Maybe break after first snap or collect all and average?
              // For now, use the cumulative snap adjustments
          }
      }
      setActiveGuides(guidesToShow);
      
      // Only update if there's actual movement (after potential snapping)
      if (snappedDeltaX !== 0 || snappedDeltaY !== 0) {
        moveSelection(snappedDeltaX, snappedDeltaY);
        // Update last position for next movement calculation (use original point)
        setLastDragPosition(currentPoint);
        
        // Broadcast the selection movement to collaborators
        if (broadcastCanvasUpdate) {
          broadcastCanvasUpdate('move', { selection, deltaX: snappedDeltaX, deltaY: snappedDeltaY });
        }
      }
      return; // Skip other updates when dragging
    }
    
    // Add point for shape recognition
    if (isDrawing && currentTool === 'shape') {
      const lastPoint = drawPoints[drawPoints.length - 1];
      // Only add points if they're different from the last one
      if (!lastPoint || lastPoint.x !== x || lastPoint.y !== y) {
        setDrawPoints(points => [...points, { x, y }]);
      }
      return;
    }

    // Update line preview when drawing with smart guides
    if (isDrawing && currentTool === 'line' && startPoint) {
      let endPoint = { x, y };
      
      // Get snap points
      const allElements = layers.reduce((acc, layer) => {
        if (!layer.visible) {
          return acc;
        }
        return {
          lines: [...acc.lines, ...layer.elements.lines],
          boxes: [...acc.boxes, ...layer.elements.boxes]
        };
      }, { lines: [] as Line[], boxes: [] as Box[] });
      const snapPoints = findSnapPoints(allElements);
      
      // Snap end point
      const snapResult = snapToGuides(endPoint, snapPoints);
      endPoint = { x: snapResult.x, y: snapResult.y };
      setActiveGuides(snapResult.guides);
      
      // Apply snap to grid if enabled (overrides smart guides for orthogonal lines)
      if (snapToGrid) {
        // Orthogonal snapping takes priority if enabled
        endPoint = {
          x: Math.abs(endPoint.x - startPoint.x) > Math.abs(endPoint.y - startPoint.y)
            ? endPoint.x
            : startPoint.x,
          y: Math.abs(endPoint.x - startPoint.x) > Math.abs(endPoint.y - startPoint.y)
            ? startPoint.y
            : endPoint.y
        };
        // Clear smart guides if grid snapping is active for this segment
        if (endPoint.x === startPoint.x || endPoint.y === startPoint.y) {
            setActiveGuides([]);
        }
      }
      
      setPreviewLine({
        start: startPoint,
        end: endPoint,
        color: currentColor,
        style: lineStyle
      });
    }
    
    // Update box preview when drawing with smart guides
    if (isDrawing && currentTool === 'box' && startPoint) {
        let endPoint = { x, y };

        // Get snap points
        const allElements = layers.reduce((acc, layer) => {
          if (!layer.visible) {
            return acc;
          }
          return {
            lines: [...acc.lines, ...layer.elements.lines],
            boxes: [...acc.boxes, ...layer.elements.boxes]
          };
        }, { lines: [] as Line[], boxes: [] as Box[] });
        const snapPoints = findSnapPoints(allElements);
        
        // Snap end point
        const snapResult = snapToGuides(endPoint, snapPoints);
        endPoint = { x: snapResult.x, y: snapResult.y };
        setActiveGuides(snapResult.guides);

      setPreviewBox({
        start: startPoint,
        end: endPoint,
        filled: fillBox,
        color: currentColor,
        fillColor: fillBox ? currentColor : undefined
      });
    }
    
    // Update selection preview when selecting
    if (currentTool === 'select' && startPoint && !isDraggingSelection) {
      setPreviewSelection({
        start: startPoint,
        end: { x, y }
      });
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    // Handle panning start (Middle mouse or Alt + Left click)
    if (e.button === 1 || (e.altKey && e.button === 0)) {
      startPan({ x: e.clientX, y: e.clientY });
      e.preventDefault(); // Prevent default middle-click scroll or other actions
      return;
    }
    
    // Calculate point relative to canvas element, considering zoom and pan
    const rect = canvasRef.current!.getBoundingClientRect();
    const scale = useEditorStore.getState().zoom; // Use current zoom from store
    const point = getRelativePoint({
        x: Math.floor(((e.clientX - rect.left) / scale - offset.x) / fontSize),
        y: Math.floor(((e.clientY - rect.top) / scale - offset.y) / fontSize)
    });

    // Announce the action for screen readers
    const actionMessage = `${currentTool} tool activated at position ${point.x}, ${point.y}`;
    announceToScreenReader(actionMessage);

    // Handle special character placement
    if (currentTool === 'specialChar') {
      addSpecialCharacter(point);
      // Announce placement
      announceToScreenReader(`Placed special character at ${point.x}, ${point.y}`); 
      // Apply symmetry
      if (symmetryMode !== 'none') {
        const reflectedPoints = reflectPoint(point);
        reflectedPoints?.forEach(rp => {
          if (rp) {
            addSpecialCharacter(rp);
          }
        });
      }
      return;
    }

    // Check if clicking on a transform handle
    if (selection && !isTyping) {
      const currentTransformForBounds: TransformData = selectionTransform ? 
        { rotate: selectionTransform.rotate ?? 0, scaleX: selectionTransform.scaleX ?? 1, scaleY: selectionTransform.scaleY ?? 1 } : 
        { rotate: 0, scaleX: 1, scaleY: 1 };
      const bounds = getSelectionBounds(selection, currentTransformForBounds);
      const handleSize = 8 / fontSize;
      
      const centerX = bounds.x + bounds.width / 2;
      const centerY = bounds.y + bounds.height / 2;
      const rotateHandleYOffset = 20 / fontSize;
      const rotateX = centerX;
      const rotateY = bounds.y - rotateHandleYOffset;
      
      if (Math.sqrt(Math.pow(point.x - rotateX, 2) + Math.pow(point.y - rotateY, 2)) <= handleSize) {
        setIsTransforming(true);
        setIsDraggingRotationHandle(true);
        setIsDraggingScaleHandle(false);
        setActiveScaleHandle(null);
        announceToScreenReader('Rotation handle selected');
        return;
      }
      
      const handles = [
        { x: bounds.x, y: bounds.y, handle: 'resize-nw' },
        { x: bounds.x + bounds.width, y: bounds.y, handle: 'resize-ne' },
        { x: bounds.x + bounds.width, y: bounds.y + bounds.height, handle: 'resize-se' },
        { x: bounds.x, y: bounds.y + bounds.height, handle: 'resize-sw' },
        { x: centerX, y: bounds.y, handle: 'resize-n' },
        { x: bounds.x + bounds.width, y: centerY, handle: 'resize-e' },
        { x: centerX, y: bounds.y + bounds.height, handle: 'resize-s' },
        { x: bounds.x, y: centerY, handle: 'resize-w' }
      ];
      
      for (const handle of handles) {
        if (Math.sqrt(Math.pow(point.x - handle.x, 2) + Math.pow(point.y - handle.y, 2)) <= handleSize) {
          setIsTransforming(true);
          setIsDraggingScaleHandle(true);
          setIsDraggingRotationHandle(false);
          setActiveScaleHandle(handle.handle.replace('resize-', ''));
          announceToScreenReader(`Resize handle ${handle.handle} selected`);
          return;
        }
      }
    }

    if (currentTool === 'eraser') {
      deleteAtPoint(point);
      return;
    }

    if (currentTool === 'fill') {
      handleFill(point);
      return;
    }

    if (currentTool === 'text') {
      setIsTyping(true);
      setCurrentText('');
      setCursor(point);
      return;
    }
    
    if (currentTool === 'pattern') {
      if (patterns && patterns.length > 0) {
        applyPattern(patterns[0], point);
      }
      return;
    }
    
    if (currentTool === 'shape') {
      setDrawPoints([point]);
      startDrawing(point);
      return;
    }
    
    if (currentTool === 'select') {
      if (selection) {
        const isInside = isPointInSelection(point, selection);
        
        if (isInside) {
          setIsDraggingSelection(true);
          setLastDragPosition(point);
          return;
        }
      }
      
      setStartPoint(point);
      setSelection(null);
      setPreviewSelection({
        start: point,
        end: point
      });
      return;
    }
    
    if (currentTool !== 'line' && currentTool !== 'box') {
      return;
    }
    
    setStartPoint(point);
    startDrawing(point);
    
    // Initialize preview line
    if (currentTool === 'line') {
      setPreviewLine({
        start: point,
        end: point,
        color: currentColor,
        style: lineStyle
      });
    }
    
    // Initialize preview box
    if (currentTool === 'box') {
      setPreviewBox({
        start: point,
        end: point,
        filled: fillBox,
        color: currentColor,
        fillColor: fillBox ? currentColor : undefined
      });
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    // Handle panning end
    if (isPanning) {
      stopPan();
      return;
    }
    
    // Calculate point relative to canvas element, considering zoom and pan
    const rect = canvasRef.current!.getBoundingClientRect();
    const scale = useEditorStore.getState().zoom;
    const endPoint = getRelativePoint({
        x: Math.floor(((e.clientX - rect.left) / scale - offset.x) / fontSize),
        y: Math.floor(((e.clientY - rect.top) / scale - offset.y) / fontSize)
    });
    
    // End transform operations
    if (isTransforming) {
      setIsTransforming(false);
      setIsDraggingRotationHandle(false);
      setIsDraggingScaleHandle(false);
      setActiveScaleHandle(null);
      return;
    }

    // Handle the end of a selection drag operation
    if (isDraggingSelection) {
      setIsDraggingSelection(false);
      setLastDragPosition(null);
      clearGuides(); // Clear guides on drag end
      setActiveGuides([]);
      return;
    }
    
    // Handle shape recognition
    if (currentTool === 'shape' && drawPoints.length > 2) {
      handleShapeRecognition(drawPoints);
      setDrawPoints([]);
      stopDrawing();
      return;
    }

    // Handle line drawing completion
    if (currentTool === 'line' && startPoint && previewLine) {
      const originalLine: Line = { ...previewLine }; // Create a copy

      addLine(originalLine.start, originalLine.end, lineStyle, currentColor);
      announceToScreenReader(`Line drawn from ${originalLine.start.x},${originalLine.start.y} to ${originalLine.end.x},${originalLine.end.y}`);
      // Broadcast the line creation to collaborators
      if (broadcastCanvasUpdate) {
        broadcastCanvasUpdate('line', { 
          start: originalLine.start, 
          end: originalLine.end, 
          style: lineStyle,
          color: currentColor
        });
      }

      // Apply symmetry
      if (symmetryMode !== 'none') {
        const reflectedLines = reflectLine(originalLine);
        reflectedLines?.forEach(reflectedLine => {
          if (!reflectedLine) {
            return;
          }
          addLine(reflectedLine.start, reflectedLine.end, reflectedLine.style, reflectedLine.color);
          announceToScreenReader(`Symmetric line drawn`); // Generic message for symmetry
          // Optionally broadcast reflected line
          if (broadcastCanvasUpdate) {
            broadcastCanvasUpdate('line', { 
              start: reflectedLine.start, 
              end: reflectedLine.end, 
              style: reflectedLine.style,
              color: reflectedLine.color
            });
          }
        });
      }

      setPreviewLine(null);
    }

    // Handle box drawing completion
    if (currentTool === 'box' && startPoint && previewBox) {
      const originalBox: Box = { ...previewBox }; // Create a copy

      addBox(originalBox.start, originalBox.end, currentColor, fillBox ? currentColor : undefined);
      announceToScreenReader(`Box drawn from ${originalBox.start.x},${originalBox.start.y} to ${originalBox.end.x},${originalBox.end.y}`);
      // Broadcast the box creation to collaborators
      if (broadcastCanvasUpdate) {
        broadcastCanvasUpdate('box', {
          start: originalBox.start,
          end: originalBox.end,
          filled: fillBox,
          color: currentColor,
          fillColor: fillBox ? currentColor : undefined
        });
      }

      // Apply symmetry
      if (symmetryMode !== 'none') {
        const reflectedBoxes = reflectBox(originalBox);
        reflectedBoxes?.forEach(reflectedBox => {
          if (!reflectedBox) {
            return;
          }
          addBox(reflectedBox.start, reflectedBox.end, reflectedBox.color, reflectedBox.fillColor);
          announceToScreenReader(`Symmetric box drawn`);
          // Optionally broadcast reflected box
          if (broadcastCanvasUpdate) {
            broadcastCanvasUpdate('box', {
              start: reflectedBox.start,
              end: reflectedBox.end,
              filled: !!reflectedBox.fillColor,
              color: reflectedBox.color,
              fillColor: reflectedBox.fillColor
            });
          }
        });
      }

      setPreviewBox(null);
    }

    // Handle selection completion
    if (currentTool === 'select' && startPoint) {
      // Ensure selection has some area
      if (startPoint.x !== endPoint.x || startPoint.y !== endPoint.y) {
        const finalSelection: CanvasSelection = {
          start: {
            x: Math.min(startPoint.x, endPoint.x),
            y: Math.min(startPoint.y, endPoint.y)
          },
          end: {
            x: Math.max(startPoint.x, endPoint.x),
            y: Math.max(startPoint.y, endPoint.y)
          }
        };
        setSelection(finalSelection);
        announceToScreenReader(`Selected area from ${finalSelection.start.x},${finalSelection.start.y} to ${finalSelection.end.x},${finalSelection.end.y}`);
        // Broadcast the selection creation to collaborators
        if (broadcastCanvasUpdate) {
          broadcastCanvasUpdate('select', { selection: finalSelection });
        }
      } else {
        // If it's just a click, clear selection
        setSelection(null);
      }
      setPreviewSelection(null);
    }
    
    setStartPoint(null);
    stopDrawing();
    clearGuides(); // Clear guides on mouse up
    setActiveGuides([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsTyping(false);
      setCurrentText('');
      setSelection(null);
      setPreviewLine(null);
      setPreviewBox(null);
      setPreviewSelection(null);
      setDrawPoints([]);
      return;
    }

    // Handle copy/paste
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'c') {
        copySelection();
        announceToScreenReader('Selection copied to clipboard');
        e.preventDefault();
      } else if (e.key === 'v') {
        paste(cursor);
        announceToScreenReader('Content pasted from clipboard');
        e.preventDefault();
      } else if (e.key === 'z') {
        if (e.shiftKey) {
          redo();
          announceToScreenReader('Action redone');
        } else {
          undo();
          announceToScreenReader('Action undone');
        }
        e.preventDefault();
      } else if (e.key === 'y') {
        redo();
        announceToScreenReader('Action redone');
        e.preventDefault();
      }
    }

    if (!isTyping || currentTool !== 'text') {
      return;
    }

    if (e.key === 'Enter') {
      if (currentText.trim()) {
        const originalText: TextElement = {
          position: { ...cursor },
          content: currentText,
          color: currentColor,
          fontSize: fontSize
        };

        addText(originalText.position, originalText.content, originalText.color);
        
        // Broadcast the text creation to collaborators
        if (broadcastCanvasUpdate) {
          broadcastCanvasUpdate('text', { 
            position: originalText.position, 
            content: originalText.content,
            color: originalText.color
          });
        }

        // Apply symmetry
        if (symmetryMode !== 'none') {
          const reflectedTexts = reflectText(originalText);
          reflectedTexts?.forEach(reflectedText => {
            if (!reflectedText) {
              return;
            }
            addText(reflectedText.position, reflectedText.content, reflectedText.color);
            announceToScreenReader(`Symmetric text added`);
            // Optionally broadcast reflected text
            if (broadcastCanvasUpdate) {
              broadcastCanvasUpdate('text', { 
                position: reflectedText.position, 
                content: reflectedText.content,
                color: reflectedText.color
              });
            }
          });
        }

        setIsTyping(false);
        setCurrentText('');
      } else {
        // If Enter is pressed with no text, just exit typing mode
        setIsTyping(false);
        setCurrentText('');
      }
    } else if (e.key === 'Backspace') {
      setCurrentText(prev => prev.slice(0, -1));
    } else if (e.key.length === 1) {
      setCurrentText(prev => prev + e.key);
    }
  };

  return (
    <div 
      className="relative flex-1 bg-white shadow-lg rounded-lg overflow-hidden cursor-grab active:cursor-grabbing"
      style={{ 
        transform: `scale(${zoom}) translate(${offset.x}px, ${offset.y}px)`,
        transformOrigin: '0 0',
        cursor: isPanning ? 'grabbing' : (isTransforming ? 'grabbing' : (isDraggingSelection ? 'move' : (currentTool === 'select' ? 'crosshair' : (currentTool === 'text' ? 'text' : 'default'))))
      }}
    >
      <canvas
        ref={canvasRef}
        role="application"
        aria-label="ASCII Art Canvas"
        style={{ 
          transform: `scale(${zoom}) translate(${offset.x}px, ${offset.y}px)`,
          transformOrigin: '0 0' 
        }}
        width={canvasWidth}
        height={canvasHeight}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        onContextMenu={(e) => e.preventDefault()}
        onMouseLeave={() => {
          setIsDraggingSelection(false);
          setLastDragPosition(null);
          clearGuides(); // Clear guides on mouse leave
          setActiveGuides([]);
        }}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        aria-live="polite"
        onFocus={() => {
          // Announce current tool and position when canvas receives focus
          const message = `${currentTool} tool selected. Position: ${cursor.x}, ${cursor.y}`;
          announceToScreenReader(message);
        }}
      />
      <SpecialCharPalette />
      
      <div 
        className="absolute bottom-2 right-2 text-sm text-gray-700 bg-white bg-opacity-75 px-2 py-1 rounded"
        role="status"
        aria-live="polite"
      >
        {cursor.x}, {cursor.y} | {currentTool} | {Math.round(zoom * 100)}%
        {showCharCount && (
          <span className="ml-2" role="status">
            Characters: {layers.reduce((acc, layer: Layer) => {
              const textLength = layer.elements?.textElements?.reduce((sum, el: TextElement) => sum + el.content.length, 0) ?? 0;
              return acc + textLength;
            }, 0)}
          </span>
        )}
        {showDimensions && (
          <span className="ml-2" role="status">
            {Math.floor(canvasWidth / fontSize)}x{Math.floor(canvasHeight / fontSize)}
          </span>
        )}
      </div>
      {/* Announcer element for screen readers */}
      <div className="sr-only" role="status" aria-live="assertive" id="a11y-announcer"></div>
    </div>
  );
};

export default Canvas;