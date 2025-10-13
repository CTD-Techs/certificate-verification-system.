import React, { useState } from 'react';
import { DocumentUpload, Button, Card } from '../common';
import { documentProcessingService } from '../../services/document-processing.service';
import { CheckCircle, Edit2, AlertCircle } from 'lucide-react';

interface PANCardFormProps {
  onSubmit: (data: any) => void;
  onCancel?: () => void;
  isLoading?: boolean;
}

interface ExtractedData {
  panNumber: string;
  holderName: string;
  fatherName: string;
  dateOfBirth: string;
  category: string;
  address: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    pincode: string;
  };
  photoUrl?: string;
  signatureUrl?: string;
  aadhaarLinked?: boolean;
}

type ProcessingState = 'idle' | 'uploading' | 'processing' | 'completed' | 'error';

export const PANCardForm: React.FC<PANCardFormProps> = ({
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [processingState, setProcessingState] = useState<ProcessingState>('idle');
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<ExtractedData | null>(null);

  const handleFileSelect = async (file: File) => {
    setSelectedFile(file);
    setError(null);
    setProcessingState('uploading');

    try {
      // Upload and process the document
      const result = await documentProcessingService.uploadPAN(file);
      
      console.log('[PANCardForm] Upload successful, result:', result);
      
      // Check if ID exists before proceeding
      if (!result?.id) {
        console.error('[PANCardForm] No document ID in response:', result);
        throw new Error('No document ID received from server');
      }
      
      setProcessingId(result.id);
      setProcessingState('processing');

      // Poll for processing completion
      await pollProcessingStatus(result.id);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to upload document. Please try again.');
      setProcessingState('error');
    }
  };

  const pollProcessingStatus = async (id: string) => {
    const maxAttempts = 30;
    let attempts = 0;

    const poll = async () => {
      try {
        const status = await documentProcessingService.getProcessingStatus(id);

        if (status.status === 'completed') {
          // Fetch extracted data
          const data = await documentProcessingService.getExtractedData(id);
          setExtractedData(data.extractedFields as ExtractedData);
          setEditedData(data.extractedFields as ExtractedData);
          setProcessingState('completed');
        } else if (status.status === 'failed') {
          setError('Document processing failed. Please try uploading again.');
          setProcessingState('error');
        } else if (attempts < maxAttempts) {
          attempts++;
          setTimeout(poll, 2000); // Poll every 2 seconds
        } else {
          setError('Processing timeout. Please try again.');
          setProcessingState('error');
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to check processing status.');
        setProcessingState('error');
      }
    };

    poll();
  };

  const handleFileRemove = () => {
    setSelectedFile(null);
    setProcessingState('idle');
    setExtractedData(null);
    setEditedData(null);
    setProcessingId(null);
    setError(null);
    setIsEditing(false);
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleFieldChange = (field: string, value: string | boolean) => {
    if (!editedData) return;

    if (field.startsWith('address.')) {
      const addressField = field.split('.')[1];
      setEditedData({
        ...editedData,
        address: { ...editedData.address, [addressField]: value },
      });
    } else {
      setEditedData({ ...editedData, [field]: value });
    }
  };

  const handleSaveEdits = async () => {
    if (!processingId || !editedData) return;

    try {
      await documentProcessingService.submitCorrections(processingId, {
        correctedFields: editedData,
      });
      setExtractedData(editedData);
      setIsEditing(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save corrections.');
    }
  };

  const handleConfirmAndVerify = () => {
    if (!extractedData) return;

    const requestData = {
      certificateType: 'PAN_CARD',
      issuerType: 'INCOME_TAX',
      issuerName: 'Income Tax Department',
      panData: extractedData,
      documentProcessingId: processingId,
    };

    onSubmit(requestData);
  };

  const renderExtractedData = () => {
    if (!extractedData) return null;

    const data = isEditing ? editedData! : extractedData;

    return (
      <div className="space-y-6 mt-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Extracted Information</h3>
          {!isEditing && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleEdit}
              className="flex items-center gap-2"
            >
              <Edit2 className="w-4 h-4" />
              Edit
            </Button>
          )}
        </div>

        {/* PAN Information Card */}
        <Card className="p-6">
          <h4 className="text-md font-semibold text-gray-800 mb-4">PAN Card Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white mb-1">
                PAN Number
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={data.panNumber}
                  onChange={(e) => handleFieldChange('panNumber', e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  maxLength={10}
                />
              ) : (
                <p className="text-white font-mono">{data.panNumber}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-white mb-1">
                Category
              </label>
              {isEditing ? (
                <select
                  value={data.category}
                  onChange={(e) => handleFieldChange('category', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Individual">Individual</option>
                  <option value="Company">Company</option>
                  <option value="HUF">Hindu Undivided Family (HUF)</option>
                  <option value="Firm">Firm/Partnership</option>
                  <option value="AOP">Association of Persons (AOP)</option>
                  <option value="Trust">Trust</option>
                  <option value="Government">Government</option>
                  <option value="Other">Other</option>
                </select>
              ) : (
                <p className="text-white">{data.category}</p>
              )}
            </div>
          </div>
        </Card>

        {/* Personal Information Card */}
        <Card className="p-6">
          <h4 className="text-md font-semibold text-gray-800 mb-4">Personal Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white mb-1">
                Full Name
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={data.holderName}
                  onChange={(e) => handleFieldChange('holderName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <p className="text-white">{data.holderName}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-white mb-1">
                Father's Name
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={data.fatherName}
                  onChange={(e) => handleFieldChange('fatherName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <p className="text-white">{data.fatherName}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-white mb-1">
                Date of Birth
              </label>
              {isEditing ? (
                <input
                  type="date"
                  value={data.dateOfBirth}
                  onChange={(e) => handleFieldChange('dateOfBirth', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <p className="text-white">{new Date(data.dateOfBirth).toLocaleDateString()}</p>
              )}
            </div>
          </div>
        </Card>

        {/* Address Card */}
        <Card className="p-6">
          <h4 className="text-md font-semibold text-gray-800 mb-4">Address</h4>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-white mb-1">
                Address Line 1
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={data.address.line1}
                  onChange={(e) => handleFieldChange('address.line1', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <p className="text-white">{data.address.line1}</p>
              )}
            </div>
            {data.address.line2 && (
              <div>
                <label className="block text-sm font-medium text-white mb-1">
                  Address Line 2
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={data.address.line2}
                    onChange={(e) => handleFieldChange('address.line2', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-white">{data.address.line2}</p>
                )}
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-white mb-1">
                  City
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={data.address.city}
                    onChange={(e) => handleFieldChange('address.city', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-white">{data.address.city}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-1">
                  State
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={data.address.state}
                    onChange={(e) => handleFieldChange('address.state', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-white">{data.address.state}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-1">
                  Pincode
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={data.address.pincode}
                    onChange={(e) => handleFieldChange('address.pincode', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    maxLength={6}
                  />
                ) : (
                  <p className="text-white">{data.address.pincode}</p>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Aadhaar Linkage Card */}
        <Card className="p-6">
          <h4 className="text-md font-semibold text-gray-800 mb-4">Aadhaar Linkage</h4>
          <div className="flex items-center">
            {isEditing ? (
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={data.aadhaarLinked || false}
                  onChange={(e) => handleFieldChange('aadhaarLinked', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-white">
                  My PAN is linked with Aadhaar
                </span>
              </label>
            ) : (
              <div className="flex items-center">
                <div className={`w-4 h-4 rounded border ${data.aadhaarLinked ? 'bg-blue-600 border-blue-600' : 'border-gray-300'} flex items-center justify-center`}>
                  {data.aadhaarLinked && (
                    <CheckCircle className="w-3 h-3 text-white" />
                  )}
                </div>
                <span className="ml-2 text-sm text-white">
                  {data.aadhaarLinked ? 'PAN is linked with Aadhaar' : 'PAN is not linked with Aadhaar'}
                </span>
              </div>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            As per government regulations, linking PAN with Aadhaar is mandatory for most taxpayers.
          </p>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-3 justify-end border-t border-gray-200 pt-4">
          {isEditing ? (
            <>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setEditedData(extractedData);
                  setIsEditing(false);
                }}
              >
                Cancel
              </Button>
              <Button type="button" onClick={handleSaveEdits}>
                Save Changes
              </Button>
            </>
          ) : (
            <>
              {onCancel && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={onCancel}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
              )}
              <Button
                type="button"
                onClick={handleConfirmAndVerify}
                isLoading={isLoading}
                className="flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Confirm & Verify
              </Button>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Upload PAN Card</h3>
        <DocumentUpload
          onFileSelect={handleFileSelect}
          onFileRemove={handleFileRemove}
          selectedFile={selectedFile}
          isProcessing={processingState === 'uploading' || processingState === 'processing'}
          error={error}
          success={processingState === 'completed'}
        />
      </div>

      {/* Processing Status */}
      {processingState === 'processing' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3"></div>
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-800">Processing Document</p>
              <p className="text-sm text-blue-700 mt-1">
                Extracting information from your PAN card. This may take a few moments...
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {processingState === 'completed' && !isEditing && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 mr-3" />
            <div className="flex-1">
              <p className="text-sm font-medium text-green-800">Document Processed Successfully</p>
              <p className="text-sm text-green-700 mt-1">
                Please review the extracted information below and make any necessary corrections before verification.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {processingState === 'error' && error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 mr-3" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800">Processing Error</p>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Extracted Data Display */}
      {renderExtractedData()}

      {/* Privacy Notice */}
      {processingState === 'idle' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div className="text-sm text-blue-800">
              <p className="font-medium">Privacy & Security</p>
              <p className="mt-1">
                Your PAN document will be securely processed using OCR technology. 
                All information is encrypted and stored securely for verification purposes as per Income Tax regulations.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};