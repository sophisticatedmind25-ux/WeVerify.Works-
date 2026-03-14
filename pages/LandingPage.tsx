import React, { useState, useEffect, useRef } from 'react';
import { Briefcase, Home, Zap, ArrowRight, CheckCircle, Globe, Activity, Database, Quote, Loader2, SearchCode, PiggyBank, SearchIcon, Volume2, HelpCircle, LogIn, ExternalLink, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import { generateImage, generateSpeech } from '../services/gemini';

const TESTIMONIAL_TEXT = "I have rental properties and needed to insure I was getting qualified tenants ... weverify.works made it so easy and I didn't have to do anything! there Fast Professional and I'd recommend them to anyone!";

const FALLBACK_SARAH = "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=600&h=600&auto=format&fit=crop";

const LandingPage: React.FC = () => {
  const [isAdminAuthenticated] = useState(localStorage.getItem('wv_admin_auth') === 'true');
  const [isUserAuthenticated] = useState(localStorage.getItem('wv_auth') === 'true');
  
  const [prospectEmail, setProspectEmail] = useState('');
  const [isSubmittingProspect, setIsSubmittingProspect] = useState(false);
  const [prospectSuccess, setProspectSuccess] = useState(false);
  const [prospectToken, setProspectToken] = useState('');
  const [emailSentStatus, setEmailSentStatus] = useState<{sent: boolean, configured: boolean} | null>(null);

  const handleProspectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingProspect(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/prospects/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: prospectEmail })
      });
      const data = await response.json();
      if (data.success) {
        setProspectSuccess(true);
        setProspectToken(data.token);
        setEmailSentStatus({ sent: data.emailSent, configured: data.emailConfigured });
        
        // Add to Prospect Bank
        const prospects = JSON.parse(localStorage.getItem('wv_prospects') || '[]');
        const newProspect = {
          id: `PR-${Date.now()}`,
          email: prospectEmail,
          status: 'Follow Up',
          createdAt: new Date().toISOString(),
          token: data.token,
          logs: [
            {
              timestamp: new Date().toLocaleString(),
              action: 'Prospect Submitted',
              details: `Requested free trial token. Token generated: ${data.token}`
            }
          ]
        };
        localStorage.setItem('wv_prospects', JSON.stringify([newProspect, ...prospects]));
      } else {
        alert('Something went wrong. Please try again.');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to submit. Please try again.');
    } finally {
      setIsSubmittingProspect(false);
    }
  };

  return (
    <div className="bg-white overflow-hidden">
      {/* Hero Section */}
      <section className="relative pt-24 pb-40">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 opacity-20">
          <div className="absolute top-0 left-0 w-[800px] h-[800px] bg-teal-200 rounded-full blur-[150px] -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-[800px] h-[800px] bg-emerald-100 rounded-full blur-[150px] translate-x-1/2 translate-y-1/2"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center text-center">
            <div className="inline-flex items-center space-x-2 px-4 py-2 bg-slate-100 rounded-full border border-slate-200 mb-10 animate-pulse">
              <Activity className="w-4 h-4 text-teal-600" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600">Full Cycle Managed Verification</span>
            </div>

            <h1 className="text-6xl md:text-8xl font-black text-slate-900 mb-8 tracking-tighter leading-[0.9]">
              Hands-Free <br />
              <span className="gradient-text">Verified Trust.</span>
            </h1>
            
            <p className="text-2xl text-slate-500 max-w-3xl mx-auto mb-12 leading-relaxed font-medium">
              We handle <strong>Employment, Residence, Income & Assets</strong>. Complete end-to-end verification management for the modern enterprise.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              {isUserAuthenticated ? (
                <Link 
                  to="/dashboard" 
                  className="w-full sm:w-auto px-16 py-8 bg-slate-900 text-white rounded-[2.5rem] font-black text-2xl hover:bg-slate-800 transition-all shadow-2xl shadow-slate-200 hover:scale-105 active:scale-95 flex items-center justify-center space-x-4"
                >
                  <span>My Dashboard</span>
                  <ArrowRight className="w-8 h-8 text-teal-400" />
                </Link>
              ) : (
                <>
                  <Link 
                    to="/register" 
                    className="w-full sm:w-auto px-16 py-8 bg-slate-900 text-white rounded-[2.5rem] font-black text-2xl hover:bg-slate-800 transition-all shadow-2xl shadow-slate-200 hover:scale-105 active:scale-95 flex items-center justify-center space-x-4"
                  >
                    <span>Get Started</span>
                    <ArrowRight className="w-8 h-8 text-teal-400" />
                  </Link>
                  <Link 
                    to="/login" 
                    className="w-full sm:w-auto px-16 py-8 bg-white text-slate-900 border-2 border-slate-200 rounded-[2.5rem] font-black text-2xl hover:bg-slate-50 transition-all shadow-xl shadow-slate-200 hover:scale-105 active:scale-95 flex items-center justify-center space-x-4"
                  >
                    <span>Login</span>
                    <LogIn className="w-8 h-8 text-teal-600" />
                  </Link>
                </>
              )}
            </div>

            <p className="mt-12 text-slate-400 font-bold uppercase tracking-widest text-[10px]">Trusted by thousands of landlords, HR managers, and legal teams.</p>
          </div>
        </div>
      </section>

      {/* Service intelligence */}
      <section className="py-32 bg-white relative border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-20 text-center">
            <h2 className="text-xs font-black text-teal-600 uppercase tracking-[0.4em] mb-4">Service Intelligence</h2>
            <h3 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">Our Core Verification Services</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <ServiceCard 
              icon={<Briefcase className="w-12 h-12 text-teal-600" />}
              title="Employment & Income"
              description="Direct employer contact for tenure, salary, and job performance. SOC2 managed."
              features={["Direct HR Client Contact", "Salary Authentication", "Eligibility Audits"]}
            />
            <ServiceCard 
              icon={<Home className="w-12 h-12 text-emerald-600" />}
              title="Residential Stability"
              description="Confirm occupancy and lease terms with landlords and property managers globally."
              features={["Landlord Correspondence", "Occupancy Checks", "Geospatial Data Checks"]}
            />
            <ServiceCard 
              icon={<PiggyBank className="w-12 h-12 text-blue-600" />}
              title="Income & Asset"
              description="Full verification of non-employment income, bank assets, and investment portfolios."
              features={["Asset Authentication", "Portfolio Research", "Financial Grounding"]}
            />
            <ServiceCard 
              icon={<SearchIcon className="w-12 h-12 text-purple-600" />}
              title="General Information"
              description="Custom research and verification of specialized datasets and claims."
              features={["Bespoke Research", "Global Data Retrieval", "Verification Registry"]}
            />
          </div>
        </div>
      </section>

      {/* Free Trial Section */}
      <section className="py-20 bg-teal-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        </div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center space-x-2 px-4 py-2 bg-teal-800/50 rounded-full border border-teal-700/50 mb-8 backdrop-blur-sm">
             <Zap className="w-4 h-4 text-teal-300" />
             <span className="text-[10px] font-black uppercase tracking-[0.2em] text-teal-100">Limited Time Offer</span>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-black text-white mb-6 tracking-tight">Experience WeVerify for Free.</h2>
          <p className="text-xl text-teal-100 mb-10 max-w-2xl mx-auto">
            Enter your email to receive an instant <span className="text-white font-bold">Free Trial Token</span>. No credit card required. Valid for one full verification.
          </p>

          {!prospectSuccess ? (
            <form onSubmit={handleProspectSubmit} className="max-w-md mx-auto relative">
              <div className="relative flex items-center">
                <div className="absolute left-4 z-10">
                  <Mail className="w-5 h-5 text-slate-400" />
                </div>
                <input 
                  type="email" 
                  value={prospectEmail}
                  onChange={(e) => setProspectEmail(e.target.value)}
                  placeholder="Enter your work email" 
                  className="w-full pl-12 pr-32 py-4 bg-white rounded-full text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-teal-500/50 font-medium shadow-xl"
                  required
                />
                <button 
                  type="submit" 
                  disabled={isSubmittingProspect}
                  className="absolute right-2 top-2 bottom-2 px-6 bg-slate-900 text-white rounded-full font-bold text-sm hover:bg-slate-800 transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center min-w-[100px]"
                >
                  {isSubmittingProspect ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Get Token'}
                </button>
              </div>
              <p className="mt-4 text-xs text-teal-200/60">By submitting, you agree to our Terms of Service and Privacy Policy.</p>
            </form>
          ) : (
            <div className="bg-white/10 backdrop-blur-md border border-white/20 p-8 rounded-3xl animate-in zoom-in duration-300 max-w-lg mx-auto">
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-teal-500 rounded-full flex items-center justify-center mb-4 shadow-lg shadow-teal-500/30">
                  <CheckCircle className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-black text-white mb-2">Token Generated!</h3>
                {emailSentStatus?.sent ? (
                   <p className="text-teal-100 mb-6">We've sent the token to <span className="font-bold text-white">{prospectEmail}</span>. Check your inbox!</p>
                ) : emailSentStatus?.configured ? (
                   <p className="text-red-300 mb-6">We generated your token, but couldn't send the email. Please copy it below.</p>
                ) : (
                   <p className="text-teal-100 mb-6">Here is your free trial token. Please copy it below.</p>
                )}
                
                {prospectToken && (
                  <div className="bg-slate-900/80 px-6 py-4 rounded-xl border border-white/10 mb-6 w-full">
                    <p className="text-xs text-slate-400 uppercase tracking-widest mb-2">Your Token Code</p>
                    <p className="font-mono text-xl text-teal-300 font-bold tracking-wider select-all break-all">{prospectToken}</p>
                  </div>
                )}

                <Link to="/register" className="px-8 py-3 bg-white text-teal-900 rounded-full font-bold hover:bg-teal-50 transition-colors shadow-lg">
                  Create Account to Redeem
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Managed Process Section */}
      <section className="py-32 bg-slate-900 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 opacity-10 pointer-events-none">
          <Globe className="w-[600px] h-[600px] translate-x-1/4 -translate-y-1/4" />
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="mb-24 text-center">
            <h2 className="text-xs font-black text-teal-400 uppercase tracking-[0.4em] mb-4">How We Work</h2>
            <h3 className="text-4xl md:text-6xl font-black tracking-tighter">The End-to-End Lifecycle</h3>
            <p className="text-slate-400 mt-6 text-xl max-w-2xl mx-auto">We don't just give you a tool. We manage the entire verification process for your organization.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
             <ProcessStep 
               icon={<SearchCode className="w-10 h-10 text-teal-400" />}
               number="01"
               title="Entity Research"
               desc="Our AI and compliance teams research the business or entity, identifying the exact authorized contact nodes."
             />
             <div className="bg-white/5 border border-white/10 p-8 rounded-[2rem] hover:bg-white/10 transition-all group relative">
                <div className="flex justify-between items-start mb-6">
                   <div className="p-3 bg-teal-500/10 rounded-xl"><Database className="w-10 h-10 text-teal-400" /></div>
                   <span className="font-mono text-teal-500 font-bold text-lg">02</span>
                </div>
                <h4 className="text-xl font-black mb-4">Managed Returns</h4>
                <p className="text-slate-400 text-sm leading-relaxed font-medium">All verification returns are processed via <span className="text-teal-400">verifications@weverify.works</span> ensuring data integrity.</p>
             </div>
             <ProcessStep 
               icon={<Zap className="w-10 h-10 text-teal-400" />}
               number="03"
               title="Managed Correspondence"
               desc="We handle all outbound dispatch and follow-up correspondence to ensure timely verification responses."
             />
             <ProcessStep 
               icon={<HelpCircle className="w-10 h-10 text-teal-400" />}
               number="04"
               title="Support & Registry Hub"
               desc="Access our official Helpdesk for return submissions, audit tracking, and specialized compliance support."
             />
          </div>
        </div>
      </section>

      {/* Testimonial Section */}
      <section className="py-32 bg-slate-50 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
              <div className="order-2 lg:order-1">
                 <div className="inline-flex items-center space-x-2 px-3 py-1 bg-teal-50 text-teal-700 rounded-full border border-teal-100 mb-8">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Client Success Story</span>
                 </div>
                 <h3 className="text-4xl md:text-6xl font-black text-slate-900 mb-8 tracking-tighter leading-tight">
                    Voice of the <br/> <span className="text-teal-600">Property Owner.</span>
                 </h3>

                 {/* Integrated Marketing Video */}
                 <div className="mb-12 relative aspect-video rounded-3xl overflow-hidden shadow-xl border-4 border-white bg-slate-900 group">
                    <video 
                      className="w-full h-full block"
                      controls
                      playsInline
                      preload="metadata"
                      poster="https://images.unsplash.com/photo-1560179707-f14e90ef3623?q=80&w=1280&h=720&auto=format&fit=crop"
                    >
                      <source src="https://www.ampcgfoundation.pro/training/WEVERIFY.mp4" type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                 </div>
                 <div className="relative">
                    <Quote className="absolute -top-10 -left-10 w-24 h-24 text-teal-500/10 -z-10" />
                    <p className="text-2xl md:text-3xl font-medium text-slate-600 leading-relaxed italic mb-10">
                       "{TESTIMONIAL_TEXT}"
                    </p>
                    <div className="flex items-center space-x-4">
                       <div>
                          <p className="text-xl font-black text-slate-900">Sarah J.</p>
                          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Multi-Unit Property Manager</p>
                       </div>
                    </div>
                 </div>
              </div>
              <div className="order-1 lg:order-2 flex justify-center">
                 <TestimonialImage />
              </div>
           </div>
        </div>
      </section>

      {/* Token Packages and Pricing Section */}
      <section className="py-32 bg-white relative border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-xs font-black text-teal-600 uppercase tracking-[0.4em] mb-4">Registry Credits</h2>
            <h3 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">Token Packages & Pricing</h3>
            <p className="text-slate-500 mt-6 text-xl max-w-2xl mx-auto font-medium">Transparent pricing for verification lifecycle management. No hidden fees.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Personal */}
            <div className="bg-slate-50 p-10 rounded-[2.5rem] border border-slate-200 shadow-xl flex flex-col hover:border-teal-500 transition-all">
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
                  <CheckCircle className="w-5 h-5 text-teal-500" />
                  <span>Single Subject Verifications</span>
                </li>
                <li className="flex items-center space-x-3 text-sm font-bold text-slate-700">
                  <CheckCircle className="w-5 h-5 text-teal-500" />
                  <span>Email Correspondence</span>
                </li>
                <li className="flex items-center space-x-3 text-sm font-bold text-slate-700">
                  <CheckCircle className="w-5 h-5 text-teal-500" />
                  <span>Registry Anchoring</span>
                </li>
              </ul>
              <Link 
                to={isUserAuthenticated ? "/dashboard" : "/register"}
                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black hover:bg-slate-800 transition-all flex items-center justify-center space-x-2"
              >
                <span>Get Started</span>
              </Link>
            </div>

            {/* Business Pro */}
            <div className="bg-slate-900 p-10 rounded-[2.5rem] border-4 border-teal-500 shadow-2xl flex flex-col relative overflow-hidden transform md:-translate-y-4">
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
                  <CheckCircle className="w-5 h-5 text-teal-400" />
                  <span>Priority Grounding</span>
                </li>
                <li className="flex items-center space-x-3 text-sm font-bold text-slate-300">
                  <CheckCircle className="w-5 h-5 text-teal-400" />
                  <span>Automated Follow-ups</span>
                </li>
                <li className="flex items-center space-x-3 text-sm font-bold text-slate-300">
                  <CheckCircle className="w-5 h-5 text-teal-400" />
                  <span>Advanced Forensic Verification</span>
                </li>
              </ul>
              <Link 
                to={isUserAuthenticated ? "/dashboard" : "/register"}
                className="w-full py-4 bg-teal-500 text-slate-900 rounded-2xl font-black hover:bg-teal-400 transition-all flex items-center justify-center space-x-2"
              >
                <span>Get Started</span>
              </Link>
            </div>

            {/* Business Premium */}
            <div className="bg-slate-50 p-10 rounded-[2.5rem] border border-slate-200 shadow-xl flex flex-col hover:border-teal-500 transition-all">
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
                  <CheckCircle className="w-5 h-5 text-teal-500" />
                  <span>White-label Returns</span>
                </li>
                <li className="flex items-center space-x-3 text-sm font-bold text-slate-700">
                  <CheckCircle className="w-5 h-5 text-teal-500" />
                  <span>Dedicated Client Account</span>
                </li>
                <li className="flex items-center space-x-3 text-sm font-bold text-slate-700">
                  <CheckCircle className="w-5 h-5 text-teal-500" />
                  <span>API Integration Access</span>
                </li>
              </ul>
              <Link 
                to={isUserAuthenticated ? "/dashboard" : "/register"}
                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black hover:bg-slate-800 transition-all flex items-center justify-center space-x-2"
              >
                <span>Get Started</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-32 text-center bg-teal-600 text-white">
        <div className="max-w-4xl mx-auto px-4">
           <h2 className="text-5xl md:text-7xl font-black mb-8 tracking-tighter">Delegate Your Verification.</h2>
           <p className="text-xl md:text-2xl font-bold mb-12 text-teal-50">Stop wasting time with paperwork. Let us manage the lifecycle for you.</p>
           <div className="flex flex-col sm:flex-row justify-center gap-6">
              {isUserAuthenticated ? (
                <Link to="/dashboard" className="px-16 py-8 bg-white text-teal-700 rounded-full font-black text-3xl hover:scale-105 transition-all shadow-2xl">My Dashboard</Link>
              ) : (
                <>
                  <Link to="/register" className="px-16 py-8 bg-white text-teal-700 rounded-full font-black text-3xl hover:scale-105 transition-all shadow-2xl">Get Started</Link>
                  <Link to="/login" className="px-16 py-8 bg-teal-800 text-white rounded-full font-black text-3xl hover:scale-105 transition-all shadow-2xl">Login</Link>
                </>
              )}
           </div>
        </div>
      </section>
    </div>
  );
};

