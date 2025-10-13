export type CertificateType = 'SCHOOL_CERTIFICATE' | 'DEGREE' | 'DIPLOMA' | 'MARKSHEET' | 'AADHAAR_CARD' | 'PAN_CARD' | 'OTHER';
export type IssuerType = 'CBSE' | 'ICSE' | 'STATE_BOARD' | 'UNIVERSITY' | 'UIDAI' | 'INCOME_TAX' | 'OTHER';
export type CertificateStatus = 'PENDING' | 'VERIFIED' | 'UNVERIFIED' | 'UNDER_REVIEW';

export interface Subject {
  name: string;
  marks: number;
  maxMarks: number;
  grade?: string;
}

export interface School {
  name: string;
  code: string;
  address?: string;
}

export interface AadhaarAddress {
  house?: string;
  street?: string;
  locality?: string;
  city: string;
  state: string;
  pincode: string;
}

export interface AadhaarCardData {
  aadhaarNumber: string;
  holderName: string;
  dateOfBirth: string;
  gender: 'Male' | 'Female' | 'Other';
  address: AadhaarAddress;
  mobileNumber?: string;
  email?: string;
  photoUrl?: string;
}

export interface PANAddress {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
}

export interface PANCardData {
  panNumber: string;
  holderName: string;
  fatherName: string;
  dateOfBirth: string;
  category: 'Individual' | 'Company' | 'HUF' | 'Firm' | 'AOP' | 'Trust' | 'Government' | 'Other';
  address: PANAddress;
  photoUrl?: string;
  signatureUrl?: string;
  aadhaarLinked?: boolean;
}

export interface CertificateData {
  studentName: string;
  rollNumber: string;
  examYear: string;
  issueDate: string;
  issuerName: string;
  school?: School;
  subjects?: Subject[];
  totalMarks?: number;
  percentage?: number;
  grade?: string;
  qrCode?: string;
  digitalSignature?: string;
  [key: string]: any;
}

export interface Certificate {
  id: string;
  userId: string;
  certificateNumber?: string;
  certificateType: CertificateType;
  issuerType: IssuerType;
  issuerName: string;
  certificateData: Record<string, any>;
  hasQrCode: boolean;
  hasDigitalSignature: boolean;
  issueDate?: string;
  status: CertificateStatus;
  createdAt: string;
  updatedAt: string;
  verifiedAt?: string;
}

export interface CreateCertificateRequest {
  certificateType: string;
  issuerType: string;
  studentName?: string;
  rollNumber?: string;
  dateOfBirth?: string;
  examYear?: string;
  issueDate?: string;
  issuerName: string;
  issuerRegistrationNumber?: string;
  qrCodeData?: string;
  digitalSignature?: string;
  school?: School;
  subjects?: Subject[];
  // Identity document specific fields
  aadhaarData?: AadhaarCardData;
  panData?: PANCardData;
  [key: string]: any;
}

export interface CreateAadhaarRequest {
  certificateType: 'AADHAAR_CARD';
  issuerType: 'UIDAI';
  issuerName: 'Unique Identification Authority of India';
  aadhaarData: AadhaarCardData;
}

export interface CreatePANRequest {
  certificateType: 'PAN_CARD';
  issuerType: 'INCOME_TAX';
  issuerName: 'Income Tax Department';
  panData: PANCardData;
}

export interface CertificateStats {
  total: number;
  verified: number;
  unverified: number;
  pending: number;
  underReview: number;
}

// Document Processing Types

export type DocumentType = 'aadhaar' | 'pan';
export type ProcessingStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface DocumentProcessing {
  id: string;
  documentType: DocumentType;
  originalFilename: string;
  status: ProcessingStatus;
  extractedFields?: Record<string, any>;
  validationErrors?: string[];
  confidence?: number;
  processingTime?: number;
  errorMessage?: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ExtractedAadhaarFields {
  name: string | null;
  dateOfBirth: string | null;
  aadhaarNumber: string | null;
  gender: string | null;
  address: string | null;
  fatherName: string | null;
  mobileNumber: string | null;
  confidence: number;
}

export interface ExtractedPANFields {
  name: string | null;
  fatherName: string | null;
  dateOfBirth: string | null;
  panNumber: string | null;
  confidence: number;
}

export interface ProcessingResult {
  id: string;
  status: ProcessingStatus;
  extractedFields?: ExtractedAadhaarFields | ExtractedPANFields;
  validation?: {
    isValid: boolean;
    errors: string[];
  };
  confidence?: number;
  processingTime?: number;
}

export interface FieldMatch {
  field: string;
  value1: string | null;
  value2: string | null;
  score: number;
  matched: boolean;
  reason: string;
}

export interface MatchResult {
  matchStatus: 'matched' | 'partial' | 'not_matched';
  matchConfidence: number;
  fieldMatches: FieldMatch[];
  summary: string;
}

export interface SignatureMatchResult {
  matchStatus: 'matched' | 'partial' | 'not_matched';
  matchConfidence: number;
  metrics: {
    perceptualHash: number;
    structural: number;
    histogram: number;
  };
  summary: string;
}

export interface DocumentUploadRequest {
  document: File;
}

export interface CorrectionRequest {
  correctedFields: Record<string, any>;
  notes?: string;
}

export interface PANAadhaarMatchRequest {
  panId: string;
  aadhaarId: string;
}

export interface SignatureMatchRequest {
  documentId1: string;
  documentId2: string;
}