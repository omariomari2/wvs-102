import { ScanResult, ChatMessage } from './types';

const API_BASE = import.meta.env.VITE_API_BASE || '';

export class APIClient {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE}${endpoint}`;
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  async initiateScan(url: string): Promise<{ scanId: string; url: string; status: string }> {
    return this.request('/api/scan', {
      method: 'POST',
      body: JSON.stringify({ url }),
    });
  }

  async getScanStatus(scanId: string): Promise<{
    scanId: string;
    url: string;
    scanResult?: ScanResult;
    chatHistory: ChatMessage[];
    createdAt: number;
    lastActivity: number;
  }> {
    return this.request(`/api/scan/${scanId}/status`);
  }

  async sendChatMessage(scanId: string, message: string): Promise<{
    message: string;
    messageId: string;
  }> {
    return this.request(`/api/chat/${scanId}`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  }

  async getChatHistory(scanId: string): Promise<{
    chatHistory: ChatMessage[];
  }> {
    return this.request(`/api/chat/${scanId}/history`);
  }
}

export const api = new APIClient();
