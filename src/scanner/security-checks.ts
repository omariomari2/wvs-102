import { SecurityFinding } from '../types';

export class SecurityChecker {
  private url: string;
  private response: Response;
  private html: string;

  constructor(url: string, response: Response, html: string) {
    this.url = url;
    this.response = response;
    this.html = html;
  }

  updateContext(url: string, response: Response, html: string) {
    this.url = url;
    this.response = response;
    this.html = html;
  }

  async checkSecurityHeaders(): Promise<SecurityFinding[]> {
    const findings: SecurityFinding[] = [];
    const headers = this.response.headers;

    // Check for missing security headers
    const securityHeaders = {
      'Content-Security-Policy': {
        severity: 'high' as const,
        description: 'Content Security Policy helps prevent XSS attacks',
        recommendation: 'Add a comprehensive CSP header'
      },
      'X-Frame-Options': {
        severity: 'medium' as const,
        description: 'Prevents clickjacking attacks',
        recommendation: 'Add X-Frame-Options: DENY or SAMEORIGIN'
      },
      'X-Content-Type-Options': {
        severity: 'medium' as const,
        description: 'Prevents MIME type sniffing',
        recommendation: 'Add X-Content-Type-Options: nosniff'
      },
      'X-XSS-Protection': {
        severity: 'low' as const,
        description: 'Enables XSS filtering in browsers',
        recommendation: 'Add X-XSS-Protection: 1; mode=block'
      },
      'Strict-Transport-Security': {
        severity: 'high' as const,
        description: 'Enforces HTTPS connections',
        recommendation: 'Add Strict-Transport-Security header with appropriate max-age'
      },
      'Referrer-Policy': {
        severity: 'low' as const,
        description: 'Controls referrer information sent with requests',
        recommendation: 'Add Referrer-Policy header'
      }
    };

    for (const [header, config] of Object.entries(securityHeaders)) {
      if (!headers.get(header)) {
        findings.push({
          id: `missing-${header.toLowerCase()}`,
          type: 'header',
          severity: config.severity,
          title: `Missing ${header} Header`,
          description: config.description,
          recommendation: config.recommendation,
          details: { header, expected: true, actual: false }
        });
      }
    }

    // Check CSP quality
    const csp = headers.get('Content-Security-Policy');
    if (csp) {
      if (!csp.includes('default-src')) {
        findings.push({
          id: 'csp-no-default-src',
          type: 'header',
          severity: 'medium',
          title: 'CSP Missing default-src Directive',
          description: 'CSP should include a default-src directive as a fallback',
          recommendation: 'Add default-src directive to CSP',
          details: { csp, issue: 'missing-default-src' }
        });
      }
    }

    return findings;
  }

  checkSSL(): SecurityFinding[] {
    const findings: SecurityFinding[] = [];
    const url = new URL(this.url);

    if (url.protocol !== 'https:') {
      findings.push({
        id: 'no-https',
        type: 'ssl',
        severity: 'critical',
        title: 'Site Not Using HTTPS',
        description: 'The site is not using HTTPS encryption',
        recommendation: 'Implement HTTPS with a valid SSL certificate',
        details: { protocol: url.protocol, secure: false }
      });
    }

    return findings;
  }

