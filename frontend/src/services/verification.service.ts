import { api } from './api.service';
import {
  Verification,
  VerificationStep,
  CreateVerificationRequest,
  VerificationStats,
  VerificationType,
  ApiResponse,
  PaginatedResponse,
  PaginationParams,
  FilterParams,
} from '@/types';

class VerificationService {
  async create(data: CreateVerificationRequest): Promise<Verification> {
    const response = await api.post<ApiResponse<Verification>>('/verifications', data);
    return response.data.data!;
  }

  async getAll(params?: PaginationParams & FilterParams): Promise<PaginatedResponse<Verification>> {
    const response = await api.get<PaginatedResponse<Verification>>('/verifications', { params });
    return response.data;
  }

  async getById(id: string): Promise<Verification> {
    const response = await api.get<ApiResponse<Verification>>(`/verifications/${id}`);
    return response.data.data!;
  }

  async getSteps(id: string): Promise<VerificationStep[]> {
    const response = await api.get<ApiResponse<VerificationStep[]>>(`/verifications/${id}/steps`);
    return response.data.data!;
  }

  async retry(id: string): Promise<Verification> {
    const response = await api.post<ApiResponse<Verification>>(`/verifications/${id}/retry`);
    return response.data.data!;
  }

  async getStats(params?: FilterParams): Promise<VerificationStats> {
    const response = await api.get<ApiResponse<VerificationStats>>('/verifications/stats', { params });
    return response.data.data!;
  }

  // Alias methods for backward compatibility
  async getVerifications(params?: PaginationParams & FilterParams): Promise<ApiResponse<PaginatedResponse<Verification>>> {
    const data = await this.getAll(params);
    return {
      success: true,
      data,
      message: 'Verifications fetched successfully',
      timestamp: new Date().toISOString(),
    };
  }

  async getVerificationById(id: string): Promise<ApiResponse<Verification>> {
    const data = await this.getById(id);
    return {
      success: true,
      data,
      message: 'Verification fetched successfully',
      timestamp: new Date().toISOString(),
    };
  }

  async startVerification(certificateId: string, verificationType: VerificationType = 'COMBINED'): Promise<ApiResponse<Verification>> {
    const data = await this.create({ certificateId, verificationType });
    return {
      success: true,
      data,
      message: 'Verification started successfully',
      timestamp: new Date().toISOString(),
    };
  }

  async retryVerification(id: string): Promise<ApiResponse<Verification>> {
    const data = await this.retry(id);
    return {
      success: true,
      data,
      message: 'Verification retried successfully',
      timestamp: new Date().toISOString(),
    };
  }
}

export const verificationService = new VerificationService();