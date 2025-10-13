import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Layout } from '@/components/layout';
import { Table, Badge, Button, Select, Input, LoadingSpinner } from '@/components/common';
import { useVerificationStore } from '@/stores';
import { formatDate, getVerificationStatusColor, getVerificationStatusLabel } from '@/utils';
import toast from 'react-hot-toast';

export const VerificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { verifications, isLoading, error, fetchVerifications } = useVerificationStore();
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchVerifications();
  }, [fetchVerifications]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  // Filter verifications
  const filteredVerifications = verifications.filter((verification) => {
    const matchesStatus = !statusFilter || verification.status === statusFilter;
    const matchesSearch =
      !searchQuery ||
      verification.certificate?.certificateData?.studentName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      verification.certificate?.certificateNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      verification.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const columns = [
    {
      key: 'certificateNumber',
      label: 'Certificate Number',
      render: (verification: any) => (
        <span className="font-medium text-gray-900">
          {verification.certificate?.certificateNumber || 'N/A'}
        </span>
      ),
    },
    {
      key: 'studentName',
      label: 'Student Name',
      render: (verification: any) => verification.certificate?.certificateData?.studentName || 'N/A',
    },
    {
      key: 'status',
      label: 'Status',
      render: (verification: any) => (
        <Badge variant={getVerificationStatusColor(verification.status)}>
          {getVerificationStatusLabel(verification.status)}
        </Badge>
      ),
    },
    {
      key: 'confidenceScore',
      label: 'Confidence',
      render: (verification: any) => (
        <span className="font-medium">
          {verification.confidenceScore ? `${verification.confidenceScore}%` : 'N/A'}
        </span>
      ),
    },
    {
      key: 'createdAt',
      label: 'Created',
      render: (verification: any) => formatDate(verification.createdAt),
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
            <h1 className="text-2xl font-bold text-gray-900">Verifications</h1>
            <p className="mt-1 text-sm text-gray-500">
              Track and manage certificate verification requests
            </p>
          </div>
          <Button onClick={handleStartNew}>
            Start New Verification
          </Button>
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search by certificate number, student name, or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="w-64">
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: '', label: 'All Statuses' },
                { value: 'VERIFIED', label: 'Verified' },
                { value: 'UNVERIFIED', label: 'Unverified' },
                { value: 'PENDING', label: 'Pending' },
                { value: 'MANUAL_REVIEW', label: 'Manual Review' },
              ]}
            />
          </div>
        </div>

        {isLoading && verifications.length === 0 ? (
          <div className="flex justify-center items-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : filteredVerifications.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
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
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No verifications found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchQuery || statusFilter
                ? 'Try adjusting your filters'
                : 'Get started by uploading a certificate'}
            </p>
            {!searchQuery && !statusFilter && (
              <div className="mt-6">
                <Button onClick={handleStartNew}>
                  Upload Certificate
                </Button>
              </div>
            )}
          </div>
        ) : (
          <Table
            columns={columns}
            data={filteredVerifications}
            onRowClick={handleRowClick}
          />
        )}
      </div>
    </Layout>
  );
};