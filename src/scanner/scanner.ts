import { SecurityChecker } from './security-checks';
import { ScanResult, SecurityFinding } from '../types';

export class WebsiteScanner {
  async scanWebsite(url: string): Promise<ScanResult> {
    const scanId = this.generateScanId();
    const timestamp = Date.now();
    
    try {
      // Validate URL
      const targetUrl = this.normalizeUrl(url);
      
      // Fetch the website
      const response = await fetch(targetUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'SecurityScanner/1.0',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        redirect: 'follow'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Get HTML content
      const html = await response.text();
      
      // Run security checks
      const checker = new SecurityChecker(targetUrl, response, html);
      const findings = await checker.runAllChecks();
      
      // Calculate summary
      const summary = this.calculateSummary(findings);
      
      return {
        id: scanId,
        url: targetUrl,
        timestamp,
        status: 'completed',
        findings,
        summary
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
    return `scan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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
