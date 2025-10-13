import React, { useState } from 'react';
import { Input, Select, Button, FileUpload } from '../common';
import { CERTIFICATE_TYPES, ISSUER_TYPES } from '../../utils/constants';
import { CreateCertificateRequest } from '../../types';

interface CertificateFormProps {
  onSubmit: (data: CreateCertificateRequest) => void;
  onCancel?: () => void;
  isLoading?: boolean;
}

export const CertificateForm: React.FC<CertificateFormProps> = ({
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const [mode, setMode] = useState<'manual' | 'json'>('manual');
  const [jsonFile, setJsonFile] = useState<File | null>(null);
  const [formData, setFormData] = useState<CreateCertificateRequest>({
    certificateType: '',
    issuerType: '',
    studentName: '',
    rollNumber: '',
    dateOfBirth: '',
    examYear: '',
    issueDate: '',
    issuerName: '',
    issuerRegistrationNumber: '',
    qrCodeData: '',
    digitalSignature: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: keyof CreateCertificateRequest, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.certificateType) newErrors.certificateType = 'Certificate type is required';
    if (!formData.issuerType) newErrors.issuerType = 'Issuer type is required';
    if (!formData.studentName) newErrors.studentName = 'Student name is required';
    if (!formData.rollNumber) newErrors.rollNumber = 'Roll number is required';
    if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required';
    if (!formData.examYear) newErrors.examYear = 'Exam year is required';
    if (!formData.issueDate) newErrors.issueDate = 'Issue date is required';
    if (!formData.issuerName) newErrors.issuerName = 'Issuer name is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === 'json') {
      if (!jsonFile) {
        setErrors({ json: 'Please select a JSON file' });
        return;
      }

      try {
        const text = await jsonFile.text();
        const data = JSON.parse(text);
        onSubmit(data);
      } catch (error) {
        setErrors({ json: 'Invalid JSON file' });
      }
    } else {
      if (validateForm()) {
        onSubmit(formData);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Mode Selection */}
      <div className="flex gap-4 border-b border-gray-200 pb-4">
        <button
          type="button"
          onClick={() => setMode('manual')}
          className={`px-4 py-2 rounded-md font-medium transition-colors ${
            mode === 'manual'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Manual Entry
        </button>
        <button
          type="button"
          onClick={() => setMode('json')}
          className={`px-4 py-2 rounded-md font-medium transition-colors ${
            mode === 'json'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          JSON Upload
        </button>
      </div>

      {mode === 'json' ? (
        <FileUpload
          label="Upload Certificate JSON"
          accept=".json"
          onChange={setJsonFile}
          currentFile={jsonFile}
          error={errors.json}
          required
          maxSize={5}
        />
      ) : (
        <>
          {/* Certificate Type & Issuer Type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Certificate Type"
              value={formData.certificateType}
              onChange={(value) => handleInputChange('certificateType', value)}
              options={CERTIFICATE_TYPES}
              error={errors.certificateType}
              required
            />
            <Select
              label="Issuer Type"
              value={formData.issuerType}
              onChange={(value) => handleInputChange('issuerType', value)}
              options={ISSUER_TYPES}
              error={errors.issuerType}
              required
            />
          </div>

          {/* Student Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Student Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Student Name"
                value={formData.studentName}
                onChange={(value) => handleInputChange('studentName', value)}
                error={errors.studentName}
                required
              />
              <Input
                label="Roll Number"
                value={formData.rollNumber}
                onChange={(value) => handleInputChange('rollNumber', value)}
                error={errors.rollNumber}
                required
              />
            </div>
            <Input
              label="Date of Birth"
              type="date"
              value={formData.dateOfBirth}
              onChange={(value) => handleInputChange('dateOfBirth', value)}
              error={errors.dateOfBirth}
              required
            />
          </div>

          {/* Certificate Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Certificate Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Exam Year"
                value={formData.examYear}
                onChange={(value) => handleInputChange('examYear', value)}
                error={errors.examYear}
                required
              />
              <Input
                label="Issue Date"
                type="date"
                value={formData.issueDate}
                onChange={(value) => handleInputChange('issueDate', value)}
                error={errors.issueDate}
                required
              />
            </div>
          </div>

          {/* Issuer Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Issuer Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Issuer Name"
                value={formData.issuerName}
                onChange={(value) => handleInputChange('issuerName', value)}
                error={errors.issuerName}
                required
              />
              <Input
                label="Registration Number"
                value={formData.issuerRegistrationNumber}
                onChange={(value) => handleInputChange('issuerRegistrationNumber', value)}
                error={errors.issuerRegistrationNumber}
              />
            </div>
          </div>

          {/* Optional Fields */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Optional Information</h3>
            <Input
              label="QR Code Data"
              value={formData.qrCodeData}
              onChange={(value) => handleInputChange('qrCodeData', value)}
            />
            <Input
              label="Digital Signature"
              value={formData.digitalSignature}
              onChange={(value) => handleInputChange('digitalSignature', value)}
            />
          </div>
        </>
      )}

      {/* Actions */}
      <div className="flex gap-3 justify-end border-t border-gray-200 pt-4">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
        )}
        <Button type="submit" isLoading={isLoading}>
          Upload Certificate
        </Button>
      </div>
    </form>
  );
};