import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from "firebase/auth";
import { collection, getDocs, addDoc, query, serverTimestamp } from "firebase/firestore";
import { auth, db } from '../firebase';
import { LogOut, Plus, User, FolderOpen, X, Fingerprint, Activity, Building2, Users, Search, ChevronDown, ArrowUpRight } from 'lucide-react';
import Layout from '../components/layout/Layout';

export default function Dashboard() {
  const navigate = useNavigate();
  const [dossiers, setDossiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [queryText, setQueryText] = useState("");
  const [activeType, setActiveType] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
  
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

  const normalizeType = (value) => (value || "individu").toLowerCase();

  const getIconByType = (type) => {
    if (type === 'entreprise') return <Building2 size={20} />;
    if (type === 'organisation') return <Users size={20} />;
    return <User size={20} />;
  };

  const typeTabs = [
    { id: "all", label: "Tous" },
    { id: "individu", label: "Individus" },
    { id: "entreprise", label: "Entreprises" },
    { id: "organisation", label: "Organisations" },
  ];

  const getTypeLabel = (type) => {
    if (type === "entreprise") return "Entreprise";
    if (type === "organisation") return "Organisation";
    return "Individu";
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

  const getTypeTone = (type) => {
    if (type === "entreprise") return "border-amber-500/40 text-amber-300 bg-amber-500/10";
    if (type === "organisation") return "border-purple-500/40 text-purple-300 bg-purple-500/10";
    return "border-neon-blue/40 text-neon-blue bg-neon-blue/10";
  };

  const formatDateMs = (ms) => {
    if (!ms) return "—";
    return new Date(ms).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const stats = useMemo(() => {
    const now = Date.now();
    const counts = { individu: 0, entreprise: 0, organisation: 0 };
    let recent = 0;
    let lastCreatedMs = 0;

    dossiers.forEach((dossier) => {
      const type = normalizeType(dossier.type);
      counts[type] = (counts[type] || 0) + 1;
      if (dossier.createdAtMs && now - dossier.createdAtMs <= 7 * 24 * 60 * 60 * 1000) recent += 1;
      if (dossier.createdAtMs && dossier.createdAtMs > lastCreatedMs) lastCreatedMs = dossier.createdAtMs;
    });

    return {
      total: dossiers.length,
      recent,
      lastCreatedMs,
      ...counts,
    };
  }, [dossiers]);

  const totalCount = stats.total || 0;
  const individuPct = totalCount ? Math.round((stats.individu / totalCount) * 100) : 0;
  const entreprisePct = totalCount ? Math.round((stats.entreprise / totalCount) * 100) : 0;
  const organisationPct = totalCount ? Math.round((stats.organisation / totalCount) * 100) : 0;

  const filteredDossiers = useMemo(() => {
    let list = dossiers;
    const needle = queryText.trim().toLowerCase();

    if (activeType !== "all") {
      list = list.filter((dossier) => normalizeType(dossier.type) === activeType);
    }

    if (needle) {
      list = list.filter((dossier) => {
        const haystack = [
          dossier.nom,
          dossier.id,
          dossier.infraction,
          dossier.statut,
          dossier.type,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return haystack.includes(needle);
      });
    }

    const sorted = [...list];
    if (sortBy === "oldest") {
      sorted.sort((a, b) => (a.createdAtMs || 0) - (b.createdAtMs || 0));
    } else if (sortBy === "name-asc") {
      sorted.sort((a, b) => (a.nom || "").localeCompare(b.nom || "", "fr", { sensitivity: "base" }));
    } else if (sortBy === "name-desc") {
      sorted.sort((a, b) => (b.nom || "").localeCompare(a.nom || "", "fr", { sensitivity: "base" }));
    } else {
      sorted.sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0));
    }

    return sorted;
  }, [dossiers, activeType, queryText, sortBy]);

  return (
    <Layout>
      {/* NAVBAR */}
      <nav className="border-b border-gray-800 bg-black/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 bg-neon-blue rounded-sm rotate-45 flex items-center justify-center shadow-[0_0_12px_#00f3ff]">
              <span className="font-orbitron font-bold text-black -rotate-45">M</span>
            </div>
            <div>
              <h1 className="font-orbitron text-xl tracking-widest text-white">MOORE <span className="text-neon-blue">LEGAL OS</span></h1>
              <p className="text-[10px] text-gray-500 font-mono tracking-widest uppercase">Interface de contrôle</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex items-center gap-2 border border-gray-800 bg-black/60 text-[10px] font-mono text-gray-400 uppercase tracking-widest px-3 py-1 rounded-full">
              <span className="h-2 w-2 rounded-full bg-neon-blue animate-pulse" />
              {totalCount} dossiers
            </span>
            <button onClick={handleLogout} className="flex items-center gap-2 text-red-500/70 hover:text-red-500 transition-colors text-xs font-orbitron font-bold uppercase border border-red-500/30 px-3 py-1 hover:bg-red-500/10">
              <LogOut size={14} /> DÉCONNEXION
            </button>
          </div>
        </div>
      </nav>

      <main className="p-6 max-w-7xl mx-auto space-y-8">
        <section className="grid gap-6 lg:grid-cols-[1.35fr_1fr]">
          <div className="relative overflow-hidden border border-gray-800 bg-[#070707]/80 p-6 shadow-[0_0_30px_rgba(0,243,255,0.08)]">
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-neon-blue/10 blur-3xl" />
            <div className="relative z-10 space-y-6">
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                <div>
                  <p className="text-neon-blue font-mono text-xs tracking-widest uppercase flex items-center gap-2">
                    <FolderOpen size={14} /> Gestion judiciaire
                  </p>
                  <h2 className="text-4xl font-orbitron text-white mt-2">Archives courantes</h2>
                  <p className="text-gray-400 text-sm mt-2 max-w-xl">
                    Centralisez vos dossiers actifs, filtrez par typologie et accédez aux procédures en un clic.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => { setNouveauClient(""); setShowModal(true); }}
                    className="px-6 py-3 bg-neon-blue/10 border border-neon-blue text-neon-blue font-orbitron font-bold uppercase tracking-wider hover:bg-neon-blue hover:text-black transition-all"
                  >
                    <span className="flex items-center gap-2"><Plus size={18} /> Ouvrir un dossier</span>
                  </button>
                </div>
              </div>

              <div className="flex flex-col lg:flex-row gap-4">
                <div className="relative flex-1">
                  <Search size={16} className="absolute left-4 top-3.5 text-gray-500" />
                  <input
                    type="text"
                    value={queryText}
                    onChange={(e) => setQueryText(e.target.value)}
                    placeholder="Rechercher un client, un ID ou un statut..."
                    className="w-full bg-[#0a0a0a] border border-gray-700 text-white font-mono p-3 pl-11 focus:outline-none focus:border-neon-blue transition-all"
                  />
                </div>
                <div className="relative w-full lg:w-56">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full appearance-none bg-[#0a0a0a] border border-gray-700 text-gray-200 font-mono p-3 pr-10 focus:outline-none focus:border-neon-blue transition-all"
                  >
                    <option value="recent">Plus récents</option>
                    <option value="oldest">Plus anciens</option>
                    <option value="name-asc">Nom (A → Z)</option>
                    <option value="name-desc">Nom (Z → A)</option>
                  </select>
                  <ChevronDown size={16} className="absolute right-4 top-3.5 text-gray-500 pointer-events-none" />
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {typeTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveType(tab.id)}
                    className={`px-3 py-1 text-[10px] font-orbitron uppercase tracking-widest border transition-all ${
                      activeType === tab.id
                        ? "border-neon-blue bg-neon-blue/10 text-white"
                        : "border-gray-800 text-gray-400 hover:border-gray-600"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="text-[10px] font-mono text-gray-500 tracking-widest uppercase">
                Affichage {filteredDossiers.length} sur {dossiers.length}
                {queryText && <span className="text-neon-blue"> • Recherche: "{queryText}"</span>}
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="border border-gray-800 bg-[#0a0a0a] p-5">
              <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Total dossiers</p>
              <p className="text-3xl font-orbitron text-white mt-2">{stats.total}</p>
              <p className="text-[10px] font-mono text-gray-500 mt-2">
                Dernière création: <span className="text-neon-blue">{formatDateMs(stats.lastCreatedMs)}</span>
              </p>
            </div>
            <div className="border border-gray-800 bg-[#0a0a0a] p-5">
              <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Nouveaux (7 jours)</p>
              <p className="text-3xl font-orbitron text-white mt-2">{stats.recent}</p>
              <p className="text-[10px] font-mono text-gray-500 mt-2">Flux récent prioritaire</p>
            </div>
            <div className="border border-gray-800 bg-[#0a0a0a] p-5 sm:col-span-2">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Répartition</p>
                <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">{totalCount} total</span>
              </div>
              <div className="mt-4 space-y-3">
                <div>
                  <div className="flex items-center justify-between text-[10px] font-mono text-gray-400 uppercase tracking-widest">
                    <span>Individus</span>
                    <span>{stats.individu}</span>
                  </div>
                  <div className="h-1.5 bg-black/60 border border-gray-800 mt-2">
                    <div className="h-1.5 bg-neon-blue" style={{ width: `${individuPct}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-[10px] font-mono text-gray-400 uppercase tracking-widest">
                    <span>Entreprises</span>
                    <span>{stats.entreprise}</span>
                  </div>
                  <div className="h-1.5 bg-black/60 border border-gray-800 mt-2">
                    <div className="h-1.5 bg-amber-400" style={{ width: `${entreprisePct}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-[10px] font-mono text-gray-400 uppercase tracking-widest">
                    <span>Organisations</span>
                    <span>{stats.organisation}</span>
                  </div>
                  <div className="h-1.5 bg-black/60 border border-gray-800 mt-2">
                    <div className="h-1.5 bg-purple-400" style={{ width: `${organisationPct}%` }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-orbitron text-white uppercase tracking-widest flex items-center gap-2">
              <Activity size={14} className="text-neon-blue" /> Dossiers actifs
            </h3>
            <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">
              Synchronisation {loading ? "en cours" : "terminée"}
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={`skeleton-${index}`} className="h-44 bg-[#0a0a0a] border border-gray-800 animate-pulse" />
              ))}
            </div>
          ) : filteredDossiers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredDossiers.map((dossier) => {
                const type = normalizeType(dossier.type);
                const statusLabel = dossier.statut ? dossier.statut.toUpperCase() : "INSTRUCTION";
                return (
                  <div
                    key={dossier.id}
                    onClick={() => navigate(`/dossier/${dossier.id}`)}
                    className="group relative bg-[#0a0a0a] border border-gray-800 p-6 hover:border-neon-blue transition-all cursor-pointer overflow-hidden shadow-lg hover:-translate-y-1"
                  >
                    <div className="absolute top-0 left-0 w-1 h-full bg-gray-800 group-hover:bg-neon-blue transition-colors duration-300" />
                    <div className="flex items-start justify-between gap-4 mb-4 pl-3">
                      <div className="flex items-center gap-3">
                        <div className="bg-gray-900 p-2 rounded text-neon-blue border border-gray-700 group-hover:border-neon-blue/50">
                          {getIconByType(type)}
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-white group-hover:text-neon-blue transition-colors truncate max-w-[180px]">
                            {dossier.nom}
                          </h3>
                          <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">
                            REF {dossier.id.substring(0, 4).toUpperCase()}
                          </p>
                        </div>
                      </div>
                      <span className={`text-[10px] font-orbitron font-bold px-2 py-1 border ${getStatusTone(statusLabel)}`}>
                        {statusLabel}
                      </span>
                    </div>

                    <div className="pl-3">
                      <p className="text-xs text-gray-400 font-mono min-h-[32px]">
                        {dossier.infraction || "Aucune infraction renseignée."}
                      </p>
                      <div className="flex items-center justify-between text-xs text-gray-600 font-mono border-t border-gray-900 pt-4 mt-4">
                        <span className={`text-[10px] font-orbitron uppercase tracking-widest px-2 py-1 border ${getTypeTone(type)}`}>
                          {getTypeLabel(type)}
                        </span>
                        <span className="text-gray-500">{formatDateMs(dossier.createdAtMs)}</span>
                      </div>
                      <div className="flex items-center justify-end gap-1 text-xs text-neon-blue mt-3 font-orbitron uppercase tracking-widest">
                        Ouvrir <ArrowUpRight size={12} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="border border-dashed border-gray-700 bg-[#0a0a0a] p-10 text-center">
              <p className="text-gray-400 font-mono text-sm">
                Aucun dossier ne correspond aux filtres actuels.
              </p>
              <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={() => { setNouveauClient(""); setShowModal(true); }}
                  className="px-5 py-2 bg-neon-blue/10 border border-neon-blue text-neon-blue font-orbitron font-bold uppercase tracking-wider hover:bg-neon-blue hover:text-black transition-all"
                >
                  Créer un dossier
                </button>
                {(queryText || activeType !== "all") && (
                  <button
                    onClick={() => { setQueryText(""); setActiveType("all"); }}
                    className="px-5 py-2 border border-gray-700 text-gray-400 font-orbitron text-xs uppercase tracking-wider hover:border-gray-500 hover:text-white transition-all"
                  >
                    Réinitialiser les filtres
                  </button>
                )}
              </div>
            </div>
          )}
        </section>
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
