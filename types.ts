
export interface VerificationResult {
  score: number;
  verdict: 'AUTHENTIC' | 'SUSPICIOUS' | 'MANIPULATED' | 'UNCONFIRMED';
  analysis: string;
  sources: Array<{ title: string; uri: string }>;
  timestamp: string;
}

export enum VerificationMode {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  IDENTITY = 'IDENTITY'
}

export interface VerificationStats {
  totalVerified: number;
  activeNodes: number;
  trustIndex: number;
}
