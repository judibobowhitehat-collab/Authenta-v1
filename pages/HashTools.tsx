import React, { useState } from 'react';
import { Fingerprint, CheckCircle, XCircle, ArrowRight, Hash } from 'lucide-react';

export const HashTools: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [generatedHash, setGeneratedHash] = useState('');
  
  const [verifyText, setVerifyText] = useState('');
  const [verifyHash, setVerifyHash] = useState('');
  const [verificationResult, setVerificationResult] = useState<'match' | 'mismatch' | null>(null);

  const generateHash = async () => {
    if (!inputText) return;
    const msgBuffer = new TextEncoder().encode(inputText);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    setGeneratedHash(hashHex);
  };

  const verifyIntegrity = async () => {
    if (!verifyText || !verifyHash) return;
    const msgBuffer = new TextEncoder().encode(verifyText);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    setVerificationResult(hashHex === verifyHash.trim() ? 'match' : 'mismatch');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Generator */}
      <div className="bg-cardbg border border-slate-800 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-neon-900/30 rounded-lg text-neon-400">
            <Fingerprint size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">SHA-256 Generator</h2>
            <p className="text-slate-400 text-sm">Create a unique digital fingerprint for any text.</p>
          </div>
        </div>
        
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Enter text to hash..."
          className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-neon-500 focus:outline-none h-32 mb-4"
        />
        
        <button 
          onClick={generateHash}
          className="w-full bg-neon-500 hover:bg-neon-400 text-black font-bold py-2 rounded-lg mb-6"
        >
          Generate Hash
        </button>

        {generatedHash && (
          <div className="bg-black/50 p-4 rounded-lg border border-slate-700">
            <p className="text-xs text-slate-500 uppercase font-bold mb-1">Output Hash</p>
            <code className="text-neon-400 font-mono text-xs break-all">{generatedHash}</code>
          </div>
        )}
      </div>

      {/* Verifier */}
      <div className="bg-cardbg border border-slate-800 rounded-xl p-6">
         <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-purple-900/30 rounded-lg text-purple-400">
            <CheckCircle size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Integrity Checker</h2>
            <p className="text-slate-400 text-sm">Verify if content has been altered.</p>
          </div>
        </div>

        <div className="space-y-4">
          <textarea
            value={verifyText}
            onChange={(e) => setVerifyText(e.target.value)}
            placeholder="1. Paste Original Text"
            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-purple-500 focus:outline-none h-24"
          />
           <input
            value={verifyHash}
            onChange={(e) => setVerifyHash(e.target.value)}
            placeholder="2. Paste Expected Hash"
            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-purple-500 focus:outline-none font-mono text-sm"
          />
        </div>

        <button 
          onClick={verifyIntegrity}
          className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 rounded-lg mt-6 mb-6"
        >
          Verify Integrity
        </button>

        {verificationResult && (
          <div className={`p-4 rounded-lg border flex items-center gap-3 ${
            verificationResult === 'match' 
              ? 'bg-green-500/10 border-green-500 text-green-400' 
              : 'bg-red-500/10 border-red-500 text-red-400'
          }`}>
            {verificationResult === 'match' ? <CheckCircle /> : <XCircle />}
            <div>
              <p className="font-bold">
                {verificationResult === 'match' ? 'Integrity Verified' : 'Integrity Failed'}
              </p>
              <p className="text-xs opacity-80">
                {verificationResult === 'match' 
                  ? 'The text matches the hash perfectly.' 
                  : 'The text has been altered or the hash is incorrect.'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};