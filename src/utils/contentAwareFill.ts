import { Point, Layer } from '../types/canvas';

interface SamplePoint {
  position: Point;
  content: string;
  color: string;
}

export const getContentSamples = (
  layer: Layer,
  center: Point,
  radius: number
): SamplePoint[] => {
  const samples: SamplePoint[] = [];
  
  // Sample in a circular pattern around the target point
  for (let y = -radius; y <= radius; y++) {
    for (let x = -radius; x <= radius; x++) {
      if (x * x + y * y <= radius * radius) {
        const pos = { x: center.x + x, y: center.y + y };
        const element = layer.elements.textElements.find(el => 
          el.position.x === pos.x && el.position.y === pos.y
        );
        
        if (element) {
          samples.push({
            position: pos,
            content: element.content,
            color: element.color || '#000000'
          });
        }
      }
    }
  }
  
  return samples;
};

export const synthesizeFill = (
  samples: SamplePoint[],
  targetArea: { start: Point; end: Point },
  matchThreshold: number
): { content: string; color: string }[][] => {
  const width = targetArea.end.x - targetArea.start.x + 1;
  const height = targetArea.end.y - targetArea.start.y + 1;
  const result: { content: string; color: string }[][] = Array(height).fill(null)
    .map(() => Array(width).fill(null));

  // Analyze patterns in samples
  const patterns = analyzePatterns(samples);

  // Fill target area using pattern analysis
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const surroundingContext = getSurroundingContext(result, x, y);
      const bestMatch = findBestMatch(surroundingContext, patterns, matchThreshold);
      
      result[y][x] = bestMatch || {
        content: ' ',
        color: samples[0]?.color || '#000000'
      };
    }
  }

  return result;
};

const analyzePatterns = (samples: SamplePoint[]) => {
  const patterns: {
    context: string[];
    result: { content: string; color: string };
    frequency: number;
  }[] = [];

  samples.forEach(sample => {
    const context = getLocalContext(samples, sample.position);
    const pattern = patterns.find(p => 
      p.context.join('') === context.join('') &&
      p.result.content === sample.content &&
      p.result.color === sample.color
    );

    if (pattern) {
      pattern.frequency++;
    } else {
      patterns.push({
        context,
        result: {
          content: sample.content,
          color: sample.color
        },
        frequency: 1
      });
    }
  });

  return patterns;
};

const getLocalContext = (samples: SamplePoint[], center: Point): string[] => {
  const directions = [
    { x: -1, y: -1 }, { x: 0, y: -1 }, { x: 1, y: -1 },
    { x: -1, y: 0 },                    { x: 1, y: 0 },
    { x: -1, y: 1 },  { x: 0, y: 1 },  { x: 1, y: 1 }
  ];

  return directions.map(dir => {
    const sample = samples.find(s => 
      s.position.x === center.x + dir.x &&
      s.position.y === center.y + dir.y
    );
    return sample ? sample.content : ' ';
  });
};

const getSurroundingContext = (
  result: { content: string; color: string }[][],
  x: number,
  y: number
): string[] => {
  const context: string[] = [];
  
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (dx === 0 && dy === 0) {
        continue;
      }
      
      const cell = result[y + dy]?.[x + dx];
      context.push(cell ? cell.content : ' ');
    }
  }
  
  return context;
};

const findBestMatch = (
  context: string[],
  patterns: {
    context: string[];
    result: { content: string; color: string };
    frequency: number;
  }[],
  threshold: number
) => {
  let bestMatch = null;
  let bestScore = -1;

  patterns.forEach(pattern => {
    const score = calculateMatchScore(context, pattern.context);
    if (score > threshold && score > bestScore) {
      bestScore = score;
      bestMatch = pattern.result;
    }
  });

  return bestMatch;
};

const calculateMatchScore = (a: string[], b: string[]): number => {
  let matches = 0;
  const total = Math.max(a.length, b.length);
  
  for (let i = 0; i < total; i++) {
    if (a[i] === b[i]) {
      matches++;
    }
  }
  
  return matches / total;
};