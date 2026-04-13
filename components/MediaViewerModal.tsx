/**
 * @fileoverview Modal de visualisation de médias — Edunet / UOB.
 * @author Roland Myaka
 */
import React, { useEffect } from 'react';
import { X, Download } from 'lucide-react';

interface Props { mediaUrl: string; mediaType: string; fileName: string; onClose: () => void; }

const MediaViewerModal: React.FC<Props> = ({ mediaUrl, mediaType, fileName, onClose }) => {
  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', fn);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', fn); document.body.style.overflow = 'auto'; };
  }, [onClose]);

  const handleDownload = async () => {
    try {
      const res = await fetch(mediaUrl);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = fileName || 'download';
      document.body.appendChild(a); a.click();
      window.URL.revokeObjectURL(url); a.remove();
    } catch { alert('Téléchargement échoué.'); }
  };

  return (
    <div className="fixed inset-0 w-screen h-screen bg-black/80 z-[100] flex flex-col justify-center items-center backdrop-blur-sm" onClick={onClose}>
      <div className="absolute top-0 right-0 p-4 flex items-center space-x-4 z-[110]">
        <button onClick={handleDownload} className="text-white hover:text-gray-300 p-2 bg-black/30 rounded-full"><Download size={24} /></button>
        <button onClick={onClose} className="text-white hover:text-gray-300 p-2 bg-black/30 rounded-full"><X size={24} /></button>
      </div>
      <div className="relative w-full h-full flex items-center justify-center p-8" onClick={e => e.stopPropagation()}>
        {mediaType.startsWith('image/') ? (
          <img src={mediaUrl} alt="Vue plein écran" className="max-w-full max-h-full object-contain" />
        ) : (
          <div className="text-white text-center bg-gray-800 p-8 rounded-lg">
            <h2 className="text-2xl font-bold mb-4">Aperçu non disponible</h2>
            <button onClick={handleDownload} className="bg-uob-blue text-white font-semibold py-3 px-6 rounded-lg flex items-center mx-auto space-x-2">
              <Download size={20}/><span>Télécharger {fileName}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
export default MediaViewerModal;
