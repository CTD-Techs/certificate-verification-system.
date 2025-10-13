import React from 'react';
import { ManualReview, Certificate } from '../../types';
import { Card, Badge, Button, Table } from '../common';
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

  const maskAadhaar = (aadhaar: string): string => {
    if (!aadhaar || aadhaar.length < 12) return aadhaar;
    return `XXXX-XXXX-${aadhaar.slice(-4)}`;
  };

  const maskPAN = (pan: string): string => {
    if (!pan || pan.length < 10) return pan;
    return `${pan.slice(0, 3)}XXXXXX${pan.slice(-1)}`;
  };

  const getDocumentInfo = (review: ManualReview) => {
    const cert = review.certificate;
    if (!cert) {
      return {
        type: 'Unknown Document',
        identifier: 'N/A',
        name: 'N/A',
        badge: 'gray' as const,
        details: null,
      };
    }

    const certData = cert.certificateData || {};
    
    switch (cert.certificateType) {
      case 'AADHAAR_CARD':
        return {
          type: 'Aadhaar Card',
          identifier: certData.aadhaarNumber
            ? maskAadhaar(certData.aadhaarNumber)
            : 'N/A',
          name: certData.holderName || certData.name || 'N/A',
          badge: 'info' as const,
          details: certData.dateOfBirth
            ? `DOB: ${new Date(certData.dateOfBirth).toLocaleDateString()}`
            : null,
        };
      case 'PAN_CARD':
        return {
          type: 'PAN Card',
          identifier: certData.panNumber
            ? maskPAN(certData.panNumber)
            : 'N/A',
          name: certData.holderName || certData.name || 'N/A',
          badge: 'success' as const,
          details: certData.fatherName
            ? `Father: ${certData.fatherName}`
            : null,
        };
      case 'SCHOOL_CERTIFICATE':
        return {
          type: 'School Certificate',
          identifier: cert.certificateNumber || 'N/A',
          name: certData.studentName || certData.name || 'N/A',
          badge: 'warning' as const,
          details: certData.school?.name || certData.issuerName || null,
        };
      case 'DEGREE':
        return {
          type: 'Degree Certificate',
          identifier: cert.certificateNumber || 'N/A',
          name: certData.studentName || certData.name || 'N/A',
          badge: 'info' as const,
          details: certData.issuerName || null,
        };
      case 'DIPLOMA':
        return {
          type: 'Diploma Certificate',
          identifier: cert.certificateNumber || 'N/A',
          name: certData.studentName || certData.name || 'N/A',
          badge: 'info' as const,
          details: certData.issuerName || null,
        };
      case 'MARKSHEET':
        return {
          type: 'Marksheet',
          identifier: cert.certificateNumber || 'N/A',
          name: certData.studentName || certData.name || 'N/A',
          badge: 'warning' as const,
          details: certData.examYear
            ? `Year: ${certData.examYear}`
            : null,
        };
      default:
        return {
          type: cert.certificateType || 'Document',
          identifier: cert.certificateNumber || 'N/A',
          name: certData.studentName || certData.holderName || certData.name || 'N/A',
          badge: 'gray' as const,
          details: cert.issuerName || null,
        };
    }
  };

  if (reviews.length === 0) {
    return (
      <Card>
        <div className="text-center py-12">
          <svg
            className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500"
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
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No pending reviews</h3>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            All reviews have been completed or assigned.
          </p>
        </div>
      </Card>
    );
  }

  const getStatusLabel = (review: ManualReview): string => {
    if (review.decision) {
      return 'Completed';
    }
    if (review.assignedTo) {
      return 'In Progress';
    }
    return 'Unassigned';
  };

  const getStatusBadgeVariant = (review: ManualReview): 'success' | 'warning' | 'info' | 'gray' => {
    if (review.decision) {
      return 'success';
    }
    if (review.assignedTo) {
      return 'warning';
    }
    return 'gray';
  };

  const columns = [
    {
      key: 'documentName',
      header: 'Document Name',
      render: (review: ManualReview) => {
        const docInfo = getDocumentInfo(review);
        return (
          <div className="flex flex-col">
            <span className="font-medium text-gray-900 dark:text-white">
              {docInfo.name}
            </span>
            <span className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              {docInfo.identifier}
            </span>
          </div>
        );
      },
    },
    {
      key: 'type',
      header: 'Type',
      render: (review: ManualReview) => {
        const docInfo = getDocumentInfo(review);
        return (
          <Badge variant={docInfo.badge}>
            {docInfo.type}
          </Badge>
        );
      },
    },
    {
      key: 'priority',
      header: 'Priority',
      render: (review: ManualReview) => {
        if (!review.priority) {
          return <span className="text-gray-500 dark:text-gray-400">N/A</span>;
        }
        return (
          <Badge variant={getPriorityBadgeVariant(getReviewPriorityColor(review.priority))}>
            {getReviewPriorityLabel(review.priority)}
          </Badge>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (review: ManualReview) => (
        <Badge variant={getStatusBadgeVariant(review)}>
          {getStatusLabel(review)}
        </Badge>
      ),
    },
    {
      key: 'createdAt',
      header: 'Created',
      render: (review: ManualReview) => (
        <span className="text-gray-900 dark:text-gray-100">
          {review.createdAt ? formatDate(review.createdAt) : 'N/A'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (review: ManualReview) => (
        <div className="flex gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onReviewClick(review);
            }}
          >
            Review
          </Button>
          {!review?.assignedTo && onAssignToMe && review?.id && (
            <Button
              variant="secondary"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onAssignToMe(review.id);
              }}
            >
              Assign to Me
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      <Table
        columns={columns}
        data={reviews}
        onRowClick={onReviewClick}
        emptyMessage="No pending reviews"
      />
    </div>
  );
};