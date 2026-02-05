import React, { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from '../firebase';
import { ArrowLeft, Search, ExternalLink, CheckCircle, Trash2, AlertTriangle } from 'lucide-react';
import Layout from '../components/layout/Layout';

const OrdonnanceEditor = lazy(() => import('../components/OrdonnanceEditor'));
const ContratEditor = lazy(() => import('../components/documents/ContratEditor'));
const PlainteEditor = lazy(() => import('../components/documents/PlainteEditor'));
const FactureEditor = lazy(() => import('../components/documents/FactureEditor'));

export default function ClientHistorique() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [docSavedMessage, setDocSavedMessage] = useState("");
  const [uiNotice, setUiNotice] = useState({ message: "", tone: "info" });
  const [historyQuery, setHistoryQuery] = useState("");
  const [historyFilter, setHistoryFilter] = useState("all");
  const [confirmState, setConfirmState] = useState(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

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

  const getDocumentTone = (type) => {
    if (type === "ORDONNANCE") return "border-neon-blue/40 text-neon-blue bg-neon-blue/10";
    if (type === "CONTRAT") return "border-amber-500/40 text-amber-300 bg-amber-500/10";
    if (type === "PLAINTE") return "border-red-500/40 text-red-300 bg-red-500/10";
    if (type === "FACTURE") return "border-emerald-500/40 text-emerald-300 bg-emerald-500/10";
    return "border-gray-700 text-gray-300 bg-gray-900/40";
  };

  const fetchClient = async () => {
    try {
      const docRef = doc(db, "clients", id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setClient({ id: docSnap.id, ...data, createdAtMs: getTimestampMs(data.createdAt) });
      }
    } catch (error) { console.error(error); }
    setLoading(false);
  };

  useEffect(() => { fetchClient(); }, [id]);

  const showNotice = (message, tone = "info") => {
    setUiNotice({ message, tone });
    setTimeout(() => setUiNotice({ message: "", tone: "info" }), 3000);
  };

  const handleSaveDocument = async (docType, docData) => {
    try {
      const docRef = doc(db, "clients", id);
      await updateDoc(docRef, { [`saved_${docType}`]: docData });
      setClient(prev => ({ ...prev, [`saved_${docType}`]: docData }));
      setDocSavedMessage(`Brouillon ${docType.toUpperCase()} sauvegardé.`);
      setTimeout(() => setDocSavedMessage(""), 3000);
    } catch (error) { showNotice("Erreur sauvegarde brouillon.", "error"); }
  };

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

  const handleHistoryClick = (log) => {
    if (!log.data) { showNotice("Pas de données restaurables.", "warning"); return; }
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

  const filteredHistory = useMemo(() => {
    const needle = historyQuery.trim().toLowerCase();
    return historyItems
      .map((log, index) => ({ ...log, __index: index }))
      .filter((log) => {
        if (historyFilter !== "all" && log.type !== historyFilter) return false;
        if (!needle) return true;
        const haystack = [log.type, log.ref, log.desc]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return haystack.includes(needle);
      });
  }, [historyItems, historyFilter, historyQuery]);

  const lastActivity = historyItems[0];
  const lastActivityMs = lastActivity ? getTimestampMs(lastActivity.date) : 0;
  const lastActivityLabel = lastActivity ? `${lastActivity.type} • ${lastActivity.ref || "—"}` : "Aucune activité";
  const lastActivityDesc = lastActivity?.desc || "Aucun document généré pour le moment.";

  const handleDeleteHistory = (indexToRemove) => {
    if (!client) return;
    setConfirmState({ type: "single", index: indexToRemove });
  };

  const handleClearHistory = () => {
    if (!client) return;
    setConfirmState({ type: "clear" });
  };

  const handleConfirmAction = async () => {
    if (!confirmState || !client) return;
    setConfirmLoading(true);
    try {
      const docRef = doc(db, "clients", id);
      if (confirmState.type === "clear") {
        await updateDoc(docRef, { history: [] });
        setClient(prev => ({ ...prev, history: [] }));
      } else if (confirmState.type === "single") {
        const nextHistory = historyItems.filter((_, idx) => idx !== confirmState.index);
        await updateDoc(docRef, { history: nextHistory });
        setClient(prev => ({ ...prev, history: nextHistory }));
      }
      setConfirmState(null);
    } catch (error) {
      console.error("Erreur suppression historique:", error);
      showNotice("Erreur suppression historique.", "error");
    } finally {
      setConfirmLoading(false);
    }
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
      {uiNotice.message && (
        <div className={`fixed top-16 left-1/2 -translate-x-1/2 z-50 px-6 py-2 font-mono text-xs uppercase tracking-widest border animate-[fadeIn_0.3s] ${
          uiNotice.tone === "error"
            ? "bg-red-500/10 text-red-400 border-red-500/40"
            : uiNotice.tone === "warning"
              ? "bg-amber-500/10 text-amber-300 border-amber-500/40"
              : "bg-neon-blue/10 text-neon-blue border-neon-blue/40"
        }`}>
          <AlertTriangle size={12} className="inline mr-2" /> {uiNotice.message}
        </div>
      )}

      <header className="border-b border-gray-800 bg-black/90 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-6 py-6 space-y-4">
          <button onClick={() => navigate(`/dossier/${id}`)} className="group flex items-center gap-2 text-gray-400 hover:text-white transition-colors uppercase font-mono text-xs tracking-wider">
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform"/> Retour dossier
          </button>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <p className="text-[10px] text-gray-500 font-mono uppercase tracking-widest">Historique activité</p>
              <h1 className="text-2xl font-orbitron font-bold text-white uppercase tracking-widest flex items-center gap-3 mt-1">
                HISTORIQUE <span className="text-neon-blue">{client?.nom}</span>
              </h1>
              <div className="text-[10px] font-mono text-gray-500 mt-2">
                Dernière activité : <span className="text-neon-blue">{lastActivity ? formatShortDate(lastActivityMs) : "—"}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="border border-gray-800 bg-black/60 px-3 py-2 text-[10px] font-mono uppercase tracking-widest text-gray-400">
                Entrées <span className="text-neon-blue">{historyItems.length}</span>
              </div>
              <div className="border border-gray-800 bg-black/60 px-3 py-2 text-[10px] font-mono uppercase tracking-widest text-gray-400">
                Dernier doc <span className="text-neon-blue">{lastActivity ? formatDate(lastActivityMs) : "—"}</span>
              </div>
              <button
                type="button"
                onClick={handleClearHistory}
                className="px-3 py-2 border border-red-500/40 text-red-400 text-[10px] font-mono uppercase tracking-widest hover:bg-red-500/10 transition-all"
              >
                Tout effacer
              </button>
            </div>
          </div>
          <div className="border border-gray-800 bg-[#0a0a0a] p-4">
            <p className="text-sm text-white">{lastActivityLabel}</p>
            <p className="text-[10px] font-mono text-gray-500 mt-1">{lastActivityDesc}</p>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6 space-y-6">
        <section className="border border-gray-800 bg-[#0a0a0a] p-6 space-y-4">
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
        </section>

        <section className="space-y-3">
          {filteredHistory.length > 0 ? (
            filteredHistory.map((log, index) => {
              const logMs = getTimestampMs(log.date);
              return (
                <div
                  key={`${log.type}-${index}`}
                  onClick={() => log.data && handleHistoryClick(log)}
                  className={`border border-gray-800 bg-black/40 p-4 transition-all ${log.data ? 'cursor-pointer hover:border-neon-blue/50 hover:bg-black/60' : 'opacity-60'}`}
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
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleDeleteHistory(log.__index);
                        }}
                        className="mt-2 inline-flex items-center gap-1 text-red-400 hover:text-red-300 transition-colors"
                      >
                        <Trash2 size={12} /> Supprimer
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="border border-gray-800 bg-black/40 p-6 text-center text-gray-600 text-xs italic">
              Aucune activité ne correspond aux filtres.
            </div>
          )}
        </section>
      </main>

      <Suspense fallback={editorFallback}>
        {showOrdonnance && <OrdonnanceEditor client={client} savedData={client.saved_ordonnance} onSave={(data) => handleSaveDocument("ordonnance", data)} onHistoryAdd={handleAddHistory} onClose={() => setShowOrdonnance(false)} />}
        {showContrat && <ContratEditor client={client} savedData={client.saved_contrat} onSave={(data) => handleSaveDocument("contrat", data)} onHistoryAdd={handleAddHistory} onClose={() => setShowContrat(false)} />}
        {showPlainte && <PlainteEditor client={client} savedData={client.saved_plainte} onSave={(data) => handleSaveDocument("plainte", data)} onHistoryAdd={handleAddHistory} onClose={() => setShowPlainte(false)} />}
        {showFacture && <FactureEditor client={client} savedData={client.saved_facture} onSave={(data) => handleSaveDocument("facture", data)} onHistoryAdd={handleAddHistory} onClose={() => setShowFacture(false)} />}
      </Suspense>

      {confirmState && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md border border-gray-800 bg-[#050505] p-6">
            <h3 className="font-orbitron text-white text-sm uppercase tracking-widest mb-2">Confirmer la suppression</h3>
            <p className="text-xs text-gray-400 font-mono mb-6">
              {confirmState.type === "clear"
                ? "Effacer tout l’historique du dossier ? Cette action est irréversible."
                : "Supprimer cette entrée de l’historique ?"}
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmState(null)}
                disabled={confirmLoading}
                className={`px-4 py-2 border border-gray-700 text-gray-400 font-orbitron text-xs uppercase tracking-widest hover:border-gray-500 hover:text-white transition-all ${confirmLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirmAction}
                disabled={confirmLoading}
                className={`px-4 py-2 border border-red-500/50 text-red-300 font-orbitron text-xs uppercase tracking-widest hover:bg-red-500 hover:text-black transition-all ${confirmLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {confirmLoading ? "Suppression..." : "Confirmer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
