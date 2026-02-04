import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged, signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "./firebase";
import { Scale, ShieldCheck, Fingerprint, Lock, AlertTriangle } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import ClientDossier from './pages/ClientDossier';

function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // --- COMPOSANT LOGIN (Interne) ---
  const LoginScreen = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
      e.preventDefault();
      setLoading(true);
      try {
        await signInWithEmailAndPassword(auth, email, password);
      } catch (err) {
        setError("IDENTIFICATION ÉCHOUÉE : Accès refusé.");
        setLoading(false);
      }
    };

    return (
        <div className="relative min-h-screen flex items-center justify-center bg-[#050505]">
        <div className="absolute inset-0 z-0 opacity-40" style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1605806616949-1e87b487bc2a?q=80&w=2574&auto=format&fit=crop")', backgroundSize: 'cover', backgroundPosition: 'center', filter: 'blur(3px)' }} />
        <div className="absolute inset-0 z-0 cyber-grid" />
        <div className="scanline" />
  
        <div className="relative z-10 w-full max-w-md p-1">
          <div className="bg-black/90 backdrop-blur-md border border-gray-800 p-8 shadow-[0_0_40px_rgba(0,243,255,0.15)]">
            <div className="flex flex-col items-center mb-8">
              <div className="p-4 rounded-full border-2 border-neon-blue shadow-[0_0_15px_#00f3ff] mb-4 bg-black/50">
                <Scale size={48} className="text-neon-blue" />
              </div>
              <h1 className="font-orbitron text-3xl font-bold text-white tracking-widest text-center">
                MOORE <span className="text-neon-blue">LEGAL</span>
              </h1>
              <p className="text-neon-pink font-mono text-xs tracking-wider mt-2 flex items-center gap-2">
                <ShieldCheck size={14} /> PORTAIL SÉCURISÉ v4.5
              </p>
            </div>
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-orbitron text-gray-400 uppercase tracking-widest ml-1">Identifiant NetLink</label>
                <div className="relative group">
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-[#0a0a0a] border border-gray-700 text-neon-blue font-mono p-3 pl-10 focus:outline-none focus:border-neon-blue transition-all" placeholder="ID.NETLINK" />
                  <div className="absolute left-3 top-3.5 text-gray-500"><Fingerprint size={18} /></div>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-orbitron text-gray-400 uppercase tracking-widest ml-1">Clé de chiffrement</label>
                <div className="relative">
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••••••" className="w-full bg-[#0a0a0a] border border-gray-700 text-white font-mono p-3 pl-10 focus:outline-none focus:border-neon-pink transition-all" />
                  <div className="absolute left-3 top-3.5 text-gray-500"><Lock size={18} /></div>
                </div>
              </div>
              {error && <div className="bg-red-500/10 border border-red-500 text-red-500 p-3 text-xs font-mono flex items-center gap-2"><AlertTriangle size={14} /> {error}</div>}
              <button type="submit" disabled={loading} className="w-full bg-neon-blue/10 border border-neon-blue text-neon-blue font-orbitron font-bold py-3 px-4 hover:bg-neon-blue hover:text-black transition-all duration-300 disabled:opacity-50">
                {loading ? "AUTHENTIFICATION..." : "INITIALISER L'INTERFACE"}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  };

  if (authLoading) return null;

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={!user ? <LoginScreen /> : <Navigate to="/" />} />
        <Route path="/" element={user ? <Dashboard /> : <Navigate to="/login" />} />
        <Route path="/dossier/:id" element={user ? <ClientDossier /> : <Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;