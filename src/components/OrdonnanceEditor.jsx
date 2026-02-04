import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import html2pdf from 'html2pdf.js';
import OrdonnanceForm from './documents/OrdonnanceForm';
import OrdonnancePreview from './documents/OrdonnancePreview';

export default function OrdonnanceEditor({ client, onClose, savedData, onSave, onHistoryAdd }) {
  const [logo, setLogo] = useState(null);
  
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
    interdictions: `• S'approcher à moins de 50 mètres de la victime ;\n• Entrer en contact par tout moyen ;\n• Posséder une arme à feu.`
  };

  const [data, setData] = useState(defaultData);

  useEffect(() => {
    if (savedData) setData(savedData);
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

  const handleDownloadPDF = () => {
    // 1. Sauvegarde
    handleSave();

    // 2. Historique (NOUVEAU)
    if (onHistoryAdd) {
        onHistoryAdd("ORDONNANCE", `CASE-${client?.id?.substring(0,4)}`, `Mesure éloignement`);
    }

    // 3. PDF
    const element = document.getElementById('document-preview');
    const opt = {
      margin: 0,
      filename: `ORDONNANCE_${data.accuse.replace(/ /g, '_')}.pdf`,
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

      <OrdonnanceForm 
        data={data} setData={setData} logo={logo} handleImageUpload={handleImageUpload} 
        onDownload={handleDownloadPDF} 
      />

      <div className="w-2/3 bg-[#151515] flex justify-center overflow-y-auto p-10">
        <OrdonnancePreview data={data} logo={logo} />
      </div>
    </div>
  );
}