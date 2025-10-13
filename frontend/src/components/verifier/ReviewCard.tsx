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
    <div onClick={onClick} className={onClick ? 'cursor-pointer' : ''}>
      <Card>
        <div className="space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Review #{review.id.substring(0, 8)}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
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
          <div className="bg-gray-50 dark:bg-gray-800 rounded-md p-3">
            <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Reason:</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">{review.reason}</p>
          </div>
        )}

        {/* Comments */}
        {review.comments && (
          <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
            <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Reviewer Comments:</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">{review.comments}</p>
          </div>
        )}

        {/* Assignment & Status */}
        <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 pt-3">
          <div>
            {review.assignedTo ? (
              <span>Assigned to: <span className="font-medium text-gray-900 dark:text-white">User #{review.assignedTo}</span></span>
            ) : (
              <span className="text-yellow-600 dark:text-yellow-500 font-medium">Unassigned</span>
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
    </div>
  );
};