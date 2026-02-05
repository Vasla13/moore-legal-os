import React from 'react';

export default function OrdonnancePreview({ data, logo }) {
  const safeString = (value, fallback = "") =>
    typeof value === "string" ? value : value == null ? fallback : String(value);
  const safeUpper = (value, fallback = "") => safeString(value, fallback).toUpperCase();

  const d = data ?? {};
  const jugeName = safeString(d.juge, "");
  // On récupère juste le nom de famille pour la signature manuscrite (ex: Pozzano)
  const signatureName = jugeName.trim().split(/\s+/).pop() || jugeName;

  return (
    <div 
      id="document-preview" 
      className="w-[210mm] h-[297mm] bg-black text-white relative shadow-2xl flex flex-col font-rajdhani"
      style={{ 
        padding: '20mm',
        backgroundImage: 'radial-gradient(circle at center, #0a0a0a 0%, #000 100%)',
        boxSizing: 'border-box' // Important pour que le padding ne dépasse pas A4
      }}
    >
      {/* --- DÉCORATIONS CYBERPUNK --- */}
      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-neon-blue via-purple-600 to-neon-blue opacity-50"></div>
      <div className="absolute bottom-10 right-10 w-32 h-32 border-b-2 border-r-2 border-neon-blue opacity-20 pointer-events-none"></div>
      <div className="absolute top-10 left-10 w-20 h-20 border-t-2 border-l-2 border-neon-blue opacity-20 pointer-events-none"></div>

      {/* --- 1. EN-TÊTE (HEADER) --- */}
      <div className="flex flex-col items-center mb-8 relative z-10 shrink-0">
         {logo && (
            <div className="mb-2">
                <img src={logo} alt="DOJ" className="h-20 w-auto object-contain drop-shadow-[0_0_8px_rgba(0,243,255,0.6)]" />
            </div>
         )}
         
         <h1 className="text-3xl font-orbitron font-bold tracking-[0.2em] text-neon-blue uppercase text-center mb-1">
            Department Of Justice
         </h1>
         <p className="font-mono text-gray-400 text-xs tracking-widest uppercase">
            United States of America
         </p>
         
         {/* Ligne séparatrice néon */}
         <div className="w-1/3 h-px bg-gradient-to-r from-transparent via-neon-blue to-transparent mt-3 mb-6"></div>

         <p className="w-full text-right font-mono text-sm text-gray-300">
            Los Santos, le {safeString(d.date, "")}
         </p>
      </div>

      {/* --- 2. TITRE --- */}
      <div className="mb-6 text-center relative z-10 shrink-0">
        <h2 className="text-xl font-bold font-orbitron border-b-2 border-neon-blue inline-block pb-1 tracking-wide">
            ORDONNANCE DE MESURE D’ÉLOIGNEMENT
        </h2>
      </div>

      {/* --- 3. CORPS DU TEXTE (CONTENU PRINCIPAL) --- */}
      {/* flex-1 permet à cette partie de prendre toute la place disponible */}
      <div className="flex-1 text-justify font-sans text-sm leading-relaxed relative z-10 text-gray-100 flex flex-col gap-3">
        
        {/* Les Motifs */}
        <div>
            <p>Vu la requête formulée par <span className="font-bold">{safeString(d.avocat, "")}</span>,</p>
            <p>{safeString(d.titre_faits, "")}</p>
        </div>
        
        <div>
            <p>
                Considérant que <span className="font-bold text-neon-blue">{safeUpper(d.victime, "")}</span> a été menacé(e) par 
                <span className="font-bold text-red-500"> {safeUpper(d.accuse, "")}</span>,
            </p>
            <p>{safeString(d.titre_considerant, "")}</p>
        </div>

        {/* La Décision */}
        <div className="mt-4">
            <p className="font-bold font-orbitron text-base mb-1">IL EST ORDONNÉ CE QUI SUIT :</p>
            <div className="w-full text-gray-700 tracking-tighter opacity-30 overflow-hidden whitespace-nowrap text-[8px] mb-2">
                ..................................................................................................................................................................................................................................................................................................
            </div>
        </div>

        {/* Le Bloc Gris des mesures */}
        <div className="bg-gray-900/40 p-5 border-l-4 border-neon-blue">
            <p className="mb-3">
                <span className="font-bold text-white">{safeString(d.accuse, "")}</span> {safeString(d.decision_texte, "")} (Durée : <span className="font-bold text-white">{safeString(d.duree, "")}</span>).
            </p>

            <p className="mb-2">
                Durant toute la durée de la mesure, <span className="font-bold text-white">{safeString(d.accuse, "")}</span> n’est pas autorisé à :
            </p>

            {/* Liste des interdictions */}
            <div className="pl-4 text-gray-200 whitespace-pre-wrap font-sans leading-normal">
                {safeString(d.interdictions, "")}
            </div>
        </div>
      </div>

      {/* --- 4. PIED DE PAGE (FOOTER) --- */}
      {/* shrink-0 empêche cette partie d'être écrasée */}
      <div className="mt-auto pt-6 relative z-10 shrink-0">
        
        {/* Avertissement Légal */}
        <p className="text-xs text-gray-500 italic mb-8 border-t border-gray-800 pt-3 text-center">
            Tout manquement à la présente mesure constituera une violation d’ordonnance judiciaire et pourra entraîner des sanctions pénales immédiates.
        </p>

        {/* Bloc Signature Alignée à Droite */}
        <div className="flex flex-col items-end mr-4">
            <div className="text-center w-56">
                <p className="font-mono text-[10px] uppercase text-gray-500 mb-1 tracking-widest">
                    Que Dieu bénisse l'Amérique
                </p>
                <p className="font-orbitron font-bold text-xs tracking-widest text-neon-blue mb-4">
                    JUDGE OF SAN ANDREAS
                </p>
                
                <div className="relative h-24 w-full flex items-center justify-center">
                    {/* Nom imprimé en bas */}
                    <p className="absolute bottom-0 text-sm font-bold uppercase tracking-wider text-white border-t border-gray-600 pt-1 w-full">
                        {jugeName}
                    </p>
                    
                    {/* Signature manuscrite par dessus (plus grande) */}
                    <span className="font-signature text-neon-blue text-7xl -rotate-12 block drop-shadow-[0_0_5px_#00f3ff] z-10 mix-blend-screen absolute -top-2">
                        {signatureName}
                    </span>
                </div>
            </div>
        </div>
      </div>

    </div>
  );
}
