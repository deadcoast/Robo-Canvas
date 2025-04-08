import { Layer } from '../types/canvas';

export const exportToHtml = (layers: Layer[], fontSize: number): string => {
  const visibleLayers = layers.filter(layer => layer.visible);
  
  // Convert canvas content to HTML with styling
  const styles = `
    .ascii-art {
      font-family: monospace;
      font-size: ${fontSize}px;
      line-height: 1;
      white-space: pre;
      background: white;
      padding: 20px;
      display: inline-block;
    }
    .ascii-art * {
      font-family: inherit;
      font-size: inherit;
      line-height: inherit;
    }
  `;

  // Create a text grid
  const width = Math.max(...visibleLayers.flatMap(layer => [
    ...layer.elements.lines.flatMap(line => [line.start.x, line.end.x]),
    ...layer.elements.boxes.flatMap(box => [box.start.x, box.end.x]),
    ...layer.elements.textElements.map(text => text.position.x + text.content.length)
  ])) + 1;

  const height = Math.max(...visibleLayers.flatMap(layer => [
    ...layer.elements.lines.flatMap(line => [line.start.y, line.end.y]),
    ...layer.elements.boxes.flatMap(box => [box.start.y, box.end.y]),
    ...layer.elements.textElements.map(text => text.position.y)
  ])) + 1;

  const grid: string[][] = Array(height).fill(null).map(() => Array(width).fill(' '));

  // Draw boxes
  visibleLayers.forEach(layer => {
    layer.elements.boxes.forEach(box => {
      const minX = Math.min(box.start.x, box.end.x);
      const maxX = Math.max(box.start.x, box.end.x);
      const minY = Math.min(box.start.y, box.end.y);
      const maxY = Math.max(box.start.y, box.end.y);

      for (let y = minY; y <= maxY; y++) {
        for (let x = minX; x <= maxX; x++) {
          if (box.filled) {
            grid[y][x] = '█';
          } else if (y === minY && x === minX) {
            grid[y][x] = '┌';
          } else if (y === minY && x === maxX) {
            grid[y][x] = '┐';
          } else if (y === maxY && x === minX) {
            grid[y][x] = '└';
          } else if (y === maxY && x === maxX) {
            grid[y][x] = '┘';
          } else if (y === minY || y === maxY) {
            grid[y][x] = '─';
          } else if (x === minX || x === maxX) {
            grid[y][x] = '│';
          }
        }
      }
    });

    // Draw lines
    layer.elements.lines.forEach(line => {
      const dx = line.end.x - line.start.x;
      const dy = line.end.y - line.start.y;
      const steps = Math.max(Math.abs(dx), Math.abs(dy));

      for (let i = 0; i <= steps; i++) {
        const x = Math.round(line.start.x + (dx * i) / steps);
        const y = Math.round(line.start.y + (dy * i) / steps);

        if (Math.abs(dx) > Math.abs(dy)) {
          grid[y][x] = '─';
        } else if (Math.abs(dy) > Math.abs(dx)) {
          grid[y][x] = '│';
        } else {
          grid[y][x] = '┼';
        }
      }
    });

    // Draw text
    layer.elements.textElements.forEach(text => {
      const chars = text.content.split('');
      chars.forEach((char, i) => {
        const x = text.position.x + i;
        const {y} = text.position;
        if (y < grid.length && x < grid[y].length) {
          grid[y][x] = char;
        }
      });
    });
  });

  // Convert grid to HTML
  const content = grid.map(row => row.join('')).join('\n');
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ASCII Art</title>
  <style>${styles}</style>
</head>
<body>
  <pre class="ascii-art">${content}</pre>
</body>
</html>`;
};

export const exportToSvg = (layers: Layer[], fontSize: number): string => {
  // Calculate canvas bounds
  const allPoints = layers.flatMap(layer => [
    ...layer.elements.lines.flatMap(line => [line.start, line.end]),
    ...layer.elements.boxes.flatMap(box => [box.start, box.end]),
    ...layer.elements.textElements.map(text => text.position)
  ]);

  const minX = Math.min(...allPoints.map(p => p.x)) * fontSize;
  const minY = Math.min(...allPoints.map(p => p.y)) * fontSize;
  const maxX = Math.max(...allPoints.map(p => p.x)) * fontSize;
  const maxY = Math.max(...allPoints.map(p => p.y)) * fontSize;
  const width = maxX - minX + fontSize * 2;
  const height = maxY - minY + fontSize * 2;

  let svgContent = `<svg width="${width}" height="${height}" viewBox="${minX - fontSize} ${minY - fontSize} ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <style>
    @font-face {
      font-family: 'MonoFont';
      src: local('Courier New');
    }
    text { font-family: 'MonoFont'; }
  </style>`;

  layers.forEach(layer => {
    if (!layer.visible) {
      return;
    }

    svgContent += `\n  <g opacity="${layer.locked ? '0.5' : '1'}">`;

    // Draw lines
    layer.elements.lines.forEach(line => {
      svgContent += `
    <line
      x1="${line.start.x * fontSize}"
      y1="${line.start.y * fontSize}"
      x2="${line.end.x * fontSize}"
      y2="${line.end.y * fontSize}"
      stroke="${line.color || '#000'}"
      stroke-width="2"
      ${line.style === 'dashed' ? 'stroke-dasharray="4"' : ''}
    />`;
    });

    // Draw boxes
    layer.elements.boxes.forEach(box => {
      const x = Math.min(box.start.x, box.end.x) * fontSize;
      const y = Math.min(box.start.y, box.end.y) * fontSize;
      const width = Math.abs(box.end.x - box.start.x) * fontSize;
      const height = Math.abs(box.end.y - box.start.y) * fontSize;

      svgContent += `
    <rect
      x="${x}"
      y="${y}"
      width="${width}"
      height="${height}"
      fill="${box.filled ? (box.fillColor || '#000') : 'none'}"
      stroke="${box.color || '#000'}"
      stroke-width="2"
    />`;
    });

    // Draw text elements
    layer.elements.textElements.forEach(text => {
      svgContent += `
    <text
      x="${text.position.x * fontSize}"
      y="${text.position.y * fontSize + fontSize * 0.8}"
      font-size="${text.fontSize}px"
      fill="${text.color || '#000'}"
    >${text.content}</text>`;
    });

    svgContent += '\n  </g>';
  });

  svgContent += '\n</svg>';
  return svgContent;
};

// Declare GIF type (as it's likely from an external library not imported)
declare const GIF: any;

export const exportToGif = async (layers: Layer[], fontSize: number): Promise<Blob> => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  const frames: ImageData[] = [];
  const frameDelay = 100; // milliseconds

  // Set canvas size
  canvas.width = Math.max(...layers.flatMap(l => 
    l.elements.textElements.map(t => t.position.x)
  )) * fontSize + fontSize * 2;
  canvas.height = Math.max(...layers.flatMap(l => 
    l.elements.textElements.map(t => t.position.y)
  )) * fontSize + fontSize * 2;

  // Create frames by toggling layer visibility
  for (let i = 0; i < layers.length; i++) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw only layers up to current index
    for (let j = 0; j <= i; j++) {
      if (layers[j].visible) {
        drawLayer(ctx, layers[j], fontSize);
      }
    }
    
    frames.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
  }

  // Create animated GIF using frames
  const gif = new GIF({
    workers: 2,
    quality: 10,
    width: canvas.width,
    height: canvas.height,
    workerScript: '/gif.worker.js' // Assuming this path is correct
  });

  frames.forEach(frame => gif.addFrame(frame, { delay: frameDelay }));

  return new Promise((resolve, reject) => {
    gif.on('finished', (blob: Blob) => resolve(blob));
    gif.on('error', (error: any) => reject(error));
    gif.render();
  });
};

export const exportToAnsi = (layers: Layer[]): string => {
  let output = '';
  const colorCodes: { [key: string]: string } = { // Added type annotation
    black: '\x1b[30m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    reset: '\x1b[0m'
  };

  layers.forEach(layer => {
    if (!layer.visible) {
      return;
    }

    layer.elements.textElements.forEach(text => {
      const colorName = text.color?.toLowerCase() || 'white';
      const colorCode = colorCodes[colorName as keyof typeof colorCodes] || colorCodes.white;
      output += `${colorCode}${text.content}${colorCodes.reset}`;
    });

    output += '\n';
  });

  return output;
};

const drawLayer = (ctx: CanvasRenderingContext2D, layer: Layer, fontSize: number) => {
  // Implementation of layer drawing for GIF export
  layer.elements.lines.forEach(line => {
    ctx.beginPath();
    ctx.moveTo(line.start.x * fontSize, line.start.y * fontSize);
    ctx.lineTo(line.end.x * fontSize, line.end.y * fontSize);
    ctx.strokeStyle = line.color || '#000';
    ctx.stroke();
  });

  layer.elements.boxes.forEach(box => {
    const x = Math.min(box.start.x, box.end.x) * fontSize;
    const y = Math.min(box.start.y, box.end.y) * fontSize;
    const width = Math.abs(box.end.x - box.start.x) * fontSize;
    const height = Math.abs(box.end.y - box.start.y) * fontSize;

    if (box.filled) {
      ctx.fillStyle = box.fillColor || '#000';
      ctx.fillRect(x, y, width, height);
    }
    ctx.strokeStyle = box.color || '#000';
    ctx.strokeRect(x, y, width, height);
  });

  layer.elements.textElements.forEach(text => {
    ctx.fillStyle = text.color || '#000';
    ctx.font = `${text.fontSize}px monospace`;
    ctx.fillText(text.content, text.position.x * fontSize, text.position.y * fontSize);
  });
};

export const importFromClipboard = async (): Promise<string> => {
  try {
    return await navigator.clipboard.readText();
  } catch (error) {
    console.error('Failed to read from clipboard:', error);
    throw new Error('Failed to read from clipboard');
  }
};