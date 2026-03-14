
import React, { useState, useEffect } from 'react';
import { ShieldCheck, ArrowRight, Loader2, Mail, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const EmailVerification: React.FC = () => {
  const navigate = useNavigate();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendLoading, setResendLoading] = useState(false);
  
  const pendingUser = JSON.parse(localStorage.getItem('wv_pending_user') || 'null');

  useEffect(() => {
    if (!pendingUser) {
      navigate('/register');
    }
  }, [pendingUser, navigate]);

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) value = value.slice(-1);
    if (!/^\d*$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`code-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      const prevInput = document.getElementById(`code-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const enteredCode = code.join('');
    
    if (enteredCode.length !== 6) {
      setError('Please enter the full 6-digit verification code.');
      return;
    }

    setIsLoading(true);
    setError(null);

    // Simulate verification delay
    setTimeout(() => {
      if (enteredCode === pendingUser.verificationCode) {
        // Finalize Registration
        const users = JSON.parse(localStorage.getItem('wv_users') || '[]');
        const newUser = {
          accountNumber: `WV-${Math.floor(100000 + Math.random() * 900000)}`,
          username: pendingUser.username,
          email: pendingUser.email,
          password: pendingUser.password, // Store the password
          orgName: pendingUser.orgName,
          tokens: pendingUser.tokens || 0, // Use tokens from pendingUser
          joinedAt: new Date().toISOString(),
          plan: pendingUser.plan || 'FREE', // Use plan from pendingUser
          verified: true
        };
        
        if (!users.find((u: any) => u.email === pendingUser.email)) {
          users.push(newUser);
          localStorage.setItem('wv_users', JSON.stringify(users));
        }

        localStorage.setItem('wv_auth', 'true');
        localStorage.setItem('wv_user_email', pendingUser.email);
        localStorage.setItem('wv_tokens', newUser.tokens.toString()); // Set tokens in session
        localStorage.removeItem('wv_pending_user');
        
        // Send a final welcome email after successful verification
        const message = `Welcome to the WeVerify network, ${newUser.orgName}!\n\nYour account has been successfully verified. You can now access your dashboard to manage verifications and token allocations.\n\nGetting Started:\n1. Access your dashboard at https://weverify.works/dashboard\n2. Configure your profile\n3. Start your first verification lifecycle\n\nContact Details:\nEmail: verifications@weverify.works\nHelpdesk: https://helpdesk.weverify.works\n\nCONFIDENTIALITY NOTICE: The content of this email is intended for the person or entity to which it is addressed only. This email may contain confidential information. If you are not the person to whom this message is addressed, be aware that any use, reproduction, or distribution of this message is strictly prohibited.`;
        const html = `
          <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px; max-width: 600px; margin: 0 auto;">
            <div style="text-align: center; margin-bottom: 20px;">
              <img src="https://www.ampcgfoundation.pro/img/weverifyworkslogo.jpg" alt="WeVerify Logo" style="max-width: 150px;" />
            </div>
            <h2 style="color: #333;">Welcome to WeVerify.works!</h2>
            <p style="font-size: 16px; color: #555;">Welcome to the WeVerify network, <strong>${newUser.orgName}</strong>!</p>
            <p style="font-size: 16px; color: #555;">Your account has been successfully verified. You can now access your dashboard to manage verifications and token allocations.</p>
            <h3 style="color: #0f766e;">Getting Started:</h3>
            <ol style="color: #555;">
              <li>Access your dashboard at <a href="https://weverify.works/dashboard">https://weverify.works/dashboard</a></li>
              <li>Configure your profile</li>
              <li>Start your first verification lifecycle</li>
            </ol>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;" />
            <p style="font-size: 14px; color: #888;">Contact Details:<br />
            Email: <a href="mailto:verifications@weverify.works" style="color: #14b8a6;">verifications@weverify.works</a><br />
            Helpdesk: <a href="https://helpdesk.weverify.works" style="color: #14b8a6;">https://helpdesk.weverify.works</a></p>
            <div style="margin-top: 24px; padding-top: 16px; border-top: 1px dashed #eee; font-size: 11px; line-height: 1.4; color: #999;">
              <strong>CONFIDENTIALITY NOTICE:</strong> The content of this email is intended for the person or entity to which it is addressed only. This email may contain confidential information. If you are not the person to whom this message is addressed, be aware that any use, reproduction, or distribution of this message is strictly prohibited.
            </div>
          </div>
        `;

        fetch("/api/email/send", {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: newUser.email,
            subject: "Welcome to WeVerify.works!",
            text: message,
            html: html
          })
        }).catch(err => console.error("Final welcome email failed", err));

        window.dispatchEvent(new Event('storage'));
        navigate('/dashboard');
      } else {
        setError('Invalid verification code. Please check your email and try again.');
        setIsLoading(false);
      }
    }, 1500);
  };

  const handleResend = async () => {
    if (!pendingUser) return;
    setResendLoading(true);
    setError(null);

    try {
      const message = `Your verification code is: ${pendingUser.verificationCode}\n\nPlease enter the above code to complete your account activation.\n\nCONFIDENTIALITY NOTICE: The content of this email is intended for the person or entity to which it is addressed only. This email may contain confidential information. If you are not the person to whom this message is addressed, be aware that any use, reproduction, or distribution of this message is strictly prohibited.`;
      const html = `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px; max-width: 600px; margin: 0 auto;">
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="https://www.ampcgfoundation.pro/img/weverifyworkslogo.jpg" alt="WeVerify Logo" style="max-width: 150px;" />
          </div>
          <h2 style="color: #333;">Verification Code - WeVerify.works</h2>
          <p style="font-size: 16px; color: #555;">Your verification code is:</p>
          <div style="background-color: #f0fdfa; border: 1px dashed #14b8a6; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; color: #0f766e; margin: 20px 0;">
            ${pendingUser.verificationCode}
          </div>
          <p style="font-size: 16px; color: #555;">Please enter the above code to complete your account activation.</p>
          <div style="margin-top: 24px; padding-top: 16px; border-top: 1px dashed #eee; font-size: 11px; line-height: 1.4; color: #999;">
            <strong>CONFIDENTIALITY NOTICE:</strong> The content of this email is intended for the person or entity to which it is addressed only. This email may contain confidential information. If you are not the person to whom this message is addressed, be aware that any use, reproduction, or distribution of this message is strictly prohibited.
          </div>
        </div>
      `;

      await fetch("/api/email/send", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: pendingUser.email,
          subject: "Verification Code - WeVerify.works",
          text: message,
          html: html
        })
      });
      alert('A new verification code has been sent to your email.');
    } catch (err) {
      setError('Failed to resend code. Please try again later.');
    } finally {
      setResendLoading(false);
    }
  };

  if (!pendingUser) return null;

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl border border-slate-200 p-10">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-teal-50 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-teal-100 shadow-lg">
             <Mail className="w-8 h-8 text-teal-600" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Verify Email</h1>
          <p className="text-slate-500 font-medium text-sm">We've sent a 6-digit code to <br/><span className="text-slate-900 font-bold">{pendingUser.email}</span></p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center space-x-3 text-red-600 text-xs font-bold uppercase tracking-wider">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleVerify} className="space-y-8">
          <div className="flex justify-between gap-2">
            {code.map((digit, idx) => (
              <input
                key={idx}
                id={`code-${idx}`}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                className="w-12 h-16 text-center text-2xl font-black bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 outline-none transition-all"
              />
            ))}
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-lg hover:bg-slate-800 transition-all shadow-xl flex items-center justify-center space-x-2"
          >
            {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
              <>
                <span>Verify Account</span>
                <ArrowRight className="w-5 h-5 text-teal-400" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button 
            onClick={handleResend}
            disabled={resendLoading}
            className="text-xs font-bold text-slate-400 hover:text-teal-600 uppercase tracking-widest transition-colors disabled:opacity-50"
          >
            {resendLoading ? 'Sending...' : "Didn't receive a code? Resend"}
          </button>
        </div>

        <div className="mt-12 flex items-center justify-center space-x-2 text-[10px] text-slate-300 font-black uppercase tracking-widest">
           <ShieldCheck className="w-3 h-3 text-teal-600/30" />
           <span>Secure Identity Verification</span>
        </div>
      </div>
    </div>
  );
};

export default EmailVerification;
