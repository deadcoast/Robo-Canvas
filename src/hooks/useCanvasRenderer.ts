import { wrap } from 'comlink/dist/esm/comlink.js';
import { useCallback, useMemo, useRef } from 'react';
import type { Layer } from '../types/canvas';

// Update Worker type definition to expect RenderPoint
type RenderPoint = { x: number; y: number; color: string; char: string };
type CanvasWorker = {
  batchProcessElements: (
    lines: any[],
    boxes: any[],
    textElements: any[]
  ) => Promise<{
    points: RenderPoint[]; // Use RenderPoint
    text: any[];
  }>;
};

export const useCanvasRenderer = () => {
  const workerRef = useRef<Worker>();
  const workerApiRef = useRef<CanvasWorker>();
  const canvasCache = useRef<Map<string, ImageData>>(new Map());

  // Initialize worker
  useMemo(() => {
    if (typeof Worker !== 'undefined') {
      workerRef.current = new Worker(
        new URL('../workers/canvasWorkers.ts', import.meta.url),
        { type: 'module' }
      );
      workerApiRef.current = wrap(workerRef.current);
    }
  }, []);

  // Render layer with caching
  const renderLayer = useCallback(async (
    ctx: CanvasRenderingContext2D,
    layer: Layer,
    fontSize: number
  ) => {
    if (!workerApiRef.current || !layer.visible) {
      return;
    }

    const cacheKey = `${layer.id}-${JSON.stringify(layer.elements)}`;
    const cachedImage = canvasCache.current.get(cacheKey);

    if (cachedImage) {
      ctx.putImageData(cachedImage, 0, 0);
      return;
    }

    // Ensure elements exist
    const lines = (layer.elements?.lines || []).map(line => ({
      ...line,
      start: { x: Math.floor(line.start.x), y: Math.floor(line.start.y) },
      end: { x: Math.floor(line.end.x), y: Math.floor(line.end.y) }
    }));
    const boxes = (layer.elements?.boxes || []).map(box => ({
      ...box,
      start: { x: Math.floor(box.start.x), y: Math.floor(box.start.y) },
      end: { x: Math.floor(box.end.x), y: Math.floor(box.end.y) }
    }));
    const textElements = (layer.elements?.textElements || []).map(text => ({
        ...text,
        position: { x: Math.floor(text.position.x), y: Math.floor(text.position.y) }
    }));

    const { points, text } = await workerApiRef.current.batchProcessElements(
      lines,
      boxes,
      textElements
    );

    // *** Draw points using fillText ***
    ctx.font = `${fontSize}px monospace`; // Ensure font is set
    ctx.textBaseline = 'top'; // Use top baseline for better alignment in cell

    points.forEach(point => {
      // Log the character and color
      // console.log(`RenderLayer: Drawing char '${point.char}' (${point.x}, ${point.y}) color: ${point.color}`);
      ctx.fillStyle = point.color;
      // Use fillText to draw the character
      ctx.fillText(
        point.char,
        point.x * fontSize,
        point.y * fontSize // Align to top-left of the cell
      );
    });

    // Draw text elements (adjust baseline if needed)
    text.forEach(textElement => {
      ctx.fillStyle = textElement.color || '#000000';
      ctx.font = `${textElement.fontSize || fontSize}px monospace`;
      ctx.fillText(
        textElement.content,
        textElement.position.x * fontSize,
        textElement.position.y * fontSize // Align text element top-left
      );
    });

    // Cache the rendered layer
    // Use the current state of ctx which now has characters drawn
    canvasCache.current.set(cacheKey, ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height));

  }, []); // Dependency array remains empty

  // Clear cache for a specific layer
  const invalidateLayerCache = useCallback((layerId: string) => {
    for (const key of canvasCache.current.keys()) {
      if (key.startsWith(layerId)) {
        canvasCache.current.delete(key);
      }
    }
  }, []);

  // Clear entire cache
  const clearCache = useCallback(() => {
    canvasCache.current.clear();
  }, []);

  return {
    renderLayer,
    invalidateLayerCache,
    clearCache
  };
};