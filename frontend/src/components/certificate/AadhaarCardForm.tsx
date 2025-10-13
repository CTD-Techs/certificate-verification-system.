import React, { useState } from 'react';
import { DocumentUpload, Button, Card } from '../common';
import { documentProcessingService } from '../../services/document-processing.service';
import { CheckCircle, Edit2, AlertCircle } from 'lucide-react';

interface AadhaarCardFormProps {
  onSubmit: (data: any) => void;
  onCancel?: () => void;
  isLoading?: boolean;
}

interface ExtractedData {
  aadhaarNumber: string;
  holderName: string;
  dateOfBirth: string;
  gender: string;
  address: {
    house: string;
    street: string;
    locality: string;
    city: string;
    state: string;
    pincode: string;
  };
  mobileNumber?: string;
  email?: string;
  photoUrl?: string;
}

type ProcessingState = 'idle' | 'uploading' | 'processing' | 'completed' | 'error';

/**
 * Parse address string into components
 * Example: "Mahadeo Mandir Chauk, Morane Pr. Laling, Morane-laling, Dhule, Dhule, Maharashtra - 424002"
 */
const parseAddress = (addressString: string): ExtractedData['address'] => {
  if (!addressString) {
    return {
      house: '',
      street: '',
      locality: '',
      city: '',
      state: '',
      pincode: '',
    };
  }

  // Extract pincode (6 digits, usually at the end)
  const pincodeMatch = addressString.match(/\b(\d{6})\b/);
  const pincode = pincodeMatch ? pincodeMatch[1] : '';

  // Extract state (common Indian states)
  const statePattern = /(Maharashtra|Karnataka|Tamil Nadu|Kerala|Gujarat|Rajasthan|Punjab|Haryana|Uttar Pradesh|Madhya Pradesh|Bihar|West Bengal|Andhra Pradesh|Telangana|Odisha|Assam|Jharkhand|Chhattisgarh|Uttarakhand|Himachal Pradesh|Goa|Delhi|Jammu and Kashmir|Ladakh|Puducherry|Chandigarh|Sikkim|Meghalaya|Manipur|Mizoram|Nagaland|Tripura|Arunachal Pradesh)/i;
  const stateMatch = addressString.match(statePattern);
  const state = stateMatch ? stateMatch[1] : '';

  // Split address by commas
  const parts = addressString.split(',').map(p => p.trim());

  // Try to identify components
  let house = '';
  let street = '';
  let locality = '';
  let city = '';

  if (parts.length >= 4) {
    // First part is usually house/building
    house = parts[0];
    // Second part is street/area
    street = parts[1];
    // Third part is locality
    locality = parts[2];
    // Fourth part or the one before state is city
    const cityIndex = parts.findIndex(p => p.toLowerCase().includes(state.toLowerCase()));
    if (cityIndex > 0) {
      city = parts[cityIndex - 1];
    } else if (parts.length > 3) {
      city = parts[parts.length - 2].replace(/\s*-\s*\d{6}/, '').trim();
    }
  } else if (parts.length === 3) {
    locality = parts[0];
    city = parts[1];
  } else if (parts.length === 2) {
    locality = parts[0];
    city = parts[1].replace(/\s*-\s*\d{6}/, '').trim();
  } else {
    locality = addressString.replace(/\s*-\s*\d{6}/, '').replace(state, '').trim();
  }

  return {
    house,
    street,
    locality,
    city,
    state,
    pincode,
  };
};

/**
 * Convert date from DD/MM/YYYY to YYYY-MM-DD format
 */
const convertDateFormat = (dateString: string): string => {
  if (!dateString) return '';
  
  // Handle DD/MM/YYYY or DD-MM-YYYY format
  const match = dateString.match(/^(\d{2})[\/\-](\d{2})[\/\-](\d{4})$/);
  if (match) {
    const [, day, month, year] = match;
    return `${year}-${month}-${day}`;
  }
  
  // If already in YYYY-MM-DD format, return as is
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return dateString;
  }
  
  return dateString;
};

