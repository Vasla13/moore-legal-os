import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from '../firebase';
import { ArrowLeft, Save, FileText, Gavel, Shield, Banknote, Phone, Lock, Clock, CheckCircle, ExternalLink, Building2, Users, User } from 'lucide-react';
import Layout from '../components/layout/Layout';

const OrdonnanceEditor = lazy(() => import('../components/OrdonnanceEditor'));
const ContratEditor = lazy(() => import('../components/documents/ContratEditor'));
const PlainteEditor = lazy(() => import('../components/documents/PlainteEditor'));
const FactureEditor = lazy(() => import('../components/documents/FactureEditor'));

export default function ClientDossier() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState("");
  const [telephone, setTelephone] = useState("");
  const [saving, setSaving] = useState(false);
  const [docSavedMessage, setDocSavedMessage] = useState("");

  const [showOrdonnance, setShowOrdonnance] = useState(false);
  const [showContrat, setShowContrat] = useState(false);
  const [showPlainte, setShowPlainte] = useState(false);
  const [showFacture, setShowFacture] = useState(false);

  // 1. CHARGEMENT
  const fetchClient = async () => {
    try {
      const docRef = doc(db, "clients", id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setClient({ id: docSnap.id, ...data }); 
        setNotes(data.notes || "");
        setTelephone(data.telephone || "");
      }
    } catch (error) { console.error(error); }
    setLoading(false);
  };

  useEffect(() => { fetchClient(); }, [id]);

  // 2. SAUVEGARDE INFO
  const handleSaveInfo = async () => {
    setSaving(true);
    try {
      const docRef = doc(db, "clients", id);
      await updateDoc(docRef, { notes, telephone });
      setTimeout(() => setSaving(false), 800);
    } catch (error) { setSaving(false); }
  };

  // 3. SAUVEGARDE DOCUMENT (BROUILLON)
  const handleSaveDocument = async (docType, docData) => {
    try {
      const docRef = doc(db, "clients", id);
      await updateDoc(docRef, { [`saved_${docType}`]: docData });
      setClient(prev => ({ ...prev, [`saved_${docType}`]: docData }));
      setDocSavedMessage(`Brouillon ${docType.toUpperCase()} sauvegardé.`);
      setTimeout(() => setDocSavedMessage(""), 3000);
    } catch (error) { alert("Erreur sauvegarde brouillon."); }
  };

  // 4. AJOUT HISTORIQUE
  const handleAddHistory = async (type, reference, description, fullDocData) => {
    try {
      const docRef = doc(db, "clients", id);
      const newLog = {
        date: new Date().toISOString(),
        type: type, 
        ref: reference,
        desc: description,
        data: fullDocData
      };
      await updateDoc(docRef, { history: arrayUnion(newLog) });
      fetchClient(); 
    } catch (error) { console.error("Erreur historique:", error); }
  };

  // 5. RESTAURATION HISTORIQUE
  const handleHistoryClick = (log) => {
    if (!log.data) { alert("Pas de données restaurables."); return; }
    const tempClient = { ...client };
    if (log.type === "FACTURE") { tempClient.saved_facture = log.data; setClient(tempClient); setShowFacture(true); } 
    else if (log.type === "PLAINTE") { tempClient.saved_plainte = log.data; setClient(tempClient); setShowPlainte(true); }
    else if (log.type === "CONTRAT") { tempClient.saved_contrat = log.data; setClient(tempClient); setShowContrat(true); }
    else if (log.type === "ORDONNANCE") { tempClient.saved_ordonnance = log.data; setClient(tempClient); setShowOrdonnance(true); }
  };

  // Helper pour titre section
  const getInfoTitle = () => {
    if (client?.type === 'entreprise') return "INFORMATIONS CORPORATIVES";
    if (client?.type === 'organisation') return "INFORMATIONS ORGANISATION";
    return "INFORMATIONS CIVILES";
  };
  
  // Helper pour icone
  const getInfoIcon = () => {
     if (client?.type === 'entreprise') return <Building2 size={14} className="text-neon-blue"/>;
     if (client?.type === 'organisation') return <Users size={14} className="text-neon-blue"/>;
     return <Shield size={14} className="text-neon-blue"/>;
  };

  const editorFallback = (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 text-neon-blue font-mono animate-pulse">
      CHARGEMENT...
    </div>
  );

  if (loading) return <div className="min-h-screen bg-[#050505] flex items-center justify-center text-neon-blue font-mono animate-pulse">CHARGEMENT...</div>;

  return (
    <Layout>
      {docSavedMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-green-500 text-black px-6 py-2 font-bold font-orbitron rounded shadow-[0_0_15px_#00ff00] animate-[fadeIn_0.5s]">
           <CheckCircle size={16} className="inline mr-2"/> {docSavedMessage}
        </div>
      )}

      <header className="border-b border-gray-800 bg-black/90 p-4 flex items-center justify-between shadow-[0_0_20px_rgba(0,0,0,0.5)] sticky top-0 z-30">
        <div className="flex items-center gap-6">
          <button onClick={() => navigate('/')} className="group flex items-center gap-2 text-gray-400 hover:text-white transition-colors uppercase font-mono text-xs tracking-wider">
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform"/> Retour
          </button>
          <div className="h-8 w-px bg-gray-800"></div>
          <div>
            <h1 className="text-2xl font-orbitron font-bold text-white uppercase tracking-widest flex items-center gap-3">
              DOSSIER <span className="text-neon-blue">{client?.nom}</span>
            </h1>
            <p className="text-[10px] text-gray-500 font-mono tracking-widest">TYPE: {client?.type?.toUpperCase() || "INDIVIDU"} • ID: {id}</p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* --- COLONNE GAUCHE --- */}
        <div className="lg:col-span-1 space-y-6">
            <div className="bg-[#0a0a0a] border border-gray-800 p-6 relative">
                <h3 className="font-orbitron text-white mb-6 flex items-center gap-2 text-sm tracking-widest border-b border-gray-800 pb-2">
                    {getInfoIcon()} {getInfoTitle()}
                </h3>
                <div className="space-y-4">
                    <div>
                        <label className="text-[10px] text-neon-blue font-orbitron block mb-1">TÉLÉPHONE</label>
                        <input 
                            type="text" 
                            value={telephone} 
                            onChange={(e) => setTelephone(e.target.value)} 
                            className="w-full bg-[#050505] border border-gray-800 text-white p-2 font-mono text-sm focus:border-neon-blue outline-none transition-all" 
                            placeholder="EX: 555-0192" // Placeholder suggestion RP
                        />
                    </div>
                    <div>
                        <label className="text-[10px] text-neon-blue font-orbitron block mb-1">NOTES</label>
                        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full h-32 bg-[#050505] border border-gray-800 text-gray-300 p-2 font-mono text-sm focus:border-neon-blue outline-none resize-none custom-scrollbar"/>
                    </div>
                    <button onClick={handleSaveInfo} disabled={saving} className="w-full flex items-center justify-center gap-2 bg-neon-blue/5 border border-neon-blue/30 text-neon-blue hover:bg-neon-blue hover:text-black py-2 text-xs font-orbitron font-bold">{saving ? "..." : <><Save size={14} /> SAUVEGARDER</>}</button>
                </div>
            </div>

            <div className="bg-[#0a0a0a] border border-gray-800 p-6 relative max-h-[400px] overflow-y-auto custom-scrollbar">
                <h3 className="font-orbitron text-white mb-4 flex items-center gap-2 text-sm tracking-widest border-b border-gray-800 pb-2">
                    <Clock size={14} className="text-neon-blue"/> HISTORIQUE ACTIVITÉ
                </h3>
                <div className="space-y-2">
                    {client?.history && client.history.length > 0 ? (
                        [...client.history].reverse().map((log, index) => (
                            <div 
                                key={index} 
                                onClick={() => handleHistoryClick(log)}
                                className={`flex gap-3 text-xs border-b border-gray-900 pb-2 last:border-0 p-2 rounded transition-all ${log.data ? 'cursor-pointer hover:bg-gray-900 group' : 'opacity-50'}`}
                            >
                                <div className="text-gray-500 font-mono w-16 pt-1">
                                    {new Date(log.date).toLocaleDateString('fr-FR', {day:'2-digit', month:'2-digit'})}
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-center">
                                        <p className="text-neon-blue font-bold font-orbitron group-hover:text-white transition-colors">{log.type}</p>
                                        {log.data && <ExternalLink size={10} className="text-gray-600 group-hover:text-neon-blue"/>}
                                    </div>
                                    <p className="text-gray-400 font-mono text-[10px]">{log.ref}</p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-gray-600 text-xs italic text-center py-4">Aucun document généré.</p>
                    )}
                </div>
            </div>
        </div>

        {/* --- COLONNE DROITE --- */}
        <div className="lg:col-span-2">
            <div className="bg-[#0a0a0a] border border-gray-800 p-8 min-h-[600px] relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10"><FileText size={200} className="text-neon-blue" /></div>
                <h3 className="font-orbitron text-white text-xl mb-8 border-b border-gray-800 pb-4 flex items-center justify-between relative z-10">
                    <span>GÉNÉRATEUR DE PROCÉDURES</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10">
                    <button onClick={() => setShowOrdonnance(true)} className="group relative p-6 border border-gray-700 hover:border-neon-blue transition-all text-left bg-black/80 hover:bg-neon-blue/5 overflow-hidden">
                        <Gavel className="w-8 h-8 text-gray-500 group-hover:text-neon-blue mb-4 transition-colors" />
                        <h4 className="font-bold text-white group-hover:text-neon-blue font-orbitron tracking-wide">ORDONNANCE JUGE</h4>
                        {client?.saved_ordonnance && <span className="absolute top-2 right-2 text-[10px] text-green-500 font-mono flex items-center gap-1"><Save size={10}/> BROUILLON</span>}
                    </button>
                    <button onClick={() => setShowContrat(true)} className="group relative p-6 border border-gray-700 hover:border-neon-blue transition-all text-left bg-black/80 hover:bg-neon-blue/5 overflow-hidden">
                        <Shield className="w-8 h-8 text-gray-500 group-hover:text-neon-blue mb-4 transition-colors" />
                        <h4 className="font-bold text-white group-hover:text-neon-blue font-orbitron tracking-wide">CONTRAT DE DÉFENSE</h4>
                        {client?.saved_contrat && <span className="absolute top-2 right-2 text-[10px] text-green-500 font-mono flex items-center gap-1"><Save size={10}/> BROUILLON</span>}
                    </button>
                    <button onClick={() => setShowPlainte(true)} className="group relative p-6 border border-gray-700 hover:border-neon-blue transition-all text-left bg-black/80 hover:bg-neon-blue/5 overflow-hidden">
                        <FileText className="w-8 h-8 text-gray-500 group-hover:text-neon-blue mb-4 transition-colors" />
                        <h4 className="font-bold text-white group-hover:text-neon-blue font-orbitron tracking-wide">DÉPÔT DE PLAINTE</h4>
                        {client?.saved_plainte && <span className="absolute top-2 right-2 text-[10px] text-green-500 font-mono flex items-center gap-1"><Save size={10}/> BROUILLON</span>}
                    </button>
                    <button onClick={() => setShowFacture(true)} className="group relative p-6 border border-gray-700 hover:border-neon-blue transition-all text-left bg-black/80 hover:bg-neon-blue/5 overflow-hidden">
                        <Banknote className="w-8 h-8 text-gray-500 group-hover:text-neon-blue mb-4 transition-colors" />
                        <h4 className="font-bold text-white group-hover:text-neon-blue font-orbitron tracking-wide">FACTURE</h4>
                        {client?.saved_facture && <span className="absolute top-2 right-2 text-[10px] text-green-500 font-mono flex items-center gap-1"><Save size={10}/> BROUILLON</span>}
                    </button>
                </div>
            </div>
        </div>
      </main>

      <Suspense fallback={editorFallback}>
        {showOrdonnance && <OrdonnanceEditor client={client} savedData={client.saved_ordonnance} onSave={(data) => handleSaveDocument("ordonnance", data)} onHistoryAdd={handleAddHistory} onClose={() => setShowOrdonnance(false)} />}
        {showContrat && <ContratEditor client={client} savedData={client.saved_contrat} onSave={(data) => handleSaveDocument("contrat", data)} onHistoryAdd={handleAddHistory} onClose={() => setShowContrat(false)} />}
        {showPlainte && <PlainteEditor client={client} savedData={client.saved_plainte} onSave={(data) => handleSaveDocument("plainte", data)} onHistoryAdd={handleAddHistory} onClose={() => setShowPlainte(false)} />}
        {showFacture && <FactureEditor client={client} savedData={client.saved_facture} onSave={(data) => handleSaveDocument("facture", data)} onHistoryAdd={handleAddHistory} onClose={() => setShowFacture(false)} />}
      </Suspense>
    </Layout>
  );
}
