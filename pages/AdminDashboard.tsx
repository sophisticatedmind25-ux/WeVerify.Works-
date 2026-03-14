
import React, { useState, useEffect, useMemo, useRef } from 'react';
import * as XLSX from 'xlsx';
import { GoogleGenAI, Type } from "@google/genai";
import { 
  Users, 
  Search, 
  Plus, 
  Minus, 
  Zap, 
  Shield, 
  Building2, 
  Mail, 
  Calendar, 
  CreditCard,
  ChevronRight,
  LogOut,
  Settings,
  Database,
  ExternalLink,
  FileText,
  TrendingUp,
  DollarSign,
  UserPlus,
  CheckCircle2,
  Clock,
  AlertCircle,
  Info,
  X,
  Trash2,
  ClipboardList,
  Send,
  Eye,
  Loader2,
  LayoutDashboard,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  BarChart3,
  PieChart as PieChartIcon,
  Archive,
  Inbox,
  Reply,
  Forward,
  Paperclip,
  MoreVertical,
  Star,
  Flag,
  Minimize2,
  Maximize2,
  Phone,
  Upload,
  RefreshCw
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { searchContactInfo } from '../services/searchService.ts';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line,
  AreaChart,
  Area,
  PieChart,
  Cell,
  Pie
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';

interface UserAccount {
  accountNumber: string;
  email: string;
  orgName: string;
  tokens: number;
  joinedAt: string;
  plan: string;
  status?: 'ACTIVE' | 'INACTIVE';
  password?: string;
  contactPhone?: string;
}

interface ProspectLog {
  timestamp: string;
  action: string;
  details: string;
}

interface Prospect {
  id: string;
  name?: string;
  email?: string;
  company?: string;
  status: string;
  value?: number;
  lastContact?: string;
  agentId?: string;
  createdAt?: string;
  token?: string;
  logs?: ProspectLog[];
  contactPhone?: string;
  contactPhone2?: string;
  details?: string;
  isConfirmed?: boolean;
  address?: string;
  updatedFields?: string[];
}

interface Invoice {
  id: string;
  clientEmail: string;
  clientName: string;
  amount: number;
  tokens: number;
  date: string;
  status: 'Paid' | 'Pending' | 'Overdue';
  agentId?: string;
}

interface ClientLedgerEntry {
  id: string;
  userEmail: string;
  type: 'TOKEN_DEDUCTION' | 'TOKEN_ADDITION' | 'PLAN_CHANGE' | 'STATUS_CHANGE' | 'INVOICE_ISSUED' | 'ACCOUNT_CREATED';
  amount?: number;
  description: string;
  timestamp: string;
  referenceId?: string;
}

interface InboxEntry {
  id: string;
  refId: string;
  sender: string;
  email: string;
  receivedAt: string;
  status: 'UNREAD' | 'READ' | 'PROCESSED';
  type: 'EMAIL' | 'WEB_RETURN';
  content: string;
  details?: any;
}

interface ActivityLog {
  id: string;
  timestamp: string;
  user: string;
  userId?: string;
  action: string;
  details: string;
  type: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS';
}

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'PENDING' | 'COMPLETED';
  dueDate: string;
  agentId: string;
  prospectId?: string;
  createdAt: string;
}

interface Agent {
  id: string;
  name: string;
  email: string;
  title: string;
  role: 'ADMIN' | 'AGENT';
  joinedAt: string;
  status: 'ACTIVE' | 'INACTIVE';
  password?: string;
}

interface Ticket {
  id: string;
  subject: string;
  sender: string;
  email: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'CLOSED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  createdAt: string;
  lastUpdate: string;
  messages: {
    sender: string;
    body: string;
    timestamp: string;
  }[];
}

type AdminView = 'overview' | 'accounts' | 'invoicing' | 'prospects' | 'prospectQueue' | 'agentBank' | 'inbox' | 'queue' | 'adminFunctions' | 'tasks';

