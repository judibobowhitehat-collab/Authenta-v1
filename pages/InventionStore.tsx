import React, { useState, useEffect, useCallback } from 'react';
import { Upload, Lock, Database, FileCode, Download, Award, History, ShieldCheck, Cloud, X, Clock, FilePlus, Fingerprint, Trash2, CheckCircle, AlertCircle, RefreshCw, Activity, RotateCcw, Lightbulb, Sparkles, Key, Share2, Copy, Shield, MoveRight } from 'lucide-react';
import { encryptFile } from '../services/cryptoService';
import { uploadInvention, getUserInventions, updateInvention, uploadVersion, testDatabaseConnection, revertToVersion, deleteInvention } from '../services/firebaseService';
import { generateCertificate } from '../services/pdfService';
import { suggestInventionImprovements } from '../services/geminiService';
import { User, Invention, UploadQueueItem, Version } from '../types';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';

interface InventionStoreProps {
  user: User;
}

export const InventionStore: React.FC<InventionStoreProps> = ({ user }) => {
  const [view, setView] = useState<'upload' | 'list'>('list');
  const [inventions, setInventions] = useState<Invention[]>([]);
  
  // Batch Upload State
  const [uploadQueue, setUploadQueue] = useState<UploadQueueItem[]>([]);
  const [globalTitle, setGlobalTitle] = useState('');
  const [globalDescription, setGlobalDescription] = useState('');
  const [globalLicense, setGlobalLicense] = useState('All Rights Reserved');
  const [accessPassword, setAccessPassword] = useState(''); // Master Password
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // UX State
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Authentication & Unlock State
  const [unlockedItems, setUnlockedItems] = useState<Set<string>>(new Set());
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authTargetId, setAuthTargetId] = useState<string | null>(null);
  const [authInputPassword, setAuthInputPassword] = useState('');

  // Version Control State
  const [selectedInvention, setSelectedInvention] = useState<Invention | null>(null);
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [versionFile, setVersionFile] = useState<File | null>(null);
  const [versionLoading, setVersionLoading] = useState(false);

  // AI & Certificate State
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  // Deletion State
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (user) {
      loadInventions();
    }
  }, [user]);

  const loadInventions = async () => {
    try {
      const data = await getUserInventions(user.uid);
      setInventions(data);
    } catch (e) {
      console.error("Failed to load inventions", e);
      toast.error("Failed to load vault items.");
    }
  };

  const handleFilesSelected = (files: FileList | null) => {
    if (files && files.length > 0) {
      const newItems: UploadQueueItem[] = (Array.from(files) as File[]).map(file => ({
        id: Math.random().toString(36).substr(2, 9),
        file,
        status: 'idle',
        progress: 0,
        speed: 0,
        eta: 0
      }));
      setUploadQueue(prev => [...prev, ...newItems]);
    }
  };

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFilesSelected(e.dataTransfer.files);
  }, []);

  const removeQueueItem = (id: string) => {
    setUploadQueue(prev => prev.filter(item => item.id !== id));
  };

  const runConnectionTest = async () => {
    toast.info("Running diagnostic write to Firestore...");
    const result = await testDatabaseConnection();
    if (result.success) {
      toast.success("Connection Verified: Write Access Granted");
    } else {
      toast.error(result.message);
    }
  };

  // Helper to hash passwords using standard crypto API
  const hashPassword = async (pwd: string): Promise<string> => {
    const msgBuffer = new TextEncoder().encode(pwd);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const generateRandomPassword = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
    let pass = "";
    for (let i = 0; i < 16; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setAccessPassword(pass);
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleFileDownload = (fileUrl: string, fileName: string) => {
    // Check if it's a valid Data URI
    if (!fileUrl.startsWith('data:')) {
      // Fallback for normal URLs (if any legacy ones exist)
      const a = document.createElement('a');
      a.href = fileUrl;
      a.download = fileName;
      a.target = "_blank";
      a.click();
      return;
    }

    try {
      // Split metadata from data
      // data:application/pdf;base64,JVBERi...
      const [metadata, base64] = fileUrl.split(',');
      const mimeMatch = metadata.match(/:(.*?);/);
      const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
      
      // Decode Base64
      const binaryString = atob(base64);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Create Blob and Download
      const blob = new Blob([bytes], { type: mime });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("Download started");
    } catch (e) {
      console.error("Download conversion failed:", e);
      toast.error("Failed to download file. It may be corrupted.");
    }
  };

  const processBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (uploadQueue.length === 0) return;

    setIsProcessing(true);

    // Hash the access password if provided
    let passwordHash = undefined;
    if (accessPassword) {
      passwordHash = await hashPassword(accessPassword);
    }

    // Process sequentially to avoid overwhelming browser crypto
    for (let i = 0; i < uploadQueue.length; i++) {
      const item = uploadQueue[i];
      if (item.status === 'success') continue; // Skip already done

      const startTime = Date.now();
      
      try {
        // Update status to Encrypting (0-20% visual progress)
        setUploadQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: 'encrypting', progress: 10 } : q));
        
        // 1. Encrypt File
        const encrypted = await encryptFile(item.file);
        
        // Update status to Uploading (20%)
        setUploadQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: 'uploading', progress: 20 } : q));

        // 2. Upload MASTER Copy (Locked by PASSWORD)
        // This is the "Private" copy.
        const baseTitle = uploadQueue.length > 1 ? `${globalTitle} - ${item.file.name}` : globalTitle;
        
        if (passwordHash) {
          await uploadInvention(user.uid, encrypted.encryptedBlob, {
            title: `${baseTitle} (Private Master)`,
            description: globalDescription,
            fileName: item.file.name,
            hash: encrypted.hash,
            iv: encrypted.iv,
            license: globalLicense,
            accessHash: passwordHash // LOCKED BY USER PASSWORD
          }, (uploadProgress) => {
            const totalProgress = 20 + (uploadProgress * 0.4);
            const elapsedSeconds = (Date.now() - startTime) / 1000;
            // Rough MB/s calc
            const uploadedBytes = (item.file.size * (uploadProgress / 100));
            const speed = (uploadedBytes / 1024 / 1024) / elapsedSeconds;
            const remainingBytes = item.file.size - uploadedBytes;
            const eta = speed > 0 ? remainingBytes / (speed * 1024 * 1024) : 0;

            setUploadQueue(prev => prev.map(q => q.id === item.id ? { 
              ...q, 
              progress: totalProgress,
              speed: parseFloat(speed.toFixed(2)),
              eta: Math.ceil(eta)
            } : q));
          });
        }

        // 3. Upload SHARED Copy (Locked by FILE HASH)
        // This is the "Public/Shareable" copy.
        // We always create this, or create it as the main if no password provided.
        await uploadInvention(user.uid, encrypted.encryptedBlob, {
          title: passwordHash ? `${baseTitle} (Shared Copy)` : `${baseTitle} (Integrity Master)`,
          description: passwordHash ? `${globalDescription} [Hash Locked]` : globalDescription,
          fileName: item.file.name,
          hash: encrypted.hash,
          iv: encrypted.iv,
          license: globalLicense,
          accessHash: encrypted.hash // LOCKED BY ITS OWN HASH
        }, (uploadProgress) => {
          const totalProgress = 60 + (uploadProgress * 0.4);
           const elapsedSeconds = (Date.now() - startTime) / 1000;
            // Rough MB/s calc
            const uploadedBytes = (item.file.size * (uploadProgress / 100));
            const speed = (uploadedBytes / 1024 / 1024) / elapsedSeconds;
            const remainingBytes = item.file.size - uploadedBytes;
            const eta = speed > 0 ? remainingBytes / (speed * 1024 * 1024) : 0;

          setUploadQueue(prev => prev.map(q => q.id === item.id ? { 
            ...q, 
            progress: totalProgress,
            speed: parseFloat(speed.toFixed(2)),
            eta: Math.ceil(eta)
          } : q));
        });

        // Update status to Success
        setUploadQueue(prev => prev.map(q => q.id === item.id ? { 
          ...q, 
          status: 'success', 
          progress: 100,
          resultKey: encrypted.key,
          resultHash: encrypted.hash // Store hash to show user
        } : q));

        toast.success(`Uploaded ${item.file.name} successfully`);

      } catch (error: any) {
        console.error(`Error uploading ${item.file.name}`, error);
        
        let errorText = 'Upload Failed';
        if (error.code === 'permission-denied') errorText = 'Permission Denied (Rules)';
        if (error.code === 'storage/unauthorized') errorText = 'Storage Unauthorized';
        if (error.code === 'resource-exhausted') errorText = 'File Too Large for Firestore';
        
        setUploadQueue(prev => prev.map(q => q.id === item.id ? { 
          ...q, 
          status: 'error', 
          progress: 0,
          errorMsg: errorText
        } : q));
        toast.error(`Failed to upload ${item.file.name}`);
      }
    }

    setIsProcessing(false);
    loadInventions(); // Refresh list in background
  };

  const resetUploadForm = () => {
    setUploadQueue([]);
    setGlobalTitle('');
    setGlobalDescription('');
    setAccessPassword('');
    setView('list');
  };

  const handleDelete = async (e: React.MouseEvent, id: string, title: string) => {
    e.stopPropagation(); 
    const confirm = window.confirm(`Are you sure you want to PERMANENTLY delete "${title}"? This cannot be undone.`);
    if (confirm) {
      setDeletingIds(prev => new Set(prev).add(id));
      try {
        await deleteInvention(id);
        setInventions(prev => prev.filter(inv => inv.id !== id));
        toast.success("Deleted successfully");
      } catch (err: any) {
        console.error("Delete Error:", err);
        toast.error(`Failed to delete: ${err.message || "Unknown Error"}`);
      } finally {
        setDeletingIds(prev => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    }
  };

  const handleVersionUpload = async () => {
    if (!versionFile || !selectedInvention) return;
    setVersionLoading(true);
    try {
      const encrypted = await encryptFile(versionFile);
      await uploadVersion(selectedInvention.id, versionFile, encrypted.hash, encrypted.iv);
      
      await loadInventions();
      const updatedList = await getUserInventions(user.uid);
      const updatedInv = updatedList.find(i => i.id === selectedInvention.id);
      if (updatedInv) setSelectedInvention(updatedInv);
      setVersionFile(null);
      toast.success("New version uploaded!");
    } catch (error) {
      console.error("Version upload failed", error);
      toast.error("Failed to upload version.");
    } finally {
      setVersionLoading(false);
    }
  };

  const handleRevert = async (version: Version) => {
    if (!selectedInvention) return;
    const confirm = window.confirm(`Are you sure you want to restore "${version.fileName}"? The current version will be archived.`);
    if (!confirm) return;

    setVersionLoading(true);
    try {
      await revertToVersion(selectedInvention.id, version);
      await loadInventions();
      const updatedList = await getUserInventions(user.uid);
      const updatedInv = updatedList.find(i => i.id === selectedInvention.id);
      if (updatedInv) setSelectedInvention(updatedInv);
      toast.success("Version restored successfully.");
    } catch (error) {
      console.error("Revert failed", error);
      toast.error("Failed to restore version.");
    } finally {
      setVersionLoading(false);
    }
  };

  const downloadHash = (fileName: string, hash: string) => {
    const content = `Filename: ${fileName}\nSHA-256 Fingerprint: ${hash}\nGenerated by Authenta\nDate: ${new Date().toISOString()}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName}.hash.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Hash fingerprint downloaded");
  };

  const handleCertificate = async (inv: Invention) => {
    const customName = prompt("Enter the name to display on the Certificate (or leave blank for default):", user.name || "");
    if (customName !== null) {
      await generateCertificate(inv, user, customName);
      toast.success("Certificate generated");
    }
  };

  const handleAuthenticationRequest = (inv: Invention) => {
    console.log("Requesting auth for:", inv.id, "Has Hash:", !!inv.accessHash);
    if (inv.accessHash) {
      setAuthTargetId(inv.id);
      setAuthInputPassword("");
      setAuthModalOpen(true);
    } else {
      unlockItem(inv.id);
    }
  };

  const submitAuthentication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authTargetId) return;

    const targetInv = inventions.find(i => i.id === authTargetId);
    if (!targetInv || !targetInv.accessHash) {
      setAuthModalOpen(false);
      return;
    }

    const inputHash = await hashPassword(authInputPassword);
    
    // AUTHENTICATION LOGIC:
    // 1. Password Match: Does Hash(Input) === accessHash? (For Master Files)
    // 2. Hash Match: Does Input === accessHash? (For Shared Files)
    
    if (inputHash === targetInv.accessHash || authInputPassword.trim() === targetInv.accessHash) {
      unlockItem(authTargetId);
      setAuthModalOpen(false);
      setAuthTargetId(null);
      toast.success("Item unlocked");
    } else {
      toast.error("Incorrect Credentials");
      setAuthInputPassword("");
    }
  };

  const unlockItem = (id: string) => {
    const newSet = new Set(unlockedItems);
    newSet.add(id);
    setUnlockedItems(newSet);
  };

  const handleBlockchainAnchor = async (inv: Invention) => {
    if (inv.blockchainTxHash) return;
    const confirm = window.confirm("Anchor this hash to the Polygon Blockchain? (Gas fees apply - Simulated)");
    if (!confirm) return;
    const mockTx = "0x" + Array.from({length: 40}, () => Math.floor(Math.random() * 16).toString(16)).join('');
    await updateInvention(inv.id, {
      blockchainTxHash: mockTx,
      blockchainTimestamp: new Date().toISOString()
    });
    loadInventions();
    toast.success("Anchored Successfully!");
  };

  const handleAISuggest = async (inv: Invention) => {
    setSelectedInvention(inv);
    setShowAIModal(true);
    setAiSuggestions("");
    setAiLoading(true);
    try {
      const result = await suggestInventionImprovements(inv.title, inv.description);
      setAiSuggestions(result);
    } catch (err) {
      setAiSuggestions("Failed to generate suggestions.");
    } finally {
      setAiLoading(false);
    }
  };

  const openVersionModal = (inv: Invention) => {
    setSelectedInvention(inv);
    setShowVersionModal(true);
  };

  const handleShare = (id: string) => {
    const shareUrl = `${window.location.origin}/#/share/${id}`;
    navigator.clipboard.writeText(shareUrl);
    toast.success("Share link copied to clipboard!");
  };

  return (
    <div className="space-y-6 relative">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Database className="text-neon-400" /> Invention Vault
        </h2>
        <div className="flex bg-slate-800 rounded-lg p-1">
          <button 
            onClick={() => setView('list')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${view === 'list' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            My Inventions
          </button>
          <button 
            onClick={() => setView('upload')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${view === 'upload' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            New Upload
          </button>
        </div>
      </div>

      {view === 'upload' ? (
        <div className="max-w-4xl mx-auto bg-cardbg border border-slate-800 rounded-xl p-8 animate-fade-in glass-panel">
          
          <div className="flex justify-end mb-4">
             <button 
                onClick={runConnectionTest} 
                className="text-xs flex items-center gap-1 text-slate-400 hover:text-neon-400 transition-colors border border-slate-700 hover:border-neon-500 px-3 py-1.5 rounded"
             >
                <Activity size={12} /> Test Database Connection
             </button>
          </div>

          <form onSubmit={processBatch} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Lock size={18} className="text-neon-400"/> Security & Metadata
                </h3>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Title / Project Name</label>
                  <input required value={globalTitle} onChange={e => setGlobalTitle(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:border-neon-500 focus:outline-none" placeholder="e.g. Project Apollo Assets" />
                  <p className="text-xs text-slate-500 mt-1">If multiple files, this will prefix the title.</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Description</label>
                  <textarea required value={globalDescription} onChange={e => setGlobalDescription(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white h-24 focus:border-neon-500 focus:outline-none" placeholder="Brief abstract..." />
                </div>
                
                <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700">
                   <div className="flex justify-between items-center mb-1">
                      <label className="block text-sm font-bold text-neon-400 flex items-center gap-2"><Key size={14}/> Master Owner Password</label>
                      <button 
                        type="button" 
                        onClick={generateRandomPassword}
                        className="text-[10px] text-purple-400 hover:text-purple-300 flex items-center gap-1"
                      >
                         <Sparkles size={10} /> Generate Strong Key
                      </button>
                   </div>
                   <div className="relative">
                      <input 
                        type="text" // Changed to text so they can see the generated pass
                        value={accessPassword} 
                        onChange={e => setAccessPassword(e.target.value)} 
                        className="w-full bg-black border border-slate-600 rounded p-2 text-white text-sm focus:border-neon-500 focus:outline-none font-mono" 
                        placeholder="Create a strong password..." 
                      />
                      {accessPassword && (
                        <button 
                          type="button"
                          onClick={() => handleCopy(accessPassword, 'pass-input')}
                          className="absolute right-2 top-2 text-slate-400 hover:text-white"
                        >
                          {copiedId === 'pass-input' ? <CheckCircle size={16} className="text-green-500"/> : <Copy size={16}/>}
                        </button>
                      )}
                   </div>
                   <p className="text-[11px] text-slate-400 mt-2 leading-tight">
                     <b>Required for Dual-Copy System:</b><br/>
                     1. <span className="text-neon-400">Private Master:</span> Locked by this <b>Password</b>.<br/>
                     2. <span className="text-purple-400">Shared Copy:</span> Locked by the file's <b>Hash</b> (Fingerprint).
                   </p>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Cloud size={18} className="text-neon-400"/> File Selection
                </h3>
                
                <div 
                  onDragOver={onDragOver}
                  onDragLeave={onDragLeave}
                  onDrop={onDrop}
                  className={`border-2 border-dashed rounded-lg h-32 flex flex-col items-center justify-center cursor-pointer transition-all group relative ${isDragging ? 'border-neon-400 bg-neon-900/20' : 'border-slate-700 hover:border-neon-500/50 hover:bg-slate-800/50'}`}
                >
                   <input 
                      type="file" 
                      multiple 
                      onChange={(e) => handleFilesSelected(e.target.files)} 
                      className="absolute inset-0 opacity-0 cursor-pointer" 
                   />
                   <Upload size={24} className={`mb-2 transition-colors ${isDragging ? 'text-neon-400' : 'text-slate-400 group-hover:text-neon-400'}`} />
                   <p className="text-sm text-slate-400 font-medium group-hover:text-white">
                      {isDragging ? "Drop files here" : "Click or Drag & Drop"}
                   </p>
                   <p className="text-xs text-slate-500">Supports multi-select</p>
                </div>

                {/* File Queue List */}
                <div className="bg-slate-900/50 rounded-lg border border-slate-800 max-h-[300px] overflow-y-auto">
                   {uploadQueue.length === 0 ? (
                      <div className="p-8 text-center text-slate-500 text-sm italic">
                        No files selected yet.
                      </div>
                   ) : (
                      <div className="divide-y divide-slate-800">
                        {uploadQueue.map((item) => (
                          <div key={item.id} className="p-3 flex flex-col gap-2">
                             <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2 overflow-hidden">
                                   <div className={`p-1.5 rounded ${item.status === 'success' ? 'bg-green-500/20 text-green-400' : item.status === 'error' ? 'bg-red-500/20 text-red-400' : 'bg-slate-800 text-slate-400'}`}>
                                      {item.status === 'success' ? <CheckCircle size={14} /> : item.status === 'error' ? <AlertCircle size={14} /> : <FileCode size={14} />}
                                   </div>
                                   <span className="text-sm text-white truncate max-w-[150px]">{item.file.name}</span>
                                </div>
                                {item.status === 'idle' && !isProcessing && (
                                   <button type="button" onClick={() => removeQueueItem(item.id)} className="text-slate-500 hover:text-red-400">
                                      <Trash2 size={14} />
                                   </button>
                                )}
                             </div>
                             
                             {/* Progress */}
                             <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full transition-all duration-300 ${item.status === 'success' ? 'bg-green-500' : item.status === 'error' ? 'bg-red-500' : 'bg-neon-500'}`} 
                                  style={{ width: `${item.progress}%` }}
                                ></div>
                             </div>
                             
                             {/* Status Text & Metrics */}
                             <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                                <span>{item.status.toUpperCase()}</span>
                                {item.status === 'uploading' && (
                                   <span>{item.speed?.toFixed(1)} MB/s | ETA: {item.eta}s</span>
                                )}
                             </div>

                             {/* Key/Hash Display on Success */}
                             {item.status === 'success' && (
                               <div className="space-y-1 mt-1">
                                  <div className="bg-black p-2 rounded border border-slate-700 flex justify-between items-center">
                                     <span className="text-[10px] text-slate-500 uppercase font-bold">Shared Hash (Key)</span>
                                     <div className="flex items-center gap-2 max-w-[70%]">
                                        <code className="text-[10px] text-purple-400 font-mono truncate">{item.resultHash}</code>
                                        <button 
                                          type="button" 
                                          onClick={() => handleCopy(item.resultHash!, item.id)} 
                                          className="text-[10px] text-white bg-slate-700 px-2 py-0.5 rounded hover:bg-slate-600 min-w-[50px]"
                                        >
                                          {copiedId === item.id ? "Copied!" : "Copy"}
                                        </button>
                                     </div>
                                  </div>
                               </div>
                             )}
                             {item.errorMsg && <p className="text-[10px] text-red-400">{item.errorMsg}</p>}
                          </div>
                        ))}
                      </div>
                   )}
                </div>
              </div>
            </div>

            <div className="pt-4 flex gap-4 border-t border-slate-800">
              <button 
                type="submit" 
                disabled={isProcessing || uploadQueue.length === 0} 
                className="flex-1 bg-neon-500 hover:bg-neon-400 disabled:opacity-50 text-black font-bold py-3 rounded-lg flex justify-center items-center gap-2 transition-all"
              >
                {isProcessing ? (
                   <><RefreshCw className="animate-spin" size={18} /> Processing Queue...</>
                ) : (
                   <><Upload size={18} /> Upload {uploadQueue.length > 0 ? `(${uploadQueue.length})` : ''} Files</>
                )}
              </button>
              
              {uploadQueue.some(i => i.status === 'success') && !isProcessing && (
                 <button 
                   type="button" 
                   onClick={resetUploadForm} 
                   className="px-6 border border-slate-600 hover:bg-slate-800 text-white rounded-lg font-medium"
                 >
                   Clear & Done
                 </button>
              )}
            </div>
          </form>
        </div>
      ) : (
        /* LIST VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-fade-in">
          {inventions.map(inv => {
             const isMaster = inv.title.includes('Private Master');
             const isShared = inv.title.includes('Shared Copy');
             const isDeleting = deletingIds.has(inv.id);
             
             return (
              <div key={inv.id} className={`bg-cardbg border ${isMaster ? 'border-neon-500/50' : isShared ? 'border-purple-500/50' : 'border-slate-800'} rounded-xl p-5 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden glass-panel ${isDeleting ? 'opacity-50 scale-95' : ''}`}>
                
                {/* Header Badge */}
                <div className="absolute top-0 right-0 p-2">
                   {isMaster && <span className="bg-neon-900/80 text-neon-400 text-[10px] font-bold px-2 py-1 rounded-bl-lg uppercase tracking-wider">Private Master</span>}
                   {isShared && <span className="bg-purple-900/80 text-purple-400 text-[10px] font-bold px-2 py-1 rounded-bl-lg uppercase tracking-wider">Shared Copy</span>}
                </div>

                {/* Header Controls */}
                <div className="flex justify-between items-start mb-3 relative z-20 mt-4">
                  <div className={`p-2 rounded text-slate-300 transition-colors ${isMaster ? 'bg-neon-900/20 text-neon-400' : isShared ? 'bg-purple-900/20 text-purple-400' : 'bg-slate-800'}`}>
                    {isMaster ? <Shield size={20} /> : isShared ? <Share2 size={20} /> : <Lock size={20} />}
                  </div>
                  <div className="flex gap-2 relative z-50 mr-20"> {/* Margin right to avoid badge overlap */}
                    <button 
                      onClick={() => handleShare(inv.id)}
                      className="text-slate-600 bg-slate-900/50 p-1.5 rounded hover:bg-purple-900/50 hover:text-purple-400 transition-colors border border-transparent hover:border-purple-500/30 cursor-pointer"
                      title="Share Link"
                    >
                      <Share2 size={16} />
                    </button>
                    <button 
                      onClick={(e) => handleDelete(e, inv.id, inv.title)}
                      disabled={isDeleting}
                      className="text-slate-600 bg-slate-900/50 p-1.5 rounded hover:bg-red-900/50 hover:text-red-400 transition-colors border border-transparent hover:border-red-500/30 cursor-pointer"
                      title="Delete Permanently"
                    >
                      {isDeleting ? <RefreshCw className="animate-spin" size={16} /> : <Trash2 size={16} />}
                    </button>
                  </div>
                </div>
                
                <h3 className="font-bold text-white text-lg truncate mb-1 relative z-10">{inv.title}</h3>
                <p className="text-slate-400 text-sm line-clamp-2 mb-4 h-10 relative z-10">{inv.description}</p>
                
                {/* Biometric/Password Shield Overlay */}
                {!unlockedItems.has(inv.id) && (
                  <div className="absolute inset-0 bg-slate-900/95 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center p-6 text-center transition-opacity duration-300 top-14">
                    <Fingerprint size={48} className="mb-4 text-blue-500" />
                    <p className="text-white font-bold mb-2">
                       {isMaster ? "Master Authentication" : isShared ? "Shared Authentication" : "Secure Vault"}
                    </p>
                    <p className="text-xs text-slate-500 mb-4">
                       {isMaster ? "Enter your Private Password" : isShared ? "Enter the File Hash (Fingerprint)" : "Authenticate to view"}
                    </p>
                    <button 
                      onClick={(e) => {
                         e.stopPropagation();
                         handleAuthenticationRequest(inv);
                      }}
                      className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-6 rounded-lg text-sm flex items-center gap-2 shadow-lg shadow-blue-900/20"
                    >
                      <Lock size={14}/>
                      {inv.accessHash ? 'Unlock Access' : 'Authenticate'}
                    </button>
                  </div>
                )}

                <div className="text-xs text-slate-500 font-mono space-y-2 mb-4 border-t border-slate-800 pt-3 relative z-0">
                  <div className="flex justify-between">
                    <span>Size:</span>
                    <span>{(inv.fileSize / 1024).toFixed(1)} KB</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Integrity:</span>
                    <div className="flex items-center gap-1">
                       <span className="truncate w-20" title={inv.hash}>{inv.hash.substring(0,8)}...</span>
                    </div>
                  </div>
                </div>

                {/* Action Grid */}
                <div className="grid grid-cols-2 gap-2 relative z-0">
                  <button 
                    onClick={() => downloadHash(inv.fileName, inv.hash)}
                    className="flex items-center justify-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2 rounded text-xs font-medium transition-colors"
                  >
                    <FileCode size={14} /> Fingerprint
                  </button>
                  <button 
                    onClick={() => handleFileDownload(inv.fileUrl, inv.fileName)}
                    className={`flex items-center justify-center gap-1 py-2 rounded text-xs font-medium transition-colors ${isMaster ? 'bg-neon-900/50 hover:bg-neon-900 text-neon-400' : 'bg-purple-900/50 hover:bg-purple-900 text-purple-400'}`}
                  >
                     <Download size={14} /> Download
                  </button>
                </div>
                
                <div className="grid grid-cols-4 gap-1 mt-2 relative z-0">
                  <button onClick={() => handleCertificate(inv)} className="flex items-center justify-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2 rounded text-[10px] font-medium transition-colors" title="Generate Certificate">
                    <Award size={14} />
                  </button>
                   <button onClick={() => openVersionModal(inv)} className="flex items-center justify-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2 rounded text-[10px] font-medium transition-colors" title="Version History">
                    <History size={14} />
                  </button>
                  <button onClick={() => handleAISuggest(inv)} className="flex items-center justify-center gap-1 bg-slate-800 hover:bg-purple-900/50 text-purple-300 py-2 rounded text-[10px] font-medium transition-colors" title="AI Suggestions">
                    <Lightbulb size={14} />
                  </button>
                  <button onClick={() => handleBlockchainAnchor(inv)} disabled={!!inv.blockchainTxHash} className={`flex items-center justify-center gap-1 py-2 rounded text-[10px] font-medium transition-colors ${inv.blockchainTxHash ? 'text-green-500 bg-green-900/20' : 'bg-purple-900/30 hover:bg-purple-900/50 text-purple-400'}`} title={inv.blockchainTxHash ? "Already Anchored" : "Anchor to Blockchain"}>
                     <ShieldCheck size={14} />
                  </button>
                </div>
              </div>
             );
          })}
          
          {inventions.length === 0 && (
            <div className="col-span-full py-20 text-center text-slate-500 flex flex-col items-center justify-center border border-dashed border-slate-800 rounded-xl">
              <Cloud size={48} className="mb-4 opacity-20" />
              <p className="text-lg font-medium">No inventions stored yet.</p>
              <button onClick={() => setView('upload')} className="mt-4 text-neon-400 hover:underline">Upload Now</button>
            </div>
          )}
        </div>
      )}

      {/* AUTHENTICATION MODAL */}
      {authModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
          <div className="bg-cardbg border border-blue-500 rounded-xl w-full max-w-sm p-6 shadow-2xl relative">
             <button onClick={() => setAuthModalOpen(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white"><X size={20}/></button>
             <div className="text-center mb-6">
               <div className="mx-auto w-12 h-12 bg-blue-900/50 rounded-full flex items-center justify-center text-blue-400 mb-3">
                 <Lock size={24} />
               </div>
               <h3 className="text-xl font-bold text-white">Unlock File</h3>
               <p className="text-sm text-slate-400 mt-1">Enter the required Credential.</p>
             </div>
             
             <form onSubmit={submitAuthentication} className="space-y-4">
               <input 
                 type="password" 
                 autoFocus
                 value={authInputPassword}
                 onChange={e => setAuthInputPassword(e.target.value)}
                 className="w-full bg-black border border-slate-700 rounded-lg p-3 text-white focus:border-blue-500 focus:outline-none text-center tracking-widest"
                 placeholder="Password OR Hash"
               />
               <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg shadow-lg shadow-blue-900/20">
                 Unlock
               </button>
             </form>
          </div>
        </div>
      )}

      {/* VERSION HISTORY MODAL */}
      {showVersionModal && selectedInvention && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-cardbg border border-slate-700 rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-white">Version History</h3>
                <p className="text-sm text-slate-400">Manage versions for <span className="text-neon-400">{selectedInvention.title}</span></p>
              </div>
              <button onClick={() => setShowVersionModal(false)} className="text-slate-500 hover:text-white">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-8">
              {/* Upload New Version */}
              <div className="bg-slate-900/50 p-5 rounded-lg border border-slate-700/50">
                <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                  <FilePlus size={16} /> Upload New Version (Overwrite)
                </h4>
                <div className="flex gap-4 items-center">
                  <input 
                    type="file" 
                    onChange={e => setVersionFile(e.target.files ? e.target.files[0] : null)}
                    className="flex-1 text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-white hover:file:bg-slate-700"
                  />
                  <button 
                    onClick={handleVersionUpload}
                    disabled={!versionFile || versionLoading}
                    className="bg-neon-500 text-black px-4 py-2 rounded text-sm font-bold hover:bg-neon-400 disabled:opacity-50"
                  >
                    {versionLoading ? 'Processing...' : 'Upload & Promote'}
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-2">Uploading a new version will archive the current file to history.</p>
              </div>

              {/* Timeline */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Timeline</h4>
                
                {/* Current Version */}
                <div className="relative pl-8 border-l-2 border-neon-500">
                  <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-neon-500 border-4 border-cardbg"></div>
                  <div className="bg-slate-800/50 p-4 rounded-lg border border-neon-500/20">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-xs font-bold text-neon-400 bg-neon-900/30 px-2 py-0.5 rounded">CURRENT</span>
                        <h5 className="font-bold text-white mt-1">{selectedInvention.fileName}</h5>
                        <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                          <Clock size={12} /> {selectedInvention.updatedAt ? new Date(selectedInvention.updatedAt.seconds * 1000).toLocaleString() : (selectedInvention.createdAt ? new Date(selectedInvention.createdAt.seconds * 1000).toLocaleString() : 'Just now')}
                        </p>
                      </div>
                      <button 
                        onClick={() => handleFileDownload(selectedInvention.fileUrl, selectedInvention.fileName)}
                        className="text-xs bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 rounded flex items-center gap-1"
                      >
                        <Download size={12} /> Download
                      </button>
                    </div>
                  </div>
                </div>

                {/* Past Versions */}
                {selectedInvention.versions && selectedInvention.versions.length > 0 ? (
                  [...selectedInvention.versions].reverse().map((ver, idx) => (
                    <div key={idx} className="relative pl-8 border-l-2 border-slate-700">
                      <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-slate-700 border-4 border-cardbg"></div>
                      <div className="bg-slate-900/30 p-4 rounded-lg border border-slate-800">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-xs font-bold text-slate-500 bg-slate-800 px-2 py-0.5 rounded">HISTORIC</span>
                            <h5 className="font-medium text-slate-300 mt-1">{ver.fileName}</h5>
                             <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                              <Clock size={12} /> {new Date(ver.createdAt).toLocaleString()}
                            </p>
                          </div>
                          <div className="flex flex-col gap-2">
                            <button 
                              onClick={() => handleFileDownload(ver.fileUrl, ver.fileName)}
                              className="text-xs border border-slate-700 hover:bg-slate-800 text-slate-400 px-3 py-1.5 rounded flex items-center justify-center gap-1"
                            >
                              <Download size={12} /> Download
                            </button>
                            <button 
                              onClick={() => handleRevert(ver)}
                              className="text-xs border border-slate-700 hover:bg-red-900/20 hover:text-red-400 text-slate-500 px-3 py-1.5 rounded flex items-center justify-center gap-1"
                            >
                              <RotateCcw size={12} /> Restore
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500 pl-8 italic">No previous versions available.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

       {/* AI SUGGESTION MODAL */}
       {showAIModal && selectedInvention && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-cardbg border border-slate-700 rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-purple-900/20">
              <div className="flex items-center gap-3">
                <div className="bg-purple-500 p-2 rounded-lg text-white">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">AI Innovation Catalyst</h3>
                  <p className="text-sm text-slate-400">Brainstorming features for <span className="text-purple-400">{selectedInvention.title}</span></p>
                </div>
              </div>
              <button onClick={() => setShowAIModal(false)} className="text-slate-500 hover:text-white">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-8 overflow-y-auto flex-1">
              {aiLoading ? (
                 <div className="flex flex-col items-center justify-center h-64 space-y-4">
                    <Sparkles className="text-purple-500 animate-spin" size={48} />
                    <p className="text-slate-300 animate-pulse">Consulting Gemini R&D Engine...</p>
                 </div>
              ) : (
                 <div className="prose prose-invert prose-p:text-slate-300 prose-headings:text-purple-300 max-w-none">
                   <ReactMarkdown>{aiSuggestions}</ReactMarkdown>
                 </div>
              )}
            </div>
             <div className="p-4 border-t border-slate-800 bg-slate-900/50 flex justify-end">
               <button onClick={() => handleAISuggest(selectedInvention!)} className="text-sm text-purple-400 hover:text-white flex items-center gap-2">
                 <RefreshCw size={14} /> Regenerate Ideas
               </button>
             </div>
          </div>
        </div>
      )}

    </div>
  );
};