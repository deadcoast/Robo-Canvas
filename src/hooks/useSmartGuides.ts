import { useCallback, useState } from 'react';
import { Box, Line, Point } from '../types/canvas';

export interface Guide {
  type: 'horizontal' | 'vertical';
  position: number;
  start: number;
  end: number;
}

interface SnapResult {
  x: number;
  y: number;
  guides: Guide[];
}

export const useSmartGuides = (threshold: number = 5) => {
  const [guides, setGuides] = useState<Guide[]>([]);

  const findSnapPoints = useCallback((elements: { lines: Line[]; boxes: Box[] }) => {
    const snapPoints: Point[] = [];

    // Get points from lines
    elements.lines.forEach(line => {
      snapPoints.push(line.start, line.end);
    });

    // Get points from boxes
    elements.boxes.forEach(box => {
      const minX = Math.floor(Math.min(box.start.x, box.end.x));
      const maxX = Math.floor(Math.max(box.start.x, box.end.x));
      const minY = Math.floor(Math.min(box.start.y, box.end.y));
      const maxY = Math.floor(Math.max(box.start.y, box.end.y));

      const centerX = Math.floor((minX + maxX) / 2);
      const centerY = Math.floor((minY + maxY) / 2);

      snapPoints.push(
        { x: minX, y: minY },
        { x: maxX, y: minY },
        { x: maxX, y: maxY },
        { x: minX, y: maxY },
        { x: centerX, y: centerY }
      );
    });

    return snapPoints;
  }, []);

  const snapToGuides = useCallback((point: Point, snapPoints: Point[]): SnapResult => {
    const result: SnapResult = { x: point.x, y: point.y, guides: [] };

    // Find horizontal alignments
    snapPoints.forEach(snapPoint => {
      if (Math.abs(point.y - snapPoint.y) <= threshold) {
        result.y = snapPoint.y;
        result.guides.push({
          type: 'horizontal',
          position: snapPoint.y,
          start: Math.min(point.x, snapPoint.x),
          end: Math.max(point.x, snapPoint.x)
        });
      }
    });

    // Find vertical alignments
    snapPoints.forEach(snapPoint => {
      if (Math.abs(point.x - snapPoint.x) <= threshold) {
        result.x = snapPoint.x;
        result.guides.push({
          type: 'vertical',
          position: snapPoint.x,
          start: Math.min(point.y, snapPoint.y),
          end: Math.max(point.y, snapPoint.y)
        });
      }
    });

    setGuides(result.guides);
    return result;
  }, [threshold]);

  const clearGuides = useCallback(() => {
    setGuides([]);
  }, []);

  return {
    guides,
    findSnapPoints,
    snapToGuides,
    clearGuides
  };
};