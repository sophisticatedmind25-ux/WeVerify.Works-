import React, { useState } from 'react';
import { Database, ShieldCheck, ArrowRight, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const Registration: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    orgName: '',
    username: '',
    email: '',
    password: '',
    plan: 'TRIAL' // Default to Free Trial
  });

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Generate a 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Determine initial tokens based on plan
    let initialTokens = 0;
    if (formData.plan === 'TRIAL') {
      initialTokens = 1;
    }

    try {
      // Send Verification Email via SMTP
      const message = `Your verification code is: ${verificationCode}\n\nPlease enter the above code to complete your account activation.\n\nContact Details:\nEmail: verifications@weverify.works\nHelpdesk: https://helpdesk.weverify.works\n\nCONFIDENTIALITY NOTICE: The content of this email is intended for the person or entity to which it is addressed only. This email may contain confidential information. If you are not the person to whom this message is addressed, be aware that any use, reproduction, or distribution of this message is strictly prohibited.`;
      const html = `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px; max-width: 600px; margin: 0 auto;">
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="https://www.ampcgfoundation.pro/img/weverifyworkslogo.jpg" alt="WeVerify Logo" style="max-width: 150px;" />
          </div>
          <h2 style="color: #333;">Verify Your WeVerify.works Account</h2>
          <p style="font-size: 16px; color: #555;">Your verification code is:</p>
          <div style="background-color: #f0fdfa; border: 1px dashed #14b8a6; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; color: #0f766e; margin: 20px 0;">
            ${verificationCode}
          </div>
          <p style="font-size: 16px; color: #555;">Please enter the above code to complete your account activation.</p>
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
          to: formData.email,
          subject: "Verify Your WeVerify.works Account",
          text: message,
          html: html
        })
      });
    } catch (err) {
      console.error("Verification email dispatch failed", err);
    }

    // Simulate API delay for local state
    setTimeout(() => {
      // Store pending user data for verification
      localStorage.setItem('wv_pending_user', JSON.stringify({
        ...formData,
        verificationCode,
        tokens: initialTokens // Grant tokens
      }));
      
      navigate('/verify-email');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl border border-slate-200 p-10 animate-in fade-in zoom-in-95 duration-500">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-teal-50 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-teal-100 shadow-lg">
             <Database className="w-8 h-8 text-teal-600" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Create Organization Account</h1>
          <p className="text-slate-500 font-medium text-sm">Join the institutional verification network.</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-2">Organization Entity</label>
            <input 
              required
              type="text" 
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all"
              placeholder="Company or LLC Name"
              value={formData.orgName}
              onChange={(e) => setFormData({...formData, orgName: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-2">Username</label>
            <input 
              required
              type="text" 
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all"
              placeholder="jdoe_admin"
              value={formData.username}
              onChange={(e) => setFormData({...formData, username: e.target.value})}
            />
          </div>
          
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-2">Contact Email</label>
            <input 
              required
              type="email" 
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all"
              placeholder="contact@company.com"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-2">Service Plan</label>
            <select
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all appearance-none"
              value={formData.plan}
              onChange={(e) => setFormData({...formData, plan: e.target.value})}
            >
              <option value="TRIAL">Free Trial (1 Token)</option>
              <option value="STANDARD">Standard Organization</option>
              <option value="ENTERPRISE">Enterprise (Contact Sales)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-2">Secure Passphrase</label>
            <input 
              required
              type="password" 
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all"
              placeholder="••••••••••••"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
            />
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-lg hover:bg-slate-800 transition-all shadow-xl flex items-center justify-center space-x-2 mt-4"
          >
            {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
              <>
                <span>Create account</span>
                <ArrowRight className="w-5 h-5 text-teal-400" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <Link to="/login" className="text-xs font-bold text-slate-400 hover:text-teal-600 uppercase tracking-widest transition-colors">
            Already have an account? Login
          </Link>
        </div>

        <div className="mt-12 flex items-center justify-center space-x-2 text-[10px] text-slate-300 font-black uppercase tracking-widest">
           <ShieldCheck className="w-3 h-3 text-teal-600/30" />
           <span>ISO 27001 Encrypted Pipeline</span>
        </div>
      </div>
    </div>
  );
};

export default Registration;