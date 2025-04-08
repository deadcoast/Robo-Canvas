import React from 'react';
import { useEditorStore } from '../store/editorStore';
import { BackgroundGradient, BackgroundPattern } from '../types/canvas'; // Import types

// TODO: Consider using a dedicated color picker component library

const BackgroundSettingsPanel: React.FC = () => {
  const {
    backgroundColor,
    backgroundType,
    backgroundGradient,
    backgroundPattern,
    setBackgroundColor,
    setBackgroundType,
    setBackgroundGradient,
    setBackgroundPattern,
  } = useEditorStore();

  const handleTypeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setBackgroundType(event.target.value as 'solid' | 'gradient' | 'pattern');
  };

  const handleSolidColorChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setBackgroundColor(event.target.value);
  };

  // Handlers for Gradient Settings
  const handleGradientChange = (updates: Partial<BackgroundGradient>) => {
    setBackgroundGradient(updates);
  };

  // Handlers for Pattern Settings
  const handlePatternChange = (updates: Partial<BackgroundPattern>) => {
    setBackgroundPattern(updates);
  };

  return (
    <div className="p-4 bg-gray-100 border-l border-gray-300">
      <h3 className="text-lg font-semibold mb-4">Background Settings</h3>
      
      <div className="mb-4">
        <label htmlFor="bg-type" className="block text-sm font-medium text-gray-700 mb-1">Type</label>
        <select 
          id="bg-type" 
          value={backgroundType} 
          onChange={handleTypeChange}
          className="w-full p-2 border border-gray-300 rounded shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="solid">Solid Color</option>
          <option value="gradient">Gradient</option>
          <option value="pattern">Pattern</option>
        </select>
      </div>

      {/* Solid Color Settings */}
      {backgroundType === 'solid' && (
        <div className="mb-4">
          <label htmlFor="bg-color-solid" className="block text-sm font-medium text-gray-700 mb-1">Color</label>
          <input 
            type="color" 
            id="bg-color-solid" 
            value={backgroundColor} 
            onChange={handleSolidColorChange} 
            className="w-full h-10 p-1 border border-gray-300 rounded cursor-pointer"
          />
        </div>
      )}

      {/* Gradient Settings */}
      {backgroundType === 'gradient' && (
        <div className="space-y-3 mb-4 p-3 border rounded border-gray-200">
          <h4 className="font-medium text-gray-800">Gradient</h4>
          <div>
            <label htmlFor="bg-grad-start" className="block text-sm font-medium text-gray-700 mb-1">Start Color</label>
            <input 
              type="color" 
              id="bg-grad-start" 
              value={backgroundGradient.startColor} 
              onChange={(e) => handleGradientChange({ startColor: e.target.value })}
              className="w-full h-8 p-1 border border-gray-300 rounded cursor-pointer"
            />
          </div>
           <div>
            <label htmlFor="bg-grad-end" className="block text-sm font-medium text-gray-700 mb-1">End Color</label>
            <input 
              type="color" 
              id="bg-grad-end" 
              value={backgroundGradient.endColor} 
              onChange={(e) => handleGradientChange({ endColor: e.target.value })}
              className="w-full h-8 p-1 border border-gray-300 rounded cursor-pointer"
            />
          </div>
           <div>
            <label htmlFor="bg-grad-angle" className="block text-sm font-medium text-gray-700 mb-1">
              Angle ({backgroundGradient.angle}°)
            </label>
            <input 
              type="range" 
              id="bg-grad-angle" 
              min="0" 
              max="360" 
              value={backgroundGradient.angle} 
              onChange={(e) => handleGradientChange({ angle: parseInt(e.target.value, 10) })}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
            />
          </div>
        </div>
      )}

      {/* Pattern Settings */}
      {backgroundType === 'pattern' && (
         <div className="space-y-3 mb-4 p-3 border rounded border-gray-200">
           <h4 className="font-medium text-gray-800">Pattern</h4>
           <div>
             <label htmlFor="bg-pattern-type" className="block text-sm font-medium text-gray-700 mb-1">Pattern Type</label>
             <select 
               id="bg-pattern-type" 
               value={backgroundPattern.type} 
               onChange={(e) => handlePatternChange({ type: e.target.value as 'dots' | 'lines' | 'grid' })}
               className="w-full p-2 border border-gray-300 rounded shadow-sm focus:ring-blue-500 focus:border-blue-500"
             >
               <option value="dots">Dots</option>
               <option value="lines">Lines</option>
               <option value="grid">Grid</option>
             </select>
           </div>
           <div>
             <label htmlFor="bg-pattern-primary" className="block text-sm font-medium text-gray-700 mb-1">Primary Color (Background)</label>
             <input 
               type="color" 
               id="bg-pattern-primary" 
               value={backgroundPattern.primaryColor} 
               onChange={(e) => handlePatternChange({ primaryColor: e.target.value })}
               className="w-full h-8 p-1 border border-gray-300 rounded cursor-pointer"
             />
           </div>
           <div>
             <label htmlFor="bg-pattern-secondary" className="block text-sm font-medium text-gray-700 mb-1">Secondary Color (Pattern)</label>
             <input 
               type="color" 
               id="bg-pattern-secondary" 
               value={backgroundPattern.secondaryColor} 
               onChange={(e) => handlePatternChange({ secondaryColor: e.target.value })}
               className="w-full h-8 p-1 border border-gray-300 rounded cursor-pointer"
             />
           </div>
           <div>
             <label htmlFor="bg-pattern-scale" className="block text-sm font-medium text-gray-700 mb-1">
               Scale ({backgroundPattern.scale.toFixed(1)}x Font Size)
             </label>
             <input 
               type="range" 
               id="bg-pattern-scale" 
               min="0.5" 
               max="5" 
               step="0.1"
               value={backgroundPattern.scale} 
               onChange={(e) => handlePatternChange({ scale: parseFloat(e.target.value) })}
               className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
             />
           </div>
         </div>
      )}

    </div>
  );
};

export default BackgroundSettingsPanel; 