import { SecurityChecker } from './security-checks';
import { ApifyCrawler } from './apify-crawler';
import { ScanResult, SecurityFinding } from '../types';

export class WebsiteScanner {
  private apifyToken: string;

  constructor(apifyToken?: string) {
    this.apifyToken = apifyToken || '';
  }

  async scanWebsite(
    url: string, 
    options: { 
      maxPages?: number; 
      maxDepth?: number;
      useProxy?: boolean;
    } = {}
  ): Promise<ScanResult> {
    const scanId = this.generateScanId();
    const timestamp = Date.now();
    
    try {
      // Validate URL
      const targetUrl = this.normalizeUrl(url);
      
      // Initialize the crawler with Apify configuration
      const crawler = new ApifyCrawler({
        maxPages: options.maxPages || 10,
        maxDepth: options.maxDepth || 2,
        useProxy: options.useProxy || false,
        apifyToken: this.apifyToken
      });

      const allFindings: SecurityFinding[] = [];
      const securityChecker = new SecurityChecker(targetUrl, new Response(), '');
      
      // Start crawling
      await crawler.crawl(targetUrl, async (currentUrl: string, html: string) => {
        // Create a mock response for the security checker
        const response = new Response(html, {
          url: currentUrl,
          status: 200,
          headers: new Headers({
            'Content-Type': 'text/html',
          }),
        });
        
        try {
          // Update the security checker with the current page data
          if (securityChecker.updateContext) {
            securityChecker.updateContext(currentUrl, response, html);
          }
          
          // Run security checks on the current page
          const pageFindings = await securityChecker.runAllChecks();
          allFindings.push(...pageFindings);
          
          return pageFindings;
        } catch (error) {
          console.error(`Error processing security checks for ${currentUrl}:`, error);
          return [];
        }
      });
      
      // Calculate summary of all findings
      const summary = this.calculateSummary(allFindings);
      
      return {
        id: scanId,
        url: targetUrl,
        timestamp,
        status: 'completed',
        findings: allFindings,
        summary,
        pagesScanned: allFindings.length > 0 ? new Set(allFindings.map(f => f.url || targetUrl)).size : 1
      };
      
    } catch (error) {
      console.error('Scan failed:', error);
      
      return {
        id: scanId,
        url: url,
        timestamp,
        status: 'failed',
        findings: [],
        summary: { total: 0, critical: 0, high: 0, medium: 0, low: 0 }
      };
    }
  }

  private generateScanId(): string {
    return Math.random().toString(36).substring(2, 15);
  }
  
  private updateContext(url: string, response: Response, html: string) {
    this.url = url;
    this.response = response;
    this.html = html;
  }

  private normalizeUrl(url: string): string {
    // Add protocol if missing
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    
    // Remove trailing slash
    if (url.endsWith('/') && url.length > 1) {
      url = url.slice(0, -1);
    }
    
    return url;
  }

  private calculateSummary(findings: SecurityFinding[]) {
    const summary = {
      total: findings.length,
      critical: 0,
      high: 0,
      medium: 0,
      low: 0
    };

    findings.forEach(finding => {
      switch (finding.severity) {
        case 'critical':
          summary.critical++;
          break;
        case 'high':
          summary.high++;
          break;
        case 'medium':
          summary.medium++;
          break;
        case 'low':
          summary.low++;
          break;
      }
    });

    return summary;
  }
}
