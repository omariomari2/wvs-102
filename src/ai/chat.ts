import { Ai } from '@cloudflare/ai';
import { ScanResult, ChatMessage } from '../types';
import { CHAT_PROMPT_TEMPLATE, SCAN_ANALYSIS_PROMPT } from './prompts';

export class AIChatService {
  private ai: Ai;

  constructor(binding: any) {
    this.ai = new Ai(binding);
  }

  async generateResponse(
    userMessage: string,
    scanResults: ScanResult | null,
    chatHistory: ChatMessage[]
  ): Promise<string> {
    try {
      const prompt = CHAT_PROMPT_TEMPLATE(scanResults, userMessage, chatHistory);
      
      const response = await this.ai.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.7
      });

      return response.response || 'I apologize, but I was unable to generate a response. Please try again.';
    } catch (error) {
      console.error('AI response generation failed:', error);
      
      // Fallback response based on scan results
      if (scanResults) {
        return this.generateFallbackResponse(userMessage, scanResults);
      }
      
      return 'I apologize, but I\'m experiencing technical difficulties. Please try again later or run a new scan.';
    }
  }

  async analyzeScanResults(scanResults: ScanResult): Promise<string> {
    try {
      const prompt = SCAN_ANALYSIS_PROMPT(scanResults);
      
      const response = await this.ai.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1500,
        temperature: 0.5
      });

      return response.response || this.generateFallbackAnalysis(scanResults);
    } catch (error) {
      console.error('AI scan analysis failed:', error);
      return this.generateFallbackAnalysis(scanResults);
    }
  }

  private generateFallbackResponse(userMessage: string, scanResults: ScanResult): string {
    const { summary } = scanResults;
    
    if (userMessage.toLowerCase().includes('summary') || userMessage.toLowerCase().includes('overview')) {
      return `Based on the scan of ${scanResults.url}, I found ${summary.total} security issues:
- ${summary.critical} critical issues requiring immediate attention
- ${summary.high} high-priority issues
- ${summary.medium} medium-priority issues  
- ${summary.low} low-priority issues

The most critical issues should be addressed first. Would you like me to explain any specific findings in more detail?`;
    }

    if (userMessage.toLowerCase().includes('critical') || userMessage.toLowerCase().includes('urgent')) {
      const criticalFindings = scanResults.findings.filter(f => f.severity === 'critical');
      if (criticalFindings.length > 0) {
        return `I found ${criticalFindings.length} critical security issues:
${criticalFindings.map(f => `- ${f.title}: ${f.description}`).join('\n')}

These require immediate attention as they pose the highest risk to your website's security.`;
      }
      return 'No critical issues were found in the scan, which is good news!';
    }

    return `I understand you're asking about: "${userMessage}". 

Based on the scan results for ${scanResults.url}, I found ${summary.total} security issues. The most important ones to address are the ${summary.critical} critical and ${summary.high} high-priority issues.

Would you like me to explain any specific findings or provide recommendations for improving your website's security?`;
  }

  private generateFallbackAnalysis(scanResults: ScanResult): string {
    const { summary, findings } = scanResults;
    
    let analysis = `# Security Analysis for ${scanResults.url}\n\n`;
    
    analysis += `## Executive Summary\n`;
    analysis += `The security scan identified ${summary.total} issues across different severity levels. `;
    
    if (summary.critical > 0) {
      analysis += `There are ${summary.critical} critical issues that require immediate attention. `;
    }
    
    if (summary.high > 0) {
      analysis += `Additionally, ${summary.high} high-priority issues should be addressed soon. `;
    }
    
    analysis += `\n\n## Risk Assessment\n`;
    analysis += `- Critical Issues: ${summary.critical}\n`;
    analysis += `- High Priority: ${summary.high}\n`;
    analysis += `- Medium Priority: ${summary.medium}\n`;
    analysis += `- Low Priority: ${summary.low}\n\n`;
    
    analysis += `## Key Findings\n`;
    const criticalFindings = findings.filter(f => f.severity === 'critical');
    const highFindings = findings.filter(f => f.severity === 'high');
    
    if (criticalFindings.length > 0) {
      analysis += `### Critical Issues:\n`;
      criticalFindings.forEach(finding => {
        analysis += `- **${finding.title}**: ${finding.description}\n`;
        analysis += `  Recommendation: ${finding.recommendation}\n\n`;
      });
    }
    
    if (highFindings.length > 0) {
      analysis += `### High Priority Issues:\n`;
      highFindings.forEach(finding => {
        analysis += `- **${finding.title}**: ${finding.description}\n`;
        analysis += `  Recommendation: ${finding.recommendation}\n\n`;
      });
    }
    
    analysis += `## Next Steps\n`;
    analysis += `1. Address all critical issues immediately\n`;
    analysis += `2. Plan remediation for high-priority issues\n`;
    analysis += `3. Schedule fixes for medium and low-priority issues\n`;
    analysis += `4. Implement regular security scanning\n`;
    analysis += `5. Consider implementing a Web Application Firewall (WAF)\n`;
    
    return analysis;
  }
}
