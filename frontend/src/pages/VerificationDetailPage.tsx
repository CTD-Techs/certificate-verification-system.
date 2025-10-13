import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout';
import { VerificationTimeline, VerificationEvidence, ConfidenceScore } from '@/components/verification';
import { Card, Badge, Button, LoadingSpinner } from '@/components/common';
import { useVerificationStore } from '@/stores';
import { formatDate, getVerificationStatusColor, getVerificationStatusLabel } from '@/utils';
import toast from 'react-hot-toast';

export const VerificationDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentVerification, isLoading, error, fetchVerificationById, retryVerification } = useVerificationStore();

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
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Verification not found</h2>
          <p className="mt-2 text-gray-600 dark:text-gray-300">The verification you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/verifications')} className="mt-4">
            Back to Verifications
          </Button>
        </div>
      </Layout>
    );
  }

  const verification = currentVerification;
  const certificate = verification.certificate;
  
  if (!certificate) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Certificate data not available</h2>
          <Button onClick={() => navigate('/verifications')} className="mt-4">
            Back to Verifications
          </Button>
        </div>
      </Layout>
    );
  }

  const isAadhaar = certificate.certificateType === 'AADHAAR_CARD';
  const isPAN = certificate.certificateType === 'PAN_CARD';
  const isEducational = !isAadhaar && !isPAN;

  // Helper functions
  const maskAadhaar = (num: string): string => {
    if (!num) return 'N/A';
    return 'XXXX-XXXX-' + num.slice(-4);
  };

  const maskPAN = (num: string): string => {
    if (!num) return 'N/A';
    return 'XXXXX' + num.slice(-4);
  };

  const formatAddress = (address: any): string => {
    if (!address) return 'N/A';
    
    // If address is already a string, return it
    if (typeof address === 'string') return address;
    
    // If address is an object, format it
    const parts = [
      address.line1,
      address.line2,
      address.city,
      address.state,
      address.pincode
    ].filter(Boolean);  // Remove null/undefined values
    
    return parts.join(', ') || 'N/A';
  };

  const getFieldValue = (field: string): string => {
    const data = certificate.certificateData;
    
    // For Aadhaar cards, check inside the aadhaar object
    if (isAadhaar && data?.aadhaar) {
      const aadhaarValue = data.aadhaar[field];
      if (aadhaarValue !== undefined && aadhaarValue !== null) {
        return aadhaarValue;
      }
    }
    
    // For PAN cards, check inside the pan object
    if (isPAN && data?.pan) {
      const panValue = data.pan[field];
      if (panValue !== undefined && panValue !== null) {
        return panValue;
      }
    }
    
    // Fallback to direct field or extractedFields
    return data?.[field] || data?.extractedFields?.[field] || 'N/A';
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Verification Details</h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">ID: {verification.id}</p>
          </div>
          <div className="flex gap-3">
            {verification.result === 'UNVERIFIED' && (
              <Button variant="secondary" onClick={handleRetry} isLoading={isLoading}>
                Retry Verification
              </Button>
            )}
            <Button onClick={handleDownloadReport}>Download Report</Button>
          </div>
        </div>

        {/* Status Card */}
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Verification Status</h3>
              <div className="mt-2">
                <Badge variant={getVerificationStatusColor(verification.status) as any}>
                  {getVerificationStatusLabel(verification.status)}
                </Badge>
              </div>
            </div>
            {verification.confidenceScore !== null && verification.confidenceScore !== undefined && (
              <div className="text-right">
                <ConfidenceScore score={verification.confidenceScore} size="lg" />
              </div>
            )}
          </div>
        </Card>

        {/* Document Information Card */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Document Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300">Document Type</p>
              <p className="mt-1 font-medium text-gray-900 dark:text-white">
                {isAadhaar ? 'Aadhaar Card' : isPAN ? 'PAN Card' : certificate.certificateType}
              </p>
            </div>
            {isAadhaar && (
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">Aadhaar Number</p>
                <p className="mt-1 font-medium text-gray-900 dark:text-white font-mono">
                  {maskAadhaar(certificate.certificateData?.aadhaar?.aadhaarNumber || '')}
                </p>
              </div>
            )}
            {isPAN && (
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">PAN Number</p>
                <p className="mt-1 font-medium text-gray-900 dark:text-white font-mono">
                  {maskPAN(certificate.certificateData?.pan?.panNumber || '')}
                </p>
              </div>
            )}
            {isEducational && certificate.certificateNumber && (
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">Certificate Number</p>
                <p className="mt-1 font-medium text-gray-900 dark:text-white">{certificate.certificateNumber}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300">Issuer</p>
              <p className="mt-1 font-medium text-gray-900 dark:text-white">{certificate.issuerName || 'N/A'}</p>
            </div>
          </div>
        </Card>

        {/* Extracted Data Card - Educational Certificate */}
        {isEducational && (
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Extracted Data</h3>
            <div className="space-y-6">
              {/* Student Details */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Student Details</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Student Name</p>
                    <p className="mt-1 font-medium text-gray-900 dark:text-white">{getFieldValue('studentName')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Roll Number</p>
                    <p className="mt-1 font-medium text-gray-900 dark:text-white">{getFieldValue('rollNumber')}</p>
                  </div>
                </div>
              </div>

              {/* Academic Details */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Academic Details</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Degree/Certificate</p>
                    <p className="mt-1 font-medium text-gray-900 dark:text-white">
                      {getFieldValue('degree') || certificate.certificateType}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Year</p>
                    <p className="mt-1 font-medium text-gray-900 dark:text-white">{getFieldValue('examYear')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Institution</p>
                    <p className="mt-1 font-medium text-gray-900 dark:text-white">
                      {getFieldValue('institution') || certificate.issuerName}
                    </p>
                  </div>
                  {getFieldValue('marks') !== 'N/A' && (
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Marks/Grade</p>
                      <p className="mt-1 font-medium text-gray-900 dark:text-white">{getFieldValue('marks')}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Extracted Data Card - Aadhaar */}
        {isAadhaar && (
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Extracted Data</h3>
            <div className="space-y-6">
              {/* Personal Details */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Personal Details</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Name</p>
                    <p className="mt-1 font-medium text-gray-900 dark:text-white">
                      {getFieldValue('name') || getFieldValue('holderName')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Date of Birth</p>
                    <p className="mt-1 font-medium text-gray-900 dark:text-white">
                      {getFieldValue('dob') !== 'N/A' ? getFieldValue('dob') : 'Invalid Date'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Gender</p>
                    <p className="mt-1 font-medium text-gray-900 dark:text-white">{getFieldValue('gender')}</p>
                  </div>
                  {getFieldValue('fatherName') !== 'N/A' && (
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Father's Name</p>
                      <p className="mt-1 font-medium text-gray-900 dark:text-white">{getFieldValue('fatherName')}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Address Details */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Address Details</h4>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Address</p>
                    <p className="mt-1 font-medium text-gray-900 dark:text-white">
                      {formatAddress(certificate.certificateData?.aadhaar?.address)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Contact Details */}
              {getFieldValue('mobileNumber') !== 'N/A' && (
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Contact Details</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Mobile Number</p>
                      <p className="mt-1 font-medium text-gray-900 dark:text-white">{getFieldValue('mobileNumber')}</p>
                    </div>
                    {getFieldValue('email') !== 'N/A' && (
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Email</p>
                        <p className="mt-1 font-medium text-gray-900 dark:text-white">{getFieldValue('email')}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Extracted Data Card - PAN */}
        {isPAN && (
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Extracted Data</h3>
            <div className="space-y-6">
              {/* Personal Details */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Personal Details</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Name</p>
                    <p className="mt-1 font-medium text-gray-900 dark:text-white">
                      {getFieldValue('name') || getFieldValue('holderName')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Father's Name</p>
                    <p className="mt-1 font-medium text-gray-900 dark:text-white">{getFieldValue('fatherName')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Date of Birth</p>
                    <p className="mt-1 font-medium text-gray-900 dark:text-white">
                      {getFieldValue('dob') !== 'N/A' ? getFieldValue('dob') : 'Invalid Date'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Category</p>
                    <p className="mt-1 font-medium text-gray-900 dark:text-white">{getFieldValue('category')}</p>
                  </div>
                </div>
              </div>

              {/* Address Details */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Address Details</h4>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Address</p>
                    <p className="mt-1 font-medium text-gray-900 dark:text-white">
                      {formatAddress(certificate.certificateData?.pan?.address)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Aadhaar Linkage */}
              {verification.evidence?.panVerification?.aadhaarLinked !== undefined && (
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Aadhaar Linkage Status</h4>
                  <div className="flex items-center gap-2">
                    <Badge variant={verification.evidence.panVerification.aadhaarLinked ? 'success' : 'warning'}>
                      {verification.evidence.panVerification.aadhaarLinked ? 'Linked' : 'Not Linked'}
                    </Badge>
                  </div>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Confidence Score Card */}
        {certificate.certificateData?.ocrConfidence !== undefined && (
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Confidence Scores</h3>
            <div className="space-y-4">
              {certificate.certificateData.ocrConfidence !== undefined && (
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">OCR Confidence</span>
                    <span className="text-lg font-bold text-gray-900 dark:text-white">
                      {certificate.certificateData.ocrConfidence.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${certificate.certificateData.ocrConfidence}%` }}
                    />
                  </div>
                </div>
              )}
              {certificate.certificateData.extractionConfidence !== undefined && (
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">Extraction Confidence</span>
                    <span className="text-lg font-bold text-gray-900 dark:text-white">
                      {certificate.certificateData.extractionConfidence.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{ width: `${certificate.certificateData.extractionConfidence}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Verification Steps */}
        {verification.steps && verification.steps.length > 0 && (
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Verification Steps</h3>
            <VerificationTimeline steps={verification.steps} />
          </Card>
        )}

        {/* Evidence */}
        {verification.evidence && Object.keys(verification.evidence).length > 0 && (
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Verification Evidence</h3>
            <VerificationEvidence evidence={verification.evidence} />
          </Card>
        )}

        {/* Manual Review */}
        {verification.manualReview && (
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Manual Review</h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">Decision</p>
                <div className="mt-1">
                  <Badge
                    variant={
                      verification.manualReview.decision === 'APPROVE'
                        ? 'success'
                        : verification.manualReview.decision === 'REJECT'
                        ? 'danger'
                        : 'warning'
                    }
                  >
                    {verification.manualReview.decision}
                  </Badge>
                </div>
              </div>
              {verification.manualReview.comments && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Comments</p>
                  <p className="mt-1 text-gray-900 dark:text-white">{verification.manualReview.comments}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Reviewed By</p>
                  <p className="mt-1 text-gray-900 dark:text-white">
                    {verification.manualReview.reviewedBy?.firstName} {verification.manualReview.reviewedBy?.lastName}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Reviewed At</p>
                  <p className="mt-1 text-gray-900 dark:text-white">
                    {formatDate(verification.manualReview.reviewedAt)}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Metadata */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Metadata</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300">Created At</p>
              <p className="mt-1 text-gray-900 dark:text-white">{formatDate(verification.createdAt)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300">Last Updated</p>
              <p className="mt-1 text-gray-900 dark:text-white">{formatDate(verification.updatedAt)}</p>
            </div>
            {verification.startedAt && (
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">Started At</p>
                <p className="mt-1 text-gray-900 dark:text-white">{formatDate(verification.startedAt)}</p>
              </div>
            )}
            {verification.completedAt && (
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">Completed At</p>
                <p className="mt-1 text-gray-900 dark:text-white">{formatDate(verification.completedAt)}</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </Layout>
  );
};