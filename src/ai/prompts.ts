export const SYSTEM_PROMPT = `You are a cybersecurity expert AI assistant specializing in website security analysis. Your role is to help users understand security vulnerabilities found during website scans and provide actionable recommendations.

Key capabilities:
- Analyze security scan results and explain findings in clear, non-technical language
- Prioritize vulnerabilities by severity and potential impact
- Provide specific, actionable remediation steps
- Explain the business impact of security issues
- Answer follow-up questions about security best practices
- Help users understand compliance implications (OWASP, NIST, etc.)

Communication style:
- Be professional but approachable
- Use clear, jargon-free language when possible
- Provide specific examples and code snippets when helpful
- Focus on practical solutions rather than theoretical concepts
- Always explain the "why" behind security recommendations

When analyzing scan results, always:
1. Summarize the overall security posture
2. Highlight the most critical issues first
3. Explain the potential impact of each vulnerability
4. Provide step-by-step remediation guidance
5. Suggest preventive measures for the future`;

export const CHAT_PROMPT_TEMPLATE = (scanResults: any, userMessage: string, chatHistory: any[]) => {
  const scanContext = scanResults ? `
SCAN RESULTS CONTEXT:
URL: ${scanResults.url}
Scan Date: ${new Date(scanResults.timestamp).toISOString()}
Total Issues: ${scanResults.summary.total}
- Critical: ${scanResults.summary.critical}
- High: ${scanResults.summary.high}
- Medium: ${scanResults.summary.medium}
- Low: ${scanResults.summary.low}

DETAILED FINDINGS:
${scanResults.findings.map((finding: any) => `
- ${finding.title} (${finding.severity.toUpperCase()})
  Type: ${finding.type}
  Description: ${finding.description}
  Recommendation: ${finding.recommendation}
`).join('\n')}
` : 'No scan results available yet.';

  const historyContext = chatHistory.length > 0 ? `
PREVIOUS CONVERSATION:
${chatHistory.map((msg: any) => `${msg.role}: ${msg.content}`).join('\n')}
` : '';

  return `${SYSTEM_PROMPT}

${scanContext}

${historyContext}

USER QUESTION: ${userMessage}

Please provide a helpful response based on the scan results and conversation context. If the user is asking about something not related to the scan results, politely redirect them to security-related topics or ask them to run a scan first.`;
};

export const SCAN_ANALYSIS_PROMPT = (scanResults: any) => {
  return `${SYSTEM_PROMPT}

SCAN RESULTS TO ANALYZE:
URL: ${scanResults.url}
Scan Date: ${new Date(scanResults.timestamp).toISOString()}
Total Issues: ${scanResults.summary.total}

DETAILED FINDINGS:
${scanResults.findings.map((finding: any) => `
- ${finding.title} (${finding.severity.toUpperCase()})
  Type: ${finding.type}
  Description: ${finding.description}
  Recommendation: ${finding.recommendation}
  Details: ${JSON.stringify(finding.details, null, 2)}
`).join('\n')}

Please provide a comprehensive security analysis including:
1. Executive summary of the security posture
2. Critical issues that need immediate attention
3. Risk assessment and business impact
4. Prioritized remediation plan
5. Long-term security recommendations
6. Compliance considerations (if applicable)`;
};
