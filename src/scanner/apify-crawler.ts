import { ApifyClient } from 'apify-client';
import { SecurityFinding } from '../types';

interface CrawlOptions {
  maxPages?: number;
  maxDepth?: number;
  useProxy?: boolean;
  apifyToken?: string;
}

export class ApifyCrawler {
  private client: ApifyClient;
  private options: Required<CrawlOptions>;

  constructor(options: CrawlOptions = {}) {
    this.options = {
      maxPages: options.maxPages || 10,
      maxDepth: options.maxDepth || 2,
      useProxy: options.useProxy || false,
      apifyToken: options.apifyToken || process.env.APIFY_TOKEN || ''
    };

    if (!this.options.apifyToken) {
      console.warn('Apify token not provided. Some features may be limited.');
    }

    this.client = new ApifyClient({
      token: this.options.apifyToken,
    });
  }

  async crawl(url: string, onPageCrawled: (url: string, html: string) => Promise<SecurityFinding[]>) {
    const findings: SecurityFinding[] = [];
    const processedUrls = new Set<string>();
    const queue: { url: string; depth: number }[] = [{ url, depth: 0 }];
    let processedCount = 0;

    while (queue.length > 0 && processedCount < this.options.maxPages) {
      const { url: currentUrl, depth } = queue.shift()!;
      
      if (processedUrls.has(currentUrl)) continue;
      
      try {
        console.log(`Processing ${currentUrl} (depth: ${depth})`);
        
        // Fetch the page using Cloudflare's fetch
        const response = await fetch(currentUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; SecurityScanner/1.0; +https://yoursite.com/bot)'
          }
        });
        
        if (!response.ok) {
          console.error(`Failed to fetch ${currentUrl}: ${response.status} ${response.statusText}`);
          continue;
        }
        
        const html = await response.text();
        
        // Process the page with the security scanner
        const pageFindings = await onPageCrawled(currentUrl, html);
        findings.push(...pageFindings);
        
        // Mark URL as processed
        processedUrls.add(currentUrl);
        processedCount++;
        
        // If we haven't reached max depth, find and queue links
        if (depth < this.options.maxDepth) {
          const links = this.extractLinks(html, currentUrl);
          for (const link of links) {
            if (!processedUrls.has(link)) {
              queue.push({ url: link, depth: depth + 1 });
            }
          }
        }
      } catch (error) {
        console.error(`Error processing ${currentUrl}:`, error);
      }
    }
    
    return findings;
  }

  private extractLinks(html: string, baseUrl: string): string[] {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const links: string[] = [];
    const base = new URL(baseUrl);
    
    // Get all anchor tags
    const anchors = doc.getElementsByTagName('a');
    
    for (const anchor of Array.from(anchors)) {
      try {
        const href = anchor.getAttribute('href');
        if (!href) continue;
        
        // Resolve relative URLs
        const url = new URL(href, baseUrl);
        
        // Only follow links to the same domain
        if (url.hostname === base.hostname) {
          links.push(url.toString());
        }
      } catch (error) {
        console.warn(`Invalid URL: ${anchor.getAttribute('href')}`, error);
      }
    }
    
    return links;
  }
}