  checkMixedContent(): SecurityFinding[] {
    const findings: SecurityFinding[] = [];
    const url = new URL(this.url);

    if (url.protocol === 'https:') {
      // Check for mixed content in HTML
      const httpResources = this.html.match(/https?:\/\/[^"'\s]+/g) || [];
      const mixedContent = httpResources.filter(resource => 
        resource.startsWith('http://') && !resource.includes('localhost')
      );

      if (mixedContent.length > 0) {
        findings.push({
          id: 'mixed-content',
          type: 'content',
          severity: 'high',
          title: 'Mixed Content Detected',
          description: 'HTTPS page loads resources over HTTP',
          recommendation: 'Update all resource URLs to use HTTPS',
          details: { mixedContentUrls: mixedContent }
        });
      }
    }

    return findings;
  }

  checkCookies(): SecurityFinding[] {
    const findings: SecurityFinding[] = [];
    const setCookie = this.response.headers.get('Set-Cookie');
    const cookies = setCookie ? setCookie.split(/,(?=[^;]+?=)/) : [];

    cookies.forEach((cookie: string, index: number) => {
      const cookieStr = cookie.split(';')[0];
      const cookieName = cookieStr.split('=')[0];
      const cookieLower = cookie.toLowerCase();

      if (!cookieLower.includes('secure') && this.url.startsWith('https://')) {
        findings.push({
          id: `cookie-${index}-no-secure`,
          type: 'cookie',
          severity: 'medium',
          title: `Cookie '${cookieName}' Missing Secure Flag`,
          description: 'Cookie should have Secure flag when served over HTTPS',
          recommendation: 'Add Secure flag to cookie',
          details: { cookie: cookieStr, missingFlag: 'Secure' }
        });
      }

      if (!cookieLower.includes('httponly')) {
        findings.push({
          id: `cookie-${index}-no-httponly`,
          type: 'cookie',
          severity: 'medium',
          title: `Cookie '${cookieName}' Missing HttpOnly Flag`,
          description: 'Cookie should have HttpOnly flag to prevent XSS access',
          recommendation: 'Add HttpOnly flag to cookie',
          details: { cookie: cookieStr, missingFlag: 'HttpOnly' }
        });
      }

      if (!cookieLower.includes('samesite')) {
        findings.push({
          id: `cookie-${index}-no-samesite`,
          type: 'cookie',
          severity: 'low',
          title: `Cookie '${cookieName}' Missing SameSite Flag`,
          description: 'Cookie should have SameSite flag for CSRF protection',
          recommendation: 'Add SameSite flag to cookie',
          details: { cookie: cookieStr, missingFlag: 'SameSite' }
        });
      }
    });

    return findings;
  }

  checkExposedFiles(): SecurityFinding[] {
    const findings: SecurityFinding[] = [];
    const sensitiveFiles = [
      '.git',
      '.env',
      'robots.txt',
      'sitemap.xml',
      'admin',
      'wp-admin',
      'phpmyadmin',
      'backup',
      'test',
      'dev'
    ];

    // This is a simplified check - in a real implementation, you'd make requests
    // to check if these files exist
    const foundFiles = sensitiveFiles.filter(file => 
      this.html.toLowerCase().includes(file) || 
      this.url.toLowerCase().includes(file)
    );

    if (foundFiles.length > 0) {
      findings.push({
        id: 'exposed-sensitive-files',
        type: 'file',
        severity: 'medium',
        title: 'Potentially Exposed Sensitive Files',
        description: 'References to sensitive files or directories found',
        recommendation: 'Ensure sensitive files are not publicly accessible',
        details: { foundFiles }
      });
    }

    return findings;
  }

  checkXSSVulnerabilities(): SecurityFinding[] {
    const findings: SecurityFinding[] = [];
    
    // Check for basic XSS patterns in forms
    const forms = this.html.match(/<form[^>]*>/gi) || [];
    const hasInputFields = this.html.includes('<input') || this.html.includes('<textarea');
    
    if (forms.length > 0 && hasInputFields) {
      // Check if forms have proper validation attributes
      const formsWithoutValidation = forms.filter(form => 
        !form.includes('required') && 
        !form.includes('pattern') && 
        !form.includes('minlength')
      );

      if (formsWithoutValidation.length > 0) {
        findings.push({
          id: 'forms-no-validation',
          type: 'xss',
          severity: 'medium',
          title: 'Forms Without Input Validation',
          description: 'Forms may be vulnerable to XSS without proper validation',
          recommendation: 'Add client-side and server-side input validation',
          details: { formCount: forms.length, formsWithoutValidation: formsWithoutValidation.length }
        });
      }
    }

    return findings;
  }

  checkCORS(): SecurityFinding[] {
    const findings: SecurityFinding[] = [];
    const corsHeader = this.response.headers.get('Access-Control-Allow-Origin');

    if (corsHeader === '*') {
      findings.push({
        id: 'cors-wildcard',
        type: 'cors',
        severity: 'high',
        title: 'CORS Allows All Origins',
        description: 'Access-Control-Allow-Origin is set to * allowing all origins',
        recommendation: 'Restrict CORS to specific trusted origins',
        details: { corsHeader, issue: 'wildcard-origin' }
      });
    }

    return findings;
  }

  checkOutdatedLibraries(): SecurityFinding[] {
    const findings: SecurityFinding[] = [];
    
    // Check for common outdated libraries
    const libraryPatterns = [
      { name: 'jQuery', pattern: /jquery[^/]*\/([0-9.]+)/i, minVersion: '3.0.0' },
      { name: 'Bootstrap', pattern: /bootstrap[^/]*\/([0-9.]+)/i, minVersion: '4.0.0' },
      { name: 'Angular', pattern: /angular[^/]*\/([0-9.]+)/i, minVersion: '12.0.0' },
      { name: 'React', pattern: /react[^/]*\/([0-9.]+)/i, minVersion: '16.0.0' }
    ];

    libraryPatterns.forEach(({ name, pattern, minVersion }) => {
      const match = this.html.match(pattern);
      if (match) {
        const version = match[1];
        // Simple version comparison (in production, use a proper semver library)
        if (this.isVersionOutdated(version, minVersion)) {
          findings.push({
            id: `outdated-${name.toLowerCase()}`,
            type: 'library',
            severity: 'medium',
            title: `Outdated ${name} Library`,
            description: `${name} version ${version} may have security vulnerabilities`,
            recommendation: `Update ${name} to version ${minVersion} or later`,
            details: { library: name, currentVersion: version, minVersion }
          });
        }
      }
    });

    return findings;
  }

  private isVersionOutdated(current: string, minimum: string): boolean {
    // Simple version comparison - in production, use semver
    const currentParts = current.split('.').map(Number);
    const minParts = minimum.split('.').map(Number);
    
    for (let i = 0; i < Math.max(currentParts.length, minParts.length); i++) {
      const currentPart = currentParts[i] || 0;
      const minPart = minParts[i] || 0;
      
      if (currentPart < minPart) return true;
      if (currentPart > minPart) return false;
    }
    
    return false;
  }

  async runAllChecks(): Promise<SecurityFinding[]> {
    const allFindings: SecurityFinding[] = [];
    
    allFindings.push(...this.checkSSL());
    allFindings.push(...await this.checkSecurityHeaders());
    allFindings.push(...this.checkMixedContent());
    allFindings.push(...this.checkCookies());
    allFindings.push(...this.checkExposedFiles());
    allFindings.push(...this.checkXSSVulnerabilities());
    allFindings.push(...this.checkCORS());
    allFindings.push(...this.checkOutdatedLibraries());

    return allFindings;
  }
}