export const AadhaarCardForm: React.FC<AadhaarCardFormProps> = ({
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
    console.log('[AadhaarCardForm] handleFileSelect called with:', file.name);
    
    try {
      setSelectedFile(file);
      setError(null);
      setProcessingState('uploading');
      
      console.log('[AadhaarCardForm] State updated, calling uploadAadhaar...');

      // Upload and process the document
      const result = await documentProcessingService.uploadAadhaar(file);
      
      console.log('[AadhaarCardForm] Upload successful, result:', result);
      
      // Check if ID exists before proceeding
      if (!result?.id) {
        console.error('[AadhaarCardForm] No document ID in response:', result);
        throw new Error('No document ID received from server');
      }
      
      setProcessingId(result.id);
      setProcessingState('processing');

      // Poll for processing completion
      await pollProcessingStatus(result.id);
    } catch (err: any) {
      console.error('[AadhaarCardForm] Error in handleFileSelect:', err);
      console.error('[AadhaarCardForm] Error details:', {
        message: err.message,
        response: err.response,
        status: err.response?.status,
        data: err.response?.data
      });
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
          
          // Map backend fields to frontend structure
          const backendFields = data.extractedFields as any;
          console.log('[AadhaarCardForm] Backend extracted fields:', backendFields);
          
          // Parse address string into components
          const addressComponents = parseAddress(backendFields.address || '');
          
          const mappedData: ExtractedData = {
            aadhaarNumber: backendFields.aadhaarNumber || '',
            holderName: backendFields.name || '', // Map 'name' to 'holderName'
            dateOfBirth: backendFields.dateOfBirth ? convertDateFormat(backendFields.dateOfBirth) : '',
            gender: backendFields.gender || '',
            address: addressComponents,
            mobileNumber: backendFields.mobileNumber || undefined,
            email: backendFields.email || undefined,
          };
          
          console.log('[AadhaarCardForm] Mapped data:', mappedData);
          
          setExtractedData(mappedData);
          setEditedData(mappedData);
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

  const handleFieldChange = (field: string, value: string) => {
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
    if (!extractedData) {
      console.error('[AadhaarCardForm] No extracted data available');
      setError('No data available to verify');
      return;
    }

    // Validate required fields
    const validationErrors: string[] = [];
    
    if (!extractedData.holderName || extractedData.holderName.trim() === '') {
      validationErrors.push('Full Name is required');
    }
    if (!extractedData.aadhaarNumber || extractedData.aadhaarNumber.trim() === '') {
      validationErrors.push('Aadhaar Number is required');
    }
    if (!extractedData.dateOfBirth || extractedData.dateOfBirth.trim() === '') {
      validationErrors.push('Date of Birth is required');
    }
    
    if (validationErrors.length > 0) {
      console.error('[AadhaarCardForm] Validation errors:', validationErrors);
      setError(`Invalid data: ${validationErrors.join(', ')}`);
      return;
    }

    // Clear any previous errors
    setError(null);
    
    // Convert gender to single character format (M/F/O)
    const genderMap: { [key: string]: 'M' | 'F' | 'O' } = {
      'Male': 'M',
      'Female': 'F',
      'Other': 'O',
      'M': 'M',
      'F': 'F',
      'O': 'O'
    };
    const gender = genderMap[extractedData.gender] || 'O';

    // Convert address to backend format
    const address = {
      line1: extractedData.address.house || extractedData.address.street || '',
      line2: extractedData.address.locality || '',
      city: extractedData.address.city || '',
      state: extractedData.address.state || '',
      pincode: extractedData.address.pincode || '',
    };

    // Map frontend field names to backend expected names
    const requestData = {
      certificateType: 'AADHAAR_CARD' as const,
      issuerType: 'UIDAI' as const,
      issuerName: 'Unique Identification Authority of India' as const,
      aadhaar: {  // Backend expects 'aadhaar', not 'aadhaarData'
        aadhaarNumber: extractedData.aadhaarNumber.replace(/\s/g, ''),  // Remove all spaces
        name: extractedData.holderName,  // Backend expects 'name', not 'holderName'
        dob: extractedData.dateOfBirth,  // Backend expects 'dob', not 'dateOfBirth'
        gender: gender,  // Backend expects 'M'/'F'/'O', not full text
        address: address,  // Backend expects specific address format
      },
      documentProcessingId: processingId,
    };

    console.log('[AADHAAR] ===== SUBMITTING TO BACKEND =====');
    console.log('[AADHAAR] Original extracted data:', JSON.stringify(extractedData, null, 2));
    console.log('[AADHAAR] Transformed payload:', JSON.stringify(requestData, null, 2));
    console.log('[AADHAAR] Payload structure check:');
    console.log('[AADHAAR]   - certificateType:', requestData.certificateType);
    console.log('[AADHAAR]   - issuerType:', requestData.issuerType);
    console.log('[AADHAAR]   - issuerName:', requestData.issuerName);
    console.log('[AADHAAR]   - aadhaar object:', requestData.aadhaar);
    console.log('[AADHAAR]   - aadhaar.aadhaarNumber:', requestData.aadhaar.aadhaarNumber);
    console.log('[AADHAAR]   - aadhaar.name:', requestData.aadhaar.name);
    console.log('[AADHAAR]   - aadhaar.dob:', requestData.aadhaar.dob);
    console.log('[AADHAAR]   - aadhaar.gender:', requestData.aadhaar.gender);
    console.log('[AADHAAR]   - aadhaar.address:', JSON.stringify(requestData.aadhaar.address, null, 2));

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

        {/* Personal Information Card */}
        <Card className="p-6">
          <h4 className="text-md font-semibold text-gray-200 mb-4">Personal Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white mb-1">
                Aadhaar Number
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={data.aadhaarNumber}
                  onChange={(e) => handleFieldChange('aadhaarNumber', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  maxLength={12}
                />
              ) : (
                <p className="text-white font-mono">
                  {data.aadhaarNumber.replace(/(\d{4})(\d{4})(\d{4})/, '$1-$2-$3')}
                </p>
              )}
            </div>
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
            <div>
              <label className="block text-sm font-medium text-white mb-1">
                Gender
              </label>
              {isEditing ? (
                <select
                  value={data.gender}
                  onChange={(e) => handleFieldChange('gender', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              ) : (
                <p className="text-white">{data.gender}</p>
              )}
            </div>
          </div>
        </Card>

        {/* Address Card */}
        <Card className="p-6">
          <h4 className="text-md font-semibold text-gray-200 mb-4">Address</h4>
          <div className="space-y-3">
            {data.address.house && (
              <div>
                <label className="block text-sm font-medium text-white mb-1">
                  House/Flat No.
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={data.address.house}
                    onChange={(e) => handleFieldChange('address.house', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-white">{data.address.house}</p>
                )}
              </div>
            )}
            {data.address.street && (
              <div>
                <label className="block text-sm font-medium text-white mb-1">
                  Street/Road
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={data.address.street}
                    onChange={(e) => handleFieldChange('address.street', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-white">{data.address.street}</p>
                )}
              </div>
            )}
            {data.address.locality && (
              <div>
                <label className="block text-sm font-medium text-white mb-1">
                  Locality/Area
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={data.address.locality}
                    onChange={(e) => handleFieldChange('address.locality', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-white">{data.address.locality}</p>
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

        {/* Contact Information (if available) */}
        {(data.mobileNumber || data.email) && (
          <Card className="p-6">
            <h4 className="text-md font-semibold text-gray-200 mb-4">Contact Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.mobileNumber && (
                <div>
                  <label className="block text-sm font-medium text-white mb-1">
                    Mobile Number
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={data.mobileNumber}
                      onChange={(e) => handleFieldChange('mobileNumber', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      maxLength={10}
                    />
                  ) : (
                    <p className="text-white">{data.mobileNumber}</p>
                  )}
                </div>
              )}
              {data.email && (
                <div>
                  <label className="block text-sm font-medium text-white mb-1">
                    Email Address
                  </label>
                  {isEditing ? (
                    <input
                      type="email"
                      value={data.email}
                      onChange={(e) => handleFieldChange('email', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-white">{data.email}</p>
                  )}
                </div>
              )}
            </div>
          </Card>
        )}

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
        <h3 className="text-lg font-semibold text-white mb-4">Upload Aadhaar Card</h3>
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
                Extracting information from your Aadhaar card. This may take a few moments...
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
                Your Aadhaar document will be securely processed using OCR technology. 
                All information is encrypted and stored securely for verification purposes only.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};