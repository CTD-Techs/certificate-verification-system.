import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout';
import {
  VerificationTimeline,
  VerificationEvidence,
  ConfidenceScore,
} from '@/components/verification';
import { Card, Badge, Button, LoadingSpinner } from '@/components/common';
import { useVerificationStore } from '@/stores';
import { formatDate, getVerificationStatusColor, getVerificationStatusLabel } from '@/utils';
import toast from 'react-hot-toast';

export const VerificationDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentVerification, isLoading, error, fetchVerificationById, retryVerification } =
    useVerificationStore();

  useEffect(() => {
    if (id) {
      fetchVerificationById(id);
    }
  }, [id, fetchVerificationById]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const handleRetry = async () => {
    if (id) {
      try {
        await retryVerification(id);
        toast.success('Verification retry initiated!');
      } catch (error) {
        toast.error('Failed to retry verification');
      }
    }
  };

  const handleDownloadReport = () => {
    // TODO: Implement report download
    toast.success('Report download feature coming soon!');
  };

  if (isLoading && !currentVerification) {
    return (
      <Layout>
        <div className="flex justify-center items-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    );
  }

  if (!currentVerification) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900">Verification not found</h2>
          <p className="mt-2 text-gray-600">The verification you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/verifications')} className="mt-4">
            Back to Verifications
          </Button>
        </div>
      </Layout>
    );
  }

  const verification = currentVerification;
  const certificate = verification.certificate;

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Verification Details</h1>
            <p className="mt-1 text-sm text-gray-500">
              ID: {verification.id}
            </p>
          </div>
          <div className="flex gap-3">
            {verification.status === 'UNVERIFIED' && (
              <Button variant="secondary" onClick={handleRetry} isLoading={isLoading}>
                Retry Verification
              </Button>
            )}
            <Button onClick={handleDownloadReport}>
              Download Report
            </Button>
          </div>
        </div>

        {/* Status Card */}
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Verification Status</h3>
              <div className="mt-2">
                <Badge variant={getVerificationStatusColor(verification.status)} size="lg">
                  {getVerificationStatusLabel(verification.status)}
                </Badge>
              </div>
            </div>
            {verification.confidenceScore !== null && verification.confidenceScore !== undefined && (
              <div className="text-right">
                <p className="text-sm text-gray-500 mb-2">Confidence Score</p>
                <ConfidenceScore score={verification.confidenceScore} size="lg" />
              </div>
            )}
          </div>
        </Card>

        {/* Certificate Information */}
        {certificate && (
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Certificate Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Certificate Number</p>
                <p className="mt-1 font-medium text-gray-900">{certificate.certificateNumber || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Student Name</p>
                <p className="mt-1 font-medium text-gray-900">{certificate.certificateData?.studentName || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Roll Number</p>
                <p className="mt-1 font-medium text-gray-900">{certificate.certificateData?.rollNumber || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Issue Date</p>
                <p className="mt-1 font-medium text-gray-900">
                  {formatDate(certificate.issueDate)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Issuer Name</p>
                <p className="mt-1 font-medium text-gray-900">{certificate.issuerName || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Certificate Type</p>
                <p className="mt-1 font-medium text-gray-900">{certificate.certificateType || 'N/A'}</p>
              </div>
            </div>
          </Card>
        )}

        {/* Verification Timeline */}
        {verification.steps && verification.steps.length > 0 && (
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Verification Timeline</h3>
            <VerificationTimeline steps={verification.steps} />
          </Card>
        )}

        {/* Evidence */}
        {verification.evidence && Object.keys(verification.evidence).length > 0 && (
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Verification Evidence</h3>
            <VerificationEvidence evidence={verification.evidence} />
          </Card>
        )}

        {/* Manual Review Info */}
        {verification.manualReview && (
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Manual Review</h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Decision</p>
                <Badge
                  variant={
                    verification.manualReview.decision === 'APPROVE'
                      ? 'success'
                      : verification.manualReview.decision === 'REJECT'
                      ? 'error'
                      : 'warning'
                  }
                >
                  {verification.manualReview.decision}
                </Badge>
              </div>
              {verification.manualReview.comments && (
                <div>
                  <p className="text-sm text-gray-500">Comments</p>
                  <p className="mt-1 text-gray-900">{verification.manualReview.comments}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-500">Reviewed By</p>
                <p className="mt-1 text-gray-900">
                  {verification.manualReview.reviewedBy?.firstName}{' '}
                  {verification.manualReview.reviewedBy?.lastName}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Reviewed At</p>
                <p className="mt-1 text-gray-900">
                  {formatDate(verification.manualReview.reviewedAt)}
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Metadata */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Metadata</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Created At</p>
              <p className="mt-1 text-gray-900">{formatDate(verification.createdAt)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Last Updated</p>
              <p className="mt-1 text-gray-900">{formatDate(verification.updatedAt)}</p>
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  );
};