import * as tf from '@tensorflow/tfjs';
import { Point } from '../types/canvas';

let model: tf.LayersModel | null = null;

export const initAIAssistant = async () => {
  try {
    // Load pre-trained model for ASCII art pattern recognition
    model = await tf.loadLayersModel('https://storage.googleapis.com/ascii-art-models/model.json');
    return true;
  } catch (error) {
    console.error('Failed to load AI model:', error);
    return false;
  }
};

export const generateSuggestions = async (
  currentCanvas: string[][],
  cursorPosition: Point
): Promise<{
  type: 'line' | 'box' | 'text';
  points: Point[];
  confidence: number;
}[]> => {
  if (!model) {
    return [];
  }

  try {
    // Extract local context around cursor
    const context = getLocalContext(currentCanvas, cursorPosition);
    
    // Prepare input tensor
    const input = tf.tensor(context).expandDims(0);
    
    // Get model predictions
    const predictions = await model.predict(input) as tf.Tensor;
    // Using arraySync for potentially simpler handling and assuming batch size 1
    const results = predictions.arraySync(); 
    predictions.dispose(); // Dispose tensor to free memory
    input.dispose(); // Dispose tensor to free memory

    // Process predictions into suggestions
    let predictionArray: number[] = [];

    // Check the structure of results and extract the prediction array
    if (Array.isArray(results) && results.length > 0) {
        if (Array.isArray(results[0]) && typeof results[0][0] === 'number') {
            // Nested array structure like [[...predictions...]]
            predictionArray = results[0] as number[];
        } else if (typeof results[0] === 'number') {
            // Flat array structure like [...predictions...]
            predictionArray = results as number[];
        }
    }

    if (predictionArray.length > 0) {
         return processPredictions(predictionArray, cursorPosition);
    } else {
        console.warn("AI prediction result format unexpected or empty:", results);
        return [];
    }

  } catch (error) {
    console.error('Failed to generate suggestions:', error);
    return [];
  }
};

const getLocalContext = (canvas: string[][], center: Point): number[][] => {
  const contextSize = 16;
  const context: number[][] = [];
  
  for (let y = -contextSize/2; y < contextSize/2; y++) {
    const row: number[] = [];
    for (let x = -contextSize/2; x < contextSize/2; x++) {
      const char = canvas[center.y + y]?.[center.x + x] || ' ';
      row.push(char.charCodeAt(0) / 255); // Normalize to 0-1
    }
    context.push(row);
  }
  
  return context;
};

const processPredictions = (
  rawPredictions: number[],
  center: Point
): {
  type: 'line' | 'box' | 'text';
  points: Point[];
  confidence: number;
}[] => {
  const suggestions: {
    type: 'line' | 'box' | 'text';
    points: Point[];
    confidence: number;
  }[] = [];

  // Process line predictions
  if (rawPredictions[0] > 0.3) {
    suggestions.push({
      type: 'line',
      points: generateLinePoints(center, rawPredictions.slice(1, 5)),
      confidence: rawPredictions[0]
    });
  }

  // Process box predictions
  if (rawPredictions[5] > 0.3) {
    suggestions.push({
      type: 'box',
      points: generateBoxPoints(center, rawPredictions.slice(6, 10)),
      confidence: rawPredictions[5]
    });
  }

  // Process text predictions
  if (rawPredictions[10] > 0.3) {
    suggestions.push({
      type: 'text',
      points: [center],
      confidence: rawPredictions[10]
    });
  }

  return suggestions.sort((a, b) => b.confidence - a.confidence);
};

const generateLinePoints = (center: Point, params: number[]): Point[] => {
  const angle = params[0] * Math.PI * 2;
  const length = params[1] * 20;
  
  return [
    center,
    {
      x: center.x + Math.cos(angle) * length,
      y: center.y + Math.sin(angle) * length
    }
  ];
};

const generateBoxPoints = (center: Point, params: number[]): Point[] => {
  const width = params[0] * 20;
  const height = params[1] * 20;
  
  return [
    center,
    {
      x: center.x + width,
      y: center.y + height
    }
  ];
};