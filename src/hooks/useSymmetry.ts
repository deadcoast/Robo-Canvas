import { useCallback } from 'react';
import { Box, Line, Point, TextElement } from '../types/canvas';

export type SymmetryMode = 'none' | 'horizontal' | 'vertical' | 'radial';

export const useSymmetry = (mode: SymmetryMode, center: Point) => {
  const reflectPoint = useCallback((point: Point): Point[] => {
    const points: Point[] = [point];

    switch (mode) {
      case 'horizontal':
        points.push({
          x: Math.floor(point.x),
          y: Math.floor(2 * center.y - point.y)
        });
        break;

      case 'vertical':
        points.push({
          x: Math.floor(2 * center.x - point.x),
          y: Math.floor(point.y)
        });
        break;

      case 'radial':
        points.push(
          {
            x: Math.floor(2 * center.x - point.x),
            y: Math.floor(point.y)
          },
          {
            x: Math.floor(point.x),
            y: Math.floor(2 * center.y - point.y)
          },
          {
            x: Math.floor(2 * center.x - point.x),
            y: Math.floor(2 * center.y - point.y)
          }
        );
        break;
    }

    return points;
  }, [mode, center]);

  const reflectLine = useCallback((line: Line): Line[] => {
    const lines: Line[] = [line];
    const startPoints = reflectPoint(line.start);
    const endPoints = reflectPoint(line.end);

    // Create reflected lines using corresponding start and end points
    for (let i = 1; i < startPoints.length; i++) {
      lines.push({
        ...line,
        start: startPoints[i],
        end: endPoints[i]
      });
    }

    return lines;
  }, [reflectPoint]);

  const reflectBox = useCallback((box: Box): Box[] => {
    const boxes: Box[] = [box];
    const startPoints = reflectPoint(box.start);
    const endPoints = reflectPoint(box.end);

    for (let i = 1; i < startPoints.length; i++) {
      boxes.push({
        ...box,
        start: startPoints[i],
        end: endPoints[i]
      });
    }

    return boxes;
  }, [reflectPoint]);

  const reflectText = useCallback((text: TextElement): TextElement[] => {
    const texts: TextElement[] = [text];
    const positions = reflectPoint(text.position);

    for (let i = 1; i < positions.length; i++) {
      texts.push({
        ...text,
        position: positions[i]
      });
    }

    return texts;
  }, [reflectPoint]);

  return {
    reflectPoint,
    reflectLine,
    reflectBox,
    reflectText
  };
};