#!/bin/bash

echo "🚀 Deploying AI Security Scanner Chat to Cloudflare..."

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler CLI not found. Please install it first:"
    echo "npm install -g wrangler"
    exit 1
fi

# Check if logged in to Cloudflare
if ! wrangler whoami &> /dev/null; then
    echo "❌ Not logged in to Cloudflare. Please run:"
    echo "wrangler login"
    exit 1
fi

echo "📦 Installing dependencies..."
npm install

echo "🔧 Building TypeScript..."
npm run build

echo "🌐 Deploying Worker..."
wrangler deploy

echo "📱 Building frontend..."
cd frontend
npm install
npm run build

echo "✅ Deployment complete!"
echo ""
echo "Next steps:"
echo "1. Upload the 'frontend/dist' folder to Cloudflare Pages"
echo "2. Update the VITE_API_BASE in frontend/.env to your worker URL"
echo "3. Test the application"
echo ""
echo "Worker URL: Check wrangler output above"
echo "Frontend: Upload dist/ to Cloudflare Pages"
