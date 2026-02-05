import React from 'react';

export default function PlaintePreview({ data, pieces }) {
  const safeString = (value, fallback = "") =>
    typeof value === "string" ? value : value == null ? fallback : String(value);
  const d = data ?? {};
  const infractionsText = safeString(d.infractions, "");
  const infractionsList = infractionsText
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);

  const safePieces = Array.isArray(pieces) ? pieces : [];

  return (
    <div 
      id="plainte-preview" 
      className="w-[210mm] min-h-[297mm] bg-black text-white relative shadow-2xl flex flex-col font-rajdhani"
      style={{ 
        padding: '20mm',
        backgroundImage: 'radial-gradient(circle at center, #0a0a0a 0%, #000 100%)',
        boxSizing: 'border-box'
      }}
    >
      {/* Filigrane */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
         <h1 className="text-9xl font-orbitron font-bold text-gray-800 opacity-10 -rotate-45">CONFIDENTIEL</h1>
      </div>

      {/* --- EN-TÊTE --- */}
      <div className="flex justify-between items-start mb-8 relative z-10 border-b border-gray-800 pb-6">
         <div className="w-1/2">
             <h1 className="text-2xl font-orbitron font-bold tracking-widest text-neon-blue uppercase mb-1">
                CABINET MOORE
             </h1>
             <p className="font-mono text-gray-400 text-xs">Avocats au Barreau de San Andreas</p>
             <p className="font-mono text-gray-400 text-xs mt-2">Dossier n°: {safeString(d.ref_dossier, "")}</p>
         </div>
         <div className="w-1/2 text-right">
             <p className="font-bold text-white uppercase mb-1">À l'attention du Procureur / LSPD</p>
             <p className="font-mono text-gray-400 text-xs">Bureau des Plaintes</p>
             <p className="font-mono text-gray-400 text-xs">Mission Row Police Dept.</p>
             <p className="font-mono text-white text-sm mt-4 font-bold">Le {safeString(d.date, "")}</p>
         </div>
      </div>

      {/* --- OBJET --- */}
      <div className="mb-6 relative z-10">
        <div className="bg-gray-900/50 p-4 border-l-4 border-red-500 flex justify-between items-center">
            <div>
                <p className="text-gray-400 text-xs uppercase tracking-wider">OBJET DE LA REQUÊTE</p>
                <p className="font-bold text-xl uppercase text-white">DÉPÔT DE PLAINTE CONTRE <span className="text-red-500">{safeString(d.accuse, "")}</span></p>
            </div>
            <div className="text-right">
                <p className="text-gray-400 text-xs uppercase">POUR LE COMPTE DE</p>
                <p className="font-bold text-white">{safeString(d.victime, "")}</p>
            </div>
        </div>
      </div>

      {/* --- CORPS DE LA PLAINTE --- */}
      <div className="flex-1 text-justify font-sans text-sm leading-relaxed relative z-10 text-gray-200 flex flex-col gap-6">
        
        {/* I. EXPOSÉ DES FAITS */}
        <div>
            <h3 className="flex items-center gap-2 font-bold font-orbitron text-neon-blue mb-2 border-b border-gray-800 pb-1">
                <span className="bg-neon-blue text-black text-xs px-1.5 py-0.5 rounded">I</span> EXPOSÉ DES FAITS
            </h3>
            <div className="pl-2 border-l border-gray-800 ml-1 text-gray-300 whitespace-pre-wrap">
                {safeString(d.faits, "")}
            </div>
        </div>

        {/* II. QUALIFICATION PÉNALE */}
        <div>
            <h3 className="flex items-center gap-2 font-bold font-orbitron text-neon-blue mb-2 border-b border-gray-800 pb-1">
                <span className="bg-neon-blue text-black text-xs px-1.5 py-0.5 rounded">II</span> INFRACTIONS RELEVÉES
            </h3>
            <div className="pl-2 ml-1 text-gray-300">
                <ul className="list-disc pl-5 space-y-1 font-bold text-white">
                    {infractionsList.map((item, index) => (
                        <li key={index}>{item}</li>
                    ))}
                    {infractionsList.length === 0 && <li>Aucune infraction renseignée.</li>}
                </ul>
            </div>
        </div>

        {/* III. BORDEREAU DE PIÈCES (LISTE) */}
        <div className="mb-4">
            <h3 className="flex items-center gap-2 font-bold font-orbitron text-neon-blue mb-2 border-b border-gray-800 pb-1">
                <span className="bg-neon-blue text-black text-xs px-1.5 py-0.5 rounded">III</span> BORDEREAU DE PIÈCES
            </h3>
            
            {/* Liste Textuelle des pièces */}
            <div className="pl-2 ml-1 text-xs font-mono text-gray-300 mb-6 space-y-2">
                {safePieces.map((p) => (
                    <div key={p.id} className="flex items-start gap-3">
                        <div className="bg-gray-800 text-neon-blue px-2 py-0.5 rounded font-bold whitespace-nowrap">PIÈCE #{p.id}</div>
                        <div className="uppercase tracking-wide pt-0.5">{p.description}</div>
                        {p.image && <div className="text-[10px] text-gray-500 italic pt-0.5">(Voir Annexe Visuelle)</div>}
                    </div>
                ))}
                {safePieces.length === 0 && <p className="italic text-gray-600">Aucune pièce jointe.</p>}
            </div>

            {/* ANNEXES VISUELLES (Images uniquement si présentes) */}
            {safePieces.some((p) => p.image) && (
                <div className="mt-8 border-t border-gray-800 pt-4">
                    <p className="text-xs text-gray-500 mb-4 font-mono uppercase text-center font-bold tracking-widest">--- ANNEXES VISUELLES ---</p>
                    <div className="grid grid-cols-2 gap-6">
                        {safePieces.map((p) => (
                            p.image && (
                                <div key={p.id} className="border border-gray-700 bg-gray-900 p-2 break-inside-avoid">
                                    <div className="bg-neon-blue text-black text-xs font-bold px-2 py-1 inline-block mb-2">
                                        PIÈCE #{p.id}
                                    </div>
                                    <img 
                                        src={p.image} 
                                        alt={`Preuve ${p.id}`} 
                                        className="w-full h-48 object-cover border border-gray-800" 
                                    />
                                    <p className="text-[10px] text-gray-400 mt-2 font-mono uppercase truncate">{p.description}</p>
                                </div>
                            )
                        ))}
                    </div>
                </div>
            )}
        </div>

      </div>

      {/* --- PIED DE PAGE --- */}
      <div className="mt-auto pt-6 border-t border-gray-800 relative z-10 flex justify-between items-end break-inside-avoid">
        <p className="text-[10px] text-gray-600 w-1/2">
            Ce document est une pièce officielle de procédure. Toute fausse déclaration est passible de poursuites (Parjure).
        </p>

        <div className="text-center w-48">
            <p className="font-orbitron text-xs font-bold text-neon-blue mb-4">L'AVOCAT REQUÉRANT</p>
            <div className="relative h-20 w-full border-b border-gray-600 flex items-end justify-center pb-1 overflow-visible">
                <span className="font-signature pdf-signature text-white text-3xl -rotate-6 origin-bottom-left inline-block leading-none">
                    {safeString(d.avocat, "").trim().split(/\s+/).pop() || safeString(d.avocat, "")}
                </span>
            </div>
            <p className="text-[10px] uppercase mt-1 text-gray-500">{safeString(d.avocat, "")}</p>
        </div>
      </div>

    </div>
  );
}
