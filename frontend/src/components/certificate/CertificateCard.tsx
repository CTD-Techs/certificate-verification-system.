import React from 'react';
import { Certificate } from '../../types';
import { Card, Badge } from '../common';
import { getCertificateTypeLabel, getIssuerTypeLabel } from '../../utils/constants';
import { formatDate } from '../../utils/format';

interface CertificateCardProps {
  certificate: Certificate;
  onClick?: () => void;
}

export const CertificateCard: React.FC<CertificateCardProps> = ({
  certificate,
  onClick,
}) => {
  const isAadhaar = certificate.certificateType === 'AADHAAR_CARD';
  const isPAN = certificate.certificateType === 'PAN_CARD';
  const isIdentityDoc = isAadhaar || isPAN;

  const maskAadhaarNumber = (aadhaar: string): string => {
    if (!aadhaar) return 'N/A';
    return 'XXXX-XXXX-' + aadhaar.slice(-4);
  };

  const maskPANNumber = (pan: string): string => {
    if (!pan) return 'N/A';
    return 'XXXXX' + pan.slice(-4);
  };

  const getIcon = () => {
    if (isAadhaar) {
      return (
        <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
        </svg>
      );
    }
    if (isPAN) {
      return (
        <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      );
    }
    return (
      <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    );
  };

  return (
    <Card>
      <div
        className={`space-y-3 ${onClick ? 'cursor-pointer' : ''}`}
        onClick={onClick}
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            {getIcon()}
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {getCertificateTypeLabel(certificate.certificateType)}
              </h3>
              <p className="text-xs text-gray-500">ID: {certificate.id.substring(0, 8)}...</p>
            </div>
          </div>
          <Badge variant="info">
            {getIssuerTypeLabel(certificate.issuerType)}
          </Badge>
        </div>

        {/* Identity Document Info */}
        {isIdentityDoc ? (
          <>
            <div className="border-t border-gray-200 pt-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-500">Holder Name</p>
                  <p className="text-sm font-medium text-gray-900">
                    {certificate.certificateData?.holderName || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">
                    {isAadhaar ? 'Aadhaar Number' : 'PAN Number'}
                  </p>
                  <p className="text-sm font-medium text-gray-900 font-mono">
                    {isAadhaar
                      ? maskAadhaarNumber(certificate.certificateData?.aadhaarNumber)
                      : maskPANNumber(certificate.certificateData?.panNumber)
                    }
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-gray-500">Date of Birth</p>
                <p className="text-sm font-medium text-gray-900">
                  {formatDate(certificate.certificateData?.dateOfBirth)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">
                  {isAadhaar ? 'Gender' : 'Category'}
                </p>
                <p className="text-sm font-medium text-gray-900">
                  {isAadhaar
                    ? certificate.certificateData?.gender || 'N/A'
                    : certificate.certificateData?.category || 'N/A'
                  }
                </p>
              </div>
            </div>

            {isPAN && certificate.certificateData?.aadhaarLinked && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Aadhaar Linked</span>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Student Info */}
            <div className="border-t border-gray-200 pt-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-500">Student Name</p>
                  <p className="text-sm font-medium text-gray-900">
                    {certificate.certificateData?.studentName || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Roll Number</p>
                  <p className="text-sm font-medium text-gray-900">
                    {certificate.certificateData?.rollNumber || 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {/* Certificate Details */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-gray-500">Exam Year</p>
                <p className="text-sm font-medium text-gray-900">
                  {certificate.certificateData?.examYear || certificate.certificateData?.graduationYear || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Issue Date</p>
                <p className="text-sm font-medium text-gray-900">
                  {formatDate(certificate.issueDate)}
                </p>
              </div>
            </div>
          </>
        )}

        {/* Issuer Info */}
        <div className="border-t border-gray-200 pt-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-gray-500">Issuer Name</p>
              <p className="text-sm font-medium text-gray-900">
                {certificate.issuerName}
              </p>
            </div>
            {certificate.certificateNumber && (
              <div>
                <p className="text-xs text-gray-500">Certificate Number</p>
                <p className="text-sm font-medium text-gray-900">
                  {certificate.certificateNumber}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Metadata */}
        <div className="flex items-center justify-between text-xs text-gray-500 border-t border-gray-200 pt-3">
          <span>Uploaded: {formatDate(certificate.createdAt)}</span>
          <span>Status: {certificate.status}</span>
        </div>
      </div>
    </Card>
  );
};