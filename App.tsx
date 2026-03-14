import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { Shield, LogIn, UserPlus, HelpCircle, Mail, ExternalLink, Menu, X, Zap, ClipboardList, LayoutDashboard } from 'lucide-react';
import LandingPage from './pages/LandingPage';
import IntroPage from './pages/IntroPage';
import VerificationDashboard from './pages/VerificationDashboard';
import ForensicAudit from './pages/ForensicAudit';
import IdentityVerification from './pages/IdentityVerification';
import VerificationFormGenerator from './pages/VerificationFormGenerator';
import VerificationQueue from './pages/VerificationQueue';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import Registration from './pages/Registration';
import LoginPage from './pages/LoginPage';
import EmailVerification from './pages/EmailVerification';
import Helpdesk from './pages/Helpdesk';
import LiveAssistant from './components/LiveAssistant';

const LOGO_URL = "https://www.ampcgfoundation.pro/img/weverifyworkslogo.jpg";
const SECONDARY_LOGO_URL = "https://ampcgfoundation.pro/img/ampcaplogo.png";

const ProtectedRoute = ({ children }: { children?: React.ReactNode }) => {
  const isAdminAuthenticated = localStorage.getItem('wv_admin_auth') === 'true';
  return isAdminAuthenticated ? <>{children}</> : <Navigate to="/admin/login" replace />;
};

const UserProtectedRoute = ({ children }: { children?: React.ReactNode }) => {
  const isUserAuthenticated = localStorage.getItem('wv_auth') === 'true';
  const isAdminAuthenticated = localStorage.getItem('wv_admin_auth') === 'true';
  const isEditRoute = window.location.hash.includes('edit=');
  
  return (isUserAuthenticated || isAdminAuthenticated || isEditRoute) ? <>{children}</> : <Navigate to="/login" replace />;
};

