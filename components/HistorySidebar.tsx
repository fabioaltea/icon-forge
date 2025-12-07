import React from 'react';
import { HistoryItem } from '../types';
import { Download, Edit2, Trash2, Clock } from 'lucide-react';
import { convertPngToIco, downloadBlob } from '../utils/imageUtils';

interface HistorySidebarProps {
  history: HistoryItem[];
  onSelect: (item: HistoryItem) => void;
  onDelete: (id: string) => void;
}

const HistorySidebar: React.FC<HistorySidebarProps> = ({ history, onSelect, onDelete }) => {
  const handleDownload = (e: React.MouseEvent, item: HistoryItem) => {
    e.stopPropagation();
    const icoBlob = convertPngToIco(item.previewUrl);
    downloadBlob(icoBlob, `icon-${item.text || 'profile'}.ico`);
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    onDelete(id);
  };

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-500 p-6 text-center">
        <Clock className="w-12 h-12 mb-4 opacity-50" />
        <p>Nessuno storico disponibile.</p>
        <p className="text-sm mt-2">Le tue icone generate appariranno qui.</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4">
      <h2 className="text-lg font-bold text-slate-200 mb-4 sticky top-0 bg-[#1e293b] py-2 z-10">
        Storico Generazioni
      </h2>
      {history.map((item) => (
        <div 
          key={item.id} 
          onClick={() => onSelect(item)}
          className="bg-slate-800 rounded-lg p-3 flex items-center gap-4 hover:bg-slate-700 transition-colors cursor-pointer border border-slate-700 hover:border-blue-500 group"
        >
          <div className="relative w-16 h-16 bg-slate-900 rounded-md overflow-hidden flex-shrink-0 border border-slate-600">
            <img src={item.previewUrl} alt="Icon" className="w-full h-full object-contain" />
          </div>
          
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-200 truncate">
              {item.text ? `Label: "${item.text}"` : 'Senza etichetta'}
            </p>
            <p className="text-xs text-slate-400">
              {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>

          <div className="flex flex-col gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
            <button 
              onClick={(e) => handleDownload(e, item)}
              className="p-1.5 bg-blue-600 rounded text-white hover:bg-blue-500 transition-colors"
              title="Scarica .ICO"
            >
              <Download size={14} />
            </button>
            <button 
              onClick={(e) => handleDelete(e, item.id)}
              className="p-1.5 bg-red-900/50 text-red-400 rounded hover:bg-red-900 transition-colors"
              title="Elimina"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default HistorySidebar;
