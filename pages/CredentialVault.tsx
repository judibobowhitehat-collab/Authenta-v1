import React, { useState, useEffect } from 'react';
import { Lock, Key, Hash, Eye, EyeOff, Trash2, Plus, Shield, Search } from 'lucide-react';
import { User, Invention, VaultItem } from '../types';
import { getUserInventions, getVaultItems, saveVaultItem, deleteVaultItem } from '../services/firebaseService';
import { encryptText, decryptText } from '../services/cryptoService';
import { toast } from 'sonner';

interface CredentialVaultProps {
  user?: User;
}

export const CredentialVault: React.FC<CredentialVaultProps> = ({ user }) => {
  const [isLocked, setIsLocked] = useState(true);
  const [masterPassword, setMasterPassword] = useState('');
  const [activeTab, setActiveTab] = useState<'hashes' | 'passwords'>('hashes');
  
  const [inventions, setInventions] = useState<Invention[]>([]);
  const [vaultItems, setVaultItems] = useState<VaultItem[]>([]);
  
  // New Entry State
  const [newEntryFileId, setNewEntryFileId] = useState('');
  const [newEntryPassword, setNewEntryPassword] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    if (user && !isLocked) {
      loadData();
    }
  }, [user, isLocked]);

  const loadData = async () => {
    if (!user) return;
    try {
      const invs = await getUserInventions(user.uid);
      setInventions(invs);
      
      const items = await getVaultItems(user.uid);
      setVaultItems(items);
    } catch (e) {
      console.error("Failed to load vault data", e);
    }
  };

  const unlockVault = (e: React.FormEvent) => {
    e.preventDefault();
    if (masterPassword.length < 4) {
      toast.error("Password too short");
      return;
    }
    setIsLocked(false);
    toast.success("Vault Unlocked");
  };

  const handleAddEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEntryFileId || !newEntryPassword || !user) return;

    try {
      const selectedFile = inventions.find(i => i.id === newEntryFileId);
      const encryptedData = await encryptText(newEntryPassword, masterPassword); // Encrypt using session master

      await saveVaultItem({
        userId: user.uid,
        fileId: newEntryFileId,
        fileName: selectedFile ? selectedFile.fileName : "Unknown File",
        fileHash: selectedFile ? selectedFile.hash : "N/A",
        encryptedPassword: encryptedData,
        iv: "", // Handled inside encryptText output
        createdAt: new Date()
      });

      setNewEntryFileId("");
      setNewEntryPassword("");
      setIsAdding(false);
      loadData();
      toast.success("Password securely saved");
    } catch (e) {
      toast.error("Encryption failed");
    }
  };

  const handleDeleteEntry = async (id: string) => {
    if (window.confirm("Remove this credential?")) {
      await deleteVaultItem(id);
      setVaultItems(prev => prev.filter(i => i.id !== id));
      toast.success("Removed");
    }
  };

  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());

  const togglePasswordVisibility = async (item: VaultItem) => {
    if (visiblePasswords.has(item.id)) {
      const next = new Set(visiblePasswords);
      next.delete(item.id);
      setVisiblePasswords(next);
    } else {
      try {
        const decrypted = await decryptText(item.encryptedPassword, masterPassword);
        // We cheat a bit for UI simplicity: we replace the encrypted text in memory or just show an alert
        // A better way is to store decrypted values in a temp map
        // For now, let's just alert it or store in a local state map for "revealed"
        // Let's implement a 'revealedValues' map
        setRevealedValues(prev => ({ ...prev, [item.id]: decrypted }));
        
        const next = new Set(visiblePasswords);
        next.add(item.id);
        setVisiblePasswords(next);
      } catch (e) {
        toast.error("Failed to decrypt. Wrong Master Password?");
      }
    }
  };

  const [revealedValues, setRevealedValues] = useState<Record<string, string>>({});

  if (isLocked) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <div className="bg-cardbg border border-slate-700 p-8 rounded-xl max-w-md w-full shadow-2xl glass-panel">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-slate-800 rounded-full text-neon-400 border border-slate-600">
              <Lock size={32} />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-white text-center mb-2">Credential Vault</h2>
          <p className="text-slate-400 text-center text-sm mb-6">
            Enter a Session Master Password to access your stored credentials. This password encrypts your data in memory.
          </p>
          <form onSubmit={unlockVault} className="space-y-4">
            <input 
              type="password" 
              autoFocus
              value={masterPassword}
              onChange={e => setMasterPassword(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-neon-500 focus:outline-none text-center tracking-widest"
              placeholder="Session Master Key"
            />
            <button type="submit" className="w-full bg-neon-600 hover:bg-neon-500 text-white font-bold py-3 rounded-lg transition-colors">
              Unlock Vault
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Key className="text-neon-400" /> Credential Vault
        </h2>
        <button onClick={() => setIsLocked(true)} className="text-sm text-red-400 hover:underline">
          Lock Vault
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800">
        <button 
          onClick={() => setActiveTab('hashes')}
          className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 ${activeTab === 'hashes' ? 'border-neon-400 text-neon-400' : 'border-transparent text-slate-400 hover:text-white'}`}
        >
          Digital Fingerprints (Hashes)
        </button>
        <button 
          onClick={() => setActiveTab('passwords')}
          className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 ${activeTab === 'passwords' ? 'border-neon-400 text-neon-400' : 'border-transparent text-slate-400 hover:text-white'}`}
        >
          Password Store
        </button>
      </div>

      {/* CONTENT: HASHES */}
      {activeTab === 'hashes' && (
        <div className="bg-cardbg border border-slate-800 rounded-xl overflow-hidden glass-panel">
          <div className="p-4 bg-slate-900/50 border-b border-slate-800">
            <p className="text-sm text-slate-400">
              These are the unique SHA-256 fingerprints for your uploaded files. Use these to verify integrity or unlock shared files.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-400">
              <thead className="bg-slate-900 text-xs uppercase font-bold text-slate-500">
                <tr>
                  <th className="px-6 py-3">File Name</th>
                  <th className="px-6 py-3">License</th>
                  <th className="px-6 py-3">Digital Fingerprint (Hash)</th>
                  <th className="px-6 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {inventions.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-800/30">
                    <td className="px-6 py-4 font-medium text-white">{inv.fileName}</td>
                    <td className="px-6 py-4">{inv.license}</td>
                    <td className="px-6 py-4 font-mono text-xs text-neon-400">{inv.hash}</td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => {navigator.clipboard.writeText(inv.hash); toast.success("Hash copied")}}
                        className="text-white hover:text-neon-400"
                      >
                        <Search size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
                {inventions.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center italic">No files found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CONTENT: PASSWORDS */}
      {activeTab === 'passwords' && (
        <div className="space-y-6">
          {/* Add New */}
          {!isAdding ? (
            <button 
              onClick={() => setIsAdding(true)}
              className="flex items-center gap-2 bg-neon-600 hover:bg-neon-500 text-white px-4 py-2 rounded-lg font-bold text-sm"
            >
              <Plus size={16} /> Store New Password
            </button>
          ) : (
            <div className="bg-cardbg border border-neon-500/50 p-4 rounded-xl max-w-2xl animate-fade-in glass-panel">
              <h3 className="font-bold text-white mb-4">Secure New Credential</h3>
              <form onSubmit={handleAddEntry} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">LINK TO FILE</label>
                  <select 
                    value={newEntryFileId}
                    onChange={e => setNewEntryFileId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-sm"
                  >
                    <option value="">-- Select File --</option>
                    {inventions.map(i => (
                      <option key={i.id} value={i.id}>{i.title} ({i.fileName})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">PASSWORD TO STORE</label>
                  <input 
                    type="text"
                    value={newEntryPassword}
                    onChange={e => setNewEntryPassword(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-sm font-mono"
                    placeholder="Enter the password you used..."
                  />
                </div>
                <div className="flex gap-3">
                  <button type="submit" className="bg-neon-500 text-black font-bold px-4 py-2 rounded text-sm">Encrypt & Save</button>
                  <button type="button" onClick={() => setIsAdding(false)} className="text-slate-400 px-4 py-2 text-sm hover:text-white">Cancel</button>
                </div>
              </form>
            </div>
          )}

          {/* List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {vaultItems.map((item) => (
              <div key={item.id} className="bg-cardbg border border-slate-800 p-5 rounded-xl hover:border-neon-500/30 transition-colors glass-panel group">
                <div className="flex justify-between items-start mb-3">
                  <div className="p-2 bg-slate-800 rounded-lg text-neon-400">
                    <Shield size={20} />
                  </div>
                  <button onClick={() => handleDeleteEntry(item.id)} className="text-slate-600 hover:text-red-400">
                    <Trash2 size={16} />
                  </button>
                </div>
                <h4 className="font-bold text-white truncate mb-1">{item.fileName}</h4>
                <p className="text-xs text-slate-500 font-mono mb-4 truncate" title={item.fileHash}>Hash: {item.fileHash.substring(0, 12)}...</p>
                
                <div className="bg-black/50 p-3 rounded border border-slate-700 flex justify-between items-center">
                  <span className="font-mono text-sm text-neon-400">
                    {visiblePasswords.has(item.id) ? revealedValues[item.id] : "••••••••••••"}
                  </span>
                  <button 
                    onClick={() => togglePasswordVisibility(item)}
                    className="text-slate-500 hover:text-white"
                  >
                    {visiblePasswords.has(item.id) ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
            ))}
            {vaultItems.length === 0 && !isAdding && (
               <div className="col-span-full py-12 text-center text-slate-500 border border-dashed border-slate-800 rounded-xl">
                 No passwords stored in vault.
               </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};