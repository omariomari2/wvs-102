import { DurableObject } from '@cloudflare/workers-types';
import { ScanResult, ChatMessage, ScanSession as ScanSessionType } from '../types';
import { AIChatService } from '../ai/chat';

export class ScanSession implements DurableObject {
  private state: DurableObjectState;
  private env: any;
  private sessionData: ScanSessionType | null = null;

  constructor(state: DurableObjectState, env: any) {
    this.state = state;
    this.env = env;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const method = request.method;

    try {
      switch (method) {
        case 'POST':
          if (url.pathname.endsWith('/scan')) {
            return await this.initiateScan(request);
          } else if (url.pathname.endsWith('/chat')) {
            return await this.handleChat(request);
          } else if (url.pathname.endsWith('/update-scan-result')) {
            return await this.updateScanResult(request);
          }
          break;
        
        case 'GET':
          if (url.pathname.endsWith('/status')) {
            return await this.getStatus();
          } else if (url.pathname.endsWith('/chat/history')) {
            return await this.getChatHistory();
          }
          break;
      }

      return new Response('Not Found', { status: 404 });
    } catch (error) {
      console.error('ScanSession error:', error);
      return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  private async initiateScan(request: Request): Promise<Response> {
    const body = await request.json() as unknown as { url?: string };
    const url = body?.url;
    
    if (!url) {
      return new Response(JSON.stringify({ error: 'URL is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Load existing session or create new one
    await this.loadSession();

    if (!this.sessionData) {
      this.sessionData = {
        scanId: this.generateScanId(),
        url,
        chatHistory: [],
        createdAt: Date.now(),
        lastActivity: Date.now()
      };
    }

    // Update scan URL if different
    if (this.sessionData.url !== url) {
      this.sessionData.url = url;
      this.sessionData.scanResult = undefined;
      this.sessionData.chatHistory = [];
    }

    this.sessionData.lastActivity = Date.now();
    await this.saveSession();

    return new Response(JSON.stringify({
      scanId: this.sessionData.scanId,
      url: this.sessionData.url,
      status: 'initiated'
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  private async handleChat(request: Request): Promise<Response> {
    const body = await request.json() as unknown as { message?: string };
    const message = body?.message;
    
    if (!message) {
      return new Response(JSON.stringify({ error: 'Message is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    await this.loadSession();

    if (!this.sessionData) {
      return new Response(JSON.stringify({ error: 'No active scan session' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Add user message to chat history
    const userMessage: ChatMessage = {
      id: this.generateMessageId(),
      role: 'user',
      content: message,
      timestamp: Date.now()
    };

    this.sessionData.chatHistory.push(userMessage);

    // Generate AI response
    const aiResponse = await this.generateAIResponse(message);
    
    const assistantMessage: ChatMessage = {
      id: this.generateMessageId(),
      role: 'assistant',
      content: aiResponse,
      timestamp: Date.now()
    };

    this.sessionData.chatHistory.push(assistantMessage);
    this.sessionData.lastActivity = Date.now();

    await this.saveSession();

    return new Response(JSON.stringify({
      message: aiResponse,
      messageId: assistantMessage.id
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  private async getStatus(): Promise<Response> {
    await this.loadSession();

    if (!this.sessionData) {
      return new Response(JSON.stringify({ error: 'No active scan session' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      scanId: this.sessionData.scanId,
      url: this.sessionData.url,
      scanResult: this.sessionData.scanResult,
      chatHistory: this.sessionData.chatHistory,
      createdAt: this.sessionData.createdAt,
      lastActivity: this.sessionData.lastActivity
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  private async getChatHistory(): Promise<Response> {
    await this.loadSession();

    if (!this.sessionData) {
      return new Response(JSON.stringify({ error: 'No active scan session' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      chatHistory: this.sessionData.chatHistory
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  private async generateAIResponse(userMessage: string): Promise<string> {
    try {
      const aiService = new AIChatService(this.env.AI);
      return await aiService.generateResponse(
        userMessage,
        this.sessionData?.scanResult || null,
        this.sessionData?.chatHistory || []
      );
    } catch (error) {
      console.error('AI response generation failed:', error);
      
      // Fallback response
      const scanContext = this.sessionData?.scanResult ? 
        `Scan results for ${this.sessionData.url}: ${JSON.stringify(this.sessionData.scanResult.summary)}` : 
        'No scan results available yet.';

      return `I understand you're asking about: "${userMessage}". ${scanContext} 

I'm experiencing some technical difficulties with the AI service. Please try again in a moment.`;
    }
  }

  private async loadSession(): Promise<void> {
    if (!this.sessionData) {
      const stored = await this.state.storage.get<ScanSessionType>('session');
      this.sessionData = stored || null;
    }
  }

  private async saveSession(): Promise<void> {
    if (this.sessionData) {
      await this.state.storage.put('session', this.sessionData);
    }
  }

  private generateScanId(): string {
    return `scan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async updateScanResult(request: Request): Promise<Response> {
    const scanResult: ScanResult = await request.json();
    
    await this.loadSession();
    
    if (this.sessionData) {
      this.sessionData.scanResult = scanResult;
      this.sessionData.lastActivity = Date.now();
      await this.saveSession();
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
