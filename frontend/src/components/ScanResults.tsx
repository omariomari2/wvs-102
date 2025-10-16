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
      <h2 style={{ marginBottom: '16px', color: '#333' }}>
        Scan Results for {scanResult.url}
      </h2>
      
      <div className="scan-status completed">
        ✅ Scan completed successfully
      </div>

      <div className="results-summary">
        <div className={`summary-item ${getSeverityColor('critical')}`}>
          <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{summary.critical}</div>
          <div>Critical</div>
        </div>
        <div className={`summary-item ${getSeverityColor('high')}`}>
          <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{summary.high}</div>
          <div>High</div>
        </div>
        <div className={`summary-item ${getSeverityColor('medium')}`}>
          <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{summary.medium}</div>
          <div>Medium</div>
        </div>
        <div className={`summary-item ${getSeverityColor('low')}`}>
          <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{summary.low}</div>
          <div>Low</div>
        </div>
        <div className="summary-item" style={{ background: '#f8f9fa', color: '#495057' }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{summary.total}</div>
          <div>Total</div>
        </div>
      </div>

      {findings.length > 0 ? (
        <div>
          <h3 style={{ marginBottom: '16px', color: '#333' }}>Security Findings</h3>
          <div className="findings-list">
            {findings.map((finding) => (
              <div key={finding.id} className="finding-item">
                <div className="finding-header">
                  <div className="finding-title">{finding.title}</div>
                  <div className={`severity-badge ${getSeverityColor(finding.severity)}`}>
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
        <div style={{ textAlign: 'center', padding: '40px', color: '#28a745' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎉</div>
          <h3>No Security Issues Found!</h3>
          <p>Great job! Your website appears to be secure.</p>
        </div>
      )}
    </div>
  );
};

export default ScanResults;