const ProcessStep = ({ icon, number, title, desc }: { icon: any, number: string, title: string, desc: string }) => (
  <div className="bg-white/5 border border-white/10 p-8 rounded-[2rem] hover:bg-white/10 transition-all group">
    <div className="flex justify-between items-start mb-6">
       <div className="p-3 bg-teal-500/10 rounded-xl">{icon}</div>
       <span className="font-mono text-teal-500 font-bold text-lg">{number}</span>
    </div>
    <h4 className="text-xl font-black mb-4">{title}</h4>
    <p className="text-slate-400 text-sm leading-relaxed font-medium">{desc}</p>
  </div>
);

const TestimonialImage = () => {
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);

  useEffect(() => {
    // Using static images for decorative elements to save API quota
    setImgUrl(FALLBACK_SARAH);
    setLoading(false);
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
    <div className="relative group cursor-pointer" onClick={handleSpeak}>
       <div className={`absolute inset-0 bg-teal-500 rounded-[3.5rem] rotate-3 -z-10 transition-all ${isSpeaking ? 'opacity-30 scale-110 animate-pulse' : 'opacity-10 group-hover:rotate-6 group-hover:opacity-20'}`}></div>
       <div className="bg-slate-100 aspect-square rounded-[3.5rem] overflow-hidden shadow-2xl border-4 border-white flex items-center justify-center relative">
          {loading ? (
             <div className="flex flex-col items-center space-y-4">
                <Loader2 className="w-12 h-12 text-teal-500 animate-spin" />
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Generating Client Identity...</p>
             </div>
          ) : imgUrl ? (
             <>
               <img src={imgUrl} alt="Satisfied Client" className={`w-full h-full object-cover transition-all duration-700 ${isSpeaking ? 'scale-105' : 'grayscale-[0.2] group-hover:grayscale-0'}`} />
               <div className={`absolute inset-0 bg-teal-900/40 flex items-center justify-center transition-opacity duration-300 ${isSpeaking ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                  {isSpeaking ? (
                    <div className="flex space-x-1 items-end h-12">
                      <div className="w-2 bg-white rounded-full animate-[bounce_1s_infinite_0s]" style={{ height: '80%' }}></div>
                      <div className="w-2 bg-white rounded-full animate-[bounce_1s_infinite_0.1s]" style={{ height: '100%' }}></div>
                      <div className="w-2 bg-white rounded-full animate-[bounce_1s_infinite_0.2s]" style={{ height: '60%' }}></div>
                      <div className="w-2 bg-white rounded-full animate-[bounce_1s_infinite_0.3s]" style={{ height: '90%' }}></div>
                    </div>
                  ) : (
                    <div className="p-6 bg-white rounded-full shadow-2xl">
                       <Volume2 className="w-8 h-8 text-teal-600" />
                    </div>
                  )}
               </div>
             </>
          ) : (
             <div className="w-full h-full bg-slate-200"></div>
          )}
          
          <div className="absolute bottom-8 left-8 bg-white/80 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/50 shadow-xl">
             <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${isSpeaking ? 'bg-teal-500 animate-ping' : 'bg-teal-500'}`}></div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">
                  {isSpeaking ? 'Speaking Testimonial' : 'Click to Listen'}
                </span>
             </div>
          </div>
       </div>
    </div>
  );
};

const ServiceCard = ({ icon, title, description, features }: { icon: any, title: string, description: string, features: string[] }) => (
  <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 hover:border-teal-500 transition-all shadow-xl shadow-slate-200/50 group">
    <div className="mb-8 group-hover:scale-110 transition-transform duration-500">{icon}</div>
    <h4 className="text-2xl font-black text-slate-900 mb-4">{title}</h4>
    <p className="text-slate-500 font-medium mb-8 leading-relaxed h-20 overflow-hidden">{description}</p>
    <ul className="space-y-3">
      {features.map((f, i) => (
        <li key={i} className="flex items-center space-x-2 text-sm font-bold text-slate-700">
          <CheckCircle className="w-4 h-4 text-teal-600" />
          <span>{f}</span>
        </li>
      ))}
    </ul>
  </div>
);

export default LandingPage;
