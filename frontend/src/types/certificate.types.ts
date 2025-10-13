export type CertificateType = 'SCHOOL_CERTIFICATE' | 'DEGREE' | 'DIPLOMA' | 'MARKSHEET' | 'OTHER';
export type IssuerType = 'CBSE' | 'ICSE' | 'STATE_BOARD' | 'UNIVERSITY' | 'OTHER';
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
  studentName: string;
  rollNumber: string;
  dateOfBirth: string;
  examYear: string;
  issueDate: string;
  issuerName: string;
  issuerRegistrationNumber?: string;
  qrCodeData?: string;
  digitalSignature?: string;
  school?: School;
  subjects?: Subject[];
  [key: string]: any;
}

export interface CertificateStats {
  total: number;
  verified: number;
  unverified: number;
  pending: number;
  underReview: number;
}