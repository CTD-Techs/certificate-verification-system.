import React, { useState } from 'react';
import { Certificate } from '../../types';
import { Table, Column, Input, Select, Pagination } from '../common';
import { getCertificateTypeLabel, getIssuerTypeLabel, CERTIFICATE_TYPES, ISSUER_TYPES } from '../../utils/constants';
import { formatDate } from '../../utils/format';

interface CertificateListProps {
  certificates: Certificate[];
  onCertificateClick?: (certificate: Certificate) => void;
  isLoading?: boolean;
}

export const CertificateList: React.FC<CertificateListProps> = ({
  certificates,
  onCertificateClick,
  isLoading = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [issuerFilter, setIssuerFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const itemsPerPage = 10;

  // Filter certificates
  const filteredCertificates = certificates.filter((cert) => {
    const matchesSearch =
      !searchTerm ||
      cert.certificateData?.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cert.certificateData?.rollNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cert.certificateNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cert.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = !typeFilter || cert.certificateType === typeFilter;
    const matchesIssuer = !issuerFilter || cert.issuerType === issuerFilter;

    return matchesSearch && matchesType && matchesIssuer;
  });

  // Sort certificates
  const sortedCertificates = [...filteredCertificates].sort((a, b) => {
    if (!sortBy) return 0;

    let aValue: any = a[sortBy as keyof Certificate];
    let bValue: any = b[sortBy as keyof Certificate];

    if (sortBy === 'createdAt' || sortBy === 'issueDate') {
      aValue = new Date(aValue).getTime();
      bValue = new Date(bValue).getTime();
    }

    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  // Paginate
  const totalPages = Math.ceil(sortedCertificates.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedCertificates = sortedCertificates.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const handleSort = (key: string) => {
    if (sortBy === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(key);
      setSortOrder('asc');
    }
  };

  const columns: Column<Certificate>[] = [
    {
      key: 'id',
      header: 'ID',
      render: (cert) => (
        <span className="text-xs font-mono text-gray-600">
          {cert.id.substring(0, 8)}...
        </span>
      ),
    },
    {
      key: 'certificateType',
      header: 'Type',
      sortable: true,
      render: (cert) => (
        <span className="text-sm">{getCertificateTypeLabel(cert.certificateType)}</span>
      ),
    },
    {
      key: 'studentName',
      header: 'Student Name',
      sortable: true,
      render: (cert) => (
        <div>
        <p className="text-sm font-medium text-gray-900">{cert.certificateData?.studentName || 'N/A'}</p>
        <p className="text-xs text-gray-500">{cert.certificateData?.rollNumber || 'N/A'}</p>
        </div>
      ),
    },
    {
      key: 'issuerType',
      header: 'Issuer',
      sortable: true,
      render: (cert) => (
        <div>
          <p className="text-sm">{getIssuerTypeLabel(cert.issuerType)}</p>
          <p className="text-xs text-gray-500">{cert.issuerName}</p>
        </div>
      ),
    },
    {
      key: 'examYear',
      header: 'Exam Year',
      sortable: true,
    },
    {
      key: 'issueDate',
      header: 'Issue Date',
      sortable: true,
      render: (cert) => <span className="text-sm">{formatDate(cert.issueDate)}</span>,
    },
    {
      key: 'createdAt',
      header: 'Uploaded',
      sortable: true,
      render: (cert) => <span className="text-sm">{formatDate(cert.createdAt)}</span>,
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading certificates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input
          placeholder="Search by name, roll number, or ID..."
          value={searchTerm}
          onChange={setSearchTerm}
        />
        <Select
          placeholder="Filter by type"
          value={typeFilter}
          onChange={setTypeFilter}
          options={[{ value: '', label: 'All Types' }, ...CERTIFICATE_TYPES]}
        />
        <Select
          placeholder="Filter by issuer"
          value={issuerFilter}
          onChange={setIssuerFilter}
          options={[{ value: '', label: 'All Issuers' }, ...ISSUER_TYPES]}
        />
      </div>

      {/* Results count */}
      <div className="text-sm text-gray-600">
        Showing {paginatedCertificates.length} of {filteredCertificates.length} certificates
        {searchTerm || typeFilter || issuerFilter ? ' (filtered)' : ''}
      </div>

      {/* Table */}
      <Table
        data={paginatedCertificates}
        columns={columns}
        onRowClick={onCertificateClick}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={handleSort}
        emptyMessage="No certificates found"
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          itemsPerPage={itemsPerPage}
          totalItems={filteredCertificates.length}
        />
      )}
    </div>
  );
};