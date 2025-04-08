import React from 'react';
import { Asset } from '../types/canvas';

interface AssetEditorProps {
  asset: Asset;
  onSave: (asset: Asset) => void;
  onCancel: () => void;
  allTags: string[];
  removeTag: (tag: string) => void; // Placeholder, not used yet
  addTag: (tag: string) => void; // Placeholder, not used yet
}

const AssetEditor: React.FC<AssetEditorProps> = ({
  asset,
  onSave,
  onCancel,
  allTags,
  // removeTag, // Mark as unused for now
  // addTag, // Mark as unused for now
}) => {
  // Basic placeholder implementation - displays asset data
  const [currentAsset, setCurrentAsset] = React.useState(asset);

  const handleSave = () => {
    onSave(currentAsset);
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCurrentAsset(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6">
      <h2 className="text-xl font-bold mb-4">{asset.id === 'new' ? 'Create New Asset' : 'Edit Asset'}</h2>
      <div className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
          <input 
            type="text" 
            id="name" 
            name="name" 
            value={currentAsset.name}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>
        <div>
          <label htmlFor="type" className="block text-sm font-medium text-gray-700">Type</label>
          <select 
            id="type" 
            name="type" 
            value={currentAsset.type}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            <option value="template">Template</option>
            <option value="pattern">Pattern</option>
            <option value="character-set">Character Set</option>
          </select>
        </div>
        {/* Add fields for content, preview, tags later */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Tags</label>
          <div className="mt-1 text-xs text-gray-500">
            Current Tags: {currentAsset.tags.join(', ') || 'None'}
            <br />
            Available Tags (for future use): {allTags.join(', ') || 'None'}
            {/* Add tag input/selection UI here later */}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Preview</label>
           <pre className="mt-1 p-2 bg-gray-100 rounded text-xs font-mono overflow-auto max-h-20">
            {currentAsset.preview || 'No preview available'}
          </pre>
        </div>
        {/* Display content (simplified) */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Content</label>
          <pre className="mt-1 p-2 bg-gray-100 rounded text-xs font-mono overflow-auto max-h-40">
            {JSON.stringify(currentAsset.content, null, 2)}
          </pre>
        </div>
      </div>
      <div className="mt-6 flex justify-end gap-3">
        <button 
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Cancel
        </button>
        <button 
          onClick={handleSave}
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Save Asset
        </button>
      </div>
    </div>
  );
};

export default AssetEditor; 