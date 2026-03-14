/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  serverTimestamp,
  doc,
  setDoc,
  getDoc
} from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db, signInWithGoogle, logout } from './firebase';
import { 
  Video, 
  Upload, 
  History, 
  LogOut, 
  Play, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  ChevronRight,
  User as UserIcon
} from 'lucide-react';
import Markdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';

// --- Types ---
enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string;
    email?: string | null;
    emailVerified?: boolean;
    isAnonymous?: boolean;
    tenantId?: string | null;
  }
}

interface AnalysisRecord {
  id: string;
  videoName: string;
  analysis: string;
  timestamp: any;
  status: 'pending' | 'completed' | 'failed';
}

// --- Error Handling ---
function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// --- Main Component ---
export default function App() {
  const [user, loading, error] = useAuthState(auth);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentAnalysis, setCurrentAnalysis] = useState<string | null>(null);
  const [history, setHistory] = useState<AnalysisRecord[]>([]);
  const [selectedAnalysis, setSelectedAnalysis] = useState<AnalysisRecord | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync user to Firestore
  useEffect(() => {
    if (user) {
      const syncUser = async () => {
        const userRef = doc(db, 'users', user.uid);
        try {
          const userDoc = await getDoc(userRef);
          if (!userDoc.exists()) {
            await setDoc(userRef, {
              uid: user.uid,
              email: user.email,
              displayName: user.displayName,
              photoURL: user.photoURL,
              createdAt: serverTimestamp(),
            });
          }
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
        }
      };
      syncUser();
    }
  }, [user]);

  // Fetch history
  useEffect(() => {
    if (user) {
      const q = query(
        collection(db, 'analyses'),
        where('userId', '==', user.uid),
        orderBy('timestamp', 'desc')
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const records = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as AnalysisRecord[];
        setHistory(records);
      }, (err) => {
        handleFirestoreError(err, OperationType.LIST, 'analyses');
      });

      return () => unsubscribe();
    }
  }, [user]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setVideoFile(e.target.files[0]);
      setCurrentAnalysis(null);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = (reader.result as string).split(',')[1];
        resolve(base64String);
      };
      reader.onerror = error => reject(error);
    });
  };

  const analyzeVideo = async () => {
    if (!videoFile || !user) return;

    setIsAnalyzing(true);
    setCurrentAnalysis(null);
    setUploadProgress(10);

    try {
      const base64Data = await fileToBase64(videoFile);
      setUploadProgress(40);

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const model = "gemini-3.1-pro-preview";

      setUploadProgress(60);
      const response = await ai.models.generateContent({
        model,
        contents: [
          {
            parts: [
              { text: "Analyze this video in detail. Provide a summary, key events with timestamps if possible, and any notable observations." },
              {
                inlineData: {
                  mimeType: videoFile.type,
                  data: base64Data
                }
              }
            ]
          }
        ]
      });

      const resultText = response.text || "No analysis generated.";
      setCurrentAnalysis(resultText);
      setUploadProgress(90);

      // Save to Firestore
      await addDoc(collection(db, 'analyses'), {
        userId: user.uid,
        videoName: videoFile.name,
        analysis: resultText,
        timestamp: serverTimestamp(),
        status: 'completed'
      });

      setUploadProgress(100);
    } catch (err) {
      console.error("Analysis failed:", err);
      setCurrentAnalysis("Error: Failed to analyze video. Please try again.");
      
      if (user) {
        await addDoc(collection(db, 'analyses'), {
          userId: user.uid,
          videoName: videoFile.name,
          analysis: "Analysis failed due to an error.",
          timestamp: serverTimestamp(),
          status: 'failed'
        });
      }
    } finally {
      setIsAnalyzing(false);
      setUploadProgress(0);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full glass-panel p-8 rounded-2xl shadow-xl text-center"
        >
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-200">
            <Video className="text-white w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold mb-2 tracking-tight">VideoInsight AI</h1>
          <p className="text-slate-500 mb-8">Advanced video understanding powered by Gemini Pro.</p>
          <button
            onClick={signInWithGoogle}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-100"
          >
            <UserIcon className="w-5 h-5" />
            Sign in with Google
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-10 glass-panel border-b border-slate-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-md shadow-blue-100">
              <Video className="text-white w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold tracking-tight hidden sm:block">VideoInsight AI</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-full border border-slate-200 shadow-sm">
              {user.photoURL ? (
                <img src={user.photoURL} alt="" className="w-6 h-6 rounded-full" referrerPolicy="no-referrer" />
              ) : (
                <UserIcon className="w-4 h-4 text-slate-400" />
              )}
              <span className="text-sm font-medium hidden md:block">{user.displayName}</span>
            </div>
            <button
              onClick={logout}
              className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Analysis Section */}
          <div className="lg:col-span-2 space-y-8">
            <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Upload className="w-5 h-5 text-blue-600" />
                Analyze New Video
              </h2>
              
              <div 
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${
                  videoFile ? 'border-blue-400 bg-blue-50' : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'
                }`}
              >
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="video/*"
                  className="hidden"
                />
                {videoFile ? (
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                      <Play className="text-blue-600 w-6 h-6" />
                    </div>
                    <p className="font-medium text-blue-900">{videoFile.name}</p>
                    <p className="text-sm text-blue-600 mt-1">{(videoFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                      <Upload className="text-slate-400 w-6 h-6" />
                    </div>
                    <p className="font-medium">Click or drag video to upload</p>
                    <p className="text-sm text-slate-500 mt-1">MP4, MOV, AVI up to 50MB</p>
                  </div>
                )}
              </div>

              {videoFile && !isAnalyzing && (
                <button
                  onClick={analyzeVideo}
                  className="w-full mt-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-lg shadow-blue-100 transition-all flex items-center justify-center gap-2"
                >
                  Start Analysis
                </button>
              )}

              {isAnalyzing && (
                <div className="mt-6 space-y-3">
                  <div className="flex items-center justify-between text-sm font-medium">
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                      Gemini is thinking...
                    </span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <motion.div 
                      className="bg-blue-600 h-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </section>

            <AnimatePresence mode="wait">
              {(currentAnalysis || selectedAnalysis) && (
                <motion.section 
                  key={selectedAnalysis?.id || 'current'}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold tracking-tight">
                      {selectedAnalysis ? selectedAnalysis.videoName : 'Analysis Result'}
                    </h2>
                    {selectedAnalysis && (
                      <button 
                        onClick={() => setSelectedAnalysis(null)}
                        className="text-sm text-blue-600 hover:underline"
                      >
                        Back to new analysis
                      </button>
                    )}
                  </div>
                  
                  <div className="prose prose-slate max-w-none markdown-body">
                    <Markdown>
                      {selectedAnalysis ? selectedAnalysis.analysis : currentAnalysis}
                    </Markdown>
                  </div>
                </motion.section>
              )}
            </AnimatePresence>
          </div>

          {/* Sidebar: History */}
          <div className="lg:col-span-1">
            <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden sticky top-28">
              <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <h2 className="font-semibold flex items-center gap-2">
                  <History className="w-4 h-4 text-slate-500" />
                  Recent Analyses
                </h2>
                <span className="text-xs font-mono bg-slate-200 px-2 py-0.5 rounded text-slate-600">
                  {history.length}
                </span>
              </div>
              
              <div className="max-h-[600px] overflow-y-auto">
                {history.length === 0 ? (
                  <div className="p-10 text-center text-slate-400">
                    <p className="text-sm italic">No history yet.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {history.map((record) => (
                      <button
                        key={record.id}
                        onClick={() => setSelectedAnalysis(record)}
                        className={`w-full p-4 text-left hover:bg-slate-50 transition-colors group flex items-start gap-3 ${
                          selectedAnalysis?.id === record.id ? 'bg-blue-50/50' : ''
                        }`}
                      >
                        <div className={`mt-1 p-1.5 rounded-lg ${
                          record.status === 'completed' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                        }`}>
                          {record.status === 'completed' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate group-hover:text-blue-600 transition-colors">
                            {record.videoName}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {record.timestamp?.toDate().toLocaleDateString()} • {record.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-400 mt-1" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </div>

        </div>
      </main>
    </div>
  );
}
