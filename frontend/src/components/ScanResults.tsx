import React from 'react';
import { ScanResult } from '../types';

interface ScanResultsProps {
  scanResult: ScanResult;
}

const ScanResults: React.FC<ScanResultsProps> = ({ scanResult }) => {
  const { summary, findings } = scanResult;

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'critical';
      case 'high': return 'high';
      case 'medium': return 'medium';
      case 'low': return 'low';
      default: return 'low';
    }
  };

  return (
    <div className="scan-results">
      <h2 style={{ marginBottom: '16px' }}>
        Scan Results for {scanResult.url}
      </h2>
      
      <div className="scan-status completed">
        Scan completed successfully
      </div>

      <div className="summary">
        <div className="summary-item">
          <span className="summary-number">{summary.critical}</span>
          <span>Critical</span>
        </div>
        <div className="summary-item">
          <span className="summary-number">{summary.high}</span>
          <span>High</span>
        </div>
        <div className="summary-item">
          <span className="summary-number">{summary.medium}</span>
          <span>Medium</span>
        </div>
        <div className="summary-item">
          <span className="summary-number">{summary.low}</span>
          <span>Low</span>
        </div>
        <div className="summary-item">
          <span className="summary-number">{summary.total}</span>
          <span>Total</span>
        </div>
      </div>

      {findings.length > 0 ? (
        <div>
          <h3 style={{ marginBottom: '16px' }}>Security Findings</h3>
          <div className="findings-list">
            {findings.map((finding) => (
              <div key={finding.id} className="finding">
                <div className="finding-header">
                  <div className="finding-title">{finding.title}</div>
                  <div className={`severity ${getSeverityColor(finding.severity)}`}>
                    {finding.severity}
                  </div>
                </div>
                <div className="finding-description">{finding.description}</div>
                <div className="finding-recommendation">
                  <strong>Recommendation:</strong> {finding.recommendation}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <h3>No Security Issues Found!</h3>
          <p>Great job! Your website appears to be secure.</p>
        </div>
      )}
    </div>
  );
};

export default ScanResults;
