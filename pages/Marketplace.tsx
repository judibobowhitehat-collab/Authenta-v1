import React, { useEffect, useState } from 'react';
import { ShoppingBag, Lock, Tag, Eye, ArrowUp, ArrowDown, Filter } from 'lucide-react';
import { getPublicInventions } from '../services/firebaseService';
import { Invention } from '../types';

type SortOption = 'date-desc' | 'date-asc' | 'price-asc' | 'price-desc' | 'alpha-asc' | 'alpha-desc';

export const Marketplace: React.FC = () => {
  const [items, setItems] = useState<Invention[]>([]);
  const [filteredItems, setFilteredItems] = useState<Invention[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortOption, setSortOption] = useState<SortOption>('date-desc');
  const [filterLicense, setFilterLicense] = useState('all');

  useEffect(() => {
    getPublicInventions().then(data => {
      setItems(data);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    let result = [...items];

    // Filter
    if (filterLicense !== 'all') {
      result = result.filter(item => item.license === filterLicense);
    }

    // Sort
    result.sort((a, b) => {
      switch (sortOption) {
        case 'date-desc':
          return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
        case 'date-asc':
          return (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0);
        case 'price-asc':
          return (a.price || 0) - (b.price || 0);
        case 'price-desc':
          return (b.price || 0) - (a.price || 0);
        case 'alpha-asc':
          return a.title.localeCompare(b.title);
        case 'alpha-desc':
          return b.title.localeCompare(a.title);
        default:
          return 0;
      }
    });

    setFilteredItems(result);
  }, [items, sortOption, filterLicense]);

  return (
    <div className="space-y-6 flex flex-col md:flex-row gap-6 h-full">
      {/* Sidebar Filters */}
      <div className="w-full md:w-64 flex-shrink-0 space-y-6">
        <div className="bg-cardbg border border-slate-800 rounded-xl p-6 glass-panel">
           <h3 className="font-bold text-white mb-4 flex items-center gap-2">
             <Filter size={18} /> Filters
           </h3>
           
           <div className="space-y-4">
             <div>
               <label className="text-xs font-bold text-slate-500 mb-2 block">SORT ORDER</label>
               <select 
                  value={sortOption} 
                  onChange={(e) => setSortOption(e.target.value as SortOption)}
                  className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white focus:outline-none focus:border-purple-500"
               >
                 <option value="date-desc">Newest First</option>
                 <option value="date-asc">Oldest First</option>
                 <option value="price-asc">Price: Low to High</option>
                 <option value="price-desc">Price: High to Low</option>
                 <option value="alpha-asc">Name: A to Z</option>
                 <option value="alpha-desc">Name: Z to A</option>
               </select>
             </div>

             <div>
               <label className="text-xs font-bold text-slate-500 mb-2 block">LICENSE TYPE</label>
               <select 
                  value={filterLicense} 
                  onChange={(e) => setFilterLicense(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white focus:outline-none focus:border-purple-500"
               >
                 <option value="all">All Licenses</option>
                 <option value="All Rights Reserved">All Rights Reserved</option>
                 <option value="CC-BY">Creative Commons (CC-BY)</option>
                 <option value="CC0">Public Domain (CC0)</option>
                 <option value="MIT">Open Source (MIT)</option>
               </select>
             </div>
           </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="flex-1 space-y-6">
        <div className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 p-8 rounded-xl border border-slate-700 glass-panel">
          <h1 className="text-3xl font-bold text-white mb-2">IP Marketplace</h1>
          <p className="text-slate-300">Discover, license, and acquire verified intellectual property from global creators.</p>
        </div>

        {loading ? (
          <div className="text-center py-20 text-slate-500">Loading Marketplace...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredItems.map(item => (
              <div key={item.id} className="bg-cardbg border border-slate-800 rounded-xl overflow-hidden hover:border-purple-500/50 transition-all glass-panel group">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-2 bg-purple-900/30 text-purple-400 rounded-lg group-hover:scale-110 transition-transform">
                      <Lock size={20} />
                    </div>
                    <span className="text-xs font-bold bg-green-900/30 text-green-400 px-2 py-1 rounded">
                      FOR LICENSE
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2 truncate">{item.title}</h3>
                  <p className="text-slate-400 text-sm mb-4 line-clamp-3">{item.description}</p>
                  
                  <div className="flex items-center gap-2 mb-6 text-xs text-slate-500">
                    <Tag size={14} />
                    <span>{item.license}</span>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                     <div className="text-white font-bold">
                       ${item.price || "Negotiable"}
                     </div>
                     <button className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-lg font-bold hover:bg-slate-200 transition-colors text-sm">
                       <Eye size={16} /> View Details
                     </button>
                  </div>
                </div>
              </div>
            ))}
            
            {filteredItems.length === 0 && (
              <div className="col-span-full py-20 text-center">
                <ShoppingBag size={48} className="mx-auto text-slate-700 mb-4" />
                <p className="text-slate-500">No items found matching your filters.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};