import { WebsiteScanner } from './scanner/scanner';
import { ScanSession } from './durable-objects/ScanSession';
import { AIChatService } from './ai/chat';

export interface Env {
  SCAN_SESSION: DurableObjectNamespace;
  AI: any;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    // Handle preflight requests
    if (method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // API Routes
      if (path.startsWith('/api/scan')) {
        return await handleScanRoutes(request, env, corsHeaders, ctx);
      } else if (path.startsWith('/api/chat')) {
        return await handleChatRoutes(request, env, corsHeaders);
      } else if (path === '/api/health') {
        return new Response(JSON.stringify({ status: 'healthy', timestamp: Date.now() }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } else if (path === '/') {
        return new Response(JSON.stringify({
          name: 'AI Security Scanner Chat',
          version: '1.0.0',
          description: 'AI-powered website security scanner with chat interface',
          endpoints: {
            'POST /api/scan': 'Initiate a new security scan',
            'GET /api/scan/:id/status': 'Get scan status and results',
            'POST /api/chat/:scanId': 'Send chat message',
            'GET /api/chat/:scanId/history': 'Get chat history'
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      return new Response('Not Found', { 
        status: 404, 
        headers: corsHeaders 
      });
    } catch (error) {
      console.error('Worker error:', error);
      return new Response(JSON.stringify({ 
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }
};

async function handleScanRoutes(request: Request, env: Env, corsHeaders: Record<string, string>, ctx: ExecutionContext): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;

  if (method === 'POST' && path === '/api/scan') {
    // Initiate new scan
    const body = await request.json() as unknown as { url?: string };
    const targetUrl = body?.url;
    
    if (!targetUrl) {
      return new Response(JSON.stringify({ error: 'URL is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get or create Durable Object instance
    const id = env.SCAN_SESSION.idFromName('default-session');
    const durableObject = env.SCAN_SESSION.get(id);
    
    // Initiate scan in Durable Object
    const scanResponse = await durableObject.fetch('http://internal/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: targetUrl })
    });

    const scanData = await scanResponse.json();
    
    if (!scanResponse.ok) {
      return new Response(JSON.stringify(scanData), {
        status: scanResponse.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Start actual scanning in background
    ctx.waitUntil(performScan(targetUrl, durableObject, env));

    return new Response(JSON.stringify(scanData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  if (method === 'GET' && path.startsWith('/api/scan/') && path.endsWith('/status')) {
    // Get scan status
    const scanId = path.split('/')[3];
    
    if (!scanId) {
      return new Response(JSON.stringify({ error: 'Scan ID is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const id = env.SCAN_SESSION.idFromName('default-session');
    const durableObject = env.SCAN_SESSION.get(id);
    
    const statusResponse = await durableObject.fetch('http://internal/status');
    const statusData = await statusResponse.json();

    return new Response(JSON.stringify(statusData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  return new Response('Not Found', { 
    status: 404, 
    headers: corsHeaders 
  });
}

async function handleChatRoutes(request: Request, env: Env, corsHeaders: Record<string, string>): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;

  if (method === 'POST' && path.startsWith('/api/chat/')) {
    // Send chat message
    const scanId = path.split('/')[3];
    
    if (!scanId) {
      return new Response(JSON.stringify({ error: 'Scan ID is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json() as unknown as { message?: string };
    const message = body?.message;
    
    if (!message) {
      return new Response(JSON.stringify({ error: 'Message is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const id = env.SCAN_SESSION.idFromName('default-session');
    const durableObject = env.SCAN_SESSION.get(id);
    
    const chatResponse = await durableObject.fetch('http://internal/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message })
    });

    const chatData = await chatResponse.json();

    return new Response(JSON.stringify(chatData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  if (method === 'GET' && path.startsWith('/api/chat/') && path.endsWith('/history')) {
    // Get chat history
    const scanId = path.split('/')[3];
    
    if (!scanId) {
      return new Response(JSON.stringify({ error: 'Scan ID is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const id = env.SCAN_SESSION.idFromName('default-session');
    const durableObject = env.SCAN_SESSION.get(id);
    
    const historyResponse = await durableObject.fetch('http://internal/chat/history');
    const historyData = await historyResponse.json();

    return new Response(JSON.stringify(historyData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  return new Response('Not Found', { 
    status: 404, 
    headers: corsHeaders 
  });
}

async function performScan(targetUrl: string, durableObject: DurableObjectStub, env: Env): Promise<void> {
  try {
    console.log(`Starting scan for: ${targetUrl}`);
    
    const scanner = new WebsiteScanner();
    const scanResult = await scanner.scanWebsite(targetUrl);
    
    console.log(`Scan completed for: ${targetUrl}`, scanResult.summary);
    
    // Update Durable Object with scan results
    await durableObject.fetch('http://internal/update-scan-result', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(scanResult)
    });
    
  } catch (error) {
    console.error(`Scan failed for ${targetUrl}:`, error);
    
    // Update Durable Object with failed scan
    const failedResult = {
      id: `scan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      url: targetUrl,
      timestamp: Date.now(),
      status: 'failed',
      findings: [],
      summary: { total: 0, critical: 0, high: 0, medium: 0, low: 0 }
    };
    
    await durableObject.fetch('http://internal/update-scan-result', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(failedResult)
    });
  }
}
