let wasmModule: WebAssembly.Instance | null = null;

export const initWasm = async () => {
  try {
    const wasmUrl = new URL('/src/wasm/geometry.wat?init', import.meta.url).href;
    const response = await fetch(wasmUrl);
    const wasmBuffer = await response.arrayBuffer();
    const { instance } = await WebAssembly.instantiate(wasmBuffer, {
      env: {
        memory: new WebAssembly.Memory({ initial: 1 })
      }
    });
    wasmModule = instance;
    return true;
  } catch (error) {
    console.error('Failed to load WebAssembly module:', error);
    return false;
  }
};

export const getWasmExports = () => {
  if (!wasmModule) {
    throw new Error('WebAssembly module not initialized');
  }
  return wasmModule.exports as {
    distance: (x1: number, y1: number, x2: number, y2: number) => number;
    pointInRect: (px: number, py: number, x1: number, y1: number, x2: number, y2: number) => number;
  };
};