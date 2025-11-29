import React, { useState } from 'react';
import { Users, UserPlus, Mail, Shield, MessageSquare, Phone, MoreHorizontal, Circle } from 'lucide-react';
import { Collaborator } from '../types';

export const Collaborators: React.FC = () => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('viewer');
  
  // Mock data to simulate the Contact List feature
  const [team, setTeam] = useState<Collaborator[]>([
    { email: 'sarah.connor@tech.co', role: 'admin', addedAt: new Date().toISOString(), status: 'online' },
    { email: 'john.doe@innovate.io', role: 'editor', addedAt: new Date().toISOString(), status: 'busy' },
    { email: 'mike.ross@legal.firm', role: 'viewer', addedAt: new Date().toISOString(), status: 'offline', lastActive: '2h ago' },
  ]);

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    const newMember: Collaborator = {
        email,
        role: role as any,
        addedAt: new Date().toISOString(),
        status: 'offline',
        lastActive: 'Just now'
    }
    setTeam([...team, newMember]);
    setEmail('');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2 mb-2">
          <Users className="text-neon-400" /> Contacts & Team
        </h2>
        <p className="text-slate-400">Manage your trusted collaborators and internal contacts.</p>
      </div>

      {/* Add Contact / Invite Section */}
      <div className="bg-cardbg border border-slate-800 rounded-xl p-6 glass-panel">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <UserPlus size={20} /> Add Contact
        </h3>
        <form onSubmit={handleInvite} className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <label className="block text-xs font-bold text-slate-500 mb-1">EMAIL ADDRESS</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-slate-500" size={16} />
              <input 
                required
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-white focus:border-neon-500 focus:outline-none"
                placeholder="colleague@example.com"
              />
            </div>
          </div>
          <div className="w-full md:w-40">
            <label className="block text-xs font-bold text-slate-500 mb-1">DEFAULT ROLE</label>
            <select 
              value={role}
              onChange={e => setRole(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:border-neon-500 focus:outline-none"
            >
              <option value="viewer">Viewer</option>
              <option value="editor">Editor</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <button type="submit" className="w-full md:w-auto bg-neon-500 text-black font-bold px-6 py-2.5 rounded-lg hover:bg-neon-400 transition-colors">
            Add
          </button>
        </form>
      </div>

      {/* Contact List */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden glass-panel">
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-800/50 flex justify-between items-center">
          <h3 className="font-bold text-white">My Contacts</h3>
          <span className="text-xs bg-slate-700 px-2 py-1 rounded text-slate-300">{team.length} People</span>
        </div>
        
        {team.length > 0 ? (
          <div className="divide-y divide-slate-800">
            {team.map((member, idx) => (
              <div key={idx} className="p-4 flex flex-col md:flex-row justify-between items-center hover:bg-slate-800/30 gap-4 group transition-colors">
                <div className="flex items-center gap-4 w-full md:w-auto">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-neon-400 font-bold border border-slate-700">
                      {member.email.charAt(0).toUpperCase()}
                    </div>
                    {/* Status Indicator */}
                    <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-900 ${
                        member.status === 'online' ? 'bg-green-500' :
                        member.status === 'busy' ? 'bg-red-500' : 'bg-slate-500'
                    }`}></div>
                  </div>
                  <div>
                    <p className="text-white font-medium flex items-center gap-2">
                        {member.email}
                        <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-bold border ${member.role === 'admin' ? 'border-red-500/30 text-red-400' : 'border-blue-500/30 text-blue-400'}`}>
                            {member.role}
                        </span>
                    </p>
                    <p className="text-xs text-slate-500">
                        {member.status === 'online' ? 'Online now' : `Last active ${member.lastActive}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-full" title="Message">
                    <MessageSquare size={18} />
                  </button>
                   <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-full" title="Call">
                    <Phone size={18} />
                  </button>
                  <button className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded-full" title="More Options">
                    <MoreHorizontal size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center text-slate-500">
            <Shield size={48} className="mx-auto mb-4 opacity-20" />
            <p>No contacts yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};