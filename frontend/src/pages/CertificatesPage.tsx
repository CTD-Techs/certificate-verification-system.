import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout';
import { CertificateList } from '@/components/certificate';
import { Button, LoadingSpinner } from '@/components/common';
import { useCertificateStore } from '@/stores';
import toast from 'react-hot-toast';

export const CertificatesPage: React.FC = () => {
  const navigate = useNavigate();
  const { certificates, isLoading, error, fetchCertificates } = useCertificateStore();

  useEffect(() => {
    fetchCertificates();
  }, [fetchCertificates]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const handleCertificateClick = (certificateId: string) => {
    navigate(`/verifications?certificateId=${certificateId}`);
  };

  const handleUploadClick = () => {
    navigate('/certificates/upload');
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Certificates</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage and view all your uploaded certificates
            </p>
          </div>
          <Button onClick={handleUploadClick}>
            Upload New Certificate
          </Button>
        </div>

        {isLoading && certificates.length === 0 ? (
          <div className="flex justify-center items-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <CertificateList
            certificates={certificates}
            onCertificateClick={handleCertificateClick}
            isLoading={isLoading}
          />
        )}
      </div>
    </Layout>
  );
};