const App: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(localStorage.getItem('wv_admin_auth') === 'true');
  const [isUserAuthenticated, setIsUserAuthenticated] = useState(localStorage.getItem('wv_auth') === 'true');

  useEffect(() => {
    const handleAuthChange = () => {
      setIsAdminAuthenticated(localStorage.getItem('wv_admin_auth') === 'true');
      setIsUserAuthenticated(localStorage.getItem('wv_auth') === 'true');
    };
    window.addEventListener('storage', handleAuthChange);
    const interval = setInterval(handleAuthChange, 1000);
    return () => {
      window.removeEventListener('storage', handleAuthChange);
      clearInterval(interval);
    };
  }, []);

  const handleAdminLogout = () => {
    localStorage.removeItem('wv_admin_auth');
    localStorage.removeItem('wv_admin_email');
    setIsAdminAuthenticated(false);
    window.location.href = '#/admin/login';
  };

  const handleUserLogout = () => {
    localStorage.removeItem('wv_auth');
    localStorage.removeItem('wv_user_email');
    localStorage.removeItem('wv_tokens');
    setIsUserAuthenticated(false);
    window.location.href = '#/login';
  };

  const location = useLocation();
  const isServicesPage = location.pathname === '/home';

  return (
    <div className="min-h-screen flex flex-col relative bg-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 print:hidden shadow-sm relative overflow-hidden">
          {/* Background Image Overlay */}
          <div 
            className="absolute inset-0 z-0 opacity-20 pointer-events-none"
            style={{
              backgroundImage: 'url("http://www.ampcgfoundation.pro/img/WeVerifyAMPProVerify.gif")',
              backgroundSize: 'auto 100%',
              backgroundRepeat: 'repeat-x',
              backgroundPosition: 'center left'
            }}
          />

          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="flex justify-between h-48 items-center">
              <Link to="/" className="flex items-center group relative">
                {logoError ? (
                  <div className="flex items-center space-x-2">
                    <Shield className="w-12 h-12 text-teal-600" />
                    <span className="text-2xl font-black tracking-tighter text-slate-900">WeVerify<span className="text-teal-600">.works</span></span>
                  </div>
                ) : (
                  <img 
                    src={LOGO_URL} 
                    alt="WeVerify.works" 
                    onError={() => setLogoError(true)}
                    className="h-48 w-auto object-contain transition-transform group-hover:scale-105"
                  />
                )}
              </Link>
              
              <div className="hidden sm:flex items-center ml-6 opacity-80 hover:opacity-100 transition-opacity" title="US Based Infrastructure">
                 <img 
                   src="http://www.ampcgfoundation.pro/img/WeVerifyAMPProVerify.gif" 
                   alt="WeVerify AMP Pro Verify" 
                   className="h-96 w-auto"
                 />
              </div>

              {/* Desktop Nav */}
              <div className="hidden md:flex items-center space-x-8">
                {isAdminAuthenticated ? (
                  <>
                    <Link to="/admin/dashboard" className="flex items-center space-x-2 text-slate-900 hover:text-teal-600 font-black text-xs transition-colors uppercase tracking-[0.2em]">
                      <LayoutDashboard className="w-4 h-4 text-teal-500" />
                      <span>Team CMS</span>
                    </Link>
                    <button onClick={handleAdminLogout} className="text-slate-400 hover:text-red-600 font-black text-xs uppercase tracking-[0.2em] transition-colors">Logout</button>
                  </>
                ) : isUserAuthenticated ? (
                  <>
                    <Link to="/dashboard" className="flex items-center space-x-2 text-slate-900 hover:text-teal-600 font-black text-xs transition-colors uppercase tracking-[0.2em]">
                      <LayoutDashboard className="w-4 h-4 text-teal-500" />
                      <span>Verification Dashboard</span>
                    </Link>
                    <Link to="/generate" className="flex items-center space-x-2 text-slate-500 hover:text-teal-600 font-bold text-xs transition-colors uppercase tracking-[0.2em]">
                      <Zap className="w-4 h-4" />
                      <span>Start Verification</span>
                    </Link>
                    <Link to="/queue" className="flex items-center space-x-2 text-slate-500 hover:text-teal-600 font-bold text-xs transition-colors uppercase tracking-[0.2em]">
                      <ClipboardList className="w-4 h-4" />
                      <span>My Registry</span>
                    </Link>
                    <button onClick={handleUserLogout} className="text-slate-400 hover:text-red-600 font-black text-xs uppercase tracking-[0.2em] transition-colors">Logout</button>
                  </>
                ) : (
                  <div className="flex items-center space-x-4">
                    <Link to="/login" className="px-6 py-3 border border-slate-200 text-slate-900 rounded-full font-black text-[11px] transition-colors uppercase tracking-[0.2em] hover:bg-slate-50">
                      Login
                    </Link>
                    <Link to="/register" className="px-6 py-3 bg-slate-900 text-white rounded-full font-black text-[11px] transition-colors uppercase tracking-[0.2em] hover:bg-slate-800">
                      Get Started
                    </Link>
                  </div>
                )}
              </div>

              {/* Mobile Menu Button */}
              <div className="md:hidden">
                <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 text-slate-600">
                  {isMenuOpen ? <X /> : <Menu />}
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Nav */}
          {isMenuOpen && (
            <div className="md:hidden bg-white border-b border-slate-200 px-4 py-8 space-y-6 animate-in slide-in-from-top duration-300">
              {isAdminAuthenticated ? (
                <>
                  <Link to="/admin/dashboard" onClick={() => setIsMenuOpen(false)} className="block text-slate-900 font-black text-xl uppercase tracking-wider">Team CMS</Link>
                  <button onClick={() => { handleAdminLogout(); setIsMenuOpen(false); }} className="block text-red-600 font-black text-xl uppercase tracking-wider text-left">Logout</button>
                </>
              ) : isUserAuthenticated ? (
                <>
                  <Link to="/dashboard" onClick={() => setIsMenuOpen(false)} className="block text-slate-900 font-black text-xl uppercase tracking-wider">Verification Dashboard</Link>
                  <Link to="/generate" onClick={() => setIsMenuOpen(false)} className="block text-slate-900 font-black text-xl uppercase tracking-wider">Start Verification</Link>
                  <Link to="/queue" onClick={() => setIsMenuOpen(false)} className="block text-slate-900 font-black text-xl uppercase tracking-wider">My Registry</Link>
                  <button onClick={() => { handleUserLogout(); setIsMenuOpen(false); }} className="block text-red-600 font-black text-xl uppercase tracking-wider text-left">Logout</button>
                </>
              ) : (
                <div className="space-y-4">
                  <Link to="/login" onClick={() => setIsMenuOpen(false)} className="block px-6 py-4 border border-slate-200 text-slate-900 rounded-2xl font-black text-sm uppercase tracking-wider text-center">Login</Link>
                  <Link to="/register" onClick={() => setIsMenuOpen(false)} className="block px-6 py-4 bg-slate-900 text-white rounded-2xl font-black text-sm uppercase tracking-wider text-center">Get Started</Link>
                </div>
              )}
            </div>
          )}
        </nav>

        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<IntroPage />} />
            <Route path="/home" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<Registration />} />
            <Route path="/verify-email" element={<EmailVerification />} />
            <Route path="/dashboard" element={<UserProtectedRoute><VerificationDashboard /></UserProtectedRoute>} />
            <Route path="/forensic-audit" element={<UserProtectedRoute><ForensicAudit /></UserProtectedRoute>} />
            <Route path="/helpdesk" element={<Helpdesk />} />
            
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/dashboard" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
            
            <Route path="/identity" element={<IdentityVerification />} />
            <Route path="/generate" element={<VerificationFormGenerator />} />
            <Route path="/queue" element={<UserProtectedRoute><VerificationQueue /></UserProtectedRoute>} />
            
            {/* Redirect any other routes to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        <LiveAssistant />

        {/* Footer */}
        <footer className="bg-slate-50 text-slate-500 py-24 px-6 border-t border-slate-200 print:hidden">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-16">
            <div className="col-span-1 md:col-span-2">
              <div className="mb-8">
                <Link to="/">
                   <img 
                      src={LOGO_URL} 
                      alt="WeVerify.works" 
                      className="h-32 w-auto object-contain" 
                    />
                </Link>
              </div>
              <p className="max-w-md text-base leading-relaxed text-slate-600 font-medium">
                Complete, hands-free verification management. From entity research to final registry anchoring, we handle the entire lifecycle of trust.
              </p>
              <div className="mt-10 flex space-x-10">
                <img src={SECONDARY_LOGO_URL} alt="Parent Org" className="h-10 w-auto opacity-40 grayscale" />
              </div>
            </div>

            <div>
              <h4 className="text-slate-900 font-black mb-6 text-[10px] uppercase tracking-[0.4em]">Official Correspondence</h4>
              <ul className="space-y-4 text-xs font-bold text-slate-500">
                <li className="flex flex-col">
                  <span className="text-slate-400 uppercase text-[9px] mb-1">Verification Returns</span>
                  <a href="mailto:verifications@weverify.works" className="text-teal-600 hover:underline flex items-center space-x-2">
                    <Mail className="w-3 h-3" />
                    <span>verifications@weverify.works</span>
                  </a>
                </li>
                <li className="flex flex-col">
                   <span className="text-slate-400 uppercase text-[9px] mb-1">Accounts & Helpdesk</span>
                   <a href="https://helpdesk.weverify.works" target="_blank" className="text-slate-900 hover:text-teal-600 flex items-center space-x-2 transition-colors">
                     <HelpCircle className="w-3 h-3" />
                     <span>helpdesk.weverify.works</span>
                   </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="max-w-7xl mx-auto mt-20 pt-8 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center text-[10px] text-slate-400 uppercase tracking-[0.2em] font-black">
            <p>© {new Date().getFullYear()} WEVERIFY GROUP. DATA PROTECTION REGISTERED.</p>
            <div className="mt-6 md:mt-0 flex space-x-8">
               <span className="flex items-center space-x-2"><Shield className="w-3.5 h-3.5 text-teal-600/40"/> <span>ISO 27001 Certified</span></span>
               <span className="flex items-center space-x-2"><Shield className="w-3.5 h-3.5 text-teal-600/40"/> <span>FCRA Compliant</span></span>
            </div>
          </div>
        </footer>
      </div>
  );
};

export default App;