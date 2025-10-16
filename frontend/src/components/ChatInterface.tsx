import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, ScanResult } from '../types';

interface ChatInterfaceProps {
  chatHistory: ChatMessage[];
  onSendMessage: (message: string) => void;
  scanResult: ScanResult | null;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  chatHistory, 
  onSendMessage, 
  scanResult 
}) => {
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !isLoading) {
      setIsLoading(true);
      await onSendMessage(message.trim());
      setMessage('');
      setIsLoading(false);
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const getSuggestedQuestions = () => {
    if (!scanResult) return [];
    
    const suggestions = [
      "What are the most critical issues?",
      "How can I fix the security headers?",
      "What's the business impact of these findings?",
      "How do I prevent these issues in the future?",
    ];

    if (scanResult.summary.critical > 0) {
      suggestions.unshift("Which critical issues should I fix first?");
    }

    if (scanResult.summary.high > 0) {
      suggestions.push("Explain the high-priority vulnerabilities");
    }

    return suggestions.slice(0, 4);
  };

  return (
    <div>
      <h2 style={{ marginBottom: '16px', color: '#333' }}>
        💬 Chat with AI Security Expert
      </h2>
      
      {scanResult && chatHistory.length === 0 && (
        <div style={{ marginBottom: '16px', padding: '16px', background: '#e3f2fd', borderRadius: '8px' }}>
          <p style={{ marginBottom: '12px', fontWeight: '500' }}>
            Ask me anything about your security scan results! Here are some suggestions:
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {getSuggestedQuestions().map((suggestion, index) => (
              <button
                key={index}
                onClick={() => setMessage(suggestion)}
                style={{
                  padding: '6px 12px',
                  background: 'white',
                  border: '1px solid #2196f3',
                  borderRadius: '16px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  color: '#2196f3',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = '#2196f3';
                  e.currentTarget.style.color = 'white';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'white';
                  e.currentTarget.style.color = '#2196f3';
                }}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="chat-container">
        <div className="chat-messages">
          {chatHistory.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              color: '#6c757d', 
              padding: '40px',
              fontStyle: 'italic'
            }}>
              Start a conversation about your security scan results...
            </div>
          ) : (
            chatHistory.map((msg) => (
              <div key={msg.id} className={`message ${msg.role}`}>
                <div className="message-content">
                  {msg.content}
                </div>
                <div className="message-time">
                  {formatTime(msg.timestamp)}
                </div>
              </div>
            ))
          )}
          {isLoading && (
            <div className="message assistant">
              <div className="message-content">
                <div className="loading" style={{ marginRight: '8px' }}></div>
                AI is thinking...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        
        <form className="chat-input" onSubmit={handleSubmit}>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Ask about security findings..."
            disabled={isLoading}
          />
          <button type="submit" disabled={isLoading || !message.trim()}>
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatInterface;
