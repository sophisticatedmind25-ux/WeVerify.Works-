
import React, { useState } from 'react';
import { Shield, Lock, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AdminLogin: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    identifier: '',
    password: ''
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Check for admin and agents
    setTimeout(() => {
      const agents = JSON.parse(localStorage.getItem('wv_agents') || '[]');
      const users = JSON.parse(localStorage.getItem('wv_users') || '[]');
      
      const user = users.find((u: any) => u.email === formData.identifier || u.username === formData.identifier);
      const agent = agents.find((a: any) => (a.email === formData.identifier || a.username === formData.identifier) && (a.password === formData.password || (!a.password && formData.password === 'passwordverified')));
      const isAdmin = (formData.identifier === 'admin@weverify.works' || formData.identifier === 'admin') && formData.password === 'admin123';

      if (user && !isAdmin && !agent) {
        setError('This is a Client account. Please use the Client Verification Dashboard.');
        setIsLoading(false);
        return;
      }

      if (isAdmin || agent) {
        localStorage.setItem('wv_admin_auth', 'true');
        localStorage.setItem('wv_admin_email', isAdmin ? 'admin@weverify.works' : agent.email);
        localStorage.setItem('wv_admin_name', isAdmin ? 'Admin User' : agent.name);
        localStorage.setItem('wv_admin_title', isAdmin ? 'Infrastructure Lead' : agent.title);
        localStorage.setItem('wv_admin_role', isAdmin ? 'ADMIN' : agent.role);
        window.dispatchEvent(new Event('storage'));
        navigate('/admin/dashboard');
      } else {
        setError('Invalid team credentials. Access denied.');
        setIsLoading(false);
      }
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl p-10">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-red-100 shadow-lg">
             <Shield className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Weverify Team CMS</h1>
          <p className="text-slate-500 font-medium text-sm">Secure affiliate and employee access portal.</p>
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
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all"
              placeholder="Username or Email"
              value={formData.identifier}
              onChange={(e) => setFormData({...formData, identifier: e.target.value})}
            />
          </div>
          
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-2">Access Key</label>
            <div className="relative">
              <input 
                required
                type="password" 
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all pr-12"
                placeholder="••••••••••••"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
              />
              <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-lg hover:bg-slate-800 transition-all shadow-xl flex items-center justify-center space-x-2 mt-4"
          >
            {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
              <>
                <span>Authorize Access</span>
                <ArrowRight className="w-5 h-5 text-red-400" />
              </>
            )}
          </button>
        </form>

        <div className="mt-12 flex items-center justify-center space-x-2 text-[10px] text-slate-300 font-black uppercase tracking-widest">
           <Shield className="w-3 h-3 text-red-600/30" />
           <span>Team CMS Access Active</span>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
