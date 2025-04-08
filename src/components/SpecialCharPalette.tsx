import { Settings } from 'lucide-react';
import React from 'react';
import { useEditorStore } from '../store/editorStore';
import CharacterSetManager from './CharacterSetManager';

const SpecialCharPalette: React.FC = () => {
  const { 
    characterSets, 
    currentCharacterSet, 
    currentTool, 
    setCurrentCharacterSet, 
    selectedSpecialChar,
    setSelectedSpecialChar
  } = useEditorStore();
  const [showManager, setShowManager] = React.useState(false);

  if (currentTool !== 'specialChar') {
    return null;
  }

  const currentSet = characterSets.find(set => set.id === currentCharacterSet) || characterSets[0];

  const handleCharClick = (char: string) => {
    setSelectedSpecialChar(char);
  };

  return (
    <>
      <div className="absolute top-4 right-4 bg-white p-4 rounded-lg shadow-lg border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <select
            value={currentCharacterSet}
            onChange={(e) => setCurrentCharacterSet(e.target.value)}
            className="text-sm border rounded px-2 py-1"
          >
            {characterSets.map(set => (
              <option key={set.id} value={set.id}>{set.name}</option>
            ))}
          </select>
          <button
            onClick={() => setShowManager(true)}
            className="p-1 hover:bg-gray-100 rounded"
            title="Manage Character Sets"
          >
            <Settings size={16} />
          </button>
        </div>
        <div className="grid grid-cols-8 gap-2">
          {currentSet.characters.map((char, index) => (
            <button
              key={index}
              onClick={() => handleCharClick(char)}
              className={`
                w-8 h-8 flex items-center justify-center border border-gray-200 
                rounded hover:bg-gray-100 font-mono text-lg 
                ${selectedSpecialChar === char ? 'bg-sky-100 border-sky-300 ring-1 ring-sky-300' : 'bg-white'}
              `}
            >
              {char}
            </button>
          ))}
        </div>
      </div>
      {showManager && <CharacterSetManager onClose={() => setShowManager(false)} />}
    </>
  );
};

export default SpecialCharPalette;