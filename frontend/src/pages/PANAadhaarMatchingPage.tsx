import React, { useState, useEffect } from 'react';
import { Layout } from '../components/layout';
import { Card, Button, Select } from '../components/common';
import { PANAadhaarMatcher } from '../components/verification';
import { documentProcessingService } from '../services/document-processing.service';
import { MatchResult, DocumentProcessing } from '../types/certificate.types';
import { AlertCircle, CheckCircle } from 'lucide-react';

export const PANAadhaarMatchingPage: React.FC = () => {
  const [documents, setDocuments] = useState<DocumentProcessing[]>([]);
  const [aadhaarDocId, setAadhaarDocId] = useState<string>('');
  const [panDocId, setPanDocId] = useState<string>('');
  const [isLoadingDocs, setIsLoadingDocs] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load user's documents on mount
  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    setIsLoadingDocs(true);
    try {
      const response = await documentProcessingService.listDocuments({
        status: 'completed',
      });
      setDocuments(response.documents);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load documents');
    } finally {
      setIsLoadingDocs(false);
    }
  };

  const aadhaarDocuments = documents.filter(
    (doc) => doc.documentType === 'aadhaar'
  );

  const panDocuments = documents.filter(
    (doc) => doc.documentType === 'pan'
  );

  const aadhaarOptions = aadhaarDocuments.map((doc) => ({
    value: doc.id,
    label: `Aadhaar - ${new Date(doc.createdAt).toLocaleDateString()} (${doc.status})`,
  }));

  const panOptions = panDocuments.map((doc) => ({
    value: doc.id,
    label: `PAN - ${new Date(doc.createdAt).toLocaleDateString()} (${doc.status})`,
  }));

  const handleMatchDocuments = async () => {
    if (!aadhaarDocId || !panDocId) {
      setError('Please select both Aadhaar and PAN documents');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const result = await documentProcessingService.matchPANAadhaar({
        panId: panDocId,
        aadhaarId: aadhaarDocId,
      });

      setMatchResult(result);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to match documents. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const getSelectedAadhaarDoc = () => {
    return aadhaarDocuments.find((doc) => doc.id === aadhaarDocId);
  };

  const getSelectedPanDoc = () => {
    return panDocuments.find((doc) => doc.id === panDocId);
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">PAN-Aadhaar Matching</h1>
          <p className="mt-2 text-sm text-gray-700 dark:text-gray-200">
            Select your uploaded PAN and Aadhaar documents to verify if the information matches.
          </p>
        </div>

        {/* Document Selection Section */}
        <Card className="p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Select Documents to Match</h3>

          {isLoadingDocs ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-700 dark:text-gray-200">Loading your documents...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Aadhaar Selection */}
              <div>
                <Select
                  label="Select Aadhaar Document"
                  value={aadhaarDocId}
                  onChange={setAadhaarDocId}
                  options={aadhaarOptions}
                  placeholder="Choose an Aadhaar document"
                  required
                />
                {aadhaarDocId && getSelectedAadhaarDoc() && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Document Details:</p>
                    <p className="text-sm text-gray-900 dark:text-white">
                      <span className="font-medium">Status:</span>{' '}
                      {getSelectedAadhaarDoc()?.status}
                    </p>
                    <p className="text-sm text-gray-900 dark:text-white">
                      <span className="font-medium">Uploaded:</span>{' '}
                      {new Date(getSelectedAadhaarDoc()!.createdAt).toLocaleString()}
                    </p>
                  </div>
                )}
                {aadhaarOptions.length === 0 && (
                  <p className="mt-2 text-sm text-amber-600">
                    No Aadhaar documents found. Please upload an Aadhaar card first.
                  </p>
                )}
              </div>

              {/* PAN Selection */}
              <div>
                <Select
                  label="Select PAN Document"
                  value={panDocId}
                  onChange={setPanDocId}
                  options={panOptions}
                  placeholder="Choose a PAN document"
                  required
                />
                {panDocId && getSelectedPanDoc() && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Document Details:</p>
                    <p className="text-sm text-gray-900 dark:text-white">
                      <span className="font-medium">Status:</span>{' '}
                      {getSelectedPanDoc()?.status}
                    </p>
                    <p className="text-sm text-gray-900 dark:text-white">
                      <span className="font-medium">Uploaded:</span>{' '}
                      {new Date(getSelectedPanDoc()!.createdAt).toLocaleString()}
                    </p>
                  </div>
                )}
                {panOptions.length === 0 && (
                  <p className="mt-2 text-sm text-amber-600">
                    No PAN documents found. Please upload a PAN card first.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Match Button */}
          <div className="flex justify-center mt-6">
            <Button
              onClick={handleMatchDocuments}
              isLoading={isProcessing}
              disabled={!aadhaarDocId || !panDocId || isProcessing || isLoadingDocs}
              size="lg"
              className="px-8"
            >
              {isProcessing ? 'Matching Documents...' : 'Match Documents'}
            </Button>
          </div>
        </Card>

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
                  <p className="text-sm font-medium text-blue-800">Processing Documents</p>
                  <p className="text-sm text-blue-700 mt-1">
                    Comparing PAN and Aadhaar information. This may take a few moments...
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
                    <p className="text-sm font-medium text-green-800">Matching Complete</p>
                    <p className="text-sm text-green-700 mt-1">
                      The document matching has been completed. Review the detailed results below.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <PANAadhaarMatcher matchResult={matchResult} />
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
                <p className="font-medium">How PAN-Aadhaar Matching Works</p>
                <ul className="mt-2 space-y-1 list-disc list-inside">
                  <li>Select your previously uploaded PAN and Aadhaar documents</li>
                  <li>Our system compares key fields like name, date of birth, and address</li>
                  <li>Results show field-by-field comparison with match scores</li>
                  <li>Helps verify identity consistency across documents</li>
                  <li>All comparisons are performed securely with encrypted data</li>
                </ul>
                <p className="mt-3 text-xs">
                  <span className="font-medium">Note:</span> Make sure you have uploaded both PAN and Aadhaar documents before attempting to match them.
                </p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </Layout>
  );
};