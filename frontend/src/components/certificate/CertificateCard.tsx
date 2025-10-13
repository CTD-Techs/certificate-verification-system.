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
              {getCertificateTypeLabel(certificate.certificateType)}
            </h3>
            <p className="text-sm text-gray-500">ID: {certificate.id}</p>
          </div>
          <Badge variant="info">
            {getIssuerTypeLabel(certificate.issuerType)}
          </Badge>
        </div>

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