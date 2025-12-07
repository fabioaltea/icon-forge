import React, { useState, useRef, useCallback, useEffect } from 'react';
import Cropper, { Area } from 'react-easy-crop';
import { Upload, X, RefreshCw, Download, Image as ImageIcon, Sparkles, Sliders } from 'lucide-react';
import { HistoryItem, PixelCrop } from './types';
import { getCroppedImg, convertPngToIco, downloadBlob } from './utils/imageUtils';
import HistorySidebar from './components/HistorySidebar';

function App() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<PixelCrop | null>(null);
  const [labelText, setLabelText] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  // Debounce preview generation to avoid lag while dragging
  useEffect(() => {
    const timer = setTimeout(() => {
      generatePreview();
    }, 150);
    return () => clearTimeout(timer);
  }, [croppedAreaPixels, labelText, imageSrc]);

  const onCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      // Basic Verification
      if (!file.type.startsWith('image/')) {
        alert('Per favore carica un file immagine valido (JPG, PNG, GIF).');
        return;
      }
      
      // Verification logic could be expanded here (e.g., checking min resolution)

      const reader = new FileReader();
      reader.addEventListener('load', () => {
        const result = reader.result?.toString() || null;
        startNewSession(result);
      });
      reader.readAsDataURL(file);
    }
  };

  const startNewSession = (src: string | null) => {
    setImageSrc(src);
    setLabelText('');
    setZoom(1);
    setCrop({ x: 0, y: 0 });
    setActiveSessionId(null);
  };

  const generatePreview = async () => {
    if (imageSrc && croppedAreaPixels) {
      try {
        const base64 = await getCroppedImg(imageSrc, croppedAreaPixels, labelText);
        setPreviewUrl(base64);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleSaveToHistory = async () => {
    if (!previewUrl || !imageSrc || !croppedAreaPixels) return;

    const newItem: HistoryItem = {
      id: activeSessionId || crypto.randomUUID(),
      originalImage: imageSrc,
      croppedImage: null, // Optimization: We could store it, but we have source + crop
      previewUrl: previewUrl,
      text: labelText,
      timestamp: Date.now(),
      cropArea: croppedAreaPixels
    };

    setHistory(prev => {
      // If editing existing, replace it, otherwise add to top
      const existingIndex = prev.findIndex(h => h.id === newItem.id);
      if (existingIndex >= 0) {
        const newHistory = [...prev];
        newHistory[existingIndex] = newItem;
        return newHistory;
      }
      return [newItem, ...prev];
    });

    // If it was a new session, now it has an ID
    if (!activeSessionId) {
        setActiveSessionId(newItem.id);
    }
  };

  const handleDownloadCurrent = () => {
    if (previewUrl) {
      // Ensure we save the latest state before downloading
      handleSaveToHistory();
      const icoBlob = convertPngToIco(previewUrl);
      downloadBlob(icoBlob, `browser-profile-${labelText || 'icon'}.ico`);
    }
  };

  const loadFromHistory = (item: HistoryItem) => {
    setImageSrc(item.originalImage);
    setLabelText(item.text);
    // Ideally we would restore zoom/crop position from state if we saved 'crop' and 'zoom' alongside pixels
    // For now we reset view but keep the data ready for processing
    setCroppedAreaPixels(item.cropArea);
    setActiveSessionId(item.id);
    setPreviewUrl(item.previewUrl);
    // Note: react-easy-crop doesn't easily support setting "pixels" back directly to view state 
    // without doing math to convert pixels back to percentage crop. 
    // We will just load the image. The user can re-crop if they want.
  };

  const deleteFromHistory = (id: string) => {
    setHistory(prev => prev.filter(i => i.id !== id));
    if (activeSessionId === id) {
      setActiveSessionId(null);
      setImageSrc(null);
      setPreviewUrl(null);
    }
  };

  return (
    <div className="flex h-screen w-screen bg-[#0f172a] text-slate-100 overflow-hidden">
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Header */}
        <header className="h-16 border-b border-slate-800 flex items-center justify-between px-6 bg-[#1e293b]">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Sparkles size={20} className="text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">IconForge</h1>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="md:hidden p-2 hover:bg-slate-700 rounded-md"
          >
            <HistoryItemIcon />
          </button>
        </header>

        {/* Workspace */}
        <main className="flex-1 relative bg-[#020617] overflow-hidden flex flex-col md:flex-row">
          
          {/* Editor Area */}
          <div className="flex-1 flex flex-col relative h-full">
            {!imageSrc ? (
              // Empty State / Upload
              <div className="flex-1 flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-700 m-8 rounded-2xl bg-slate-900/50 hover:bg-slate-900 transition-colors group">
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className="bg-slate-800 p-6 rounded-full mb-6 group-hover:scale-110 transition-transform">
                  <Upload size={48} className="text-blue-400" />
                </div>
                <h2 className="text-2xl font-semibold mb-2 text-white">Carica un'immagine</h2>
                <p className="text-slate-400 text-center max-w-md">
                  Trascina qui o clicca per caricare. Supportiamo JPG e PNG.
                  L'immagine verrà ritagliata in formato 1:1 automaticamente.
                </p>
              </div>
            ) : (
              // Cropper Interface
              <div className="flex-1 relative bg-black/50 backdrop-blur-sm m-4 rounded-xl border border-slate-700 overflow-hidden shadow-2xl">
                <div className="absolute inset-0">
                   <Cropper
                    image={imageSrc}
                    crop={crop}
                    zoom={zoom}
                    aspect={1}
                    onCropChange={setCrop}
                    onCropComplete={onCropComplete}
                    onZoomChange={setZoom}
                    objectFit="contain"
                    showGrid={true}
                  />
                </div>
                
                {/* Reset Button */}
                <button 
                  onClick={() => startNewSession(null)}
                  className="absolute top-4 left-4 z-20 bg-slate-900/90 text-white p-2 rounded-full hover:bg-red-600 transition-colors border border-slate-700"
                  title="Chiudi e Ricomincia"
                >
                  <X size={20} />
                </button>
              </div>
            )}

            {/* Controls Bar */}
            {imageSrc && (
              <div className="h-auto min-h-[80px] bg-[#1e293b] border-t border-slate-800 p-4 flex flex-col md:flex-row items-center gap-6 justify-between z-20">
                
                {/* Text Control */}
                <div className="flex items-center gap-4 w-full md:w-auto">
                  <div className="bg-slate-800 p-2 rounded-md">
                    <Sliders size={20} className="text-slate-400" />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-xs font-medium text-slate-400 mb-1 uppercase tracking-wider">
                      Etichetta (Max 3)
                    </label>
                    <input
                      type="text"
                      maxLength={3}
                      value={labelText}
                      onChange={(e) => setLabelText(e.target.value.slice(0, 3))}
                      placeholder="ES: DEV"
                      className="bg-slate-900 border border-slate-700 text-white px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 w-32 font-bold tracking-widest text-center uppercase"
                    />
                  </div>
                </div>

                {/* Zoom Control */}
                <div className="flex items-center gap-2 w-full md:w-64 px-4">
                  <span className="text-xs text-slate-500">Zoom</span>
                  <input
                    type="range"
                    value={zoom}
                    min={1}
                    max={3}
                    step={0.1}
                    aria-labelledby="Zoom"
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 w-full md:w-auto">
                   <button 
                    onClick={handleSaveToHistory}
                    className="flex-1 md:flex-none px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <RefreshCw size={18} />
                    <span className="hidden lg:inline">Salva Sessione</span>
                  </button>
                  <button 
                    onClick={handleDownloadCurrent}
                    className="flex-1 md:flex-none px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded font-medium shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
                  >
                    <Download size={18} />
                    <span>Scarica .ICO</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar - Preview & History */}
          <div className={`
            fixed md:relative right-0 top-0 bottom-0 w-80 bg-[#1e293b] border-l border-slate-800 transform transition-transform duration-300 z-30 flex flex-col
            ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0 md:w-0 md:opacity-0 md:overflow-hidden'}
          `}>
             <div className="p-4 bg-[#1e293b] border-b border-slate-800">
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Anteprima Attuale</h3>
                <div className="aspect-square w-full bg-[#0f172a] rounded-lg border-2 border-dashed border-slate-700 flex items-center justify-center relative overflow-hidden group">
                  {previewUrl ? (
                    <>
                      <img src={previewUrl} alt="Preview" className="w-full h-full object-contain p-2" />
                      <div className="absolute top-2 right-2 bg-black/70 px-2 py-1 rounded text-xs text-white">256x256</div>
                    </>
                  ) : (
                    <div className="text-slate-600 flex flex-col items-center">
                      <ImageIcon size={32} className="mb-2 opacity-50" />
                      <span className="text-xs">In attesa...</span>
                    </div>
                  )}
                </div>
             </div>

             <div className="flex-1 overflow-hidden">
                <HistorySidebar 
                  history={history} 
                  onSelect={loadFromHistory}
                  onDelete={deleteFromHistory}
                />
             </div>
          </div>

        </main>
      </div>
    </div>
  );
}

// Icon helper
const HistoryItemIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 3v5h5" />
    <path d="M3.05 13A9 9 0 1 0 6 5.3L3 8" />
    <path d="M12 7v5l4 2" />
  </svg>
);

export default App;
