import { Box, Point, Selection } from '../types/canvas';

interface SelectionBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const isPointInSelection = (point: Point, selection: Selection): boolean => {
  const minX = Math.min(selection.start.x, selection.end.x);
  const maxX = Math.max(selection.start.x, selection.end.x);
  const minY = Math.min(selection.start.y, selection.end.y);
  const maxY = Math.max(selection.start.y, selection.end.y);

  return (
    point.x >= minX &&
    point.x <= maxX &&
    point.y >= minY &&
    point.y <= maxY
  );
};

export const isBoxInSelection = (box: Box, selection: Selection): boolean => {
  return (
    isPointInSelection(box.start, selection) &&
    isPointInSelection(box.end, selection)
  );
};

export const getSelectionBounds = (
  selection: Selection,
  transform: { rotate: number; scaleX: number; scaleY: number }
): SelectionBounds => {
  const width = Math.abs(selection.end.x - selection.start.x);
  const height = Math.abs(selection.end.y - selection.start.y);
  const centerX = (selection.start.x + selection.end.x) / 2;
  const centerY = (selection.start.y + selection.end.y) / 2;

  // Apply rotation
  const angle = transform.rotate * Math.PI / 180;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);

  // Calculate corners after rotation
  const corners = [
    { x: -width/2, y: -height/2 },
    { x: width/2, y: -height/2 },
    { x: width/2, y: height/2 },
    { x: -width/2, y: height/2 }
  ].map(point => ({
    x: (point.x * cos - point.y * sin) * transform.scaleX + centerX,
    y: (point.x * sin + point.y * cos) * transform.scaleY + centerY
  }));

  // Get bounds
  const xs = corners.map(p => p.x);
  const ys = corners.map(p => p.y);
  
  return {
    x: Math.min(...xs),
    y: Math.min(...ys),
    width: Math.max(...xs) - Math.min(...xs),
    height: Math.max(...ys) - Math.min(...ys)
  };
};

export const drawTransformHandles = (
  ctx: CanvasRenderingContext2D,
  bounds: SelectionBounds,
  fontSize: number
) => {
  const handleSize = 8;
  const handles = [
    // Corners
    { x: bounds.x, y: bounds.y, cursor: 'nw-resize' },
    { x: bounds.x + bounds.width, y: bounds.y, cursor: 'ne-resize' },
    { x: bounds.x + bounds.width, y: bounds.y + bounds.height, cursor: 'se-resize' },
    { x: bounds.x, y: bounds.y + bounds.height, cursor: 'sw-resize' },
    // Edges
    { x: bounds.x + bounds.width/2, y: bounds.y, cursor: 'n-resize' },
    { x: bounds.x + bounds.width, y: bounds.y + bounds.height/2, cursor: 'e-resize' },
    { x: bounds.x + bounds.width/2, y: bounds.y + bounds.height, cursor: 's-resize' },
    { x: bounds.x, y: bounds.y + bounds.height/2, cursor: 'w-resize' },
    // Rotation handle
    { x: bounds.x + bounds.width/2, y: bounds.y - 20, cursor: 'grab', isRotation: true }
  ];

  handles.forEach(handle => {
    ctx.fillStyle = handle.isRotation ? '#3b82f6' : '#ffffff';
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    
    if (handle.isRotation) {
      ctx.beginPath();
      ctx.arc(handle.x * fontSize, handle.y * fontSize, handleSize/2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      
      // Draw rotation line
      ctx.beginPath();
      ctx.moveTo(handle.x * fontSize, handle.y * fontSize);
      ctx.lineTo(handle.x * fontSize, (bounds.y + handleSize/fontSize) * fontSize);
      ctx.stroke();
    } else {
      ctx.fillRect(
        handle.x * fontSize - handleSize/2,
        handle.y * fontSize - handleSize/2,
        handleSize,
        handleSize
      );
      ctx.strokeRect(
        handle.x * fontSize - handleSize/2,
        handle.y * fontSize - handleSize/2,
        handleSize,
        handleSize
      );
    }
  });
};