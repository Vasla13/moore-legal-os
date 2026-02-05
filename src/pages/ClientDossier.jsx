import React, { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from '../firebase';
import { ArrowLeft, Save, FileText, Gavel, Shield, Banknote, Clock, CheckCircle, ExternalLink, Building2, Users, Search, ArrowUpRight } from 'lucide-react';
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
  const [historyQuery, setHistoryQuery] = useState("");
  const [historyFilter, setHistoryFilter] = useState("all");

  const [showOrdonnance, setShowOrdonnance] = useState(false);
  const [showContrat, setShowContrat] = useState(false);
  const [showPlainte, setShowPlainte] = useState(false);
  const [showFacture, setShowFacture] = useState(false);

  const getTimestampMs = (value) => {
    if (!value) return 0;
    if (typeof value.toMillis === "function") return value.toMillis();
    if (typeof value.seconds === "number") return value.seconds * 1000;
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  };

  const formatDate = (ms) => {
    if (!ms) return "—";
    return new Date(ms).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const formatShortDate = (ms) => {
    if (!ms) return "—";
    return new Date(ms).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
  };

  const formatTime = (ms) => {
    if (!ms) return "";
    return new Date(ms).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const getTypeLabel = (type) => {
    if (type === 'entreprise') return "Entreprise";
    if (type === 'organisation') return "Organisation";
    return "Individu";
  };

  const getTypeTone = (type) => {
    if (type === "entreprise") return "border-amber-500/40 text-amber-300 bg-amber-500/10";
    if (type === "organisation") return "border-purple-500/40 text-purple-300 bg-purple-500/10";
    return "border-neon-blue/40 text-neon-blue bg-neon-blue/10";
  };

  const getDocumentTone = (type) => {
    if (type === "ORDONNANCE") return "border-neon-blue/40 text-neon-blue bg-neon-blue/10";
    if (type === "CONTRAT") return "border-amber-500/40 text-amber-300 bg-amber-500/10";
    if (type === "PLAINTE") return "border-red-500/40 text-red-300 bg-red-500/10";
    if (type === "FACTURE") return "border-emerald-500/40 text-emerald-300 bg-emerald-500/10";
    return "border-gray-700 text-gray-300 bg-gray-900/40";
  };

  const getStatusTone = (status = "") => {
    const value = status.toLowerCase();
    if (value.includes("clôt") || value.includes("fermé") || value.includes("close")) {
      return "border-emerald-500/40 text-emerald-300 bg-emerald-500/10";
    }
    if (value.includes("urgent") || value.includes("alerte") || value.includes("crit")) {
      return "border-red-500/40 text-red-300 bg-red-500/10";
    }
    if (value.includes("instruction") || value.includes("en cours") || value.includes("actif")) {
      return "border-neon-blue/40 text-neon-blue bg-neon-blue/10";
    }
    return "border-gray-700 text-gray-300 bg-gray-900/40";
  };

  // 1. CHARGEMENT
  const fetchClient = async () => {
    try {
      const docRef = doc(db, "clients", id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setClient({ id: docSnap.id, ...data, createdAtMs: getTimestampMs(data.createdAt) }); 
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

  const historyTabs = [
    { id: "all", label: "Tous" },
    { id: "ORDONNANCE", label: "Ordonnances" },
    { id: "CONTRAT", label: "Contrats" },
    { id: "PLAINTE", label: "Plaintes" },
    { id: "FACTURE", label: "Factures" },
  ];

  const historyItems = useMemo(() => {
    const items = Array.isArray(client?.history) ? [...client.history] : [];
    items.sort((a, b) => getTimestampMs(b.date) - getTimestampMs(a.date));
    return items;
  }, [client?.history]);

  const historyByType = useMemo(() => {
    const map = {};
    historyItems.forEach((item) => {
      if (!map[item.type]) {
        map[item.type] = item;
      }
    });
    return map;
  }, [historyItems]);

  const filteredHistory = useMemo(() => {
    const needle = historyQuery.trim().toLowerCase();
    return historyItems.filter((log) => {
      if (historyFilter !== "all" && log.type !== historyFilter) return false;
      if (!needle) return true;
      const haystack = [log.type, log.ref, log.desc]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(needle);
    });
  }, [historyItems, historyFilter, historyQuery]);

  const draftCount = [
    client?.saved_ordonnance,
    client?.saved_contrat,
    client?.saved_plainte,
    client?.saved_facture,
  ].filter(Boolean).length;

  const lastActivity = historyItems[0];
  const lastActivityMs = lastActivity ? getTimestampMs(lastActivity.date) : 0;
  const dossierType = client?.type || "individu";
  const dossierStatus = client?.statut || "Instruction";
  const lastActivityLabel = lastActivity ? `${lastActivity.type} • ${lastActivity.ref || "—"}` : "Aucune activité";
  const lastActivityDesc = lastActivity?.desc || "Aucun document généré pour le moment.";

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

  const documentCards = [
    {
      id: "ordonnance",
      label: "Ordonnance juge",
      type: "ORDONNANCE",
      description: "Décision rapide et mesures d'éloignement.",
      icon: Gavel,
      saved: client?.saved_ordonnance,
      action: () => setShowOrdonnance(true),
    },
    {
      id: "contrat",
      label: "Contrat de défense",
      type: "CONTRAT",
      description: "Mandat, honoraires et clauses de défense.",
      icon: Shield,
      saved: client?.saved_contrat,
      action: () => setShowContrat(true),
    },
    {
      id: "plainte",
      label: "Dépôt de plainte",
      type: "PLAINTE",
      description: "Plainte détaillée et pièces jointes.",
      icon: FileText,
      saved: client?.saved_plainte,
      action: () => setShowPlainte(true),
    },
    {
      id: "facture",
      label: "Facture",
      type: "FACTURE",
      description: "Facturation et suivi des prestations.",
      icon: Banknote,
      saved: client?.saved_facture,
      action: () => setShowFacture(true),
    },
  ];

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

      <header className="border-b border-gray-800 bg-black/90 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-start gap-4">
              <button onClick={() => navigate('/')} className="group flex items-center gap-2 text-gray-400 hover:text-white transition-colors uppercase font-mono text-xs tracking-wider">
                <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform"/> Retour
              </button>
              <div>
                <p className="text-[10px] text-gray-500 font-mono uppercase tracking-widest">Dossier actif</p>
                <h1 className="text-2xl font-orbitron font-bold text-white uppercase tracking-widest flex items-center gap-3 mt-1">
                  DOSSIER <span className="text-neon-blue">{client?.nom}</span>
                </h1>
                <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-gray-500 mt-2">
                  <span className={`px-2 py-1 border ${getTypeTone(dossierType)}`}>{getTypeLabel(dossierType)}</span>
                  <span className={`px-2 py-1 border ${getStatusTone(dossierStatus)}`}>{dossierStatus.toUpperCase()}</span>
                  <span className="px-2 py-1 border border-gray-800 bg-black/60">ID {id}</span>
                  <span className="px-2 py-1 border border-gray-800 bg-black/60">Ouvert {formatDate(client?.createdAtMs)}</span>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="border border-gray-800 bg-black/60 px-3 py-2 text-[10px] font-mono uppercase tracking-widest text-gray-400">
                Documents <span className="text-neon-blue">{historyItems.length}</span>
              </div>
              <div className="border border-gray-800 bg-black/60 px-3 py-2 text-[10px] font-mono uppercase tracking-widest text-gray-400">
                Brouillons <span className="text-neon-blue">{draftCount}</span>
              </div>
              <div className="border border-gray-800 bg-black/60 px-3 py-2 text-[10px] font-mono uppercase tracking-widest text-gray-400">
                Dernière action <span className="text-neon-blue">{lastActivity ? formatShortDate(lastActivityMs) : "—"}</span>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="border border-gray-800 bg-[#0a0a0a] p-4">
              <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Infraction principale</p>
              <p className="text-sm text-gray-300 mt-2">{client?.infraction || "—"}</p>
            </div>
            <div className="border border-gray-800 bg-[#0a0a0a] p-4">
              <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Dernière activité</p>
              <p className="text-sm text-white mt-2">{lastActivityLabel}</p>
              <p className="text-[10px] font-mono text-gray-500 mt-2">{lastActivityDesc}</p>
            </div>
            <div className="border border-gray-800 bg-[#0a0a0a] p-4">
              <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Résumé rapide</p>
              <div className="mt-3 grid grid-cols-2 gap-3 text-[10px] font-mono uppercase tracking-widest text-gray-500">
                <div className="border border-gray-800 bg-black/50 px-3 py-2">
                  <span className="block text-gray-400">Documents</span>
                  <span className="text-neon-blue text-sm">{historyItems.length}</span>
                </div>
                <div className="border border-gray-800 bg-black/50 px-3 py-2">
                  <span className="block text-gray-400">Brouillons</span>
                  <span className="text-neon-blue text-sm">{draftCount}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* --- COLONNE GAUCHE --- */}
        <div className="lg:col-span-1 space-y-6">
            <div className="bg-[#0a0a0a] border border-gray-800 p-6 relative">
                <h3 className="font-orbitron text-white mb-4 flex items-center gap-2 text-sm tracking-widest border-b border-gray-800 pb-2">
                    {getInfoIcon()} {getInfoTitle()}
                </h3>
                <div className="grid grid-cols-2 gap-3 text-[10px] font-mono uppercase tracking-widest text-gray-500">
                  <div className="border border-gray-800 bg-black/50 px-3 py-2">
                    <span className="block text-gray-400">Type</span>
                    <span className="text-white text-sm">{getTypeLabel(dossierType)}</span>
                  </div>
                  <div className="border border-gray-800 bg-black/50 px-3 py-2">
                    <span className="block text-gray-400">Statut</span>
                    <span className="text-white text-sm">{dossierStatus.toUpperCase()}</span>
                  </div>
                  <div className="border border-gray-800 bg-black/50 px-3 py-2">
                    <span className="block text-gray-400">Ouverture</span>
                    <span className="text-white text-sm">{formatDate(client?.createdAtMs)}</span>
                  </div>
                  <div className="border border-gray-800 bg-black/50 px-3 py-2">
                    <span className="block text-gray-400">Dernière action</span>
                    <span className="text-white text-sm">{lastActivity ? formatShortDate(lastActivityMs) : "—"}</span>
                  </div>
                </div>
            </div>

            <div className="bg-[#0a0a0a] border border-gray-800 p-6 relative">
                <div className="flex items-center justify-between mb-4 border-b border-gray-800 pb-2">
                  <h3 className="font-orbitron text-white flex items-center gap-2 text-sm tracking-widest">
                    <Shield size={14} className="text-neon-blue"/> CONTACT & NOTES
                  </h3>
                  <button onClick={handleSaveInfo} disabled={saving} className="flex items-center gap-2 text-[10px] font-orbitron uppercase tracking-widest border border-neon-blue/40 text-neon-blue px-3 py-1 hover:bg-neon-blue hover:text-black transition-all">
                    {saving ? "..." : <><Save size={12} /> Sauvegarder</>}
                  </button>
                </div>
                <div className="space-y-4">
                    <div>
                        <label className="text-[10px] text-neon-blue font-orbitron block mb-1">TÉLÉPHONE</label>
                        <input 
                            type="text" 
                            value={telephone} 
                            onChange={(e) => setTelephone(e.target.value)} 
                            className="w-full bg-[#050505] border border-gray-800 text-white p-2 font-mono text-sm focus:border-neon-blue outline-none transition-all" 
                            placeholder="EX: 555-0192"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] text-neon-blue font-orbitron block mb-1">NOTES OPÉRATIONNELLES</label>
                        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full h-36 bg-[#050505] border border-gray-800 text-gray-300 p-2 font-mono text-sm focus:border-neon-blue outline-none resize-none custom-scrollbar" placeholder="Synthèse, priorités, éléments sensibles..." />
                    </div>
                </div>
            </div>

            <div className="bg-[#0a0a0a] border border-gray-800 p-6 relative max-h-[520px] overflow-y-auto custom-scrollbar">
                <div className="flex items-center justify-between mb-4 border-b border-gray-800 pb-2">
                  <h3 className="font-orbitron text-white flex items-center gap-2 text-sm tracking-widest">
                      <Clock size={14} className="text-neon-blue"/> HISTORIQUE ACTIVITÉ
                  </h3>
                  <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">
                    {filteredHistory.length} entrées
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-3 text-gray-500" />
                    <input
                      type="text"
                      value={historyQuery}
                      onChange={(e) => setHistoryQuery(e.target.value)}
                      placeholder="Filtrer par type, ref, note..."
                      className="w-full bg-[#050505] border border-gray-800 text-white p-2 pl-9 font-mono text-xs focus:border-neon-blue outline-none transition-all"
                    />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {historyTabs.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setHistoryFilter(tab.id)}
                        className={`px-2 py-1 text-[9px] font-orbitron uppercase tracking-widest border transition-all ${
                          historyFilter === tab.id
                            ? "border-neon-blue bg-neon-blue/10 text-white"
                            : "border-gray-800 text-gray-400 hover:border-gray-600"
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3 mt-4">
                    {filteredHistory.length > 0 ? (
                        filteredHistory.map((log, index) => {
                          const logMs = getTimestampMs(log.date);
                          return (
                            <div 
                              key={`${log.type}-${index}`} 
                              onClick={() => log.data && handleHistoryClick(log)}
                              className={`border border-gray-800 bg-black/40 p-3 transition-all ${log.data ? 'cursor-pointer hover:border-neon-blue/50 hover:bg-black/60' : 'opacity-60'}`}
                            >
                              <div className="flex items-start justify-between gap-4">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className={`text-[10px] font-orbitron uppercase tracking-widest px-2 py-1 border ${getDocumentTone(log.type)}`}>
                                      {log.type}
                                    </span>
                                    {log.data && <ExternalLink size={10} className="text-gray-600"/>}
                                  </div>
                                  <p className="text-xs text-gray-300 font-mono">{log.ref || "Sans référence"}</p>
                                  {log.desc && <p className="text-[10px] text-gray-500">{log.desc}</p>}
                                </div>
                                <div className="text-right text-[10px] font-mono text-gray-500">
                                  <div>{formatShortDate(logMs)}</div>
                                  <div>{formatTime(logMs)}</div>
                                </div>
                              </div>
                            </div>
                          );
                        })
                    ) : (
                        <p className="text-gray-600 text-xs italic text-center py-6">Aucune activité ne correspond aux filtres.</p>
                    )}
                </div>
            </div>
        </div>

        {/* --- COLONNE DROITE --- */}
        <div className="lg:col-span-2 space-y-6">
            <div className="bg-[#0a0a0a] border border-gray-800 p-8 min-h-[600px] relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10"><FileText size={200} className="text-neon-blue" /></div>
                <div className="flex items-center justify-between border-b border-gray-800 pb-4 mb-6 relative z-10">
                  <h3 className="font-orbitron text-white text-xl flex items-center gap-2">
                    <span>GÉNÉRATEUR DE PROCÉDURES</span>
                  </h3>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-gray-500">Brouillons: <span className="text-neon-blue">{draftCount}</span></span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10">
                  {documentCards.map((card) => {
                    const Icon = card.icon;
                    const lastDoc = historyByType[card.type];
                    const lastDocMs = lastDoc ? getTimestampMs(lastDoc.date) : 0;
                    return (
                      <button
                        key={card.id}
                        onClick={card.action}
                        className="group relative p-6 border border-gray-700 hover:border-neon-blue transition-all text-left bg-black/80 hover:bg-neon-blue/5 overflow-hidden"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="bg-gray-900 p-2 rounded text-neon-blue border border-gray-700 group-hover:border-neon-blue/50">
                            <Icon className="w-6 h-6 text-gray-500 group-hover:text-neon-blue transition-colors" />
                          </div>
                          {card.saved && (
                            <span className="text-[10px] text-green-500 font-mono flex items-center gap-1">
                              <Save size={10}/> BROUILLON
                            </span>
                          )}
                        </div>
                        <h4 className="font-bold text-white group-hover:text-neon-blue font-orbitron tracking-wide mt-4">{card.label}</h4>
                        <p className="text-xs text-gray-400 font-mono mt-2 min-h-[32px]">{card.description}</p>
                        <div className="flex items-center justify-between text-[10px] font-mono text-gray-500 mt-4">
                          <span>{lastDoc ? `Dernière: ${formatDate(lastDocMs)}` : "Jamais généré"}</span>
                          <span className="flex items-center gap-1 text-neon-blue font-orbitron uppercase tracking-widest">
                            Ouvrir <ArrowUpRight size={12} />
                          </span>
                        </div>
                      </button>
                    );
                  })}
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
