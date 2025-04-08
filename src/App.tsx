import { useEffect } from 'react';
import Canvas from './components/Canvas';
// import CollaborationPanel from './components/CollaborationPanel';
import MenuBar from './components/MenuBar';
import RightSidebar from './components/RightSidebar';
import SpecialCharPalette from './components/SpecialCharPalette';
import Toolbar from './components/Toolbar';
import { useAutoSave } from './hooks/useAutoSave';
import { useVersionControl } from './hooks/useVersionControl';
import { initAIAssistant } from './utils/aiAssistant';
import { initWasm } from './utils/wasmLoader';

function App() {
  const { loadFromLocalStorage } = useAutoSave();
  const versionControl = useVersionControl();

  useEffect(() => {
    const savedData = loadFromLocalStorage();
    if (savedData) {
      console.log('Autosaved data found:', savedData.timestamp);
      // TODO: Prompt user to load autosaved data or discard
      // For now, just log it
    }

    // Initialize AI Assistant
    initAIAssistant().then(success => {
      if (success) {
        console.log('AI Assistant initialized.');
      } else {
        console.warn('AI Assistant failed to initialize.');
      }
    });

    // Initialize WASM Module
    initWasm().then(success => {
      if (success) {
        console.log('WASM module loaded successfully.');
      } else {
        console.warn('WASM module failed to load.');
      }
    });

    // Log current branch from version control to ensure hook is registered as used
    console.log('Current Version Control Branch:', versionControl.currentBranch);

  }, [loadFromLocalStorage, versionControl.currentBranch]);

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-[1800px] mx-auto">
        <MenuBar />
        <div className="flex gap-4">
          <Toolbar />
          <Canvas />
          <RightSidebar />
        </div>
        {/* <CollaborationPanel /> */}
        <SpecialCharPalette />
      </div>
    </div>
  );
}

export default App;