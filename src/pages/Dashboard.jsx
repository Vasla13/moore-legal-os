import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from "firebase/auth";
import { collection, getDocs, addDoc, query, serverTimestamp } from "firebase/firestore";
import { auth, db } from '../firebase';
import { LogOut, Plus, FileText, User, FolderOpen, X, Fingerprint, Activity, Building2, Users } from 'lucide-react';
import Layout from '../components/layout/Layout';

export default function Dashboard() {
  const navigate = useNavigate();
  const [dossiers, setDossiers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // États Modal Création
  const [showModal, setShowModal] = useState(false);
  const [nouveauClient, setNouveauClient] = useState("");
  const [clientType, setClientType] = useState("individu"); 
  const [creating, setCreating] = useState(false);

  const handleLogout = () => signOut(auth);

  const getCreatedAtMs = (value) => {
    if (!value) return 0;
    if (typeof value.toMillis === "function") return value.toMillis();
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  };

  const fetchDossiers = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "clients")); 
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => {
        const payload = doc.data();
        return {
          id: doc.id,
          ...payload,
          createdAtMs: getCreatedAtMs(payload.createdAt),
        };
      });
      data.sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0));
      setDossiers(data);
    } catch (error) { console.error("Erreur système:", error); }
    setLoading(false);
  };

  const handleConfirmCreation = async (e) => {
    e.preventDefault();
    if (!nouveauClient.trim()) return;
    setCreating(true);
    try {
      await addDoc(collection(db, "clients"), {
        nom: nouveauClient.toUpperCase(),
        type: clientType,
        infraction: "OUVERTURE DU DOSSIER",
        statut: "Instruction",
        createdAt: serverTimestamp(),
        notes: "",
        telephone: ""
      });
      setShowModal(false);
      setNouveauClient("");
      setClientType("individu");
      fetchDossiers();
    } catch (error) { console.error(error); }
    setCreating(false);
  };

  useEffect(() => { fetchDossiers(); }, []);

  const getIconByType = (type) => {
    if (type === 'entreprise') return <Building2 size={20} />;
    if (type === 'organisation') return <Users size={20} />;
    return <User size={20} />;
  };

  return (
    <Layout>
        {/* NAVBAR */}
        <nav className="border-b border-gray-800 bg-black/80 backdrop-blur-md p-4 flex justify-between items-center sticky top-0 z-40">
            <div className="flex items-center gap-3">
                <div className="h-8 w-8 bg-neon-blue rounded-sm rotate-45 flex items-center justify-center shadow-[0_0_10px_#00f3ff]">
                    <span className="font-orbitron font-bold text-black -rotate-45">M</span>
                </div>
                <h1 className="font-orbitron text-xl tracking-widest text-white">MOORE <span className="text-neon-blue">LEGAL OS</span></h1>
            </div>
            <button onClick={handleLogout} className="flex items-center gap-2 text-red-500/70 hover:text-red-500 transition-colors text-xs font-orbitron font-bold uppercase border border-red-500/30 px-3 py-1 hover:bg-red-500/10"><LogOut size={14} /> DÉCONNEXION</button>
        </nav>

        <main className="p-6 max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-10 border-b border-gray-800 pb-6 gap-4">
                <div>
                    <h2 className="text-4xl font-orbitron text-white mb-2">ARCHIVES COURANTES</h2>
                    <p className="text-neon-blue font-mono text-sm flex items-center gap-2"><FolderOpen size={16}/> GESTION JUDICIAIRE</p>
                </div>
                <button onClick={() => { setNouveauClient(""); setShowModal(true); }} className="px-6 py-3 bg-neon-blue/5 border border-neon-blue text-neon-blue font-orbitron font-bold uppercase tracking-wider hover:bg-neon-blue hover:text-black transition-all">
                    <span className="flex items-center gap-2"><Plus size={18} /> OUVRIR UN DOSSIER</span>
                </button>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                    <div className="w-12 h-12 border-4 border-neon-blue border-t-transparent rounded-full animate-spin"></div>
                    <div className="text-neon-blue font-mono animate-pulse tracking-widest text-sm">SYNCHRONISATION...</div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {dossiers.map((dossier) => (
                        <div key={dossier.id} onClick={() => navigate(`/dossier/${dossier.id}`)} className="group relative bg-[#0a0a0a] border border-gray-800 p-6 hover:border-neon-blue transition-all cursor-pointer overflow-hidden shadow-lg">
                            <div className="absolute top-0 left-0 w-1 h-full bg-gray-800 group-hover:bg-neon-blue transition-colors duration-300" />
                            <div className="flex justify-between items-start mb-4 pl-3">
                                <div className="bg-gray-900 p-2 rounded text-neon-blue border border-gray-700 group-hover:border-neon-blue/50">
                                    {getIconByType(dossier.type)}
                                </div>
                                <span className="flex items-center gap-2 text-[10px] font-orbitron font-bold px-2 py-1 border border-neon-blue/30 text-neon-blue"><Activity size={10} />{dossier.statut?.toUpperCase()}</span>
                            </div>
                            <div className="pl-3">
                                <h3 className="text-2xl font-bold text-white mb-1 group-hover:text-neon-blue transition-colors truncate">{dossier.nom}</h3>
                                <p className="text-gray-500 text-sm font-mono mb-6 uppercase tracking-wider">{dossier.type || 'INDIVIDU'}</p>
                                <div className="flex items-center justify-between text-xs text-gray-600 font-mono border-t border-gray-900 pt-4">
                                    <span className="flex items-center gap-1 group-hover:text-gray-400"><FileText size={12}/> REF: {dossier.id.substring(0, 4).toUpperCase()}</span>
                                    <span className="opacity-50 font-orbitron">{dossier.type === 'entreprise' ? 'CORPO' : 'CIVIL'}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </main>

        {/* MODAL CRÉATION */}
        {showModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={() => setShowModal(false)} />
                <div className="relative bg-[#050505] border border-neon-blue w-full max-w-md p-1 shadow-[0_0_50px_rgba(0,243,255,0.2)]">
                    <div className="bg-[#0a0a0a] border border-gray-800 p-8">
                        <div className="flex justify-between items-center mb-6 border-b border-gray-800 pb-4">
                            <h3 className="font-orbitron text-xl text-white flex items-center gap-3"><Plus size={20} className="text-neon-blue" /> NOUVEAU DOSSIER</h3>
                            <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-white"><X size={20} /></button>
                        </div>
                        
                        <form onSubmit={handleConfirmCreation} className="space-y-6">
                            {/* Choix du Type */}
                            <div className="grid grid-cols-3 gap-2">
                                <button type="button" onClick={() => setClientType('individu')} className={`p-2 text-[10px] font-bold uppercase border transition-all flex flex-col items-center gap-1 ${clientType === 'individu' ? 'border-neon-blue bg-neon-blue/10 text-white' : 'border-gray-800 text-gray-500 hover:border-gray-600'}`}>
                                    <User size={16} /> Individu
                                </button>
                                <button type="button" onClick={() => setClientType('entreprise')} className={`p-2 text-[10px] font-bold uppercase border transition-all flex flex-col items-center gap-1 ${clientType === 'entreprise' ? 'border-neon-blue bg-neon-blue/10 text-white' : 'border-gray-800 text-gray-500 hover:border-gray-600'}`}>
                                    <Building2 size={16} /> Entreprise
                                </button>
                                <button type="button" onClick={() => setClientType('organisation')} className={`p-2 text-[10px] font-bold uppercase border transition-all flex flex-col items-center gap-1 ${clientType === 'organisation' ? 'border-neon-blue bg-neon-blue/10 text-white' : 'border-gray-800 text-gray-500 hover:border-gray-600'}`}>
                                    <Users size={16} /> Org.
                                </button>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-orbitron text-neon-blue uppercase tracking-widest ml-1">
                                    {clientType === 'entreprise' ? 'Raison Sociale' : clientType === 'organisation' ? "Nom du groupe" : 'Identité du sujet'}
                                </label>
                                <div className="relative">
                                    <input 
                                        autoFocus 
                                        type="text" 
                                        value={nouveauClient} 
                                        onChange={(e) => setNouveauClient(e.target.value)} 
                                        placeholder={clientType === 'entreprise' ? "NOM DE LA SOCIÉTÉ..." : clientType === 'organisation' ? "NOM DE L'ORGANISATION..." : "PRÉNOM & NOM DU SUJET..."} 
                                        className="w-full bg-[#111] border border-gray-700 text-white font-mono p-4 pl-12 focus:outline-none focus:border-neon-blue uppercase placeholder-gray-700 transition-all" 
                                    />
                                    <div className="absolute left-4 top-4 text-gray-600">
                                        {clientType === 'entreprise' ? <Building2 size={20} /> : clientType === 'organisation' ? <Users size={20} /> : <Fingerprint size={20} />}
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex gap-4 pt-2">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 border border-gray-700 text-gray-500 font-orbitron text-sm hover:bg-gray-800 hover:text-white">ANNULER</button>
                                <button type="submit" disabled={creating} className="flex-1 py-3 bg-neon-blue/10 border border-neon-blue text-neon-blue font-orbitron font-bold text-sm hover:bg-neon-blue hover:text-black transition-all">
                                    {creating ? "CHARTING..." : "CRÉER DOSSIER"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        )}
    </Layout>
  );
}
