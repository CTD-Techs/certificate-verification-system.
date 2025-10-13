import { Certificate } from './certificate.types';

export type VerificationStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
export type VerificationResult = 'VERIFIED' | 'UNVERIFIED' | 'PENDING' | 'REQUIRES_MANUAL_REVIEW';
export type VerificationType = 'DIGITAL' | 'PORTAL' | 'FORENSIC' | 'COMBINED';
export type StepStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'SKIPPED';

export interface VerificationStep {
  id: string;
  verificationId: string;
  stepType: string;
  stepName: string;
  status: StepStatus;
  result?: any;
  evidence?: any;
  errorMessage?: string;
  startedAt?: string;
  completedAt?: string;
  duration?: number;
}

export interface Verification {
  id: string;
  certificateId: string;
  userId: string;
  verificationType: VerificationType;
  status: VerificationStatus;
  result: VerificationResult;
  confidenceScore: number;
  steps: VerificationStep[];
  evidence: any;
  manualReviewId?: string;
  certificate?: Certificate;
  manualReview?: any;
  startedAt: string;
  completedAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateVerificationRequest {
  certificateId: string;
  verificationType: VerificationType;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface VerificationStats {
  total: number;
  completed: number;
  pending: number;
  failed: number;
  verified: number;
  unverified: number;
  averageConfidence: number;
  averageDuration: number;
}

export interface VerificationEvidence {
  digitalVerification?: {
    qrCodeValid: boolean;
    signatureValid: boolean;
    digilockerResponse?: any;
  };
  portalVerification?: {
    found: boolean;
    dataMatches: boolean;
    portalResponse?: any;
  };
  forensicAnalysis?: {
    riskScore: number;
    findings: string[];
    metadata?: any;
  };
}