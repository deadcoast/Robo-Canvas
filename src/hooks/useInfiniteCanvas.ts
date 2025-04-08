import { useState, useCallback } from 'react';
import { Point } from '../types/canvas';

export const useInfiniteCanvas = () => {
  const [offset, setOffset] = useState<Point>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<Point | null>(null);

  const startPan = useCallback((point: Point) => {
    setIsDragging(true);
    setDragStart(point);
  }, []);

  const pan = useCallback((point: Point) => {
    if (!isDragging || !dragStart) {
      return;
    }

    const deltaX = point.x - dragStart.x;
    const deltaY = point.y - dragStart.y;

    setOffset(prev => ({
      x: prev.x + deltaX,
      y: prev.y + deltaY
    }));
    setDragStart(point);
  }, [isDragging, dragStart]);

  const stopPan = useCallback(() => {
    setIsDragging(false);
    setDragStart(null);
  }, []);

  const getRelativePoint = useCallback((point: Point): Point => ({
    x: point.x - offset.x,
    y: point.y - offset.y
  }), [offset]);

  const getAbsolutePoint = useCallback((point: Point): Point => ({
    x: point.x + offset.x,
    y: point.y + offset.y
  }), [offset]);

  return {
    offset,
    isDragging,
    startPan,
    pan,
    stopPan,
    getRelativePoint,
    getAbsolutePoint
  };
};