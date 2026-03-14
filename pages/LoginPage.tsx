import React, { useState } from 'react';
import { ShieldCheck, ArrowRight, Loader2, Key, AlertCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    identifier: '',
    password: ''
  });

  const [error, setError] = useState<string | null>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    // Simulate API delay
    setTimeout(() => {
      const users = JSON.parse(localStorage.getItem('wv_users') || '[]');
      const agents = JSON.parse(localStorage.getItem('wv_agents') || '[]');
      
      const user = users.find((u: any) => u.email === formData.identifier || u.username === formData.identifier);
      const agent = agents.find((a: any) => a.email === formData.identifier || a.username === formData.identifier);
      const isAdmin = (formData.identifier === 'admin@weverify.works' || formData.identifier === 'admin') && formData.password === 'admin123';

      if (isAdmin || agent) {
        setError('This is a Team CMS account. Please use the Team CMS Access portal below.');
        setIsLoading(false);
        return;
      }

      if (user && (user.password === formData.password || !user.password)) {
        localStorage.setItem('wv_auth', 'true');
        localStorage.setItem('wv_user_email', user.email); // Always store email as primary identifier in session
        // Sync tokens if they exist in the global list
        localStorage.setItem('wv_tokens', user.tokens.toString());
        
        window.dispatchEvent(new Event('storage'));
        navigate('/dashboard');
      } else {
        setError('Account not found or email not verified. Please register or check your verification status.');
        setIsLoading(false);
      }
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl border border-slate-200 p-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-teal-50 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-teal-100 shadow-lg">
             <Key className="w-8 h-8 text-teal-600" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Client Verification Dashboard</h1>
          <p className="text-slate-500 font-medium text-sm">Authenticate to the verification registry.</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center space-x-3 text-red-600 text-xs font-bold uppercase tracking-wider">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-2">Username / Email</label>
            <input 
              required
              type="text" 
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all"
              placeholder="Username or Email"
              value={formData.identifier}
              onChange={(e) => setFormData({...formData, identifier: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-2">Passphrase</label>
            <input 
              required
              type="password" 
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all"
              placeholder="••••••••••••"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
            />
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-lg hover:bg-slate-800 transition-all shadow-xl flex items-center justify-center space-x-2 mt-4"
          >
            {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
              <>
                <span>Authenticate</span>
                <ArrowRight className="w-5 h-5 text-teal-400" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center space-y-4">
          <Link to="/register" className="block text-xs font-bold text-slate-400 hover:text-teal-600 uppercase tracking-widest transition-colors">
            Create Account Now
          </Link>
          <Link to="/admin/login" className="block text-[10px] font-black text-slate-300 hover:text-teal-600 uppercase tracking-[0.2em] transition-colors">
            Team CMS Access
          </Link>
        </div>
        
        <div className="mt-12 flex items-center justify-center space-x-2 text-[10px] text-slate-300 font-black uppercase tracking-widest">
           <ShieldCheck className="w-3 h-3 text-teal-600/30" />
           <span>Registry Integrity Lock Active</span>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;