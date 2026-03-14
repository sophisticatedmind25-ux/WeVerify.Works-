
import React, { useState, useRef } from 'react';
import { Search, FileText, Loader2, AlertTriangle, CheckCircle, Info, ExternalLink, Shield, Briefcase, Home, Sparkles, Building2, MapPin, Globe } from 'lucide-react';
import { verifyTextClaim, verifyImageAuthenticity, verifyAddressIntegrity } from '../services/gemini';
import { VerificationResult, VerificationMode } from '../types';

const ForensicAudit: React.FC = () => {
  const [mode, setMode] = useState<VerificationMode>(VerificationMode.TEXT);
  const [input, setInput] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const logAction = (action: string, details: string, type: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS' = 'INFO') => {
    const userEmail = localStorage.getItem('wv_user_email') || 'User';
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

  React.useEffect(() => {
    logAction('Forensic Audit Access', `User accessed Forensic Audit tool`, 'INFO');
  }, []);

  const handleVerifyText = async () => {
    if (!input.trim()) return;
    setIsVerifying(true);
    setError(null);
    logAction('Text Verification', `User initiated forensic text verification`, 'INFO');
    try {
      let data;
      if (input.toLowerCase().includes('residence') || input.toLowerCase().includes('address')) {
        // Use Maps Grounding for address-heavy queries
        const coords = await new Promise<{lat: number, lng: number} | null>((res) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => res({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
            () => res(null)
          );
        });
        data = await verifyAddressIntegrity(input, coords ? { latitude: coords.lat, longitude: coords.lng } : undefined);
      } else {
        data = await verifyTextClaim(input);
      }
      setResult(data);
    } catch (err) {
      setError("Verification failed. Please ensure the information is clear and try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = (reader.result as string).split(',')[1];
      setIsVerifying(true);
      setError(null);
      logAction('Image Verification', `User uploaded image for forensic analysis`, 'INFO');
      try {
        const data = await verifyImageAuthenticity(base64);
        setResult(data);
      } catch (err) {
        setError("Document analysis failed. Please provide a high-resolution scan.");
      } finally {
        setIsVerifying(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const sendToOsTicket = async () => {
    if (!result) return;
    logAction('Send to osTicket', `User sent forensic audit result to osTicket`, 'INFO');
    try {
      const response = await fetch('/api/osticket/create-ticket', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          applicantName: 'Verification Audit', // Generic name since dashboard doesn't have applicant name input
          applicantEmail: 'audit@weverify.works',
          subject: `Verification Audit Result: ${result.verdict} (Score: ${result.score})`,
          message: `
            <h1>Verification Audit Result</h1>
            <p><strong>Verdict:</strong> ${result.verdict}</p>
            <p><strong>Score:</strong> ${result.score}%</p>
            <p><strong>Analysis:</strong><br/>${result.analysis}</p>
            <p><strong>Sources:</strong><br/>${result.sources.map(s => `<a href="${s.uri}">${s.title}</a>`).join('<br/>')}</p>
          `,
          ip: '127.0.0.1'
        }),
      });

      if (response.ok) {
        alert('Audit result sent to osTicket successfully!');
      } else {
        const errData = await response.json();
        alert(`Failed to send to osTicket: ${errData.details || errData.error || 'Check configuration.'}`);
      }
    } catch (error) {
      console.error('Error sending to osTicket:', error);
      alert('Error sending to osTicket.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200">
          <div className="bg-slate-900 p-10 text-white relative">
            <div className="relative z-10">
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-teal-500 p-2 rounded-lg">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <span className="text-xs font-black uppercase tracking-[0.3em] text-teal-400">WV-Audit Portal v4.0</span>
              </div>
              <h1 className="text-4xl font-black mb-2 tracking-tight">Enterprise Infrastructure Audit</h1>
              <p className="text-slate-400 font-medium">Global grounding for Employment, Residence, and Identity verification.</p>
            </div>
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <Globe className="w-48 h-48" />
            </div>
          </div>

          <div className="p-10">
            {/* Mode Switcher */}
            <div className="flex space-x-1 p-1 bg-slate-100 rounded-2xl mb-10">
              <button 
                onClick={() => { setMode(VerificationMode.TEXT); setResult(null); }}
                className={`flex-1 py-4 rounded-xl font-bold transition-all flex items-center justify-center space-x-2 ${mode === VerificationMode.TEXT ? 'bg-white shadow-xl text-teal-600' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <Search className="w-5 h-5" />
                <span>Registry Check</span>
              </button>
              <button 
                onClick={() => { setMode(VerificationMode.IMAGE); setResult(null); }}
                className={`flex-1 py-4 rounded-xl font-bold transition-all flex items-center justify-center space-x-2 ${mode === VerificationMode.IMAGE ? 'bg-white shadow-xl text-teal-600' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <FileText className="w-5 h-5" />
                <span>Forensic Audit</span>
              </button>
            </div>

            {/* Input Area */}
            {mode === VerificationMode.TEXT ? (
              <div className="space-y-6">
                <div className="flex flex-wrap gap-3">
                   <button 
                     onClick={() => setInput("Verify Employment: David Kim worked at Apex Solutions as Lead Designer, 2019-2023.")}
                     className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-full text-xs font-bold text-slate-600 hover:bg-teal-50 hover:border-teal-200 transition-all flex items-center space-x-2"
                   >
                     <Briefcase className="w-4 h-4" /> <span>Employment Template</span>
                   </button>
                   <button 
                     onClick={() => setInput("Verify Residence: 1000 Broadway, San Francisco, CA. Audit for residential occupancy status.")}
                     className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-full text-xs font-bold text-slate-600 hover:bg-teal-50 hover:border-teal-200 transition-all flex items-center space-x-2"
                   >
                     <MapPin className="w-4 h-4" /> <span>Geospatial Audit</span>
                   </button>
                </div>

                <div className="relative group">
                  <textarea 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Enter claim details for global grounding..."
                    className="w-full h-40 p-6 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 transition-all outline-none resize-none font-medium text-lg"
                  />
                  <div className="absolute bottom-4 right-4 flex items-center space-x-2 opacity-40 group-focus-within:opacity-100 transition-opacity">
                    <Globe className="w-4 h-4 text-teal-600" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Neural Search Active</span>
                  </div>
                </div>

                <div className="flex items-start space-x-2 px-2">
                   <Shield className="w-3 h-3 text-slate-400 mt-0.5" />
                   <p className="text-[10px] text-slate-400 font-medium leading-tight">
                     <strong>Compliance Notice:</strong> Searches performed here are for permissible purpose validation only. 
                     Results must be verified by a human auditor before being used for employment or credit decisions (FCRA § 604).
                   </p>
                </div>

                <button 
                  onClick={handleVerifyText}
                  disabled={isVerifying || !input.trim()}
                  className="w-full py-5 bg-teal-600 text-white rounded-2xl font-black text-xl hover:bg-teal-700 disabled:opacity-50 flex items-center justify-center space-x-3 transition-all shadow-2xl shadow-teal-200 active:scale-[0.98]"
                >
                  {isVerifying ? <Loader2 className="animate-spin" /> : <Sparkles className="w-6 h-6" />}
                  <span>{isVerifying ? 'Grounding Records...' : 'Verify Data Integrity'}</span>
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-4 border-dashed border-slate-200 rounded-[2.5rem] p-16 flex flex-col items-center justify-center cursor-pointer hover:border-teal-400 hover:bg-teal-50 transition-all group"
                >
                  <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
                  <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center mb-6 group-hover:bg-teal-100 transition-colors">
                    <FileText className="w-10 h-10 text-slate-400 group-hover:text-teal-600" />
                  </div>
                  <p className="text-xl font-black text-slate-800">Upload Audit Material</p>
                  <p className="text-slate-400 font-medium mt-2">Contracts, IDs, or Residency Deeds</p>
                </div>
              </div>
            )}

            {error && (
              <div className="mt-8 p-5 bg-red-50 border border-red-200 rounded-2xl text-red-700 flex items-start space-x-4">
                <AlertTriangle className="w-6 h-6 flex-shrink-0" />
                <p className="font-bold">{error}</p>
              </div>
            )}

            {result && (
              <div className="mt-12 space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="border-t border-slate-200 pt-12">
                  <div className="flex items-center justify-center space-x-4 mb-8">
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">Audit Result</h2>
                    <span className="text-[10px] text-slate-400 font-black bg-slate-100 px-4 py-2 rounded-full border border-slate-200 uppercase tracking-widest">WV-REGISTRY-HASH-{result.timestamp.slice(0, 4)}</span>
                    <button 
                      onClick={sendToOsTicket}
                      className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-full hover:bg-slate-700 transition-colors flex items-center space-x-2"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Send to osTicket</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
                    <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 flex flex-col items-center justify-center text-center">
                      <p className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Integrity Score</p>
                      <div className="flex items-baseline space-x-1">
                        <span className={`text-6xl font-black ${result.score > 80 ? 'text-teal-600' : result.score > 50 ? 'text-amber-500' : 'text-red-500'}`}>
                          {result.score}
                        </span>
                        <span className="text-slate-300 text-xl font-bold">%</span>
                      </div>
                    </div>
                    <div className="bg-slate-50 p-8 rounded-3xl col-span-2 border border-slate-100">
                      <p className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Verification Verdict</p>
                      <div className="flex items-center space-x-4">
                        {result.verdict === 'AUTHENTIC' ? (
                          <div className="bg-teal-100 p-4 rounded-2xl text-teal-600"><CheckCircle className="w-10 h-10" /></div>
                        ) : result.verdict === 'SUSPICIOUS' ? (
                          <div className="bg-amber-100 p-4 rounded-2xl text-amber-600"><Info className="w-10 h-10" /></div>
                        ) : (
                          <div className="bg-red-100 p-4 rounded-2xl text-red-600"><AlertTriangle className="w-10 h-10" /></div>
                        )}
                        <div>
                          <span className={`text-4xl font-black block leading-none ${result.verdict === 'AUTHENTIC' ? 'text-teal-600' : result.verdict === 'SUSPICIOUS' ? 'text-amber-500' : 'text-red-500'}`}>
                            {result.verdict}
                          </span>
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Grounding Confirmed</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-900 rounded-[2rem] p-10 text-white relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 right-0 p-10 opacity-5">
                      <Shield className="w-48 h-48" />
                    </div>
                    <h3 className="text-xl font-black mb-6 flex items-center space-x-3">
                      <div className="w-8 h-8 bg-teal-500/20 rounded-lg flex items-center justify-center">
                        <Info className="w-5 h-5 text-teal-400" />
                      </div>
                      <span>Auditor's Report</span>
                    </h3>
                    <div className="text-slate-300 leading-relaxed whitespace-pre-wrap font-medium text-lg">
                      {result.analysis}
                    </div>
                  </div>

                  {result.sources.length > 0 && (
                    <div className="mt-12">
                      <h3 className="text-xl font-black text-slate-900 mb-6 tracking-tight uppercase tracking-widest text-xs">Citations & Grounding Chunks</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {result.sources.map((source, i) => (
                          <a 
                            key={i} 
                            href={source.uri} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center justify-between p-5 bg-white border border-slate-200 rounded-2xl hover:border-teal-400 hover:shadow-xl hover:shadow-teal-100/50 transition-all group"
                          >
                            <div className="flex items-center space-x-3">
                               <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center group-hover:bg-teal-50">
                                 {source.uri.includes('google.com/maps') ? <MapPin className="w-5 h-5 text-teal-600" /> : <Globe className="w-5 h-5 text-teal-600" />}
                               </div>
                               <span className="font-bold text-slate-700 group-hover:text-teal-700">{source.title}</span>
                            </div>
                            <ExternalLink className="w-5 h-5 text-slate-300 group-hover:text-teal-600" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForensicAudit;
