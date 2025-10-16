import React, { useState } from 'react';

interface ScanFormProps {
  onScan: (url: string) => void;
  isScanning: boolean;
}

const ScanForm: React.FC<ScanFormProps> = ({ onScan, isScanning }) => {
  const [url, setUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim() && !isScanning) {
      onScan(url.trim());
    }
  };

  return (
    <div>
      <h2 style={{ marginBottom: '16px' }}>Start Security Scan</h2>
      <form className="scan-form" onSubmit={handleSubmit}>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Enter website URL (e.g., https://example.com)"
          disabled={isScanning}
          required
        />
        <button
          type="submit"
          disabled={isScanning || !url.trim()}
        >
          {isScanning ? (
            <>
              <div className="loading" style={{ marginRight: '8px' }}></div>
              Scanning...
            </>
          ) : (
            'Start Scan'
          )}
        </button>
      </form>
    </div>
  );
};

export default ScanForm;
