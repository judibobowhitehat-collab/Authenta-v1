import React, { useState, useEffect } from 'react';
import { HashRouter } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Auth } from './pages/Auth';
import { Rewrite } from './pages/Rewrite';
import { Classify } from './pages/Classify';
import { Encrypt } from './pages/Encrypt';
import { InventionStore } from './pages/InventionStore';
import { HashTools } from './pages/HashTools';
import { Marketplace } from './pages/Marketplace';
import { Collaborators } from './pages/Collaborators';
import { CredentialVault } from './pages/CredentialVault';
import { User } from './types';
import { auth } from './firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          name: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = () => {
    auth.signOut();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-darkbg flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
           <div className="w-12 h-12 border-4 border-neon-500/30 border-t-neon-500 rounded-full animate-spin"></div>
           <p className="text-neon-400 font-mono text-sm tracking-widest animate-pulse">LOADING AUTHENTA...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  return (
    <HashRouter>
      <Layout 
        activePage={currentPage} 
        onNavigate={setCurrentPage} 
        user={user}
        onLogout={handleLogout}
      >
        {currentPage === 'dashboard' && <Dashboard user={user} onNavigate={setCurrentPage} />}
        {currentPage === 'vault' && <InventionStore user={user} />}
        {currentPage === 'rewrite' && <Rewrite />}
        {currentPage === 'classify' && <Classify />}
        {currentPage === 'hashtools' && <HashTools />}
        {currentPage === 'encrypt' && <Encrypt />}
        {currentPage === 'marketplace' && <Marketplace />}
        {currentPage === 'collaborators' && <Collaborators />}
        {currentPage === 'credential-vault' && <CredentialVault user={user} />}
      </Layout>
    </HashRouter>
  );
}

export default App;