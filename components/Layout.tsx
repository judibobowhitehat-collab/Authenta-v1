import React from 'react';
import { Shield, Lock, FileText, LayoutDashboard, LogOut, Menu, X, Database, Fingerprint, ShoppingBag, Users, Key } from 'lucide-react';
import { User } from '../types';
import Aurora from './Aurora';
import { Toaster } from 'sonner';

interface LayoutProps {
  children: React.ReactNode;
  activePage: string;
  onNavigate: (page: string) => void;
  user: User | null;
  onLogout: () => void;
}

const NavItem = ({ 
  icon: Icon, 
  label, 
  active, 
  onClick 
}: { 
  icon: any, 
  label: string, 
  active: boolean, 
  onClick: () => void 
}) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
      active 
        ? 'bg-neon-900 text-neon-400 border border-neon-500/30 shadow-[0_0_15px_rgba(0,243,255,0.1)]' 
        : 'text-slate-400 hover:text-white hover:bg-slate-800'
    }`}
  >
    <Icon size={20} />
    <span className="font-medium">{label}</span>
  </button>
);

export const Layout: React.FC<LayoutProps> = ({ children, activePage, onNavigate, user, onLogout }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  return (
    <div className="relative flex h-screen bg-slate-900 overflow-hidden text-slate-200">
      <Toaster position="top-right" theme="dark" />
      {/* Background Aurora */}
      <div className="absolute inset-0 z-0">
         <Aurora
          colorStops={["#3A29FF", "#FF94B4", "#FF3232"]}
          blend={0.5}
          amplitude={1.0}
          speed={0.5}
        />
      </div>

      {/* Sidebar - Desktop */}
      <aside className="relative z-10 hidden md:flex flex-col w-64 border-r border-slate-800 bg-cardbg/50 backdrop-blur-sm glass-panel">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-2 text-neon-400">
            <Shield size={32} strokeWidth={2.5} />
            <h1 className="text-2xl font-bold tracking-tight text-white">Authenta</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-mono">SECURE IP WORKSPACE</p>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <NavItem 
            icon={LayoutDashboard} 
            label="Dashboard" 
            active={activePage === 'dashboard'} 
            onClick={() => onNavigate('dashboard')} 
          />
          <NavItem 
            icon={Database} 
            label="Invention Vault" 
            active={activePage === 'vault'} 
            onClick={() => onNavigate('vault')} 
          />
          <NavItem 
            icon={Key} 
            label="Credential Vault" 
            active={activePage === 'credential-vault'} 
            onClick={() => onNavigate('credential-vault')} 
          />
          <NavItem 
            icon={FileText} 
            label="AI Creative Suite" 
            active={activePage === 'rewrite'} 
            onClick={() => onNavigate('rewrite')} 
          />
          <NavItem 
            icon={Shield} 
            label="Copyright Check" 
            active={activePage === 'classify'} 
            onClick={() => onNavigate('classify')} 
          />
          <div className="h-px bg-slate-800 my-2 mx-4" />
           <NavItem 
            icon={ShoppingBag} 
            label="Marketplace" 
            active={activePage === 'marketplace'} 
            onClick={() => onNavigate('marketplace')} 
          />
          <NavItem 
            icon={Users} 
            label="Collaborators" 
            active={activePage === 'collaborators'} 
            onClick={() => onNavigate('collaborators')} 
          />
           <div className="h-px bg-slate-800 my-2 mx-4" />
          <NavItem 
            icon={Fingerprint} 
            label="Hash Tools" 
            active={activePage === 'hashtools'} 
            onClick={() => onNavigate('hashtools')} 
          />
          <NavItem 
            icon={Lock} 
            label="Local Encrypt" 
            active={activePage === 'encrypt'} 
            onClick={() => onNavigate('encrypt')} 
          />
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 px-4 py-3 mb-2">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="User" className="w-8 h-8 rounded-full border border-neon-400" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-neon-400 text-black flex items-center justify-center font-bold">
                {user?.name?.charAt(0) || 'U'}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.name || 'User'}</p>
              <p className="text-xs text-slate-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-colors"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="relative z-10 flex-1 flex flex-col h-screen overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4 border-b border-slate-800 bg-cardbg/80 backdrop-blur-md">
           <div className="flex items-center gap-2 text-neon-400">
            <Shield size={24} />
            <span className="font-bold text-white text-lg">Authenta</span>
          </div>
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-white">
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </header>

         {/* Mobile Menu */}
         {mobileMenuOpen && (
            <div className="md:hidden absolute top-[65px] left-0 right-0 bottom-0 bg-darkbg z-50 p-4">
               <nav className="space-y-2">
                <NavItem icon={LayoutDashboard} label="Dashboard" active={activePage === 'dashboard'} onClick={() => { onNavigate('dashboard'); setMobileMenuOpen(false); }} />
                <NavItem icon={Database} label="Vault" active={activePage === 'vault'} onClick={() => { onNavigate('vault'); setMobileMenuOpen(false); }} />
                <NavItem icon={Key} label="Credentials" active={activePage === 'credential-vault'} onClick={() => { onNavigate('credential-vault'); setMobileMenuOpen(false); }} />
                <NavItem icon={FileText} label="AI Suite" active={activePage === 'rewrite'} onClick={() => { onNavigate('rewrite'); setMobileMenuOpen(false); }} />
                <NavItem icon={ShoppingBag} label="Marketplace" active={activePage === 'marketplace'} onClick={() => { onNavigate('marketplace'); setMobileMenuOpen(false); }} />
                 <NavItem icon={Users} label="Collaborators" active={activePage === 'collaborators'} onClick={() => { onNavigate('collaborators'); setMobileMenuOpen(false); }} />
                <button onClick={onLogout} className="w-full flex items-center gap-2 px-4 py-3 text-red-400 mt-4 border-t border-slate-800 pt-4">
                  <LogOut size={20} /> Sign Out
                </button>
              </nav>
            </div>
         )}

        <main className="flex-1 overflow-y-auto p-4 md:p-8 relative scroll-smooth">
          <div className="max-w-6xl mx-auto pb-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};