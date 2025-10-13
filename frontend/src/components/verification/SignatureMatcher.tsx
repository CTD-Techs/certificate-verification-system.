import React from 'react';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { SignatureMatchResult } from '../../types/certificate.types';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';

interface SignatureMatcherProps {
  matchResult: SignatureMatchResult;
  document1Url?: string;
  document2Url?: string;
}

export const SignatureMatcher: React.FC<SignatureMatcherProps> = ({
  matchResult,
  document1Url,
  document2Url,
}) => {
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

  const getMetricColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getMetricBgColor = (score: number) => {
    if (score >= 0.8) return 'bg-green-600';
    if (score >= 0.6) return 'bg-yellow-600';
    return 'bg-red-600';
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
                Signature Match Result
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
              className={`h-3 rounded-full transition-all ${getMetricBgColor(
                matchResult.matchConfidence
              )}`}
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

      {/* Signature Comparison Metrics */}
      <Card>
        <h4 className="text-lg font-semibold text-gray-900 mb-4">
          Comparison Metrics
        </h4>
        <div className="space-y-4">
          {/* Perceptual Hash */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-gray-900">Perceptual Hash Similarity</span>
              <span className={`font-semibold ${getMetricColor(matchResult.metrics.perceptualHash)}`}>
                {Math.round(matchResult.metrics.perceptualHash * 100)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${getMetricBgColor(
                  matchResult.metrics.perceptualHash
                )}`}
                style={{ width: `${matchResult.metrics.perceptualHash * 100}%` }}
              />
            </div>
            <p className="text-xs text-gray-600 mt-2">
              Measures visual similarity using perceptual hashing algorithm
            </p>
          </div>

          {/* Structural Similarity */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-gray-900">Structural Similarity (SSIM)</span>
              <span className={`font-semibold ${getMetricColor(matchResult.metrics.structural)}`}>
                {Math.round(matchResult.metrics.structural * 100)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${getMetricBgColor(
                  matchResult.metrics.structural
                )}`}
                style={{ width: `${matchResult.metrics.structural * 100}%` }}
              />
            </div>
            <p className="text-xs text-gray-600 mt-2">
              Compares structural patterns and features in the signatures
            </p>
          </div>

          {/* Histogram Similarity */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-gray-900">Histogram Similarity</span>
              <span className={`font-semibold ${getMetricColor(matchResult.metrics.histogram)}`}>
                {Math.round(matchResult.metrics.histogram * 100)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${getMetricBgColor(
                  matchResult.metrics.histogram
                )}`}
                style={{ width: `${matchResult.metrics.histogram * 100}%` }}
              />
            </div>
            <p className="text-xs text-gray-600 mt-2">
              Analyzes pixel intensity distribution patterns
            </p>
          </div>
        </div>
      </Card>

      {/* Document Previews (if URLs provided) */}
      {(document1Url || document2Url) && (
        <Card>
          <h4 className="text-lg font-semibold text-gray-900 mb-4">
            Document Previews
          </h4>
          <div className="grid grid-cols-2 gap-4">
            {document1Url && (
              <div>
                <p className="text-sm text-gray-600 mb-2">Document 1</p>
                <div className="border border-gray-300 rounded-lg overflow-hidden">
                  <img
                    src={document1Url}
                    alt="Document 1"
                    className="w-full h-auto"
                  />
                </div>
              </div>
            )}
            {document2Url && (
              <div>
                <p className="text-sm text-gray-600 mb-2">Document 2</p>
                <div className="border border-gray-300 rounded-lg overflow-hidden">
                  <img
                    src={document2Url}
                    alt="Document 2"
                    className="w-full h-auto"
                  />
                </div>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};