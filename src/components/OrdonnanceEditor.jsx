import React, { useState, useEffect } from 'react';
import { X, Save, Loader2 } from 'lucide-react';
import OrdonnanceForm from './documents/OrdonnanceForm';
import OrdonnancePreview from './documents/OrdonnancePreview';
import { exportElementToPdf } from '../utils/pdfExport';

export default function OrdonnanceEditor({ client, onClose, savedData, onSave, onHistoryAdd }) {
  const safeString = (value, fallback = "") =>
    typeof value === "string" ? value : value == null ? fallback : String(value);
  const [logo, setLogo] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState("");
  
  const defaultData = {
    date: new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' }),
    avocat: "Maître Moore",
    victime: client?.nom || "CLIENT INCONNU",
    accuse: "NOM DE L'ACCUSÉ",
    juge: "Valerio Pozzano",
    titre_faits: "Vu les faits de menaces de mort répétées et de harcèlement,",
    titre_considerant: "Considérant la nécessité impérieuse de garantir la sécurité physique et morale de la victime,",
    duree: "un (1) mois",
    decision_texte: "fait l’objet d’une mesure d’éloignement immédiate, à compter de la notification de la présente ordonnance.",
    interdictions: `S'approcher à moins de 50 mètres de la victime ;\nEntrer en contact par tout moyen ;\nPosséder une arme à feu.`
  };

  const [data, setData] = useState(defaultData);

  useEffect(() => {
    if (savedData) {
      setData(savedData);
      if (savedData.logo) setLogo(savedData.logo);
    }
  }, [savedData]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => setLogo(event.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    if (onSave) onSave({ ...data, logo: logo });
  };

  const handleDownloadPDF = async () => {
    if (isExporting) return;
    setIsExporting(true);
    setExportError("");

    // 1. Sauvegarde
    handleSave();

    // 2. PDF
    try {
      const accuseName = safeString(data.accuse, "");
      await exportElementToPdf({
        elementId: 'document-preview',
        filename: `ORDONNANCE_${accuseName.replace(/\s+/g, '_')}.pdf`
      });
      // 3. Historique (uniquement si PDF OK)
      if (onHistoryAdd) {
        await onHistoryAdd(
          "ORDONNANCE",
          `CASE-${client?.id?.substring(0,4)}`,
          "Mesure éloignement",
          { ...data, logo: logo }
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

      <OrdonnanceForm 
        data={data} setData={setData} logo={logo} handleImageUpload={handleImageUpload} 
        onDownload={handleDownloadPDF}
        isExporting={isExporting}
      />
      {exportError && (
        <div className="absolute left-1/2 top-4 -translate-x-1/2 z-50 bg-red-500/20 text-red-400 border border-red-500/40 px-4 py-2 text-xs font-mono uppercase tracking-widest">
          {exportError}
        </div>
      )}

      <div className="relative w-2/3 bg-[#151515] flex justify-center overflow-y-auto p-10">
        {isExporting && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/70 text-neon-blue font-mono text-xs uppercase tracking-widest gap-2">
            <Loader2 size={20} className="animate-spin" />
            Préparation du PDF...
          </div>
        )}
        <OrdonnancePreview data={data} logo={logo} />
      </div>
    </div>
  );
}
