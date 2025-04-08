import { Settings } from 'lucide-react';
import React, { useState } from 'react';
import SettingsDialog from './SettingsDialog'; // Import the modal

const SettingsPanel: React.FC = () => {
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);

  return (
    <div className="p-4 border-t border-gray-200">
      <h3 className="font-medium text-sm mb-3">Settings</h3>
      <button 
        onClick={() => setShowSettingsDialog(true)}
        className="w-full flex items-center justify-center gap-2 px-3 py-2 border rounded hover:bg-gray-50 text-sm"
      >
        <Settings size={16} />
        Open Settings Dialog
      </button>

      {showSettingsDialog && (
        <SettingsDialog onClose={() => setShowSettingsDialog(false)} />
      )}
    </div>
  );
};

export default SettingsPanel; 