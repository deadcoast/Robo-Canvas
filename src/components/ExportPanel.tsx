import { saveAs } from 'file-saver';
import { Code, FileText, Image, Terminal } from 'lucide-react';
import React from 'react';
import { useEditorStore } from '../store/editorStore';
import { exportToAnsi, exportToGif, exportToHtml, exportToSvg } from '../utils/exporters';

const ExportPanel: React.FC = () => {
  const {
    exportToText,
    exportToImage,
    layers,
    fontSize,
  } = useEditorStore(state => ({ 
    exportToText: state.exportToText, 
    exportToImage: state.exportToImage,
    layers: state.layers,
    fontSize: state.fontSize
  }));
  
  // Re-use handlers similar to MenuBar
  const handleExportText = () => {
    try {
      const content = exportToText();
      const blob = new Blob([content], { type: 'text/plain' });
      saveAs(blob, 'ascii-art.txt');
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
    } catch (error) {
      console.error('Failed to export SVG:', error);
      alert('Failed to export SVG. Please try again.');
    }
  };

  const handleExportGif = async () => {
    try {
      const blob = await exportToGif(layers, fontSize);
       if(blob) {
         saveAs(blob, 'ascii-art.gif');
       } else {
         throw new Error('GIF generation failed');
       }
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
    } catch (error) {
      console.error('Failed to export ANSI:', error);
      alert('Failed to export ANSI. Please try again.');
    }
  };

  return (
    <div className="p-4 border-t border-gray-200">
      <h3 className="font-medium text-sm mb-3">Export</h3>
      <div className="grid grid-cols-2 gap-2">
        <button onClick={handleExportText} className="flex items-center justify-center gap-2 px-3 py-2 border rounded hover:bg-gray-50 text-sm">
          <FileText size={16} /> Text (.txt)
        </button>
        <button onClick={handleExportHtml} className="flex items-center justify-center gap-2 px-3 py-2 border rounded hover:bg-gray-50 text-sm">
          <Code size={16} /> HTML
        </button>
        <button onClick={handleExportImage} className="flex items-center justify-center gap-2 px-3 py-2 border rounded hover:bg-gray-50 text-sm">
          <Image size={16} /> PNG
        </button>
        <button onClick={handleExportGif} className="flex items-center justify-center gap-2 px-3 py-2 border rounded hover:bg-gray-50 text-sm">
          <Image size={16} /> GIF
        </button>
        <button onClick={handleExportSVG} className="flex items-center justify-center gap-2 px-3 py-2 border rounded hover:bg-gray-50 text-sm">
          <Image size={16} /> SVG
        </button>
        <button onClick={handleExportAnsi} className="flex items-center justify-center gap-2 px-3 py-2 border rounded hover:bg-gray-50 text-sm">
          <Terminal size={16} /> ANSI
        </button>
        {/* Add more export options or settings if needed */}
      </div>
    </div>
  );
};

export default ExportPanel; 