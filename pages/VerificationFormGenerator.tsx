import React, { useState, useEffect } from 'react';
import { FileText, Printer, ArrowLeft, Send, CheckCircle2, User, Building, Mail, Phone, Search, Loader2, AlertCircle, Zap, ThumbsUp, ClipboardList, UserCheck, Globe, Edit3 } from 'lucide-react';
import { findCompanyInfo } from '../services/gemini';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';

const LOGO_URL = "https://www.ampcgfoundation.pro/img/weverifyworkslogo.jpg";

type VerificationType = 'Employment' | 'Residential' | 'Income/Asset' | 'General' | 'Other';

interface FormData {
  type: VerificationType;
  applicantName: string;
  applicantDob: string;
  applicantSsnLast4: string;
  recipientName: string;
  recipientTitle: string;
  recipientCompany: string;
  recipientEmail: string;
  recipientPhone: string;
  recipientAddress: string;
  specialInstructions: string;
  submitterName: string;
}

interface WorkLogEntry {
  status: string;
  timestamp: string;
  details: string;
}

const VerificationFormGenerator: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');

  const [formData, setFormData] = useState<FormData>({
    type: 'Employment',
    applicantName: '',
    applicantDob: '',
    applicantSsnLast4: '',
    recipientName: '',
    recipientTitle: '',
    recipientCompany: '',
    recipientEmail: '',
    recipientPhone: '',
    recipientAddress: '',
    specialInstructions: '',
    submitterName: ''
  });

  const [isPreview, setIsPreview] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isAutomating, setIsAutomating] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [showNoEmailModal, setShowNoEmailModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [dispatchStatus, setDispatchStatus] = useState<'idle' | 'success' | 'failed'>('idle');
  const [latestLog, setLatestLog] = useState<WorkLogEntry | null>(null);
  const actingAs = localStorage.getItem('wv_admin_acting_as');

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
    logAction('Form Access', editId ? `User accessed form to edit verification ID: ${editId}` : `User accessed new verification form`, 'INFO');
    if (editId) {
      const queue = JSON.parse(localStorage.getItem('wv_queue') || '[]');
      const item = queue.find((i: any) => i.id === editId);
      if (item && item.fullData) {
        setFormData(item.fullData);
      }
    } else {
      const actingAs = localStorage.getItem('wv_admin_acting_as');
      const userEmail = localStorage.getItem('wv_user_email');
      const adminEmail = localStorage.getItem('wv_admin_email');
      const email = actingAs || userEmail || adminEmail;
      
      if (email) {
        setFormData(prev => ({ ...prev, submitterName: email }));
      }
    }
  }, [editId]);

  // Auto-fill recipientName and recipientTitle based on verification type to simplify the form
  useEffect(() => {
    setFormData(prev => {
      // Only auto-fill if the user hasn't typed a custom name/title
      const isDefaultName = !prev.recipientName || ['HR Department', 'Leasing Office', 'Branch Manager', 'Authorized Representative'].includes(prev.recipientName);
      
      if (!isDefaultName) {
        return prev;
      }
      
      let defaultName = '';
      let defaultTitle = '';
      
      switch (prev.type) {
        case 'Employment':
          defaultName = 'HR Department';
          defaultTitle = 'Human Resources';
          break;
        case 'Residential':
          defaultName = 'Leasing Office';
          defaultTitle = 'Property Manager';
          break;
        case 'Income/Asset':
          defaultName = 'Branch Manager';
          defaultTitle = 'Financial Services';
          break;
        default:
          defaultName = 'Authorized Representative';
          defaultTitle = 'Administration';
      }
      
      return {
        ...prev,
        recipientName: defaultName,
        recipientTitle: defaultTitle
      };
    });
  }, [formData.type]);

  const getDatasetRows = (type: VerificationType) => {
    const rowStyle = 'border-bottom: 1px solid #e2e8f0; padding: 12px 8px; vertical-align: bottom;';
    const labelStyle = 'font-weight: 700; font-size: 10px; text-transform: uppercase; color: #475569; width: 240px; display: inline-block; letter-spacing: 0.05em;';
    const lineStyle = 'text-decoration: none; border-bottom: 1px dotted #94a3b8; display: inline-block; width: 100%; min-width: 200px; height: 18px;';

    switch (type) {
      case 'Employment':
        return `
          <tr><td style="${rowStyle}"><span style="${labelStyle}">Official Job Title:</span> <span style="${lineStyle}"></span></td></tr>
          <tr><td style="${rowStyle}"><span style="${labelStyle}">Dates of Employment:</span> <span style="${lineStyle}"></span></td></tr>
          <tr><td style="${rowStyle}"><span style="${labelStyle}">Current Gross Pay Rate:</span> <span style="${lineStyle}"></span></td></tr>
          <tr><td style="${rowStyle}">
            <span style="${labelStyle}">Pay Frequency:</span> 
            <span style="display: inline-flex; align-items: center; margin-left: 10px; font-size: 11px; color: #334155;">
              <span style="border: 1px solid #94a3b8; width: 12px; height: 12px; display: inline-block; margin-right: 4px;"></span> Weekly
              <span style="border: 1px solid #94a3b8; width: 12px; height: 12px; display: inline-block; margin-right: 4px; margin-left: 12px;"></span> Bi-Weekly
              <span style="border: 1px solid #94a3b8; width: 12px; height: 12px; display: inline-block; margin-right: 4px; margin-left: 12px;"></span> Monthly
              <span style="border: 1px solid #94a3b8; width: 12px; height: 12px; display: inline-block; margin-right: 4px; margin-left: 12px;"></span> Other
            </span>
          </td></tr>
          <tr><td style="${rowStyle}"><span style="${labelStyle}">YTD Gross Earnings:</span> <span style="${lineStyle}"></span></td></tr>
          <tr><td style="${rowStyle}"><span style="${labelStyle}">Average Hours Per Week:</span> <span style="${lineStyle}"></span></td></tr>
        `;
      case 'Residential':
        return `
          <tr><td style="${rowStyle}"><span style="${labelStyle}">Lease Start Date:</span> <span style="${lineStyle}"></span></td></tr>
          <tr><td style="${rowStyle}"><span style="${labelStyle}">Lease End Date:</span> <span style="${lineStyle}"></span></td></tr>
          <tr><td style="${rowStyle}"><span style="${labelStyle}">Current Monthly Rent Amount:</span> <span style="${lineStyle}"></span></td></tr>
          <tr><td style="${rowStyle}"><span style="${labelStyle}">Rent Includes Utilities?:</span> <span style="${lineStyle}"></span></td></tr>
          <tr><td style="${rowStyle}"><span style="${labelStyle}">Current Account Balance / Past Due:</span> <span style="${lineStyle}"></span></td></tr>
          <tr><td style="${rowStyle}"><span style="${labelStyle}">Number of Late Payments (Last 12 Mo):</span> <span style="${lineStyle}"></span></td></tr>
          <tr><td style="${rowStyle}"><span style="${labelStyle}">NSF Checks (Last 12 Mo):</span> <span style="${lineStyle}"></span></td></tr>
          <tr><td style="${rowStyle}"><span style="${labelStyle}">Lease Violations / Complaints:</span> <span style="${lineStyle}"></span></td></tr>
          <tr><td style="${rowStyle}"><span style="${labelStyle}">Proper Notice to Vacate Given?:</span> <span style="${lineStyle}"></span></td></tr>
          <tr><td style="${rowStyle}"><span style="${labelStyle}">Would You Rent to Applicant Again?:</span> <span style="${lineStyle}"></span></td></tr>
        `;
      case 'Income/Asset':
        return `
          <tr><td style="${rowStyle}"><span style="${labelStyle}">Type of Asset / Income Source:</span> <span style="${lineStyle}"></span></td></tr>
          <tr><td style="${rowStyle}"><span style="${labelStyle}">Account Open Date:</span> <span style="${lineStyle}"></span></td></tr>
          <tr><td style="${rowStyle}"><span style="${labelStyle}">Current Market Value / Balance:</span> <span style="${lineStyle}"></span></td></tr>
          <tr><td style="${rowStyle}"><span style="${labelStyle}">Average 2-Month Balance:</span> <span style="${lineStyle}"></span></td></tr>
          <tr><td style="${rowStyle}"><span style="${labelStyle}">Average 6-Month Balance:</span> <span style="${lineStyle}"></span></td></tr>
          <tr><td style="${rowStyle}"><span style="${labelStyle}">Total Deposits (Last 30 Days):</span> <span style="${lineStyle}"></span></td></tr>
          <tr><td style="${rowStyle}"><span style="${labelStyle}">Total Withdrawals (Last 30 Days):</span> <span style="${lineStyle}"></span></td></tr>
          <tr><td style="${rowStyle}"><span style="${labelStyle}">Number of NSF (Last 60 Days):</span> <span style="${lineStyle}"></span></td></tr>
          <tr><td style="${rowStyle}"><span style="${labelStyle}">Are Funds Currently Accessible?:</span> <span style="${lineStyle}"></span></td></tr>
          <tr><td style="${rowStyle}"><span style="${labelStyle}">Loans / Liens Against Asset:</span> <span style="${lineStyle}"></span></td></tr>
        `;
      default:
        return `
          <tr><td style="${rowStyle}"><span style="${labelStyle}">Primary Claim Status:</span> <span style="${lineStyle}"></span></td></tr>
          <tr><td style="${rowStyle}"><span style="${labelStyle}">Validation Effective Date:</span> <span style="${lineStyle}"></span></td></tr>
          <tr><td style="${rowStyle}"><span style="${labelStyle}">Authority Level of Signatory:</span> <span style="${lineStyle}"></span></td></tr>
          <tr><td style="${rowStyle}"><span style="${labelStyle}">Evidence Reference ID:</span> <span style="${lineStyle}"></span></td></tr>
          <tr><td style="${rowStyle}"><span style="${labelStyle}">Compliance Notes:</span> <span style="${lineStyle}"></span></td></tr>
          <tr><td style="${rowStyle}"><span style="${labelStyle}">Additional Verification Findings:</span> <span style="${lineStyle}"></span></td></tr>
        `;
    }
  };

  const generatePDFHtml = (id: string) => {
    return `
      <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1e293b; padding: 40px; background-color: #ffffff; width: 750px; margin: auto; border: 1px solid #e2e8f0;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td width="60%" valign="bottom">
              <h1 style="text-transform: uppercase; font-size: 22px; color: #0f172a; margin: 0; letter-spacing: 0.05em; font-weight: 900;">${formData.type === 'Employment' ? 'Verification of Income' : `Managed Verification of ${formData.type}`}</h1>
              <div style="font-size: 14px; color: #0d9488; font-weight: bold; text-transform: uppercase; letter-spacing: 0.1em; margin-top: 4px;">${formData.type} Record</div>
            </td>
            <td width="40%" align="right" valign="top">
              <div style="font-size: 10px; color: #94a3b8; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em;">System Reference</div>
              <div style="font-family: 'Courier New', monospace; font-size: 14px; background: #f1f5f9; color: #0f172a; padding: 4px 8px; border-radius: 4px; display: inline-block; margin-top: 4px; font-weight: bold;">WV-ID: ${id}</div>
              <div style="font-size: 10px; color: #64748b; margin-top: 4px;">${new Date().toLocaleDateString()}</div>
            </td>
          </tr>
        </table>
        
        <div style="height: 2px; background: #0f172a; margin: 20px 0;"></div>

        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 30px;">
          <tr>
            <td valign="top" width="50%" style="padding-right: 20px;">
              <div style="font-size: 9px; color: #64748b; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px; border-bottom: 1px solid #e2e8f0; padding-bottom: 2px;">To (Respondent)</div>
              <div style="font-weight: bold; font-size: 14px; color: #0f172a;">${formData.recipientName || 'Authorized Officer'}</div>
              <div style="font-size: 12px; color: #475569;">${formData.recipientTitle || ''}</div>
              <div style="font-weight: bold; color: #0f172a; margin-top: 4px; font-size: 13px;">${formData.recipientCompany}</div>
              <div style="font-size: 11px; color: #64748b; margin-top: 2px;">${formData.recipientAddress || ''}</div>
            </td>
            <td valign="top" width="50%" style="padding-left: 20px; border-left: 1px solid #f1f5f9;">
              <div style="font-size: 9px; color: #64748b; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px; border-bottom: 1px solid #e2e8f0; padding-bottom: 2px;">From (Requestor)</div>
              <div style="font-weight: bold; font-size: 14px; color: #0f172a;">WeVerify Infrastructure Group</div>
              <div style="font-size: 12px; color: #475569;">Compliance & Verification Division</div>
              <div style="font-size: 11px; color: #0d9488; margin-top: 4px; font-weight: bold;">verifications@weverify.works</div>
              <div style="font-size: 11px; color: #64748b; margin-top: 2px; font-weight: bold;">(832) 856-0831</div>
              <div style="font-size: 11px; color: #64748b; margin-top: 2px;">FCRA Compliant Data Processor</div>
            </td>
          </tr>
        </table>

        <div style="background-color: #f8fafc; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 30px;">
          <div style="font-size: 9px; color: #64748b; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 10px;">Subject Information (Applicant)</div>
          <table width="100%" border="0" cellspacing="0" cellpadding="0">
            <tr>
              <td width="60%">
                <span style="font-size: 9px; color: #94a3b8; display: block; text-transform: uppercase; font-weight: bold;">Legal Name</span>
                <strong style="font-size: 18px; color: #0f172a; font-family: 'Courier New', monospace;">${formData.applicantName}</strong>
              </td>
              <td width="40%">
                <span style="font-size: 9px; color: #94a3b8; display: block; text-transform: uppercase; font-weight: bold;">Identifier (DOB / SSN-4)</span>
                <strong style="font-size: 16px; color: #334155; font-family: 'Courier New', monospace;">${formData.applicantDob} / ***-**-${formData.applicantSsnLast4}</strong>
              </td>
            </tr>
          </table>
        </div>

        <div style="font-size: 12px; line-height: 1.5; color: #334155; margin-bottom: 25px;">
          <p style="margin-bottom: 15px;"><strong>AUTHORIZATION:</strong> The individual named above has authorized <strong>WeVerify.works</strong> to verify the information below. This request is for permissible purpose under the Fair Credit Reporting Act (FCRA).</p>
          <p style="margin-bottom: 0;"><strong>INSTRUCTIONS:</strong> Please complete the verification dataset below to the best of your ability. Return the completed form to <span style="color: #0d9488; font-weight: bold;">verifications@weverify.works</span> or via secure fax.</p>
        </div>

        <div style="border: 2px solid #0f172a; border-radius: 6px; overflow: hidden; margin-bottom: 30px;">
          <div style="background: #0f172a; color: #ffffff; padding: 8px 15px; font-weight: bold; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em;">${formData.type} Verification Data</div>
          <div style="padding: 20px; background: #ffffff;">
            <table width="100%" border="0" cellspacing="0" cellpadding="0">
              ${getDatasetRows(formData.type)}
            </table>
          </div>
        </div>

        ${formData.specialInstructions ? `
        <div style="margin-bottom: 30px; background: #fff; border: 1px dashed #cbd5e1; padding: 15px; font-size: 11px; color: #475569;">
          <strong style="color: #0f172a; text-transform: uppercase; font-size: 9px; display: block; margin-bottom: 4px;">Special Instructions:</strong>
          ${formData.specialInstructions}
        </div>` : ''}

        <table width="100%" style="margin-top: 40px;">
          <tr>
            <td width="60%" style="padding-right: 30px;">
              <div style="border-bottom: 1px solid #0f172a; height: 30px;"></div>
              <div style="font-size: 9px; color: #64748b; font-weight: bold; text-transform: uppercase; margin-top: 4px;">Employer Representative Signature</div>
            </td>
            <td width="40%">
              <div style="border-bottom: 1px solid #0f172a; height: 30px;"></div>
              <div style="font-size: 9px; color: #64748b; font-weight: bold; text-transform: uppercase; margin-top: 4px;">Date</div>
            </td>
          </tr>
          <tr>
            <td width="60%" style="padding-right: 30px; padding-top: 20px;">
              <div style="border-bottom: 1px solid #0f172a; height: 30px;"></div>
              <div style="font-size: 9px; color: #64748b; font-weight: bold; text-transform: uppercase; margin-top: 4px;">Employer Representative Name & Title</div>
            </td>
            <td width="40%" style="padding-top: 20px;">
              <div style="border-bottom: 1px solid #0f172a; height: 30px;"></div>
              <div style="font-size: 9px; color: #64748b; font-weight: bold; text-transform: uppercase; margin-top: 4px;">Phone Number</div>
            </td>
          </tr>
        </table>

        <div style="margin-top: 50px; text-align: center; font-size: 9px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 15px;">
          <strong>CONFIDENTIAL:</strong> This document contains sensitive personal information. Unauthorized disclosure is prohibited. <br/>
          WeVerify Infrastructure Group • Data Protection Officer Reg. #ISO-27001
        </div>
      </div>
    `;
  };

  const saveToQueue = (logEntry: WorkLogEntry, entryId: string, pdfHtml: string) => {
    const existingQueue = JSON.parse(localStorage.getItem('wv_queue') || '[]');
    const enrichedData = {
      ...formData,
      generatedHtml: pdfHtml
    };

    if (editId) {
      // Overwrite existing record
      const updated = existingQueue.map((item: any) => {
        if (item.id === editId) {
          return {
            ...item,
            applicant: formData.applicantName,
            company: formData.recipientCompany,
            type: formData.type,
            submitter: formData.submitterName || 'System Admin',
            status: item.status, // Keep existing status unless explicitly changed
            statusDetails: logEntry.details,
            timestamp: logEntry.timestamp,
            fullData: enrichedData
          };
        }
        return item;
      });
      localStorage.setItem('wv_queue', JSON.stringify(updated));
    } else {
      // Create new record
      const newEntry = {
        id: entryId,
        applicant: formData.applicantName,
        company: formData.recipientCompany,
        type: formData.type,
        submitter: formData.submitterName || 'System Admin',
        status: 'PENDING',
        statusDetails: logEntry.details,
        timestamp: logEntry.timestamp,
        fullData: enrichedData
      };
      localStorage.setItem('wv_queue', JSON.stringify([newEntry, ...existingQueue]));
    }
  };

  const sendToOsTicket = async (entryId: string, pdfHtml: string): Promise<string | null> => {
    try {
      const response = await fetch('/api/osticket/create-ticket', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          applicantName: formData.applicantName,
          applicantEmail: formData.submitterName || 'system@weverify.works', // Use submitter email for confirmation
          subject: `Verification Request: ${formData.applicantName} (${entryId})`,
          message: pdfHtml,
          ip: '127.0.0.1'
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        console.error('Failed to create osTicket ticket:', errData.details || errData.error);
        return null;
      } else {
        const data = await response.json();
        console.log('osTicket ticket created successfully:', data.ticketId);
        return data.ticketId;
      }
    } catch (error) {
      console.error('Error sending to osTicket:', error);
      return null;
    }
  };

  const handleTriggerAutomation = async (statusOverride?: string) => {
    // Token Check
    const submitterEmail = formData.submitterName;
    const users = JSON.parse(localStorage.getItem('wv_users') || '[]');
    const submitterAccount = users.find((u: any) => u.email === submitterEmail);
    
    // If we're an admin acting as a client, we check the client's tokens
    // If we're a regular user, we check our own tokens
    const currentTokens = submitterAccount ? submitterAccount.tokens : parseInt(localStorage.getItem('wv_tokens') || '0');

    if (currentTokens <= 0 && !editId) {
      alert("Insufficient credits. The selected account has 0 verification tokens available. Please purchase more tokens or contact your account manager.");
      navigate('/dashboard');
      return false;
    }

    setIsAutomating(true);
    setSearchError(null);
    
    const now = new Date();
    const timestampStr = now.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
    const entryId = editId || `WV-${Date.now().toString().slice(-8)}`;
    const pdfHtml = generatePDFHtml(entryId);

    // Send to osTicket (Non-blocking background task)
    sendToOsTicket(entryId, pdfHtml).then(ticketId => {
      if (ticketId) console.log(`osTicket background sync complete: ${ticketId}`);
    }).catch(err => console.error('osTicket background sync failed:', err));

    const initialStatus = statusOverride || `Lifecycle chain active: Researching nodes for ${formData.recipientCompany}...`;
    const logEntry: WorkLogEntry = {
      status: "LOGGED",
      timestamp: timestampStr,
      details: initialStatus
    };

    try {
      setDispatchStatus('idle');
      if (formData.recipientEmail && !statusOverride) {
        // Dispatch via server-side proxy to ensure reliability and bypass CORS
        // We add a controller to allow for manual timeout if needed
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 45000);

        try {
          const dispatchResponse = await fetch('/api/automation/dispatch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: controller.signal,
            body: JSON.stringify({
              ...formData,
              id: entryId,
              documentHtml: pdfHtml,
              workLog: initialStatus,
              logTimestamp: timestampStr
            })
          });

          clearTimeout(timeoutId);

          if (!dispatchResponse.ok) {
            const errorData = await dispatchResponse.json();
            console.error('Automation dispatch failed:', errorData);
            setDispatchStatus('failed');
            setSearchError(errorData.details || errorData.error || 'Automation dispatch failed');
          } else {
            setDispatchStatus('success');
          }
        } catch (fetchErr: any) {
          clearTimeout(timeoutId);
          if (fetchErr.name === 'AbortError') {
            console.error('Automation dispatch timed out');
            setSearchError('Automation dispatch timed out. The script may still be processing.');
          } else {
            throw fetchErr;
          }
        }
      }
      
      const finalStatus = statusOverride || `${editId ? 'Chain updated' : 'Lifecycle initialized'}: Managed verification chain active for ${formData.applicantName}.`;
      const finalLog = { 
        ...logEntry, 
        details: finalStatus 
      };

      setLatestLog(finalLog);
      saveToQueue(finalLog, entryId, pdfHtml);

      // Decrement Token on successful NEW submission
      if (!editId) {
        const updatedTokens = currentTokens - 1;
        
        // If we are the user, update our local session tokens
        if (localStorage.getItem('wv_user_email') === submitterEmail) {
          localStorage.setItem('wv_tokens', updatedTokens.toString());
        }
        
        // Sync to global users list
        const updatedUsers = users.map((u: any) => {
          if (u.email === submitterEmail) {
            return { ...u, tokens: updatedTokens };
          }
          return u;
        });
        localStorage.setItem('wv_users', JSON.stringify(updatedUsers));
        
        // Clear acting_as if it was set
        localStorage.removeItem('wv_admin_acting_as');
      }

      return true;
    } catch (err) {
      console.error("Automation error:", err);
      const errorLog = { ...logEntry, details: "Lifecycle initialized locally. Remote dispatch offline." };
      setLatestLog(errorLog);
      saveToQueue(errorLog, entryId, pdfHtml);
      return true;
    } finally {
      setIsAutomating(false);
    }
  };

  const handleAccept = async () => {
    if (!formData.recipientEmail) {
      setShowNoEmailModal(true);
      return;
    }
    logAction('Submit Verification', editId ? `User updated verification ID: ${editId}` : `User submitted new verification for ${formData.applicantName}`, 'SUCCESS');
    const success = await handleTriggerAutomation();
    if (success) {
      setShowSuccessModal(true);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSearchCompany = async (query: string) => {
    if (!query.trim()) return;
    setIsSearching(true);
    setSearchError(null);
    logAction('Company Search', `User searched for company info: ${query}`, 'INFO');
    try {
      const info = await findCompanyInfo(query);
      setFormData(prev => ({
        ...prev,
        recipientName: info.name || prev.recipientName,
        recipientTitle: info.title || prev.recipientTitle,
        recipientCompany: info.company || query,
        recipientEmail: info.email || prev.recipientEmail,
        recipientPhone: info.phone || prev.recipientPhone,
        recipientAddress: info.address || prev.recipientAddress,
      }));
    } catch (err) {
      setSearchError("Entity data retrieval failed.");
    } finally {
      setIsSearching(false);
    }
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
      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in">
          <div className="bg-white rounded-[2.5rem] p-10 max-w-xl w-full shadow-2xl border border-slate-200">
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6 ring-4 ring-emerald-50">
                <CheckCircle2 className="w-10 h-10 text-emerald-600" />
              </div>
              <h3 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">
                {editId ? 'Chain Updated' : 'Lifecycle Initialized'}
              </h3>
              <p className="text-slate-500 mb-8">
                {editId ? 'Existing managed chain has been updated.' : 'Your verification is now in our hands. We will handle research, document dispatch, and correspondence.'}
              </p>
              
              <div className="w-full bg-slate-900 rounded-2xl p-6 text-left mb-8 font-mono text-sm border border-slate-700">
                <div className="flex items-center space-x-2 mb-3">
                   <div className="w-2 h-2 bg-teal-400 rounded-full"></div>
                   <span className="text-teal-400 font-bold text-xs uppercase tracking-widest">Active Pipeline Log</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between border-b border-slate-800 pb-1 text-slate-500 text-[10px]">
                    <span>STATUS: ACTIVE_MANAGED</span>
                    <span>ID: {editId || 'NEW_CHAIN'}</span>
                  </div>
                  <p className="text-slate-200 leading-snug pt-1">{latestLog?.details}</p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Email Dispatch:</span>
                  <span className={`text-[10px] font-black uppercase tracking-widest ${
                    dispatchStatus === 'success' ? 'text-emerald-400' : 
                    dispatchStatus === 'failed' ? 'text-red-400' : 'text-slate-500'
                  }`}>
                    {dispatchStatus === 'success' ? '✓ Dispatched' : 
                     dispatchStatus === 'failed' ? '✕ Dispatch Failed' : '...'}
                  </span>
                </div>
              </div>

              <div className="w-full space-y-3">
                <button onClick={() => navigate('/queue')} className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all flex items-center justify-center space-x-2">
                  <ClipboardList className="w-5 h-5" />
                  <span>View Registry Work Log</span>
                </button>
                <button onClick={() => setShowSuccessModal(false)} className="w-full py-4 bg-white text-slate-500 font-bold rounded-2xl hover:bg-slate-50 border border-slate-200 transition-all">Dismiss</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* No Email Modal */}
      {showNoEmailModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4 text-amber-600 font-bold text-3xl">!</div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Email Missing</h3>
              <p className="text-slate-600 mb-6">Automated dispatch requires a recipient email. Add one now or we can attempt manual entity research.</p>
              <div className="flex space-x-3 w-full">
                <button onClick={() => setShowNoEmailModal(false)} className="flex-1 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl">Edit</button>
                <button onClick={() => { setShowNoEmailModal(false); handleTriggerAutomation('Manual: Queue for physical entity research.'); navigate('/queue'); }} className="flex-1 py-3 bg-teal-600 text-white font-bold rounded-xl">Manual Research</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto">
        {!isPreview ? (
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200 animate-in fade-in duration-500">
            {editId && (
              <div className="bg-teal-600 text-white py-3 px-10 flex items-center justify-between font-black text-xs uppercase tracking-widest">
                <div className="flex items-center space-x-2">
                  <Edit3 className="w-4 h-4" />
                  <span>Updating Managed Chain: {editId}</span>
                </div>
                <button onClick={() => navigate('/generate')} className="underline hover:text-teal-100 transition-colors">Start New Chain</button>
              </div>
            )}
            
            <div className="bg-white py-12 flex flex-col items-center border-b border-slate-100">
                <img src={LOGO_URL} alt="WeVerify.works" className="h-40 w-auto object-contain mb-4" />
                <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.4em] mt-2">Managed Verification Lifecycle</h2>
            </div>

            <div className="p-10 space-y-8">
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 flex items-center space-x-4">
                <div className="w-12 h-12 bg-teal-600 text-white rounded-full flex items-center justify-center shadow-lg shadow-teal-100">
                  <UserCheck className="w-6 h-6" />
                </div>
                <div className="flex-grow">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Authorized Submitter ID</label>
                  <input type="text" name="submitterName" value={formData.submitterName} onChange={handleInputChange} className="w-full bg-transparent border-none p-0 focus:ring-0 text-xl font-bold text-slate-900" placeholder="user@weverify.works" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-6">
                  <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center space-x-2 border-b border-slate-200 pb-3 mb-4">
                      <User className="w-4 h-4 text-teal-600" />
                      <span>Verification Subject Identity</span>
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 ml-1">Full Legal Name</label>
                        <input type="text" name="applicantName" value={formData.applicantName} onChange={handleInputChange} className="w-full p-4 bg-white border border-slate-200 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all" placeholder="e.g. Jonathan Doe" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                           <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 ml-1">Date of Birth</label>
                           <input type="date" name="applicantDob" value={formData.applicantDob} onChange={handleInputChange} className="w-full p-4 bg-white border border-slate-200 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all" />
                        </div>
                        <div>
                           <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 ml-1">SSN (Last 4)</label>
                           <input type="text" name="applicantSsnLast4" maxLength={4} value={formData.applicantSsnLast4} onChange={handleInputChange} className="w-full p-4 bg-white border border-slate-200 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all" placeholder="****" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 ml-1">Verification Lifecycle Type</label>
                        <select name="type" value={formData.type} onChange={handleInputChange} className="w-full p-4 bg-white border border-slate-200 rounded-xl font-black text-slate-700 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all appearance-none">
                          <option value="Employment">Employment Lifecycle</option>
                          <option value="Residential">Residential Lifecycle</option>
                          <option value="Income/Asset">Financial Verification Chain</option>
                          <option value="General">General Info Lifecycle</option>
                          <option value="Other">Custom Info Lifecycle</option>
                        </select>
                      </div>

                      {/* Type-Specific Fields */}
                      {formData.type === 'Employment' && (
                        <div className="space-y-4 pt-4 border-t border-slate-100">
                          <p className="text-[10px] font-black text-teal-600 uppercase tracking-widest">Employment Details (Optional Context)</p>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 ml-1">Current Position</label>
                              <input type="text" name="applicantTitle" value={(formData as any).applicantTitle || ''} onChange={handleInputChange} className="w-full p-4 bg-white border border-slate-200 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all" placeholder="e.g. Software Engineer" />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 ml-1">Hire Date</label>
                              <input type="date" name="applicantHireDate" value={(formData as any).applicantHireDate || ''} onChange={handleInputChange} className="w-full p-4 bg-white border border-slate-200 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all" />
                            </div>
                          </div>
                        </div>
                      )}

                      {formData.type === 'Residential' && (
                        <div className="space-y-4 pt-4 border-t border-slate-100">
                          <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Residential Details (Optional Context)</p>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 ml-1">Monthly Rent</label>
                              <input type="text" name="monthlyRent" value={(formData as any).monthlyRent || ''} onChange={handleInputChange} className="w-full p-4 bg-white border border-slate-200 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all" placeholder="$1,500" />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 ml-1">Lease Start</label>
                              <input type="date" name="leaseStart" value={(formData as any).leaseStart || ''} onChange={handleInputChange} className="w-full p-4 bg-white border border-slate-200 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all" />
                            </div>
                          </div>
                        </div>
                      )}

                      {formData.type === 'Income/Asset' && (
                        <div className="space-y-4 pt-4 border-t border-slate-100">
                          <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Financial Details (Optional Context)</p>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 ml-1">Asset Type</label>
                            <input type="text" name="assetType" value={(formData as any).assetType || ''} onChange={handleInputChange} className="w-full p-4 bg-white border border-slate-200 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all" placeholder="e.g. Savings Account, Portfolio" />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center space-x-2 border-b border-slate-200 pb-3 mb-4">
                      <Building className="w-4 h-4 text-teal-600" />
                      <span>Verification Target (Respondent)</span>
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 ml-1">Entity / Company Name</label>
                        <div className="flex space-x-2">
                          <input type="text" name="recipientCompany" value={formData.recipientCompany} onChange={handleInputChange} className="flex-grow p-4 bg-white border border-slate-200 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all" placeholder="Target Organization" />
                          <button type="button" onClick={() => handleSearchCompany(formData.recipientCompany)} disabled={isSearching || !formData.recipientCompany} className="px-4 bg-teal-600 text-white rounded-xl hover:bg-teal-700 disabled:opacity-50 transition-all shadow-lg shadow-teal-200">
                            {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 ml-1">Contact Name <span className="text-slate-300 normal-case font-normal">(Optional)</span></label>
                          <input type="text" name="recipientName" value={formData.recipientName} onChange={handleInputChange} className="w-full p-4 bg-white border border-slate-200 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all" placeholder="HR Manager" />
                        </div>
                        <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 ml-1">Job Title <span className="text-slate-300 normal-case font-normal">(Optional)</span></label>
                          <input type="text" name="recipientTitle" value={formData.recipientTitle} onChange={handleInputChange} className="w-full p-4 bg-white border border-slate-200 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all" placeholder="Director" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 ml-1">Target Email (Required for Auto-Dispatch)</label>
                        <input type="email" name="recipientEmail" value={formData.recipientEmail} onChange={handleInputChange} className="w-full p-4 bg-white border border-slate-200 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all" placeholder="hr@company.com" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 ml-1">Physical Address <span className="text-slate-300 normal-case font-normal">(Optional)</span></label>
                        <input type="text" name="recipientAddress" value={formData.recipientAddress} onChange={handleInputChange} className="w-full p-4 bg-white border border-slate-200 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all" placeholder="123 Corporate Blvd, City, State" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200">
                 <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center space-x-2 border-b border-slate-200 pb-3 mb-4">
                    <ClipboardList className="w-4 h-4 text-teal-600" />
                     <span>Verification Instructions <span className="text-slate-400 normal-case font-normal text-[10px] ml-2">(Optional)</span></span>
                 </h3>
                 <textarea name="specialInstructions" value={formData.specialInstructions} onChange={handleInputChange} rows={3} className="w-full p-4 bg-white border border-slate-200 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all" placeholder="Special requirements for our verifiers (e.g. 'Priority turnaround', 'Specific contact hours')..." />
              </div>

              <div className="pt-2">
                <button onClick={() => setIsPreview(true)} className="w-full py-6 bg-slate-900 text-white rounded-[2.5rem] font-black text-2xl hover:bg-slate-800 shadow-xl flex items-center justify-center space-x-4 transition-all active:scale-[0.98] ring-4 ring-slate-100">
                  <Zap className="w-8 h-8 text-teal-400" />
                  <span>Review & Initialize Lifecycle</span>
                </button>
                <p className="text-center text-slate-400 font-bold text-[10px] mt-6 uppercase tracking-[0.2em]">Our team takes over immediately after initialization.</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom duration-500 pb-20">
             <div className="flex justify-between items-center mb-8 print:hidden">
              <button onClick={() => setIsPreview(false)} className="flex items-center space-x-2 text-slate-600 hover:text-teal-600 font-bold bg-white px-6 py-3 rounded-2xl border border-slate-200 shadow-sm transition-all">
                <ArrowLeft className="w-5 h-5" />
                <span>Return to Configuration</span>
              </button>
              <button onClick={handleAccept} disabled={isAutomating} className="px-12 py-6 bg-emerald-600 text-white rounded-[2.5rem] font-black text-2xl hover:bg-emerald-700 flex items-center space-x-4 shadow-2xl shadow-emerald-200 active:scale-95 transition-all">
                {isAutomating ? <Loader2 className="w-8 h-8 animate-spin" /> : <CheckCircle2 className="w-8 h-8" />}
                <span>{editId ? 'Confirm Update' : 'Begin Full Cycle Verification'}</span>
              </button>
            </div>

            {/* Document Preview (Mockup of what will be generated/sent) */}
            <div className="bg-white p-14 shadow-2xl rounded-lg border border-slate-200 mx-auto max-w-[8.5in] min-h-[11in] font-serif text-slate-900 overflow-hidden relative flex flex-col scale-[1.02]">
              <div className="flex justify-between items-start border-b-2 border-slate-900 pb-8 mb-8">
                <div>
                   <h2 className="text-3xl font-black tracking-tight text-slate-900">WeVerify.works</h2>
                   <p className="text-[10px] text-teal-600 font-black uppercase tracking-widest mt-1">Verification Management</p>
                </div>
                <div className="text-right text-sm space-y-1 font-sans">
                  <p className="font-black text-lg text-slate-900">Compliance Unit</p>
                  <p className="text-slate-500 uppercase text-[10px] tracking-widest font-bold">Managed Lifecycle</p>
                  <p className="text-teal-600 font-bold">verifications@weverify.works</p>
                  <p className="text-slate-500 font-bold text-xs mt-1">(832) 856-0831</p>
                </div>
              </div>

              <div className="text-center mb-10">
                <h1 className="text-3xl font-black uppercase tracking-widest underline decoration-teal-600 decoration-[6px] underline-offset-[12px]">{formData.type === 'Employment' ? 'Verification of Income' : `Managed Verification of ${formData.type}`}</h1>
              </div>

              <div className="mb-10 flex justify-between font-sans">
                <div className="w-1/2">
                  <p className="font-black text-[11px] uppercase text-slate-400 mb-2 tracking-widest">Attention:</p>
                  <p className="font-black text-2xl text-slate-900 leading-tight">{formData.recipientName || 'Authorized Officer'}</p>
                  <p className="text-slate-600 font-bold text-sm">{formData.recipientTitle}</p>
                  <p className="font-black text-lg text-teal-600 mt-1">{formData.recipientCompany}</p>
                  <p className="text-slate-500 mt-1 max-w-xs text-xs leading-relaxed">{formData.recipientAddress}</p>
                </div>
                <div className="w-1/3 text-right">
                   <p className="text-[11px] uppercase text-slate-400 font-black mb-2 tracking-widest">Chain Reference:</p>
                   <p className="font-mono text-base bg-slate-900 text-teal-400 inline-block px-4 py-2 rounded-xl shadow-lg border border-slate-700">WV-CHAIN: {editId || 'INITIALIZING'}</p>
                   <p className="font-mono text-xs mt-3 text-slate-400 font-bold">DATE: {new Date().toLocaleDateString()}</p>
                </div>
              </div>

              <div className="bg-slate-50 p-8 border border-slate-200 mb-8 rounded-[2rem]">
                <p className="font-black text-[10px] uppercase text-slate-400 mb-4 tracking-widest font-sans">Subject Identity Data:</p>
                <div className="grid grid-cols-2 gap-10">
                  <p><span className="text-slate-400 uppercase text-[10px] block font-sans font-black mb-1">Full Legal Name</span> <span className="font-black text-2xl text-slate-900 underline decoration-slate-200 decoration-4">{formData.applicantName}</span></p>
                  <p><span className="text-slate-400 uppercase text-[10px] block font-sans font-black mb-1">Birth Date / SSN Identifier</span> <span className="font-bold text-xl text-slate-800">{formData.applicantDob} / ***-**-{formData.applicantSsnLast4}</span></p>
                </div>
              </div>

              <div className="border-2 border-slate-900 rounded-3xl overflow-hidden mb-10">
                <div className="bg-slate-900 text-white p-4 font-sans font-black text-xs uppercase tracking-widest">Verification Dataset Required:</div>
                <div className="p-8">
                  <table width="100%" border="0" cellPadding="0" cellSpacing="0">
                    <tbody dangerouslySetInnerHTML={{ __html: getDatasetRows(formData.type) }}></tbody>
                  </table>
                </div>
              </div>

              <div className="space-y-6 text-base mb-10 flex-grow leading-relaxed font-sans text-slate-600">
                <p>WeVerify.works is seeking to obtain income information of the individual named above. Complete and return the attached verification to <span className="text-teal-600 font-bold">helpdesk.weverify.works</span> or email <span className="text-teal-600 font-bold">verifications@weverify.works</span>.</p>
              </div>

              <div className="mt-auto pt-10 border-t border-slate-200 text-center">
                 {/* <p className="text-[9px] text-slate-400 font-sans uppercase font-black tracking-widest">Managed Lifecycle anchored to WV-Registry Infrastructure • FCRA Compliant</p> */}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerificationFormGenerator;