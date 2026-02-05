import React, { useState, useEffect } from 'react';
import { X, Download, Plus, Trash2, Save, Loader2 } from 'lucide-react';
import FacturePreview from './FacturePreview';
import { exportElementToPdf } from '../../utils/pdfExport';

export default function FactureEditor({ client, onClose, savedData, onSave, onHistoryAdd }) {
  const safeString = (value, fallback = "") =>
    typeof value === "string" ? value : value == null ? fallback : String(value);
  
  const defaultData = {
    date: new Date().toLocaleDateString('fr-FR'),
    ref_facture: `FAC-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000)}`,
    client: client?.nom || "CLIENT INCONNU",
    adresse_client: "San Andreas",
    compte_bancaire: "5501",
    frais_taux: 0
  };

  const [data, setData] = useState(defaultData);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState("");
  const [items, setItems] = useState([
    { id: 1, description: "Honoraires de représentation (Forfait)", prix: 5000 },
  ]);

  useEffect(() => {
    if (savedData) {
      setData(prev => ({ ...prev, ...savedData }));
      if (savedData.items) setItems(savedData.items);
    }
  }, [savedData]);

  const [newItemDesc, setNewItemDesc] = useState("");
  const [newItemPrice, setNewItemPrice] = useState("");

  const sousTotal = items.reduce((acc, item) => acc + Number(item.prix), 0);
  const montantFrais = (sousTotal * (data.frais_taux || 0)) / 100;
  const totalFinal = sousTotal + montantFrais;

  const addItem = () => {
    if (!newItemDesc.trim() || !newItemPrice) return;
    const newItem = { id: Date.now(), description: newItemDesc, prix: Number(newItemPrice) };
    setItems([...items, newItem]);
    setNewItemDesc("");
    setNewItemPrice("");
  };

  const removeItem = (id) => {
    setItems(items.filter(i => i.id !== id));
  };

  const handleSave = () => {
    if (onSave) onSave({ ...data, items });
  };

  const handleDownloadPDF = async () => {
    if (isExporting) return;
    setIsExporting(true);
    setExportError("");

    handleSave();

    try {
      const factureRef = safeString(data.ref_facture, "FACTURE");
      await exportElementToPdf({
        elementId: 'facture-preview',
        filename: `FACTURE_${factureRef}.pdf`
      });
      if (onHistoryAdd) {
        await onHistoryAdd(
          "FACTURE",
          data.ref_facture,
          `Montant: ${totalFinal.toFixed(2)}$`,
          { ...data, items }
        );
      }
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
        <h2 className="text-neon-blue font-orbitron text-xl mb-6 pb-4 border-b border-gray-800">ÉDITER FACTURE</h2>
        <div className="space-y-5 font-mono text-sm">
            {/* ... Le reste du formulaire est identique ... */}
            <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-gray-500 text-[10px] mb-1 uppercase">Date</label><input type="text" value={data.date} onChange={e => setData({...data, date: e.target.value})} className="w-full bg-[#111] border border-gray-700 p-3 text-white focus:border-neon-blue outline-none" /></div>
                <div><label className="block text-gray-500 text-[10px] mb-1 uppercase">N° Facture</label><input type="text" value={data.ref_facture} onChange={e => setData({...data, ref_facture: e.target.value})} className="w-full bg-[#111] border border-gray-700 p-3 text-white focus:border-neon-blue outline-none" /></div>
            </div>
            <div><label className="block text-gray-500 text-[10px] mb-1 uppercase">Client</label><input type="text" value={data.client} onChange={e => setData({...data, client: e.target.value})} className="w-full bg-[#111] border border-gray-700 p-3 text-white focus:border-neon-blue outline-none font-bold" /></div>
            <div><label className="block text-gray-500 text-[10px] mb-1 uppercase">Adresse client</label><input type="text" value={data.adresse_client} onChange={e => setData({...data, adresse_client: e.target.value})} className="w-full bg-[#111] border border-gray-700 p-3 text-white focus:border-neon-blue outline-none" /></div>
            <div><label className="block text-neon-blue text-[10px] mb-1 uppercase">Compte Bancaire</label><input type="text" value={data.compte_bancaire} onChange={e => setData({...data, compte_bancaire: e.target.value})} className="w-full bg-[#111] border border-neon-blue text-neon-blue font-bold p-3 focus:border-white outline-none font-mono text-lg" placeholder="Ex: 5501"/></div>
            <hr className="border-gray-800"/>
            <div className="bg-gray-900/30 p-4 border border-gray-800 rounded">
                <label className="block text-gray-400 text-[10px] mb-3 uppercase font-bold">Prestations</label>
                <div className="flex gap-2 mb-4">
                    <input type="text" placeholder="Description" value={newItemDesc} onChange={(e) => setNewItemDesc(e.target.value)} className="flex-1 bg-black border border-gray-700 p-2 text-white text-xs focus:border-neon-blue outline-none"/>
                    <input type="number" placeholder="Prix" value={newItemPrice} onChange={(e) => setNewItemPrice(e.target.value)} className="w-20 bg-black border border-gray-700 p-2 text-white text-xs focus:border-neon-blue outline-none text-right"/>
                    <button onClick={addItem} className="bg-neon-blue text-black p-2 rounded-sm hover:bg-white transition-colors"><Plus size={16} /></button>
                </div>
                <div className="space-y-2 mt-2">
                    {items.map((item) => (
                        <div key={item.id} className="flex items-center justify-between bg-black border border-gray-800 p-2 text-xs">
                            <span className="text-gray-300 truncate w-2/3">{item.description}</span>
                            <div className="flex items-center gap-3"><span className="font-bold text-neon-blue">{item.prix} $</span><button onClick={() => removeItem(item.id)} className="text-gray-600 hover:text-red-500"><Trash2 size={14} /></button></div>
                        </div>
                    ))}
                </div>
            </div>
            <div><label className="block text-neon-blue text-[10px] mb-1 uppercase">Frais (%)</label><input type="number" value={data.frais_taux} onChange={e => setData({...data, frais_taux: e.target.value})} className="w-full bg-[#111] border border-neon-blue/50 text-white font-bold p-3 focus:border-neon-blue outline-none" /></div>
            <div className="mt-4 pt-4 border-t border-gray-700 flex justify-between items-center bg-gray-900/50 p-3 rounded">
                <span className="text-gray-400 uppercase text-xs">Total Final</span>
                <span className="text-xl font-bold font-orbitron text-white">{totalFinal.toFixed(2)} $</span>
            </div>
            <button
              onClick={handleDownloadPDF}
              disabled={isExporting}
              className={`w-full py-4 bg-neon-blue text-black font-orbitron font-bold flex justify-center gap-2 transition-colors mt-8 shadow-[0_0_20px_rgba(0,243,255,0.3)] ${isExporting ? 'opacity-70 cursor-wait' : 'hover:bg-white'}`}
            >
              {isExporting ? <Loader2 size={20} className="animate-spin" /> : <Download size={20} />}
              {isExporting ? 'GÉNÉRATION DU PDF...' : 'ÉMETTRE LA FACTURE'}
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
        <FacturePreview data={data} items={items} sousTotal={sousTotal} montantFrais={montantFrais} totalFinal={totalFinal} />
      </div>
    </div>
  );
}
