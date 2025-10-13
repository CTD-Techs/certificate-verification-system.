import React, { useState, useCallback } from 'react';
import { Upload, X, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from './Button';

interface DocumentUploadProps {
  onFileSelect: (file: File) => void;
  onFileRemove: () => void;
  accept?: string;
  maxSize?: number; // in MB
  selectedFile?: File | null;
  isProcessing?: boolean;
  error?: string | null;
  success?: boolean;
}

export const DocumentUpload: React.FC<DocumentUploadProps> = ({
  onFileSelect,
  onFileRemove,
  accept = 'image/jpeg,image/jpg,image/png,image/webp,application/pdf',
  maxSize = 10,
  selectedFile,
  isProcessing = false,
  error,
  success = false,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  // Validate and process file
  const handleFile = useCallback((file: File) => {
    console.log('[DEBUG] handleFile called with:', {
      name: file.name,
      type: file.type,
      size: file.size
    });

    try {
      // Validate file type
      const acceptedTypes = accept.split(',').map((t) => t.trim());
      console.log('[DEBUG] Accepted types:', acceptedTypes);
      console.log('[DEBUG] File type:', file.type);
      
      if (!acceptedTypes.includes(file.type)) {
        console.error('[ERROR] Invalid file type:', file.type);
        alert('Invalid file type. Please upload a JPEG, PNG, WEBP, or PDF file.');
        return;
      }

      // Validate file size
      const fileSizeMB = file.size / (1024 * 1024);
      console.log('[DEBUG] File size (MB):', fileSizeMB);
      
      if (fileSizeMB > maxSize) {
        console.error('[ERROR] File size exceeds limit:', fileSizeMB, 'MB');
        alert(`File size exceeds ${maxSize}MB limit.`);
        return;
      }

      // Generate preview for images
      if (file.type.startsWith('image/')) {
        console.log('[DEBUG] Generating image preview');
        const reader = new FileReader();
        reader.onloadend = () => {
          console.log('[DEBUG] Preview generated');
          setPreview(reader.result as string);
        };
        reader.onerror = (error) => {
          console.error('[ERROR] Failed to read file for preview:', error);
        };
        reader.readAsDataURL(file);
      } else {
        console.log('[DEBUG] No preview for non-image file');
        setPreview(null);
      }

      console.log('[DEBUG] Calling onFileSelect callback');
      onFileSelect(file);
      console.log('[DEBUG] onFileSelect callback completed');
    } catch (error) {
      console.error('[ERROR] Exception in handleFile:', error);
      throw error;
    }
  }, [accept, maxSize, onFileSelect]);

  // Handle drag events
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  // Handle drop
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      console.log('[DEBUG] File dropped');
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        console.log('[DEBUG] Processing dropped file:', e.dataTransfer.files[0].name);
        handleFile(e.dataTransfer.files[0]);
      }
    },
    [handleFile]
  );

  // Handle file selection
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      console.log('[DEBUG] File selected via input');
      e.preventDefault();
      if (e.target.files && e.target.files[0]) {
        console.log('[DEBUG] Processing selected file:', e.target.files[0].name);
        handleFile(e.target.files[0]);
      }
    },
    [handleFile]
  );

  // Handle file removal
  const handleRemove = () => {
    setPreview(null);
    onFileRemove();
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="w-full">
      {!selectedFile ? (
        <div
          className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          } ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            id="file-upload"
            className="hidden"
            accept={accept}
            onChange={handleChange}
            disabled={isProcessing}
          />
          <label
            htmlFor="file-upload"
            className="cursor-pointer flex flex-col items-center"
          >
            <Upload className="w-12 h-12 text-gray-400 mb-4" />
            <p className="text-lg font-medium text-gray-700 mb-2">
              Drop your document here or click to browse
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Supported formats: JPEG, PNG, WEBP, PDF (Max {maxSize}MB)
            </p>
            <Button type="button" variant="primary" size="sm">
              Select File
            </Button>
          </label>
        </div>
      ) : (
        <div className="border-2 border-gray-300 rounded-lg p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start space-x-4 flex-1">
              {preview ? (
                <img
                  src={preview}
                  alt="Preview"
                  className="w-24 h-24 object-cover rounded border border-gray-300"
                />
              ) : (
                <div className="w-24 h-24 bg-gray-100 rounded border border-gray-300 flex items-center justify-center">
                  <FileText className="w-12 h-12 text-gray-400" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {selectedFile.name}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {formatFileSize(selectedFile.size)}
                </p>
                {success && (
                  <div className="flex items-center mt-2 text-green-600">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    <span className="text-sm">Upload successful</span>
                  </div>
                )}
                {isProcessing && (
                  <div className="mt-2">
                    <div className="flex items-center text-blue-600">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                      <span className="text-sm">Processing document...</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
            {!isProcessing && (
              <button
                type="button"
                onClick={handleRemove}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start">
              <AlertCircle className="w-5 h-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-800">Upload Error</p>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};