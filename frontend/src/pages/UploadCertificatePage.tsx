import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout';
import { CertificateForm, AadhaarCardForm, PANCardForm } from '@/components/certificate';
import { useCertificateStore, useVerificationStore } from '@/stores';
import toast from 'react-hot-toast';
import {
  AcademicCapIcon,
  IdentificationIcon,
  CreditCardIcon,
  SparklesIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

type DocumentType = 'EDUCATIONAL' | 'AADHAAR' | 'PAN';

export const UploadCertificatePage: React.FC = () => {
  const navigate = useNavigate();
  const { createCertificate, isLoading } = useCertificateStore();
  const { startVerification } = useVerificationStore();
  const [documentType, setDocumentType] = useState<DocumentType>('EDUCATIONAL');

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
      console.log('[AADHAAR] ===== SUBMISSION ERROR =====');
      console.log('[AADHAAR] Error object:', error);
      console.log('[AADHAAR] Error response:', error.response);
      console.log('[AADHAAR] Error response data:', error.response?.data);
      console.log('[AADHAAR] Error response status:', error.response?.status);
      console.log('[AADHAAR] Error response headers:', error.response?.headers);
      console.log('[AADHAAR] Error message:', error.message);
      if (error.response?.data?.error) {
        console.log('[AADHAAR] Error details:', JSON.stringify(error.response.data.error, null, 2));
      }
      if (error.response?.data?.details) {
        console.log('[AADHAAR] Validation details:', JSON.stringify(error.response.data.details, null, 2));
      }
      toast.error(error.response?.data?.error?.message || 'Failed to upload certificate');
    }
  };

  const handleCancel = () => {
    navigate('/certificates');
  };

  const renderForm = () => {
    switch (documentType) {
      case 'AADHAAR':
        return (
          <AadhaarCardForm
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isLoading={isLoading}
          />
        );
      case 'PAN':
        return (
          <PANCardForm
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isLoading={isLoading}
          />
        );
      case 'EDUCATIONAL':
      default:
        return (
          <CertificateForm
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isLoading={isLoading}
          />
        );
    }
  };

  const documentTypes = [
    {
      type: 'EDUCATIONAL' as DocumentType,
      icon: AcademicCapIcon,
      title: 'Educational Certificate',
      description: 'Degree, Diploma, Marksheet',
      gradient: 'from-blue-500 to-purple-600',
    },
    {
      type: 'AADHAAR' as DocumentType,
      icon: IdentificationIcon,
      title: 'Aadhaar Card',
      description: 'UIDAI Identity Document',
      gradient: 'from-green-500 to-emerald-600',
    },
    {
      type: 'PAN' as DocumentType,
      icon: CreditCardIcon,
      title: 'PAN Card',
      description: 'Income Tax Identity',
      gradient: 'from-orange-500 to-red-600',
    },
  ];

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
        {/* Header */}
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="p-4 rounded-2xl bg-gradient-primary shadow-glow animate-float">
              <SparklesIcon className="h-12 w-12 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold gradient-text mb-2">Upload Document</h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Upload a document for intelligent verification. Choose the document type and enter the required details.
          </p>
        </div>

        {/* Document Type Selector */}
        <div className="glass-card animate-slide-up">
          <div className="p-6 border-b border-white/10">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
              <CheckCircleIcon className="h-6 w-6 mr-2 text-primary-400" />
              Select Document Type
            </h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {documentTypes.map((doc, index) => {
                const Icon = doc.icon;
                const isSelected = documentType === doc.type;
                
                return (
                  <button
                    key={doc.type}
                    type="button"
                    onClick={() => setDocumentType(doc.type)}
                    className={`group relative p-6 rounded-2xl border-2 transition-all duration-300 transform hover:scale-105 animate-slide-up ${
                      isSelected
                        ? 'border-primary-500 bg-primary-500/10 shadow-glow'
                        : 'border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/30 bg-gray-50 dark:bg-white/5'
                    }`}
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    {/* Background Gradient */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${doc.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-2xl`} />
                    
                    {/* Content */}
                    <div className="relative flex flex-col items-center text-center">
                      <div className={`p-4 rounded-xl mb-4 transition-all duration-300 ${
                        isSelected
                          ? `bg-gradient-to-br ${doc.gradient} shadow-glow scale-110`
                          : 'bg-gray-100 dark:bg-white/10 group-hover:bg-gray-200 dark:group-hover:bg-white/20'
                      }`}>
                        <Icon className="w-10 h-10 text-white" />
                      </div>
                      <h3 className={`font-bold text-lg mb-2 transition-colors ${
                        isSelected ? 'text-gray-900 dark:text-white' : 'text-gray-900 dark:text-gray-200 group-hover:text-gray-900 dark:group-hover:text-white'
                      }`}>
                        {doc.title}
                      </h3>
                      <p className={`text-sm transition-colors ${
                        isSelected ? 'text-gray-700 dark:text-gray-200' : 'text-gray-600 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300'
                      }`}>{doc.description}</p>
                      
                      {/* Selected Indicator */}
                      {isSelected && (
                        <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center shadow-glow animate-scale-in">
                          <CheckCircleIcon className="w-5 h-5 text-white" />
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Form Section */}
        <div className="glass-card animate-slide-up delay-300">
          <div className="p-6 border-b border-white/10">
            <h2 className="text-xl font-bold gradient-text">
              {documentTypes.find(d => d.type === documentType)?.title} Details
            </h2>
          </div>
          <div className="p-6">
            {renderForm()}
          </div>
        </div>
      </div>
    </Layout>
  );
};