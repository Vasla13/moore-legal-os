import React, { useEffect, useState } from 'react';

export default function FacturePreview({ data, items, sousTotal, montantFrais, totalFinal }) {
  const safeString = (value, fallback = "") =>
    typeof value === "string" ? value : value == null ? fallback : String(value);
  const safeItems = Array.isArray(items) ? items : [];
  const safeSousTotal = Number.isFinite(sousTotal) ? sousTotal : 0;
  const safeMontantFrais = Number.isFinite(montantFrais) ? montantFrais : 0;
  const safeTotalFinal = Number.isFinite(totalFinal) ? totalFinal : 0;
  const d = data ?? {};
  const montantText = `${safeTotalFinal.toFixed(2)} $`;

  const [montantPng, setMontantPng] = useState("");

  useEffect(() => {
    if (typeof document === "undefined") return;
    let active = true;
    const render = () => {
      const scale = 2;
      const width = 160;
      const height = 56;
      const canvas = document.createElement('canvas');
      canvas.width = width * scale;
      canvas.height = height * scale;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.scale(scale, scale);
      ctx.clearRect(0, 0, width, height);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#6b7280';
      ctx.font = '10px "Rajdhani", sans-serif';
      ctx.fillText('MONTANT DU', width / 2, 18);
      ctx.fillStyle = '#00f3ff';
      ctx.font = '20px "Orbitron", sans-serif';
      ctx.fillText(montantText, width / 2, 40);
      if (active) {
        setMontantPng(canvas.toDataURL('image/png'));
      }
    };

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(render).catch(render);
    } else {
      render();
    }

    return () => {
      active = false;
    };
  }, [montantText]);

  return (
    <div 
      id="facture-preview" 
      className="w-[210mm] h-[297mm] bg-black text-white relative shadow-2xl flex flex-col font-rajdhani"
      style={{ 
        padding: '20mm',
        backgroundImage: 'radial-gradient(circle at center, #0a0a0a 0%, #000 100%)',
        boxSizing: 'border-box'
      }}
    >
      {/* Décoration de fond */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-neon-blue opacity-5 rounded-bl-full pointer-events-none"></div>

      {/* --- EN-TÊTE --- */}
      <div className="flex justify-between items-start mb-12 border-b border-gray-800 pb-6 relative z-10">
         <div>
             <h1 className="text-4xl font-orbitron font-bold tracking-widest text-white uppercase mb-1">
                FACTURE
             </h1>
             <p className="font-mono text-neon-blue text-sm tracking-widest">#{safeString(d.ref_facture, "")}</p>
         </div>
         <div className="text-right">
             <h2 className="font-bold text-lg text-white">MOORE LEGAL</h2>
             <p className="font-mono text-gray-400 text-xs">Services Juridiques & Conseil</p>
             <p className="font-mono text-gray-400 text-xs">Los Santos, San Andreas</p>
             <p className="font-mono text-white text-sm mt-2 font-bold">Date: {safeString(d.date, "")}</p>
         </div>
      </div>

      {/* --- INFOS CLIENT --- */}
      <div className="flex justify-between items-center mb-10 relative z-10">
        <div className="w-1/2">
            <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">FACTURÉ À :</p>
            <p className="text-xl font-bold text-white uppercase">{safeString(d.client, "")}</p>
            <p className="text-sm text-gray-400 font-mono">{safeString(d.adresse_client, "")}</p>
        </div>
        <div className="w-1/2 text-right">
             <div className="relative inline-block bg-gray-900 border border-gray-700 p-4 rounded text-center min-w-[150px] min-h-[56px]">
                <div className="pdf-amount-text">
                  <p className="text-xs text-gray-500 uppercase">MONTANT DU</p>
                  <p className="text-2xl font-bold text-neon-blue font-orbitron">
                    {montantText}
                  </p>
                </div>
                {montantPng && (
                  <img
                    src={montantPng}
                    alt="Montant du"
                    className="pdf-amount-image absolute inset-0 m-auto"
                    width={160}
                    height={56}
                  />
                )}
             </div>
        </div>
      </div>

      {/* --- TABLEAU DES PRESTATIONS --- */}
      <div className="flex-1 relative z-10">
        <table className="w-full text-left border-collapse">
            <thead>
                <tr className="border-b-2 border-neon-blue text-neon-blue font-orbitron text-xs uppercase">
                    <th className="py-3 w-3/4">Description de la prestation</th>
                    <th className="py-3 text-right">Prix</th>
                </tr>
            </thead>
            <tbody className="font-mono text-sm text-gray-300">
                {safeItems.map((item) => (
                    <tr key={item.id} className="border-b border-gray-800">
                        <td className="py-4 pr-4">{item.description}</td>
                        <td className="py-4 text-right text-white font-bold">{Number(item.prix).toFixed(2)} $</td>
                    </tr>
                ))}
                {/* Lignes vides pour remplir l'espace visuellement */}
                {[...Array(3)].map((_, i) => (
                    <tr key={`empty-${i}`} className="border-b border-gray-900/50">
                        <td className="py-4">&nbsp;</td>
                        <td className="py-4">&nbsp;</td>
                    </tr>
                ))}
            </tbody>
        </table>
      </div>

      {/* --- TOTAUX & PAIEMENT --- */}
      <div className="mt-auto relative z-10">
        <div className="flex justify-end mb-8">
            <div className="w-1/2">
                <div className="flex justify-between py-2 border-b border-gray-800 text-gray-400 text-sm">
                    <span>SOUS-TOTAL</span>
                    <span>{safeSousTotal.toFixed(2)} $</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-800 text-gray-400 text-sm">
                    {/* Le taux est maintenant dynamique */}
                    <span>FRAIS DE DOSSIER ({safeString(d.frais_taux, "0")}%)</span>
                    <span>{safeMontantFrais.toFixed(2)} $</span>
                </div>
                <div className="flex justify-between py-4 text-xl font-bold text-white font-orbitron">
                    <span>TOTAL À PAYER</span>
                    <span className="text-neon-blue">{safeTotalFinal.toFixed(2)} $</span>
                </div>
            </div>
        </div>

        {/* Info Banque */}
        <div className="bg-gray-900/50 p-6 border-l-4 border-neon-blue flex justify-between items-center">
            <div>
                <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">INFORMATIONS DE PAIEMENT (VIREMENT)</p>
                <p className="text-sm font-bold text-white">BANQUE : <span className="font-mono font-normal">MAZE BANK</span></p>
                <p className="text-sm font-bold text-white">COMPTE : <span className="font-mono font-normal text-neon-blue">{safeString(d.compte_bancaire, "")}</span></p>
            </div>
            <div className="text-right">
                <p className="text-[10px] text-gray-600 italic">Facture payable à réception.</p>
                <p className="font-signature text-2xl text-gray-500 mt-2">Moore Legal</p>
            </div>
        </div>
      </div>

    </div>
  );
}
