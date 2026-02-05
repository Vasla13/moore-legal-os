import React, { useState, useEffect } from 'react';
import { X, Download, Plus, Trash2, Image as ImageIcon, Save } from 'lucide-react';
import PlaintePreview from './PlaintePreview';

export default function PlainteEditor({ client, onClose, savedData, onSave, onHistoryAdd }) {
  
  // --- DONNÉES PAR DÉFAUT (Génériques) ---
  const defaultData = {
    date: new Date().toLocaleDateString('fr-FR'),
    ref_dossier: `P-${client?.id?.substring(0,4).toUpperCase() || "0000"}`,
    avocat: "Maître Moore",
    victime: client?.nom || "NOM DU CLIENT",
    accuse: "X (Ou Nom de l'accusé)",
    // ICI : Texte générique à trous
    faits: "Le [DATE] aux alentours de [HEURE], mon client se trouvait à [LIEU].\n\nIl a été approché par l'individu susnommé qui a procédé à [DÉCRIRE LES FAITS]...\n\nCes agissements ont causé [DÉCRIRE LES DOMMAGES OU CONSÉQUENCES].",
    infractions: "• [Inscrire le délit ici]\n• [Inscrire le crime ici]",
  };

  const [data, setData] = useState(defaultData);
  
  // Pièces par défaut (Vide ou exemple générique)
  const [pieces, setPieces] = useState([
    { id: 1, description: "Certificat Médical (Exemple)", image: null }
  ]);

  // --- CHARGEMENT SAUVEGARDE ---
  useEffect(() => {
    if (savedData) {
      setData(prev => ({ ...prev, ...savedData }));
      if (savedData.pieces) setPieces(savedData.pieces);
    }
  }, [savedData]);

  // --- GESTION PIÈCES ---
  const [newPieceDesc, setNewPieceDesc] = useState("");
  const [newPieceImage, setNewPieceImage] = useState(null);

  const handleTempImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => setNewPieceImage(event.target.result);
      reader.readAsDataURL(file);
    }
  };

  const addPiece = () => {
    if (!newPieceDesc.trim()) return;
    const newId = pieces.length + 1;
    const newPiece = { id: newId, description: newPieceDesc, image: newPieceImage };
    setPieces([...pieces, newPiece]);
    setNewPieceDesc("");
    setNewPieceImage(null);
  };

  const removePiece = (idToRemove) => {
    const updated = pieces.filter(p => p.id !== idToRemove);
    const reindexed = updated.map((p, index) => ({ ...p, id: index + 1 }));
    setPieces(reindexed);
  };

  // --- SAUVEGARDE ---
  const handleSave = () => {
    if (onSave) onSave({ ...data, pieces });
  };

  // --- GÉNÉRATION PDF & HISTORIQUE ---
  const handleDownloadPDF = async () => {
    // 1. Sauvegarder
    handleSave();

    // 2. Historique
    if (onHistoryAdd) {
        onHistoryAdd(
            "PLAINTE", 
            data.ref_dossier, 
            `Contre: ${data.accuse}`,
            { ...data, pieces } // On sauvegarde tout le contenu pour pouvoir le recharger
        );
    }

    // 3. PDF
    const element = document.getElementById('plainte-preview');
    if (!element) return;
    const { default: html2pdf } = await import('html2pdf.js');
    const opt = {
      margin: 0,
      filename: `PLAINTE_${data.victime.replace(/ /g, '_')}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, backgroundColor: '#000000', logging: false },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(element).save();
  };

  return (
    <div className="fixed inset-0 z-50 flex bg-black/95 backdrop-blur-md overflow-hidden animate-[fadeIn_0.2s_ease-out]">
      
      {/* Header Boutons */}
      <div className="absolute top-4 right-4 z-50 flex gap-2">
         <button onClick={handleSave} className="bg-black border border-green-700 text-green-500 p-2 rounded-full hover:bg-green-500 hover:text-black transition-all" title="Sauvegarder"><Save size={24} /></button>
         <button onClick={onClose} className="bg-black border border-gray-700 p-2 rounded-full text-white hover:text-red-500 hover:border-red-500 transition-all"><X size={24} /></button>
      </div>

      {/* --- COLONNE GAUCHE : FORMULAIRE --- */}
      <div className="w-1/3 border-r border-gray-800 p-6 overflow-y-auto custom-scrollbar bg-[#050505]">
        <h2 className="text-neon-blue font-orbitron text-xl mb-6 pb-4 border-b border-gray-800">DÉPÔT DE PLAINTE</h2>

        <div className="space-y-5 font-mono text-sm">
            
            <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-gray-500 text-[10px] mb-1 uppercase">Date</label><input type="text" value={data.date} onChange={e => setData({...data, date: e.target.value})} className="w-full bg-[#111] border border-gray-700 p-3 text-white focus:border-neon-blue outline-none" /></div>
                <div><label className="block text-gray-500 text-[10px] mb-1 uppercase">Référence</label><input type="text" value={data.ref_dossier} onChange={e => setData({...data, ref_dossier: e.target.value})} className="w-full bg-[#111] border border-gray-700 p-3 text-white focus:border-neon-blue outline-none" /></div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-gray-500 text-[10px] mb-1 uppercase">Plaignant</label><input type="text" value={data.victime} onChange={e => setData({...data, victime: e.target.value})} className="w-full bg-[#111] border border-gray-700 p-3 text-white focus:border-neon-blue outline-none font-bold" /></div>
                <div><label className="block text-red-500/70 text-[10px] mb-1 uppercase">Accusé</label><input type="text" value={data.accuse} onChange={e => setData({...data, accuse: e.target.value})} className="w-full bg-[#111] border border-gray-700 p-3 text-white focus:border-red-500 outline-none font-bold" /></div>
            </div>

            <hr className="border-gray-800"/>

            <div>
                <label className="block text-neon-blue text-[10px] mb-1 uppercase">I. Exposé des faits</label>
                <textarea value={data.faits} onChange={e => setData({...data, faits: e.target.value})} className="w-full h-32 bg-[#111] border border-gray-700 p-3 text-white focus:border-neon-blue outline-none resize-none leading-relaxed" />
            </div>

            <div>
                <label className="block text-red-400 text-[10px] mb-1 uppercase">II. Infractions (Liste)</label>
                <textarea value={data.infractions} onChange={e => setData({...data, infractions: e.target.value})} className="w-full h-20 bg-[#111] border border-gray-700 p-3 text-white focus:border-neon-blue outline-none resize-none" />
            </div>

            {/* GESTION PIÈCES */}
            <div className="bg-gray-900/30 p-4 border border-gray-800 rounded">
                <label className="block text-neon-blue text-[10px] mb-3 uppercase font-bold">III. Ajouter une Pièce / Preuve</label>
                
                <div className="flex flex-col gap-3 mb-4">
                    <input type="text" placeholder="Description (ex: Photo blessure)" value={newPieceDesc} onChange={(e) => setNewPieceDesc(e.target.value)} className="w-full bg-black border border-gray-700 p-2 text-white text-xs focus:border-neon-blue outline-none"/>
                    
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <input type="file" id="piece-img" className="hidden" accept="image/*" onChange={handleTempImageUpload} />
                            <label htmlFor="piece-img" className={`flex items-center justify-center gap-2 p-2 border border-dashed cursor-pointer transition-colors text-xs ${newPieceImage ? 'border-green-500 text-green-500 bg-green-500/10' : 'border-gray-600 text-gray-500 hover:border-gray-400'}`}>
                                <ImageIcon size={14} /> {newPieceImage ? "Image chargée" : "Lier une image"}
                            </label>
                        </div>
                        <button onClick={addPiece} className="bg-neon-blue text-black p-2 font-bold text-xs uppercase hover:bg-white transition-colors flex items-center gap-1"><Plus size={14} /> Ajouter</button>
                    </div>
                </div>

                <div className="space-y-2 mt-4">
                    {pieces.map((p) => (
                        <div key={p.id} className="flex items-center justify-between bg-black border border-gray-800 p-2">
                            <div className="flex items-center gap-3">
                                <span className="text-neon-blue font-mono font-bold text-xs">#{p.id}</span>
                                <div className="flex flex-col">
                                    <span className="text-xs text-white">{p.description}</span>
                                    {p.image && <span className="text-[10px] text-green-500 flex items-center gap-1"><ImageIcon size={10}/> Image jointe</span>}
                                </div>
                            </div>
                            <button onClick={() => removePiece(p.id)} className="text-gray-600 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                        </div>
                    ))}
                </div>
            </div>

            <button onClick={handleDownloadPDF} className="w-full py-4 bg-neon-blue text-black font-orbitron font-bold flex justify-center gap-2 hover:bg-white transition-colors mt-8 shadow-[0_0_20px_rgba(0,243,255,0.3)]">
                <Download size={20} /> ÉMETTRE LA PLAINTE
            </button>
        </div>
      </div>

      {/* --- COLONNE DROITE : APERÇU --- */}
      <div className="w-2/3 bg-[#151515] flex justify-center overflow-y-auto p-10">
        <PlaintePreview data={data} pieces={pieces} />
      </div>

    </div>
  );
}
