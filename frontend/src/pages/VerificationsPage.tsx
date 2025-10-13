import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Layout } from '@/components/layout';
import { Table, Badge, Button, Select, Input, LoadingSpinner } from '@/components/common';
import { useVerificationStore } from '@/stores';
import { formatDate, getVerificationResultColor, getVerificationResultLabel } from '@/utils';
import { CertificateType } from '@/types';
import toast from 'react-hot-toast';

export const VerificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { verifications, isLoading, error, fetchVerifications } = useVerificationStore();
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [documentTypeFilter, setDocumentTypeFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchVerifications();
  }, [fetchVerifications]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  // Helper function to get document name
  const getDocumentName = (verification: any): string => {
    const cert = verification.certificate;
    if (!cert) return 'N/A';

    // For Aadhaar cards
    if (cert.certificateType === 'AADHAAR_CARD' && cert.certificateData?.aadhaarNumber) {
      return `Aadhaar - ${cert.certificateData.aadhaarNumber}`;
    }

    // For PAN cards
    if (cert.certificateType === 'PAN_CARD' && cert.certificateData?.panNumber) {
      return `PAN - ${cert.certificateData.panNumber}`;
    }

    // For educational certificates
    if (cert.certificateData?.studentName) {
      return cert.certificateData.studentName;
    }

    // For certificates with holder name (Aadhaar/PAN)
    if (cert.certificateData?.holderName) {
      return cert.certificateData.holderName;
    }

    // Fallback to certificate number
    return cert.certificateNumber || 'N/A';
  };

  // Helper function to get document type label
  const getDocumentTypeLabel = (type: CertificateType): string => {
    const labels: Record<CertificateType, string> = {
      SCHOOL_CERTIFICATE: 'School Certificate',
      DEGREE: 'Degree',
      DIPLOMA: 'Diploma',
      MARKSHEET: 'Marksheet',
      AADHAAR_CARD: 'Aadhaar Card',
      PAN_CARD: 'PAN Card',
      OTHER: 'Other',
    };
    return labels[type] || type;
  };

  // Helper function to get document type badge color
  const getDocumentTypeBadgeColor = (type: CertificateType): 'success' | 'danger' | 'warning' | 'info' | 'gray' | 'error' | 'primary' => {
    if (type === 'AADHAAR_CARD') return 'info';
    if (type === 'PAN_CARD') return 'success';
    if (['SCHOOL_CERTIFICATE', 'DEGREE', 'DIPLOMA', 'MARKSHEET'].includes(type)) return 'primary';
    return 'gray';
  };

  // Helper function to map color strings to Badge variants
  const mapColorToBadgeVariant = (color: string): 'success' | 'danger' | 'warning' | 'info' | 'gray' | 'error' | 'primary' => {
    const colorMap: Record<string, 'success' | 'danger' | 'warning' | 'info' | 'gray' | 'error' | 'primary'> = {
      green: 'success',
      red: 'danger',
      yellow: 'warning',
      orange: 'warning',
      blue: 'info',
      gray: 'gray',
    };
    return colorMap[color] || 'gray';
  };

  // Filter verifications
  const filteredVerifications = verifications.filter((verification) => {
    const matchesStatus = !statusFilter || verification.result === statusFilter;
    const matchesDocumentType = !documentTypeFilter || verification.certificate?.certificateType === documentTypeFilter;
    
    const matchesSearch =
      !searchQuery ||
      getDocumentName(verification).toLowerCase().includes(searchQuery.toLowerCase()) ||
      verification.certificate?.certificateNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      verification.certificate?.certificateData?.aadhaarNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      verification.certificate?.certificateData?.panNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      verification.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesStatus && matchesDocumentType && matchesSearch;
  });

  const columns = [
    {
      key: 'documentName',
      header: 'Document Name',
      render: (verification: any) => (
        <div className="flex flex-col">
          <span className="font-medium text-gray-900 dark:text-white">
            {getDocumentName(verification)}
          </span>
          {verification.certificate?.certificateNumber && (
            <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {verification.certificate.certificateNumber}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      render: (verification: any) => {
        const type = verification.certificate?.certificateType;
        if (!type) return <span className="text-gray-500 dark:text-gray-400">N/A</span>;
        
        return (
          <Badge variant={getDocumentTypeBadgeColor(type)}>
            {getDocumentTypeLabel(type)}
          </Badge>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (verification: any) => (
        <Badge variant={mapColorToBadgeVariant(getVerificationResultColor(verification.result))}>
          {getVerificationResultLabel(verification.result)}
        </Badge>
      ),
    },
    {
      key: 'confidenceScore',
      header: 'Confidence',
      render: (verification: any) => {
        const score = verification.confidenceScore;
        if (score === null || score === undefined) {
          return <span className="text-gray-500 dark:text-gray-400">N/A</span>;
        }
        
        const color = score >= 80 ? 'text-green-600 dark:text-green-400' : 
                     score >= 60 ? 'text-yellow-600 dark:text-yellow-400' : 
                     'text-red-600 dark:text-red-400';
        
        return (
          <span className={`font-medium ${color}`}>
            {score}%
          </span>
        );
      },
    },
    {
      key: 'createdAt',
      header: 'Date',
      render: (verification: any) => (
        <span className="text-gray-900 dark:text-gray-100">
          {formatDate(verification.createdAt)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (verification: any) => (
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/verifications/${verification.id}`);
          }}
        >
          View Details
        </Button>
      ),
    },
  ];

  const handleRowClick = (verification: any) => {
    navigate(`/verifications/${verification.id}`);
  };

  const handleStartNew = () => {
    navigate('/certificates/upload');
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Verifications</h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              Track and manage document verification requests
            </p>
          </div>
          <Button onClick={handleStartNew}>
            Start New Verification
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search by name, document number, or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="w-full sm:w-48">
            <Select
              value={statusFilter}
              onChange={(value) => setStatusFilter(value)}
              options={[
                { value: '', label: 'All Statuses' },
                { value: 'VERIFIED', label: 'Verified' },
                { value: 'UNVERIFIED', label: 'Unverified' },
                { value: 'PENDING', label: 'Pending' },
                { value: 'REQUIRES_MANUAL_REVIEW', label: 'Manual Review' },
              ]}
            />
          </div>
          <div className="w-full sm:w-56">
            <Select
              value={documentTypeFilter}
              onChange={(value) => setDocumentTypeFilter(value)}
              options={[
                { value: '', label: 'All Document Types' },
                { value: 'SCHOOL_CERTIFICATE', label: 'School Certificate' },
                { value: 'DEGREE', label: 'Degree' },
                { value: 'DIPLOMA', label: 'Diploma' },
                { value: 'MARKSHEET', label: 'Marksheet' },
                { value: 'AADHAAR_CARD', label: 'Aadhaar Card' },
                { value: 'PAN_CARD', label: 'PAN Card' },
                { value: 'OTHER', label: 'Other' },
              ]}
            />
          </div>
        </div>

        {/* Results count */}
        {(searchQuery || statusFilter || documentTypeFilter) && (
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Showing {filteredVerifications.length} of {verifications.length} verification{verifications.length !== 1 ? 's' : ''}
          </div>
        )}

        {isLoading && verifications.length === 0 ? (
          <div className="flex justify-center items-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : filteredVerifications.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
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
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No verifications found</h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              {searchQuery || statusFilter || documentTypeFilter
                ? 'Try adjusting your filters'
                : 'Get started by uploading a document'}
            </p>
            {!searchQuery && !statusFilter && !documentTypeFilter && (
              <div className="mt-6">
                <Button onClick={handleStartNew}>
                  Upload Document
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <Table
              columns={columns}
              data={filteredVerifications}
              onRowClick={handleRowClick}
            />
          </div>
        )}
      </div>
    </Layout>
  );
};