import { api } from './api.service';
import {
  Certificate,
  CreateCertificateRequest,
  CreateAadhaarRequest,
  CreatePANRequest,
  CertificateStats,
  ApiResponse,
  PaginatedResponse,
  PaginationParams,
  FilterParams,
} from '@/types';

class CertificateService {
  async create(data: CreateCertificateRequest): Promise<Certificate> {
    const response = await api.post<ApiResponse<Certificate>>('/certificates', data);
    return response.data.data!;
  }

  async getAll(params?: PaginationParams & FilterParams): Promise<PaginatedResponse<Certificate>> {
    const response = await api.get<PaginatedResponse<Certificate>>('/certificates', { params });
    return response.data;
  }

  async getById(id: string): Promise<Certificate> {
    const response = await api.get<ApiResponse<Certificate>>(`/certificates/${id}`);
    return response.data.data!;
  }

  async update(id: string, data: Partial<CreateCertificateRequest>): Promise<Certificate> {
    const response = await api.put<ApiResponse<Certificate>>(`/certificates/${id}`, data);
    return response.data.data!;
  }

  async delete(id: string): Promise<void> {
    await api.delete(`/certificates/${id}`);
  }

  async getStats(): Promise<CertificateStats> {
    const response = await api.get<ApiResponse<CertificateStats>>('/certificates/stats');
    return response.data.data!;
  }

  // Alias methods for backward compatibility
  async getCertificates(params?: PaginationParams & FilterParams): Promise<ApiResponse<PaginatedResponse<Certificate>>> {
    const data = await this.getAll(params);
    return {
      success: true,
      data,
      message: 'Certificates fetched successfully',
      timestamp: new Date().toISOString(),
    };
  }

  async getCertificateById(id: string): Promise<ApiResponse<Certificate>> {
    const data = await this.getById(id);
    return {
      success: true,
      data,
      message: 'Certificate fetched successfully',
      timestamp: new Date().toISOString(),
    };
  }

  async uploadCertificate(data: CreateCertificateRequest): Promise<ApiResponse<Certificate>> {
    const certificate = await this.create(data);
    return {
      success: true,
      data: certificate,
      message: 'Certificate uploaded successfully',
      timestamp: new Date().toISOString(),
    };
  }

  // Identity document specific methods
  async createAadhaar(data: CreateAadhaarRequest): Promise<Certificate> {
    return this.create(data as any);
  }

  async createPAN(data: CreatePANRequest): Promise<Certificate> {
    return this.create(data as any);
  }

  async uploadAadhaar(data: CreateAadhaarRequest): Promise<ApiResponse<Certificate>> {
    const certificate = await this.createAadhaar(data);
    return {
      success: true,
      data: certificate,
      message: 'Aadhaar card uploaded successfully',
      timestamp: new Date().toISOString(),
    };
  }

  async uploadPAN(data: CreatePANRequest): Promise<ApiResponse<Certificate>> {
    const certificate = await this.createPAN(data);
    return {
      success: true,
      data: certificate,
      message: 'PAN card uploaded successfully',
      timestamp: new Date().toISOString(),
    };
  }
}

export const certificateService = new CertificateService();