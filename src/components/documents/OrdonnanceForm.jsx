import React from 'react';
import { Upload, Download, Loader2 } from 'lucide-react';

export default function OrdonnanceForm({ data, setData, logo, handleImageUpload, onDownload, isExporting }) {
  return (
    <div className="w-1/3 border-r border-gray-800 p-6 overflow-y-auto custom-scrollbar bg-[#050505]">
      
      {/* --- LOGO --- */}
      <div className="space-y-2 mb-6">
        <label className="text-xs font-orbitron text-gray-400 uppercase">Logo En-tête</label>
        <div className="relative group">
            <input type="file" id="logo-upload" className="hidden" accept="image/*" onChange={handleImageUpload}/>
            <label htmlFor="logo-upload" className={`cursor-pointer flex flex-col items-center justify-center h-24 border-2 border-dashed rounded-lg transition-all ${logo ? 'border-neon-blue bg-black' : 'border-gray-700 bg-gray-900/50 hover:border-gray-500'}`}>
              {logo ? <img src={logo} className="h-full object-contain p-2" alt="Logo" /> : <div className="flex flex-col items-center text-gray-500"><Upload size={20} className="mb-1" /><span className="text-[10px] font-mono">UPLOAD LOGO</span></div>}
            </label>
        </div>
      </div>

      <hr className="border-gray-800 mb-6"/>

      {/* --- CHAMPS DE BASE --- */}
      <div className="space-y-4 font-mono text-sm">
        <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="block text-gray-500 text-[10px] mb-1 uppercase tracking-wider">Avocat</label>
                <input type="text" value={data.avocat} onChange={e => setData({...data, avocat: e.target.value})} className="w-full bg-[#111] border border-gray-700 p-2 text-white focus:border-neon-blue outline-none" />
            </div>
            <div>
                <label className="block text-gray-500 text-[10px] mb-1 uppercase tracking-wider">Date</label>
                <input type="text" value={data.date} onChange={e => setData({...data, date: e.target.value})} className="w-full bg-[#111] border border-gray-700 p-2 text-white focus:border-neon-blue outline-none" />
            </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="block text-neon-blue text-[10px] mb-1 uppercase tracking-wider">Victime</label>
                <input type="text" value={data.victime} onChange={e => setData({...data, victime: e.target.value})} className="w-full bg-[#111] border border-gray-700 p-2 text-white focus:border-neon-blue outline-none font-bold" />
            </div>
            <div>
                <label className="block text-red-500/70 text-[10px] mb-1 uppercase tracking-wider">Accusé</label>
                <input type="text" value={data.accuse} onChange={e => setData({...data, accuse: e.target.value})} className="w-full bg-[#111] border border-gray-700 p-2 text-white focus:border-red-500 outline-none font-bold" />
            </div>
        </div>

        <hr className="border-gray-800"/>

        {/* --- TEXTES JURIDIQUES EDITABLES --- */}
        <div>
            <label className="block text-gray-400 text-[10px] mb-1 uppercase tracking-wider">Motifs (Vu les faits...)</label>
            <textarea value={data.titre_faits} onChange={e => setData({...data, titre_faits: e.target.value})} className="w-full h-16 bg-[#111] border border-gray-700 p-2 text-white focus:border-neon-blue outline-none text-xs resize-none" />
        </div>

        <div>
            <label className="block text-gray-400 text-[10px] mb-1 uppercase tracking-wider">Considérant que...</label>
            <textarea value={data.titre_considerant} onChange={e => setData({...data, titre_considerant: e.target.value})} className="w-full h-16 bg-[#111] border border-gray-700 p-2 text-white focus:border-neon-blue outline-none text-xs resize-none" />
        </div>

        <div className="grid grid-cols-3 gap-2">
             <div className="col-span-1">
                <label className="block text-gray-400 text-[10px] mb-1 uppercase tracking-wider">Durée</label>
                <input type="text" value={data.duree} onChange={e => setData({...data, duree: e.target.value})} className="w-full bg-[#111] border border-gray-700 p-2 text-white focus:border-neon-blue outline-none text-xs" />
             </div>
             <div className="col-span-2">
                <label className="block text-gray-400 text-[10px] mb-1 uppercase tracking-wider">Suite de phrase décision</label>
                <input type="text" value={data.decision_texte} onChange={e => setData({...data, decision_texte: e.target.value})} className="w-full bg-[#111] border border-gray-700 p-2 text-white focus:border-neon-blue outline-none text-xs" />
             </div>
        </div>

        <div>
            <label className="block text-gray-400 text-[10px] mb-1 uppercase tracking-wider">Liste des Interdictions (1 par ligne)</label>
            <textarea value={data.interdictions} onChange={e => setData({...data, interdictions: e.target.value})} className="w-full h-32 bg-[#111] border border-gray-700 p-2 text-white focus:border-neon-blue outline-none text-xs resize-none" />
        </div>

        <div>
            <label className="block text-gray-500 text-[10px] mb-1 uppercase tracking-wider">Nom du Juge</label>
            <input type="text" value={data.juge} onChange={e => setData({...data, juge: e.target.value})} className="w-full bg-[#111] border border-neon-blue text-neon-blue p-2 font-signature text-xl outline-none" />
        </div>
      </div>

      <button
        onClick={onDownload}
        disabled={isExporting}
        className={`w-full py-3 bg-neon-blue text-black font-orbitron font-bold flex justify-center gap-2 transition-colors mt-6 shadow-[0_0_20px_rgba(0,243,255,0.3)] ${isExporting ? 'opacity-70 cursor-wait' : 'hover:bg-white'}`}
      >
        {isExporting ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
        {isExporting ? 'GÉNÉRATION...' : 'GÉNÉRER LE PDF'}
      </button>
    </div>
  );
}
