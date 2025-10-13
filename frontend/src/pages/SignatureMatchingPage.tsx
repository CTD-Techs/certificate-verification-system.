import React, { useState } from 'react';
import { Layout } from '../components/layout';
import { Card, Button, DocumentUpload } from '../components/common';
import { SignatureMatcher } from '../components/verification';
import { documentProcessingService } from '../services/document-processing.service';
import { SignatureMatchResult } from '../types/certificate.types';
import { AlertCircle, CheckCircle } from 'lucide-react';

export const SignatureMatchingPage: React.FC = () => {
  const [signature1File, setSignature1File] = useState<File | null>(null);
  const [signature2File, setSignature2File] = useState<File | null>(null);
  const [signature1Url, setSignature1Url] = useState<string | null>(null);
  const [signature2Url, setSignature2Url] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [matchResult, setMatchResult] = useState<SignatureMatchResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSignature1Select = (file: File) => {
    setSignature1File(file);
    setSignature1Url(URL.createObjectURL(file));
    setError(null);
    setMatchResult(null);
  };

  const handleSignature2Select = (file: File) => {
    setSignature2File(file);
    setSignature2Url(URL.createObjectURL(file));
    setError(null);
    setMatchResult(null);
  };

  const handleSignature1Remove = () => {
    if (signature1Url) {
      URL.revokeObjectURL(signature1Url);
    }
    setSignature1File(null);
    setSignature1Url(null);
    setMatchResult(null);
  };

  const handleSignature2Remove = () => {
    if (signature2Url) {
      URL.revokeObjectURL(signature2Url);
    }
    setSignature2File(null);
    setSignature2Url(null);
    setMatchResult(null);
  };

  const handleCompareSignatures = async () => {
    if (!signature1File || !signature2File) {
      setError('Please upload both signatures to compare');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Upload both signatures and get their processing IDs
      const formData1 = new FormData();
      formData1.append('document', signature1File);
      
      const formData2 = new FormData();
      formData2.append('document', signature2File);

      // For signature matching, we need to send the files directly
      const result = await documentProcessingService.matchSignatures({
        signature1: signature1File,
        signature2: signature2File,
      } as any);

      setMatchResult(result);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to compare signatures. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Signature Matching</h1>
          <p className="mt-2 text-sm text-gray-700 dark:text-gray-200">
            Upload two signatures to compare and verify their authenticity using advanced image analysis.
          </p>
        </div>

        {/* Upload Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* First Signature Upload */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Upload First Signature
            </h3>
            <p className="text-sm text-gray-700 dark:text-gray-200 mb-4">
              Upload the first signature image (e.g., from Aadhaar card)
            </p>
            <DocumentUpload
              onFileSelect={handleSignature1Select}
              onFileRemove={handleSignature1Remove}
              selectedFile={signature1File}
              isProcessing={false}
              accept="image/*"
            />
            {signature1Url && (
              <div className="mt-4">
                <p className="text-sm text-gray-700 dark:text-gray-200 mb-2">Preview:</p>
                <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-800 p-4">
                  <img
                    src={signature1Url}
                    alt="First Signature"
                    className="max-w-full h-auto mx-auto"
                    style={{ maxHeight: '200px' }}
                  />
                </div>
              </div>
            )}
          </Card>

          {/* Second Signature Upload */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Upload Second Signature
            </h3>
            <p className="text-sm text-gray-700 dark:text-gray-200 mb-4">
              Upload the second signature image (e.g., from PAN card)
            </p>
            <DocumentUpload
              onFileSelect={handleSignature2Select}
              onFileRemove={handleSignature2Remove}
              selectedFile={signature2File}
              isProcessing={false}
              accept="image/*"
            />
            {signature2Url && (
              <div className="mt-4">
                <p className="text-sm text-gray-700 dark:text-gray-200 mb-2">Preview:</p>
                <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-800 p-4">
                  <img
                    src={signature2Url}
                    alt="Second Signature"
                    className="max-w-full h-auto mx-auto"
                    style={{ maxHeight: '200px' }}
                  />
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Compare Button */}
        <div className="flex justify-center mb-6">
          <Button
            onClick={handleCompareSignatures}
            isLoading={isProcessing}
            disabled={!signature1File || !signature2File || isProcessing}
            size="lg"
            className="px-8"
          >
            {isProcessing ? 'Comparing Signatures...' : 'Compare Signatures'}
          </Button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 mr-3" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-800">Error</p>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Processing Status */}
        {isProcessing && (
          <div className="mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-800">Processing Signatures</p>
                  <p className="text-sm text-blue-700 mt-1">
                    Analyzing and comparing signatures using advanced algorithms. This may take a few moments...
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Match Results */}
        {matchResult && !isProcessing && (
          <div>
            <div className="mb-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 mr-3" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-green-800">Comparison Complete</p>
                    <p className="text-sm text-green-700 mt-1">
                      The signature comparison has been completed. Review the detailed results below.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <SignatureMatcher
              matchResult={matchResult}
              document1Url={signature1Url || undefined}
              document2Url={signature2Url || undefined}
            />
          </div>
        )}

        {/* Information Card */}
        {!matchResult && !isProcessing && (
          <Card className="p-6 bg-blue-50 border-blue-200">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div className="text-sm text-blue-800">
                <p className="font-medium">How Signature Matching Works</p>
                <ul className="mt-2 space-y-1 list-disc list-inside">
                  <li>Upload clear images of both signatures</li>
                  <li>Our system uses multiple algorithms including perceptual hashing, SSIM, and histogram analysis</li>
                  <li>Results include detailed metrics and confidence scores</li>
                  <li>Supported formats: JPG, PNG, PDF</li>
                  <li>All data is processed securely and encrypted</li>
                </ul>
              </div>
            </div>
          </Card>
        )}
      </div>
    </Layout>
  );
};