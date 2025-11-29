import React, { useState, useEffect } from 'react';
import { FileText, Sparkles, Wand2, Copy, CheckCircle, Zap, Briefcase, Code, Rocket } from 'lucide-react';
import { rewriteText } from '../services/geminiService';
import { RewriteMode } from '../types';

export const Rewrite: React.FC = () => {
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<RewriteMode>('creative');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [flash, setFlash] = useState(false);

  const handleRewrite = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setCopied(false);
    try {
      const result = await rewriteText(input, mode);
      
      if (mode === 'auto-correct') {
        // INSTANT REPLACEMENT LOGIC
        setInput(result);
        setOutput(result);
        setFlash(true);
        setTimeout(() => setFlash(false), 500);
      } else {
        setOutput(result);
      }
    } catch (error) {
      alert("Failed to rewrite. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
      {/* Input Section */}
      <div className={`flex flex-col bg-cardbg border ${flash ? 'border-neon-400 shadow-[0_0_20px_rgba(0,243,255,0.3)]' : 'border-slate-800'} rounded-xl overflow-hidden h-[350px] transition-all duration-300 glass-panel`}>
        <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
          <div className="flex items-center gap-2 text-white font-medium">
            <FileText size={18} className="text-purple-400" />
            Original Text
          </div>
          <select 
            value={mode}
            onChange={(e) => setMode(e.target.value as RewriteMode)}
            className="bg-slate-800 border border-slate-700 text-sm text-white rounded px-3 py-1.5 focus:outline-none focus:border-purple-500"
          >
            <option value="creative">Creative Rewrite</option>
            <option value="professional">Professional Tone</option>
            <option value="academic">Academic / Formal</option>
            <option value="grammar">Grammar Fixer</option>
            <option value="auto-correct">Instant Auto-Correct</option>
            <option disabled>──────────</option>
            <option value="business-pitch">Business Pitch</option>
            <option value="technical-plan">Technical Plan</option>
            <option value="market-ready">Market Ready</option>
          </select>
        </div>
        <textarea
          className="flex-1 w-full bg-transparent p-6 text-slate-300 resize-none focus:outline-none font-mono text-sm leading-relaxed transition-colors"
          placeholder="Paste your text or idea here..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <div className="p-4 border-t border-slate-800 bg-slate-900/50">
          <button
            onClick={handleRewrite}
            disabled={loading || !input}
            className={`w-full font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
              mode === 'auto-correct' 
                ? 'bg-emerald-500 hover:bg-emerald-400 text-black'
                : 'bg-purple-600 hover:bg-purple-500 text-white'
            }`}
          >
            {loading ? (
              <span className="animate-pulse">Processing...</span>
            ) : (
              <>
                {mode === 'auto-correct' ? <Zap size={20} /> : 
                 mode === 'business-pitch' ? <Briefcase size={20} /> :
                 mode === 'technical-plan' ? <Code size={20} /> :
                 mode === 'market-ready' ? <Rocket size={20} /> :
                 <Wand2 size={20} />
                }
                {mode === 'auto-correct' ? 'Auto-Fix Instantly' : 
                 mode === 'business-pitch' ? 'Generate Pitch' :
                 mode === 'technical-plan' ? 'Generate Tech Plan' :
                 'Rewrite with Authenta'}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Output Section */}
      <div className="flex flex-col bg-cardbg border border-slate-800 rounded-xl overflow-hidden relative h-[350px] glass-panel">
        <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
          <div className="flex items-center gap-2 text-white font-medium">
            <Sparkles size={18} className="text-neon-400" />
            {mode === 'auto-correct' ? 'Corrected Record' : 
             mode === 'business-pitch' ? 'Investor Pitch' :
             mode === 'technical-plan' ? 'Architecture Plan' :
             'Rewritten Result'}
          </div>
          {output && (
            <button 
              onClick={copyToClipboard}
              className="text-xs flex items-center gap-1 text-slate-400 hover:text-white transition-colors"
            >
              {copied ? <CheckCircle size={14} className="text-green-500" /> : <Copy size={14} />}
              {copied ? "Copied" : "Copy"}
            </button>
          )}
        </div>
        <div className={`flex-1 p-6 overflow-y-auto font-mono text-sm leading-relaxed whitespace-pre-wrap ${output ? 'text-neon-50' : 'text-slate-600 italic'}`}>
          {output || "Output will appear here..."}
        </div>
      </div>
    </div>
  );
};