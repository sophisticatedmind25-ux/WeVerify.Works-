import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plane, LogIn, Building2, ShieldCheck, Database, UserPlus, Quote, Volume2, Loader2, HelpCircle, Mail, LayoutDashboard } from 'lucide-react';
import { generateImage, generateSpeech } from '../services/gemini';

const MAIN_LOGO_URL = "https://www.ampcgfoundation.pro/img/wvw2AD.GIF";
const TESTIMONIAL_TEXT = "I have rental properties and needed to insure I was getting qualified tenants ... weverify.works made it so easy and I didn't have to do anything! there Fast Professional and I'd recommend them to anyone!";

const FALLBACK_BG = "https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=1200&auto=format&fit=crop";
const FALLBACK_PORTRAIT = "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=400&h=400&auto=format&fit=crop";

const IntroPage: React.FC = () => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const [bgImageUrl, setBgImageUrl] = useState<string>(FALLBACK_BG);
  const [testimonialImgUrl, setTestimonialImgUrl] = useState<string>(FALLBACK_PORTRAIT);
  const [activeVertical, setActiveVertical] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(localStorage.getItem('wv_admin_auth') === 'true');
  const [isUserAuthenticated, setIsUserAuthenticated] = useState(localStorage.getItem('wv_auth') === 'true');
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);

  const verticals = [
    "Employment & Income",
    "Residence & Stability",
    "Income & Asset",
    "General Information"
  ];

  useEffect(() => {
    setIsVisible(true);
    
    const handleAuthChange = () => {
      setIsAdminAuthenticated(localStorage.getItem('wv_admin_auth') === 'true');
      setIsUserAuthenticated(localStorage.getItem('wv_auth') === 'true');
    };
    window.addEventListener('storage', handleAuthChange);

    // Using static images for decorative elements to save API quota
    setBgImageUrl(FALLBACK_BG);
    setTestimonialImgUrl(FALLBACK_PORTRAIT);

    const interval = setInterval(() => {
      setActiveVertical(prev => (prev + 1) % verticals.length);
    }, 4000);
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleAuthChange);
    };
  }, []);

  const handleSpeak = async () => {
    if (isSpeaking) {
      if (sourceRef.current) sourceRef.current.stop();
      setIsSpeaking(false);
      return;
    }

    setIsSpeaking(true);
    const audioBuffer = await generateSpeech(TESTIMONIAL_TEXT);
    
    if (audioBuffer) {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);
      source.onended = () => setIsSpeaking(false);
      source.start();
      sourceRef.current = source;
    } else {
      setIsSpeaking(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center relative overflow-hidden text-slate-900 selection:bg-teal-500/20">
      {/* Background Layer */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-white/60 via-slate-50/90 to-slate-50"></div>
        {bgImageUrl && (
          <div className="absolute inset-0 opacity-15 mix-blend-multiply transition-opacity duration-1000">
            <img src={bgImageUrl} alt="" className="w-full h-full object-cover scale-105" />
          </div>
        )}
        <div className="absolute inset-0 opacity-[0.1]" style={{ backgroundImage: 'radial-gradient(circle, #cbd5e1 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
        <ShieldCheck className="w-16 h-16 text-teal-600/10 absolute animate-global-flight pointer-events-none" style={{ top: '15%', left: '-10%', animationDelay: '0s' }} />
        <Database className="w-12 h-12 text-teal-600/5 absolute animate-global-flight pointer-events-none" style={{ top: '65%', left: '-10%', animationDelay: '18s', animationDirection: 'reverse' }} />
        <Building2 className="w-20 h-20 text-teal-600/5 absolute animate-global-flight pointer-events-none" style={{ top: '40%', left: '-10%', animationDelay: '7s' }} />
      </div>

      <div className={`relative z-10 w-full max-w-7xl px-8 flex flex-col items-center transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        
        {/* Secondary Navigation Bar */}
        <div className="w-full bg-white/40 backdrop-blur-md border border-slate-200 rounded-2xl py-6 px-10 mb-16 flex flex-wrap justify-center gap-x-12 gap-y-4 animate-reveal shadow-xl shadow-slate-200/50" style={{ animationDelay: '0.1s' }}>
          <Link to="/" className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400 hover:text-teal-600 transition-all flex items-center space-x-2 group">
            <div className="w-1.5 h-1.5 rounded-full bg-teal-500/20 group-hover:bg-teal-500 transition-colors"></div>
            <span>WeVerify</span>
          </Link>
          <Link to="/home" className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400 hover:text-teal-600 transition-all flex items-center space-x-2 group">
            <div className="w-1.5 h-1.5 rounded-full bg-teal-500/20 group-hover:bg-teal-500 transition-colors"></div>
            <span>Services</span>
          </Link>
          {isUserAuthenticated && (
            <Link to="/queue" className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400 hover:text-teal-600 transition-all flex items-center space-x-2 group">
              <div className="w-1.5 h-1.5 rounded-full bg-teal-500/20 group-hover:bg-teal-500 transition-colors"></div>
              <span>My Registry</span>
            </Link>
          )}
          <Link to="/helpdesk" className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400 hover:text-teal-600 transition-all flex items-center space-x-2 group">
            <div className="w-1.5 h-1.5 rounded-full bg-teal-500/20 group-hover:bg-teal-500 transition-colors"></div>
            <span>Helpdesk</span>
          </Link>
          {!isAdminAuthenticated && !isUserAuthenticated && (
            <Link to="/admin/login" className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400 hover:text-red-600 transition-all flex items-center space-x-2 group">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500/20 group-hover:bg-red-500 transition-colors"></div>
              <span>Admin</span>
            </Link>
          )}
          {isAdminAuthenticated && (
            <Link to="/admin/dashboard" className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400 hover:text-red-600 transition-all flex items-center space-x-2 group">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500/20 group-hover:bg-red-500 transition-colors"></div>
              <span>Team CMS</span>
            </Link>
          )}
        </div>

        {/* Main Content Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center w-full">
          
          {/* Left Column: Main Headline & Branding */}
          <div className="lg:col-span-7 flex flex-col items-start text-left">
            {/* Logo Box */}
            <div className="mb-12 relative group animate-reveal self-start" style={{ animationDelay: '0.2s' }}>
              <div className="w-[320px] h-[140px] md:w-[540px] md:h-[180px] border border-slate-200 rounded-2xl flex items-center justify-center relative overflow-hidden bg-white/80 backdrop-blur-xl shadow-xl transition-all group-hover:border-teal-500/20 group-hover:scale-[1.01]">
                <img src={MAIN_LOGO_URL} alt="WeVerify" className="w-full h-full object-contain p-4 flicker mix-blend-multiply" />
                <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-slate-300 rounded-tl-sm"></div>
                <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-slate-300 rounded-br-sm"></div>
              </div>
            </div>

            <div className="mb-12 relative w-full">
              <h1 className="text-4xl md:text-6xl font-extrabold tracking-tighter leading-tight text-slate-900 mb-0 italic">
                <span className="block min-h-[1.2em] transition-all duration-500 animate-reveal text-slate-800" style={{ animationDelay: '0.4s' }}>
                  {verticals[activeVertical]}
                </span>
                <span className="block text-slate-900 animate-reveal font-black" style={{ animationDelay: '0.6s' }}>Verification Process</span>
              </h1>
              
              {/* Centered "on auto pilot" container */}
              <div className="mt-8 relative w-full text-center group animate-reveal" style={{ animationDelay: '0.8s' }}>
                <span className="text-2xl md:text-3xl lg:text-4xl text-teal-400 font-black italic tracking-tighter leading-[0.9] block">
                  on auto pilot.
                </span>
                
                {/* Animated Underline with Airplane Glider */}
                <div className="mt-4 h-[6px] bg-slate-200 rounded-full relative overflow-visible w-full">
                   <div className="absolute inset-0 bg-teal-400 animate-draw shadow-[0_0_25px_rgba(45,212,191,0.4)]" style={{ animationDelay: '1.2s' }}></div>
                   
                   <div className="vapor-trail" style={{ animationDelay: '1.4s' }}></div>
                   <div className="flight-glider-icon flex items-center justify-center" style={{ animationDelay: '1.4s' }}>
                      <Plane className="w-12 h-12 text-teal-500 rotate-90 fill-teal-500" />
                   </div>
                </div>
              </div>
            </div>

            {/* CTAs aligned to left for balance */}
            <div className="flex flex-col sm:flex-row items-center gap-6 w-full max-w-lg animate-reveal" style={{ animationDelay: '1.8s' }}>
              {isAdminAuthenticated ? (
                <Link 
                  to="/admin/dashboard" 
                  className="group relative w-full sm:w-auto px-10 py-6 bg-slate-900 text-white rounded-2xl shadow-2xl flex items-center justify-center hover:scale-[1.03] active:scale-95 transition-all"
                >
                  <span className="mr-4 hud-mono text-2xl font-bold uppercase tracking-wider">Team CMS</span>
                  <LayoutDashboard className="w-6 h-6 text-teal-400" />
                </Link>
              ) : isUserAuthenticated ? (
                <Link 
                  to="/dashboard" 
                  className="group relative w-full sm:w-auto px-10 py-6 bg-slate-900 text-white rounded-2xl shadow-2xl flex items-center justify-center hover:scale-[1.03] active:scale-95 transition-all"
                >
                  <span className="mr-4 hud-mono text-2xl font-bold uppercase tracking-wider">My Dashboard</span>
                  <LayoutDashboard className="w-6 h-6 text-teal-400" />
                </Link>
              ) : (
                <>
                  <Link 
                    to="/register" 
                    className="group relative w-full sm:w-auto px-10 py-6 bg-slate-900 text-white rounded-2xl shadow-2xl flex items-center justify-center hover:scale-[1.03] active:scale-95 transition-all"
                  >
                    <span className="mr-4 hud-mono text-2xl font-bold uppercase tracking-wider">Get Started</span>
                    <UserPlus className="w-6 h-6 text-teal-400" />
                  </Link>
                  <Link 
                    to="/login" 
                    className="group relative w-full sm:w-auto px-10 py-6 bg-white text-slate-900 border-2 border-slate-200 rounded-2xl shadow-xl flex items-center justify-center hover:scale-[1.03] active:scale-95 transition-all"
                  >
                    <span className="mr-4 hud-mono text-2xl font-bold uppercase tracking-wider">Login</span>
                    <LogIn className="w-6 h-6 text-teal-600" />
                  </Link>
                </>
              )}
              
              <div className="flex items-center space-x-10">
                {!isAdminAuthenticated && !isUserAuthenticated && (
                  <Link to="/admin/login" className="text-slate-400 hover:text-red-600 font-bold text-xs tracking-[0.2em] uppercase transition-all hud-mono flex items-center space-x-2">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Admin</span>
                  </Link>
                )}
                <Link to="/helpdesk" className="text-slate-400 hover:text-slate-900 font-bold text-sm tracking-[0.2em] uppercase transition-all hud-mono flex items-center space-x-2">
                  <HelpCircle className="w-4 h-4" />
                  <span>Helpdesk</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Right Column: Client Testimonial Area */}
          <div className="lg:col-span-5 flex flex-col items-center lg:items-end animate-reveal" style={{ animationDelay: '1s' }}>
            {/* Marketing Video */}
            <div className="w-full max-w-md mb-8 aspect-video rounded-3xl overflow-hidden shadow-2xl border-4 border-white bg-slate-900">
              <video 
                className="w-full h-full block"
                controls
                playsInline
                preload="metadata"
              >
                <source src="https://www.ampcgfoundation.pro/training/WEVERIFY.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>

            <div 
              onClick={handleSpeak}
              className={`relative p-10 bg-white/40 backdrop-blur-xl rounded-[2.5rem] border-2 border-dashed border-teal-500/30 max-w-md cursor-pointer transition-all hover:scale-[1.02] group shadow-2xl ${isSpeaking ? 'border-teal-400/60 ring-4 ring-teal-400/10' : ''}`}
            >
              <Quote className="absolute -top-6 -left-6 w-14 h-14 text-teal-500/20" />
              <p className="text-xl md:text-2xl font-medium text-slate-600 leading-relaxed italic mb-8 relative z-10">
                "{TESTIMONIAL_TEXT}"
              </p>
              
              <div className="flex items-center space-x-4 border-t border-slate-200 pt-6">
                <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-teal-500/20 bg-slate-100 flex items-center justify-center flex-shrink-0 shadow-inner">
                  {testimonialImgUrl ? (
                    <img src={testimonialImgUrl} alt="Sarah J." className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex items-center justify-center w-full h-full">
                       <Loader2 className="w-6 h-6 text-teal-300 animate-spin" />
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-lg font-black text-slate-900 leading-none">Sarah J.</p>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Property Manager</p>
                </div>
              </div>

              {/* Audio visualizer */}
              {isSpeaking && (
                <div className="absolute top-6 right-6 flex items-end space-x-1 h-6">
                  <div className="w-1.5 bg-teal-500 rounded-full animate-bounce h-full"></div>
                  <div className="w-1.5 bg-teal-500 rounded-full animate-bounce h-3/4 delay-75"></div>
                  <div className="w-1.5 bg-teal-500 rounded-full animate-bounce h-1/2 delay-150"></div>
                </div>
              )}
              
              {/* Voice Trigger (Microphone replacement) */}
              <div className={`absolute -bottom-6 -right-6 w-14 h-14 rounded-full flex items-center justify-center transition-all ${isSpeaking ? 'bg-teal-500 text-white scale-110' : 'bg-slate-900 text-teal-400 hover:bg-teal-500 hover:text-white'}`}>
                {isSpeaking ? <Loader2 className="w-7 h-7 animate-spin" /> : <Volume2 className="w-7 h-7" />}
              </div>
            </div>
            
            <p className="mt-12 text-right text-teal-950 font-black uppercase tracking-tight text-lg max-w-[450px]">
              For(Verification returns <Link to="/helpdesk" className="text-teal-600 underline">Click Here</Link>)
            </p>
          </div>

        </div>
      </div>
      
      {/* Corner HUD Data */}
      <div className="fixed bottom-10 left-10 hidden lg:block opacity-40 hud-mono text-[11px] text-teal-700 animate-reveal" style={{ animationDelay: '2s' }}>
        <p>AUDIT_NODES: ACTIVE</p>
        <p>CRYPTO_SIGN: SECURE</p>
        <p>GEO_LOC: ENCRYPTED</p>
      </div>

      <div className="fixed bottom-10 right-10 hidden lg:block opacity-40 hud-mono text-[11px] text-teal-700 animate-reveal text-right" style={{ animationDelay: '2.2s' }}>
        <p>TRUST_SCORE: 99.9%</p>
        <p>ISO_STND: 27001</p>
        <p>COMP_SYNC: STABLE</p>
      </div>
    </div>
  );
};

export default IntroPage;