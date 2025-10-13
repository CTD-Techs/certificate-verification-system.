import React from 'react';
import { Verification } from '../../types';
import { Card, Badge } from '../common';
import { getVerificationStatusLabel, getVerificationStatusColor, getVerificationResultLabel, getVerificationResultColor } from '../../utils/constants';
import { formatDate } from '../../utils/format';

interface VerificationCardProps {
  verification: Verification;
  onClick?: () => void;
}

export const VerificationCard: React.FC<VerificationCardProps> = ({
  verification,
  onClick,
}) => {
  const getStatusBadgeVariant = (color: string) => {
    const variantMap: Record<string, 'success' | 'error' | 'warning' | 'info'> = {
      green: 'success',
      red: 'error',
      yellow: 'warning',
      blue: 'info',
      orange: 'warning',
      gray: 'info',
    };
    return variantMap[color] || 'info';
  };

  return (
    <Card
      className={`${onClick ? 'cursor-pointer hover:shadow-lg transition-shadow' : ''}`}
      onClick={onClick}
    >
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Verification #{verification.id.substring(0, 8)}
            </h3>
            <p className="text-sm text-gray-500">
              Certificate: {verification.certificateId.substring(0, 8)}...
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge variant={getStatusBadgeVariant(getVerificationStatusColor(verification.status))}>
              {getVerificationStatusLabel(verification.status)}
            </Badge>
            {verification.result && (
              <Badge variant={getStatusBadgeVariant(getVerificationResultColor(verification.result))}>
                {getVerificationResultLabel(verification.result)}
              </Badge>
            )}
          </div>
        </div>

        {/* Confidence Score */}
        {verification.confidenceScore !== null && verification.confidenceScore !== undefined && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Confidence Score</span>
              <span className="text-sm font-bold text-gray-900">
                {(verification.confidenceScore * 100).toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  verification.confidenceScore >= 0.8
                    ? 'bg-green-600'
                    : verification.confidenceScore >= 0.6
                    ? 'bg-yellow-600'
                    : 'bg-red-600'
                }`}
                style={{ width: `${verification.confidenceScore * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Verification Steps Summary */}
        {verification.steps && verification.steps.length > 0 && (
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Verification Steps</p>
            <div className="flex flex-wrap gap-2">
              {verification.steps.map((step, index) => (
                <span
                  key={index}
                  className={`text-xs px-2 py-1 rounded-full ${
                    step.status === 'COMPLETED'
                      ? 'bg-green-100 text-green-800'
                      : step.status === 'FAILED'
                      ? 'bg-red-100 text-red-800'
                      : step.status === 'IN_PROGRESS'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {step.stepType}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Timestamps */}
        <div className="flex items-center justify-between text-xs text-gray-500 border-t border-gray-200 pt-3">
          <span>Started: {formatDate(verification.createdAt)}</span>
          {verification.completedAt && (
            <span>Completed: {formatDate(verification.completedAt)}</span>
          )}
        </div>
      </div>
    </Card>
  );
};