import React from 'react';
import { ManualReview } from '../../types';
import { Card, Badge } from '../common';
import { getReviewPriorityLabel, getReviewPriorityColor, getReviewDecisionLabel, getReviewDecisionColor } from '../../utils/constants';
import { formatDate } from '../../utils/format';

interface ReviewCardProps {
  review: ManualReview;
  onClick?: () => void;
}

export const ReviewCard: React.FC<ReviewCardProps> = ({ review, onClick }) => {
  const getPriorityBadgeVariant = (color: string) => {
    const variantMap: Record<string, 'success' | 'error' | 'warning' | 'info'> = {
      red: 'error',
      orange: 'warning',
      blue: 'info',
      gray: 'info',
    };
    return variantMap[color] || 'info';
  };

  const getDecisionBadgeVariant = (color: string) => {
    const variantMap: Record<string, 'success' | 'error' | 'warning' | 'info'> = {
      green: 'success',
      red: 'error',
      yellow: 'warning',
    };
    return variantMap[color] || 'info';
  };

  return (
    <Card
      className={`${onClick ? 'cursor-pointer hover:shadow-lg transition-shadow' : ''}`}
      onClick={onClick}
    >
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Review #{review.id.substring(0, 8)}
            </h3>
            <p className="text-sm text-gray-500">
              Verification: {review.verificationId.substring(0, 8)}...
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge variant={getPriorityBadgeVariant(getReviewPriorityColor(review.priority))}>
              {getReviewPriorityLabel(review.priority)}
            </Badge>
            {review.decision && (
              <Badge variant={getDecisionBadgeVariant(getReviewDecisionColor(review.decision))}>
                {getReviewDecisionLabel(review.decision)}
              </Badge>
            )}
          </div>
        </div>

        {/* Reason */}
        {review.reason && (
          <div className="bg-gray-50 rounded-md p-3">
            <p className="text-xs font-medium text-gray-700 mb-1">Reason:</p>
            <p className="text-sm text-gray-600">{review.reason}</p>
          </div>
        )}

        {/* Comments */}
        {review.comments && (
          <div className="border-t border-gray-200 pt-3">
            <p className="text-xs font-medium text-gray-700 mb-1">Reviewer Comments:</p>
            <p className="text-sm text-gray-600">{review.comments}</p>
          </div>
        )}

        {/* Assignment & Status */}
        <div className="flex items-center justify-between text-xs text-gray-500 border-t border-gray-200 pt-3">
          <div>
            {review.assignedTo ? (
              <span>Assigned to: User #{review.assignedTo}</span>
            ) : (
              <span className="text-yellow-600 font-medium">Unassigned</span>
            )}
          </div>
          <div className="text-right">
            <p>Created: {formatDate(review.createdAt)}</p>
            {review.reviewedAt && (
              <p>Reviewed: {formatDate(review.reviewedAt)}</p>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};