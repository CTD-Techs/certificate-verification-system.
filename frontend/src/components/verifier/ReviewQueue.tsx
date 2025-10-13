import React from 'react';
import { ManualReview } from '../../types';
import { Card, Badge, Button } from '../common';
import { getReviewPriorityLabel, getReviewPriorityColor } from '../../utils/constants';
import { formatDate } from '../../utils/format';

interface ReviewQueueProps {
  reviews: ManualReview[];
  onReviewClick: (review: ManualReview) => void;
  onAssignToMe?: (reviewId: string) => void;
  currentUserId?: string;
}

export const ReviewQueue: React.FC<ReviewQueueProps> = ({
  reviews,
  onReviewClick,
  onAssignToMe,
  currentUserId,
}) => {
  const getPriorityBadgeVariant = (color: string): 'success' | 'warning' | 'info' | 'gray' | 'danger' => {
    const variantMap: Record<string, 'success' | 'warning' | 'info' | 'gray' | 'danger'> = {
      red: 'danger',
      orange: 'warning',
      blue: 'info',
      gray: 'gray',
    };
    return variantMap[color] || 'info';
  };

  if (reviews.length === 0) {
    return (
      <Card>
        <div className="text-center py-12">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No pending reviews</h3>
          <p className="mt-1 text-sm text-gray-500">
            All reviews have been completed or assigned.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <Card key={review?.id || Math.random()} className="hover:shadow-lg transition-shadow">
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Review #{review?.id?.substring(0, 8) || 'N/A'}
                </h3>
                <p className="text-sm text-gray-500">
                  Verification: {review?.verificationId?.substring(0, 8) || 'N/A'}...
                </p>
              </div>
              {review?.priority && (
                <Badge variant={getPriorityBadgeVariant(getReviewPriorityColor(review.priority))}>
                  {getReviewPriorityLabel(review.priority)}
                </Badge>
              )}
            </div>

            {/* Assignment Info */}
            <div className="flex items-center justify-between text-sm text-gray-600">
              <div>
                {review?.assignedTo ? (
                  <span>
                    Assigned to: <span className="font-medium">User #{review.assignedTo}</span>
                  </span>
                ) : (
                  <span className="text-yellow-600 font-medium">Unassigned</span>
                )}
              </div>
              {review?.createdAt && <span>Created: {formatDate(review.createdAt)}</span>}
            </div>

            {/* Actions */}
            <div className="flex gap-3 border-t border-gray-200 pt-4">
              <Button
                variant="primary"
                size="sm"
                onClick={() => onReviewClick(review)}
                className="flex-1"
              >
                Review
              </Button>
              {!review?.assignedTo && onAssignToMe && review?.id && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onAssignToMe(review.id)}
                >
                  Assign to Me
                </Button>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};