import { Point } from '../types/canvas';

export const floodFill = (
  grid: string[][],
  start: Point,
  targetChar: string,
  replacementChar: string
): Point[] => {
  const width = grid[0].length;
  const height = grid.length;
  const filledPoints: Point[] = [];

  // If target is same as replacement, return
  if (targetChar === replacementChar) {
    return filledPoints;
  }

  // If start point is out of bounds, return
  if (
    start.x < 0 ||
    start.x >= width ||
    start.y < 0 ||
    start.y >= height ||
    grid[start.y][start.x] !== targetChar
  ) {
    return filledPoints;
  }

  // Create a queue for flood fill
  const queue: Point[] = [start];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const current = queue.shift()!;
    const key = `${current.x},${current.y}`;

    if (visited.has(key)) {
      continue;
    }
    visited.add(key);

    if (grid[current.y][current.x] === targetChar) {
      filledPoints.push(current);
      grid[current.y][current.x] = replacementChar;

      // Add adjacent points
      const neighbors = [
        { x: current.x + 1, y: current.y },
        { x: current.x - 1, y: current.y },
        { x: current.x, y: current.y + 1 },
        { x: current.x, y: current.y - 1 }
      ];

      for (const neighbor of neighbors) {
        if (
          neighbor.x >= 0 &&
          neighbor.x < width &&
          neighbor.y >= 0 &&
          neighbor.y < height &&
          grid[neighbor.y][neighbor.x] === targetChar
        ) {
          queue.push(neighbor);
        }
      }
    }
  }

  return filledPoints;
};