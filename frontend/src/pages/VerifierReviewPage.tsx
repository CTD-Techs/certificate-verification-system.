import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout';
import { ReviewForm } from '@/components/verifier';
import { Card, Badge, LoadingSpinner } from '@/components/common';
import { verifierService } from '@/services';
import { formatDate, getVerificationStatusColor, getVerificationStatusLabel, getVerificationResultColor, getVerificationResultLabel } from '@/utils';
import toast from 'react-hot-toast';

// Helper function to map status colors to Badge variants
const mapColorToBadgeVariant = (color: string): 'success' | 'danger' | 'warning' | 'info' | 'gray' => {
  const colorMap: Record<string, 'success' | 'danger' | 'warning' | 'info' | 'gray'> = {
    green: 'success',
    red: 'danger',
    yellow: 'warning',
    orange: 'warning',
    blue: 'info',
    gray: 'gray',
  };
  return colorMap[color] || 'gray';
};

export const VerifierReviewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [review, setReview] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (id) {
      fetchReview();
    }
  }, [id]);

  const fetchReview = async () => {
    setIsLoading(true);
    try {
      const review = await verifierService.getReview(id!);
      console.log('DEBUG: Review data structure:', review);
      console.log('DEBUG: Certificate:', review.certificate);
      console.log('DEBUG: Certificate verifications:', review.certificate?.verifications);
      setReview(review);
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Failed to fetch review');
      navigate('/verifier/queue');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      await verifierService.submitReview(id!, data);
      toast.success('Review submitted successfully!');
      navigate('/verifier/queue');
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/verifier/queue');
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    );
  }

  if (!review) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900">Review not found</h2>
          <p className="mt-2 text-gray-600">The review you're looking for doesn't exist.</p>
        </div>
      </Layout>
    );
  }

  const certificate = review.certificate;
  const certData = certificate?.certificateData || {};
  // Get the most recent verification from the certificate's verifications array
  const verification = certificate?.verifications?.[0];

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manual Review</h1>
          <p className="mt-1 text-sm text-gray-500">
            Review the certificate and verification details, then submit your decision
          </p>
        </div>

        {/* Certificate Details Card */}
        {certificate && (
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Certificate Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Certificate Type</p>
                <p className="mt-1 font-medium text-gray-900">
                  {certificate.certificateType?.replace(/_/g, ' ')}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Issuer</p>
                <p className="mt-1 font-medium text-gray-900">{certificate.issuerName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Student Name</p>
                <p className="mt-1 font-medium text-gray-900">
                  {certData.studentName || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Roll Number</p>
                <p className="mt-1 font-medium text-gray-900">
                  {certData.rollNumber || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Registration Number</p>
                <p className="mt-1 font-medium text-gray-900">
                  {certData.registrationNumber || certificate.certificateNumber || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Exam Year</p>
                <p className="mt-1 font-medium text-gray-900">
                  {certData.examYear || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Issue Date</p>
                <p className="mt-1 font-medium text-gray-900">
                  {certificate.issueDate ? formatDate(certificate.issueDate) :
                   certData.issueDate ? formatDate(certData.issueDate) : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Board/Institution</p>
                <p className="mt-1 font-medium text-gray-900">
                  {certData.board || certData.school?.name || certificate.issuerName}
                </p>
              </div>
            </div>

            {/* Additional Certificate Information */}
            {(certificate.hasQrCode || certificate.hasDigitalSignature || certData.qrCode || certData.digitalSignature) && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Security Features</h4>
                <div className="grid grid-cols-2 gap-4">
                  {(certificate.hasQrCode || certData.qrCode) && (
                    <div>
                      <p className="text-sm text-gray-500">QR Code</p>
                      <div className="mt-1 flex items-center">
                        <Badge variant="success">Present</Badge>
                        {certData.qrCode && (
                          <span className="ml-2 text-xs text-gray-600 truncate max-w-[200px]">
                            {certData.qrCode}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  {(certificate.hasDigitalSignature || certData.digitalSignature) && (
                    <div>
                      <p className="text-sm text-gray-500">Digital Signature</p>
                      <div className="mt-1 flex items-center">
                        <Badge variant="success">Present</Badge>
                        {certData.digitalSignature && (
                          <span className="ml-2 text-xs text-gray-600 truncate max-w-[200px]">
                            {certData.digitalSignature}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Subjects/Marks if available */}
            {certData.subjects && certData.subjects.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Subjects & Marks</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Marks</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Max Marks</th>
                        {certData.subjects.some((s: any) => s.grade) && (
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Grade</th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {certData.subjects.map((subject: any, idx: number) => (
                        <tr key={idx}>
                          <td className="px-3 py-2 text-sm text-gray-900">{subject.name}</td>
                          <td className="px-3 py-2 text-sm text-gray-900">{subject.marks}</td>
                          <td className="px-3 py-2 text-sm text-gray-900">{subject.maxMarks}</td>
                          {subject.grade && (
                            <td className="px-3 py-2 text-sm text-gray-900">{subject.grade}</td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {(certData.totalMarks || certData.percentage || certData.grade) && (
                  <div className="mt-3 grid grid-cols-3 gap-4">
                    {certData.totalMarks && (
                      <div>
                        <p className="text-sm text-gray-500">Total Marks</p>
                        <p className="mt-1 font-medium text-gray-900">{certData.totalMarks}</p>
                      </div>
                    )}
                    {certData.percentage && (
                      <div>
                        <p className="text-sm text-gray-500">Percentage</p>
                        <p className="mt-1 font-medium text-gray-900">{certData.percentage}%</p>
                      </div>
                    )}
                    {certData.grade && (
                      <div>
                        <p className="text-sm text-gray-500">Overall Grade</p>
                        <p className="mt-1 font-medium text-gray-900">{certData.grade}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </Card>
        )}

        {/* Verification Status */}
        {verification && (
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Verification Status</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Current Status</span>
                <Badge variant={mapColorToBadgeVariant(getVerificationStatusColor(verification.status))}>
                  {getVerificationStatusLabel(verification.status)}
                </Badge>
              </div>
              {verification.result && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Verification Result</span>
                  <Badge variant={mapColorToBadgeVariant(getVerificationResultColor(verification.result))}>
                    {getVerificationResultLabel(verification.result)}
                  </Badge>
                </div>
              )}
              {verification.confidenceScore !== null && verification.confidenceScore !== undefined && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Confidence Score</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          verification.confidenceScore >= 80
                            ? 'bg-green-500'
                            : verification.confidenceScore >= 60
                            ? 'bg-yellow-500'
                            : 'bg-red-500'
                        }`}
                        style={{ width: `${verification.confidenceScore}%` }}
                      />
                    </div>
                    <span className="font-medium text-gray-900">
                      {verification.confidenceScore}%
                    </span>
                  </div>
                </div>
              )}
              {verification.verificationType && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Verification Type</span>
                  <span className="font-medium text-gray-900">
                    {verification.verificationType.replace(/_/g, ' ')}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Started At</span>
                <span className="text-gray-900">{formatDate(verification.startedAt || verification.createdAt)}</span>
              </div>
              {verification.completedAt && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Completed At</span>
                  <span className="text-gray-900">{formatDate(verification.completedAt)}</span>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Verification Evidence */}
        {verification?.resultData && Object.keys(verification.resultData).length > 0 && (
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Verification Evidence</h3>
            <div className="space-y-3">
              {Object.entries(verification.resultData).map(([key, value]: [string, any]) => (
                <div key={key} className="border-b border-gray-200 pb-3 last:border-0">
                  <p className="text-sm font-medium text-gray-700 capitalize">
                    {key.replace(/_/g, ' ')}
                  </p>
                  <div className="mt-1 text-sm text-gray-900">
                    {typeof value === 'object' && value !== null ? (
                      <pre className="bg-gray-50 p-2 rounded text-xs overflow-x-auto">
                        {JSON.stringify(value, null, 2)}
                      </pre>
                    ) : (
                      <p>{String(value)}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Verification Steps */}
        {verification?.steps && verification.steps.length > 0 && (
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Verification Steps</h3>
            <div className="space-y-3">
              {verification.steps.map((step: any, index: number) => (
                <div key={index} className="flex items-start gap-3">
                  <div
                    className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      step.status === 'COMPLETED'
                        ? 'bg-green-100 text-green-600'
                        : step.status === 'FAILED'
                        ? 'bg-red-100 text-red-600'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {step.status === 'COMPLETED' ? '✓' : step.status === 'FAILED' ? '✗' : '○'}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{step.stepName}</p>
                    <p className="text-sm text-gray-500">{step.description}</p>
                    {step.result && (
                      <div className="text-xs text-gray-600 mt-1">
                        <span className="font-medium">Result: </span>
                        {typeof step.result === 'object' && step.result !== null ? (
                          <pre className="bg-gray-50 p-2 rounded mt-1 overflow-x-auto">
                            {JSON.stringify(step.result, null, 2)}
                          </pre>
                        ) : (
                          <span>{String(step.result)}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Review Form */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Submit Review</h3>
          <ReviewForm
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isLoading={isSubmitting}
          />
        </Card>
      </div>
    </Layout>
  );
};