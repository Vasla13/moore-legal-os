import React from 'react';

export default function ContratPreview({ data, logo }) {
  const safeString = (value, fallback = "") =>
    typeof value === "string" ? value : value == null ? fallback : String(value);
  const d = data ?? {};
  const avocatName = safeString(d.avocat, "");
  const avocatSignature = avocatName.trim().split(/\s+/).pop() || avocatName;

  return (
    <div 
      id="contrat-preview" 
      className="w-[210mm] h-[297mm] bg-black text-white relative shadow-2xl flex flex-col font-rajdhani"
      style={{ 
        padding: '20mm',
        backgroundImage: 'radial-gradient(circle at center, #0a0a0a 0%, #000 100%)',
        boxSizing: 'border-box'
      }}
    >
      {/* Décoration "Moore Legal" */}
      <div className="absolute top-0 right-0 w-32 h-32 border-l border-b border-gray-800 rounded-bl-3xl opacity-50"></div>
      <div className="absolute bottom-0 left-0 w-full h-1 bg-neon-blue opacity-50"></div>

      {/* --- EN-TÊTE --- */}
      <div className="flex justify-between items-end mb-12 border-b border-gray-800 pb-6 relative z-10">
         <div>
             <h1 className="text-3xl font-orbitron font-bold tracking-widest text-white uppercase">
                MOORE <span className="text-neon-blue">LEGAL</span>
             </h1>
             <p className="font-mono text-gray-500 text-xs tracking-widest uppercase mt-1">
                Cabinet d'Avocats & Conseil Juridique
             </p>
         </div>
         <div className="text-right">
             <p className="font-mono text-sm text-gray-400">Réf. Dossier: {safeString(d.ref_dossier, "")}</p>
             <p className="font-mono text-sm text-gray-400">Date: {safeString(d.date, "")}</p>
         </div>
      </div>

      {/* --- TITRE --- */}
      <div className="mb-10 text-center relative z-10">
        <h2 className="text-2xl font-bold font-orbitron border-2 border-neon-blue px-6 py-2 inline-block tracking-wide uppercase">
            CONTRAT DE MANDAT DE DÉFENSE
        </h2>
      </div>

      {/* --- CORPS DU CONTRAT --- */}
      <div className="flex-1 text-justify font-sans text-sm leading-relaxed relative z-10 text-gray-200 flex flex-col gap-6">
        
        {/* Les Parties */}
        <div className="bg-gray-900/30 p-4 border-l-2 border-neon-blue">
            <p className="mb-2"><span className="font-bold text-neon-blue uppercase">ENTRE :</span></p>
            <p className="pl-4 mb-2">
                Le Cabinet <span className="font-bold">MOORE LEGAL</span>, représenté par <span className="font-bold">{avocatName}</span>, Avocat au Barreau de San Andreas.
                <br/><span className="text-gray-500 text-xs italic">(Ci-après désigné "L'Avocat")</span>
            </p>
            <p className="mb-2"><span className="font-bold text-neon-blue uppercase">ET :</span></p>
            <p className="pl-4">
                M./Mme <span className="font-bold uppercase text-white">{safeString(d.client, "")}</span>.
                <br/><span className="text-gray-500 text-xs italic">(Ci-après désigné "Le Client")</span>
            </p>
        </div>

        {/* Article 1 : Objet */}
        <div>
            <h3 className="font-bold font-orbitron text-neon-blue mb-1">ARTICLE 1 : OBJET DU MANDAT</h3>
            <p>
                Le Client charge l'Avocat d'assurer la défense de ses intérêts dans le cadre de la procédure suivante :<br/>
                <span className="italic text-white">"{safeString(d.objet, "")}"</span>.
            </p>
            <p className="mt-1">
                L'Avocat s'engage à mettre en œuvre toutes les diligences nécessaires (garde à vue, instruction, plaidoirie).
            </p>
        </div>

        {/* Article 2 : Honoraires (Le plus important en RP) */}
        <div>
            <h3 className="font-bold font-orbitron text-neon-blue mb-1">ARTICLE 2 : HONORAIRES ET RÈGLEMENT</h3>
            <p>
                En contrepartie de la mission, le Client s'engage à verser des honoraires fixés forfaitairement à :
            </p>
            <div className="text-center py-4 my-2 border border-dashed border-gray-700 bg-gray-900/50">
                <span className="text-3xl font-bold font-orbitron text-white">{safeString(d.montant, "")} $</span>
            </div>
            <p className="text-xs text-gray-400 mt-1">
                <span className="font-bold text-white">Conditions de paiement :</span> {safeString(d.conditions_paiement, "")}
            </p>
        </div>

        {/* Article 3 : Obligations */}
        <div>
            <h3 className="font-bold font-orbitron text-neon-blue mb-1">ARTICLE 3 : CLAUSES SPÉCIFIQUES</h3>
            <ul className="list-disc pl-5 space-y-1 text-gray-400 text-xs">
                <li>Le Client s'engage à fournir toutes les pièces nécessaires à la défense.</li>
                <li>Tout mensonge du Client à son Avocat pourra entraîner la rupture immédiate du présent contrat sans remboursement.</li>
                <li>En cas de condamnation, les honoraires restent acquis au Cabinet.</li>
            </ul>
        </div>
      </div>

      {/* --- SIGNATURES --- */}
      <div className="mt-auto pt-6 pb-12 relative z-10 border-t border-gray-800 break-inside-avoid">
        <div className="flex justify-between items-start px-8">
            
            {/* Signature Avocat */}
            <div className="text-center w-48">
                <p className="font-orbitron text-xs font-bold text-neon-blue mb-4">POUR LE CABINET</p>
                <div className="relative h-24 w-full border-b border-gray-600 flex items-end justify-center pb-1 overflow-visible">
                    <span className="font-signature text-neon-blue text-4xl -rotate-6 origin-bottom-left inline-block leading-none">
                        {avocatSignature}
                    </span>
                </div>
                <p className="text-[10px] uppercase mt-1 text-gray-500">{avocatName}</p>
            </div>

            {/* Signature Client */}
            <div className="text-center w-48">
                <p className="font-orbitron text-xs font-bold text-white mb-4">LE CLIENT</p>
                <div className="relative h-24 w-full border-b border-gray-600 flex items-end justify-center pb-1 overflow-visible">
                     <p className="text-gray-600 text-[10px] uppercase tracking-widest opacity-50 mb-2">SIGNATURE REQUISE</p>
                </div>
                <p className="text-[10px] uppercase mt-1 text-gray-500">LU ET APPROUVÉ</p>
            </div>

        </div>
      </div>
    </div>
  );
}
