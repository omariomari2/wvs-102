# AI Security Scanner Chat

An AI-powered website security scanner built on Cloudflare Workers with an intelligent chat interface. This application scans websites for security vulnerabilities and allows users to chat with an AI assistant about the findings.

## Features

- **Comprehensive Security Scanning**: Checks for missing security headers, SSL issues, mixed content, cookie security, exposed files, XSS vulnerabilities, CORS misconfigurations, and outdated libraries
- **AI-Powered Analysis**: Uses Cloudflare Workers AI with Llama 3.3 to provide intelligent insights and recommendations
- **Interactive Chat Interface**: Ask questions about scan results and get detailed explanations
- **Real-time Updates**: Live scan progress and instant chat responses
- **Modern UI**: Clean, responsive interface built with React and TypeScript

## Architecture

### Backend (Cloudflare Workers)
- **Security Scanner**: JavaScript-based scanner that analyzes websites for various security issues
- **Durable Objects**: Manages scan state and chat conversation history per session
- **Workers AI**: Llama 3.3 integration for intelligent security analysis and chat responses
- **API Endpoints**: RESTful API for scan initiation, status checking, and chat interactions

### Frontend (Cloudflare Pages)
- **React Application**: Modern, responsive UI with real-time updates
- **Chat Interface**: Interactive chat with AI assistant
- **Scan Results Visualization**: Clear display of security findings with severity levels

## Technology Stack

- **Runtime**: Cloudflare Workers (JavaScript/TypeScript)
- **AI Model**: Workers AI - Llama 3.3 70B
- **State Management**: Durable Objects
- **Frontend**: React + TypeScript + Vite
- **Deployment**: Cloudflare Pages + Workers
- **Build Tool**: Wrangler CLI

## Assignment Requirements Coverage

✅ **LLM**: Llama 3.3 on Workers AI for interpreting security findings  
✅ **Workflow/Coordination**: Workers + Durable Objects managing scan state and chat  
✅ **User Input**: Chat interface via Cloudflare Pages  
✅ **Memory/State**: Durable Objects storing scan results and conversation history  

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Cloudflare account
- Wrangler CLI installed globally: `npm install -g wrangler`

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ai-security-scanner-chat
   ```

2. **Install dependencies**
   ```bash
   # Backend dependencies
   npm install
   
   # Frontend dependencies
   cd frontend
   npm install
   cd ..
   ```

3. **Configure Cloudflare**
   ```bash
   # Login to Cloudflare
   wrangler login
   
   # Update wrangler.toml with your account ID
   ```

4. **Deploy the application**
   ```bash
   # Deploy the worker
   wrangler deploy
   
   # Build and deploy frontend to Cloudflare Pages
   cd frontend
   npm run build
   # Upload dist/ folder to Cloudflare Pages
   ```

### Development

1. **Start the development server**
   ```bash
   # Backend
   npm run dev
   
   # Frontend (in another terminal)
   cd frontend
   npm run dev
   ```

2. **Test the application**
   - Open the frontend URL
   - Enter a website URL to scan
   - Wait for scan completion
   - Chat with the AI about the findings

## API Endpoints

- `POST /api/scan` - Initiate a new security scan
- `GET /api/scan/:id/status` - Get scan status and results
- `POST /api/chat/:scanId` - Send chat message
- `GET /api/chat/:scanId/history` - Get chat history
- `GET /api/health` - Health check

## Security Checks Performed

### Headers
- Content Security Policy (CSP)
- X-Frame-Options
- X-Content-Type-Options
- X-XSS-Protection
- Strict-Transport-Security (HSTS)
- Referrer-Policy

### SSL/TLS
- HTTPS enforcement
- SSL certificate validation

### Content Security
- Mixed content detection
- Cookie security flags (Secure, HttpOnly, SameSite)
- CORS misconfigurations

### Vulnerability Detection
- Exposed sensitive files
- Basic XSS vulnerability patterns
- Outdated library detection

## Usage Examples

1. **Basic Scan**
   ```
   URL: https://example.com
   Result: Comprehensive security analysis with findings
   ```

2. **Chat Interactions**
   ```
   User: "What are the most critical issues?"
   AI: "Based on your scan, I found 3 critical issues that need immediate attention..."
   
   User: "How do I fix the missing CSP header?"
   AI: "To implement Content Security Policy, you need to add a CSP header..."
   ```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- Create an issue in the repository
- Check the Cloudflare Workers documentation
- Review the Workers AI documentation

---

Built with ❤️ using Cloudflare Workers, Workers AI, and React
