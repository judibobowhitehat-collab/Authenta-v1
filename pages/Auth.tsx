import React, { useState, useEffect } from 'react';
import { Shield, Lock, FileText, Globe, CheckCircle, Scale, ChevronDown, AlertCircle, Copy, Feather, Code } from 'lucide-react';
import Aurora from '../components/Aurora';
import { auth, googleProvider } from '../firebaseConfig';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, updateProfile, sendEmailVerification } from 'firebase/auth';
import { toast } from 'sonner';

const InfoCard = ({ icon: Icon, title, description }: any) => (
  <div className="bg-cardbg/60 backdrop-blur-md border border-slate-700/50 p-6 rounded-xl hover:border-neon-500/30 transition-all hover:-translate-y-1">
    <div className="w-12 h-12 bg-slate-800 rounded-lg flex items-center justify-center mb-4 text-neon-400">
      <Icon size={24} />
    </div>
    <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
    <p className="text-slate-300 text-sm leading-relaxed">{description}</p>
  </div>
);

const LicenseType = ({ code, title, color, desc }: any) => (
  <div className="border border-slate-800 bg-slate-900/50 rounded-lg p-5">
    <div className="flex items-center justify-between mb-3">
      <span className={`text-xs font-mono px-2 py-1 rounded ${color} text-black font-bold`}>{code}</span>
    </div>
    <h4 className="font-bold text-white mb-2">{title}</h4>
    <p className="text-xs text-slate-400 leading-relaxed">{desc}</p>
  </div>
);

