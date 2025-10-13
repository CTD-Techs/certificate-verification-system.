import React from 'react';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { MatchResult } from '../../types/certificate.types';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';

interface PANAadhaarMatcherProps {
  matchResult: MatchResult;
}

export const PANAadhaarMatcher: React.FC<PANAadhaarMatcherProps> = ({ matchResult }) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'matched':
        return <CheckCircle className="w-6 h-6 text-green-600" />;
      case 'partial':
        return <AlertCircle className="w-6 h-6 text-yellow-600" />;
      case 'not_matched':
        return <XCircle className="w-6 h-6 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'matched':
        return <Badge variant="success">Matched</Badge>;
      case 'partial':
        return <Badge variant="warning">Partial Match</Badge>;
      case 'not_matched':
        return <Badge variant="danger">Not Matched</Badge>;
      default:
        return null;
    }
  };

  const getFieldIcon = (matched: boolean) => {
    return matched ? (
      <CheckCircle className="w-5 h-5 text-green-600" />
    ) : (
      <XCircle className="w-5 h-5 text-red-600" />
    );
  };

  return (
    <div className="space-y-6">
      {/* Overall Match Status */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            {getStatusIcon(matchResult.matchStatus)}
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                PAN-Aadhaar Match Result
              </h3>
              <p className="text-sm text-gray-600">
                Overall Confidence: {Math.round(matchResult.matchConfidence * 100)}%
              </p>
            </div>
          </div>
          {getStatusBadge(matchResult.matchStatus)}
        </div>

        {/* Confidence Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Match Confidence</span>
            <span>{Math.round(matchResult.matchConfidence * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all ${
                matchResult.matchConfidence >= 0.85
                  ? 'bg-green-600'
                  : matchResult.matchConfidence >= 0.6
                  ? 'bg-yellow-600'
                  : 'bg-red-600'
              }`}
              style={{ width: `${matchResult.matchConfidence * 100}%` }}
            />
          </div>
        </div>

        {/* Summary */}
        <div className="bg-gray-50 rounded-lg p-4">
          <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono">
            {matchResult.summary}
          </pre>
        </div>
      </Card>

      {/* Field-by-Field Comparison */}
      <Card>
        <h4 className="text-lg font-semibold text-gray-900 mb-4">
          Field-by-Field Comparison
        </h4>
        <div className="space-y-4">
          {matchResult.fieldMatches.map((field, index) => (
            <div
              key={index}
              className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2">
                  {getFieldIcon(field.matched)}
                  <span className="font-medium text-gray-900 capitalize">
                    {field.field.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                </div>
                <Badge variant={field.matched ? 'success' : 'danger'}>
                  {Math.round(field.score * 100)}% Match
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <p className="text-xs text-gray-500 mb-1">PAN Card</p>
                  <p className="text-sm text-gray-900 font-mono bg-blue-50 p-2 rounded">
                    {field.value1 || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Aadhaar Card</p>
                  <p className="text-sm text-gray-900 font-mono bg-green-50 p-2 rounded">
                    {field.value2 || 'N/A'}
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-600">{field.reason}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};