interface EmailMessage {
  id: string;
  from: string;
  to: string;
  cc?: string;
  bcc?: string;
  subject: string;
  body: string;
  timestamp: string;
  status: 'UNREAD' | 'READ' | 'ARCHIVED' | 'TRASH';
  folder: 'INBOX' | 'SENT' | 'TRASH' | 'ARCHIVE' | 'HELPDESK';
  attachments?: string[];
}

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState<AdminView>('overview');
  const [emails, setEmails] = useState<EmailMessage[]>([]);
  const [emailMonthFilter, setEmailMonthFilter] = useState<string>('all');
  const [activeMailFolder, setActiveMailFolder] = useState<'INBOX' | 'SENT' | 'TRASH' | 'ARCHIVE' | 'HELPDESK'>('INBOX');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<EmailMessage | null>(null);
  const [floatingEmails, setFloatingEmails] = useState<{email: EmailMessage, isMinimized: boolean, position: {x: number, y: number}}[]>([]);
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [composeData, setComposeData] = useState({ to: '', cc: '', bcc: '', subject: '', body: '' });
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [prospectMonthFilter, setProspectMonthFilter] = useState<string>('all');
  const [leadSourceMonthFilter, setLeadSourceMonthFilter] = useState<string>('all');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [inbox, setInbox] = useState<InboxEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserAccount | null>(null);
  const [selectedProspect, setSelectedProspect] = useState<Prospect | null>(null);
  const [editProspectPhone, setEditProspectPhone] = useState('');
  const [editProspectPhone2, setEditProspectPhone2] = useState('');
  const [editProspectDetails, setEditProspectDetails] = useState('');
  const [editProspectName, setEditProspectName] = useState('');
  const [editProspectEmail, setEditProspectEmail] = useState('');
  const [editProspectAddress, setEditProspectAddress] = useState('');
  const [editProspectConfirmed, setEditProspectConfirmed] = useState(false);

  useEffect(() => {
    if (selectedProspect) {
      setEditProspectPhone(selectedProspect.contactPhone || '');
      setEditProspectPhone2(selectedProspect.contactPhone2 || '');
      setEditProspectDetails(selectedProspect.details || '');
      setEditProspectName(selectedProspect.name || '');
      setEditProspectEmail(selectedProspect.email || '');
      setEditProspectAddress(selectedProspect.address || '');
      setEditProspectConfirmed(selectedProspect.isConfirmed || false);
    }
  }, [selectedProspect?.id]);
  const [showLeadSources, setShowLeadSources] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditClientModal, setShowEditClientModal] = useState(false);
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [selectedQueueItem, setSelectedQueueItem] = useState<any>(null);
  const [processingAccount, setProcessingAccount] = useState('');
  const [newClient, setNewClient] = useState({
    email: '',
    orgName: '',
    plan: 'TRIAL',
    initialTokens: 1,
    contactPhone: ''
  });
  const [editClientData, setEditClientData] = useState<UserAccount | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invoiceEditData, setInvoiceEditData] = useState<Partial<Invoice>>({});
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedDetailsItem, setSelectedDetailsItem] = useState<any>(null);
  const [editVerificationDetails, setEditVerificationDetails] = useState('');
  const [editVerificationName, setEditVerificationName] = useState('');
  const [editVerificationEmail, setEditVerificationEmail] = useState('');
  const [editVerificationPhone, setEditVerificationPhone] = useState('');
  const [editVerificationAddress, setEditVerificationAddress] = useState('');
  const [editVerificationConfirmed, setEditVerificationConfirmed] = useState(false);

  useEffect(() => {
    if (selectedDetailsItem) {
      setEditVerificationDetails(selectedDetailsItem.fullData?.details || '');
      setEditVerificationName(selectedDetailsItem.applicant || '');
      setEditVerificationEmail(selectedDetailsItem.fullData?.recipientEmail || '');
      setEditVerificationPhone(selectedDetailsItem.fullData?.phone || '');
      setEditVerificationAddress(selectedDetailsItem.fullData?.address || '');
      setEditVerificationConfirmed(selectedDetailsItem.fullData?.isConfirmed || false);
    }
  }, [selectedDetailsItem?.id]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [queue, setQueue] = useState<any[]>([]);
  const [campaignEmail, setCampaignEmail] = useState('');
  const [isSendingCampaign, setIsSendingCampaign] = useState(false);
  const [isSendingProspectMarketing, setIsSendingProspectMarketing] = useState(false);
  const [showCreateInvoiceModal, setShowCreateInvoiceModal] = useState(false);
  const [newInvoiceData, setNewInvoiceData] = useState({
    clientEmail: '',
    plan: 'PERSONAL'
  });
  const [agents, setAgents] = useState<Agent[]>([]);
  const [showCreateAgentModal, setShowCreateAgentModal] = useState(false);
  const [enriching, setEnriching] = useState<string | null>(null);
  const [isSyncingAll, setIsSyncingAll] = useState(false);

  const enrichProspect = async (prospect: Prospect) => {
    setEnriching(prospect.id);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      
      const missingFields = [];
      if (!prospect.email) missingFields.push('email');
      if (!prospect.contactPhone) missingFields.push('phone');
      if (!prospect.company || prospect.company === prospect.name) missingFields.push('company');
      
      if (missingFields.length === 0) {
        setEnriching(null);
        return;
      }

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Find the following missing information for the prospect: ${prospect.name}, Company: ${prospect.company}, Location: ${prospect.address}. Missing fields to find: ${missingFields.join(', ')}. Return a JSON object with the found fields. If a field is not found, omit it from the JSON.`,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              email: { type: Type.STRING },
              phone: { type: Type.STRING },
              company: { type: Type.STRING }
            }
          }
        },
      });
      
      const text = response.text?.trim();
      if (text) {
        try {
          const data = JSON.parse(text);
          const updatedFields: string[] = [];
          const updates: Partial<Prospect> = {};
          
          if (data.email && data.email !== prospect.email) {
            updates.email = data.email;
            updatedFields.push('email');
          }
          if (data.phone && data.phone !== prospect.contactPhone) {
            updates.contactPhone = data.phone;
            updatedFields.push('contactPhone');
          }
          if (data.company && data.company !== prospect.company) {
            updates.company = data.company;
            updatedFields.push('company');
          }
          
          if (updatedFields.length > 0) {
            setProspects(prev => {
              const updated = prev.map(p => {
                if (p.id === prospect.id) {
                  return {
                    ...p,
                    ...updates,
                    updatedFields: [...new Set([...(p.updatedFields || []), ...updatedFields])]
                  };
                }
                return p;
              });
              localStorage.setItem('wv_prospects', JSON.stringify(updated));
              return updated;
            });
          }
        } catch (e) {
          console.error("Failed to parse JSON from Gemini", e);
        }
      }
    } catch (error) {
      console.error("Enrichment error:", error);
    } finally {
      setEnriching(null);
    }
  };

  const syncAllProspects = async () => {
    setIsSyncingAll(true);
    // Find prospects that are missing an email
    const prospectsToSync = prospects.filter(p => !p.email || p.email.trim() === '');
    
    if (prospectsToSync.length === 0) {
      showNotification('No prospects missing emails to sync.', 'INFO');
      setIsSyncingAll(false);
      return;
    }

    showNotification(`Starting sync for ${prospectsToSync.length} prospects...`, 'INFO');
    
    for (const prospect of prospectsToSync) {
      await enrichProspect(prospect);
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    showNotification('Finished syncing prospect details.', 'SUCCESS');
    setIsSyncingAll(false);
  };
  const [newAgentData, setNewAgentData] = useState({
    name: '',
    username: '',
    email: '',
    title: 'Client Support Representative',
    role: 'AGENT' as 'ADMIN' | 'AGENT'
  });
  const [notification, setNotification] = useState<{message: string, type: 'SUCCESS' | 'ERROR' | 'INFO'} | null>(null);

  const showNotification = (message: string, type: 'SUCCESS' | 'ERROR' | 'INFO' = 'SUCCESS') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };
  const [currentAdmin, setCurrentAdmin] = useState<{name: string, id: string, role: string} | null>(null);
  const [adminSubTab, setAdminSubTab] = useState<'agents' | 'logs' | 'tokens' | 'prospects'>('agents');
  const [clientLedger, setClientLedger] = useState<ClientLedgerEntry[]>([]);
  const [showDisclaimer, setShowDisclaimer] = useState<boolean>(false);
  const adminEmail = localStorage.getItem('wv_admin_email') || 'Admin';

  const INVOICE_PLANS = {
    PERSONAL: { amount: 25.00, tokens: 1, label: 'Personal - $25.00 / 1 Token' },
    PRO: { amount: 350.00, tokens: 25, label: 'Business Pro - $350.00 / 25 Tokens' },
    PREMIUM: { amount: 750.00, tokens: 75, label: 'Business Premium - $750.00 / 75 Tokens' }
  };

  useEffect(() => {
    const helpdeskEmails = emails.filter(e => e.from.toLowerCase() === 'helpdesk@weverify.works' && e.folder === 'INBOX');
    
    helpdeskEmails.forEach(email => {
      // Check if ticket already exists for this email id
      if (!tickets.find(t => t.id === `TKT-${email.id}`)) {
        const newTicket: Ticket = {
          id: `TKT-${email.id}`,
          subject: email.subject,
          sender: email.from,
          email: email.from,
          status: 'OPEN',
          priority: 'MEDIUM',
          createdAt: email.timestamp,
          lastUpdate: new Date().toLocaleString(),
          messages: [{
            sender: email.from,
            body: email.body,
            timestamp: email.timestamp
          }]
        };
        
        setTickets(prev => [newTicket, ...prev]);
        
        // Auto-reply
        const autoReply: EmailMessage = {
          id: `RE-${Date.now()}`,
          from: 'helpdesk@weverify.works',
          to: email.from,
          subject: `Re: ${email.subject} [Ticket #${newTicket.id}]`,
          body: `Hello,\n\nYour helpdesk ticket #${newTicket.id} has been created successfully. Our team will review your request and get back to you shortly.\n\nThank you for choosing WeVerify.works.`,
          timestamp: new Date().toLocaleString(),
          status: 'READ',
          folder: 'SENT'
        };
        
        setEmails(prev => [autoReply, ...prev]);
        logAction('Helpdesk Ticket Created', `New ticket #${newTicket.id} generated from ${email.from}`, 'SUCCESS');
      }
    });
  }, [emails, tickets]);

  const handleCreateAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    const newAgent: Agent = {
      id: `AGT-${Math.floor(1000 + Math.random() * 9000)}`,
      ...newAgentData,
      joinedAt: new Date().toLocaleDateString(),
      status: 'ACTIVE',
      password: 'passwordverified'
    };
    const updatedAgents = [newAgent, ...agents];
    setAgents(updatedAgents);
    localStorage.setItem('wv_agents', JSON.stringify(updatedAgents));
    logAction('Create Agent', `Added new agent ${newAgent.name} (${newAgent.id})`, 'SUCCESS');
    setShowCreateAgentModal(false);
    setNewAgentData({ name: '', username: '', email: '', title: 'Client Support Representative', role: 'AGENT' });

    // Send Welcome Email to Agent
    try {
      const adminName = localStorage.getItem('wv_admin_name') || 'Admin User';
      const message = `Welcome to the WeVerify.works Support Team!\n\nYour agent account has been successfully provisioned. You can now access the administrative dashboard to manage client nodes and support tickets.\n\nLogin Credentials:\nEmail: ${newAgent.email}\nTemporary Password: passwordverified\nRole: ${newAgent.role}\n\nPlease log in at https://weverify.works/admin and change your password immediately.\n\nCONFIDENTIALITY NOTICE: The content of this email is intended for the person or entity to which it is addressed only. This email may contain confidential information. If you are not the person to whom this message is addressed, be aware that any use, reproduction, or distribution of this message is strictly prohibited.`;
      const html = `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px; max-width: 600px; margin: 0 auto;">
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="https://www.ampcgfoundation.pro/img/weverifyworkslogo.jpg" alt="WeVerify Logo" style="max-width: 150px;" />
          </div>
          <h2 style="color: #333;">Welcome to the WeVerify.works Support Team!</h2>
          <p style="font-size: 16px; color: #555;">Your agent account has been successfully provisioned. You can now access the administrative dashboard to manage client nodes and support tickets.</p>
          
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #0f172a;">Login Credentials:</h3>
            <ul style="list-style: none; padding: 0;">
              <li><strong>Email:</strong> ${newAgent.email}</li>
              <li><strong>Temporary Password:</strong> passwordverified</li>
              <li><strong>Role:</strong> ${newAgent.role}</li>
            </ul>
          </div>
          
          <p style="font-size: 16px; color: #555;">Please log in at <a href="https://weverify.works/admin" style="color: #14b8a6;">weverify.works/admin</a> and change your password immediately.</p>
          
          <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;" />
          <p style="font-size: 14px; color: #888;">Contact Details:<br />
          Email: <a href="mailto:clientsupport@weverify.works" style="color: #14b8a6;">clientsupport@weverify.works</a><br />
          Helpdesk: <a href="https://helpdesk.weverify.works" style="color: #14b8a6;">https://helpdesk.weverify.works</a></p>
          <div style="margin-top: 24px; padding-top: 16px; border-top: 1px dashed #eee; font-size: 11px; line-height: 1.4; color: #999;">
            <strong>CONFIDENTIALITY NOTICE:</strong> The content of this email is intended for the person or entity to which it is addressed only. This email may contain confidential information. If you are not the person to whom this message is addressed, be aware that any use, reproduction, or distribution of this message is strictly prohibited.
          </div>
        </div>
      `;

      await fetch("/api/email/send", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: newAgent.email,
          subject: "Welcome to the WeVerify.works Team - Agent Account Provisioned",
          fromName: adminName,
          text: message,
          html: html
        })
      });
      logAction('Email Sent', `Welcome email sent to agent ${newAgent.email}`, 'SUCCESS');
    } catch (err) {
      console.error("Failed to send agent welcome email", err);
      logAction('Email Failed', `Failed to send welcome email to agent ${newAgent.email}`, 'ERROR');
    }
  };

  const toggleAgentStatus = (id: string) => {
    const updatedAgents = agents.map(a => a.id === id ? { ...a, status: a.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' } : a);
    setAgents(updatedAgents);
    localStorage.setItem('wv_agents', JSON.stringify(updatedAgents));
    const agent = agents.find(a => a.id === id);
    logAction('Toggle Agent Status', `Changed status for ${agent?.name} to ${agent?.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'}`, 'WARNING');
  };
  const handleManualInvoiceCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const client = users.find(u => u.email === newInvoiceData.clientEmail);
    if (!client) return;

    const plan = INVOICE_PLANS[newInvoiceData.plan as keyof typeof INVOICE_PLANS];
    
    handleCreateInvoice(client, plan.tokens, plan.amount);
    
    // Custom alert as per requirement
    showNotification(`Invoice generated for ${client.orgName}.\nAmount: $${plan.amount.toFixed(2)}\nDue upon Receipt.\nPlease submit payment at payment.weverify.works`);
    
    setShowCreateInvoiceModal(false);
    setNewInvoiceData({ clientEmail: '', plan: 'PERSONAL' });
  };

  const handleSendCampaign = async () => {
    if (!campaignEmail) return;
    
    const adminName = localStorage.getItem('wv_admin_name') || 'Admin User';
    const adminId = localStorage.getItem('wv_admin_id') || 'SYS-001';
    
    setIsSendingCampaign(true);
    try {
      const response = await fetch('/api/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: campaignEmail,
          subject: 'Simplifying Your Verification Process - WeVerify.works',
          fromName: adminName,
          html: `
            <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
              <div style="background-color: #0f172a; padding: 24px; text-align: center;">
                 <img src="https://www.ampcgfoundation.pro/img/weverifyworkslogo.jpg" alt="WeVerify.works Logo" style="max-height: 60px; margin-bottom: 16px; border-radius: 8px;">
                 <h1 style="color: #ffffff; margin: 0; font-size: 24px; letter-spacing: -0.5px;">WeVerify<span style="color: #14b8a6;">.works</span></h1>
              </div>
              
              <div style="padding: 32px;">
                <h2 style="color: #0f172a; margin-top: 0; font-size: 20px;">Simplify Your Income, Asset, and Residence Verifications</h2>
                <p style="color: #475569; line-height: 1.6;">
                  WeVerify.works offers a streamlined service to handle your entire verification process from start to finish. 
                  Our platform provides complete verification reports with all the details you need, saving you valuable time, resources, and postage!
                </p>
                
                <div style="background-color: #f0fdfa; border: 1px dashed #14b8a6; padding: 24px; border-radius: 8px; margin: 24px 0; text-align: center;">
                  <h3 style="margin: 0 0 12px 0; font-size: 18px; color: #0f766e; font-weight: bold;">Exclusive Free Trial Offer</h3>
                  <p style="margin: 0; font-size: 14px; color: #0d9488;">
                    Experience the efficiency of WeVerify.works today. Sign up now to get a free trial token!
                  </p>
                </div>

                <div style="margin-top: 32px; text-align: center;">
                  <a href="${window.location.origin}/#/register" style="background-color: #0f172a; color: #ffffff; padding: 12px 24px; border-radius: 9999px; text-decoration: none; font-weight: bold; font-size: 14px;">Start Your Free Trial</a>
                </div>

                <div style="margin-top: 32px; text-align: center; border-top: 1px solid #e5e7eb; padding-top: 24px;">
                  <p style="color: #475569; font-size: 14px; margin-bottom: 8px;">For more information and customer testimonials, please visit:</p>
                  <a href="https://www.weverify.works" style="color: #0f766e; font-weight: bold; text-decoration: none; font-size: 16px;">www.weverify.works</a>
                </div>
              </div>
              
              <div style="background-color: #f8fafc; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
                <p style="margin: 0; font-size: 12px; color: #94a3b8;">&copy; ${new Date().getFullYear()} WeVerify.works. All rights reserved.</p>
              </div>
            </div>
          `
        }),
      });

      if (response.ok) {
        logAction('Campaign Email Sent', `Sent marketing info to ${campaignEmail}`, 'SUCCESS');
        
        // Detailed Transaction Log
        const transactionDetail = `OUTBOUND_MARKETING: Email sent to ${campaignEmail} via System SMTP. Template: Institutional_Outreach_v1. Origin: ${adminId}`;
        logAction('Transaction Detail', transactionDetail, 'INFO');

        setCampaignEmail('');
        
        // Add to prospects if not exists
        let prospectId = '';
        const existingProspect = prospects.find(p => p.email === campaignEmail);
        
        if (!existingProspect) {
          prospectId = `PRP-${Date.now()}`;
          const newProspect: Prospect = {
            id: prospectId,
            name: campaignEmail.split('@')[0],
            email: campaignEmail,
            company: campaignEmail.split('@')[1].split('.')[0].toUpperCase(),
            status: 'Contacted',
            value: 1000,
            lastContact: new Date().toISOString().split('T')[0],
            agentId: undefined
          };
          const updatedProspects = [newProspect, ...prospects];
          setProspects(updatedProspects);
          localStorage.setItem('wv_prospects', JSON.stringify(updatedProspects));
        } else {
          prospectId = existingProspect.id;
          const updatedProspects = prospects.map(p => {
            if (p.id === prospectId) {
              const newLog = {
                timestamp: new Date().toLocaleString(),
                action: 'Marketing Email Sent',
                details: `Sent marketing info to ${campaignEmail}`
              };
              return {
                ...p,
                status: p.status === 'New' ? 'Contacted' : p.status,
                logs: [newLog, ...(p.logs || [])],
                lastContact: new Date().toISOString().split('T')[0]
              };
            }
            return p;
          });
          setProspects(updatedProspects);
          localStorage.setItem('wv_prospects', JSON.stringify(updatedProspects));
        }

        // Log to global activity stream
        logAction('Initial Email Sent', `Sent marketing outreach email to ${campaignEmail}`, 'SUCCESS');

        // Auto-generate tasks for Followup and Free Trial
        const now = new Date();
        const followupDate = new Date(now);
        followupDate.setDate(now.getDate() + 2); // 2 days later

        const trialDate = new Date(now);
        trialDate.setDate(now.getDate() + 1); // 1 day later

        const newTasks: Task[] = [
          {
            id: `TSK-${Date.now()}-1`,
            title: `Followup phone call: ${campaignEmail}`,
            description: `Conduct a discovery call with the prospect at ${campaignEmail} regarding the sent marketing materials.`,
            status: 'PENDING',
            dueDate: followupDate.toISOString().split('T')[0],
            agentId: adminId,
            prospectId: prospectId,
            createdAt: now.toISOString()
          },
          {
            id: `TSK-${Date.now()}-2`,
            title: `Free trial invitation: ${campaignEmail}`,
            description: `Send a personalized free trial invitation code and setup guide to ${campaignEmail}.`,
            status: 'PENDING',
            dueDate: trialDate.toISOString().split('T')[0],
            agentId: adminId,
            prospectId: prospectId,
            createdAt: now.toISOString()
          }
        ];

        const updatedTasks = [...newTasks, ...tasks];
        setTasks(updatedTasks);
        localStorage.setItem('wv_tasks', JSON.stringify(updatedTasks));
        
        logAction('Workflow Triggered', `Auto-generated 2 follow-up tasks for ${campaignEmail}`, 'SUCCESS');
      } else {
        throw new Error('Failed to send email');
      }
    } catch (error) {
      console.error('Campaign Error:', error);
      logAction('Campaign Email Failed', `Failed to send to ${campaignEmail}`, 'ERROR');
    } finally {
      setIsSendingCampaign(false);
    }
  };

  const handleClaimProspect = (prospectId: string) => {
    const adminId = localStorage.getItem('wv_admin_id') || 'SYS-001';
    const updatedProspects = prospects.map(p => {
      if (p.id === prospectId) {
        const newLog = {
          timestamp: new Date().toLocaleString(),
          action: 'Prospect Claimed',
          details: `Prospect claimed by agent ${adminId}`
        };
        return { ...p, agentId: adminId, logs: [newLog, ...(p.logs || [])] };
      }
      return p;
    });
    setProspects(updatedProspects);
    localStorage.setItem('wv_prospects', JSON.stringify(updatedProspects));
    logAction('Claim Prospect', `Agent ${adminId} claimed prospect ${prospectId}`, 'SUCCESS');
    showNotification('Prospect successfully added to your individual bank.');
  };

  const handleBulkUploadProspects = (data: string) => {
    try {
      const lines = data.split('\n');
      const newProspects: Prospect[] = [];
      const now = new Date().toISOString();
      
      lines.forEach(line => {
        if (!line.trim()) return;
        
        // Simple CSV parser to handle quoted strings
        const parts = line.split(',').map(part => part.trim().replace(/^"|"$/g, ''));
        const [name, phone, location, email] = parts;

        if (name) {
          const id = `PRP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          newProspects.push({
            id,
            name: name,
            email: email || '',
            company: name,
            contactPhone: phone || '',
            address: location || '',
            status: 'New',
            value: 1000,
            lastContact: now.split('T')[0],
            agentId: undefined,
            createdAt: now
          });
        }
      });

      if (newProspects.length > 0) {
        const updatedProspects = [...newProspects, ...prospects];
        setProspects(updatedProspects);
        localStorage.setItem('wv_prospects', JSON.stringify(updatedProspects));
        logAction('Bulk Upload Prospects', `Uploaded ${newProspects.length} prospects to queue`, 'SUCCESS');
        showNotification(`Successfully uploaded ${newProspects.length} prospects to the queue.`);
      } else {
        showNotification('No valid prospects found in the input. Please use "Name, Phone, Location" format.', 'ERROR');
      }
    } catch (error) {
      console.error('Bulk Upload Error:', error);
      showNotification('Failed to parse prospect list. Please ensure it is in "Name, Phone, Location" format.', 'ERROR');
    }
  };

  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];
        
        const newProspects: Prospect[] = [];
        const now = new Date().toISOString();
        
        // Skip header row if it exists
        const firstCell = data[0]?.[0]?.toString().toLowerCase();
        const startRow = (firstCell === 'name' || firstCell === 'property') ? 1 : 0;
        
        for (let i = startRow; i < data.length; i++) {
          const row = data[i];
          if (!row || row.length === 0) continue;
          
          const name = row[0]?.toString().trim();
          const phone = row[1]?.toString().trim();
          const location = row[2]?.toString().trim();
          const email = row[3]?.toString().trim();
          
          if (name) {
            const id = `PRP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            newProspects.push({
              id,
              name: name,
              email: email || '',
              company: name,
              contactPhone: phone || '',
              address: location || '',
              status: 'New',
              value: 1000,
              lastContact: now.split('T')[0],
              agentId: undefined,
              createdAt: now
            });
          }
        }

        if (newProspects.length > 0) {
          const updatedProspects = [...newProspects, ...prospects];
          setProspects(updatedProspects);
          localStorage.setItem('wv_prospects', JSON.stringify(updatedProspects));
          logAction('Excel Upload Prospects', `Uploaded ${newProspects.length} prospects from Excel`, 'SUCCESS');
          showNotification(`Successfully uploaded ${newProspects.length} prospects from Excel.`);
        } else {
          showNotification('No valid prospects found in the Excel file. Please ensure the first column contains Names.', 'ERROR');
        }
      } catch (error) {
        console.error('Excel Upload Error:', error);
        showNotification('Failed to parse Excel file. Please ensure it is a valid .xlsx or .xls file.', 'ERROR');
      }
    };
    reader.readAsBinaryString(file);
    // Reset input
    e.target.value = '';
  };

  const handleSendProspectMarketingEmail = async (prospect: Prospect) => {
    if (!prospect.email) return;
    
    const adminName = localStorage.getItem('wv_admin_name') || 'Admin User';
    const adminId = localStorage.getItem('wv_admin_id') || 'SYS-001';
    
    setIsSendingProspectMarketing(true);
    try {
      const response = await fetch('/api/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: prospect.email,
          subject: 'Simplifying Your Verification Process - WeVerify.works',
          fromName: adminName,
          html: `
            <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
              <div style="background-color: #0f172a; padding: 24px; text-align: center;">
                 <img src="https://www.ampcgfoundation.pro/img/weverifyworkslogo.jpg" alt="WeVerify.works Logo" style="max-height: 60px; margin-bottom: 16px; border-radius: 8px;">
                 <h1 style="color: #ffffff; margin: 0; font-size: 24px; letter-spacing: -0.5px;">WeVerify<span style="color: #14b8a6;">.works</span></h1>
              </div>
              
              <div style="padding: 32px;">
                <h2 style="color: #0f172a; margin-top: 0; font-size: 20px;">Simplify Your Income, Asset, and Residence Verifications</h2>
                <p style="color: #475569; line-height: 1.6;">
                  WeVerify.works offers a streamlined service to handle your entire verification process from start to finish. 
                  Our platform provides complete verification reports with all the details you need, saving you valuable time, resources, and postage!
                </p>
                
                <div style="background-color: #f0fdfa; border: 1px dashed #14b8a6; padding: 24px; border-radius: 8px; margin: 24px 0; text-align: center;">
                  <h3 style="margin: 0 0 12px 0; font-size: 18px; color: #0f766e; font-weight: bold;">Exclusive Free Trial Offer</h3>
                  <p style="margin: 0; font-size: 14px; color: #0d9488;">
                    Experience the efficiency of WeVerify.works today. Sign up now to get a free trial token!
                  </p>
                </div>

                <div style="margin-top: 32px; text-align: center;">
                  <a href="${window.location.origin}/#/register" style="background-color: #0f172a; color: #ffffff; padding: 12px 24px; border-radius: 9999px; text-decoration: none; font-weight: bold; font-size: 14px;">Start Your Free Trial</a>
                </div>

                <div style="margin-top: 32px; text-align: center; border-top: 1px solid #e5e7eb; padding-top: 24px;">
                  <p style="color: #475569; font-size: 14px; margin-bottom: 8px;">For more information and customer testimonials, please visit:</p>
                  <a href="https://www.weverify.works" style="color: #0f766e; font-weight: bold; text-decoration: none; font-size: 16px;">www.weverify.works</a>
                </div>
              </div>
              
              <div style="background-color: #f8fafc; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
                <p style="margin: 0; font-size: 12px; color: #94a3b8;">&copy; ${new Date().getFullYear()} WeVerify.works. All rights reserved.</p>
              </div>
            </div>
          `
        }),
      });

      if (response.ok) {
        logAction('Campaign Email Sent', `Sent marketing info to ${prospect.email}`, 'SUCCESS');
        
        // Detailed Transaction Log
        const transactionDetail = `OUTBOUND_MARKETING: Email sent to ${prospect.email} via System SMTP. Template: Institutional_Outreach_v1. Origin: ${adminId}`;
        logAction('Transaction Detail', transactionDetail, 'INFO');

        // Update prospect log
        const updatedProspects = prospects.map(p => {
          if (p.id === prospect.id) {
            const newLog = {
              timestamp: new Date().toLocaleString(),
              action: 'Marketing Email Sent',
              details: `Marketing outreach email sent to ${prospect.email}`
            };
            return { 
              ...p, 
              status: p.status === 'New' ? 'Contacted' : p.status,
              logs: [newLog, ...(p.logs || [])], 
              lastContact: new Date().toISOString().split('T')[0] 
            };
          }
          return p;
        });
        setProspects(updatedProspects);
        localStorage.setItem('wv_prospects', JSON.stringify(updatedProspects));
        
        // Log to global activity stream
        logAction('Initial Email Sent', `Sent marketing outreach email to ${prospect.email}`, 'SUCCESS');

        showNotification(`Marketing email successfully sent to ${prospect.email}`);
      } else {
        throw new Error('Failed to send email');
      }
    } catch (error) {
      console.error('Marketing Email Error:', error);
      showNotification('Failed to send marketing email. Please check system logs.', 'ERROR');
    } finally {
      setIsSendingProspectMarketing(false);
    }
  };

  const handleSendBulkInitialEmail = async () => {
    const adminName = localStorage.getItem('wv_admin_name') || 'Admin User';
    const adminId = localStorage.getItem('wv_admin_id') || 'SYS-001';
    
    // Filter prospects that have an email, are 'New' (uncontacted), and haven't been sent an email yet
    const uniqueEmails = new Set<string>();
    const prospectsToEmail = prospects.filter(p => {
      // Only send to 'New' prospects to avoid sending multiple times
      if (p.status !== 'New' || !p.email) return false;
      const emailLower = p.email.toLowerCase().trim();
      if (uniqueEmails.has(emailLower)) return false;
      uniqueEmails.add(emailLower);
      return true;
    });

    if (prospectsToEmail.length === 0) {
      showNotification("No new, uncontacted prospects with valid emails found.", "INFO");
      return;
    }

    setIsSendingCampaign(true);
    let successCount = 0;
    let failCount = 0;

    const updatedProspects = [...prospects];
    const newTasks: Task[] = [];
    const now = new Date();

    for (const prospect of prospectsToEmail) {
      try {
        const response = await fetch('/api/email/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to: prospect.email,
            subject: 'Simplifying Your Verification Process - WeVerify.works',
            fromName: adminName,
            html: `
              <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
                <div style="background-color: #0f172a; padding: 24px; text-align: center;">
                   <img src="https://www.ampcgfoundation.pro/img/weverifyworkslogo.jpg" alt="WeVerify.works Logo" style="max-height: 60px; margin-bottom: 16px; border-radius: 8px;">
                   <h1 style="color: #ffffff; margin: 0; font-size: 24px; letter-spacing: -0.5px;">WeVerify<span style="color: #14b8a6;">.works</span></h1>
                </div>
                
                <div style="padding: 32px;">
                  <h2 style="color: #0f172a; margin-top: 0; font-size: 20px;">Simplify Your Income, Asset, and Residence Verifications</h2>
                  <p style="color: #475569; line-height: 1.6;">
                    WeVerify.works offers a streamlined service to handle your entire verification process from start to finish. 
                    Our platform provides complete verification reports with all the details you need, saving you valuable time, resources, and postage!
                  </p>
                  
                  <div style="background-color: #f0fdfa; border: 1px dashed #14b8a6; padding: 24px; border-radius: 8px; margin: 24px 0; text-align: center;">
                    <h3 style="margin: 0 0 12px 0; font-size: 18px; color: #0f766e; font-weight: bold;">Exclusive Free Trial Offer</h3>
                    <p style="margin: 0; font-size: 14px; color: #0d9488;">
                      Experience the efficiency of WeVerify.works today. Sign up now to get a free trial token!
                    </p>
                  </div>

                  <div style="margin-top: 32px; text-align: center;">
                    <a href="${window.location.origin}/#/register" style="background-color: #0f172a; color: #ffffff; padding: 12px 24px; border-radius: 9999px; text-decoration: none; font-weight: bold; font-size: 14px;">Start Your Free Trial</a>
                  </div>
                </div>

                <div style="margin-top: 32px; text-align: center; border-top: 1px solid #e5e7eb; padding-top: 24px;">
                  <p style="color: #475569; font-size: 14px; margin-bottom: 8px;">For more information and customer testimonials, please visit:</p>
                  <a href="https://www.weverify.works" style="color: #0f766e; font-weight: bold; text-decoration: none; font-size: 16px;">www.weverify.works</a>
                </div>
              </div>
              
              <div style="background-color: #f8fafc; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
                <p style="margin: 0; font-size: 12px; color: #94a3b8;">&copy; ${new Date().getFullYear()} WeVerify.works. All rights reserved.</p>
              </div>
            `
          }),
        });

        if (response.ok) {
          successCount++;
          
          // Update prospect status
          const pIndex = updatedProspects.findIndex(p => p.id === prospect.id);
          if (pIndex !== -1) {
            const newLog = {
              timestamp: new Date().toLocaleString(),
              action: 'Bulk Campaign Email Sent',
              details: `Sent marketing info to ${prospect.email}`
            };
            updatedProspects[pIndex] = {
              ...updatedProspects[pIndex],
              status: 'Contacted',
              logs: [newLog, ...(updatedProspects[pIndex].logs || [])],
              lastContact: new Date().toISOString().split('T')[0]
            };
          }

          // Log to global activity stream
          logAction('Initial Email Sent', `Sent marketing outreach email to ${prospect.email}`, 'SUCCESS');

          // Auto-generate tasks for Followup and Free Trial
          const followupDate = new Date(now);
          followupDate.setDate(now.getDate() + 2); // 2 days later

          const trialDate = new Date(now);
          trialDate.setDate(now.getDate() + 1); // 1 day later

          newTasks.push(
            {
              id: `TSK-${Date.now()}-${successCount}-1`,
              title: `Followup phone call: ${prospect.email}`,
              description: `Conduct a discovery call with the prospect at ${prospect.email} regarding the sent marketing materials.`,
              status: 'PENDING',
              dueDate: followupDate.toISOString().split('T')[0],
              agentId: adminId,
              prospectId: prospect.id,
              createdAt: now.toISOString()
            },
            {
              id: `TSK-${Date.now()}-${successCount}-2`,
              title: `Free trial invitation: ${prospect.email}`,
              description: `Send a personalized free trial invitation code and setup guide to ${prospect.email}.`,
              status: 'PENDING',
              dueDate: trialDate.toISOString().split('T')[0],
              agentId: adminId,
              prospectId: prospect.id,
              createdAt: now.toISOString()
            }
          );
        } else {
          failCount++;
        }
      } catch (error) {
        console.error('Bulk Campaign Error for', prospect.email, error);
        failCount++;
      }
    }

    setProspects(updatedProspects);
    localStorage.setItem('wv_prospects', JSON.stringify(updatedProspects));

    if (newTasks.length > 0) {
      const allTasks = [...newTasks, ...tasks];
      setTasks(allTasks);
      localStorage.setItem('wv_tasks', JSON.stringify(allTasks));
    }

    setIsSendingCampaign(false);
    showNotification(`Bulk campaign complete. Sent: ${successCount}, Failed: ${failCount}`, successCount > 0 ? 'SUCCESS' : 'ERROR');
    logAction('Bulk Campaign', `Sent ${successCount} emails, ${failCount} failed.`, 'INFO');
  };

  const [isSearching, setIsSearching] = useState(false);
  const [isSearchingVerification, setIsSearchingVerification] = useState(false);

  const logAction = (action: string, details: string, type: ActivityLog['type'] = 'INFO') => {
    const adminName = localStorage.getItem('wv_admin_name') || 'Admin User';
    const adminId = localStorage.getItem('wv_admin_id') || 'SYS-001';
    
    const newLog: ActivityLog = {
      id: `LOG-${Date.now()}`,
      timestamp: new Date().toLocaleString(),
      user: adminName,
      userId: adminId,
      action,
      details,
      type
    };
    const updatedLogs = [newLog, ...logs].slice(0, 100); // Keep last 100 logs
    setLogs(updatedLogs);
    localStorage.setItem('wv_admin_logs', JSON.stringify(updatedLogs));
  };

  const addToLedger = (userEmail: string, type: ClientLedgerEntry['type'], description: string, amount?: number, referenceId?: string) => {
    const newEntry: ClientLedgerEntry = {
      id: `LEDGER-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      userEmail,
      type,
      amount,
      description,
      timestamp: new Date().toLocaleString(),
      referenceId
    };
    const updatedLedger = [newEntry, ...clientLedger];
    setClientLedger(updatedLedger);
    localStorage.setItem('wv_client_ledger', JSON.stringify(updatedLedger));
  };

  useEffect(() => {
    // Check admin auth
    const isAdminAuth = localStorage.getItem('wv_admin_auth') === 'true';
    if (!isAdminAuth) {
      navigate('/admin/login');
      return;
    }

    const adminName = localStorage.getItem('wv_admin_name') || 'Admin User';
    const adminId = localStorage.getItem('wv_admin_id') || 'SYS-001';
    const adminRole = localStorage.getItem('wv_admin_role') || 'ADMIN';
    setCurrentAdmin({ name: adminName, id: adminId, role: adminRole });

    // Load agents
    const storedAgents: Agent[] = JSON.parse(localStorage.getItem('wv_agents') || '[]');
    if (storedAgents.length === 0 && adminRole === 'ADMIN') {
      // Create initial agent from current admin if none exist
      const initialAgent: Agent = {
        id: adminId,
        name: adminName,
        email: 'admin@weverify.works',
        title: localStorage.getItem('wv_admin_title') || 'System Administrator',
        role: 'ADMIN',
        joinedAt: new Date().toLocaleDateString(),
        status: 'ACTIVE'
      };
      setAgents([initialAgent]);
      localStorage.setItem('wv_agents', JSON.stringify([initialAgent]));
    } else {
      setAgents(storedAgents);
    }

    // Load users from localStorage
    const storedUsers: UserAccount[] = JSON.parse(localStorage.getItem('wv_users') || '[]');
    const usersWithStatus = storedUsers.map(u => ({
      ...u,
      status: u.status || 'ACTIVE',
      accountNumber: u.accountNumber || `WV-${Math.floor(100000 + Math.random() * 900000)}`
    }));
    setUsers(usersWithStatus);
    
    // Update localStorage if any account numbers were generated
    if (storedUsers.some(u => !u.accountNumber)) {
      localStorage.setItem('wv_users', JSON.stringify(usersWithStatus));
    }

    // Load prospects
    const storedProspects = JSON.parse(localStorage.getItem('wv_prospects') || '[]');
    if (storedProspects.length === 0) {
      const initialProspects: Prospect[] = [
        { id: '1', name: 'John Smith', email: 'john@techcorp.com', company: 'TechCorp Solutions', status: 'Qualified', value: 1200, lastContact: '2024-02-20', agentId: adminId, contactPhone: '+1 (555) 123-4567' },
        { id: '2', name: 'Sarah Miller', email: 'sarah@globalverify.net', company: 'Global Verify', status: 'Negotiating', value: 5000, lastContact: '2024-02-25', agentId: adminId, contactPhone: '+1 (555) 987-6543' },
        { id: '3', name: 'Robert Chen', email: 'robert@asiafin.com', company: 'AsiaFin Group', status: 'New', value: 2500, lastContact: '2024-02-26', agentId: adminId, contactPhone: '+1 (555) 555-5555' }
      ];
      setProspects(initialProspects);
      localStorage.setItem('wv_prospects', JSON.stringify(initialProspects));
    } else {
      // Deduplicate by ID and email/name to clean up queue
      const uniqueProspectsMap = new Map<string, Prospect>();
      const seenEmails = new Set<string>();
      
      storedProspects.forEach((p: Prospect) => {
        // Only keep if ID is unique, and if email is present, it's also unique
        if (!uniqueProspectsMap.has(p.id)) {
          if (p.email) {
            if (!seenEmails.has(p.email.toLowerCase())) {
              seenEmails.add(p.email.toLowerCase());
              uniqueProspectsMap.set(p.id, p);
            }
          } else {
            uniqueProspectsMap.set(p.id, p);
          }
        }
      });
      
      const uniqueProspects = Array.from(uniqueProspectsMap.values());
      setProspects(uniqueProspects);
      
      if (uniqueProspects.length !== storedProspects.length) {
        localStorage.setItem('wv_prospects', JSON.stringify(uniqueProspects));
      }
    }

    // Load invoices
    const storedInvoices = JSON.parse(localStorage.getItem('wv_invoices') || '[]');
    if (storedInvoices.length === 0) {
      const initialInvoices: Invoice[] = [
        { id: 'INV-001', clientEmail: 'admin@weverify.works', clientName: 'WeVerify Internal', amount: 0, tokens: 1000, date: '2024-01-15', status: 'Paid', agentId: adminId }
      ];
      setInvoices(initialInvoices);
      localStorage.setItem('wv_invoices', JSON.stringify(initialInvoices));
    } else {
      setInvoices(storedInvoices);
    }

    // Load inbox
    const storedInbox = JSON.parse(localStorage.getItem('wv_inbox') || '[]');
    if (storedInbox.length === 0) {
      const initialInbox: InboxEntry[] = [
        { id: 'INB-001', refId: 'WV-982341', sender: 'Jane Doe', email: 'jane@acme-hr.com', receivedAt: '2024-02-28 09:15', status: 'UNREAD', type: 'EMAIL', content: 'Attached is the verification for John Smith.' },
        { id: 'INB-002', refId: 'WV-482931', sender: 'System', email: 'noreply@weverify.works', receivedAt: '2024-02-28 10:30', status: 'READ', type: 'WEB_RETURN', content: 'Web return submitted via Helpdesk.' }
      ];
      setInbox(initialInbox);
      localStorage.setItem('wv_inbox', JSON.stringify(initialInbox));
    } else {
      setInbox(storedInbox);
    }

    // Load logs
    const storedLogs = JSON.parse(localStorage.getItem('wv_admin_logs') || '[]');
    setLogs(storedLogs);

    // Load tasks
    const storedTasks = JSON.parse(localStorage.getItem('wv_tasks') || '[]');
    setTasks(storedTasks);

    // Load ledger
    const storedLedger = JSON.parse(localStorage.getItem('wv_client_ledger') || '[]');
    setClientLedger(storedLedger);

    // Load queue
    const storedQueue = JSON.parse(localStorage.getItem('wv_queue') || '[]');
    setQueue(storedQueue);

    // Check for disclaimer acceptance
    const disclaimerAccepted = localStorage.getItem(`wv_disclaimer_accepted_${adminEmail}`);
    if (!disclaimerAccepted) {
      setShowDisclaimer(true);
    }
  }, [navigate, adminEmail]);

  const handleAcceptDisclaimer = () => {
    localStorage.setItem(`wv_disclaimer_accepted_${adminEmail}`, 'true');
    setShowDisclaimer(false);
    logAction('Disclaimer Accepted', 'Administrator accepted the Privacy and Acceptable Use Disclaimer', 'SUCCESS');
  };

  useEffect(() => {
    const savedEmails = localStorage.getItem('wv_emails');
    const savedInbox = localStorage.getItem('wv_inbox');
    
    let initialEmails: EmailMessage[] = [];
    
    if (savedEmails) {
      initialEmails = JSON.parse(savedEmails);
    } else {
      initialEmails = [
        {
          id: 'MSG-001',
          from: 'support@stripe.com',
          to: 'admin@weverify.works',
          subject: 'Stripe Account Verification Required',
          body: 'Please verify your business details to continue receiving payouts.',
          timestamp: new Date(Date.now() - 3600000).toLocaleString(),
          status: 'UNREAD',
          folder: 'INBOX'
        },
        {
          id: 'MSG-002',
          from: 'client@globalfinance.com',
          to: 'admin@weverify.works',
          subject: 'Question about Invoice #INV-1234',
          body: 'Hello, I noticed a discrepancy in the token count on our last invoice. Can you please check?',
          timestamp: new Date(Date.now() - 86400000).toLocaleString(),
          status: 'READ',
          folder: 'INBOX'
        }
      ];
    }

    // Migrate old InboxEntry to EmailMessage if needed
    if (savedInbox) {
      const inboxEntries: InboxEntry[] = JSON.parse(savedInbox);
      inboxEntries.forEach(entry => {
        if (!initialEmails.find(e => e.id === entry.id)) {
          initialEmails.push({
            id: entry.id,
            from: entry.email,
            to: 'admin@weverify.works',
            subject: `Verification Return: ${entry.refId}`,
            body: entry.content || `Verification return received for reference ${entry.refId}.`,
            timestamp: entry.receivedAt,
            status: entry.status === 'PROCESSED' ? 'READ' : entry.status,
            folder: 'INBOX',
            attachments: entry.details ? ['Verification_Data.json'] : []
          });
        }
      });
    }

    setEmails(initialEmails);
    localStorage.setItem('wv_emails', JSON.stringify(initialEmails));
  }, []);

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSendingEmail(true);
    
    const adminName = localStorage.getItem('wv_admin_name') || 'Admin User';
    const adminTitle = localStorage.getItem('wv_admin_title') || 'Client Support Representative';
    
    const signatureText = `\n\nBest regards,\n${adminName}\n${adminTitle}\nOnline: www.Weverify.Works\nEmail: clientsupport@weverify.works\n[Shield Logo]\n\nCONFIDENTIALITY NOTICE: The content of this email is intended for the person or entity to which it is addressed only. This email may contain confidential information. If you are not the person to whom this message is addressed, be aware that any use, reproduction, or distribution of this message is strictly prohibited.`;

    const signatureHtml = `
<div style="margin-top: 32px; border-top: 1px solid #e2e8f0; padding-top: 24px; color: #64748b; font-size: 14px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
  <p style="margin: 0; font-weight: 600; color: #475569;">Best regards,</p>
  <p style="margin: 4px 0 0 0; color: #0f172a; font-weight: 800; font-size: 16px;">${adminName}</p>
  <p style="margin: 0; font-weight: 600;">${adminTitle}</p>
  <p style="margin: 16px 0 0 0; font-size: 13px;">Online: <a href="https://www.weverify.works" style="color: #14b8a6; text-decoration: none; font-weight: bold;">www.Weverify.Works</a></p>
  <p style="margin: 2px 0 0 0; font-size: 13px;">Email: <a href="mailto:clientsupport@weverify.works" style="color: #14b8a6; text-decoration: none; font-weight: bold;">clientsupport@weverify.works</a></p>
  <div style="margin-top: 20px;">
    <img src="https://www.ampcgfoundation.pro/img/weverifyworkslogo.jpg" alt="WeVerify.works" style="max-height: 120px; border-radius: 4px;" referrerPolicy="no-referrer" />
  </div>
  <div style="margin-top: 24px; padding-top: 16px; border-top: 1px dashed #e2e8f0; font-size: 11px; line-height: 1.4; color: #94a3b8;">
    <strong>CONFIDENTIALITY NOTICE:</strong> The content of this email is intended for the person or entity to which it is addressed only. This email may contain confidential information. If you are not the person to whom this message is addressed, be aware that any use, reproduction, or distribution of this message is strictly prohibited.
  </div>
</div>`;

    const fullHtml = `<div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 24px; color: #334155; line-height: 1.6; background-color: #ffffff;">${composeData.body.replace(/\n/g, '<br>')}${signatureHtml}</div>`;
    const fullText = `${composeData.body}${signatureText}`;

    try {
      // Real API call to the server endpoint
      const response = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: composeData.to,
          cc: composeData.cc,
          bcc: composeData.bcc,
          subject: composeData.subject,
          html: fullHtml,
          text: fullText,
          fromName: adminName
        })
      });

      const result = await response.json();
      
      if (result.success) {
        const newSentEmail: EmailMessage = {
          id: `SENT-${Date.now()}`,
          from: `${adminName} <verifications@weverify.works>`,
          to: composeData.to,
          cc: composeData.cc,
          bcc: composeData.bcc,
          subject: composeData.subject,
          body: fullText,
          timestamp: new Date().toLocaleString(),
          status: 'READ',
          folder: 'SENT'
        };

        const updatedEmails = [newSentEmail, ...emails];
        setEmails(updatedEmails);
        localStorage.setItem('wv_emails', JSON.stringify(updatedEmails));
        
        logAction('Send Email', `Sent email to ${composeData.to}: ${composeData.subject}`, 'SUCCESS');
        setShowComposeModal(false);
        setComposeData({ to: '', subject: '', body: '' });
        showNotification('Email dispatched successfully via SMTP gateway.');
      } else {
        throw new Error(result.error || 'Failed to send email');
      }
    } catch (error: any) {
      console.error('Email Error:', error);
      showNotification(`Failed to send email: ${error.message}. Ensure SMTP is configured in .env`, 'ERROR');
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleDeleteEmail = (id: string) => {
    const updatedEmails = emails.map(email => 
      email.id === id ? { ...email, folder: 'TRASH' as const } : email
    );
    setEmails(updatedEmails);
    localStorage.setItem('wv_emails', JSON.stringify(updatedEmails));
    setSelectedEmail(null);
  };

  const handleArchiveEmail = (id: string) => {
    const updatedEmails = emails.map(email => 
      email.id === id ? { ...email, folder: 'ARCHIVE' as const } : email
    );
    setEmails(updatedEmails);
    localStorage.setItem('wv_emails', JSON.stringify(updatedEmails));
    setSelectedEmail(null);
  };

  const handleMarkAsRead = (id: string) => {
    const updatedEmails = emails.map(email => 
      email.id === id ? { ...email, status: 'READ' as const } : email
    );
    setEmails(updatedEmails);
    localStorage.setItem('wv_emails', JSON.stringify(updatedEmails));
  };

  const handleMarkAsUnread = (id: string) => {
    const updatedEmails = emails.map(email => 
      email.id === id ? { ...email, status: 'UNREAD' as const } : email
    );
    setEmails(updatedEmails);
    localStorage.setItem('wv_emails', JSON.stringify(updatedEmails));
  };

  const handleReply = (email: EmailMessage) => {
    setComposeData({
      to: email.from,
      subject: `Re: ${email.subject}`,
      body: `\n\n--- Original Message ---\nFrom: ${email.from}\nDate: ${email.timestamp}\nSubject: ${email.subject}\n\n${email.body}`
    });
    setShowComposeModal(true);
  };

  const handleForward = (email: EmailMessage) => {
    setComposeData({
      to: '',
      subject: `Fwd: ${email.subject}`,
      body: `\n\n--- Forwarded Message ---\nFrom: ${email.from}\nDate: ${email.timestamp}\nSubject: ${email.subject}\n\n${email.body}`
    });
    setShowComposeModal(true);
  };

  const handleSaveAndNext = () => {
    if (!selectedProspect) return;
    
    if (!editProspectConfirmed) {
      showNotification("Please confirm the contact details are accurate by checking the box.", "ERROR");
      return;
    }

    // 1. Save current details
    const updated = prospects.map(p => {
      if (p.id === selectedProspect.id) {
        const newLog = {
          timestamp: new Date().toLocaleString(),
          action: 'Details Updated',
          details: `Contact details and notes updated (Save & Next).`
        };
        return { 
          ...p, 
          name: editProspectName,
          email: editProspectEmail,
          contactPhone: editProspectPhone,
          contactPhone2: editProspectPhone2,
          address: editProspectAddress,
          details: editProspectDetails,
          isConfirmed: editProspectConfirmed,
          status: p.status === 'New' ? 'Contacted' : p.status,
          logs: [newLog, ...(p.logs || [])] 
        };
      }
      return p;
    });
    setProspects(updated);
    localStorage.setItem('wv_prospects', JSON.stringify(updated));
    showNotification("Contact details saved successfully.");

    // 2. Find next prospect based on the original list before update
    let originalList: Prospect[] = [];
    if (activeView === 'prospectQueue') {
      originalList = prospects.filter(p => !p.agentId);
    } else if (activeView === 'agentBank') {
      originalList = prospects.filter(p => p.agentId === currentAdmin?.id && p.status !== 'Closed/Not Interested' && p.status !== 'Extend Free Trial (Open Account)');
    } else if (activeView === 'prospects') {
      originalList = prospects;
    }

    const currentIndex = originalList.findIndex(p => p.id === selectedProspect.id);
    if (currentIndex !== -1 && currentIndex < originalList.length - 1) {
      // Find the next prospect in the updated list
      const nextProspectId = originalList[currentIndex + 1].id;
      const nextProspect = updated.find(p => p.id === nextProspectId);
      if (nextProspect) {
        setSelectedProspect(nextProspect);
      } else {
        setSelectedProspect(null);
        showNotification("End of queue reached.", "INFO");
      }
    } else {
      setSelectedProspect(null);
      showNotification("End of queue reached.", "INFO");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('wv_admin_auth');
    navigate('/admin/login');
  };

  const handleProcessInbox = (id: string) => {
    const item = inbox.find(i => i.id === id);
    if (!item) return;

    // Update inbox status
    const updatedInbox = inbox.map(entry => 
      entry.id === id ? { ...entry, status: 'PROCESSED' as const } : entry
    );
    setInbox(updatedInbox);
    localStorage.setItem('wv_inbox', JSON.stringify(updatedInbox));

    // Update queue status
    const updatedQueue = queue.map((qItem: any) => {
      if (qItem.id === item.refId) {
        let detailsText = item.content;
        if (item.details) {
          const d = item.details;
          detailsText = `Verified by ${item.sender}. `;
          if (d.position) detailsText += `Position: ${d.position}. `;
          if (d.salary) detailsText += `Salary: ${d.salary}. `;
          if (d.rentAmount) detailsText += `Rent: ${d.rentAmount}. `;
          if (d.assetBalance) detailsText += `Balance: ${d.assetBalance}. `;
        }
        return {
          ...qItem,
          status: 'VERIFIED',
          statusDetails: detailsText,
          completionDate: new Date().toLocaleString()
        };
      }
      return qItem;
    });
    setQueue(updatedQueue);
    localStorage.setItem('wv_queue', JSON.stringify(updatedQueue));
    
    logAction('Process Inbox Return', `Verified audit ${item.refId} based on return from ${item.sender}`, 'SUCCESS');
    showNotification(`Audit ${item.refId} has been marked as VERIFIED based on this return.`);
  };

  const handleProcessQueueItem = (item: any) => {
    setSelectedQueueItem(item);
    setProcessingAccount(item.submitter || '');
    setShowProcessModal(true);
  };

  const confirmProcessVerification = () => {
    if (!selectedQueueItem) return;

    // 1. Deduct token from account
    const account = users.find(u => u.email === processingAccount);
    if (!account) {
      showNotification("Error: Selected account not found. Please link to a valid institutional node.", 'ERROR');
      return;
    }

    if (account.tokens <= 0) {
      if (!window.confirm("Account has 0 tokens. Proceed anyway? (Balance will become negative)")) {
        return;
      }
    }

    updateTokens(processingAccount, -1);
    addToLedger(processingAccount, 'TOKEN_DEDUCTION', `Verification processed for ${selectedQueueItem.applicant}`, 1, selectedQueueItem.id);

    // 2. Update queue status
    const updatedQueue = queue.map((qItem: any) => {
      if (qItem.id === selectedQueueItem.id) {
        return {
          ...qItem,
          status: 'VERIFIED',
          statusDetails: 'Verification processed and finalized by Registry Admin.',
          completionDate: new Date().toLocaleString()
        };
      }
      return qItem;
    });
    setQueue(updatedQueue);
    localStorage.setItem('wv_queue', JSON.stringify(updatedQueue));

    // 3. Add to inbox as processed (optional, for record keeping)
    const newInboxEntry: InboxEntry = {
      id: `INB-${Date.now().toString().slice(-6)}`,
      refId: selectedQueueItem.id,
      sender: 'Registry Admin',
      email: 'admin@weverify.works',
      receivedAt: new Date().toLocaleString(),
      status: 'PROCESSED',
      type: 'WEB_RETURN',
      content: `Manual verification finalized for ${selectedQueueItem.applicant}. Token deducted from ${processingAccount}.`
    };
    const updatedInbox = [newInboxEntry, ...inbox];
    setInbox(updatedInbox);
    localStorage.setItem('wv_inbox', JSON.stringify(updatedInbox));

    logAction('Finalize Verification', `Manually finalized verification ${selectedQueueItem.id} for ${selectedQueueItem.applicant}. Deducted 1 token from ${processingAccount}.`, 'SUCCESS');
    setShowProcessModal(false);
    setSelectedQueueItem(null);
    showNotification(`Verification ${selectedQueueItem.id} finalized. 1 token deducted from ${processingAccount}.`);
  };

  const handleDeleteInbox = (id: string) => {
    const item = inbox.find(i => i.id === id);
    const updatedInbox = inbox.filter(item => item.id !== id);
    setInbox(updatedInbox);
    localStorage.setItem('wv_inbox', JSON.stringify(updatedInbox));
    logAction('Delete Inbox Item', `Deleted inbox item ${id} from ${item?.sender || 'Unknown'}`, 'WARNING');
  };

  const chartData = useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return days.map(day => ({
      name: day,
      verifications: Math.floor(Math.random() * 20) + 5,
      revenue: Math.floor(Math.random() * 1000) + 200,
      tokens: Math.floor(Math.random() * 50) + 10
    }));
  }, []);

  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.orgName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEditClient = (user: UserAccount) => {
    setEditClientData(user);
    setShowEditClientModal(true);
  };

  const handleSyncMailbox = () => {
    setIsSendingEmail(true);
    setTimeout(() => {
      const newEmails: EmailMessage[] = [
        {
          id: `EML-${Date.now()}`,
          from: 'client-support@acme.com',
          to: 'verifications@weverify.works',
          subject: 'Urgent: Verification Request WV-982341',
          body: 'Hello, we are still waiting for the verification report for John Smith. Please expedite.',
          timestamp: new Date().toLocaleString(),
          status: 'UNREAD',
          folder: 'INBOX'
        },
        {
          id: `EML-${Date.now() + 1}`,
          from: 'hr@global-tech.io',
          to: 'verifications@weverify.works',
          subject: 'New Verification Submission',
          body: 'Please find the attached documents for the new verification request for Sarah Miller.',
          timestamp: new Date().toLocaleString(),
          status: 'UNREAD',
          folder: 'INBOX'
        }
      ];
      
      const updatedEmails = [...newEmails, ...emails];
      setEmails(updatedEmails);
      localStorage.setItem('wv_emails', JSON.stringify(updatedEmails));
      setIsSendingEmail(false);
      logAction('Mailbox Synced', 'Successfully retrieved 2 new messages from the server.', 'SUCCESS');
    }, 1500);
  };

  const handleCompleteTask = (taskId: string) => {
    const updatedTasks = tasks.map(t => t.id === taskId ? { ...t, status: 'COMPLETED' as const } : t);
    setTasks(updatedTasks);
    localStorage.setItem('wv_tasks', JSON.stringify(updatedTasks));
    logAction('Task Completed', `Task ${taskId} marked as completed.`, 'SUCCESS');
  };

  const handleDeleteTask = (taskId: string) => {
    const updatedTasks = tasks.filter(t => t.id !== taskId);
    setTasks(updatedTasks);
    localStorage.setItem('wv_tasks', JSON.stringify(updatedTasks));
    logAction('Task Deleted', `Task ${taskId} removed from queue.`, 'WARNING');
  };

  const confirmEditClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editClientData) return;

    const updatedUsers = users.map(u => u.email === editClientData.email ? editClientData : u);
    setUsers(updatedUsers);
    localStorage.setItem('wv_users', JSON.stringify(updatedUsers));
    
    logAction('Update Client', `Modified account details for ${editClientData.orgName}`, 'INFO');
    setShowEditClientModal(false);
    setEditClientData(null);
    if (selectedUser?.email === editClientData.email) {
      setSelectedUser(editClientData);
    }
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    const newUser: UserAccount = {
      accountNumber: `WV-${Math.floor(100000 + Math.random() * 900000)}`,
      email: newClient.email,
      orgName: newClient.orgName,
      tokens: newClient.initialTokens,
      joinedAt: new Date().toISOString(),
      plan: newClient.plan,
      status: 'ACTIVE',
      password: 'passwordverified',
      contactPhone: newClient.contactPhone
    };

    const updatedUsers = [...users, newUser];
    setUsers(updatedUsers);
    localStorage.setItem('wv_users', JSON.stringify(updatedUsers));
    logAction('Create Client', `Provisioned new institutional node for ${newUser.orgName} (${newUser.email})`, 'SUCCESS');
    
    // Log to ledger
    addToLedger(newUser.email, 'ACCOUNT_CREATED', `Institutional node provisioned with ${newUser.plan} plan`, newUser.tokens);
    
    setShowCreateModal(false);
    setNewClient({ email: '', orgName: '', plan: 'TRIAL', initialTokens: 1, contactPhone: '' });

    // Send Welcome Email
    try {
      const adminName = localStorage.getItem('wv_admin_name') || 'Admin User';
      const message = `Welcome to WeVerify.works!\n\nYour weverify.works account has been sucessfully provisioned; your login/access details are included below. If you have any questions feel free to contact us anytime via email at clientsupport@weverify.works or via the helpdesk at helpdesk.weverify.works\n\nOrganization: ${newUser.orgName}\nEmail: ${newUser.email}\nPlan: ${newUser.plan}\nTemporary Password: passwordverified\n\nPlease log in and change your password immediately.\n\nCONFIDENTIALITY NOTICE: The content of this email is intended for the person or entity to which it is addressed only. This email may contain confidential information. If you are not the person to whom this message is addressed, be aware that any use, reproduction, or distribution of this message is strictly prohibited.`;
      const html = `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px; max-width: 600px; margin: 0 auto;">
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="https://www.ampcgfoundation.pro/img/weverifyworkslogo.jpg" alt="WeVerify Logo" style="max-width: 150px;" />
          </div>
          <h2 style="color: #333;">Welcome to WeVerify.works!</h2>
          <p style="font-size: 16px; color: #555;">Your weverify.works account has been sucessfully provisioned; your login/access details are included below. If you have any questions feel free to contact us anytime via email at <a href="mailto:clientsupport@weverify.works" style="color: #14b8a6;">clientsupport@weverify.works</a> or via the helpdesk at <a href="https://helpdesk.weverify.works" style="color: #14b8a6;">helpdesk.weverify.works</a></p>
          <ul style="list-style: none; padding: 0;">
            <li><strong>Organization:</strong> ${newUser.orgName}</li>
            <li><strong>Email:</strong> ${newUser.email}</li>
            <li><strong>Plan:</strong> ${newUser.plan}</li>
            <li><strong>Temporary Password:</strong> passwordverified</li>
          </ul>
          <p style="font-size: 16px; color: #555;">Please log in and change your password immediately.</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;" />
          <p style="font-size: 14px; color: #888;">Contact Details:<br />
          Email: <a href="mailto:verifications@weverify.works" style="color: #14b8a6;">verifications@weverify.works</a><br />
          Helpdesk: <a href="https://helpdesk.weverify.works" style="color: #14b8a6;">https://helpdesk.weverify.works</a></p>
          <div style="margin-top: 24px; padding-top: 16px; border-top: 1px dashed #eee; font-size: 11px; line-height: 1.4; color: #999;">
            <strong>CONFIDENTIALITY NOTICE:</strong> The content of this email is intended for the person or entity to which it is addressed only. This email may contain confidential information. If you are not the person to whom this message is addressed, be aware that any use, reproduction, or distribution of this message is strictly prohibited.
          </div>
        </div>
      `;

      await fetch("/api/email/send", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: newUser.email,
          subject: "Welcome to WeVerify.works - Account Provisioned",
          fromName: adminName,
          text: message,
          html: html
        })
      });
      logAction('Email Sent', `Welcome email sent to ${newUser.email}`, 'SUCCESS');
    } catch (err) {
      console.error("Failed to send welcome email", err);
      logAction('Email Failed', `Failed to send welcome email to ${newUser.email}`, 'ERROR');
    }
  };

  const handleCreateInvoice = async (user: UserAccount, tokens: number, amount: number) => {
    const adminId = localStorage.getItem('wv_admin_id') || 'SYS-001';
    const newInvoice: Invoice = {
      id: `INV-${Math.floor(1000 + Math.random() * 9000)}`,
      clientEmail: user.email,
      clientName: user.orgName,
      amount,
      tokens,
      date: new Date().toISOString().split('T')[0],
      status: 'Pending',
      agentId: adminId
    };

    const updatedInvoices = [newInvoice, ...invoices];
    setInvoices(updatedInvoices);
    localStorage.setItem('wv_invoices', JSON.stringify(updatedInvoices));
    logAction('Create Invoice', `Generated invoice ${newInvoice.id} for ${user.orgName} ($${amount})`, 'INFO');
    
    // Also add tokens to user
    updateTokens(user.email, tokens);

    // Send Invoice Email
    try {
      const adminName = localStorage.getItem('wv_admin_name') || 'Admin User';
      const message = `New Invoice Generated\n\nInvoice ID: ${newInvoice.id}\nAmount Due: $${amount.toFixed(2)}\nTokens: ${tokens}\nDue Date: Upon Receipt\n\nPlease submit payment at https://payment.weverify.works\n\nCONFIDENTIALITY NOTICE: The content of this email is intended for the person or entity to which it is addressed only. This email may contain confidential information. If you are not the person to whom this message is addressed, be aware that any use, reproduction, or distribution of this message is strictly prohibited.`;
      const html = `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px; max-width: 600px; margin: 0 auto;">
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="https://www.ampcgfoundation.pro/img/weverifyworkslogo.jpg" alt="WeVerify Logo" style="max-width: 150px;" />
          </div>
          <h2 style="color: #333;">New Invoice Generated</h2>
          <p style="font-size: 16px; color: #555;">A new invoice has been generated for <strong>${user.orgName}</strong>.</p>
          
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #64748b;">Invoice ID:</td>
                <td style="padding: 8px 0; font-weight: bold; text-align: right;">${newInvoice.id}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b;">Amount Due:</td>
                <td style="padding: 8px 0; font-weight: bold; text-align: right; color: #0f766e;">$${amount.toFixed(2)}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b;">Tokens:</td>
                <td style="padding: 8px 0; font-weight: bold; text-align: right;">${tokens}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b;">Due Date:</td>
                <td style="padding: 8px 0; font-weight: bold; text-align: right;">Upon Receipt</td>
              </tr>
            </table>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="https://payment.weverify.works" style="background-color: #0f172a; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">Submit Payment</a>
          </div>

          <p style="font-size: 14px; color: #888; text-align: center;">
            Please submit payment at <a href="https://payment.weverify.works" style="color: #14b8a6;">payment.weverify.works</a>
          </p>
          
          <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;" />
          <p style="font-size: 14px; color: #888;">Contact Details:<br />
          Email: <a href="mailto:clientsupport@weverify.works" style="color: #14b8a6;">clientsupport@weverify.works</a><br />
          Helpdesk: <a href="https://helpdesk.weverify.works" style="color: #14b8a6;">https://helpdesk.weverify.works</a></p>
          <div style="margin-top: 24px; padding-top: 16px; border-top: 1px dashed #eee; font-size: 11px; line-height: 1.4; color: #999;">
            <strong>CONFIDENTIALITY NOTICE:</strong> The content of this email is intended for the person or entity to which it is addressed only. This email may contain confidential information. If you are not the person to whom this message is addressed, be aware that any use, reproduction, or distribution of this message is strictly prohibited.
          </div>
        </div>
      `;

      await fetch("/api/email/send", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: user.email,
          subject: `Invoice ${newInvoice.id} - WeVerify.works`,
          fromName: adminName,
          text: message,
          html: html
        })
      });
      logAction('Email Sent', `Invoice email sent to ${user.email}`, 'SUCCESS');
    } catch (err) {
      console.error("Failed to send invoice email", err);
      logAction('Email Failed', `Failed to send invoice email to ${user.email}`, 'ERROR');
    }
  };

  const updateTokens = (email: string, amount: number) => {
    const updatedUsers = users.map(u => {
      if (u.email === email) {
        const newTokens = Math.max(0, u.tokens + amount);
        // If this is the current logged in user, also update their local tokens if they happen to be the same browser session
        if (localStorage.getItem('wv_user_email') === email) {
          localStorage.setItem('wv_tokens', newTokens.toString());
        }

        // Log to ledger
        const type = amount > 0 ? 'TOKEN_ADDITION' : 'TOKEN_DEDUCTION';
        addToLedger(email, type, `Manual token adjustment: ${amount > 0 ? '+' : ''}${amount} tokens`, Math.abs(amount));

        return { ...u, tokens: newTokens };
      }
      return u;
    });
    setUsers(updatedUsers);
    localStorage.setItem('wv_users', JSON.stringify(updatedUsers));
    
    if (selectedUser && selectedUser.email === email) {
      setSelectedUser({ ...selectedUser, tokens: Math.max(0, selectedUser.tokens + amount) });
    }
  };

  const resetPassword = async (email: string) => {
    if (!window.confirm(`Are you sure you want to reset the password for ${email}?`)) {
      return;
    }

    const updatedUsers = users.map(u => {
      if (u.email === email) {
        return { ...u, password: 'passwordverify' };
      }
      return u;
    });
    setUsers(updatedUsers);
    localStorage.setItem('wv_users', JSON.stringify(updatedUsers));
    logAction('Reset Password', `Reset password for account ${email}`, 'WARNING');
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/email/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: email,
          subject: 'WeVerify - Password Reset',
          body: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
              <h2 style="color: #0f172a;">Password Reset</h2>
              <p style="color: #475569; font-size: 16px;">Your password has been reset by an administrator.</p>
              <div style="background-color: #f8fafc; padding: 16px; border-radius: 6px; margin: 20px 0;">
                <p style="margin: 0; color: #334155;"><strong>Temporary Password:</strong> passwordverify</p>
              </div>
              <p style="color: #475569; font-size: 14px;">Please log in and change your password immediately.</p>
            </div>
          `
        })
      });
      
      if (response.ok) {
        showNotification(`Password for ${email} has been reset to: passwordverify. An email confirmation has been sent.`);
      } else {
        showNotification(`Password for ${email} has been reset to: passwordverify. Failed to send email confirmation.`, 'ERROR');
      }
    } catch (error) {
      console.error('Error sending password reset email:', error);
      showNotification(`Password for ${email} has been reset to: passwordverify. Failed to send email confirmation.`, 'ERROR');
    }
  };

  const handleUpdateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;
    
    const updatedInvoice = { ...selectedInvoice, ...invoiceEditData } as Invoice;
    const updatedInvoices = invoices.map(inv => inv.id === updatedInvoice.id ? updatedInvoice : inv);
    setInvoices(updatedInvoices);
    localStorage.setItem('wv_invoices', JSON.stringify(updatedInvoices));
    logAction('Update Invoice', `Modified invoice ${updatedInvoice.id} for ${updatedInvoice.clientName}`, 'INFO');
    setShowInvoiceModal(false);
    setSelectedInvoice(null);
  };

  const handleDeleteInvoice = (id: string) => {
    const updatedInvoices = invoices.filter(inv => inv.id !== id);
    setInvoices(updatedInvoices);
    localStorage.setItem('wv_invoices', JSON.stringify(updatedInvoices));
    logAction('Delete Invoice', `Removed invoice ${id} from system`, 'WARNING');
    setShowInvoiceModal(false);
    setSelectedInvoice(null);
  };

  const handleSendInvoice = (invoice: Invoice) => {
    logAction('Dispatch Invoice', `Sent invoice ${invoice.id} to ${invoice.clientEmail}`, 'INFO');
    showNotification(`Invoice ${invoice.id} sent to ${invoice.clientEmail}`);
  };

  const handleDragStart = (e: React.MouseEvent, index: number) => {
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    const startPos = floatingEmails[index].position;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;
      
      setFloatingEmails(prev => {
        const updated = [...prev];
        updated[index].position = {
          x: startPos.x - deltaX, // Subtract because we use right positioning
          y: startPos.y + deltaY  // Add because we use top positioning
        };
        return updated;
      });
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const toggleUserStatus = (email: string) => {
    const updatedUsers = users.map(u => {
      if (u.email === email) {
        const newStatus = u.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
        return { ...u, status: newStatus };
      }
      return u;
    });
    setUsers(updatedUsers);
    localStorage.setItem('wv_users', JSON.stringify(updatedUsers));
    
    const user = users.find(u => u.email === email);
    const newStatus = user?.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    logAction('Toggle Account Status', `Changed status for ${email} to ${newStatus}`, newStatus === 'ACTIVE' ? 'SUCCESS' : 'WARNING');

    if (selectedUser && selectedUser.email === email) {
      setSelectedUser({ ...selectedUser, status: selectedUser.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' });
    }
  };

  const needsFollowup = useMemo(() => {
    const seventyTwoHoursAgo = Date.now() - (72 * 60 * 60 * 1000);
    return queue.some(item => {
      if (item.status === 'VERIFIED' || item.status === 'REJECTED') return false;
      const itemDate = new Date(item.timestamp).getTime();
      return itemDate < seventyTwoHoursAgo;
    });
  }, [queue]);

  const stats = {
    total: users.length,
    active: users.filter(u => u.status === 'ACTIVE').length,
    inactive: users.filter(u => u.status === 'INACTIVE').length
  };

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
    <div className="min-h-screen bg-slate-50 flex">
      {/* Disclaimer Modal */}
      {showDisclaimer && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="max-w-2xl w-full bg-white rounded-[3rem] shadow-2xl border border-slate-200 p-12 relative overflow-hidden animate-in zoom-in-95 duration-500">
            <div className="absolute top-0 right-0 p-12 opacity-5">
              <Shield className="w-48 h-48 text-red-600" />
            </div>
            
            <div className="relative z-10">
              <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-8 border border-red-100 shadow-lg">
                <Shield className="w-8 h-8 text-red-600" />
              </div>
              
              <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-6">Weverify Team CMS Access Policy</h2>
              
              <div className="space-y-6 text-slate-600 font-medium leading-relaxed mb-10 max-h-[40vh] overflow-y-auto pr-4 custom-scrollbar">
                <p>
                  By accessing the WeVerify.works Team CMS infrastructure, you acknowledge and agree to the following terms regarding data privacy and system usage:
                </p>
                
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full mt-2 shrink-0" />
                    <p className="text-sm"><strong>Privileged Access:</strong> You are accessing highly sensitive client and subject data. You agree to maintain absolute confidentiality and never export or disclose data outside of authorized support channels.</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full mt-2 shrink-0" />
                    <p className="text-sm"><strong>Administrative Integrity:</strong> This portal must only be used for authorized infrastructure management, client support, and forensic auditing. Any unauthorized modification of client nodes or token balances is strictly prohibited.</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full mt-2 shrink-0" />
                    <p className="text-sm"><strong>Continuous Monitoring:</strong> All administrative actions are logged with high-fidelity telemetry and are subject to review by the Chief Security Officer.</p>
                  </div>
                </div>
                
                <p className="text-sm italic">
                  Unauthorized use of administrative tools or violation of privacy protocols will result in immediate revocation of access and potential legal prosecution.
                </p>
              </div>
              
              <button 
                onClick={handleAcceptDisclaimer}
                className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-lg hover:bg-slate-800 transition-all shadow-xl flex items-center justify-center space-x-3"
              >
                <span>I Accept Administrative Terms</span>
                <ArrowRight className="w-5 h-5 text-red-400" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <div className="w-72 bg-slate-900 text-white flex flex-col p-8">
        <div className="flex items-center space-x-3 mb-12">
          <div className="w-10 h-10 bg-teal-500 rounded-xl flex items-center justify-center shadow-lg shadow-teal-500/20">
            <Shield className="w-6 h-6 text-slate-900" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tighter">Weverify Team CMS</h1>
            <p className="text-[10px] font-bold text-teal-500 uppercase tracking-widest">Affiliate Access</p>
          </div>
        </div>

        <nav className="flex-grow space-y-6 overflow-y-auto pr-2">
          {/* General */}
          <div className="space-y-1">
            <button 
              onClick={() => setActiveView('overview')}
              className={`w-full flex items-center space-x-3 p-3 rounded-2xl text-sm font-black uppercase tracking-widest transition-all ${activeView === 'overview' ? 'bg-white/10 text-white' : 'text-slate-400 hover:bg-white/5'}`}
            >
              <LayoutDashboard className={`w-5 h-5 ${activeView === 'overview' ? 'text-teal-400' : ''}`} />
              <span>Overview</span>
            </button>
          </div>

          {/* Client Management */}
          <div>
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 px-3">Client Management</h3>
            <div className="space-y-1">
              <button 
                onClick={() => setActiveView('queue')}
                className={`w-full flex items-center space-x-3 p-3 rounded-2xl text-sm font-black uppercase tracking-widest transition-all ${activeView === 'queue' ? 'bg-white/10 text-white' : 'text-slate-400 hover:bg-white/5'}`}
              >
                <Zap className={`w-5 h-5 ${activeView === 'queue' ? 'text-red-500' : ''}`} />
                <span>Working Queue</span>
              </button>
              <button 
                onClick={() => setActiveView('tasks')}
                className={`w-full flex items-center space-x-3 p-3 rounded-2xl text-sm font-black uppercase tracking-widest transition-all relative ${activeView === 'tasks' ? 'bg-white/10 text-white' : 'text-slate-400 hover:bg-white/5'}`}
              >
                <ClipboardList className={`w-5 h-5 ${activeView === 'tasks' ? 'text-blue-400' : ''}`} />
                <span>Working Tasks</span>
                {tasks.filter(t => t.status === 'PENDING').length > 0 && (
                  <span className="absolute top-2 right-2 w-5 h-5 bg-blue-500 text-white text-[10px] flex items-center justify-center rounded-full border-2 border-slate-900">
                    {tasks.filter(t => t.status === 'PENDING').length}
                  </span>
                )}
              </button>
              <button 
                onClick={() => setActiveView('inbox')}
                className={`w-full flex items-center space-x-3 p-3 rounded-2xl text-sm font-black uppercase tracking-widest transition-all relative ${activeView === 'inbox' ? 'bg-white/10 text-white' : 'text-slate-400 hover:bg-white/5'}`}
              >
                <Mail className={`w-5 h-5 ${activeView === 'inbox' ? 'text-teal-500' : ''}`} />
                <span>Mailbox Hub</span>
                {emails.filter(e => e.folder === 'INBOX' && e.status === 'UNREAD').length > 0 && (
                  <span className="absolute top-2 right-2 w-5 h-5 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full border-2 border-slate-900 animate-pulse">
                    {emails.filter(e => e.folder === 'INBOX' && e.status === 'UNREAD').length}
                  </span>
                )}
              </button>
              <button 
                onClick={() => setActiveView('accounts')}
                className={`w-full flex items-center space-x-3 p-3 rounded-2xl text-sm font-black uppercase tracking-widest transition-all ${activeView === 'accounts' ? 'bg-white/10 text-white' : 'text-slate-400 hover:bg-white/5'}`}
              >
                <Users className={`w-5 h-5 ${activeView === 'accounts' ? 'text-blue-500' : ''}`} />
                <span>Client Accounts</span>
              </button>
            </div>
          </div>

          {/* Marketing */}
          <div>
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 px-3">Marketing</h3>
            <div className="space-y-1">
              <button 
                onClick={() => setActiveView('prospects')}
                className={`w-full flex items-center space-x-3 p-3 rounded-2xl text-sm font-black uppercase tracking-widest transition-all ${activeView === 'prospects' ? 'bg-white/10 text-white' : 'text-slate-400 hover:bg-white/5'}`}
              >
                <TrendingUp className={`w-5 h-5 ${activeView === 'prospects' ? 'text-purple-500' : ''}`} />
                <span>Prospects</span>
              </button>
              <button 
                onClick={() => setActiveView('prospectQueue')}
                className={`w-full flex items-center space-x-3 p-3 rounded-2xl text-sm font-black uppercase tracking-widest transition-all ${activeView === 'prospectQueue' ? 'bg-white/10 text-white' : 'text-slate-400 hover:bg-white/5'}`}
              >
                <ClipboardList className={`w-5 h-5 ${activeView === 'prospectQueue' ? 'text-teal-500' : ''}`} />
                <span>Prospect Queue</span>
              </button>
              <button 
                onClick={() => setActiveView('agentBank')}
                className={`w-full flex items-center space-x-3 p-3 rounded-2xl text-sm font-black uppercase tracking-widest transition-all ${activeView === 'agentBank' ? 'bg-white/10 text-white' : 'text-slate-400 hover:bg-white/5'}`}
              >
                <Building2 className={`w-5 h-5 ${activeView === 'agentBank' ? 'text-amber-500' : ''}`} />
                <span>Agent Bank</span>
              </button>
            </div>
          </div>

          {/* Financial */}
          <div>
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 px-3">Financial</h3>
            <div className="space-y-1">
              <button 
                onClick={() => setActiveView('invoicing')}
                className={`w-full flex items-center space-x-3 p-3 rounded-2xl text-sm font-black uppercase tracking-widest transition-all ${activeView === 'invoicing' ? 'bg-white/10 text-white' : 'text-slate-400 hover:bg-white/5'}`}
              >
                <DollarSign className={`w-5 h-5 ${activeView === 'invoicing' ? 'text-emerald-500' : ''}`} />
                <span>Invoicing</span>
              </button>
            </div>
          </div>

          {/* Admin */}
          <div>
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 px-3">System</h3>
            <div className="space-y-1">
              {currentAdmin?.role === 'ADMIN' && (
                <button 
                  onClick={() => setActiveView('adminFunctions')}
                  className={`w-full flex items-center space-x-3 p-3 rounded-2xl text-sm font-black uppercase tracking-widest transition-all ${activeView === 'adminFunctions' ? 'bg-white/10 text-white' : 'text-slate-400 hover:bg-white/5'}`}
                >
                  <Shield className={`w-5 h-5 ${activeView === 'adminFunctions' ? 'text-red-500' : ''}`} />
                  <span>Admin Functions</span>
                </button>
              )}
              <a 
                href="https://www.ampcgllp.com/amp-portal-access" 
                target="_blank" 
                className="w-full flex items-center space-x-3 p-3 hover:bg-white/5 rounded-2xl text-sm font-black uppercase tracking-widest text-slate-400 transition-all"
              >
                <ExternalLink className="w-5 h-5" />
                <span>Portal Access</span>
              </a>
            </div>
          </div>
        </nav>

        <button 
          onClick={handleLogout}
          className="flex items-center space-x-3 p-4 text-slate-500 hover:text-white transition-colors text-sm font-black uppercase tracking-widest"
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-grow p-12 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          {needsFollowup && (
            <div className="mb-8 bg-red-50 border-2 border-red-200 rounded-[2rem] p-6 flex items-center justify-between animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-red-900 tracking-tight">Needs Followup !! Notification</h3>
                  <p className="text-sm text-red-600 font-medium">There are unresolved verifications in the queue for over 72 hours.</p>
                </div>
              </div>
              <button 
                onClick={() => setActiveView('queue')}
                className="bg-red-600 text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-red-700 transition-all shadow-lg shadow-red-600/20"
              >
                View Queue
              </button>
            </div>
          )}
          <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">
                {activeView === 'overview' ? `System Overview - Welcome ${currentAdmin?.name || 'Agent'}` : 
                 activeView === 'accounts' ? 'Client Account Management' : 
                 activeView === 'invoicing' ? 'Financial Operations' : 
                 activeView === 'queue' ? 'Current Working Queue' : 
                 activeView === 'inbox' ? 'Secure Mailbox Hub' : 
                 activeView === 'tasks' ? 'Agent Working Tasks' :
                 activeView === 'prospectQueue' ? 'Prospect Queue' :
                activeView === 'agentBank' ? 'Agent Prospect Bank' :
                activeView === 'prospects' ? 'Prospects & Outreach' :
                 activeView === 'adminFunctions' ? 'System Administration' :
                 'Team CMS Overview'}
              </h1>
              <p className="text-slate-500 font-medium">
                {activeView === 'overview' ? 'Real-time network metrics and performance analytics.' :
                 activeView === 'accounts' ? 'Manage institutional nodes and token allocations across the network.' : 
                 activeView === 'invoicing' ? 'Generate invoices, track payments, and manage client balances.' : 
                 activeView === 'queue' ? 'Monitor all pending verifications submitted by clients.' :
                 activeView === 'inbox' ? 'Manage secure communications, verification returns, and client correspondence.' :
                 activeView === 'tasks' ? 'Manage your assigned follow-up tasks and outreach activities.' :
                 activeView === 'prospectQueue' ? 'Claim new prospects and add them to your individual bank.' :
                activeView === 'agentBank' ? 'Manage your personally claimed institutional leads.' :
                activeView === 'prospects' ? 'Track potential institutional partners and marketing outreach status.' :
                 activeView === 'adminFunctions' ? 'Manage internal resources, audit logs, and token collection.' :
                 'Manage your administrative dashboard.'}
              </p>
            </div>
            
            {activeView === 'accounts' && (
              <div className="flex items-center gap-4">
                <div className="bg-white px-6 py-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center min-w-[120px]">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Clients</span>
                  <span className="text-2xl font-black text-slate-900">{stats.total}</span>
                </div>
                <div className="bg-white px-6 py-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center min-w-[120px]">
                  <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">Active</span>
                  <span className="text-2xl font-black text-emerald-600">{stats.active}</span>
                </div>
                <button 
                  onClick={() => setShowCreateModal(true)}
                  className="bg-red-600 text-white px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-red-700 transition-all shadow-lg shadow-red-600/20 flex items-center space-x-2"
                >
                  <UserPlus className="w-5 h-5" />
                  <span>Create Client</span>
                </button>
              </div>
            )}
          </header>

          {activeView === 'overview' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Categorized At a Glance Display */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Marketing At a Glance */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-xl relative overflow-hidden group">
                  <div className="absolute -right-4 -top-4 w-32 h-32 bg-purple-50 rounded-full opacity-50 group-hover:scale-110 transition-transform" />
                  <div className="relative z-10">
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center">
                        <TrendingUp className="w-5 h-5" />
                      </div>
                      <h3 className="text-lg font-black text-slate-900 uppercase tracking-widest">Marketing</h3>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Total Prospects</span>
                        <span className="text-xl font-black text-slate-900">{prospects.length}</span>
                      </div>
                      <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">New Leads</span>
                        <span className="text-xl font-black text-purple-600">{prospects.filter(p => p.status === 'New').length}</span>
                      </div>
                      <div className="flex justify-between items-center pb-1">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Contacted</span>
                        <span className="text-xl font-black text-blue-600">{prospects.filter(p => p.status === 'Contacted').length}</span>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => setActiveView('prospects')}
                      className="mt-6 w-full py-3 bg-purple-50 text-purple-700 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-purple-100 transition-colors"
                    >
                      Go to Marketing
                    </button>
                  </div>
                </div>

                {/* Financial At a Glance */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-xl relative overflow-hidden group">
                  <div className="absolute -right-4 -top-4 w-32 h-32 bg-emerald-50 rounded-full opacity-50 group-hover:scale-110 transition-transform" />
                  <div className="relative z-10">
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
                        <DollarSign className="w-5 h-5" />
                      </div>
                      <h3 className="text-lg font-black text-slate-900 uppercase tracking-widest">Financial</h3>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Total Revenue</span>
                        <span className="text-xl font-black text-emerald-600">${invoices.reduce((acc, inv) => acc + (inv.status === 'Paid' ? inv.amount : 0), 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Paid Invoices</span>
                        <span className="text-xl font-black text-slate-900">{invoices.filter(i => i.status === 'Paid').length}</span>
                      </div>
                      <div className="flex justify-between items-center pb-1">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Pending Invoices</span>
                        <span className="text-xl font-black text-amber-500">{invoices.filter(i => i.status === 'Pending').length}</span>
                      </div>
                    </div>

                    <button 
                      onClick={() => setActiveView('invoicing')}
                      className="mt-6 w-full py-3 bg-emerald-50 text-emerald-700 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-100 transition-colors"
                    >
                      Go to Financial
                    </button>
                  </div>
                </div>

                {/* Client Management At a Glance */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-xl relative overflow-hidden group">
                  <div className="absolute -right-4 -top-4 w-32 h-32 bg-blue-50 rounded-full opacity-50 group-hover:scale-110 transition-transform" />
                  <div className="relative z-10">
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                        <Users className="w-5 h-5" />
                      </div>
                      <h3 className="text-lg font-black text-slate-900 uppercase tracking-widest">Client Mgmt</h3>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Active Clients</span>
                        <span className="text-xl font-black text-slate-900">{users.length}</span>
                      </div>
                      <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Queue / Tasks</span>
                        <span className="text-xl font-black text-red-500">{queue.length} / {tasks.filter(t => t.status === 'PENDING').length}</span>
                      </div>
                      <div className="flex justify-between items-center pb-1">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Unread Mail</span>
                        <span className="text-xl font-black text-teal-600">{emails.filter(e => e.folder === 'INBOX' && e.status === 'UNREAD').length}</span>
                      </div>
                    </div>

                    <button 
                      onClick={() => setActiveView('queue')}
                      className="mt-6 w-full py-3 bg-blue-50 text-blue-700 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-100 transition-colors"
                    >
                      Go to Client Mgmt
                    </button>
                  </div>
                </div>
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-2xl">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="text-xl font-black text-slate-900">Verification Volume</h3>
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Weekly throughput analysis</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center space-x-1">
                        <div className="w-3 h-3 bg-teal-500 rounded-full" />
                        <span className="text-[10px] font-black text-slate-400 uppercase">Audits</span>
                      </div>
                    </div>
                  </div>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="colorVer" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#14b8a6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis 
                          dataKey="name" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 900}} 
                          dy={10}
                        />
                        <YAxis 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 900}} 
                        />
                        <Tooltip 
                          contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px'}}
                          itemStyle={{fontSize: '12px', fontWeight: 900}}
                        />
                        <Area type="monotone" dataKey="verifications" stroke="#14b8a6" strokeWidth={4} fillOpacity={1} fill="url(#colorVer)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-2xl">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="text-xl font-black text-slate-900">Revenue Distribution</h3>
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Financial performance by node</p>
                    </div>
                    <BarChart3 className="w-6 h-6 text-emerald-500" />
                  </div>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis 
                          dataKey="name" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 900}} 
                          dy={10}
                        />
                        <YAxis 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 900}} 
                        />
                        <Tooltip 
                          contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px'}}
                          itemStyle={{fontSize: '12px', fontWeight: 900}}
                        />
                        <Bar dataKey="revenue" fill="#10b981" radius={[6, 6, 0, 0]} barSize={30} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Recent Activity & Quick Actions */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white p-10 rounded-[3rem] border border-slate-200 shadow-2xl">
                  <h3 className="text-xl font-black text-slate-900 mb-8 flex items-center space-x-3">
                    <Clock className="w-6 h-6 text-blue-500" />
                    <span>Real-time Event Stream</span>
                  </h3>
                  <div className="space-y-6">
                    {logs.slice(0, 5).map((log) => (
                      <div key={log.id} className="flex items-start space-x-4 p-4 rounded-2xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          log.type === 'SUCCESS' ? 'bg-emerald-50 text-emerald-600' :
                          log.type === 'WARNING' ? 'bg-amber-50 text-amber-600' :
                          log.type === 'ERROR' ? 'bg-red-50 text-red-600' :
                          'bg-blue-50 text-blue-600'
                        }`}>
                          {log.type === 'SUCCESS' ? <CheckCircle2 className="w-5 h-5" /> : <Activity className="w-5 h-5" />}
                        </div>
                        <div className="flex-grow">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-sm font-black text-slate-900">{log.action}</p>
                            <span className="text-[10px] font-bold text-slate-400">{log.timestamp}</span>
                          </div>
                          <p className="text-xs text-slate-500 font-medium">{log.details}</p>
                        </div>
                      </div>
                    ))}
                    <button 
                      onClick={() => setActiveView('logs')}
                      className="w-full py-4 border-2 border-slate-100 rounded-2xl text-xs font-black text-slate-400 uppercase tracking-widest hover:bg-slate-50 hover:text-slate-900 transition-all"
                    >
                      View All System Logs
                    </button>
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="bg-slate-900 p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                      <Zap className="w-32 h-32" />
                    </div>
                    <div className="relative z-10">
                      <h3 className="text-xl font-black mb-2">Quick Actions</h3>
                      <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-8">Administrative Shortcuts</p>
                      
                      <div className="space-y-3">
                        <button 
                          onClick={() => setShowCreateModal(true)}
                          className="w-full py-4 bg-white/10 hover:bg-white/20 rounded-2xl flex items-center justify-between px-6 transition-all group"
                        >
                          <span className="text-xs font-black uppercase tracking-widest">New Client</span>
                          <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
                        </button>
                        <button 
                          onClick={() => setShowCreateInvoiceModal(true)}
                          className="w-full py-4 bg-white/10 hover:bg-white/20 rounded-2xl flex items-center justify-between px-6 transition-all group"
                        >
                          <span className="text-xs font-black uppercase tracking-widest">Issue Invoice</span>
                          <DollarSign className="w-4 h-4 group-hover:scale-110 transition-transform" />
                        </button>
                        <button 
                          onClick={() => setActiveView('queue')}
                          className="w-full py-4 bg-white/10 hover:bg-white/20 rounded-2xl flex items-center justify-between px-6 transition-all group"
                        >
                          <span className="text-xs font-black uppercase tracking-widest">Review Queue</span>
                          <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-xl">
                    <h3 className="text-lg font-black text-slate-900 mb-6">Network Status</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                          <span className="text-xs font-black text-slate-600 uppercase tracking-widest">Core Registry</span>
                        </div>
                        <span className="text-[10px] font-black text-emerald-600">OPERATIONAL</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                          <span className="text-xs font-black text-slate-600 uppercase tracking-widest">Email Gateway</span>
                        </div>
                        <span className="text-[10px] font-black text-emerald-600">OPERATIONAL</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-2 h-2 bg-amber-500 rounded-full" />
                          <span className="text-xs font-black text-slate-600 uppercase tracking-widest">Stripe Sync</span>
                        </div>
                        <span className="text-[10px] font-black text-amber-600">DELAYED</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeView === 'accounts' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              {/* Search & List */}
              <div className="lg:col-span-1 space-y-6">
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="Search by Email or Org..."
                    className="w-full p-5 bg-white border border-slate-200 rounded-[1.5rem] font-bold text-slate-900 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all pl-14 shadow-xl shadow-slate-200/50"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-400" />
                </div>

                <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xl overflow-hidden">
                  <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Active Client Accounts ({filteredUsers.length})</h3>
                  </div>
                  <div className="max-h-[600px] overflow-y-auto">
                    {filteredUsers.length > 0 ? filteredUsers.map((user) => (
                      <button 
                        key={user.email}
                        onClick={() => {
                          setSelectedUser(user);
                          logAction('View Client Account', `Accessed account details for ${user.orgName} (${user.email})`, 'INFO');
                        }}
                        className={`w-full p-6 flex items-center justify-between hover:bg-slate-50 transition-all border-b border-slate-50 last:border-0 ${selectedUser?.email === user.email ? 'bg-red-50/50 border-l-4 border-l-red-600' : ''}`}
                      >
                        <div className="text-left">
                          <div className="flex items-center gap-2">
                            <p className="font-black text-slate-900 text-sm truncate max-w-[150px]">{user.orgName}</p>
                            <div className={`w-1.5 h-1.5 rounded-full ${user.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                          </div>
                          <p className="text-[10px] text-slate-400 font-bold truncate max-w-[180px]">{user.accountNumber} • {user.email}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="flex flex-col items-end">
                            <span className="text-[10px] font-black text-slate-900">{user.tokens}</span>
                            <Zap className="w-3 h-3 text-teal-500" />
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-300" />
                        </div>
                      </button>
                    )) : (
                      <div className="p-12 text-center">
                        <p className="text-slate-400 font-bold text-sm">No accounts found.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Details & Actions */}
              <div className="lg:col-span-2">
                {selectedUser ? (
                  <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                    {/* Account Overview */}
                    <div className="bg-white rounded-[2.5rem] p-10 border border-slate-200 shadow-2xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-12 opacity-5">
                        <Building2 className="w-48 h-48 text-slate-900" />
                      </div>
                      
                      <div className="relative z-10">
                        <div className="flex items-start justify-between mb-10">
                          <div>
                            <div className="flex items-center space-x-3 mb-4">
                              <div className={`inline-flex items-center space-x-2 px-3 py-1 ${selectedUser.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'} rounded-full border`}>
                                <Shield className="w-3 h-3" />
                                <span className="text-[9px] font-black uppercase tracking-widest">{selectedUser.status === 'ACTIVE' ? 'Active Client' : 'Inactive Client'}</span>
                              </div>
                              <button 
                                onClick={() => handleEditClient(selectedUser)}
                                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-900 transition-all"
                                title="Edit Account Details"
                              >
                                <Settings className="w-4 h-4" />
                              </button>
                            </div>
                            <h2 className="text-4xl font-black text-slate-900 tracking-tight">{selectedUser.orgName}</h2>
                            <p className="text-slate-500 font-medium flex items-center space-x-2 mt-2">
                              <Database className="w-4 h-4 text-red-500" />
                              <span className="font-mono text-sm font-bold">{selectedUser.accountNumber}</span>
                              <span className="text-slate-300">|</span>
                              <Mail className="w-4 h-4" />
                              <span>{selectedUser.email}</span>
                              {selectedUser.contactPhone && (
                                <>
                                  <span className="text-slate-300">|</span>
                                  <Phone className="w-4 h-4" />
                                  <span>{selectedUser.contactPhone}</span>
                                </>
                              )}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                          <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                            <div className="flex items-center space-x-2 text-slate-400 mb-2">
                              <Calendar className="w-4 h-4" />
                              <span className="text-[10px] font-black uppercase tracking-widest">Joined</span>
                            </div>
                            <p className="text-lg font-black text-slate-900">{new Date(selectedUser.joinedAt).toLocaleDateString()}</p>
                          </div>
                          <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                            <div className="flex items-center space-x-2 text-slate-400 mb-2">
                              <CreditCard className="w-4 h-4" />
                              <span className="text-[10px] font-black uppercase tracking-widest">Current Plan</span>
                            </div>
                            <p className="text-lg font-black text-teal-600 uppercase">{selectedUser.plan}</p>
                          </div>
                          <div className="p-6 bg-slate-900 rounded-3xl border border-slate-800 shadow-xl">
                            <div className="flex items-center space-x-2 text-slate-500 mb-2">
                              <Zap className="w-4 h-4 text-teal-400" />
                              <span className="text-[10px] font-black uppercase tracking-widest">Available Tokens</span>
                            </div>
                            <p className="text-3xl font-black text-white">{selectedUser.tokens}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Token Management */}
                    <div className="bg-white rounded-[2.5rem] p-10 border border-slate-200 shadow-xl">
                      <h3 className="text-xl font-black text-slate-900 mb-8 flex items-center space-x-3">
                        <Zap className="w-6 h-6 text-teal-500" />
                        <span>Token Allocation Override</span>
                      </h3>

                      <div className="flex flex-col md:flex-row items-center gap-8">
                        <div className="flex-grow">
                          <p className="text-slate-500 font-medium mb-4">Manually adjust the token balance for this institutional account. Changes are applied immediately to the registry.</p>
                          <div className="flex items-center space-x-4">
                            <button 
                              onClick={() => updateTokens(selectedUser.email, -1)}
                              className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center hover:bg-slate-200 transition-all text-slate-600"
                            >
                              <Minus className="w-6 h-6" />
                            </button>
                            <div className="w-32 h-14 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-center">
                              <span className="text-2xl font-black text-slate-900">{selectedUser.tokens}</span>
                            </div>
                            <button 
                              onClick={() => updateTokens(selectedUser.email, 1)}
                              className="w-14 h-14 bg-red-600 rounded-2xl flex items-center justify-center hover:bg-red-700 transition-all text-white shadow-lg shadow-red-600/20"
                            >
                              <Plus className="w-6 h-6" />
                            </button>
                          </div>
                        </div>

                        <div className="w-full md:w-64 space-y-3">
                          <button 
                            onClick={() => updateTokens(selectedUser.email, 10)}
                            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all"
                          >
                            Add 10 Tokens
                          </button>
                          <button 
                            onClick={() => toggleUserStatus(selectedUser.email)}
                            className={`w-full py-4 border-2 ${selectedUser.status === 'ACTIVE' ? 'border-red-200 text-red-600 hover:bg-red-50' : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'} rounded-2xl font-black text-xs uppercase tracking-widest transition-all`}
                          >
                            {selectedUser.status === 'ACTIVE' ? 'Deactivate Client' : 'Activate Client'}
                          </button>
                          <button 
                            onClick={() => resetPassword(selectedUser.email)}
                            className="w-full py-4 bg-amber-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-amber-600 transition-all shadow-lg shadow-amber-500/20"
                          >
                            Reset Password
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Subscription Details */}
                    <div className="bg-slate-50 rounded-[2.5rem] p-10 border border-slate-200 border-dashed">
                      <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] mb-6">Subscription Metadata</h3>
                      <div className="grid grid-cols-2 gap-8">
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Stripe Customer ID</p>
                          <p className="font-mono text-xs text-slate-900">cus_placeholder_123</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Last Billing Cycle</p>
                          <p className="font-mono text-xs text-slate-900">N/A (Free Tier / Manual)</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Compliance Status</p>
                          <p className="text-xs font-black text-emerald-600 uppercase">Active / Compliant</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Data Retention Policy</p>
                          <p className="text-xs font-black text-slate-900 uppercase">Standard (90 Days)</p>
                        </div>
                      </div>
                    </div>

                    {/* Client Specific Transactions */}
                    <div className="bg-white rounded-[2.5rem] p-10 border border-slate-200 shadow-xl">
                      <div className="flex items-center justify-between mb-8">
                        <h3 className="text-xl font-black text-slate-900 flex items-center space-x-3">
                          <DollarSign className="w-6 h-6 text-emerald-500" />
                          <span>Account Transactions</span>
                        </h3>
                        <button 
                          onClick={() => handleCreateInvoice(selectedUser, 10, 150)}
                          className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-700 transition-all"
                        >
                          Generate Invoice
                        </button>
                      </div>
                      
                      <div className="space-y-4">
                        {invoices.filter(inv => inv.clientEmail === selectedUser.email).length > 0 ? (
                          invoices.filter(inv => inv.clientEmail === selectedUser.email).map(invoice => (
                            <div key={invoice.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                              <div>
                                <button 
                                  onClick={() => {
                                    setSelectedInvoice(invoice);
                                    setInvoiceEditData(invoice);
                                    setShowInvoiceModal(true);
                                  }}
                                  className="font-black text-red-600 text-sm hover:underline"
                                >
                                  {invoice.id}
                                </button>
                                <p className="text-[10px] text-slate-400 font-bold">{invoice.date}</p>
                              </div>
                              <div className="flex items-center space-x-6">
                                <div className="text-right">
                                  <p className="font-black text-slate-900">${invoice.amount}</p>
                                  <p className="text-[10px] text-teal-600 font-bold">+{invoice.tokens} Tokens</p>
                                </div>
                                <span className={`px-2 py-1 rounded-md text-[8px] font-black uppercase tracking-widest ${invoice.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                  {invoice.status}
                                </span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                            <p className="text-slate-400 text-xs font-bold">No transactions found for this node.</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Client Activity Ledger */}
                    <div className="bg-white rounded-[2.5rem] p-10 border border-slate-200 shadow-xl">
                      <div className="flex items-center justify-between mb-8">
                        <h3 className="text-xl font-black text-slate-900 flex items-center space-x-3">
                          <Database className="w-6 h-6 text-blue-500" />
                          <span>Client Activity Ledger</span>
                        </h3>
                        <div className="flex items-center space-x-2">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Audit History</span>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        {clientLedger.filter(entry => entry.userEmail === selectedUser.email).length > 0 ? (
                          <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                              <thead>
                                <tr className="text-slate-400 text-[10px] uppercase tracking-widest font-black border-b border-slate-100">
                                  <th className="pb-4">Timestamp</th>
                                  <th className="pb-4">Event Type</th>
                                  <th className="pb-4">Description</th>
                                  <th className="pb-4 text-right">Impact</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-50">
                                {clientLedger
                                  .filter(entry => entry.userEmail === selectedUser.email)
                                  .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                                  .map((entry) => (
                                    <tr key={entry.id} className="hover:bg-slate-50/50 transition-colors">
                                      <td className="py-4 whitespace-nowrap">
                                        <p className="text-[10px] font-mono font-bold text-slate-500">{entry.timestamp}</p>
                                      </td>
                                      <td className="py-4">
                                        <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest ${
                                          entry.type === 'TOKEN_DEDUCTION' ? 'bg-red-50 text-red-600' :
                                          entry.type === 'TOKEN_ADDITION' ? 'bg-emerald-50 text-emerald-600' :
                                          entry.type === 'INVOICE_ISSUED' ? 'bg-blue-50 text-blue-600' :
                                          'bg-slate-50 text-slate-600'
                                        }`}>
                                          {entry.type.replace('_', ' ')}
                                        </span>
                                      </td>
                                      <td className="py-4">
                                        <p className="text-xs font-bold text-slate-700">{entry.description}</p>
                                        {entry.referenceId && <p className="text-[9px] font-mono text-slate-400">REF: {entry.referenceId}</p>}
                                      </td>
                                      <td className="py-4 text-right">
                                        {entry.amount !== undefined && (
                                          <span className={`text-xs font-black ${entry.type === 'TOKEN_DEDUCTION' ? 'text-red-600' : 'text-emerald-600'}`}>
                                            {entry.type === 'TOKEN_DEDUCTION' ? '-' : '+'}{entry.amount} Tokens
                                          </span>
                                        )}
                                      </td>
                                    </tr>
                                  ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="p-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                            <Database className="w-10 h-10 text-slate-200 mx-auto mb-4" />
                            <p className="text-slate-400 text-xs font-bold">No ledger entries recorded for this node yet.</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Client Specific Verifications */}
                    <div className="bg-white rounded-[2.5rem] p-10 border border-slate-200 shadow-xl">
                      <div className="flex items-center justify-between mb-8">
                        <h3 className="text-xl font-black text-slate-900 flex items-center space-x-3">
                          <ClipboardList className="w-6 h-6 text-amber-500" />
                          <span>Verification Lifecycles</span>
                        </h3>
                        <button 
                          onClick={() => {
                            localStorage.setItem('wv_admin_acting_as', selectedUser.email);
                            navigate('/generate');
                          }}
                          className="px-4 py-2 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center space-x-2"
                        >
                          <Plus className="w-3 h-3" />
                          <span>New Verification</span>
                        </button>
                      </div>

                      <div className="space-y-4">
                        {JSON.parse(localStorage.getItem('wv_queue') || '[]').filter((q: any) => q.submitter === selectedUser.email || q.submitter === selectedUser.orgName).length > 0 ? (
                          JSON.parse(localStorage.getItem('wv_queue') || '[]')
                            .filter((q: any) => q.submitter === selectedUser.email || q.submitter === selectedUser.orgName)
                            .map((item: any) => (
                              <div key={item.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-slate-200 transition-all">
                                <div className="flex items-center justify-between mb-2">
                                  <p className="font-black text-slate-900 text-sm">{item.applicant}</p>
                                  <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${
                                    item.status === 'VERIFIED' ? 'bg-emerald-100 text-emerald-700' :
                                    item.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                                    'bg-amber-100 text-amber-700'
                                  }`}>
                                    {item.status}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between text-[10px]">
                                  <p className="text-slate-500 font-bold">{item.company} • {item.type}</p>
                                  <div className="flex items-center space-x-2">
                                    <span className="text-slate-400">{item.id}</span>
                                    <button 
                                      onClick={() => handleProcessQueueItem(item)}
                                      disabled={item.status === 'VERIFIED'}
                                      className="text-emerald-600 hover:text-emerald-700 disabled:opacity-30"
                                    >
                                      <CheckCircle2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))
                        ) : (
                          <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                            <p className="text-slate-400 text-xs font-bold">No active lifecycles for this node.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-20 bg-white rounded-[3rem] border border-slate-200 border-dashed">
                    <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mb-6">
                      <Users className="w-10 h-10 text-slate-300" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 mb-2">No Account Selected</h3>
                    <p className="text-slate-400 font-medium max-w-xs">Select an institutional account from the list to manage its lifecycle and token allocation.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeView === 'invoicing' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-xl">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                      <DollarSign className="w-6 h-6 text-emerald-600" />
                    </div>
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Total Revenue</span>
                  </div>
                  <p className="text-3xl font-black text-slate-900">${invoices.reduce((acc, inv) => acc + (inv.status === 'Paid' ? inv.amount : 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  <p className="text-xs font-bold text-emerald-600 mt-2 flex items-center">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    +12% from last month
                  </p>
                </div>
                <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-xl">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                      <Clock className="w-6 h-6 text-blue-600" />
                    </div>
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Pending Invoices</span>
                  </div>
                  <p className="text-3xl font-black text-slate-900">{invoices.filter(i => i.status === 'Pending').length}</p>
                  <p className="text-xs font-bold text-slate-400 mt-2">Awaiting client payment</p>
                </div>
                <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-xl">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center">
                      <Zap className="w-6 h-6 text-teal-600" />
                    </div>
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Token Sales</span>
                  </div>
                  <p className="text-3xl font-black text-slate-900">{invoices.reduce((acc, inv) => acc + inv.tokens, 0).toLocaleString()}</p>
                  <p className="text-xs font-bold text-teal-600 mt-2">Units distributed YTD</p>
                </div>
              </div>

              <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl overflow-hidden">
                <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                  <h3 className="text-lg font-black text-slate-900">Recent Financial Activity</h3>
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => setShowCreateInvoiceModal(true)}
                      className="px-6 py-2 bg-emerald-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-700 transition-all flex items-center space-x-2"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Create Invoice</span>
                    </button>
                    <button className="px-6 py-2 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all">Export Ledger</button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-50 text-left">
                        <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Invoice ID</th>
                        <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Agent ID</th>
                        <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Client</th>
                        <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tokens</th>
                        <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount</th>
                        <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                        <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {invoices.map((invoice) => (
                        <tr key={invoice.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-6">
                            <button 
                              onClick={() => {
                                setSelectedInvoice(invoice);
                                setInvoiceEditData(invoice);
                                setShowInvoiceModal(true);
                              }}
                              className="font-mono text-xs font-black text-red-600 hover:underline"
                            >
                              {invoice.id}
                            </button>
                          </td>
                          <td className="p-6">
                            <p className="text-[10px] font-mono font-bold text-teal-600">{invoice.agentId || 'SYS-001'}</p>
                          </td>
                          <td className="p-6">
                            <p className="font-black text-slate-900 text-sm">{invoice.clientName}</p>
                            <p className="text-[10px] text-slate-400 font-bold">{invoice.clientEmail}</p>
                          </td>
                          <td className="p-6">
                            <div className="flex items-center space-x-1">
                              <span className="font-black text-slate-900">{invoice.tokens}</span>
                              <Zap className="w-3 h-3 text-teal-500" />
                            </div>
                          </td>
                          <td className="p-6 font-black text-slate-900">${invoice.amount.toFixed(2)}</td>
                          <td className="p-6 text-xs font-bold text-slate-500">{invoice.date}</td>
                          <td className="p-6">
                            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                              invoice.status === 'Paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                              invoice.status === 'Pending' ? 'bg-blue-50 text-blue-600 border-blue-100' : 
                              'bg-red-50 text-red-600 border-red-100'
                            }`}>
                              {invoice.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeView === 'prospectQueue' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden">
                <div className="p-8 border-b border-slate-100 flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-black text-slate-900">Unclaimed Prospect Queue</h3>
                    <p className="text-slate-500 text-sm mt-1">Select and claim institutional leads to add to your personal bank</p>
                  </div>
                  <button 
                    onClick={() => {
                      const queueProspects = prospects.filter(p => !p.agentId);
                      if (queueProspects.length > 0) {
                        setSelectedProspect(queueProspects[0]);
                      } else {
                        showNotification("No unclaimed prospects available.", "INFO");
                      }
                    }}
                    className="px-4 py-2 bg-teal-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-teal-700 transition-colors flex items-center space-x-2"
                  >
                    <Phone className="w-4 h-4" />
                    <span>Start Call Queue</span>
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-100">
                        <th className="px-2 py-1 text-[10px] font-black text-slate-500 uppercase tracking-widest border-r border-slate-200 whitespace-nowrap">ID</th>
                        <th className="px-2 py-1 text-[10px] font-black text-slate-500 uppercase tracking-widest border-r border-slate-200 whitespace-nowrap">Email</th>
                        <th className="px-2 py-1 text-[10px] font-black text-slate-500 uppercase tracking-widest border-r border-slate-200 whitespace-nowrap">Phone</th>
                        <th className="px-2 py-1 text-[10px] font-black text-slate-500 uppercase tracking-widest border-r border-slate-200 whitespace-nowrap">Company</th>
                        <th className="px-2 py-1 text-[10px] font-black text-slate-500 uppercase tracking-widest border-r border-slate-200 whitespace-nowrap">Created At</th>
                        <th className="px-2 py-1 text-[10px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {prospects
                        .filter(p => !p.agentId)
                        .map((prospect) => (
                        <tr key={prospect.id} className="hover:bg-slate-50 transition-colors group">
                          <td className="px-2 py-0.5 border-r border-slate-200 whitespace-nowrap">
                            <span className="text-[10px] font-mono font-bold text-slate-500">{prospect.id}</span>
                          </td>
                          <td className="px-2 py-0.5 border-r border-slate-200 whitespace-nowrap">
                            <span className="text-[10px] font-bold text-slate-900">{prospect.email || '-'}</span>
                          </td>
                          <td className="px-2 py-0.5 border-r border-slate-200 whitespace-nowrap">
                            <span className="text-[10px] font-bold text-slate-900">{prospect.contactPhone || '-'}</span>
                          </td>
                          <td className="px-2 py-0.5 border-r border-slate-200 whitespace-nowrap">
                            <span className="text-[10px] text-slate-600">{prospect.company || '-'}</span>
                          </td>
                          <td className="px-2 py-0.5 border-r border-slate-200 whitespace-nowrap">
                            <span className="text-[10px] text-slate-500">{prospect.createdAt ? new Date(prospect.createdAt).toLocaleDateString() : '-'}</span>
                          </td>
                          <td className="px-2 py-0.5 flex space-x-2 whitespace-nowrap">
                            <button 
                              onClick={() => setSelectedProspect(prospect)}
                              className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-[9px] font-black uppercase tracking-widest hover:bg-slate-200 transition-colors"
                            >
                              View
                            </button>
                            <button 
                              onClick={() => handleClaimProspect(prospect.id)}
                              className="px-2 py-1 bg-teal-600 text-white rounded text-[9px] font-black uppercase tracking-widest hover:bg-teal-700 transition-colors flex items-center space-x-1"
                            >
                              <Zap className="w-3 h-3" />
                              <span>Claim</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                      {prospects.filter(p => !p.agentId).length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-8 py-12 text-center text-slate-400 font-medium italic">
                            No unclaimed prospects available in the queue.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeView === 'agentBank' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden">
                <div className="p-8 border-b border-slate-100 flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-black text-slate-900">My Prospect Bank</h3>
                    <p className="text-slate-500 text-sm mt-1">Manage institutional leads assigned to you</p>
                  </div>
                  <button 
                    onClick={() => {
                      const queueProspects = prospects.filter(p => p.agentId === currentAdmin?.id && p.status !== 'Closed/Not Interested' && p.status !== 'Extend Free Trial (Open Account)');
                      if (queueProspects.length > 0) {
                        setSelectedProspect(queueProspects[0]);
                      } else {
                        showNotification("No active prospects in your bank to call.", "INFO");
                      }
                    }}
                    className="px-4 py-2 bg-teal-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-teal-700 transition-colors flex items-center space-x-2"
                  >
                    <Phone className="w-4 h-4" />
                    <span>Start Call Queue</span>
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-100">
                        <th className="px-2 py-1 text-[10px] font-black text-slate-500 uppercase tracking-widest border-r border-slate-200 whitespace-nowrap">ID</th>
                        <th className="px-2 py-1 text-[10px] font-black text-slate-500 uppercase tracking-widest border-r border-slate-200 whitespace-nowrap">Email</th>
                        <th className="px-2 py-1 text-[10px] font-black text-slate-500 uppercase tracking-widest border-r border-slate-200 whitespace-nowrap">Phone</th>
                        <th className="px-2 py-1 text-[10px] font-black text-slate-500 uppercase tracking-widest border-r border-slate-200 whitespace-nowrap">Company</th>
                        <th className="px-2 py-1 text-[10px] font-black text-slate-500 uppercase tracking-widest border-r border-slate-200 whitespace-nowrap">Status</th>
                        <th className="px-2 py-1 text-[10px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {prospects
                        .filter(p => p.agentId === currentAdmin?.id)
                        .map((prospect) => (
                        <tr key={prospect.id} className="hover:bg-slate-50 transition-colors group">
                          <td className="px-2 py-0.5 border-r border-slate-200 whitespace-nowrap">
                            <span className="text-[10px] font-mono font-bold text-slate-500">{prospect.id}</span>
                          </td>
                          <td className="px-2 py-0.5 border-r border-slate-200 whitespace-nowrap">
                            <span className="text-[10px] font-bold text-slate-900">{prospect.email || '-'}</span>
                          </td>
                          <td className="px-2 py-0.5 border-r border-slate-200 whitespace-nowrap">
                            <span className="text-[10px] font-bold text-slate-900">{prospect.contactPhone || '-'}</span>
                          </td>
                          <td className="px-2 py-0.5 border-r border-slate-200 whitespace-nowrap">
                            <span className="text-[10px] text-slate-600">{prospect.company || '-'}</span>
                          </td>
                          <td className="px-2 py-0.5 border-r border-slate-200 whitespace-nowrap">
                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${
                              prospect.status === 'Closed/Not Interested' ? 'bg-red-50 text-red-600 border-red-100' : 
                              prospect.status === 'Extend Free Trial (Open Account)' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                              'bg-blue-50 text-blue-600 border-blue-100'
                            }`}>
                              {prospect.status}
                            </span>
                          </td>
                          <td className="px-2 py-0.5 whitespace-nowrap">
                            <button 
                              onClick={() => setSelectedProspect(prospect)}
                              className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-[9px] font-black uppercase tracking-widest hover:bg-slate-200 transition-colors"
                            >
                              Manage
                            </button>
                          </td>
                        </tr>
                      ))}
                      {prospects.filter(p => p.agentId === currentAdmin?.id).length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-8 py-12 text-center text-slate-400 font-medium italic">
                            You haven't claimed any prospects yet. Visit the Prospect Queue to start.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeView === 'prospects' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-slate-900 rounded-[2.5rem] p-12 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 p-12 opacity-10">
                  <TrendingUp className="w-64 h-64" />
                </div>
                <div className="relative z-10 max-w-2xl">
                  <h3 className="text-3xl font-black mb-4">Marketing Outreach Engine</h3>
                  <p className="text-slate-400 font-medium mb-8 leading-relaxed">
                    Automate your institutional outreach. Connect with decision makers at financial institutions, property management groups, and HR departments.
                  </p>
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col sm:flex-row gap-4 items-center">
                      <div className="relative flex-1 w-full max-w-md">
                        <input 
                          type="email" 
                          placeholder="Enter prospect email..." 
                          className="w-full pl-6 pr-4 py-4 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                          value={campaignEmail}
                          onChange={(e) => setCampaignEmail(e.target.value)}
                        />
                      </div>
                      <button 
                        onClick={handleSendCampaign}
                        disabled={isSendingCampaign || !campaignEmail}
                        className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                      >
                        {isSendingCampaign ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                        <span>Sent Info</span>
                      </button>
                      <button 
                        onClick={() => setShowLeadSources(true)}
                        className="px-8 py-4 bg-white/10 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-white/20 transition-all border border-white/10"
                      >
                        View Lead Sources
                      </button>
                      <button 
                        onClick={handleSendBulkInitialEmail}
                        disabled={isSendingCampaign}
                        className="px-8 py-4 bg-teal-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-teal-700 transition-all shadow-lg shadow-teal-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                      >
                        {isSendingCampaign ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                        <span>Send Initial Email to All</span>
                      </button>
                    </div>
                    <p className="text-xs text-slate-400 font-medium ml-2">
                      * Sends an automated intro email with free trial offer.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden">
                <div className="p-8 border-b border-slate-100 flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-black text-slate-900">Prospect Bank</h3>
                    <p className="text-slate-500 text-sm mt-1">Manage and track institutional leads</p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <select
                      value={prospectMonthFilter}
                      onChange={(e) => setProspectMonthFilter(e.target.value)}
                      className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All Months</option>
                      {Array.from(new Set(prospects.map(p => {
                        const date = new Date(p.createdAt || new Date());
                        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                      }))).sort().reverse().map((month: any) => {
                        const [year, m] = month.split('-');
                        const date = new Date(parseInt(year), parseInt(m) - 1);
                        return (
                          <option key={month} value={month}>
                            {date.toLocaleString('default', { month: 'long', year: 'numeric' })}
                          </option>
                        );
                      })}
                    </select>
                    <button
                      onClick={syncAllProspects}
                      disabled={isSyncingAll}
                      className="px-4 py-2 bg-purple-100 text-purple-700 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-purple-200 transition-colors flex items-center space-x-2 disabled:opacity-50"
                    >
                      {isSyncingAll ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                      <span>{isSyncingAll ? 'Syncing...' : 'Sync Details'}</span>
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm('Are you sure you want to archive data older than 3 months?')) {
                          const threeMonthsAgo = new Date();
                          threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
                          const updatedProspects = prospects.filter(p => new Date(p.createdAt) >= threeMonthsAgo);
                          setProspects(updatedProspects);
                          localStorage.setItem('wv_prospects', JSON.stringify(updatedProspects));
                          logAction('Archive Prospects', 'Archived prospects older than 3 months', 'INFO');
                        }
                      }}
                      className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-colors flex items-center space-x-2"
                    >
                      <Archive className="w-3 h-3" />
                      <span>Archive Old</span>
                    </button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-100">
                        <th className="px-2 py-1 text-[10px] font-black text-slate-500 uppercase tracking-widest border-r border-slate-200 whitespace-nowrap">ID</th>
                        <th className="px-2 py-1 text-[10px] font-black text-slate-500 uppercase tracking-widest border-r border-slate-200 whitespace-nowrap">Email</th>
                        <th className="px-2 py-1 text-[10px] font-black text-slate-500 uppercase tracking-widest border-r border-slate-200 whitespace-nowrap">Company</th>
                        <th className="px-2 py-1 text-[10px] font-black text-slate-500 uppercase tracking-widest border-r border-slate-200 whitespace-nowrap">Status</th>
                        <th className="px-2 py-1 text-[10px] font-black text-slate-500 uppercase tracking-widest border-r border-slate-200 whitespace-nowrap">Agent</th>
                        <th className="px-2 py-1 text-[10px] font-black text-slate-500 uppercase tracking-widest border-r border-slate-200 whitespace-nowrap">Created At</th>
                        <th className="px-2 py-1 text-[10px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {prospects
                        .filter(p => {
                          if (prospectMonthFilter === 'all') return true;
                          const date = new Date(p.createdAt);
                          const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                          return monthStr === prospectMonthFilter;
                        })
                        .map((prospect) => (
                        <tr key={prospect.id} className="hover:bg-slate-50 transition-colors group">
                          <td className="px-2 py-0.5 border-r border-slate-200 whitespace-nowrap">
                            <span className="text-[10px] font-mono font-bold text-slate-500">{prospect.id}</span>
                          </td>
                          <td className="px-2 py-0.5 border-r border-slate-200 whitespace-nowrap">
                            <span className="text-[10px] font-bold text-slate-900">
                              {prospect.email}
                              {prospect.updatedFields?.includes('email') && <span className="text-purple-600 font-black ml-1">*</span>}
                            </span>
                          </td>
                          <td className="px-2 py-0.5 border-r border-slate-200 whitespace-nowrap">
                            <span className="text-[10px] text-slate-600">
                              {prospect.company || '-'}
                              {prospect.updatedFields?.includes('company') && <span className="text-purple-600 font-black ml-1">*</span>}
                            </span>
                          </td>
                          <td className="px-2 py-0.5 border-r border-slate-200 whitespace-nowrap">
                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${
                              prospect.status === 'Closed/Not Interested' ? 'bg-red-50 text-red-600 border-red-100' : 
                              prospect.status === 'Extend Free Trial (Open Account)' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                              'bg-blue-50 text-blue-600 border-blue-100'
                            }`}>
                              {prospect.status}
                            </span>
                          </td>
                          <td className="px-2 py-0.5 border-r border-slate-200 whitespace-nowrap">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                              {prospect.agentId ? (agents.find(a => a.id === prospect.agentId)?.name || prospect.agentId) : 'UNCLAIMED'}
                            </span>
                          </td>
                          <td className="px-2 py-0.5 border-r border-slate-200 whitespace-nowrap">
                            <span className="text-[10px] text-slate-500">{prospect.createdAt ? new Date(prospect.createdAt).toLocaleDateString() : '-'}</span>
                          </td>
                          <td className="px-2 py-0.5 flex items-center space-x-2 whitespace-nowrap">
                            <button 
                              onClick={() => setSelectedProspect(prospect)}
                              className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-[9px] font-black uppercase tracking-widest hover:bg-slate-200 transition-colors"
                            >
                              View
                            </button>
                            <button 
                              onClick={() => enrichProspect(prospect)}
                              disabled={enriching === prospect.id}
                              className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-[9px] font-black uppercase tracking-widest hover:bg-purple-200 transition-colors disabled:opacity-50"
                            >
                              {enriching === prospect.id ? '...' : 'Enrich'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
          {activeView === 'tasks' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-xl">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Tasks</h4>
                  <p className="text-3xl font-black text-slate-900">{tasks.length}</p>
                </div>
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-xl">
                  <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-2">Pending</h4>
                  <p className="text-3xl font-black text-slate-900">{tasks.filter(t => t.status === 'PENDING').length}</p>
                </div>
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-xl">
                  <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-2">Completed</h4>
                  <p className="text-3xl font-black text-slate-900">{tasks.filter(t => t.status === 'COMPLETED').length}</p>
                </div>
              </div>

              <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl overflow-hidden">
                <div className="p-8 border-bottom border-slate-100 bg-slate-50/50 flex items-center justify-between">
                  <h3 className="text-xl font-black text-slate-900">Task Queue</h3>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Sort by:</span>
                    <select className="bg-transparent border-none text-xs font-black text-slate-900 focus:ring-0 cursor-pointer">
                      <option>Due Date</option>
                      <option>Priority</option>
                    </select>
                  </div>
                </div>
                <div className="divide-y divide-slate-100">
                  {tasks.length === 0 ? (
                    <div className="p-20 text-center">
                      <ClipboardList className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                      <p className="text-slate-400 font-bold">No tasks assigned yet.</p>
                    </div>
                  ) : (
                    tasks.map((task) => (
                      <div key={task.id} className={`p-8 flex items-center justify-between hover:bg-slate-50 transition-all ${task.status === 'COMPLETED' ? 'opacity-60' : ''}`}>
                        <div className="flex items-center space-x-6">
                          <button 
                            onClick={() => handleCompleteTask(task.id)}
                            className={`w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-all ${
                              task.status === 'COMPLETED' 
                                ? 'bg-emerald-500 border-emerald-500 text-white' 
                                : 'border-slate-200 hover:border-blue-500 text-transparent hover:text-blue-500'
                            }`}
                          >
                            <CheckCircle2 className="w-5 h-5" />
                          </button>
                          <div>
                            <h4 className={`font-black text-lg ${task.status === 'COMPLETED' ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                              {task.title}
                            </h4>
                            <p className="text-sm text-slate-500 font-medium max-w-xl">{task.description}</p>
                            <div className="flex items-center space-x-4 mt-2">
                              <span className="flex items-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                <Calendar className="w-3 h-3 mr-1" />
                                Due: {task.dueDate}
                              </span>
                              <span className="flex items-center text-[10px] font-black text-blue-500 uppercase tracking-widest">
                                <Shield className="w-3 h-3 mr-1" />
                                Agent: {task.agentId}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <button 
                            onClick={() => handleDeleteTask(task.id)}
                            className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {activeView === 'inbox' && (
            <div className="h-[calc(100vh-180px)] flex bg-white rounded-[3rem] border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Mail Sidebar */}
              <div className="w-64 border-r border-slate-100 bg-slate-50/50 flex flex-col">
                <div className="p-6 space-y-3">
                  <button 
                    onClick={handleSyncMailbox}
                    disabled={isSendingEmail}
                    className="w-full py-3 bg-white border-2 border-slate-100 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all disabled:opacity-50 flex items-center justify-center space-x-2 text-slate-600"
                  >
                    {isSendingEmail ? <Loader2 className="w-4 h-4 animate-spin" /> : <Activity className="w-4 h-4 text-teal-500" />}
                    <span>Sync Mailbox</span>
                  </button>
                  <button 
                    onClick={() => {
                      setComposeData({ to: '', cc: '', bcc: '', subject: '', body: '' });
                      setShowComposeModal(true);
                    }}
                    className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg flex items-center justify-center space-x-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Compose</span>
                  </button>
                </div>
                
                <nav className="flex-1 px-4 space-y-1">
                  {[
                    { id: 'INBOX', icon: Inbox, label: 'Inbox', count: emails.filter(e => e.folder === 'INBOX' && e.status === 'UNREAD').length },
                    { id: 'HELPDESK', icon: Shield, label: 'Helpdesk', count: tickets.filter(t => t.status === 'OPEN').length },
                    { id: 'SENT', icon: Send, label: 'Sent', count: 0 },
                    { id: 'ARCHIVE', icon: Archive, label: 'Archive', count: 0 },
                    { id: 'TRASH', icon: Trash2, label: 'Trash', count: 0 },
                  ].map((folder) => (
                    <button
                      key={folder.id}
                      onClick={() => {
                        setActiveMailFolder(folder.id as any);
                        setSelectedEmail(null);
                      }}
                      className={`w-full flex items-center justify-between p-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeMailFolder === folder.id ? 'bg-white text-slate-900 shadow-sm border border-slate-100' : 'text-slate-400 hover:bg-white/50'}`}
                    >
                      <div className="flex items-center space-x-3">
                        <folder.icon className={`w-4 h-4 ${activeMailFolder === folder.id ? 'text-teal-500' : ''}`} />
                        <span>{folder.label}</span>
                      </div>
                      {folder.count > 0 && (
                        <span className="bg-teal-500 text-white px-2 py-0.5 rounded-full text-[8px]">{folder.count}</span>
                      )}
                    </button>
                  ))}
                </nav>

                <div className="p-6 border-t border-slate-100">
                  <div className="bg-teal-50 p-4 rounded-2xl border border-teal-100">
                    <div className="flex items-center space-x-2 text-teal-700 mb-1">
                      <Shield className="w-3 h-3" />
                      <span className="text-[8px] font-black uppercase tracking-widest">Secure Gateway</span>
                    </div>
                    <p className="text-[10px] text-teal-600 font-bold">All communications are encrypted via WeVerify Client Node.</p>
                  </div>
                </div>
              </div>

              {/* Message List */}
              <div className="w-96 border-r border-slate-100 flex flex-col bg-white">
                <div className="p-6 border-b border-slate-100 space-y-4">
                  <div className="relative">
                    <input 
                      type="text" 
                      placeholder={activeMailFolder === 'HELPDESK' ? "Search tickets..." : "Search messages..."}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-teal-500/20 outline-none transition-all"
                    />
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  </div>
                  {activeMailFolder !== 'HELPDESK' && (
                    <div className="flex items-center space-x-2">
                      <select
                        value={emailMonthFilter}
                        onChange={(e) => setEmailMonthFilter(e.target.value)}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
                      >
                        <option value="all">All Months</option>
                        {Array.from(new Set(emails.map(e => {
                          const date = new Date(e.timestamp);
                          return isNaN(date.getTime()) ? null : `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                        }).filter(Boolean))).sort().reverse().map((month: any) => {
                          if (!month) return null;
                          const [year, m] = month.split('-');
                          const date = new Date(parseInt(year), parseInt(m) - 1);
                          return (
                            <option key={month} value={month}>
                              {date.toLocaleString('default', { month: 'long', year: 'numeric' })}
                            </option>
                          );
                        })}
                      </select>
                      <button
                        onClick={() => {
                          if (window.confirm('Are you sure you want to archive emails older than 3 months?')) {
                            const threeMonthsAgo = new Date();
                            threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
                            const updatedEmails = emails.map(e => {
                              const date = new Date(e.timestamp);
                              if (!isNaN(date.getTime()) && date < threeMonthsAgo && e.folder !== 'ARCHIVE') {
                                return { ...e, folder: 'ARCHIVE' as const };
                              }
                              return e;
                            });
                            setEmails(updatedEmails);
                            localStorage.setItem('wv_emails', JSON.stringify(updatedEmails));
                            logAction('Archive Emails', 'Archived emails older than 3 months', 'INFO');
                          }
                        }}
                        className="p-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-colors"
                        title="Archive Old Emails"
                      >
                        <Archive className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
                
                <div className="flex-1 overflow-y-auto">
                  {activeMailFolder === 'HELPDESK' ? (
                    tickets.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center p-10">
                        <Shield className="w-10 h-10 text-slate-200 mb-4" />
                        <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">No active helpdesk tickets</p>
                      </div>
                    ) : (
                      tickets.map((ticket) => (
                        <button
                          key={ticket.id}
                          onClick={() => {
                            // Handle ticket selection if needed
                          }}
                          className={`w-full p-6 text-left border-b border-slate-50 hover:bg-slate-50 transition-all relative`}
                        >
                          <div className="flex justify-between items-start mb-1">
                            <span className="text-[10px] font-black uppercase tracking-tight truncate max-w-[150px] text-slate-900">
                              {ticket.sender}
                            </span>
                            <span className="text-[8px] font-mono text-slate-400">{ticket.createdAt.split(',')[0]}</span>
                          </div>
                          <h4 className="text-xs font-black text-slate-900 mb-1 truncate">{ticket.subject}</h4>
                          <p className="text-[10px] text-slate-400 font-bold line-clamp-2">{ticket.messages[0].body}</p>
                          <div className="mt-3 flex items-center justify-between">
                            <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest ${
                              ticket.status === 'OPEN' ? 'bg-red-50 text-red-600' :
                              ticket.status === 'IN_PROGRESS' ? 'bg-blue-50 text-blue-600' :
                              'bg-emerald-50 text-emerald-600'
                            }`}>
                              {ticket.status}
                            </span>
                            <span className="text-[8px] font-mono text-teal-600">#{ticket.id}</span>
                          </div>
                        </button>
                      ))
                    )
                  ) : (
                    emails
                      .filter(e => e.folder === activeMailFolder)
                      .filter(e => {
                        if (emailMonthFilter === 'all') return true;
                        const date = new Date(e.timestamp);
                        if (isNaN(date.getTime())) return true;
                        const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                        return monthStr === emailMonthFilter;
                      })
                      .length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center p-10">
                        <Mail className="w-10 h-10 text-slate-200 mb-4" />
                        <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">No messages in {activeMailFolder.toLowerCase()}</p>
                      </div>
                    ) : (
                      emails
                        .filter(e => e.folder === activeMailFolder)
                        .filter(e => {
                          if (emailMonthFilter === 'all') return true;
                          const date = new Date(e.timestamp);
                          if (isNaN(date.getTime())) return true;
                          const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                          return monthStr === emailMonthFilter;
                        })
                        .map((email) => (
                        <button
                          key={email.id}
                          onClick={() => {
                            setSelectedEmail(email);
                            if (email.status === 'UNREAD') handleMarkAsRead(email.id);
                            if (!floatingEmails.find(f => f.email.id === email.id)) {
                              setFloatingEmails([...floatingEmails, { email, isMinimized: false, position: { x: 50 + (floatingEmails.length * 20), y: 50 + (floatingEmails.length * 20) } }]);
                            }
                          }}
                          className={`w-full p-6 text-left border-b border-slate-50 hover:bg-slate-50 transition-all relative ${floatingEmails.some(f => f.email.id === email.id) ? 'bg-teal-50/30 border-l-4 border-l-teal-500' : ''}`}
                        >
                          <div className="flex justify-between items-start mb-1">
                            <span className={`text-[10px] font-black uppercase tracking-tight truncate max-w-[150px] ${email.status === 'UNREAD' ? 'text-slate-900' : 'text-slate-400'}`}>
                              {activeMailFolder === 'SENT' ? `To: ${email.to}` : email.from}
                            </span>
                            <span className="text-[8px] text-slate-400 font-bold whitespace-nowrap">{email.timestamp.split(',')[0]}</span>
                          </div>
                          <h4 className={`text-xs font-black truncate mb-1 ${email.status === 'UNREAD' ? 'text-slate-900' : 'text-slate-500'}`}>
                            {email.subject}
                          </h4>
                          <p className="text-[10px] text-slate-400 line-clamp-2 font-medium">
                            {email.body}
                          </p>
                          {email.status === 'UNREAD' && (
                            <div className="absolute top-6 right-2 w-2 h-2 bg-teal-500 rounded-full"></div>
                          )}
                        </button>
                      ))
                    )
                  )}
                </div>
              </div>

              {/* Message Preview */}
              <div className="flex-1 bg-slate-50/30 flex flex-col">
                {selectedEmail ? (
                  <>
                    <div className="p-6 bg-white border-b border-slate-100 flex justify-between items-center">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white font-black text-xl">
                          {selectedEmail.from[0].toUpperCase()}
                        </div>
                        <div>
                          <h3 className="text-lg font-black text-slate-900">{selectedEmail.subject}</h3>
                          <p className="text-[10px] text-slate-400 font-bold">
                            From: <span className="text-slate-600">{selectedEmail.from}</span> • {selectedEmail.timestamp}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={() => {
                            if (!floatingEmails.find(f => f.email.id === selectedEmail.id)) {
                              setFloatingEmails([...floatingEmails, { email: selectedEmail, isMinimized: false, position: { x: 50, y: 50 } }]);
                            }
                            setSelectedEmail(null);
                          }}
                          className="p-3 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-indigo-600 transition-all"
                          title="Pop Out"
                        >
                          <ExternalLink className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => handleReply(selectedEmail)}
                          className="p-3 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-teal-600 transition-all"
                          title="Reply"
                        >
                          <Reply className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => handleArchiveEmail(selectedEmail.id)}
                          className="p-3 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-blue-600 transition-all"
                          title="Archive"
                        >
                          <Archive className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => handleDeleteEmail(selectedEmail.id)}
                          className="p-3 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-red-600 transition-all"
                          title="Delete"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                        <div className="w-px h-6 bg-slate-200 mx-2"></div>
                        <button className="p-3 hover:bg-slate-100 rounded-xl text-slate-400 transition-all">
                          <MoreVertical className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex-1 p-10 overflow-y-auto">
                      <div className="bg-white rounded-[2rem] p-10 border border-slate-200 shadow-sm min-h-full">
                        <div className="prose prose-slate max-w-none">
                          {selectedEmail.body.split('\n').map((line, i) => (
                            <p key={i} className="text-slate-600 font-medium leading-relaxed mb-4">{line}</p>
                          ))}
                        </div>
                        
                        {selectedEmail.attachments && selectedEmail.attachments.length > 0 && (
                          <div className="mt-10 pt-10 border-t border-slate-100">
                            <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Attachments ({selectedEmail.attachments.length})</h5>
                            <div className="grid grid-cols-2 gap-4">
                              {selectedEmail.attachments.map((file, i) => (
                                <div key={i} className="flex items-center p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-teal-200 transition-all cursor-pointer group">
                                  <FileText className="w-5 h-5 text-slate-400 group-hover:text-teal-500 mr-3" />
                                  <div className="flex-1 truncate">
                                    <p className="text-[10px] font-black text-slate-900 truncate">{file}</p>
                                    <p className="text-[8px] text-slate-400 font-bold">PDF Document • 1.2 MB</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-20">
                    <div className="w-24 h-24 bg-white rounded-[2rem] shadow-xl flex items-center justify-center mb-8 border border-slate-100">
                      <Mail className="w-10 h-10 text-slate-200" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 mb-2">Select a message to read</h3>
                    <p className="text-slate-400 font-medium max-w-xs">Choose a communication from the list on the left to view its full content and attachments.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeView === 'queue' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl overflow-hidden">
                <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">Current Working Queue</h3>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Global Pending Verification Monitoring</p>
                  </div>
                </div>
                <div className="p-8">
                  {/* Simplified Queue Table for Admin */}
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="text-slate-400 text-[10px] uppercase tracking-widest font-black border-b border-slate-100">
                        <th className="pb-4">Subject</th>
                        <th className="pb-4">Type</th>
                        <th className="pb-4">Entity</th>
                        <th className="pb-4">Submitter</th>
                        <th className="pb-4">Status</th>
                        <th className="pb-4">Running Time</th>
                        <th className="pb-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {JSON.parse(localStorage.getItem('wv_queue') || '[]').map((item: any) => {
                        const runningTime = getRunningTime(item.timestamp);
                        return (
                        <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-4">
                            <p className="font-black text-slate-900 text-sm">{item.applicant}</p>
                            <p className="text-[10px] font-mono text-slate-400">{item.id}</p>
                          </td>
                          <td className="py-4">
                            <span className="text-[10px] font-black text-teal-600 uppercase tracking-widest">{item.type}</span>
                          </td>
                          <td className="py-4">
                            <p className="text-xs font-bold text-slate-700">{item.company}</p>
                          </td>
                          <td className="py-4">
                            <p className="text-[10px] font-bold text-slate-500">{item.submitter || 'Unknown'}</p>
                          </td>
                          <td className="py-4">
                            <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest ${
                              item.status === 'VERIFIED' ? 'bg-emerald-100 text-emerald-700' :
                              item.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                              'bg-amber-100 text-amber-700'
                            }`}>
                              {item.status}
                            </span>
                          </td>
                          <td className="py-4">
                            <div className="flex items-center space-x-2">
                              {item.status === 'VERIFIED' ? (
                                <span className="text-xs font-bold text-slate-400">-</span>
                              ) : (
                                <>
                                  <Clock className={`w-3 h-3 ${runningTime.isAlert ? 'text-red-500' : 'text-slate-400'}`} />
                                  <span className={`text-xs font-bold ${runningTime.isAlert ? 'text-red-600' : 'text-slate-600'}`}>
                                    {runningTime.text}
                                  </span>
                                </>
                              )}
                            </div>
                          </td>
                          <td className="py-4 text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <button 
                                onClick={() => {
                                  setSelectedDetailsItem(item);
                                  setShowDetailsModal(true);
                                  logAction('View Verification Details', `Accessed full audit data for ${item.applicant} (${item.id})`, 'INFO');
                                }}
                                className="p-2 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-all"
                                title="View Full Details"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleProcessQueueItem(item)}
                                className={`p-2 rounded-lg transition-all ${item.status === 'VERIFIED' ? 'text-slate-300 cursor-not-allowed' : 'text-emerald-600 hover:bg-emerald-50'}`}
                                title="Process & Deduct Token"
                                disabled={item.status === 'VERIFIED'}
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => navigate(`/generate?edit=${item.id}`)}
                                className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all"
                                title="Edit/View Details"
                              >
                                <Settings className="w-4 h-4" />
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
            </div>
          )}
          {activeView === 'adminFunctions' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">System Administration Hub</h2>
                  <p className="text-slate-500 font-medium text-sm">Manage internal resources, audit logs, and token collection.</p>
                </div>
                <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
                  {[
                    { id: 'agents', label: 'Agents', icon: Users },
                    { id: 'prospects', label: 'Bulk Prospects', icon: TrendingUp },
                    { id: 'logs', label: 'System Logs', icon: Database },
                    { id: 'tokens', label: 'Token Ledger', icon: CheckCircle2 }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setAdminSubTab(tab.id as any)}
                      className={`flex items-center space-x-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${adminSubTab === tab.id ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      <tab.icon className={`w-3.5 h-3.5 ${adminSubTab === tab.id ? 'text-red-500' : ''}`} />
                      <span>{tab.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {adminSubTab === 'agents' && (
                <div className="space-y-8">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-black text-slate-900">Agent Directory</h3>
                    <button 
                      onClick={() => setShowCreateAgentModal(true)}
                      className="bg-slate-900 text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg flex items-center space-x-2"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>Add New Agent</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {agents.map((agent) => (
                      <div key={agent.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-6 opacity-5">
                          <Shield className="w-24 h-24" />
                        </div>
                        <div className="relative z-10">
                          <div className="flex items-center justify-between mb-6">
                            <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${agent.role === 'ADMIN' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                              {agent.role}
                            </div>
                            <div className={`w-2 h-2 rounded-full ${agent.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                          </div>
                          <h3 className="text-xl font-black text-slate-900 mb-1">{agent.name}</h3>
                          <p className="text-xs font-bold text-teal-600 mb-4">{agent.title}</p>
                          
                          <div className="space-y-2 mb-6">
                            <div className="flex items-center space-x-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                              <Database className="w-3 h-3" />
                              <span>ID: {agent.id}</span>
                            </div>
                            <div className="flex items-center space-x-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                              <Mail className="w-3 h-3" />
                              <span>{agent.email}</span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-6 border-t border-slate-100">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Joined {agent.joinedAt}</span>
                            <button 
                              onClick={() => toggleAgentStatus(agent.id)}
                              className={`text-[10px] font-black uppercase tracking-widest ${agent.status === 'ACTIVE' ? 'text-red-600 hover:text-red-700' : 'text-emerald-600 hover:text-emerald-700'}`}
                            >
                              {agent.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {adminSubTab === 'prospects' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="bg-white rounded-[3rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                    <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-purple-900 rounded-2xl flex items-center justify-center text-white">
                          <TrendingUp className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="text-xl font-black text-slate-900 tracking-tight">Bulk Prospect Upload</h3>
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Add institutional leads to the queue</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-8">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                        <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
                          <h4 className="text-sm font-black text-slate-900 mb-2 uppercase tracking-tight">Option 1: Manual Paste</h4>
                          <p className="text-xs text-slate-500 leading-relaxed mb-4">
                            Paste your list of prospects below. Format: <code className="bg-white px-1 py-0.5 rounded border border-slate-200 font-bold">Name, Phone, Location, Email</code>
                          </p>
                          <textarea 
                            id="bulk-prospect-input"
                            className="w-full h-48 p-4 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-slate-400"
                            placeholder='"Las Torres","(858) 413-9341","El Paso, TX",""&#10;"Parker House","(817) 873-6865","Fort Worth, TX",""'
                          />
                          <button 
                            onClick={() => {
                              const input = document.getElementById('bulk-prospect-input') as HTMLTextAreaElement;
                              if (input) {
                                handleBulkUploadProspects(input.value);
                                input.value = '';
                              }
                            }}
                            className="w-full mt-4 py-3 bg-purple-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-purple-700 transition-all shadow-lg shadow-purple-600/20 flex items-center justify-center space-x-2"
                          >
                            <Plus className="w-4 h-4" />
                            <span>Upload Manual List</span>
                          </button>
                        </div>
                        <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
                          <h4 className="text-sm font-black text-slate-900 mb-2 uppercase tracking-tight">Danger Zone</h4>
                          <p className="text-xs text-slate-500 leading-relaxed mb-4">
                            Reset the prospect queue. This will permanently delete all prospects in the queue.
                          </p>
                          <button 
                            onClick={() => {
                              if (confirm('Are you sure you want to delete all prospects in the queue? This action cannot be undone.')) {
                                setProspects([]);
                                localStorage.setItem('wv_prospects', JSON.stringify([]));
                                showNotification('Prospect queue has been reset.');
                              }
                            }}
                            className="w-full py-3 bg-red-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-red-700 transition-all shadow-lg shadow-red-600/20 flex items-center justify-center space-x-2"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>Reset/Delete Prospect Queue</span>
                          </button>
                        </div>
                        <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 flex flex-col">
                          <h4 className="text-sm font-black text-slate-900 mb-2 uppercase tracking-tight">Option 2: Excel Upload</h4>
                          <p className="text-xs text-slate-500 leading-relaxed mb-8">
                            Upload an Excel file (.xlsx or .xls). Columns should be: <strong>Name</strong>, <strong>Phone</strong>, and <strong>Location</strong>.
                          </p>
                          <div className="mt-auto">
                            <label className="w-full py-12 border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-purple-500 hover:bg-purple-50 transition-all group">
                              <Upload className="w-8 h-8 text-slate-400 group-hover:text-purple-500 mb-2" />
                              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest group-hover:text-purple-600">Click to upload Excel</span>
                              <input 
                                type="file" 
                                accept=".xlsx, .xls" 
                                className="hidden" 
                                onChange={handleExcelUpload}
                              />
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {adminSubTab === 'logs' && (
                <div className="bg-white rounded-[3rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                  <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center">
                        <Database className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-slate-900 tracking-tight">System Activity Logs</h3>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Audit Trail & Event Monitoring</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => {
                        setLogs([]);
                        localStorage.removeItem('wv_admin_logs');
                      }}
                      className="px-4 py-2 text-xs font-black text-red-600 hover:bg-red-50 rounded-xl transition-all uppercase tracking-widest"
                    >
                      Clear All Logs
                    </button>
                  </div>
                  <div className="p-8">
                    <div className="space-y-4">
                      {logs.length === 0 ? (
                        <div className="text-center py-20">
                          <Database className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                          <p className="text-slate-400 font-bold">No activity logs recorded yet.</p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="text-slate-400 text-[10px] uppercase tracking-widest font-black border-b border-slate-100">
                                <th className="pb-4">Timestamp</th>
                                <th className="pb-4">Agent ID</th>
                                <th className="pb-4">Agent Name</th>
                                <th className="pb-4">Action</th>
                                <th className="pb-4">Details</th>
                                <th className="pb-4">Type</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                              {logs.map((log) => (
                                <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                                  <td className="py-4 whitespace-nowrap">
                                    <p className="text-[10px] font-mono font-bold text-slate-500">{log.timestamp}</p>
                                  </td>
                                  <td className="py-4">
                                    <p className="text-[10px] font-mono font-bold text-teal-600">{log.userId || 'SYS-001'}</p>
                                  </td>
                                  <td className="py-4">
                                    <p className="text-xs font-bold text-slate-700">{log.user}</p>
                                  </td>
                                  <td className="py-4">
                                    <p className="text-xs font-black text-slate-900">{log.action}</p>
                                  </td>
                                  <td className="py-4">
                                    <p className="text-xs text-slate-500 max-w-md truncate" title={log.details}>{log.details}</p>
                                  </td>
                                  <td className="py-4">
                                    <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest ${
                                      log.type === 'SUCCESS' ? 'bg-emerald-100 text-emerald-700' :
                                      log.type === 'WARNING' ? 'bg-amber-100 text-amber-700' :
                                      log.type === 'ERROR' ? 'bg-red-100 text-red-700' :
                                      'bg-slate-100 text-slate-700'
                                    }`}>
                                      {log.type}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {adminSubTab === 'tokens' && (
                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-xl">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center border border-emerald-100">
                          <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                        </div>
                        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2 py-1 rounded-md">Verified</span>
                      </div>
                      <p className="text-3xl font-black text-slate-900 tracking-tight">{queue.filter((i: any) => i.status === 'VERIFIED').length}</p>
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Total Tokens Collected</p>
                    </div>
                    
                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-xl">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center border border-blue-100">
                          <Users className="w-6 h-6 text-blue-600" />
                        </div>
                      </div>
                      <p className="text-3xl font-black text-slate-900 tracking-tight">
                        {new Set(queue.filter((i: any) => i.status === 'VERIFIED').map((i: any) => i.submitter)).size}
                      </p>
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Active Submitting Clients</p>
                    </div>

                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-xl">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center border border-purple-100">
                          <TrendingUp className="w-6 h-6 text-purple-600" />
                        </div>
                      </div>
                      <p className="text-3xl font-black text-slate-900 tracking-tight">
                        {queue.filter((i: any) => i.status === 'VERIFIED').length > 0 ? '100%' : '0%'}
                      </p>
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Collection Efficiency</p>
                    </div>
                  </div>

                  <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl overflow-hidden">
                    <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                      <div>
                        <h3 className="text-xl font-black text-slate-900 tracking-tight">Token Collection Ledger</h3>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Historical Record of Finalized Verifications</p>
                      </div>
                    </div>
                    <div className="p-8">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="text-slate-400 text-[10px] uppercase tracking-widest font-black border-b border-slate-100">
                              <th className="pb-4">Completion Date</th>
                              <th className="pb-4">Subject</th>
                              <th className="pb-4">Client Account</th>
                              <th className="pb-4">Verification ID</th>
                              <th className="pb-4 text-right">Fee Collected</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {queue.filter((i: any) => i.status === 'VERIFIED').sort((a: any, b: any) => {
                              const dateA = a.completionDate ? new Date(a.completionDate).getTime() : 0;
                              const dateB = b.completionDate ? new Date(b.completionDate).getTime() : 0;
                              return dateB - dateA;
                            }).map((item: any) => (
                              <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="py-4 whitespace-nowrap">
                                  <p className="text-[10px] font-mono font-bold text-slate-500">{item.completionDate || 'N/A'}</p>
                                </td>
                                <td className="py-4">
                                  <p className="text-xs font-black text-slate-900">{item.applicant}</p>
                                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{item.type}</p>
                                </td>
                                <td className="py-4">
                                  <p className="text-xs font-bold text-slate-700">{item.submitter || 'System'}</p>
                                </td>
                                <td className="py-4">
                                  <p className="text-[10px] font-mono text-slate-400">{item.id}</p>
                                </td>
                                <td className="py-4 text-right">
                                  <span className="text-xs font-black text-emerald-600">1 Token</span>
                                </td>
                              </tr>
                            ))}
                            {queue.filter((i: any) => i.status === 'VERIFIED').length === 0 && (
                              <tr>
                                <td colSpan={5} className="py-12 text-center">
                                  <p className="text-slate-400 font-medium italic">No tokens collected yet. Finalize verifications to see them here.</p>
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Create Agent Modal */}
      {showCreateAgentModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowCreateAgentModal(false)} />
          <div className="relative bg-white w-full max-w-xl rounded-[3rem] shadow-2xl p-12 animate-in zoom-in-95 duration-300">
            <button 
              onClick={() => setShowCreateAgentModal(false)}
              className="absolute top-8 right-8 p-2 text-slate-400 hover:text-slate-900 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="mb-10">
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 border border-blue-100">
                <UserPlus className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">Provision New Agent</h2>
              <p className="text-slate-500 font-medium">Create a new administrative account with system-wide access.</p>
            </div>

            <form onSubmit={handleCreateAgent} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">Full Name</label>
                  <input 
                    required
                    type="text" 
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                    placeholder="Jane Smith"
                    value={newAgentData.name}
                    onChange={(e) => setNewAgentData({...newAgentData, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">System Username</label>
                  <input 
                    required
                    type="text" 
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                    placeholder="jsmith_admin"
                    value={newAgentData.username}
                    onChange={(e) => setNewAgentData({...newAgentData, username: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">Email Address</label>
                  <input 
                    required
                    type="email" 
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                    placeholder="jane@weverify.works"
                    value={newAgentData.email}
                    onChange={(e) => setNewAgentData({...newAgentData, email: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">Professional Title</label>
                  <input 
                    required
                    type="text" 
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                    placeholder="Senior Verification Agent"
                    value={newAgentData.title}
                    onChange={(e) => setNewAgentData({...newAgentData, title: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">Access Level</label>
                  <select 
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all appearance-none"
                    value={newAgentData.role}
                    onChange={(e) => setNewAgentData({...newAgentData, role: e.target.value as 'ADMIN' | 'AGENT'})}
                  >
                    <option value="AGENT">Standard Agent</option>
                    <option value="ADMIN">System Administrator</option>
                  </select>
                </div>
              </div>

              <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100">
                <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2">Access Permissions</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center space-x-2 text-xs font-bold text-slate-600">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    <span>Working Tasks</span>
                  </div>
                  <div className="flex items-center space-x-2 text-xs font-bold text-slate-600">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    <span>Secure Email</span>
                  </div>
                  <div className="flex items-center space-x-2 text-xs font-bold text-slate-600">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    <span>Prospects</span>
                  </div>
                  <div className="flex items-center space-x-2 text-xs font-bold text-slate-600">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    <span>Invoicing</span>
                  </div>
                </div>
              </div>

              <button 
                type="submit"
                className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-lg hover:bg-slate-800 transition-all shadow-xl flex items-center justify-center space-x-2"
              >
                <span>Provision Account</span>
                <Shield className="w-5 h-5 text-teal-400" />
              </button>
            </form>
          </div>
        </div>
      )}
      {selectedProspect && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setSelectedProspect(null)} />
          <div className="relative bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl p-12 animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setSelectedProspect(null)}
              className="absolute top-8 right-8 p-2 text-slate-400 hover:text-slate-900 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            
            <div className="mb-8">
              <div className="flex items-center space-x-4 mb-2">
                <div className="w-12 h-12 bg-teal-100 rounded-2xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-teal-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900">Prospect Details</h2>
                  <p className="text-slate-700 font-bold text-lg mb-1">{selectedProspect.name || selectedProspect.company || 'Unknown Prospect'}</p>
                  <p className="text-slate-500 font-medium flex items-center space-x-2">
                    <Mail className="w-4 h-4" />
                    <span>{selectedProspect.email}</span>
                    {selectedProspect.contactPhone && (
                      <>
                        <span className="text-slate-300">|</span>
                        <Phone className="w-4 h-4" />
                        <span>{selectedProspect.contactPhone}</span>
                      </>
                    )}
                    {selectedProspect.contactPhone2 && (
                      <>
                        <span className="text-slate-300">|</span>
                        <Phone className="w-4 h-4" />
                        <span>{selectedProspect.contactPhone2}</span>
                      </>
                    )}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Update Status</h3>
                <div className="flex flex-wrap gap-3">
                  {['Contacted', 'Follow Up', 'Closed/Not Interested', 'Extend Free Trial (Open Account)'].map(status => (
                    <button
                      key={status}
                      onClick={() => {
                        const updated = prospects.map(p => {
                          if (p.id === selectedProspect.id) {
                            const newLog = {
                              timestamp: new Date().toLocaleString(),
                              action: 'Status Changed',
                              details: `Status changed from ${p.status} to ${status}`
                            };
                            return { ...p, status, logs: [newLog, ...(p.logs || [])] };
                          }
                          return p;
                        });
                        setProspects(updated);
                        localStorage.setItem('wv_prospects', JSON.stringify(updated));
                        setSelectedProspect(updated.find(p => p.id === selectedProspect.id) || null);
                        
                        // If "Extend Free Trial (Open Account)", create an account
                        if (status === 'Extend Free Trial (Open Account)') {
                          const users = JSON.parse(localStorage.getItem('wv_users') || '[]');
                          if (!users.find((u: any) => u.email === selectedProspect.email)) {
                            const newAccount = {
                              email: selectedProspect.email,
                              orgName: selectedProspect.company || 'New Client',
                              plan: 'TRIAL',
                              tokens: 1,
                              joinedAt: new Date().toISOString(),
                              status: 'ACTIVE',
                              password: 'changeme123',
                              accountNumber: `WV-${Math.floor(100000 + Math.random() * 900000)}`,
                              contactPhone: selectedProspect.contactPhone || ''
                            };
                            localStorage.setItem('wv_users', JSON.stringify([...users, newAccount]));
                            showNotification(`Account created for ${selectedProspect.email} with 1 free token.`);
                          }
                        }
                      }}
                      className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                        selectedProspect.status === status 
                          ? 'bg-slate-900 text-white' 
                          : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Contact Details</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Contact Name</label>
                    <input 
                      type="text" 
                      value={editProspectName}
                      onChange={(e) => setEditProspectName(e.target.value)}
                      className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                      placeholder="Enter contact name"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                    <div className="flex items-center space-x-2">
                      <div className="relative flex-1">
                        <input 
                          type="email" 
                          value={editProspectEmail}
                          onChange={(e) => setEditProspectEmail(e.target.value)}
                          className={`w-full px-4 py-2 bg-white border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 ${!editProspectEmail ? 'border-red-300' : 'border-slate-200'}`}
                          placeholder="Enter email address"
                        />
                        {!editProspectEmail && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center text-red-500" title="Missing Email: Contact and update email address">
                            <AlertCircle className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                      {editProspectEmail && editProspectEmail.includes('@') && (
                        <button 
                          onClick={() => handleSendProspectMarketingEmail(selectedProspect)}
                          disabled={isSendingProspectMarketing}
                          className="px-4 py-2 bg-teal-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-teal-700 transition-all flex items-center space-x-2 disabled:opacity-50"
                          title="Send Marketing Outreach Email"
                        >
                          {isSendingProspectMarketing ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Send className="w-3 h-3" />
                          )}
                          <span>Send Marketing</span>
                        </button>
                      )}
                    </div>
                    {!editProspectEmail && (
                      <p className="text-[10px] font-bold text-red-500 mt-1 flex items-center">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Missing Email: Contact and update email address
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
                    <input 
                      type="text" 
                      value={editProspectPhone}
                      onChange={(e) => setEditProspectPhone(e.target.value)}
                      className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                      placeholder="Enter primary phone number"
                    />
                  </div>
                  {(editProspectPhone || editProspectPhone2 || selectedProspect.contactPhone2) && (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Additional Phone Number</label>
                      <input 
                        type="text" 
                        value={editProspectPhone2}
                        onChange={(e) => setEditProspectPhone2(e.target.value)}
                        className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                        placeholder="Enter additional phone number"
                      />
                    </div>
                  )}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Office Address</label>
                    <textarea 
                      value={editProspectAddress}
                      onChange={(e) => setEditProspectAddress(e.target.value)}
                      className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 min-h-[60px]"
                      placeholder="Enter office address"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-xs font-bold text-slate-700">Details / Notes</label>
                      <button 
                        disabled={isSearching}
                        onClick={async () => {
                          setIsSearching(true);
                          const result = await searchContactInfo(editProspectName || editProspectEmail, editProspectEmail, selectedProspect.company);
                          if (result.name) setEditProspectName(result.name);
                          
                          if (result.phone) {
                            const cleanNew = result.phone.replace(/\D/g, '');
                            const cleanPrimary = (editProspectPhone || '').replace(/\D/g, '');
                            const cleanSecondary = (editProspectPhone2 || '').replace(/\D/g, '');

                            if (cleanNew !== cleanPrimary && cleanNew !== cleanSecondary) {
                              if (!editProspectPhone) {
                                setEditProspectPhone(result.phone);
                              } else if (!editProspectPhone2) {
                                setEditProspectPhone2(result.phone);
                              } else {
                                // If both are full and different, append to secondary
                                setEditProspectPhone2(prev => prev ? `${prev}, ${result.phone}` : result.phone);
                              }
                            }
                          }
                          
                          if (result.address) setEditProspectAddress(result.address);
                          if (result.email) setEditProspectEmail(result.email);
                          setEditProspectDetails(result.notes);
                          setIsSearching(false);
                        }}
                        className="text-[10px] font-black uppercase tracking-widest text-teal-600 hover:text-teal-700 transition-colors flex items-center space-x-1 disabled:opacity-50"
                      >
                        {isSearching ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                        <span>Generate Details</span>
                      </button>
                    </div>
                    <textarea 
                      value={editProspectDetails}
                      onChange={(e) => setEditProspectDetails(e.target.value)}
                      className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 min-h-[100px]"
                      placeholder="Enter details pertaining to the specified situation..."
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <input 
                      type="checkbox" 
                      id="prospectConfirmed"
                      checked={editProspectConfirmed}
                      onChange={(e) => setEditProspectConfirmed(e.target.checked)}
                      className="w-4 h-4 text-teal-600 border-slate-300 rounded focus:ring-teal-500"
                    />
                    <label htmlFor="prospectConfirmed" className="text-xs font-bold text-slate-700">
                      *(Confirmed) Contact details pertaining to the scope are accurate and appropriately apply to situation
                    </label>
                  </div>

                  <div className="flex flex-col space-y-3">
                    <div className="flex space-x-3">
                      <button
                        onClick={() => {
                          if (!editProspectConfirmed) {
                            showNotification("Please confirm the contact details are accurate by checking the box.", "ERROR");
                            return;
                          }
                          const updated = prospects.map(p => {
                            if (p.id === selectedProspect.id) {
                              const newLog = {
                                timestamp: new Date().toLocaleString(),
                                action: 'Details Updated',
                                details: `Contact details and notes updated.`
                              };
                              return { 
                                ...p, 
                                name: editProspectName,
                                email: editProspectEmail,
                                contactPhone: editProspectPhone,
                                contactPhone2: editProspectPhone2,
                                address: editProspectAddress,
                                details: editProspectDetails,
                                isConfirmed: editProspectConfirmed,
                                status: p.status === 'New' ? 'Contacted' : p.status,
                                logs: [newLog, ...(p.logs || [])] 
                              };
                            }
                            return p;
                          });
                          setProspects(updated);
                          localStorage.setItem('wv_prospects', JSON.stringify(updated));
                          setSelectedProspect(updated.find(p => p.id === selectedProspect.id) || null);
                          showNotification("Contact details saved successfully.");
                        }}
                        className="flex-grow py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/20"
                      >
                        Save Details
                      </button>
                      <button
                        onClick={handleSaveAndNext}
                        className="flex-grow py-3 bg-teal-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-teal-700 transition-colors shadow-lg shadow-teal-600/20 flex items-center justify-center space-x-2"
                      >
                        <span>Save & View Next</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                      {editProspectPhone && (
                        <a 
                          href={`tel:${editProspectPhone}`}
                          className="px-4 py-3 bg-blue-600 text-white rounded-xl flex items-center justify-center hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20"
                          title="Dial via System / Google Voice"
                        >
                          <Phone className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </div>
                  
                  <div className="pt-2 border-t border-slate-100">
                    <button 
                      onClick={() => window.open('https://voice.google.com/', '_blank')}
                      className="w-full py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-teal-600 transition-colors flex items-center justify-center space-x-2"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Open Google Voice Dialer</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Activity Log</h3>
                <div className="space-y-4 max-h-64 overflow-y-auto pr-2">
                  {selectedProspect.logs?.map((log, i) => (
                    <div key={i} className="flex space-x-4">
                      <div className="w-2 h-2 mt-1.5 rounded-full bg-teal-400 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-slate-900">{log.action}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{log.details}</p>
                        <p className="text-[10px] text-slate-400 mt-1">{log.timestamp}</p>
                      </div>
                    </div>
                  ))}
                  {(!selectedProspect.logs || selectedProspect.logs.length === 0) && (
                    <p className="text-sm text-slate-500 italic">No activity logged.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {showLeadSources && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowLeadSources(false)} />
          <div className="relative bg-white w-full max-w-6xl rounded-[3rem] shadow-2xl p-12 animate-in zoom-in-95 duration-300 max-h-[90vh] flex flex-col">
            <button 
              onClick={() => setShowLeadSources(false)}
              className="absolute top-8 right-8 p-2 text-slate-400 hover:text-slate-900 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            
            <div className="mb-8 flex justify-between items-center">
              <div className="flex items-center space-x-4 mb-2">
                <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center">
                  <Database className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900">Lead Sources</h2>
                  <p className="text-slate-500 font-medium">Detailed prospect data view</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <select
                  value={leadSourceMonthFilter}
                  onChange={(e) => setLeadSourceMonthFilter(e.target.value)}
                  className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Months</option>
                  {Array.from(new Set(prospects.map(p => {
                    const date = new Date(p.createdAt || new Date());
                    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                  }))).sort().reverse().map((month: any) => {
                    const [year, m] = month.split('-');
                    const date = new Date(parseInt(year), parseInt(m) - 1);
                    return (
                      <option key={month} value={month}>
                        {date.toLocaleString('default', { month: 'long', year: 'numeric' })}
                      </option>
                    );
                  })}
                </select>
                <button
                  onClick={() => {
                    if (window.confirm('Are you sure you want to archive data older than 3 months?')) {
                      const threeMonthsAgo = new Date();
                      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
                      const updatedProspects = prospects.filter(p => new Date(p.createdAt) >= threeMonthsAgo);
                      setProspects(updatedProspects);
                      localStorage.setItem('wv_prospects', JSON.stringify(updatedProspects));
                      logAction('Archive Lead Sources', 'Archived lead sources older than 3 months', 'INFO');
                    }
                  }}
                  className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-colors flex items-center space-x-2"
                >
                  <Archive className="w-3 h-3" />
                  <span>Archive Old</span>
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto bg-slate-50 rounded-2xl border border-slate-200">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-200 text-slate-700 font-bold border-b border-slate-300">
                    <th className="px-2 py-1 border-r border-slate-300 whitespace-nowrap">ID</th>
                    <th className="px-2 py-1 border-r border-slate-300 whitespace-nowrap">Email</th>
                    <th className="px-2 py-1 border-r border-slate-300 whitespace-nowrap">Company</th>
                    <th className="px-2 py-1 border-r border-slate-300 whitespace-nowrap">Status</th>
                    <th className="px-2 py-1 border-r border-slate-300 whitespace-nowrap">Value</th>
                    <th className="px-2 py-1 border-r border-slate-300 whitespace-nowrap">Last Contact</th>
                    <th className="px-2 py-1 border-r border-slate-300 whitespace-nowrap">Agent ID</th>
                    <th className="px-2 py-1 whitespace-nowrap">Created At</th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {prospects
                    .filter(p => !['New', 'Qualified', 'Negotiating'].includes(p.status))
                    .filter(p => {
                      if (leadSourceMonthFilter === 'all') return true;
                      const date = new Date(p.createdAt);
                      const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                      return monthStr === leadSourceMonthFilter;
                    })
                    .map((prospect, i) => (
                    <tr key={prospect.id} className={`${i % 2 === 0 ? 'bg-white' : 'bg-slate-50'} hover:bg-blue-50 border-b border-slate-200`}>
                      <td className="px-2 py-1 border-r border-slate-200 font-mono text-slate-500 whitespace-nowrap">{prospect.id}</td>
                      <td className="px-2 py-1 border-r border-slate-200 font-medium text-slate-900 whitespace-nowrap">{prospect.email}</td>
                      <td className="px-2 py-1 border-r border-slate-200 text-slate-700 whitespace-nowrap">{prospect.company || '-'}</td>
                      <td className="px-2 py-1 border-r border-slate-200 text-slate-700 whitespace-nowrap">{prospect.status}</td>
                      <td className="px-2 py-1 border-r border-slate-200 text-slate-700 whitespace-nowrap">{prospect.value ? `$${prospect.value.toLocaleString()}` : '-'}</td>
                      <td className="px-2 py-1 border-r border-slate-200 text-slate-700 whitespace-nowrap">{prospect.lastContact || '-'}</td>
                      <td className="px-2 py-1 border-r border-slate-200 font-mono text-slate-500 whitespace-nowrap">{prospect.agentId || '-'}</td>
                      <td className="px-2 py-1 text-slate-700 whitespace-nowrap">{prospect.createdAt ? new Date(prospect.createdAt).toLocaleDateString() : '-'}</td>
                    </tr>
                  ))}
                  {prospects.filter(p => !['New', 'Qualified', 'Negotiating'].includes(p.status)).length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-2 py-1 text-center text-slate-500 italic">No lead sources available.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowCreateModal(false)} />
          <div className="relative bg-white w-full max-w-xl rounded-[3rem] shadow-2xl p-12 animate-in zoom-in-95 duration-300">
            <button 
              onClick={() => setShowCreateModal(false)}
              className="absolute top-8 right-8 p-2 text-slate-400 hover:text-slate-900 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="mb-10">
              <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-6 border border-red-100">
                <UserPlus className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">Create Organization Account</h2>
              <p className="text-slate-500 font-medium">Provision a new verified entity on the WeVerify network.</p>
            </div>

            <form onSubmit={handleCreateClient} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">Organization Name</label>
                  <input 
                    required
                    type="text" 
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-900 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all"
                    placeholder="Global Finance Ltd"
                    value={newClient.orgName}
                    onChange={(e) => setNewClient({...newClient, orgName: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">Contact Email</label>
                  <input 
                    required
                    type="email" 
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-900 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all"
                    placeholder="admin@globalfinance.com"
                    value={newClient.email}
                    onChange={(e) => setNewClient({...newClient, email: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">Service Plan</label>
                  <select 
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-900 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all appearance-none"
                    value={newClient.plan}
                    onChange={(e) => {
                      const plan = e.target.value;
                      setNewClient({
                        ...newClient, 
                        plan, 
                        initialTokens: plan === 'TRIAL' ? 1 : newClient.initialTokens
                      });
                    }}
                  >
                    <option value="TRIAL">Free Trial (1 Token)</option>
                    <option value="Professional">Professional</option>
                    <option value="Enterprise">Enterprise</option>
                    <option value="Infrastructure">Infrastructure</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">Initial Token Grant</label>
                  <input 
                    required
                    type="number" 
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-900 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all"
                    value={newClient.initialTokens}
                    onChange={(e) => setNewClient({...newClient, initialTokens: parseInt(e.target.value)})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">Contact Phone</label>
                <input 
                  required
                  type="tel" 
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-900 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all"
                  placeholder="+1 (555) 000-0000"
                  value={newClient.contactPhone}
                  onChange={(e) => setNewClient({...newClient, contactPhone: e.target.value})}
                />
              </div>

              <button 
                type="submit"
                className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-lg hover:bg-slate-800 transition-all shadow-xl flex items-center justify-center space-x-2 mt-4"
              >
                <span>Create account</span>
                <ChevronRight className="w-5 h-5 text-red-400" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Client Modal */}
      {showEditClientModal && editClientData && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowEditClientModal(false)} />
          <div className="relative bg-white w-full max-w-xl rounded-[3rem] shadow-2xl p-12 animate-in zoom-in-95 duration-300">
            <button 
              onClick={() => setShowEditClientModal(false)}
              className="absolute top-8 right-8 p-2 text-slate-400 hover:text-slate-900 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="mb-10">
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 border border-blue-100">
                <Settings className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">Edit Organization Account</h2>
              <p className="text-slate-500 font-medium">Update organization details and node configuration.</p>
            </div>

            <form onSubmit={confirmEditClient} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">Organization Name</label>
                  <input 
                    required
                    type="text" 
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                    value={editClientData.orgName}
                    onChange={(e) => setEditClientData({...editClientData, orgName: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">Contact Email</label>
                  <input 
                    required
                    disabled
                    type="email" 
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-400 cursor-not-allowed"
                    value={editClientData.email}
                  />
                  <p className="text-[10px] text-slate-400 mt-1 ml-2 font-bold uppercase tracking-widest">Email cannot be changed</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">Service Plan</label>
                  <select 
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all appearance-none"
                    value={editClientData.plan}
                    onChange={(e) => setEditClientData({...editClientData, plan: e.target.value})}
                  >
                    <option value="TRIAL">Free Trial</option>
                    <option value="Professional">Professional</option>
                    <option value="Enterprise">Enterprise</option>
                    <option value="Infrastructure">Infrastructure</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">Account Status</label>
                  <select 
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all appearance-none"
                    value={editClientData.status}
                    onChange={(e) => setEditClientData({...editClientData, status: e.target.value as 'ACTIVE' | 'INACTIVE'})}
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">Contact Phone</label>
                <input 
                  required
                  type="tel" 
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  placeholder="+1 (555) 000-0000"
                  value={editClientData.contactPhone || ''}
                  onChange={(e) => setEditClientData({...editClientData, contactPhone: e.target.value})}
                />
              </div>

              <button 
                type="submit"
                className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-lg hover:bg-slate-800 transition-all shadow-xl flex items-center justify-center space-x-2 mt-4"
              >
                <CheckCircle2 className="w-5 h-5 text-blue-400" />
                <span>Save Changes</span>
              </button>
            </form>
          </div>
        </div>
      )}
      {/* Compose Email Modal */}
      {showComposeModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowComposeModal(false)} />
          <div className="relative bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl p-12 animate-in zoom-in-95 duration-300">
            <button 
              onClick={() => setShowComposeModal(false)}
              className="absolute top-8 right-8 p-2 text-slate-400 hover:text-slate-900 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="mb-10 flex items-start justify-between">
              <div>
                <div className="w-16 h-16 bg-teal-50 rounded-2xl flex items-center justify-center mb-6 border border-teal-100">
                  <Send className="w-8 h-8 text-teal-600" />
                </div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">Compose Message</h2>
                <p className="text-slate-500 font-medium">Send a secure communication via the WeVerify network.</p>
              </div>
              <div className="text-right bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Sending As</p>
                <p className="font-black text-slate-900 text-sm">{localStorage.getItem('wv_admin_name') || 'Admin User'}</p>
                <p className="text-[10px] font-bold text-teal-600">{localStorage.getItem('wv_admin_title') || 'Client Support Representative'}</p>
              </div>
            </div>

            <form onSubmit={handleSendEmail} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-1">
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">Recipient</label>
                  <input 
                    required
                    type="email" 
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-900 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all"
                    placeholder="To: client@example.com"
                    value={composeData.to}
                    onChange={(e) => setComposeData({...composeData, to: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">CC</label>
                  <input 
                    type="text" 
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-900 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all"
                    placeholder="CC: (optional)"
                    value={composeData.cc}
                    onChange={(e) => setComposeData({...composeData, cc: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">BCC</label>
                  <input 
                    type="text" 
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-900 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all"
                    placeholder="BCC: (optional)"
                    value={composeData.bcc}
                    onChange={(e) => setComposeData({...composeData, bcc: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">Subject</label>
                <input 
                  required
                  type="text" 
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-900 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all"
                  placeholder="Verification Request Update"
                  value={composeData.subject}
                  onChange={(e) => setComposeData({...composeData, subject: e.target.value})}
                />
              </div>

              <div>
                <div className="flex justify-between items-end mb-2 ml-2">
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">Message Body</label>
                  <span className="text-[10px] font-bold text-slate-400 italic">Signature will be appended automatically</span>
                </div>
                <textarea 
                  required
                  rows={6}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-900 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all resize-none"
                  placeholder="Type your message here..."
                  value={composeData.body}
                  onChange={(e) => setComposeData({...composeData, body: e.target.value})}
                />
              </div>

              <div className="flex items-center justify-between pt-4">
                <div className="flex items-center space-x-2">
                  <button type="button" className="p-3 hover:bg-slate-100 rounded-xl text-slate-400 transition-all">
                    <Paperclip className="w-5 h-5" />
                  </button>
                  <button type="button" className="p-3 hover:bg-slate-100 rounded-xl text-slate-400 transition-all">
                    <Star className="w-5 h-5" />
                  </button>
                </div>
                
                <button 
                  type="submit"
                  disabled={isSendingEmail}
                  className="px-10 py-5 bg-slate-900 text-white rounded-2xl font-black text-lg hover:bg-slate-800 transition-all shadow-xl flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  {isSendingEmail ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Dispatching...</span>
                    </>
                  ) : (
                    <>
                      <span>Send Message</span>
                      <Send className="w-5 h-5 text-teal-400" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {showProcessModal && selectedQueueItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowProcessModal(false)} />
          <div className="relative bg-white w-full max-w-xl rounded-[3rem] shadow-2xl p-12 animate-in zoom-in-95 duration-300">
            <button 
              onClick={() => setShowProcessModal(false)}
              className="absolute top-8 right-8 p-2 text-slate-400 hover:text-slate-900 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="mb-10">
              <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mb-6 border border-emerald-100">
                <Zap className="w-8 h-8 text-emerald-600" />
              </div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">Finalize Verification</h2>
              <p className="text-slate-500 font-medium">Process this audit and deduct a token from the linked account.</p>
            </div>

            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 mb-8">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Subject</p>
                  <p className="font-black text-slate-900">{selectedQueueItem.applicant}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Audit ID</p>
                  <p className="font-mono text-xs font-bold text-slate-600">{selectedQueueItem.id}</p>
                </div>
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Entity</p>
                <p className="font-bold text-slate-700">{selectedQueueItem.company}</p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">Link to Account (Deduct Token)</label>
                <select 
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all appearance-none"
                  value={processingAccount}
                  onChange={(e) => setProcessingAccount(e.target.value)}
                >
                  <option value="">Select an account...</option>
                  {users.map((u, index) => (
                    <option key={`${u.email}-${index}`} value={u.email}>{u.orgName} ({u.email}) - {u.tokens} tokens</option>
                  ))}
                </select>
              </div>

              <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                <p className="text-xs text-amber-700 font-medium leading-relaxed">
                  Finalizing this verification will mark it as <strong>VERIFIED</strong> in the registry and deduct <strong>1 token</strong> from the selected account. This action cannot be undone.
                </p>
              </div>

              <button 
                onClick={confirmProcessVerification}
                disabled={!processingAccount}
                className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-lg hover:bg-slate-800 transition-all shadow-xl flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>Finalize & Deduct Token</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Invoice Modal */}
      {showCreateInvoiceModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowCreateInvoiceModal(false)} />
          <div className="relative bg-white w-full max-w-xl rounded-[3rem] shadow-2xl p-12 animate-in zoom-in-95 duration-300">
            <button 
              onClick={() => setShowCreateInvoiceModal(false)}
              className="absolute top-8 right-8 p-2 text-slate-400 hover:text-slate-900 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="mb-10">
              <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mb-6 border border-emerald-100">
                <DollarSign className="w-8 h-8 text-emerald-600" />
              </div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">Create Client Invoice</h2>
              <p className="text-slate-500 font-medium">Generate a new invoice for a client.</p>
            </div>

            <form onSubmit={handleManualInvoiceCreate} className="space-y-6">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">Select Client</label>
                <select 
                  required
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all appearance-none"
                  value={newInvoiceData.clientEmail}
                  onChange={(e) => setNewInvoiceData({...newInvoiceData, clientEmail: e.target.value})}
                >
                  <option value="">Select a client...</option>
                  {users.map((u, index) => (
                    <option key={`${u.email}-${index}`} value={u.email}>{u.orgName} ({u.email})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">Billing Plan</label>
                <select 
                  required
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all appearance-none"
                  value={newInvoiceData.plan}
                  onChange={(e) => setNewInvoiceData({...newInvoiceData, plan: e.target.value})}
                >
                  {Object.entries(INVOICE_PLANS).map(([key, plan]) => (
                    <option key={key} value={key}>{plan.label}</option>
                  ))}
                </select>
              </div>

              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Amount Due</span>
                  <span className="text-xl font-black text-slate-900">
                    ${INVOICE_PLANS[newInvoiceData.plan as keyof typeof INVOICE_PLANS].amount.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Tokens</span>
                  <span className="text-sm font-bold text-emerald-600">
                    +{INVOICE_PLANS[newInvoiceData.plan as keyof typeof INVOICE_PLANS].tokens} Tokens
                  </span>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-200">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Terms</p>
                  <p className="text-xs font-bold text-slate-900">Due upon Receipt</p>
                </div>
              </div>

              <button 
                type="submit"
                className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-lg hover:bg-slate-800 transition-all shadow-xl flex items-center justify-center space-x-2 mt-4"
              >
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>Generate Invoice</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Invoice Management Modal */}
      {showInvoiceModal && selectedInvoice && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowInvoiceModal(false)} />
          <div className="relative bg-white w-full max-w-xl rounded-[3rem] shadow-2xl p-12 animate-in zoom-in-95 duration-300">
            <button 
              onClick={() => setShowInvoiceModal(false)}
              className="absolute top-8 right-8 p-2 text-slate-400 hover:text-slate-900 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="mb-10">
              <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mb-6 border border-emerald-100">
                <FileText className="w-8 h-8 text-emerald-600" />
              </div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">Manage Invoice</h2>
              <p className="text-slate-500 font-medium">Review, modify, or dispatch invoice {selectedInvoice.id}.</p>
            </div>

            <form onSubmit={handleUpdateInvoice} className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Client Name</label>
                  <input 
                    type="text" 
                    value={invoiceEditData.clientName} 
                    onChange={(e) => setInvoiceEditData({ ...invoiceEditData, clientName: e.target.value })}
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-900 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Client Email</label>
                  <input 
                    type="email" 
                    value={invoiceEditData.clientEmail} 
                    onChange={(e) => setInvoiceEditData({ ...invoiceEditData, clientEmail: e.target.value })}
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-900 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Amount ($)</label>
                  <input 
                    type="number" 
                    value={invoiceEditData.amount} 
                    onChange={(e) => setInvoiceEditData({ ...invoiceEditData, amount: parseFloat(e.target.value) })}
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-900 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Tokens</label>
                  <input 
                    type="number" 
                    value={invoiceEditData.tokens} 
                    onChange={(e) => setInvoiceEditData({ ...invoiceEditData, tokens: parseInt(e.target.value) })}
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-900 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Status</label>
                <select 
                  value={invoiceEditData.status} 
                  onChange={(e) => setInvoiceEditData({ ...invoiceEditData, status: e.target.value as any })}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-900 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all appearance-none"
                >
                  <option value="Pending">Pending</option>
                  <option value="Paid">Paid</option>
                  <option value="Overdue">Overdue</option>
                </select>
              </div>

              <div className="flex flex-col space-y-3 pt-4">
                <div className="flex space-x-3">
                  <button 
                    type="submit"
                    className="flex-grow py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all"
                  >
                    Save Changes
                  </button>
                  <button 
                    type="button"
                    onClick={() => handleSendInvoice(selectedInvoice)}
                    className="px-6 py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-700 transition-all flex items-center justify-center"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
                <button 
                  type="button"
                  onClick={() => handleDeleteInvoice(selectedInvoice.id)}
                  className="w-full py-4 border-2 border-red-100 text-red-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-50 transition-all flex items-center justify-center space-x-2"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Invoice</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Verification Details Modal */}
      {showDetailsModal && selectedDetailsItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowDetailsModal(false)} />
          <div className="relative bg-white w-full max-w-4xl max-h-[90vh] rounded-[3rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 bg-slate-900 text-white flex justify-between items-center shrink-0">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-red-600 rounded-2xl flex items-center justify-center shadow-lg shadow-red-600/20">
                  <Eye className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-black tracking-tight">{selectedDetailsItem.applicant}</h2>
                  <p className="text-xs font-black text-red-400 uppercase tracking-widest">{selectedDetailsItem.id} • {selectedDetailsItem.type}</p>
                </div>
              </div>
              <button 
                onClick={() => setShowDetailsModal(false)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-grow overflow-y-auto p-10 bg-slate-50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-8">
                  <div>
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">Core Information</h3>
                    <div className="bg-white p-6 rounded-3xl border border-slate-200 space-y-4 shadow-sm">
                      <div className="flex justify-between">
                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Submitter</span>
                        <span className="text-xs font-bold text-slate-900">{selectedDetailsItem.submitter}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Entity</span>
                        <span className="text-xs font-bold text-slate-900">{selectedDetailsItem.company}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Status</span>
                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest ${
                          selectedDetailsItem.status === 'VERIFIED' ? 'bg-emerald-100 text-emerald-700' :
                          selectedDetailsItem.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>
                          {selectedDetailsItem.status}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Timestamp</span>
                        <span className="text-xs font-bold text-slate-900">{selectedDetailsItem.timestamp}</span>
                      </div>
                    </div>
                  </div>

                  {selectedDetailsItem.fullData && (
                    <div>
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">Verification Data</h3>
                      <div className="bg-white p-6 rounded-3xl border border-slate-200 space-y-4 shadow-sm">
                        {Object.entries(selectedDetailsItem.fullData).map(([key, value]: [string, any]) => {
                          if (key === 'generatedHtml' || key === 'documentHtml') return null;
                          return (
                            <div key={key} className="flex flex-col">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                              <span className="text-xs font-bold text-slate-900 break-words">{typeof value === 'object' ? JSON.stringify(value) : String(value)}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div>
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">Contact Details</h3>
                    <div className="bg-white p-6 rounded-3xl border border-slate-200 space-y-4 shadow-sm">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Contact Name</label>
                        <input 
                          type="text" 
                          value={editVerificationName}
                          onChange={(e) => setEditVerificationName(e.target.value)}
                          className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                          placeholder="Enter contact name"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                        <div className="relative">
                          <input 
                            type="email" 
                            value={editVerificationEmail}
                            onChange={(e) => setEditVerificationEmail(e.target.value)}
                            className={`w-full px-4 py-2 bg-slate-50 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 ${!editVerificationEmail ? 'border-red-300' : 'border-slate-200'}`}
                            placeholder="Enter email address"
                          />
                          {!editVerificationEmail && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center text-red-500" title="Missing Email: Contact and update email address">
                              <AlertCircle className="w-4 h-4" />
                            </div>
                          )}
                        </div>
                        {!editVerificationEmail && (
                          <p className="text-[10px] font-bold text-red-500 mt-1 flex items-center">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Missing Email: Contact and update email address
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
                        <input 
                          type="text" 
                          value={editVerificationPhone}
                          onChange={(e) => setEditVerificationPhone(e.target.value)}
                          className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                          placeholder="Enter phone number"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Office Address</label>
                        <textarea 
                          value={editVerificationAddress}
                          onChange={(e) => setEditVerificationAddress(e.target.value)}
                          className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 min-h-[60px]"
                          placeholder="Enter office address"
                        />
                      </div>
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="block text-xs font-bold text-slate-700">Details / Notes</label>
                          <button 
                            disabled={isSearchingVerification}
                            onClick={async () => {
                              setIsSearchingVerification(true);
                              const result = await searchContactInfo(editVerificationName || editVerificationEmail, editVerificationEmail, selectedDetailsItem.company);
                              if (result.name) setEditVerificationName(result.name);
                              if (result.phone) setEditVerificationPhone(result.phone);
                              if (result.address) setEditVerificationAddress(result.address);
                              if (result.email) setEditVerificationEmail(result.email);
                              setEditVerificationDetails(result.notes);
                              setIsSearchingVerification(false);
                            }}
                            className="text-[10px] font-black uppercase tracking-widest text-teal-600 hover:text-teal-700 transition-colors flex items-center space-x-1 disabled:opacity-50"
                          >
                            {isSearchingVerification ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                            <span>Generate Details</span>
                          </button>
                        </div>
                        <textarea 
                          value={editVerificationDetails}
                          onChange={(e) => setEditVerificationDetails(e.target.value)}
                          className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 min-h-[100px]"
                          placeholder="Enter details pertaining to the specified situation..."
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <input 
                          type="checkbox" 
                          id="verificationConfirmed"
                          checked={editVerificationConfirmed}
                          onChange={(e) => setEditVerificationConfirmed(e.target.checked)}
                          className="w-4 h-4 text-teal-600 border-slate-300 rounded focus:ring-teal-500"
                        />
                        <label htmlFor="verificationConfirmed" className="text-xs font-bold text-slate-700">
                          *(Confirmed) Contact details pertaining to the scope are accurate and appropriately apply to situation
                        </label>
                      </div>
                      <div className="flex space-x-3">
                        <button
                          onClick={() => {
                            if (!editVerificationConfirmed) {
                              showNotification("Please confirm the contact details are accurate by checking the box.", 'ERROR');
                              return;
                            }
                            // Update the selectedDetailsItem in the queue
                            const updatedQueue = queue.map(item => {
                              if (item.id === selectedDetailsItem.id) {
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
                            setSelectedDetailsItem(updatedQueue.find(item => item.id === selectedDetailsItem.id));
                            showNotification("Contact details saved successfully.");
                          }}
                          className="flex-grow py-2 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-colors"
                        >
                          Save Details
                        </button>
                        {selectedDetailsItem.fullData?.recipientPhone && (
                          <a 
                            href={`tel:${selectedDetailsItem.fullData.recipientPhone}`}
                            className="px-4 py-2 bg-teal-600 text-white rounded-xl flex items-center justify-center hover:bg-teal-700 transition-colors"
                            title="Dial via System / Google Voice"
                          >
                            <Phone className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                      <div className="pt-2 border-t border-slate-100">
                        <button 
                          onClick={() => window.open('https://voice.google.com/', '_blank')}
                          className="w-full py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-teal-600 transition-colors flex items-center justify-center space-x-2"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Open Google Voice Dialer</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-8">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Document Preview</h3>
                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={() => {
                            const html = selectedDetailsItem.fullData?.generatedHtml || selectedDetailsItem.fullData?.documentHtml;
                            if (!html) return;
                            const blob = new Blob([html], { type: 'text/html' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `verification_${selectedDetailsItem.id}.html`;
                            a.click();
                            URL.revokeObjectURL(url);
                          }}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center space-x-1"
                          title="Save HTML"
                        >
                          <ClipboardList className="w-3 h-3" />
                          <span>Save</span>
                        </button>
                        <button 
                          onClick={() => {
                            const html = selectedDetailsItem.fullData?.generatedHtml || selectedDetailsItem.fullData?.documentHtml;
                            if (!html) return;
                            const printWindow = window.open('', '_blank');
                            if (printWindow) {
                              printWindow.document.write(html);
                              printWindow.document.close();
                              printWindow.focus();
                              printWindow.print();
                            }
                          }}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center space-x-1"
                          title="Print Document"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Print</span>
                        </button>
                        <button 
                          onClick={() => {
                            const subject = encodeURIComponent(`Verification Document: ${selectedDetailsItem.id}`);
                            const body = encodeURIComponent(`Please find the verification document details attached or below.\n\nID: ${selectedDetailsItem.id}\nApplicant: ${selectedDetailsItem.applicant}\nType: ${selectedDetailsItem.type}`);
                            window.location.href = `mailto:?subject=${subject}&body=${body}`;
                          }}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center space-x-1"
                          title="Email Document"
                        >
                          <Mail className="w-3 h-3" />
                          <span>Email</span>
                        </button>
                      </div>
                    </div>
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden h-[500px] flex flex-col">
                      <div className="flex-grow overflow-auto p-6 bg-slate-100">
                        <div className="bg-white shadow-lg border border-slate-200 w-full p-0 rounded-lg overflow-hidden">
                          <div 
                            className="w-full origin-top text-[10px]"
                            dangerouslySetInnerHTML={{ __html: selectedDetailsItem.fullData?.generatedHtml || selectedDetailsItem.fullData?.documentHtml || '<div class="p-10 text-center text-slate-400">No document preview available.</div>' }} 
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Emails */}
      {floatingEmails.map((floating, index) => (
        <div 
          key={floating.email.id}
          className={`fixed z-[200] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col`}
          style={{
            left: floating.isMinimized ? `${20 + (index * 220)}px` : 'auto',
            bottom: floating.isMinimized ? '20px' : 'auto',
            right: floating.isMinimized ? 'auto' : `${floating.position.x}px`,
            top: floating.isMinimized ? 'auto' : `${floating.position.y}px`,
            width: floating.isMinimized ? '200px' : '600px',
            height: floating.isMinimized ? '48px' : '500px',
          }}
        >
          <div 
            className="bg-slate-900 text-white p-3 flex justify-between items-center cursor-move"
            onMouseDown={(e) => handleDragStart(e, index)}
          >
            <div className="flex items-center space-x-2 overflow-hidden">
              <Mail className="w-4 h-4 text-teal-400 flex-shrink-0" />
              <span className="text-xs font-bold truncate">{floating.email.subject}</span>
            </div>
            <div className="flex items-center space-x-1 flex-shrink-0 ml-2" onMouseDown={(e) => e.stopPropagation()}>
              <button 
                onClick={() => {
                  const updated = [...floatingEmails];
                  updated[index].isMinimized = !updated[index].isMinimized;
                  setFloatingEmails(updated);
                }}
                className="p-1 hover:bg-white/20 rounded transition-colors"
              >
                {floating.isMinimized ? <Maximize2 className="w-3 h-3" /> : <Minimize2 className="w-3 h-3" />}
              </button>
              <button 
                onClick={() => setFloatingEmails(floatingEmails.filter(f => f.email.id !== floating.email.id))}
                className="p-1 hover:bg-red-500 rounded transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>
          {!floating.isMinimized && (
            <div className="flex-1 overflow-auto p-6 bg-slate-50">
              <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm mb-4">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-black text-slate-900">{floating.email.subject}</h3>
                    <p className="text-xs text-slate-500 mt-1">From: <span className="font-bold text-slate-700">{floating.email.from}</span></p>
                    <p className="text-xs text-slate-500">To: <span className="font-bold text-slate-700">{floating.email.to}</span></p>
                  </div>
                  <span className="text-xs font-bold text-slate-400">{floating.email.timestamp}</span>
                </div>
                <div className="prose prose-sm max-w-none text-slate-700 whitespace-pre-wrap">
                  {floating.email.body}
                </div>
              </div>
              
              {floating.email.attachments && floating.email.attachments.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Attachments</h4>
                  <div className="flex flex-wrap gap-2">
                    {floating.email.attachments.map((file, i) => (
                      <div key={i} className="flex items-center space-x-2 bg-white border border-slate-200 px-3 py-2 rounded-lg">
                        <Paperclip className="w-3 h-3 text-slate-400" />
                        <span className="text-xs font-bold text-slate-600">{file}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200">
                <div className="flex space-x-2">
                  <button 
                    onClick={() => handleReply(floating.email)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-colors flex items-center space-x-2"
                  >
                    <Reply className="w-3 h-3" />
                    <span>Reply</span>
                  </button>
                  <button 
                    onClick={() => handleForward(floating.email)}
                    className="px-4 py-2 bg-slate-200 text-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-300 transition-colors flex items-center space-x-2"
                  >
                    <Forward className="w-3 h-3" />
                    <span>Forward</span>
                  </button>
                </div>
                <div className="flex space-x-2">
                  <button 
                    onClick={() => handleMarkAsUnread(floating.email.id)}
                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                    title="Mark as Unread"
                  >
                    <Mail className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => {
                      handleDeleteEmail(floating.email.id);
                      setFloatingEmails(floatingEmails.filter(f => f.email.id !== floating.email.id));
                    }}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Notification Toast */}
      {notification && (
        <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] px-6 py-4 rounded-2xl shadow-2xl border animate-in slide-in-from-bottom-4 duration-300 flex items-center space-x-3 ${
          notification.type === 'SUCCESS' ? 'bg-emerald-900 border-emerald-500 text-white' :
          notification.type === 'ERROR' ? 'bg-red-900 border-red-500 text-white' :
          'bg-slate-900 border-slate-500 text-white'
        }`}>
          {notification.type === 'SUCCESS' && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
          {notification.type === 'ERROR' && <AlertCircle className="w-5 h-5 text-red-400" />}
          {notification.type === 'INFO' && <Info className="w-5 h-5 text-blue-400" />}
          <span className="text-sm font-black uppercase tracking-widest">{notification.message}</span>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
