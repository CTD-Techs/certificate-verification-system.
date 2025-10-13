import { api } from './api.service';
import {
  ManualReview,
  SubmitReviewRequest,
  AssignReviewRequest,
  ReviewStats,
  ApiResponse,
  PaginatedResponse,
  PaginationParams,
  FilterParams,
} from '@/types';

class VerifierService {
  async getQueue(params?: PaginationParams & FilterParams): Promise<PaginatedResponse<ManualReview>> {
    const response = await api.get<PaginatedResponse<ManualReview>>('/verifier/queue', { params });
    return response.data;
  }

  async getNext(): Promise<ManualReview | null> {
    const response = await api.get<ApiResponse<ManualReview>>('/verifier/next');
    return response.data.data || null;
  }

  async getMyReviews(params?: PaginationParams): Promise<PaginatedResponse<ManualReview>> {
    const response = await api.get<PaginatedResponse<ManualReview>>('/verifier/my-reviews', { params });
    return response.data;
  }

  async getReview(id: string): Promise<ManualReview> {
    const response = await api.get<ApiResponse<ManualReview>>(`/verifier/reviews/${id}`);
    return response.data.data!;
  }

  async assignReview(id: string, data: AssignReviewRequest): Promise<ManualReview> {
    const response = await api.post<ApiResponse<ManualReview>>(`/verifier/reviews/${id}/assign`, data);
    return response.data.data!;
  }

  async submitReview(id: string, data: SubmitReviewRequest): Promise<ManualReview> {
    const response = await api.post<ApiResponse<ManualReview>>(`/verifier/reviews/${id}/submit`, data);
    return response.data.data!;
  }

  async getStats(params?: FilterParams): Promise<ReviewStats> {
    const response = await api.get<ApiResponse<ReviewStats>>('/verifier/stats', { params });
    return response.data.data!;
  }
}

export const verifierService = new VerifierService();