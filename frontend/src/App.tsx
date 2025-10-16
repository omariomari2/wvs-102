import React, { useState, useEffect, useRef } from 'react';
import { ScanResult, ChatMessage } from './types';
import { api } from './api';
import ScanForm from './components/ScanForm';
import ScanResults from './components/ScanResults';
import ChatInterface from './components/ChatInterface';

function App() {
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [currentScanId, setCurrentScanId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Poll for scan updates
  useEffect(() => {
    if (isScanning && currentScanId) {
      intervalRef.current = setInterval(async () => {
        try {
          const status = await api.getScanStatus(currentScanId);
          if (status.scanResult) {
            setScanResult(status.scanResult);
            setChatHistory(status.chatHistory);
            if (status.scanResult.status === 'completed' || status.scanResult.status === 'failed') {
              setIsScanning(false);
              if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
              }
            }
          }
        } catch (err) {
          console.error('Error polling scan status:', err);
        }
      }, 2000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isScanning, currentScanId]);

  const handleScan = async (url: string) => {
    try {
      setError(null);
      setIsScanning(true);
      setScanResult(null);
      setChatHistory([]);

      const result = await api.initiateScan(url);
      setCurrentScanId(result.scanId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start scan');
      setIsScanning(false);
    }
  };

  const handleChatMessage = async (message: string) => {
    if (!currentScanId) return;

    try {
      const response = await api.sendChatMessage(currentScanId, message);
      
      // Add user message
      const userMessage: ChatMessage = {
        id: `user_${Date.now()}`,
        role: 'user',
        content: message,
        timestamp: Date.now(),
      };

      // Add assistant response
      const assistantMessage: ChatMessage = {
        id: response.messageId,
        role: 'assistant',
        content: response.message,
        timestamp: Date.now(),
      };

      setChatHistory(prev => [...prev, userMessage, assistantMessage]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
    }
  };

  return (
    <div className="container">
      <div className="header">
        <h1>🔒 AI Security Scanner Chat</h1>
        <p>Scan websites for security vulnerabilities and chat with AI about the findings</p>
      </div>

      {error && (
        <div className="card" style={{ background: '#f8d7da', color: '#721c24', border: '1px solid #f5c6cb' }}>
          <strong>Error:</strong> {error}
          <button 
            onClick={() => setError(null)}
            style={{ marginLeft: '10px', background: 'none', border: 'none', color: '#721c24', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>
      )}

      <div className="card">
        <ScanForm onScan={handleScan} isScanning={isScanning} />
      </div>

      {isScanning && (
        <div className="card">
          <div className="scan-status running">
            <div className="loading" style={{ marginRight: '10px' }}></div>
            Scanning in progress... This may take a few moments.
          </div>
        </div>
      )}

      {scanResult && (
        <div className="card">
          <ScanResults scanResult={scanResult} />
        </div>
      )}

      {currentScanId && (scanResult || chatHistory.length > 0) && (
        <div className="card">
          <ChatInterface
            chatHistory={chatHistory}
            onSendMessage={handleChatMessage}
            scanResult={scanResult}
          />
        </div>
      )}
    </div>
  );
}

export default App;
