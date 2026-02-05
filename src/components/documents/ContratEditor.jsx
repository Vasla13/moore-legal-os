import React, { useState, useEffect } from 'react';
import { X, Download, Save, Loader2 } from 'lucide-react';
import ContratPreview from './ContratPreview';
import { exportElementToPdf } from '../../utils/pdfExport';

export default function ContratEditor({ client, onClose, savedData, onSave, onHistoryAdd }) {
  const safeString = (value, fallback = "") =>
    typeof value === "string" ? value : value == null ? fallback : String(value);
  const clientIdRef = client?.id ? client.id.substring(0, 4).toUpperCase() : "0000";

  const defaultData = {
    date: new Date().toLocaleDateString('fr-FR'),
    ref_dossier: `REF-${clientIdRef}`,
    avocat: "Maître Moore",
    client: client?.nom || "CLIENT INCONNU",
    objet: "Défense dans le cadre de l'affaire pénale...",
    montant: "15 000",
    conditions_paiement: "50% avant l'audience, 50% après verdict."
  };

  const [data, setData] = useState(defaultData);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState("");

  useEffect(() => {
    if (savedData) setData(savedData);
  }, [savedData]);

  const handleSave = () => {
    if (onSave) onSave(data);
  };

  const handleDownloadPDF = async () => {
    if (isExporting) return;
    setIsExporting(true);
    setExportError("");

    // 1. Sauvegarde
    handleSave();

    // 2. Historique (NOUVEAU)
    if (onHistoryAdd) {
        onHistoryAdd(
          "CONTRAT",
          data.ref_dossier,
          "Mandat de défense",
          { ...data }
        );
    }

    // 3. PDF
    try {
      const clientName = safeString(data.client, "");
      await exportElementToPdf({
        elementId: 'contrat-preview',
        filename: `CONTRAT_${clientName.replace(/\s+/g, '_')}.pdf`
      });
    } catch (err) {
      console.error(err);
      setExportError("Échec de génération du PDF. Réessaie dans quelques secondes.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex bg-black/95 backdrop-blur-md overflow-hidden animate-[fadeIn_0.2s_ease-out]">
      <div className="absolute top-4 right-4 z-50 flex gap-2">
         <button
           onClick={handleSave}
           disabled={isExporting}
           className={`bg-black border border-green-700 text-green-500 p-2 rounded-full transition-all ${isExporting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-500 hover:text-black'}`}
         >
           <Save size={24} />
         </button>
         <button
           onClick={onClose}
           disabled={isExporting}
           className={`bg-black border border-gray-700 p-2 rounded-full text-white transition-all ${isExporting ? 'opacity-50 cursor-not-allowed' : 'hover:text-red-500 hover:border-red-500'}`}
         >
           <X size={24} />
         </button>
      </div>

      <div className="w-1/3 border-r border-gray-800 p-6 overflow-y-auto custom-scrollbar bg-[#050505]">
        <h2 className="text-neon-blue font-orbitron text-xl mb-6 pb-4 border-b border-gray-800">ÉDITER CONTRAT</h2>
        <div className="space-y-5 font-mono text-sm">
            <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-gray-500 text-[10px] mb-1 uppercase">Date</label><input type="text" value={data.date} onChange={e => setData({...data, date: e.target.value})} className="w-full bg-[#111] border border-gray-700 p-3 text-white focus:border-neon-blue outline-none" /></div>
                <div><label className="block text-gray-500 text-[10px] mb-1 uppercase">Référence</label><input type="text" value={data.ref_dossier} onChange={e => setData({...data, ref_dossier: e.target.value})} className="w-full bg-[#111] border border-gray-700 p-3 text-white focus:border-neon-blue outline-none" /></div>
            </div>
            <div><label className="block text-gray-500 text-[10px] mb-1 uppercase">Client</label><input type="text" value={data.client} onChange={e => setData({...data, client: e.target.value})} className="w-full bg-[#111] border border-gray-700 p-3 text-white focus:border-neon-blue outline-none font-bold" /></div>
            <div><label className="block text-neon-blue text-[10px] mb-1 uppercase">Objet</label><textarea value={data.objet} onChange={e => setData({...data, objet: e.target.value})} className="w-full h-24 bg-[#111] border border-gray-700 p-3 text-white focus:border-neon-blue outline-none resize-none" /></div>
            <hr className="border-gray-800"/>
            <div><label className="block text-green-500 text-[10px] mb-1 uppercase">Honoraires ($)</label><input type="text" value={data.montant} onChange={e => setData({...data, montant: e.target.value})} className="w-full bg-[#111] border border-green-900 text-green-400 font-bold text-lg p-3 focus:border-green-500 outline-none" /></div>
            <div><label className="block text-gray-500 text-[10px] mb-1 uppercase">Paiement</label><input type="text" value={data.conditions_paiement} onChange={e => setData({...data, conditions_paiement: e.target.value})} className="w-full bg-[#111] border border-gray-700 p-3 text-white focus:border-neon-blue outline-none" /></div>
            <button
              onClick={handleDownloadPDF}
              disabled={isExporting}
              className={`w-full py-4 bg-neon-blue text-black font-orbitron font-bold flex justify-center gap-2 transition-colors mt-8 shadow-[0_0_20px_rgba(0,243,255,0.3)] ${isExporting ? 'opacity-70 cursor-wait' : 'hover:bg-white'}`}
            >
              {isExporting ? <Loader2 size={20} className="animate-spin" /> : <Download size={20} />}
              {isExporting ? 'GÉNÉRATION DU PDF...' : 'ENREGISTRER & IMPRIMER'}
            </button>
            {exportError && <p className="text-red-500 text-xs font-mono mt-3">{exportError}</p>}
        </div>
      </div>
      <div className="relative w-2/3 bg-[#151515] flex justify-center overflow-y-auto p-10">
        {isExporting && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/70 text-neon-blue font-mono text-xs uppercase tracking-widest">
            Préparation du PDF...
          </div>
        )}
        <ContratPreview data={data} />
      </div>
    </div>
  );
}
