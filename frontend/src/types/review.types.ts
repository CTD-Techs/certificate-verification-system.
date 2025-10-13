import { Certificate } from './certificate.types';
import { Verification } from './verification.types';

export type ReviewStatus = 'PENDING' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED';
export type ReviewDecision = 'APPROVED' | 'REJECTED' | 'NEEDS_MORE_INFO';
export type ReviewPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface ManualReview {
  id: string;
  verificationId?: string;
  certificateId: string;
  assignedTo?: string;
  verifierId?: string;
  status: ReviewStatus;
  priority: ReviewPriority;
  reason?: string;
  decision?: ReviewDecision;
  comments?: string;
  confidenceScore?: number;
  evidence?: string[];
  assignedAt?: string;
  reviewedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  // Relations loaded from backend
  certificate?: Certificate & {
    verifications?: Verification[];
  };
  verifier?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface SubmitReviewRequest {
  decision: ReviewDecision;
  comments: string;
  confidenceScore: number;
  evidence?: string[];
}

export interface AssignReviewRequest {
  verifierId: string;
}

export interface ReviewStats {
  total: number;
  pending: number;
  assigned: number;
  inProgress: number;
  completed: number;
  approved: number;
  rejected: number;
  averageReviewTime: number;
}