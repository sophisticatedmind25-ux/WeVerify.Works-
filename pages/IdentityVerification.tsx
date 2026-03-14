import React, { useState, useRef, useEffect } from 'react';
import { Camera, CheckCircle2, UserCheck, ShieldCheck, RefreshCw, Loader2, Key } from 'lucide-react';

const IdentityVerification: React.FC = () => {
  const [step, setStep] = useState(1); // 1: Welcome, 2: Camera, 3: Processing, 4: Done
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setStep(2);
    } catch (err) {
      alert("Please allow camera access to use Identity Verification.");
    }
  };

  const captureAndVerify = () => {
    setStep(3);
    // Simulate AI processing
    setTimeout(() => {
      setStep(4);
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    }, 3000);
  };

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-500">
        
        {step === 1 && (
          <div className="p-8 text-center">
            <div className="w-20 h-20 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-teal-100">
              <Key className="w-10 h-10 text-teal-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Identity Verification Portal</h2>
            <p className="text-slate-500 mb-8 leading-relaxed font-medium">
              Official biometric authentication for applicant onboarding. Liveness detection required for ISO 27001 compliance.
            </p>
            <button 
              onClick={startCamera}
              className="w-full py-4 bg-teal-600 text-white rounded-xl font-bold hover:bg-teal-700 transition-colors shadow-lg shadow-teal-100"
            >
              Start Onboarding Scan
            </button>
            <p className="text-xs text-slate-400 mt-6 flex items-center justify-center space-x-1 font-bold uppercase tracking-widest">
              <ShieldCheck className="w-3 h-3" />
              <span>WV-Registry Secure Link Active</span>
            </p>
          </div>
        )}

        {step === 2 && (
          <div className="p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4 text-center">Biometric Alignment</h2>
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-slate-900 border-2 border-teal-500">
               <video 
                 ref={videoRef} 
                 autoPlay 
                 playsInline 
                 className="w-full h-full object-cover scale-x-[-1]"
               />
               <div className="absolute inset-0 border-[40px] border-white/50 rounded-full pointer-events-none"></div>
               <div className="absolute bottom-4 inset-x-0 flex justify-center">
                 <button 
                   onClick={captureAndVerify}
                   className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all border border-slate-200"
                 >
                   <Camera className="w-8 h-8 text-teal-600" />
                 </button>
               </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="p-12 text-center">
            <Loader2 className="w-16 h-16 text-teal-500 animate-spin mx-auto mb-6" />
            <h2 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Analyzing Bio-metrics</h2>
            <p className="text-slate-500 font-bold animate-pulse">Checking for liveness artifacts...</p>
            <div className="mt-8 space-y-2">
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-teal-500 animate-progress"></div>
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 font-mono font-bold uppercase tracking-widest">
                <span>ID_MATCH</span>
                <span>LIVENESS_OK</span>
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="p-12 text-center">
            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-100">
              <CheckCircle2 className="w-12 h-12 text-emerald-500" />
            </div>
            <h2 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">Identity Confirmed</h2>
            <p className="text-slate-500 font-medium mb-8 italic">
              "Biometric profile successfully anchored to the verification registry."
            </p>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 mb-8 font-mono text-xs text-teal-700 text-left">
               WV-PROFILE: 0x8922...f32a<br/>
               VERDICT: HUMAN_POSITIVE<br/>
               CONFIDENCE: 99.82%
            </div>
            <button 
              onClick={() => setStep(1)}
              className="flex items-center justify-center space-x-2 w-full py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors"
            >
              <RefreshCw className="w-5 h-5" />
              <span>New Session</span>
            </button>
          </div>
        )}
      </div>
      <style>{`
        @keyframes progress {
          0% { width: 0%; }
          100% { width: 100%; }
        }
        .animate-progress {
          animation: progress 3s linear forwards;
        }
      `}</style>
    </div>
  );
};

export default IdentityVerification;