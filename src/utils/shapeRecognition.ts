import { getStroke } from 'perfect-freehand';
import { Point } from '../types/canvas';

interface RecognizedShape {
  type: 'rectangle' | 'circle' | 'triangle' | 'line';
  points: Point[];
}

export const recognizeShape = (points: Point[]): RecognizedShape | null => {
  if (points.length < 3) {
    return null;
  }

  // Get the bounding box
  const minX = Math.min(...points.map(p => p.x));
  const maxX = Math.max(...points.map(p => p.x));
  const minY = Math.min(...points.map(p => p.y));
  const maxY = Math.max(...points.map(p => p.y));
  
  const width = maxX - minX;
  const height = maxY - minY;
  const aspectRatio = width / height;

  // Calculate shape metrics
  const area = width * height;
  const perimeter = 2 * (width + height);
  const compactness = (4 * Math.PI * area) / (perimeter * perimeter);

  // Analyze the stroke using perfect-freehand
  const stroke = getStroke(points.map(p => [p.x, p.y]), {
    size: 1,
    thinning: 0.5,
    smoothing: 0.5,
    streamline: 0.5,
  });

  // Log the generated stroke for debugging/analysis
  console.log('Generated stroke points:', stroke);

  // Determine shape type based on metrics and stroke analysis
  if (compactness > 0.85) {
    // Likely a circle
    return {
      type: 'circle',
      points: generateCirclePoints(
        { x: minX + width / 2, y: minY + height / 2 },
        Math.min(width, height) / 2
      )
    };
  } else if (compactness > 0.65 && Math.abs(aspectRatio - 1) < 0.2) {
    // Likely a rectangle
    return {
      type: 'rectangle',
      points: [
        { x: minX, y: minY },
        { x: maxX, y: minY },
        { x: maxX, y: maxY },
        { x: minX, y: maxY }
      ]
    };
  } else if (points.length >= 3 && isTriangle(points)) {
    // Likely a triangle
    return {
      type: 'triangle',
      points: simplifyPoints(points, 3)
    };
  } else if (width > height * 3 || height > width * 3) {
    // Likely a line
    return {
      type: 'line',
      points: [points[0], points[points.length - 1]]
    };
  }

  return null;
};

// Helper functions
const generateCirclePoints = (center: Point, radius: number): Point[] => {
  const points: Point[] = [];
  const segments = Math.ceil(radius * 4);
  
  for (let i = 0; i < segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    points.push({
      x: Math.round(center.x + Math.cos(angle) * radius),
      y: Math.round(center.y + Math.sin(angle) * radius)
    });
  }
  
  return points;
};

const isTriangle = (points: Point[]): boolean => {
  const simplified = simplifyPoints(points, 3);
  if (simplified.length !== 3) {
    return false;
  }

  // Check if points form a triangle by calculating area
  const area = Math.abs(
    (simplified[0].x * (simplified[1].y - simplified[2].y) +
     simplified[1].x * (simplified[2].y - simplified[0].y) +
     simplified[2].x * (simplified[0].y - simplified[1].y)) / 2
  );

  return area > 0;
};

const simplifyPoints = (points: Point[], targetCount: number): Point[] => {
  if (points.length <= targetCount) {
    return points;
  }

  const simplified: Point[] = [];
  const step = Math.floor(points.length / targetCount);

  for (let i = 0; i < targetCount; i++) {
    simplified.push(points[i * step]);
  }

  return simplified;
};