import React, { useState } from 'react';
import { Input, Button, Card } from '../common';
import { FileUpload } from '../common/FileUpload';
import { CheckCircle, AlertCircle } from 'lucide-react';

interface CertificateFormProps {
  onSubmit: (data: any) => void;
  onCancel?: () => void;
  isLoading?: boolean;
}

export const CertificateForm: React.FC<CertificateFormProps> = ({
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    certificateType: 'SCHOOL_CERTIFICATE',
    issuerType: 'CBSE',
    issuerName: '',
    studentName: '',
    rollNumber: '',
    dateOfBirth: '',
    examYear: '',
    issueDate: '',
    issuerRegistrationNumber: '',
  });
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setError(null);
  };

  const handleFileRemove = () => {
    setSelectedFile(null);
    setError(null);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile) {
      setError('Please select a certificate file to upload');
      return;
    }

    // Validate required fields
    if (!formData.studentName || !formData.rollNumber || !formData.dateOfBirth) {
      setError('Please fill in all required fields');
      return;
    }

    // Create FormData for file upload
    const submitData = new FormData();
    submitData.append('file', selectedFile);
    submitData.append('certificateType', formData.certificateType);
    submitData.append('issuerType', formData.issuerType);
    submitData.append('issuerName', formData.issuerName);
    submitData.append('studentName', formData.studentName);
    submitData.append('rollNumber', formData.rollNumber);
    submitData.append('dateOfBirth', formData.dateOfBirth);
    submitData.append('examYear', formData.examYear);
    submitData.append('issueDate', formData.issueDate);
    if (formData.issuerRegistrationNumber) {
      submitData.append('issuerRegistrationNumber', formData.issuerRegistrationNumber);
    }

    onSubmit(submitData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Upload Section */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Upload Educational Certificate</h3>
        <FileUpload
          onChange={handleFileSelect}
          currentFile={selectedFile}
          accept=".pdf,.jpg,.jpeg,.png"
          maxSize={10}
        />
        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 mr-3" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-800">Error</p>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Certificate Information */}
      <Card className="p-6">
        <h4 className="text-md font-semibold text-gray-200 mb-4">Certificate Information</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-white mb-1">
              Certificate Type<span className="text-red-500 ml-1">*</span>
            </label>
            <select
              value={formData.certificateType}
              onChange={(e) => handleInputChange('certificateType', e.target.value)}
              required
              className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white/10 text-white backdrop-blur-sm border-white/20 hover:bg-white/15"
            >
              <option value="SCHOOL_CERTIFICATE" className="bg-gray-800 text-white">School Certificate</option>
              <option value="DIPLOMA" className="bg-gray-800 text-white">Diploma</option>
              <option value="DEGREE" className="bg-gray-800 text-white">Degree</option>
              <option value="MARKSHEET" className="bg-gray-800 text-white">Marksheet</option>
              <option value="OTHER" className="bg-gray-800 text-white">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-1">
              Issuer Type<span className="text-red-500 ml-1">*</span>
            </label>
            <select
              value={formData.issuerType}
              onChange={(e) => handleInputChange('issuerType', e.target.value)}
              required
              className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white/10 text-white backdrop-blur-sm border-white/20 hover:bg-white/15"
            >
              <option value="CBSE" className="bg-gray-800 text-white">CBSE</option>
              <option value="ICSE" className="bg-gray-800 text-white">ICSE</option>
              <option value="STATE_BOARD" className="bg-gray-800 text-white">State Board</option>
              <option value="UNIVERSITY" className="bg-gray-800 text-white">University</option>
              <option value="OTHER" className="bg-gray-800 text-white">Other</option>
            </select>
          </div>

          <Input
            label="Issuer Name"
            value={formData.issuerName}
            onChange={(e) => handleInputChange('issuerName', e.target.value)}
            placeholder="e.g., Central Board of Secondary Education"
            required
          />

          <Input
            label="Registration Number (Optional)"
            value={formData.issuerRegistrationNumber}
            onChange={(e) => handleInputChange('issuerRegistrationNumber', e.target.value)}
            placeholder="e.g., REG123456"
          />
        </div>
      </Card>

      {/* Student Information */}
      <Card className="p-6">
        <h4 className="text-md font-semibold text-gray-200 mb-4">Student Information</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Student Name"
            value={formData.studentName}
            onChange={(e) => handleInputChange('studentName', e.target.value)}
            placeholder="Full name as on certificate"
            required
          />

          <Input
            label="Roll Number"
            value={formData.rollNumber}
            onChange={(e) => handleInputChange('rollNumber', e.target.value)}
            placeholder="e.g., 12345678"
            required
          />

          <Input
            label="Date of Birth"
            type="date"
            value={formData.dateOfBirth}
            onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
            required
          />
        </div>
      </Card>

      {/* Certificate Details */}
      <Card className="p-6">
        <h4 className="text-md font-semibold text-gray-200 mb-4">Certificate Details</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Exam Year"
            value={formData.examYear}
            onChange={(e) => handleInputChange('examYear', e.target.value)}
            placeholder="e.g., 2023"
            required
          />

          <Input
            label="Issue Date"
            type="date"
            value={formData.issueDate}
            onChange={(e) => handleInputChange('issueDate', e.target.value)}
            required
          />
        </div>
      </Card>

      {/* Privacy Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div className="text-sm text-blue-800">
            <p className="font-medium">Privacy & Security</p>
            <p className="mt-1">
              Your certificate will be securely stored and verified. 
              All information is encrypted and used only for verification purposes.
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 justify-end border-t border-gray-200 pt-4">
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
          type="submit"
          isLoading={isLoading}
          className="flex items-center gap-2"
        >
          <CheckCircle className="w-4 h-4" />
          Upload & Verify Certificate
        </Button>
      </div>
    </form>
  );
};