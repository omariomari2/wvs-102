export interface SecurityFinding {
  id: string;
  type: 'header' | 'ssl' | 'content' | 'cookie' | 'file' | 'xss' | 'cors' | 'library';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  recommendation: string;
  details: Record<string, any>;
}

export interface ScanResult {
  id: string;
  url: string;
  timestamp: number;
  status: 'pending' | 'running' | 'completed' | 'failed';
  findings: SecurityFinding[];
  summary: {
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface ScanSession {
  scanId: string;
  url: string;
  scanResult?: ScanResult;
  chatHistory: ChatMessage[];
  createdAt: number;
  lastActivity: number;
}
