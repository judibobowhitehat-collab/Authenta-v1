import React, { useState, useRef } from 'react';
import { Lock, Upload, File as FileIcon, Download, RefreshCw, Key } from 'lucide-react';
import { encryptFile } from '../services/cryptoService';
import { EncryptedFileResult } from '../types';

export const Encrypt: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<EncryptedFileResult | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
    }
  };

  const handleEncryption = async () => {
    if (!file) return;
    setLoading(true);
    try {
      // Small artificial delay to show the nice animation for small files
      await new Promise(resolve => setTimeout(resolve, 800)); 
      const res = await encryptFile(file);
      setResult(res);
    } catch (err) {
      console.error(err);
      alert("Encryption failed. Ensure your browser supports WebCrypto.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    const url = URL.createObjectURL(result.encryptedBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${result.fileName}.enc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const reset = () => {
    setFile(null);
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-cardbg border border-slate-800 rounded-xl p-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-neon-900 rounded-xl text-neon-400 border border-neon-500/20">
            <Lock size={32} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Military-Grade Encryption</h2>
            <p className="text-slate-400">AES-256-GCM (Client-Side). Your files never leave your device unencrypted.</p>
          </div>
        </div>

        {!result ? (
          <div className="space-y-6">
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-700 hover:border-neon-500/50 hover:bg-slate-800/50 rounded-xl h-64 flex flex-col items-center justify-center cursor-pointer transition-all group"
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                onChange={handleFileChange}
              />
              <div className="p-4 bg-slate-800 rounded-full mb-4 group-hover:scale-110 transition-transform">
                <Upload size={32} className="text-slate-400 group-hover:text-neon-400" />
              </div>
              <p className="text-slate-300 font-medium">{file ? file.name : "Click to select a file"}</p>
              <p className="text-slate-500 text-sm mt-2">{file ? `${(file.size / 1024).toFixed(2)} KB` : "Any format supported"}</p>
            </div>

            <button
              onClick={handleEncryption}
              disabled={!file || loading}
              className="w-full bg-neon-500 hover:bg-neon-400 text-black font-bold py-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                   <RefreshCw className="animate-spin" /> Encrypting...
                </>
              ) : (
                <>
                  <Lock size={20} /> Encrypt File
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="animate-fade-in space-y-6">
             <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center gap-3 text-green-400">
                <div className="bg-green-500/20 p-2 rounded-full"><Lock size={20} /></div>
                <div>
                  <p className="font-bold">Encryption Successful</p>
                  <p className="text-xs text-green-300/70">Algorithm: AES-GCM-256</p>
                </div>
             </div>

             <div className="bg-slate-900 p-4 rounded-lg border border-slate-800 space-y-4">
                <div>
                  <label className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1 block">File Name</label>
                  <p className="text-white font-mono">{result.fileName}</p>
                </div>
                <div>
                  <label className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1 block">SHA-256 Hash (Fingerprint)</label>
                  <code className="block bg-black p-3 rounded text-neon-400 text-xs break-all font-mono border border-slate-800">
                    {result.hash}
                  </code>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div>
                    <label className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1 block flex items-center gap-1"><Key size={12}/> Encryption Key</label>
                    <input readOnly value={result.key} className="w-full bg-black border border-slate-800 rounded p-2 text-xs text-orange-400 font-mono" onClick={(e) => e.currentTarget.select()} />
                   </div>
                   <div>
                    <label className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1 block">IV (Initialization Vector)</label>
                    <input readOnly value={result.iv} className="w-full bg-black border border-slate-800 rounded p-2 text-xs text-blue-400 font-mono" onClick={(e) => e.currentTarget.select()} />
                   </div>
                </div>
                <p className="text-xs text-red-400 mt-2 bg-red-900/20 p-2 rounded">
                  ⚠️ IMPORTANT: Save the Key and IV securely. Without them, this file cannot be decrypted. The app does not store them.
                </p>
             </div>

             <div className="flex gap-4">
                <button onClick={handleDownload} className="flex-1 bg-neon-500 hover:bg-neon-400 text-black font-bold py-3 rounded-lg flex items-center justify-center gap-2">
                  <Download size={20} /> Download Encrypted
                </button>
                <button onClick={reset} className="px-6 border border-slate-600 hover:bg-slate-800 text-white rounded-lg font-medium">
                  Encrypt Another
                </button>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};