
import React, { useState, useEffect, useRef } from 'react';
import { ClipboardList, Clock, CheckCircle2, AlertCircle, Search, ArrowRight, User, Building2, Calendar, MoreVertical, Check, RefreshCw, Trash2, Eye, Edit3, Upload, FileCheck, X, Mail, Loader2, Zap, ExternalLink, Phone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { searchContactInfo } from '../services/searchService.ts';

interface VerificationEntry {
  id: string;
  applicant: string;
  company: string;
  type: string;
  submitter: string;
  status: 'PENDING' | 'IN_REVIEW' | 'VERIFIED' | 'REJECTED';
  statusDetails: string;
  timestamp: string;
  completionDate?: string;
  fullData: any;
  uploadedDoc?: string;
}

const VerificationQueue: React.FC = () => {
  const navigate = useNavigate();
  const [queue, setQueue] = useState<VerificationEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewingItem, setViewingItem] = useState<VerificationEntry | null>(null);
  const [editVerificationDetails, setEditVerificationDetails] = useState('');
  const [editVerificationName, setEditVerificationName] = useState('');
  const [editVerificationEmail, setEditVerificationEmail] = useState('');
  const [editVerificationPhone, setEditVerificationPhone] = useState('');
  const [editVerificationAddress, setEditVerificationAddress] = useState('');
  const [editVerificationConfirmed, setEditVerificationConfirmed] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (viewingItem) {
      setEditVerificationDetails(viewingItem.fullData?.details || '');
      setEditVerificationName(viewingItem.applicant || '');
      setEditVerificationEmail(viewingItem.fullData?.recipientEmail || '');
      setEditVerificationPhone(viewingItem.fullData?.phone || '');
      setEditVerificationAddress(viewingItem.fullData?.address || '');
      setEditVerificationConfirmed(viewingItem.fullData?.isConfirmed || false);
    }
  }, [viewingItem?.id]);

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

  useEffect(() => {
    const actingAs = localStorage.getItem('wv_admin_acting_as');
    const userEmail = actingAs || localStorage.getItem('wv_user_email');
    logAction('Queue Access', `Client accessed Verification Queue`, 'INFO');
    const data = localStorage.getItem('wv_queue');
    if (data) {
      const allItems: VerificationEntry[] = JSON.parse(data);
      // Filter by submitter email for client view
      if (userEmail) {
        setQueue(allItems.filter(item => item.submitter === userEmail));
      } else {
        setQueue(allItems);
      }
    }
  }, []);

  const syncWithRegistry = async () => {
    setIsSyncing(true);
    logAction('Sync Registry', `Client initiated manual status sync with registry`, 'INFO');
    try {
      const response = await fetch(`/api/automation/dispatch?action=syncStatus`);
      const remoteData = await response.json();

      if (remoteData && remoteData.completedIds) {
        let hasChanges = false;
        const updated = queue.map(item => {
          // Map remote completion to VERIFIED for now, or keep existing logic
          if (remoteData.completedIds.includes(item.id) && item.status !== 'VERIFIED') {
            hasChanges = true;
            return {
              ...item,
              status: 'VERIFIED' as const,
              statusDetails: remoteData.results[item.id] || "Verified via automated email processing.",
              completionDate: new Date().toLocaleString()
            };
          }
          return item;
        });

        if (hasChanges) {
          setQueue(updated);
          localStorage.setItem('wv_queue', JSON.stringify(updated));
        }
      }
    } catch (err) {
      console.error("Sync failed.", err);
    } finally {
      setTimeout(() => setIsSyncing(false), 800);
    }
  };

  const handleResendEmail = async (entry: VerificationEntry) => {
    if (!entry.fullData?.recipientEmail) {
      alert("No recipient email found.");
      return;
    }

    setResendingId(entry.id);
    logAction('Resend Email', `Client requested re-dispatch for verification ID: ${entry.id}`, 'INFO');
    const timestampStr = new Date().toLocaleString();

    try {
      await fetch("/api/automation/dispatch", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...entry.fullData,
          id: entry.id,
          documentHtml: entry.fullData.generatedHtml,
          workLog: `Manual Re-dispatch (${timestampStr})`,
          logTimestamp: timestampStr
        })
      });
      
      const updated = queue.map(item => {
        if (item.id === entry.id) {
          return {
            ...item,
            statusDetails: `Re-sent to ${entry.fullData.recipientEmail} (${timestampStr})`,
          };
        }
        return item;
      });
      setQueue(updated);
      localStorage.setItem('wv_queue', JSON.stringify(updated));
    } catch (err) {
      alert("Dispatch failed.");
    } finally {
      setResendingId(null);
    }
  };

  const deleteEntry = (id: string) => {
    if (window.confirm('Are you sure you want to permanently delete this registry entry? This cannot be undone.')) {
      logAction('Delete Entry', `Client deleted verification record ID: ${id}`, 'WARNING');
      const updated = queue.filter(item => item.id !== id);
      setQueue(updated);
      localStorage.setItem('wv_queue', JSON.stringify(updated));
    }
  };

  const filteredQueue = queue.filter(item => 
    item.applicant.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRunningTime = (timestamp: string) => {
    const submitTime = new Date(timestamp).getTime();
    if (isNaN(submitTime)) return { text: 'Unknown', isAlert: false };
    
    const diffMs = Date.now() - submitTime;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    const remainingHours = diffHours % 24;
    
    const isAlert = diffHours > 48;
    
    let text = '';
    if (diffDays > 0) {
      text = `${diffDays}d ${remainingHours}h`;
    } else {
      text = `${diffHours}h`;
    }
    
    return { text, isAlert };
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 relative">
      {/* Quick View Modal */}
      {viewingItem && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 md:p-10 animate-in fade-in zoom-in-95 duration-200">
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={() => setViewingItem(null)}></div>
          <div className="relative bg-white w-full max-w-5xl h-full flex flex-col rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200">
            <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-teal-500 rounded-xl flex items-center justify-center">
                  <Eye className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-lg leading-tight">{viewingItem.applicant}</h3>
                  <p className="text-[10px] text-teal-400 font-bold uppercase tracking-widest">{viewingItem.id} • {viewingItem.type}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <button 
                  onClick={() => {
                    const html = viewingItem.fullData?.generatedHtml;
                    if (!html) return;
                    const blob = new Blob([html], { type: 'text/html' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `verification_${viewingItem.id}.html`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-bold transition-all flex items-center space-x-2"
                  title="Save HTML"
                >
                  <ClipboardList className="w-4 h-4" />
                  <span className="hidden sm:inline">Save</span>
                </button>
                <button 
                  onClick={() => {
                    const html = viewingItem.fullData?.generatedHtml;
                    if (!html) return;
                    const printWindow = window.open('', '_blank');
                    if (printWindow) {
                      printWindow.document.write(html);
                      printWindow.document.close();
                      printWindow.focus();
                      printWindow.print();
                    }
                  }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-bold transition-all flex items-center space-x-2"
                  title="Print Document"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span className="hidden sm:inline">Print</span>
                </button>
                <button 
                  onClick={() => {
                    const subject = encodeURIComponent(`Verification Document: ${viewingItem.id}`);
                    const body = encodeURIComponent(`Please find the verification document details attached or below.\n\nID: ${viewingItem.id}\nApplicant: ${viewingItem.applicant}\nType: ${viewingItem.type}`);
                    window.location.href = `mailto:?subject=${subject}&body=${body}`;
                  }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-bold transition-all flex items-center space-x-2"
                  title="Email Document"
                >
                  <Mail className="w-4 h-4" />
                  <span className="hidden sm:inline">Email</span>
                </button>
                <button 
                  onClick={() => navigate(`/generate?edit=${viewingItem.id}`)}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-500 rounded-xl text-xs font-bold transition-all flex items-center space-x-2"
                >
                  <Edit3 className="w-4 h-4" />
                  <span className="hidden sm:inline">Modify</span>
                </button>
                <button onClick={() => setViewingItem(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors ml-2">
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="flex-grow overflow-auto p-8 bg-slate-100 flex flex-col md:flex-row space-y-8 md:space-y-0 md:space-x-8">
              <div className="flex-grow bg-white shadow-lg border border-slate-200 w-full max-w-[8.5in] p-0 rounded-lg overflow-hidden shrink-0">
                <div 
                  className="w-full origin-top"
                  dangerouslySetInnerHTML={{ __html: viewingItem.fullData?.generatedHtml || '<div class="p-10 text-center text-slate-400">No document preview available for this legacy entry.</div>' }} 
                />
              </div>

              <div className="w-full md:w-80 space-y-6 shrink-0">
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Contact Details</h3>
                  
                  {viewingItem.fullData?.recipientPhone && (
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="flex items-center space-x-3">
                        <Phone className="w-4 h-4 text-teal-600" />
                        <span className="text-xs font-bold text-slate-900">{viewingItem.fullData.recipientPhone}</span>
                      </div>
                      <a 
                        href={`tel:${viewingItem.fullData.recipientPhone}`}
                        className="p-2 bg-teal-100 text-teal-600 rounded-lg hover:bg-teal-200 transition-colors"
                        title="Dial via System / Google Voice"
                      >
                        <Zap className="w-3 h-3" />
                      </a>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Contact Name</label>
                        <input 
                          type="text" 
                          value={editVerificationName}
                          onChange={(e) => setEditVerificationName(e.target.value)}
                          className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
                          placeholder="Enter contact name"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Email Address</label>
                        <input 
                          type="email" 
                          value={editVerificationEmail}
                          onChange={(e) => setEditVerificationEmail(e.target.value)}
                          className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
                          placeholder="Enter email address"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Phone Number</label>
                        <input 
                          type="text" 
                          value={editVerificationPhone}
                          onChange={(e) => setEditVerificationPhone(e.target.value)}
                          className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
                          placeholder="Enter phone number"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Office Address</label>
                        <textarea 
                          value={editVerificationAddress}
                          onChange={(e) => setEditVerificationAddress(e.target.value)}
                          className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-teal-500 min-h-[60px]"
                          placeholder="Enter office address"
                        />
                      </div>
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Details / Notes</label>
                          <button 
                            disabled={isSearching}
                            onClick={async () => {
                              setIsSearching(true);
                              const result = await searchContactInfo(editVerificationName || editVerificationEmail, editVerificationEmail, viewingItem.company);
                              if (result.name) setEditVerificationName(result.name);
                              if (result.phone) setEditVerificationPhone(result.phone);
                              if (result.address) setEditVerificationAddress(result.address);
                              if (result.email) setEditVerificationEmail(result.email);
                              setEditVerificationDetails(result.notes);
                              setIsSearching(false);
                            }}
                            className="text-[9px] font-black uppercase tracking-widest text-teal-600 hover:text-teal-700 transition-colors flex items-center space-x-1 disabled:opacity-50"
                          >
                            {isSearching ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                            <span>Generate</span>
                          </button>
                        </div>
                        <textarea 
                          value={editVerificationDetails}
                          onChange={(e) => setEditVerificationDetails(e.target.value)}
                          className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-teal-500 min-h-[120px]"
                          placeholder="Enter details pertaining to the specified situation..."
                        />
                      </div>
                    </div>

                    <div className="flex items-start space-x-2">
                      <input 
                        type="checkbox" 
                        id="queueConfirmed"
                        checked={editVerificationConfirmed}
                        onChange={(e) => setEditVerificationConfirmed(e.target.checked)}
                        className="mt-0.5 w-4 h-4 text-teal-600 border-slate-300 rounded focus:ring-teal-500"
                      />
                      <label htmlFor="queueConfirmed" className="text-[10px] font-bold text-slate-500 leading-tight">
                        *(Confirmed) Contact details pertaining to the scope are accurate and appropriately apply to situation
                      </label>
                    </div>

                    <button
                      onClick={() => {
                        if (!editVerificationConfirmed) {
                          alert("Please confirm the contact details are accurate by checking the box.");
                          return;
                        }
                        const updatedQueue = queue.map(item => {
                          if (item.id === viewingItem.id) {
                            return {
                              ...item,
                              applicant: editVerificationName,
                              fullData: {
                                ...item.fullData,
                                recipientEmail: editVerificationEmail,
                                phone: editVerificationPhone,
                                address: editVerificationAddress,
                                details: editVerificationDetails,
                                isConfirmed: editVerificationConfirmed
                              }
                            };
                          }
                          return item;
                        });
                        setQueue(updatedQueue);
                        localStorage.setItem('wv_queue', JSON.stringify(updatedQueue));
                        setViewingItem(updatedQueue.find(item => item.id === viewingItem.id) || null);
                        alert("Details saved to registry.");
                      }}
                      className="w-full py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/10"
                    >
                      Save to Registry
                    </button>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Dialer Integration</h3>
                  <p className="text-[10px] text-slate-500 leading-relaxed">
                    Connect with Google Voice or your system dialer to initiate calls directly from the registry.
                  </p>
                  <button 
                    onClick={() => window.open('https://voice.google.com/', '_blank')}
                    className="w-full py-2 border border-slate-200 rounded-xl text-[10px] font-bold text-slate-600 hover:bg-slate-50 transition-colors flex items-center justify-center space-x-2"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>Open Google Voice</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 space-y-6 md:space-y-0">
          <div>
            <h1 className="text-4xl font-black text-slate-900 flex items-center space-x-3 tracking-tight">
              <ClipboardList className="w-10 h-10 text-teal-600" />
              <span>Registry Work Log</span>
            </h1>
            <p className="text-slate-500 font-medium mt-1">Monitoring Global Dispatch & Verification Lifecycles</p>
          </div>
          
          <div className="flex items-center space-x-3 w-full md:w-auto">
            <div className="relative flex-grow md:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input 
                type="text" 
                placeholder="Search Registry..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl shadow-sm focus:ring-4 focus:ring-teal-500/10 outline-none transition-all font-medium"
              />
            </div>
            <button 
              onClick={syncWithRegistry}
              disabled={isSyncing}
              className={`p-3.5 rounded-2xl border border-slate-200 shadow-sm transition-all flex items-center space-x-2 font-bold ${isSyncing ? 'bg-slate-100 text-slate-400' : 'bg-white text-teal-600 hover:bg-teal-50 hover:border-teal-200'}`}
            >
              <RefreshCw className={`w-5 h-5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Sync Registry</span>
            </button>
          </div>
        </div>

        {filteredQueue.length === 0 ? (
          <div className="bg-white rounded-[3rem] p-24 text-center border-2 border-dashed border-slate-200 shadow-sm">
            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-8">
              <Clock className="w-12 h-12 text-slate-300" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-3">No Active Verifications</h3>
            <p className="text-slate-500 max-w-sm mx-auto mb-10 text-lg">Your compliance registry is empty. Submit a new verification to start the tracking lifecycle.</p>
            <button onClick={() => navigate('/generate')} className="px-10 py-4 bg-teal-600 text-white rounded-[2rem] font-black text-lg hover:bg-teal-700 transition-all shadow-xl shadow-teal-100">Submit New Verification</button>
          </div>
        ) : (
          <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-200 overflow-hidden mb-12">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-slate-400 text-[10px] uppercase tracking-[0.25em] font-black">
                    <th className="px-8 py-6">Subject / Verification ID</th>
                    <th className="px-8 py-6">Entity / Dispatch</th>
                    <th className="px-8 py-6">Verification Status</th>
                    <th className="px-8 py-6">Logged At</th>
                    <th className="px-8 py-6">Running Time</th>
                    <th className="px-8 py-6 text-center">Operations</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredQueue.map((item) => {
                    const runningTime = getRunningTime(item.timestamp);
                    const isCompleted = item.status === 'COMPLETE' || item.status === 'VERIFIED' || item.status === 'REJECTED';
                    const showAlert = runningTime.isAlert && !isCompleted;

                    return (
                    <tr key={item.id} className={`hover:bg-slate-50/50 transition-colors group ${showAlert ? 'bg-red-50/30' : ''}`}>
                      <td className="px-8 py-6">
                        <div className="font-black text-slate-900 text-lg flex items-center space-x-2">
                          <span>{item.applicant}</span>
                          {showAlert && <span className="flex items-center justify-center w-5 h-5 bg-red-100 text-red-600 rounded-full" title="Open longer than 48 hours"><AlertCircle className="w-3 h-3" /></span>}
                        </div>
                        <div className="flex items-center space-x-2">
                           <div className="text-[10px] bg-slate-100 px-2 py-0.5 rounded font-mono text-slate-500 font-bold">{item.id}</div>
                           <div className="text-[10px] text-teal-600 font-black uppercase tracking-widest">{item.type}</div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="font-bold text-slate-700 flex items-center space-x-2">
                          <Building2 className="w-4 h-4 text-slate-400" />
                          <span>{item.company}</span>
                        </div>
                        <div className="text-xs text-slate-400 mt-1">{item.fullData?.recipientEmail}</div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="space-y-2">
                          <StatusBadge status={item.status} />
                          <p className="text-[10px] text-slate-400 font-bold leading-tight max-w-[180px]" title={item.statusDetails}>
                            {item.statusDetails}
                          </p>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-xs text-slate-500 font-mono font-bold">
                        {item.timestamp}
                      </td>
                      <td className="px-8 py-6">
                        <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-md ${isCompleted ? 'bg-slate-100 text-slate-500' : showAlert ? 'bg-red-100 text-red-700' : 'bg-blue-50 text-blue-600'}`}>
                          {isCompleted ? 'Closed' : runningTime.text}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex justify-center items-center space-x-2">
                          <button 
                            onClick={() => {
                              logAction('View Details', `Client viewed verification details for ID: ${item.id}`, 'INFO');
                              setViewingItem(item);
                            }}
                            className="p-3 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 hover:text-teal-600 transition-all shadow-sm"
                            title="Quick View Document"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          
                          <button 
                            onClick={() => {
                              logAction('Edit Record', `Client initiated edit for verification ID: ${item.id}`, 'INFO');
                              navigate(`/generate?edit=${item.id}`);
                            }}
                            className="p-3 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 hover:text-teal-600 transition-all shadow-sm"
                            title="Edit Record"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          <button 
                            onClick={() => handleResendEmail(item)}
                            disabled={resendingId === item.id || item.status === 'COMPLETE' || item.status === 'VERIFIED' || item.status === 'REJECTED'}
                            className="p-3 bg-teal-50 text-teal-600 rounded-xl hover:bg-teal-600 hover:text-white transition-all disabled:opacity-30 shadow-sm"
                            title="Re-dispatch Verification"
                          >
                            {resendingId === item.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                          </button>
                          
                          <button 
                            onClick={() => deleteEntry(item.id)}
                            className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm"
                            title="Purge Record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-6">
           <div className="flex-1 bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden flex items-center">
              <div className="absolute top-0 right-0 p-10 opacity-5">
                <Zap className="w-32 h-32" />
              </div>
              <div className="relative z-10 flex items-center space-x-6">
                <div className="w-16 h-16 bg-teal-500/20 rounded-[1.5rem] flex items-center justify-center border border-teal-500/30">
                  <RefreshCw className={`w-8 h-8 text-teal-400 ${isSyncing ? 'animate-spin' : ''}`} />
                </div>
                <div>
                   <h4 className="text-lg font-black tracking-tight">Registry Mirroring</h4>
                   <p className="text-slate-400 text-sm font-medium">Syncing with <span className="text-teal-400">verifications@weverify.works</span> inbox.</p>
                </div>
              </div>
           </div>
           
           <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm flex items-center px-12">
              <div className="text-center">
                 <p className="text-4xl font-black text-slate-900">{filteredQueue.length}</p>
                 <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-1">Active Lifecycle Verifications</p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

const StatusBadge = ({ status }: { status: VerificationEntry['status'] }) => {
  const configs = {
    PENDING: { bg: 'bg-slate-100', text: 'text-slate-600', icon: Clock, label: 'Pending' },
    IN_REVIEW: { bg: 'bg-amber-100', text: 'text-amber-700', icon: Eye, label: 'In Review' },
    VERIFIED: { bg: 'bg-emerald-100', text: 'text-emerald-700', icon: CheckCircle2, label: 'Verified' },
    REJECTED: { bg: 'bg-red-100', text: 'text-red-700', icon: X, label: 'Rejected' },
    // Fallback for legacy data
    NEEDS_DETAILS: { bg: 'bg-amber-100', text: 'text-amber-700', icon: AlertCircle, label: 'Update Required' },
    COMPLETE: { bg: 'bg-emerald-100', text: 'text-emerald-700', icon: CheckCircle2, label: 'Verified' }
  };
  
  // Handle potential legacy statuses gracefully
  const config = configs[status] || configs['PENDING'];
  const Icon = config.icon;

  return (
    <div className={`inline-flex items-center space-x-2 px-3 py-1.5 rounded-full ${config.bg} ${config.text} font-black text-[9px] uppercase tracking-widest shadow-sm`}>
      <Icon className="w-3.5 h-3.5" />
      <span>{config.label}</span>
    </div>
  );
};

export default VerificationQueue;
