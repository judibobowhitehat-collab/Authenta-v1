import React, { useState } from 'react';
import { Shield, Search, AlertCircle } from 'lucide-react';
import { classifyCopyright } from '../services/geminiService';
import ReactMarkdown from 'react-markdown'; // Assuming standard render, but text is fine too

export const Classify: React.FC = () => {
  const [text, setText] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const handleClassify = async () => {
    if (!text.trim()) return;
    setLoading(true);
    try {
      const analysis = await classifyCopyright(text);
      setResult(analysis);
    } catch (err) {
      alert("Classification failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-cardbg border border-slate-800 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-emerald-900/30 rounded-lg text-emerald-400">
            <Shield size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Copyright Classifier</h2>
            <p className="text-slate-400 text-sm">Analyze text to determine potential licensing and copyright status.</p>
          </div>
        </div>

        <textarea
          className="w-full h-48 bg-slate-900/50 border border-slate-700 rounded-lg p-4 text-white focus:outline-none focus:border-emerald-500 transition-colors font-mono text-sm mb-4"
          placeholder="Paste the content (code, article, license text) here..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />

        <button
          onClick={handleClassify}
          disabled={loading || !text}
          className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          {loading ? 'Analyzing...' : <><Search size={18} /> Analyze Content</>}
        </button>
      </div>

      {result && (
        <div className="bg-slate-900/80 border border-emerald-500/30 rounded-xl p-6 animate-fade-in">
          <h3 className="text-lg font-semibold text-emerald-400 mb-4 flex items-center gap-2">
            <AlertCircle size={20} /> Analysis Result
          </h3>
          <div className="prose prose-invert prose-sm max-w-none text-slate-300 whitespace-pre-line font-mono">
            {result}
          </div>
        </div>
      )}
    </div>
  );
};