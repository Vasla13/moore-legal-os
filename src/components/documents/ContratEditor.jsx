import React, { useState, useEffect } from 'react';
import { X, Download, Save } from 'lucide-react';
import ContratPreview from './ContratPreview';

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

  useEffect(() => {
    if (savedData) setData(savedData);
  }, [savedData]);

  const handleSave = () => {
    if (onSave) onSave(data);
  };

  const handleDownloadPDF = async () => {
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
    const element = document.getElementById('contrat-preview');
    if (!element) return;
    const { default: html2pdf } = await import('html2pdf.js');
    const clientName = safeString(data.client, "");
    const opt = {
      margin: 0,
      filename: `CONTRAT_${clientName.replace(/ /g, '_')}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, backgroundColor: '#000000', logging: false },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(element).save();
  };

  return (
    <div className="fixed inset-0 z-50 flex bg-black/95 backdrop-blur-md overflow-hidden animate-[fadeIn_0.2s_ease-out]">
      <div className="absolute top-4 right-4 z-50 flex gap-2">
         <button onClick={handleSave} className="bg-black border border-green-700 text-green-500 p-2 rounded-full hover:bg-green-500 hover:text-black transition-all"><Save size={24} /></button>
         <button onClick={onClose} className="bg-black border border-gray-700 p-2 rounded-full text-white hover:text-red-500 hover:border-red-500 transition-all"><X size={24} /></button>
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
            <button onClick={handleDownloadPDF} className="w-full py-4 bg-neon-blue text-black font-orbitron font-bold flex justify-center gap-2 hover:bg-white transition-colors mt-8 shadow-[0_0_20px_rgba(0,243,255,0.3)]"><Download size={20} /> ENREGISTRER & IMPRIMER</button>
        </div>
      </div>
      <div className="w-2/3 bg-[#151515] flex justify-center overflow-y-auto p-10">
        <ContratPreview data={data} />
      </div>
    </div>
  );
}
