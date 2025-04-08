import { ChevronDown, Edit2, Grid, List, Plus, Search, Tag, Trash2 } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { useEditorStore } from '../store/editorStore';
import { Asset } from '../types/canvas';
import AssetEditor from './AssetEditor';

const AssetLibrary: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const {
    assetLibrary,
    addAsset,
    updateAsset,
    deleteAsset,
    addTag,
    removeTag,
    setSearchQuery,
    toggleSelectedTag,
    setView,
    setSortBy,
    setSortOrder,
    applyTemplate,
    setCurrentCharacterSet,
    applyPattern
  } = useEditorStore();

  const [showTagInput, setShowTagInput] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  const filteredAssets = useMemo(() => {
    let result = [...assetLibrary.assets];

    // Apply search filter
    if (assetLibrary.searchQuery) {
      const query = assetLibrary.searchQuery.toLowerCase();
      result = result.filter(asset =>
        asset.name.toLowerCase().includes(query) ||
        asset.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Apply tag filters
    if (assetLibrary.selectedTags.length > 0) {
      result = result.filter(asset =>
        assetLibrary.selectedTags.every(tag => asset.tags.includes(tag))
      );
    }

    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0;
      switch (assetLibrary.sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'date':
          comparison = b.updatedAt - a.updatedAt;
          break;
        case 'type':
          comparison = a.type.localeCompare(b.type);
          break;
      }
      return assetLibrary.sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [
    assetLibrary.assets,
    assetLibrary.searchQuery,
    assetLibrary.selectedTags,
    assetLibrary.sortBy,
    assetLibrary.sortOrder
  ]);

  const handleAddTag = () => {
    if (newTag.trim()) {
      addTag(newTag.trim());
      setNewTag('');
      setShowTagInput(false);
    }
  };

  const handleAssetClick = (asset: Asset) => {
    switch (asset.type) {
      case 'template':
        applyTemplate(asset.content);
        break;
      case 'pattern':
        // Handle pattern application
        applyPattern(asset.content, { x: 10, y: 10 });
        break;
      case 'character-set':
        setCurrentCharacterSet(asset.content.id);
        break;
    }
    // Optionally close the library after applying an asset
    // onClose(); 
  };

  const handleSaveAsset = (assetToSave: Asset) => {
    if (isCreatingNew) {
      // Create a new asset (omit id, createdAt, updatedAt - assumed handled by addAsset)
      const newAssetData = { ...assetToSave };
      delete (newAssetData as any).id; // Ensure ID isn't passed if addAsset generates it
      delete (newAssetData as any).createdAt;
      delete (newAssetData as any).updatedAt;
      addAsset(newAssetData as Omit<Asset, 'id' | 'createdAt' | 'updatedAt'>);
    } else {
      updateAsset(assetToSave.id, assetToSave);
    }
    setEditingAsset(null);
    setIsCreatingNew(false);
  };

  const handleCancelEdit = () => {
    setEditingAsset(null);
    setIsCreatingNew(false);
  };

  const handleCreateNewAsset = () => {
    // Initialize a blank asset structure for the editor
    setEditingAsset({ 
      id: 'new', // Temporary ID
      name: '', 
      type: 'template', // Default type
      tags: [], 
      content: {}, 
      createdAt: Date.now(), 
      updatedAt: Date.now() 
    });
    setIsCreatingNew(true);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      {editingAsset ? (
        <AssetEditor 
          asset={editingAsset} 
          onSave={handleSaveAsset} 
          onCancel={handleCancelEdit} 
          allTags={assetLibrary.tags} // Pass allTags for tag management
          removeTag={removeTag} // Pass removeTag function
          addTag={addTag} // Pass addTag function
        />
      ) : (
        <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[80vh] flex flex-col">
          <div className="p-4 border-b flex items-center justify-between">
            <h2 className="text-xl font-bold">Asset Library</h2>
            <div className="flex items-center gap-4">
              <button
                onClick={handleCreateNewAsset}
                className="p-2 hover:bg-gray-100 rounded"
                title="Add New Asset"
              >
                <Plus size={20} />
              </button>
              <button
                onClick={() => setView(assetLibrary.view === 'grid' ? 'list' : 'grid')}
                className="p-2 hover:bg-gray-100 rounded"
              >
                {assetLibrary.view === 'grid' ? <Grid size={20} /> : <List size={20} />}
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded"
              >
                ×
              </button>
            </div>
          </div>

          <div className="p-4 border-b">
            <div className="flex gap-4 mb-4">
              <div className="flex-1 relative">
                <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={assetLibrary.searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search assets..."
                  className="w-full pl-10 pr-4 py-2 border rounded-lg"
                />
              </div>
              <div className="relative">
                <button
                  onClick={() => setSortOrder(assetLibrary.sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="px-4 py-2 border rounded-lg flex items-center gap-2"
                >
                  Sort by
                  <ChevronDown
                    size={16}
                    className={`transform transition-transform ${
                      assetLibrary.sortOrder === 'desc' ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                <div className="absolute top-full mt-1 right-0 bg-white rounded-lg shadow-lg border py-1 min-w-[120px]">
                  <button
                    onClick={() => setSortBy('name')}
                    className="w-full px-4 py-2 text-left hover:bg-gray-50"
                  >
                    Name
                  </button>
                  <button
                    onClick={() => setSortBy('date')}
                    className="w-full px-4 py-2 text-left hover:bg-gray-50"
                  >
                    Date
                  </button>
                  <button
                    onClick={() => setSortBy('type')}
                    className="w-full px-4 py-2 text-left hover:bg-gray-50"
                  >
                    Type
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {assetLibrary.tags.map(tag => (
                <button
                  key={tag}
                  onClick={() => toggleSelectedTag(tag)}
                  className={`px-3 py-1 rounded-full text-sm flex items-center gap-1 ${
                    assetLibrary.selectedTags.includes(tag)
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  <Tag size={14} />
                  {tag}
                </button>
              ))}
              {showTagInput ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddTag();
                      if (e.key === 'Escape') setShowTagInput(false);
                    }}
                    placeholder="New tag..."
                    className="px-3 py-1 border rounded-full text-sm"
                    autoFocus
                  />
                  <button
                    onClick={handleAddTag}
                    className="p-1 hover:bg-gray-100 rounded-full"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowTagInput(true)}
                  className="px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-700 hover:bg-gray-200"
                >
                  Add Tag
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <div className={`grid gap-4 ${
              assetLibrary.view === 'grid' ? 'grid-cols-3' : 'grid-cols-1'
            }`}>
              {filteredAssets.map(asset => (
                <div
                  key={asset.id}
                  className="border rounded-lg p-4 hover:border-blue-300 transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-medium">{asset.name}</h3>
                      <span className="text-xs text-gray-500 capitalize">{asset.type}</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setEditingAsset(asset); setIsCreatingNew(false); }}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => deleteAsset(asset.id)}
                        className="p-1 hover:bg-gray-100 rounded text-red-600"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {asset.preview && (
                    <div className="bg-gray-50 p-2 rounded mb-2 font-mono text-sm">
                      {asset.preview}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-1 mt-2">
                    {asset.tags.map(tag => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 bg-gray-100 rounded-full text-xs text-gray-700"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <button
                    onClick={() => handleAssetClick(asset)}
                    className="mt-3 w-full px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Use Asset
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssetLibrary;