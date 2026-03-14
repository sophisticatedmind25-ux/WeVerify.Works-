
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ClipboardList, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  Zap, 
  CreditCard, 
  ArrowRight, 
  TrendingUp, 
  ShieldCheck,
  Building2,
  Mail,
  HelpCircle,
  Loader2,
  AlertCircle
} from 'lucide-react';

interface VerificationEntry {
  id: string;
  status: 'PENDING' | 'IN_REVIEW' | 'VERIFIED' | 'REJECTED';
}

const VerificationDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    open: 0,
    complete: 0,
    cancelled: 0,
    total: 0
  });
  const [tokens, setTokens] = useState<number>(parseInt(localStorage.getItem('wv_tokens') || '0'));
  const [isSubscribing, setIsSubscribing] = useState<string | null>(null);
  const [accountNumber, setAccountNumber] = useState<string | null>(null);
  const [showDisclaimer, setShowDisclaimer] = useState<boolean>(false);
  const actingAs = localStorage.getItem('wv_admin_acting_as');
  const userEmail = actingAs || localStorage.getItem('wv_user_email') || 'User';
  const [userName, setUserName] = useState<string>(userEmail);

  const logAction = (action: string, details: string, type: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS' = 'INFO') => {
    const logs = JSON.parse(localStorage.getItem('wv_admin_logs') || '[]');
    const newLog = {
      id: `LOG-${Date.now()}`,
      timestamp: new Date().toLocaleString(),
      user: userEmail,
      action,
      details,
      type
    };
    const updatedLogs = [newLog, ...logs].slice(0, 100);
    localStorage.setItem('wv_admin_logs', JSON.stringify(updatedLogs));
  };

  useEffect(() => {
    logAction('Dashboard Access', `Client accessed Verification Dashboard`, 'INFO');
    // Fetch account number from users list
    const users = JSON.parse(localStorage.getItem('wv_users') || '[]');
    const currentUser = users.find((u: any) => u.email === userEmail);
    if (currentUser?.accountNumber) {
      setAccountNumber(currentUser.accountNumber);
    }
    if (currentUser?.username) {
      setUserName(currentUser.username);
    }

    const data = localStorage.getItem('wv_queue');
    if (data) {
      const queue: VerificationEntry[] = JSON.parse(data);
      const open = queue.filter(i => i.status === 'PENDING' || i.status === 'IN_REVIEW').length;
      const complete = queue.filter(i => i.status === 'VERIFIED').length;
      const cancelled = queue.filter(i => i.status === 'REJECTED').length;
      setStats({
        open,
        complete,
        cancelled,
        total: queue.length
      });
    }

    // Check for Stripe success
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session_id');
    const newTokens = urlParams.get('tokens');
    
    if (sessionId && newTokens) {
      const tokenCount = parseInt(newTokens);
      const currentTokens = parseInt(localStorage.getItem('wv_tokens') || '0');
      const updatedTokens = currentTokens + tokenCount;
      localStorage.setItem('wv_tokens', updatedTokens.toString());
      setTokens(updatedTokens);

      // Sync to global users list for admin visibility
      const users = JSON.parse(localStorage.getItem('wv_users') || '[]');
      const updatedUsers = users.map((u: any) => {
        if (u.email === userEmail) {
          return { ...u, tokens: updatedTokens };
        }
        return u;
      });
      localStorage.setItem('wv_users', JSON.stringify(updatedUsers));

      logAction('Token Purchase', `Successfully purchased ${tokenCount} tokens via Stripe. Session: ${sessionId}`, 'SUCCESS');
      alert(`Payment successful! ${tokenCount} tokens have been added to your account.`);
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname + window.location.hash);
    }

    // Check for disclaimer acceptance
    const disclaimerAccepted = localStorage.getItem(`wv_disclaimer_accepted_${userEmail}`);
    if (!disclaimerAccepted) {
      setShowDisclaimer(true);
    }
  }, []);

  const handleAcceptDisclaimer = () => {
    localStorage.setItem(`wv_disclaimer_accepted_${userEmail}`, 'true');
    setShowDisclaimer(false);
    logAction('Disclaimer Accepted', 'User accepted the Privacy and Acceptable Use Disclaimer', 'SUCCESS');
  };

  const handleSubscribe = async (plan: 'PERSONAL' | 'PRO' | 'PREMIUM') => {
    logAction('Initiate Subscription', `Client initiated ${plan} plan subscription via Stripe`, 'INFO');
    setIsSubscribing(plan);
    try {
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail, plan })
      });
      const { url } = await response.json();
      if (url) {
        window.location.href = url;
      }
    } catch (err) {
      console.error("Stripe error:", err);
      alert("Failed to initialize payment. Please try again.");
    } finally {
      setIsSubscribing(null);
    }
  };

  const handleStartVerification = () => {
    if (tokens <= 0) {
      if (window.confirm("Insufficient credits. You have 0 verification tokens available. Would you like to purchase more or contact your account manager?")) {
        const plansSection = document.getElementById('plans-section');
        plansSection?.scrollIntoView({ behavior: 'smooth' });
      }
      return;
    }
    navigate('/generate');
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 relative">
      {actingAs && (
        <div className="fixed top-0 left-0 right-0 bg-amber-500 text-white py-2 px-6 flex items-center justify-between shadow-lg z-[150]">
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-4 h-4" />
            <span className="text-xs font-black uppercase tracking-widest">Administrative Mode: Acting as {actingAs}</span>
          </div>
          <button 
            onClick={() => {
              localStorage.removeItem('wv_admin_acting_as');
              navigate('/admin/dashboard');
            }}
            className="text-[10px] font-black uppercase tracking-widest bg-white/20 hover:bg-white/30 px-3 py-1 rounded-lg transition-all"
          >
            Exit Mode
          </button>
        </div>
      )}
      {/* Disclaimer Modal */}
      {showDisclaimer && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="max-w-2xl w-full bg-white rounded-[3rem] shadow-2xl border border-slate-200 p-12 relative overflow-hidden animate-in zoom-in-95 duration-500">
            <div className="absolute top-0 right-0 p-12 opacity-5">
              <ShieldCheck className="w-48 h-48 text-teal-600" />
            </div>
            
            <div className="relative z-10">
              <div className="w-16 h-16 bg-teal-50 rounded-2xl flex items-center justify-center mb-8 border border-teal-100 shadow-lg">
                <ShieldCheck className="w-8 h-8 text-teal-600" />
              </div>
              
              <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-6">Privacy & Acceptable Use Policy</h2>
              
              <div className="space-y-6 text-slate-600 font-medium leading-relaxed mb-10 max-h-[40vh] overflow-y-auto pr-4 custom-scrollbar">
                <p>
                  By accessing the WeVerify.works network, you acknowledge and agree to the following terms regarding data privacy and system usage:
                </p>
                
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-1.5 h-1.5 bg-teal-500 rounded-full mt-2 shrink-0" />
                    <p className="text-sm"><strong>Data Confidentiality:</strong> You agree to handle all subject data and verification results in strict accordance with global privacy standards (GDPR, CCPA). Unauthorized disclosure of sensitive information is strictly prohibited.</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-1.5 h-1.5 bg-teal-500 rounded-full mt-2 shrink-0" />
                    <p className="text-sm"><strong>Acceptable Use:</strong> This system must only be used for legitimate identity verification purposes. Any attempt to bypass security controls, scrape data, or use the platform for fraudulent activities will result in immediate account termination.</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-1.5 h-1.5 bg-teal-500 rounded-full mt-2 shrink-0" />
                    <p className="text-sm"><strong>Audit Logging:</strong> All actions performed within this node are cryptographically logged and subject to forensic audit by the WeVerify infrastructure team.</p>
                  </div>
                </div>
                
                <p className="text-sm italic">
                  Failure to comply with these guidelines may result in permanent suspension of your node access and potential legal action.
                </p>
              </div>
              
              <button 
                onClick={handleAcceptDisclaimer}
                className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-lg hover:bg-slate-800 transition-all shadow-xl flex items-center justify-center space-x-3"
              >
                <span>I Accept & Agree to Terms</span>
                <ArrowRight className="w-5 h-5 text-teal-400" />
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 space-y-6 md:space-y-0">
          <div>
            <h1 className="text-4xl font-black text-slate-900 flex items-center space-x-3 tracking-tight">
              <LayoutDashboard className="w-10 h-10 text-teal-600" />
              <span>Verification Dashboard</span>
            </h1>
            <div className="flex items-center space-x-2 mt-1">
              <p className="text-slate-500 font-medium">Welcome back, <span className="text-teal-600 font-bold">{userName}</span></p>
              {accountNumber && (
                <>
                  <span className="text-slate-300">|</span>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded-md">Client ID: {accountNumber}</p>
                </>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-6">
            <div className="bg-white px-6 py-4 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-4">
               <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center">
                  <Zap className="w-6 h-6 text-teal-600" />
               </div>
               <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Available Tokens</p>
                  <p className={`text-xl font-black ${tokens > 0 ? 'text-slate-900' : 'text-red-500'}`}>{tokens}</p>
               </div>
            </div>
            <button 
              onClick={handleStartVerification}
              className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-sm hover:bg-slate-800 transition-all flex items-center space-x-2 shadow-xl"
            >
              <Zap className="w-4 h-4 text-teal-400" />
              <span>Initialize New Verification</span>
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {/* Open / Pending - Yellow */}
          <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-200 relative overflow-hidden group hover:border-amber-400 transition-all">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
              <Clock className="w-24 h-24 text-amber-600" />
            </div>
            <div className="relative z-10">
              <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center mb-6 border border-amber-100">
                <Clock className="w-6 h-6 text-amber-600" />
              </div>
              <p className="text-5xl font-black text-slate-900 mb-2">{stats.open}</p>
              <p className="text-xs font-black text-amber-600 uppercase tracking-[0.2em]">Open Lifecycles</p>
              <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Awaiting Grounding</span>
                <Link to="/queue" className="text-amber-600 hover:text-amber-700 font-black text-[10px] uppercase tracking-widest flex items-center space-x-1">
                  <span>View Details</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>

          {/* Complete / Verified - Green */}
          <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-200 relative overflow-hidden group hover:border-emerald-400 transition-all">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
              <CheckCircle2 className="w-24 h-24 text-emerald-600" />
            </div>
            <div className="relative z-10">
              <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center mb-6 border border-emerald-100">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              </div>
              <p className="text-5xl font-black text-slate-900 mb-2">{stats.complete}</p>
              <p className="text-xs font-black text-emerald-600 uppercase tracking-[0.2em]">Completed Verifications</p>
              <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Registry Anchored</span>
                <Link to="/queue" className="text-emerald-600 hover:text-emerald-700 font-black text-[10px] uppercase tracking-widest flex items-center space-x-1">
                  <span>View Details</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>

          {/* Cancelled / Rejected - Red */}
          <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-200 relative overflow-hidden group hover:border-red-400 transition-all">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
              <XCircle className="w-24 h-24 text-red-600" />
            </div>
            <div className="relative z-10">
              <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center mb-6 border border-red-100">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
              <p className="text-5xl font-black text-slate-900 mb-2">{stats.cancelled}</p>
              <p className="text-xs font-black text-red-600 uppercase tracking-[0.2em]">Cancelled / Rejected</p>
              <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Integrity Failed</span>
                <Link to="/queue" className="text-red-600 hover:text-red-700 font-black text-[10px] uppercase tracking-widest flex items-center space-x-1">
                  <span>View Details</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Token Plans Section */}
        <div id="plans-section" className="mb-12">
          <div className="text-center mb-10">
            <h2 className="text-xs font-black text-teal-600 uppercase tracking-[0.4em] mb-4">Registry Credits</h2>
            <h3 className="text-4xl font-black text-slate-900 tracking-tight">Select Your Verification Plan</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Personal */}
            <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-xl flex flex-col">
              <div className="mb-8">
                <h4 className="text-2xl font-black text-slate-900 mb-2">Personal</h4>
                <p className="text-slate-500 font-medium text-sm">No monthly subscription required.</p>
              </div>
              <div className="mb-8">
                <span className="text-5xl font-black text-slate-900">3</span>
                <span className="text-slate-400 font-bold ml-2 uppercase tracking-widest text-xs">Tokens</span>
              </div>
              <ul className="space-y-4 mb-10 flex-grow">
                <li className="flex items-center space-x-3 text-sm font-bold text-slate-700">
                  <CheckCircle2 className="w-5 h-5 text-teal-500" />
                  <span>Single Subject Verifications</span>
                </li>
                <li className="flex items-center space-x-3 text-sm font-bold text-slate-700">
                  <CheckCircle2 className="w-5 h-5 text-teal-500" />
                  <span>Email Correspondence</span>
                </li>
                <li className="flex items-center space-x-3 text-sm font-bold text-slate-700">
                  <CheckCircle2 className="w-5 h-5 text-teal-500" />
                  <span>Registry Anchoring</span>
                </li>
              </ul>
              <button 
                onClick={() => handleSubscribe('PERSONAL')}
                disabled={!!isSubscribing}
                className="w-full py-4 bg-slate-100 text-slate-900 rounded-2xl font-black hover:bg-slate-200 transition-all flex items-center justify-center space-x-2"
              >
                {isSubscribing === 'PERSONAL' ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>Purchase Bundle</span>}
              </button>
            </div>

            {/* Business Pro */}
            <div className="bg-slate-900 p-10 rounded-[2.5rem] border-4 border-teal-500 shadow-2xl flex flex-col relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-teal-500 text-slate-900 px-6 py-2 rounded-bl-2xl font-black text-[10px] uppercase tracking-widest">Most Popular</div>
              <div className="mb-8">
                <h4 className="text-2xl font-black text-white mb-2">Business Pro</h4>
                <p className="text-slate-400 font-medium text-sm">Professional lifecycle management.</p>
              </div>
              <div className="mb-8">
                <span className="text-5xl font-black text-white">25</span>
                <span className="text-slate-500 font-bold ml-2 uppercase tracking-widest text-xs">Tokens</span>
              </div>
              <ul className="space-y-4 mb-10 flex-grow">
                <li className="flex items-center space-x-3 text-sm font-bold text-slate-300">
                  <CheckCircle2 className="w-5 h-5 text-teal-400" />
                  <span>Priority Grounding</span>
                </li>
                <li className="flex items-center space-x-3 text-sm font-bold text-slate-300">
                  <CheckCircle2 className="w-5 h-5 text-teal-400" />
                  <span>Automated Follow-ups</span>
                </li>
                <li className="flex items-center space-x-3 text-sm font-bold text-slate-300">
                  <CheckCircle2 className="w-5 h-5 text-teal-400" />
                  <span>Advanced Forensic Verification</span>
                </li>
              </ul>
              <button 
                onClick={() => handleSubscribe('PRO')}
                disabled={!!isSubscribing}
                className="w-full py-4 bg-teal-500 text-slate-900 rounded-2xl font-black hover:bg-teal-400 transition-all flex items-center justify-center space-x-2"
              >
                {isSubscribing === 'PRO' ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>Purchase Bundle</span>}
              </button>
            </div>

            {/* Business Premium */}
            <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-xl flex flex-col">
              <div className="mb-8">
                <h4 className="text-2xl font-black text-slate-900 mb-2">Business Premium</h4>
                <p className="text-slate-500 font-medium text-sm">Enterprise scale operations.</p>
              </div>
              <div className="mb-8">
                <span className="text-5xl font-black text-slate-900">100</span>
                <span className="text-slate-400 font-bold ml-2 uppercase tracking-widest text-xs">Tokens</span>
              </div>
              <ul className="space-y-4 mb-10 flex-grow">
                <li className="flex items-center space-x-3 text-sm font-bold text-slate-700">
                  <CheckCircle2 className="w-5 h-5 text-teal-500" />
                  <span>White-label Returns</span>
                </li>
                <li className="flex items-center space-x-3 text-sm font-bold text-slate-700">
                  <CheckCircle2 className="w-5 h-5 text-teal-500" />
                  <span>Dedicated Client Account</span>
                </li>
                <li className="flex items-center space-x-3 text-sm font-bold text-slate-700">
                  <CheckCircle2 className="w-5 h-5 text-teal-500" />
                  <span>API Integration Access</span>
                </li>
              </ul>
              <button 
                onClick={() => handleSubscribe('PREMIUM')}
                disabled={!!isSubscribing}
                className="w-full py-4 bg-slate-100 text-slate-900 rounded-2xl font-black hover:bg-slate-200 transition-all flex items-center justify-center space-x-2"
              >
                {isSubscribing === 'PREMIUM' ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>Purchase Bundle</span>}
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Section: Quick Links */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-slate-900 rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl flex items-center">
            <div className="absolute top-0 right-0 p-16 opacity-5">
              <ShieldCheck className="w-64 h-64" />
            </div>
            <div className="relative z-10">
              <h2 className="text-3xl font-black mb-4 tracking-tight">Need Custom Infrastructure?</h2>
              <p className="text-slate-400 font-medium text-lg leading-relaxed mb-8 max-w-xl">
                For organizations requiring more than 500 monthly verifications or custom API hooks, contact our infrastructure team.
              </p>
              <a 
                href="https://helpdesk.weverify.works" 
                target="_blank"
                className="px-10 py-5 bg-white text-slate-900 rounded-2xl font-black text-xl hover:bg-slate-100 transition-all inline-flex items-center space-x-3 shadow-2xl"
              >
                <HelpCircle className="w-6 h-6" />
                <span>Contact Account Manager</span>
              </a>
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-xl">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] mb-6">Correspondence Hub</h3>
            <div className="space-y-4">
              <a href="mailto:verifications@weverify.works" className="flex items-center space-x-4 p-4 rounded-2xl hover:bg-slate-50 transition-all group">
                <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center group-hover:bg-teal-500 group-hover:text-white transition-all">
                  <Mail className="w-5 h-5 text-teal-600 group-hover:text-white" />
                </div>
                <div>
                  <p className="text-xs font-black text-slate-900 uppercase tracking-widest">Email Support</p>
                  <p className="text-[10px] text-slate-400 font-bold">verifications@weverify.works</p>
                </div>
              </a>
              <a href="https://helpdesk.weverify.works" target="_blank" className="flex items-center space-x-4 p-4 rounded-2xl hover:bg-slate-50 transition-all group">
                <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-all">
                  <HelpCircle className="w-5 h-5 text-slate-400 group-hover:text-white" />
                </div>
                <div>
                  <p className="text-xs font-black text-slate-900 uppercase tracking-widest">Helpdesk</p>
                  <p className="text-[10px] text-slate-400 font-bold">helpdesk.weverify.works</p>
                </div>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerificationDashboard;
