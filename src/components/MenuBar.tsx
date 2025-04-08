import { saveAs } from 'file-saver';
import { Check, ChevronDown, Clipboard, Cloud, Code, Download, DownloadCloud, Eye, EyeOff, FileText, HelpCircle, Image, Library, Plus, Redo, Save, Settings, Terminal, Undo, Upload, UploadCloud, Users, ZoomIn, ZoomOut } from 'lucide-react';
import React, { useState } from 'react';
import { useCloudSync } from '../hooks/useCloudSync';
import { useVersionControl } from '../hooks/useVersionControl';
import { useEditorStore } from '../store/editorStore';
import { exportToAnsi, exportToGif, exportToHtml, exportToSvg, importFromClipboard as utilImportFromClipboard } from '../utils/exporters';
import AssetLibrary from './AssetLibrary';
import CollaborationPanel from './CollaborationPanel';
import HelpDialog from './HelpDialog';
import SettingsDialog from './SettingsDialog';

const MenuBar: React.FC = () => {
  const [showExportMenu, setShowExportMenu] = React.useState(false);
  const [showSettings, setShowSettings] = React.useState(false);
  const [showHelp, setShowHelp] = React.useState(false);
  const [showLibrary, setShowLibrary] = React.useState(false);
  const [showCloudMenu, setShowCloudMenu] = useState(false);
  const [showViewMenu, setShowViewMenu] = useState(false);
  const [showCollaborationPanel, setShowCollaborationPanel] = useState(false);
  const { 
    zoom,
    setZoom,
    exportToFile, 
    loadFromFile, 
    clearCanvas, 
    exportToText, 
    exportToImage,
    layers,
    fontSize,
    setCanvasSize,
    showCharCount,
    showDimensions,
    toggleCharCount,
    toggleDimensions,
    autosaveEnabled,
    toggleAutosave,
    setFontSize,
    undo,
    redo,
    history,
    historyIndex
  } = useEditorStore();
  const { projects, isSyncing, syncToCloud, loadFromCloud, listProjects } = useCloudSync();
  const { createVersion } = useVersionControl();

  const handleKeyboardShortcuts = (e: KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 's':
          e.preventDefault();
          handleSave();
          break;
        case 'o':
          e.preventDefault();
          handleOpen();
          break;
        case 'n':
          e.preventDefault();
          handleNew();
          break;
        case '=':
        case '+':
          e.preventDefault();
          setZoom(zoom + 0.1);
          break;
        case '-':
          e.preventDefault();
          setZoom(zoom - 0.1);
          break;
        case '0':
          e.preventDefault();
          setZoom(1);
          break;
      }
    }
  };

  React.useEffect(() => {
    window.addEventListener('keydown', handleKeyboardShortcuts);
    return () => window.removeEventListener('keydown', handleKeyboardShortcuts);
  }, [zoom]);

  const handleNew = () => {
    const width = prompt('Enter canvas width (in characters):', '100');
    const height = prompt('Enter canvas height (in characters):', '50');
    
    if (width && height) {
      const currentFontSize = useEditorStore.getState().fontSize;
      const numWidth = parseInt(width) * currentFontSize;
      const numHeight = parseInt(height) * currentFontSize;
      
      if (!isNaN(numWidth) && !isNaN(numHeight) && numWidth > 0 && numHeight > 0) {
        if (confirm('Are you sure you want to create a new canvas? All unsaved changes will be lost.')) {
          setCanvasSize(numWidth, numHeight);
          clearCanvas();
        }
      } else {
        alert('Please enter valid positive numbers for width and height.');
      }
    }
  };

  const handleSave = () => {
    try {
      const state = exportToFile();
      
      if (state && state.content) {
        const blob = new Blob([JSON.stringify(state.content, null, 2)], {
          type: 'application/json'
        });
        saveAs(blob, 'ascii-art.json');
      } else {
        console.error('Failed to save: Export function did not return valid state or content.');
        alert('Failed to save the file. Please try again.');
      }
    } catch (error) {
      console.error('Failed to save:', error);
      alert('Failed to save the file. Please try again.');
    }
  };

  const handleOpen = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) {
        return;
      }

      try {
        const content = await file.text();
        loadFromFile(content);
      } catch (error) {
        console.error('Failed to load:', error);
        alert('Failed to load the file. Please make sure it\'s a valid ASCII art file.');
      }
    };
    input.click();
  };

  const handleExportText = () => {
    try {
      const content = exportToText();
      const blob = new Blob([content], { type: 'text/plain' });
      saveAs(blob, 'ascii-art.txt');
      setShowExportMenu(false);
    } catch (error) {
      console.error('Failed to export text:', error);
      alert('Failed to export text. Please try again.');
    }
  };

  const handleExportImage = () => {
    try {
      const dataUrl = exportToImage();
      const link = document.createElement('a');
      link.download = 'ascii-art.png';
      link.href = dataUrl;
      link.click();
      setShowExportMenu(false);
    } catch (error) {
      console.error('Failed to export image:', error);
      alert('Failed to export image. Please try again.');
    }
  };

  const handleExportHtml = () => {
    try {
      const content = exportToHtml(layers, fontSize);
      const blob = new Blob([content], { type: 'text/html' });
      saveAs(blob, 'ascii-art.html');
      setShowExportMenu(false);
    } catch (error) {
      console.error('Failed to export HTML:', error);
      alert('Failed to export HTML. Please try again.');
    }
  };

  const handleExportSVG = () => {
    try {
      const content = exportToSvg(layers, fontSize);
      const blob = new Blob([content], { type: 'image/svg+xml' });
      saveAs(blob, 'ascii-art.svg');
      setShowExportMenu(false);
    } catch (error) {
      console.error('Failed to export SVG:', error);
      alert('Failed to export SVG. Please try again.');
    }
  };

  const handleExportGif = async () => {
    try {
      const blob = await exportToGif(layers, fontSize);
      saveAs(blob, 'ascii-art.gif');
      setShowExportMenu(false);
    } catch (error) {
      console.error('Failed to export GIF:', error);
      alert('Failed to export GIF. Please try again.');
    }
  };

  const handleExportAnsi = () => {
    try {
      const content = exportToAnsi(layers);
      const blob = new Blob([content], { type: 'text/plain' });
      saveAs(blob, 'ascii-art.ans');
      setShowExportMenu(false);
    } catch (error) {
      console.error('Failed to export ANSI:', error);
      alert('Failed to export ANSI. Please try again.');
    }
  };

  const handleImportFromClipboard = async () => {
    try {
      await utilImportFromClipboard();
    } catch (error) {
      console.error('Failed to import from clipboard:', error);
      alert('Failed to import from clipboard. Please try again.');
    }
  };

  const handleSyncToCloud = async () => {
    const projectId = prompt("Enter project ID to save to cloud:", "my-ascii-project");
    if (projectId) {
      const success = await syncToCloud(projectId);
      if (success) {
        alert('Successfully synced to cloud!');
      } else {
        alert('Failed to sync to cloud.');
      }
    }
    setShowCloudMenu(false);
  };

  const handleLoadFromCloud = async () => {
    const projectId = prompt("Enter project ID to load from cloud:");
    if (projectId) {
      const success = await loadFromCloud(projectId);
      if (success) {
        alert('Successfully loaded from cloud!');
      } else {
        alert('Failed to load from cloud.');
      }
    }
    setShowCloudMenu(false);
  };

  const handleListProjects = async () => {
    const projectList = await listProjects();
    alert(`Cloud Projects:\n${projectList.map(p => `- ${p.name} (ID: ${p.id})`).join('\n')}`);
    setShowCloudMenu(false);
  };

  const handleCommit = () => {
    const message = prompt("Enter version label (optional):");
    const currentState = useEditorStore.getState();
    createVersion(currentState, message || undefined);
    alert('Version created!');
  };

  const canUndo = historyIndex >= 0;
  const canRedo = historyIndex < history.length - 1;

  return (
    <div className="relative flex items-center gap-4 bg-white p-2 rounded-lg shadow-lg mb-4 flex-wrap">
      <button
        onClick={handleNew}
        className="flex items-center gap-2 px-3 py-1.5 rounded hover:bg-gray-100 transition-colors"
        title="Create a new canvas (Ctrl+N)"
      >
        <Plus size={16} />
        New
      </button>
      <button
        onClick={handleOpen}
        className="flex items-center gap-2 px-3 py-1.5 rounded hover:bg-gray-100 transition-colors"
        title="Open a saved file (Ctrl+O)"
      >
        <Upload size={16} />
        Open
      </button>
      <button
        onClick={handleSave}
        className="flex items-center gap-2 px-3 py-1.5 rounded hover:bg-gray-100 transition-colors"
        title="Save the current canvas (Ctrl+S)"
      >
        <Download size={16} />
        Save
      </button>
      <button
        onClick={undo}
        disabled={!canUndo}
        className="flex items-center gap-2 px-3 py-1.5 rounded hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title="Undo (Ctrl+Z)"
      >
        <Undo size={16} />
        Undo
      </button>
      <button
        onClick={redo}
        disabled={!canRedo}
        className="flex items-center gap-2 px-3 py-1.5 rounded hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title="Redo (Ctrl+Y)"
      >
        <Redo size={16} />
        Redo
      </button>
      <button
        onClick={handleCommit}
        className="flex items-center gap-2 px-3 py-1.5 rounded hover:bg-gray-100 transition-colors"
        title="Create named version"
      >
        <Save size={16} />
        Commit Version
      </button>
      <div className="relative">
        <button
          onClick={() => setShowExportMenu(!showExportMenu)}
          className="flex items-center gap-2 px-3 py-1.5 rounded hover:bg-gray-100 transition-colors"
          title="Export in different formats"
        >
          <Download size={16} />
          Export
          <ChevronDown size={14} className={`transition-transform ${showExportMenu ? 'rotate-180' : ''}`} />
        </button>
        {showExportMenu && (
          <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[160px] z-10">
            <div className="px-4 py-2 text-sm font-medium text-gray-500">Basic</div>
            <button
              onClick={handleExportText}
              className="flex items-center gap-2 px-4 py-2 w-full hover:bg-gray-50 transition-colors"
              title="Export as plain text file"
            >
              <FileText size={16} />
              Text
            </button>
            <button
              onClick={handleExportHtml}
              className="flex items-center gap-2 px-4 py-2 w-full hover:bg-gray-50 transition-colors"
              title="Export as HTML file"
            >
              <Code size={16} />
              HTML
            </button>
            <button
              onClick={handleExportImage}
              className="flex items-center gap-2 px-4 py-2 w-full hover:bg-gray-50 transition-colors"
              title="Export as PNG image"
            >
              <Image size={16} />
              PNG
            </button>
            <div className="border-t my-1" />
            <div className="px-4 py-2 text-sm font-medium text-gray-500">Advanced</div>
            <button
              onClick={handleExportGif}
              className="flex items-center gap-2 px-4 py-2 w-full hover:bg-gray-50 transition-colors"
            >
              <Image size={16} />
              GIF
            </button>
            <button
              onClick={handleExportAnsi}
              className="flex items-center gap-2 px-4 py-2 w-full hover:bg-gray-50 transition-colors"
            >
              <Terminal size={16} />
              ANSI
            </button>
            <button
              onClick={handleExportSVG}
              className="flex items-center gap-2 px-4 py-2 w-full hover:bg-gray-50 transition-colors"
            >
              <Image size={16} />
              SVG
            </button>
          </div>
        )}
      </div>
      <button
        onClick={handleImportFromClipboard}
        className="flex items-center gap-2 px-3 py-1.5 rounded hover:bg-gray-100 transition-colors"
        title="Import from clipboard"
      >
        <Clipboard size={16} />
        Import
      </button>
      
      <div className="h-6 w-px bg-gray-200" />
      
      <div className="relative">
        <button
          onClick={() => setShowViewMenu(!showViewMenu)}
          className="flex items-center gap-2 px-3 py-1.5 rounded hover:bg-gray-100 transition-colors"
        >
          View
          <ChevronDown size={14} className={`transition-transform ${showViewMenu ? 'rotate-180' : ''}`} />
        </button>
        {showViewMenu && (
          <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[180px] z-10">
            <button
              onClick={() => { toggleCharCount(); setShowViewMenu(false); }}
              className="flex items-center justify-between gap-2 px-4 py-2 w-full hover:bg-gray-50 transition-colors"
            >
              <span className="flex items-center gap-2">
                {showCharCount ? <EyeOff size={16} /> : <Eye size={16} />}
                Character Count
              </span>
              {showCharCount && <Check size={16} className="text-blue-500"/>}
            </button>
            <button
              onClick={() => { toggleDimensions(); setShowViewMenu(false); }}
              className="flex items-center justify-between gap-2 px-4 py-2 w-full hover:bg-gray-50 transition-colors"
            >
              <span className="flex items-center gap-2">
                {showDimensions ? <EyeOff size={16} /> : <Eye size={16} />}
                Canvas Dimensions
              </span>
              {showDimensions && <Check size={16} className="text-blue-500"/>}
            </button>
            <div className="border-t my-1" />
            <div className="px-4 py-2 text-sm font-medium text-gray-500">Font Size</div>
            <input 
              type="range" 
              min="8" 
              max="32" 
              value={fontSize} 
              onChange={(e) => setFontSize(Number(e.target.value))} 
              className="w-full px-4 py-1"
            />
            <div className="text-center text-xs text-gray-500">{fontSize}px</div>
          </div>
        )}
      </div>
      
      <div className="h-6 w-px bg-gray-200" />
      
      <button
        onClick={() => setShowSettings(true)}
        className="flex items-center gap-2 px-3 py-1.5 rounded hover:bg-gray-100 transition-colors"
        title="Open settings dialog"
      >
        <Settings size={16} />
      </button>
      <button
        onClick={toggleAutosave}
        className={`flex items-center gap-2 px-3 py-1.5 rounded transition-colors ${autosaveEnabled ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'hover:bg-gray-100'}`}
        title={autosaveEnabled ? "Disable Autosave" : "Enable Autosave"}
      >
        <Check size={16} className={autosaveEnabled ? '' : 'opacity-0'} />
        Autosave
      </button>
      <button
        onClick={() => setShowHelp(true)}
        className="flex items-center gap-2 px-3 py-1.5 rounded hover:bg-gray-100 transition-colors"
        title="View help information"
      >
        <HelpCircle size={16} />
      </button>
      <button
        onClick={() => setShowLibrary(true)}
        className="flex items-center gap-2 px-3 py-1.5 rounded hover:bg-gray-100 transition-colors"
        title="Asset Library"
      >
        <Library size={16} />
      </button>
      
      <div className="h-6 w-px bg-gray-200" />
      
      <button
        onClick={() => setZoom(zoom + 0.1)}
        className="flex items-center gap-2 px-3 py-1.5 rounded hover:bg-gray-100 transition-colors"
        title="Zoom In (Ctrl +)"
      >
        <ZoomIn size={16} />
      </button>
      <button
        onClick={() => setZoom(zoom - 0.1)}
        className="flex items-center gap-2 px-3 py-1.5 rounded hover:bg-gray-100 transition-colors"
        title="Zoom Out (Ctrl -)"
      >
        <ZoomOut size={16} />
      </button>
      <span className="text-sm text-gray-600">
        {Math.round(zoom * 100)}%
      </span>
      
      <div className="h-6 w-px bg-gray-200" />
      
      <div className="relative">
        <button
          onClick={() => setShowCloudMenu(!showCloudMenu)}
          className="flex items-center gap-2 px-3 py-1.5 rounded hover:bg-gray-100 transition-colors"
          title="Cloud Sync Options"
        >
          <Cloud size={16} />
          Cloud ({projects.length})
          <ChevronDown size={14} className={`transition-transform ${showCloudMenu ? 'rotate-180' : ''}`} />
        </button>
        {showCloudMenu && (
          <div className="absolute top-full right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[200px] z-10">
            <button
              onClick={handleSyncToCloud}
              disabled={isSyncing}
              className="flex items-center gap-2 px-4 py-2 w-full hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <UploadCloud size={16} />
              {isSyncing ? 'Syncing...' : 'Save to Cloud'}
            </button>
            <button
              onClick={handleLoadFromCloud}
              disabled={isSyncing}
              className="flex items-center gap-2 px-4 py-2 w-full hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <DownloadCloud size={16} />
              {isSyncing ? 'Loading...' : 'Load from Cloud'}
            </button>
            <button
              onClick={handleListProjects}
              className="flex items-center gap-2 px-4 py-2 w-full hover:bg-gray-50 transition-colors"
            >
              <Library size={16} />
              List Cloud Projects
            </button>
          </div>
        )}
      </div>
      
      <div className="h-6 w-px bg-gray-200" />
      
      <div className="relative">
        <button
          onClick={() => setShowCollaborationPanel(!showCollaborationPanel)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded transition-colors ${
            showCollaborationPanel ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'
          }`}
          title="Collaboration Panel"
        >
          <Users size={16} />
          Collaboration
          <ChevronDown size={14} className={`transition-transform ${showCollaborationPanel ? 'rotate-180' : ''}`} />
        </button>
        {showCollaborationPanel && (
          <div className="absolute top-full right-0 mt-1 z-10">
            <CollaborationPanel />
          </div>
        )}
      </div>
      
      {showSettings && <SettingsDialog onClose={() => setShowSettings(false)} />}
      {showHelp && <HelpDialog onClose={() => setShowHelp(false)} />}
      {showLibrary && <AssetLibrary onClose={() => setShowLibrary(false)} />}
    </div>
  );
};

export default MenuBar;