import React from 'react';
import { Card } from '../common';

interface Evidence {
  source: string;
  data: any;
  timestamp: string;
}

interface VerificationEvidenceProps {
  evidence: Evidence[];
}

export const VerificationEvidence: React.FC<VerificationEvidenceProps> = ({ evidence }) => {
  const renderEvidenceData = (data: any) => {
    if (typeof data === 'string') {
      return <p className="text-sm text-gray-700">{data}</p>;
    }

    if (typeof data === 'object' && data !== null) {
      return (
        <div className="space-y-2">
          {Object.entries(data).map(([key, value]) => (
            <div key={key} className="flex justify-between text-sm">
              <span className="font-medium text-gray-700">{key}:</span>
              <span className="text-gray-900">
                {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
              </span>
            </div>
          ))}
        </div>
      );
    }

    return <p className="text-sm text-gray-700">{String(data)}</p>;
  };

  if (!evidence || evidence.length === 0) {
    return (
      <Card>
        <p className="text-center text-gray-500 py-8">No evidence available</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {evidence.map((item, index) => (
        <Card key={index}>
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-gray-200 pb-2">
              <h4 className="text-sm font-semibold text-gray-900">{item.source}</h4>
              <span className="text-xs text-gray-500">
                {new Date(item.timestamp).toLocaleString()}
              </span>
            </div>
            <div>{renderEvidenceData(item.data)}</div>
          </div>
        </Card>
      ))}
    </div>
  );
};