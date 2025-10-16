# PowerShell deployment script for Windows
Write-Host "🚀 Deploying AI Security Scanner Chat to Cloudflare..." -ForegroundColor Green

# Check if wrangler is installed
try {
    wrangler --version | Out-Null
    Write-Host "✅ Wrangler CLI found" -ForegroundColor Green
} catch {
    Write-Host "❌ Wrangler CLI not found. Please install it first:" -ForegroundColor Red
    Write-Host "npm install -g wrangler" -ForegroundColor Yellow
    exit 1
}

# Check if logged in to Cloudflare
try {
    wrangler whoami | Out-Null
    Write-Host "✅ Logged in to Cloudflare" -ForegroundColor Green
} catch {
    Write-Host "❌ Not logged in to Cloudflare. Please run:" -ForegroundColor Red
    Write-Host "wrangler login" -ForegroundColor Yellow
    exit 1
}

Write-Host "📦 Installing dependencies..." -ForegroundColor Blue
npm install

Write-Host "🔧 Building TypeScript..." -ForegroundColor Blue
npm run build

Write-Host "🌐 Deploying Worker..." -ForegroundColor Blue
wrangler deploy

Write-Host "📱 Building frontend..." -ForegroundColor Blue
Set-Location frontend
npm install
npm run build
Set-Location ..

Write-Host "✅ Deployment complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Upload the 'frontend/dist' folder to Cloudflare Pages"
Write-Host "2. Update the VITE_API_BASE in frontend/.env to your worker URL"
Write-Host "3. Test the application"
Write-Host ""
Write-Host "Worker URL: Check wrangler output above" -ForegroundColor Cyan
Write-Host "Frontend: Upload dist/ to Cloudflare Pages" -ForegroundColor Cyan
