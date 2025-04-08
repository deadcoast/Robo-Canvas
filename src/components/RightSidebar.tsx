import React from 'react';
import BackgroundSettingsPanel from './BackgroundSettingsPanel';
import ExportPanel from './ExportPanel';
import HistoryPanel from './HistoryPanel';
import LayerManager from './LayerManager';
import PropertiesPanel from './PropertiesPanel';
import SettingsPanel from './SettingsPanel';

// TODO: Add components for Properties, Export, Settings

const RightSidebar: React.FC = () => {
  return (
    <div className="w-64 bg-gray-50 border-l border-gray-300 flex flex-col overflow-y-auto">
      {/* Use implemented LayerManager */}
      <LayerManager />
      <PropertiesPanel />
      {/* Use implemented HistoryPanel */}
      <HistoryPanel />
      <BackgroundSettingsPanel />
      <ExportPanel />
      <SettingsPanel />
      {/* AssetLibrary is rendered conditionally via MenuBar */}
    </div>
  );
};

export default RightSidebar; 