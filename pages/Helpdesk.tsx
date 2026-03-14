
import React, { useState } from 'react';
import { 
  HelpCircle, 
  Upload, 
  Search, 
  FileText, 
  CheckCircle2, 
  ArrowRight, 
  Loader2, 
  ShieldCheck, 
  Mail, 
  MessageSquare,
  Clock,
  AlertCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';

const LOGO_URL = "https://www.ampcgfoundation.pro/img/weverifyworkslogo.jpg";

const Helpdesk: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'return' | 'status'>('return');
  const [referenceId, setReferenceId] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  
  const [returnForm, setReturnForm] = useState({
    refId: '',
    respondentName: '',
    respondentEmail: '',
    notes: '',
    // Type-specific data
    position: '',
    salary: '',
    hireDate: '',
    rentAmount: '',
    leaseDates: '',
    assetBalance: ''
  });

  const [refType, setRefType] = useState<string | null>(null);

  const logAction = (action: string, details: string, type: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS' = 'INFO') => {
    const userEmail = localStorage.getItem('wv_user_email') || 'Guest';
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
    logAction('Helpdesk Access', `User accessed Helpdesk portal`, 'INFO');
  }, []);

  const handleRefIdBlur = () => {
    if (!returnForm.refId) return;
    const queue = JSON.parse(localStorage.getItem('wv_queue') || '[]');
    const item = queue.find((i: any) => i.id.toLowerCase() === returnForm.refId.toLowerCase());
    if (item) {
      setRefType(item.type);
    } else {
      setRefType(null);
    }
  };

  const handleStatusSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!referenceId) return;
    
    setIsSearching(true);
    setSearchResult(null);
    logAction('Status Search', `User searched for verification status with ID: ${referenceId}`, 'INFO');
    
    // Simulate lookup in localStorage (wv_queue)
    setTimeout(() => {
      const queue = JSON.parse(localStorage.getItem('wv_queue') || '[]');
      const item = queue.find((i: any) => i.id.toLowerCase() === referenceId.toLowerCase());
      
      if (item) {
        setSearchResult(item);
      } else {
        setSearchResult({ error: 'Reference ID not found in our active registry.' });
      }
      setIsSearching(false);
    }, 1200);
  };

  const handleReturnSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    logAction('Return Submit', `User submitted a return response for ID: ${returnForm.refId}`, 'SUCCESS');
    
    // Simulate submission and "Email Sorting" integration
    setTimeout(() => {
      // Add to a simulated "Inbox" in localStorage for Admin
      const inbox = JSON.parse(localStorage.getItem('wv_inbox') || '[]');
      const newEntry = {
        id: `INB-${Date.now().toString().slice(-6)}`,
        refId: returnForm.refId,
        sender: returnForm.respondentName,
        email: returnForm.respondentEmail,
        receivedAt: new Date().toLocaleString(),
        status: 'UNREAD',
        type: 'WEB_RETURN',
        content: returnForm.notes,
        details: {
          position: returnForm.position,
          salary: returnForm.salary,
          hireDate: returnForm.hireDate,
          rentAmount: returnForm.rentAmount,
          leaseDates: returnForm.leaseDates,
          assetBalance: returnForm.assetBalance
        }
      };
      localStorage.setItem('wv_inbox', JSON.stringify([newEntry, ...inbox]));
      
      // Update the queue item if found
      const queue = JSON.parse(localStorage.getItem('wv_queue') || '[]');
      const updatedQueue = queue.map((item: any) => {
        if (item.id.toLowerCase() === returnForm.refId.toLowerCase()) {
          return {
            ...item,
            status: 'IN_REVIEW',
            statusDetails: `Return received via Helpdesk from ${returnForm.respondentName}. Awaiting verification validation.`
          };
        }
        return item;
      });
      localStorage.setItem('wv_queue', JSON.stringify(updatedQueue));

      setIsSubmitting(false);
      setSubmitSuccess(true);
      setRefType(null);
      setReturnForm({ 
        refId: '', 
        respondentName: '', 
        respondentEmail: '', 
        notes: '',
        position: '',
        salary: '',
        hireDate: '',
        rentAmount: '',
        leaseDates: '',
        assetBalance: ''
      });
      setRefType(null);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 py-6 px-8 flex justify-between items-center shadow-sm">
        <Link to="/" className="flex items-center space-x-3">
          <img src={LOGO_URL} alt="WeVerify.works" className="h-12 w-auto" />
          <div className="h-8 w-px bg-slate-200 hidden md:block"></div>
          <span className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] hidden md:block">Helpdesk & Returns</span>
        </Link>
        <div className="flex items-center space-x-4">
          <a href="mailto:verifications@weverify.works" className="text-xs font-bold text-slate-500 hover:text-teal-600 transition-colors flex items-center space-x-2">
            <Mail className="w-4 h-4" />
            <span className="hidden sm:inline">verifications@weverify.works</span>
          </a>
        </div>
      </header>

      <main className="flex-grow max-w-4xl mx-auto w-full py-16 px-6">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-4">Verification Correspondence Hub</h1>
          <p className="text-slate-500 font-medium text-lg">Official portal for returning completed verifications and checking lifecycle status.</p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex bg-white p-2 rounded-3xl border border-slate-200 shadow-xl mb-12">
          <button 
            onClick={() => { setActiveTab('return'); setSubmitSuccess(false); }}
            className={`flex-1 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center space-x-3 ${activeTab === 'return' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <Upload className="w-5 h-5" />
            <span>Submit Return</span>
          </button>
          <button 
            onClick={() => { setActiveTab('status'); setSearchResult(null); }}
            className={`flex-1 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center space-x-3 ${activeTab === 'status' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <Search className="w-5 h-5" />
            <span>Verification Status</span>
          </button>
        </div>

        {activeTab === 'return' ? (
          <div className="bg-white rounded-[2.5rem] p-10 shadow-2xl border border-slate-200 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {submitSuccess ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 ring-8 ring-emerald-50">
                  <CheckCircle2 className="w-10 h-10 text-emerald-600" />
                </div>
                <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">Return Logged Successfully</h2>
                <p className="text-slate-500 mb-8 max-w-md mx-auto">Your verification return has been received and queued for verification validation. The requesting institution will be notified automatically.</p>
                <button onClick={() => setSubmitSuccess(false)} className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black hover:bg-slate-800 transition-all">Submit Another Return</button>
              </div>
            ) : (
              <form onSubmit={handleReturnSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">Reference ID (WV-CHAIN)</label>
                    <input 
                      required
                      type="text" 
                      placeholder="e.g. WV-12345678"
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-900 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all"
                      value={returnForm.refId}
                      onChange={(e) => setReturnForm({...returnForm, refId: e.target.value})}
                      onBlur={handleRefIdBlur}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">Respondent Name</label>
                    <input 
                      required
                      type="text" 
                      placeholder="Your Full Name"
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-900 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all"
                      value={returnForm.respondentName}
                      onChange={(e) => setReturnForm({...returnForm, respondentName: e.target.value})}
                    />
                  </div>
                </div>

                {refType && (
                  <div className="p-6 bg-slate-50 rounded-3xl border border-slate-200 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="flex items-center space-x-2 mb-6">
                      <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
                      <span className="text-[10px] font-black text-teal-600 uppercase tracking-widest">Requested Data for {refType}</span>
                    </div>
                    
                    {refType === 'Employment' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 ml-1">Official Job Title</label>
                          <input type="text" value={returnForm.position} onChange={(e) => setReturnForm({...returnForm, position: e.target.value})} className="w-full p-4 bg-white border border-slate-200 rounded-xl font-bold text-slate-900" placeholder="e.g. Manager" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 ml-1">Current Salary / Rate</label>
                          <input type="text" value={returnForm.salary} onChange={(e) => setReturnForm({...returnForm, salary: e.target.value})} className="w-full p-4 bg-white border border-slate-200 rounded-xl font-bold text-slate-900" placeholder="$50,000 / yr" />
                        </div>
                      </div>
                    )}

                    {refType === 'Residential' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 ml-1">Monthly Rent Amount</label>
                          <input type="text" value={returnForm.rentAmount} onChange={(e) => setReturnForm({...returnForm, rentAmount: e.target.value})} className="w-full p-4 bg-white border border-slate-200 rounded-xl font-bold text-slate-900" placeholder="$1,200" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 ml-1">Lease Dates</label>
                          <input type="text" value={returnForm.leaseDates} onChange={(e) => setReturnForm({...returnForm, leaseDates: e.target.value})} className="w-full p-4 bg-white border border-slate-200 rounded-xl font-bold text-slate-900" placeholder="01/2023 - 01/2024" />
                        </div>
                      </div>
                    )}

                    {refType === 'Income/Asset' && (
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 ml-1">Current Account Balance</label>
                        <input type="text" value={returnForm.assetBalance} onChange={(e) => setReturnForm({...returnForm, assetBalance: e.target.value})} className="w-full p-4 bg-white border border-slate-200 rounded-xl font-bold text-slate-900" placeholder="$10,000.00" />
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">Official Email</label>
                  <input 
                    required
                    type="email" 
                    placeholder="hr@yourcompany.com"
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-900 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all"
                    value={returnForm.respondentEmail}
                    onChange={(e) => setReturnForm({...returnForm, respondentEmail: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">Verification Notes / Data</label>
                  <textarea 
                    rows={4}
                    placeholder="Enter verification details or notes here..."
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-900 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all"
                    value={returnForm.notes}
                    onChange={(e) => setReturnForm({...returnForm, notes: e.target.value})}
                  />
                </div>

                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 flex items-start space-x-4">
                  <div className="p-2 bg-teal-100 rounded-lg text-teal-600">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed font-medium">
                    By submitting this return, you certify that the information provided is accurate to the best of your knowledge and that you are an authorized representative of the responding entity.
                  </p>
                </div>

                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-lg hover:bg-slate-800 transition-all shadow-xl flex items-center justify-center space-x-3"
                >
                  {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                    <>
                      <span>Submit Verification Return</span>
                      <ArrowRight className="w-5 h-5 text-teal-400" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-[2.5rem] p-10 shadow-2xl border border-slate-200 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <form onSubmit={handleStatusSearch} className="mb-10">
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-4 ml-2">Enter Reference ID</label>
              <div className="flex space-x-4">
                <div className="relative flex-grow">
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="WV-XXXXXXXX"
                    className="w-full p-5 pl-14 bg-slate-50 border border-slate-200 rounded-2xl font-black text-xl text-slate-900 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all"
                    value={referenceId}
                    onChange={(e) => setReferenceId(e.target.value)}
                  />
                </div>
                <button 
                  type="submit"
                  disabled={isSearching}
                  className="px-10 bg-slate-900 text-white rounded-2xl font-black hover:bg-slate-800 transition-all shadow-xl flex items-center space-x-2"
                >
                  {isSearching ? <Loader2 className="w-6 h-6 animate-spin" /> : <span>Track Verification</span>}
                </button>
              </div>
            </form>

            {searchResult && (
              <div className="animate-in fade-in zoom-in-95 duration-300">
                {searchResult.error ? (
                  <div className="p-8 bg-red-50 border border-red-100 rounded-3xl flex items-center space-x-4 text-red-600">
                    <AlertCircle className="w-8 h-8 flex-shrink-0" />
                    <p className="font-bold">{searchResult.error}</p>
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-[2rem] overflow-hidden">
                    <div className="bg-slate-900 p-8 text-white">
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <p className="text-[10px] font-black text-teal-400 uppercase tracking-[0.3em] mb-1">Verification Subject</p>
                          <h3 className="text-3xl font-black tracking-tight">{searchResult.applicant}</h3>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-1">Status</p>
                          <div className={`px-4 py-1.5 rounded-full font-black text-[10px] uppercase tracking-widest inline-flex items-center space-x-2 ${
                            searchResult.status === 'VERIFIED' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 
                            searchResult.status === 'REJECTED' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                            'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          }`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${
                               searchResult.status === 'VERIFIED' ? 'bg-emerald-400' : 
                               searchResult.status === 'REJECTED' ? 'bg-red-400' : 'bg-amber-400'
                            }`}></div>
                            <span>{searchResult.status}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-6 border-t border-slate-800">
                        <div>
                          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Reference</p>
                          <p className="font-mono text-xs font-bold">{searchResult.id}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Type</p>
                          <p className="text-xs font-bold">{searchResult.type}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Logged</p>
                          <p className="text-xs font-bold">{searchResult.timestamp}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Entity</p>
                          <p className="text-xs font-bold truncate">{searchResult.company}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-8 bg-slate-50">
                      <div className="flex items-start space-x-4">
                        <div className="w-10 h-10 bg-white rounded-xl border border-slate-200 flex items-center justify-center flex-shrink-0 shadow-sm">
                          <MessageSquare className="w-5 h-5 text-slate-400" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Latest Registry Note</p>
                          <p className="text-slate-700 font-medium leading-relaxed">{searchResult.statusDetails}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Support Footer */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-8 bg-white rounded-3xl border border-slate-200 shadow-lg text-center">
            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-100">
              <Mail className="w-6 h-6 text-slate-400" />
            </div>
            <h4 className="font-black text-slate-900 mb-2">Email Returns</h4>
            <p className="text-xs text-slate-500 font-medium">Send completed forms directly to our compliance inbox.</p>
          </div>
          <div className="p-8 bg-white rounded-3xl border border-slate-200 shadow-lg text-center">
            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-100">
              <MessageSquare className="w-6 h-6 text-slate-400" />
            </div>
            <h4 className="font-black text-slate-900 mb-2">Live Support</h4>
            <p className="text-xs text-slate-500 font-medium">Chat with a compliance officer for immediate assistance.</p>
          </div>
          <div className="p-8 bg-white rounded-3xl border border-slate-200 shadow-lg text-center">
            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-100">
              <ShieldCheck className="w-6 h-6 text-slate-400" />
            </div>
            <h4 className="font-black text-slate-900 mb-2">Security</h4>
            <p className="text-xs text-slate-500 font-medium">All data is encrypted and processed under ISO-27001 standards.</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-12 px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center space-y-6 md:space-y-0">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">© {new Date().getFullYear()} WeVerify Infrastructure Group</p>
          <div className="flex space-x-8">
            <Link to="/" className="text-[10px] font-black text-slate-400 hover:text-teal-600 uppercase tracking-widest transition-colors">Main Portal</Link>
            <Link to="/login" className="text-[10px] font-black text-slate-400 hover:text-teal-600 uppercase tracking-widest transition-colors">Client Login</Link>
            <a href="https://helpdesk.weverify.works" className="text-[10px] font-black text-slate-400 hover:text-teal-600 uppercase tracking-widest transition-colors">Helpdesk Home</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Helpdesk;
