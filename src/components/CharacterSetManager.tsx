import { Edit2, Plus, Trash2, X } from 'lucide-react';
import React, { useState } from 'react';
import { useEditorStore } from '../store/editorStore';
import { CharacterSet } from '../types/canvas';

interface CharacterSetFormData {
  name: string;
  characters: string;
}

const CharacterSetManager: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { characterSets, addCharacterSet, editCharacterSet, deleteCharacterSet, setCurrentCharacterSet } = useEditorStore();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<CharacterSetFormData>({ name: '', characters: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const characters = formData.characters.split('').filter(char => char.trim());

    if (editingId) {
      editCharacterSet(editingId, {
        name: formData.name,
        characters
      });
      setEditingId(null);
    } else {
      addCharacterSet({
        id: `custom-${Date.now()}`,
        name: formData.name,
        characters
      });
    }

    setFormData({ name: '', characters: '' });
    setIsAdding(false);
  };

  const startEditing = (set: CharacterSet) => {
    setFormData({
      name: set.name,
      characters: set.characters.join('')
    });
    setEditingId(set.id);
    setIsAdding(true);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Character Sets</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X size={20} />
          </button>
        </div>

        {isAdding ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Set Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border rounded-md"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Characters
              </label>
              <textarea
                value={formData.characters}
                onChange={e => setFormData(prev => ({ ...prev, characters: e.target.value }))}
                className="w-full px-3 py-2 border rounded-md font-mono"
                rows={3}
                required
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                {editingId ? 'Update' : 'Create'} Set
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsAdding(false);
                  setEditingId(null);
                  setFormData({ name: '', characters: '' });
                }}
                className="px-4 py-2 border rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <>
            <button
              onClick={() => setIsAdding(true)}
              className="mb-4 flex items-center gap-2 px-4 py-2 border rounded-md hover:bg-gray-50"
            >
              <Plus size={16} />
              Add New Set
            </button>
            <div className="space-y-4">
              {characterSets.map(set => (
                <div
                  key={set.id}
                  className="border rounded-lg p-4 hover:border-blue-200 transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-medium">{set.name}</h3>
                      {set.isBuiltIn && (
                        <span className="text-xs text-gray-500">Built-in</span>
                      )}
                    </div>
                    {!set.isBuiltIn && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEditing(set)}
                          className="p-1 hover:bg-gray-100 rounded"
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => deleteCharacterSet(set.id)}
                          className="p-1 hover:bg-gray-100 rounded text-red-600"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="font-mono text-sm bg-gray-50 p-2 rounded">
                    {set.characters.join(' ')}
                  </div>
                  <button 
                    onClick={() => setCurrentCharacterSet(set.id)} 
                    className="mt-2 px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                  >
                    Set as Active
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CharacterSetManager;