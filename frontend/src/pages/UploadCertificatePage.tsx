import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout';
import { CertificateForm } from '@/components/certificate';
import { useCertificateStore, useVerificationStore } from '@/stores';
import toast from 'react-hot-toast';

export const UploadCertificatePage: React.FC = () => {
  const navigate = useNavigate();
  const { createCertificate, isLoading } = useCertificateStore();
  const { startVerification } = useVerificationStore();

  const handleSubmit = async (data: any) => {
    try {
      const certificate = await createCertificate(data);
      toast.success('Certificate uploaded successfully!');
      
      // Auto-start verification
      try {
        await startVerification(certificate.id);
        toast.success('Verification started!');
      } catch (verifyError) {
        console.error('Failed to start verification:', verifyError);
        toast.error('Certificate uploaded but verification failed to start');
      }
      
      navigate('/verifications');
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Failed to upload certificate');
    }
  };

  const handleCancel = () => {
    navigate('/certificates');
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Upload Certificate</h1>
          <p className="mt-1 text-sm text-gray-500">
            Upload a new certificate for verification. You can enter details manually or upload a JSON file.
          </p>
        </div>

        <CertificateForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={isLoading}
        />
      </div>
    </Layout>
  );
};