export const Auth: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Calculate opacity based on scroll. 0 scroll = 1 opacity. 300 scroll = 0 opacity.
  const heroOpacity = Math.max(0, 1 - scrollY / 400);
  const heroScale = 1 - scrollY / 2000;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        toast.success("Welcome back!");
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: name });
        try {
          await sendEmailVerification(userCredential.user);
          toast.success(`Account created! Verification sent to ${email}`);
        } catch (verError) {
          console.error("Verification email failed", verError);
        }
      }
    } catch (err: any) {
      toast.error(err.message.replace('Firebase: ', ''));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      toast.success("Signed in with Google");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const scrollToContent = () => {
    document.getElementById('learn-more')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-darkbg relative overflow-x-hidden selection:bg-neon-500/30 selection:text-neon-100">
      {/* --- FIXED BACKGROUND --- */}
      <div className="fixed inset-0 z-0 opacity-60">
         <Aurora
          colorStops={["#3A29FF", "#FF94B4", "#FF3232"]}
          blend={0.5}
          amplitude={1.2}
          speed={0.4}
        />
      </div>

      {/* --- SCROLLABLE CONTENT --- */}
      <div className="relative z-10">
        
        {/* HERO SECTION with Fade Effect */}
        <div 
          className="min-h-screen flex flex-col items-center justify-center p-4 text-center sticky top-0"
          style={{ opacity: heroOpacity, transform: `scale(${heroScale})` }}
        >
           <div className="space-y-8 flex flex-col items-center animate-fade-in max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neon-900/30 border border-neon-500/30 text-neon-400 text-sm font-medium backdrop-blur-sm">
              <Shield size={16} />
              <span>Authenta Secure Workspace</span>
            </div>
            
            <h1 className="text-5xl md:text-8xl font-bold text-white tracking-tight leading-tight">
              Your Ideas, <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-400 to-purple-400">
                Encrypted & Verified
              </span>
            </h1>
            
            <p className="text-xl text-slate-200 leading-relaxed max-w-2xl drop-shadow-lg">
              Authenta uses military-grade encryption and AI analysis to protect your intellectual property. Timestamp your work, classify copyrights, and secure your creative future.
            </p>

            <button 
              onClick={scrollToContent}
              className="mt-12 flex flex-col items-center gap-2 text-slate-400 hover:text-white transition-colors animate-bounce cursor-pointer"
            >
              <span className="text-sm font-medium">Learn about IP Rights</span>
              <ChevronDown size={24} />
            </button>
          </div>
        </div>

        {/* EDUCATIONAL SECTION */}
        <div id="learn-more" className="bg-darkbg/95 border-t border-slate-800 backdrop-blur-xl relative z-20 min-h-screen">
          <div className="max-w-6xl mx-auto px-4 py-24">
            
            {/* IP & Copyright */}
            <div className="mb-24">
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Understanding Intellectual Property</h2>
                <p className="text-slate-400 max-w-2xl mx-auto">
                  Before you secure your work, it's crucial to understand what you own. Authenta helps you manage these rights.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <InfoCard 
                  icon={Scale}
                  title="Intellectual Property (IP)"
                  description="Refers to creations of the mind, such as inventions; literary and artistic works; designs; and symbols, names and images used in commerce."
                />
                <InfoCard 
                  icon={FileText}
                  title="Copyright"
                  description="A legal right that grants the creator of an original work exclusive rights for its use and distribution. This is usually only for a limited time."
                />
                <InfoCard 
                  icon={Shield}
                  title="Protection"
                  description="Authenta provides digital proof of existence via SHA-256 hashing and timestamping, proving you had this data at a specific point in time."
                />
              </div>
            </div>

            {/* License Types */}
            <div className="mb-24">
              <div className="flex items-center gap-4 mb-8">
                <div className="h-px bg-slate-700 flex-1"></div>
                <h2 className="text-2xl font-bold text-white text-center">Common License Types</h2>
                <div className="h-px bg-slate-700 flex-1"></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <LicenseType 
                  code="COPYRIGHT" 
                  title="All Rights Reserved" 
                  color="bg-red-400"
                  desc="Default protection. No one can use, copy, or distribute your work without your explicit permission."
                />
                <LicenseType 
                  code="CC-BY" 
                  title="Creative Commons" 
                  color="bg-blue-400"
                  desc="Allows others to distribute and build upon your work, even commercially, as long as they credit you."
                />
                 <LicenseType 
                  code="CC0" 
                  title="Public Domain" 
                  color="bg-green-400"
                  desc="You waive all rights. Anyone can use your work for any purpose without restriction or credit."
                />
                <LicenseType 
                  code="MIT" 
                  title="Open Source" 
                  color="bg-yellow-400"
                  desc="Common for software. Allows use/modification/distribution but requires preservation of copyright notice."
                />
              </div>
            </div>

            {/* AUTH FORM SECTION */}
            <div className="flex flex-col items-center">
              <h2 className="text-3xl font-bold text-white mb-8">Ready to Secure Your Work?</h2>
              
              <div className="w-full max-w-md bg-slate-900 border border-neon-500/30 p-8 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] relative">
                <div className="flex flex-col items-center mb-6">
                  <h3 className="text-xl font-bold text-white">
                    {isLogin ? 'Sign In to Authenta' : 'Create Secure Account'}
                  </h3>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {!isLogin && (
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Full Name</label>
                      <input
                        type="text"
                        required
                        autoComplete="name"
                        className="w-full bg-slate-950/50 border border-slate-700 rounded-lg p-3 text-white focus:border-neon-500 focus:outline-none"
                        placeholder="Creator Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </div>
                  )}
                  
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Email</label>
                    <input
                      type="email"
                      required
                      autoComplete="username"
                      className="w-full bg-slate-950/50 border border-slate-700 rounded-lg p-3 text-white focus:border-neon-500 focus:outline-none"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Password</label>
                    <input
                      type="password"
                      required
                      autoComplete={isLogin ? "current-password" : "new-password"}
                      className="w-full bg-slate-950/50 border border-slate-700 rounded-lg p-3 text-white focus:border-neon-500 focus:outline-none"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-neon-500 hover:bg-neon-400 text-black font-bold py-3.5 rounded-lg transition-all mt-4 relative overflow-hidden disabled:opacity-50"
                  >
                    {loading ? 'Processing...' : (isLogin ? 'Access Dashboard' : 'Create Account')}
                  </button>
                </form>

                 <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-700"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-slate-900 text-slate-500">Or continue with</span>
                    </div>
                  </div>

                  <button 
                    type="button"
                    onClick={handleGoogleSignIn}
                    className="w-full bg-white text-black font-bold py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-slate-200 transition-colors"
                  >
                    <img src="https://www.google.com/favicon.ico" alt="G" className="w-4 h-4" />
                    Google
                  </button>

                <div className="mt-6 text-center pt-6 border-t border-slate-700/50">
                  <p className="text-slate-500 text-sm">
                    {isLogin ? "New to Authenta? " : "Already verified? "}
                    <button 
                      onClick={() => setIsLogin(!isLogin)}
                      className="text-neon-400 hover:text-neon-300 font-medium hover:underline ml-1"
                    >
                      {isLogin ? "Sign Up Free" : "Login Here"}
                    </button>
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* FOOTER */}
        <div className="bg-black border-t border-slate-800 py-12 text-center relative z-20">
          <p className="text-slate-500 text-sm font-medium">Powered by Judah Araba</p>
          <p className="text-slate-600 text-xs mt-2">© {new Date().getFullYear()} Authenta. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};