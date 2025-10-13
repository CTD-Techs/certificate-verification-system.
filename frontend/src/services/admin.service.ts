import { api } from './api.service';
import {
  User,
  RegisterRequest,
  ApiResponse,
  PaginatedResponse,
  PaginationParams,
  FilterParams,
} from '@/types';

interface SystemStats {
  totalUsers: number;
  totalCertificates: number;
  totalVerifications: number;
  totalReviews: number;
  verificationSuccessRate: number;
  averageVerificationTime: number;
  activeUsers: number;
  pendingReviews: number;
}

class AdminService {
  async getUsers(params?: PaginationParams & FilterParams): Promise<PaginatedResponse<User>> {
    const response = await api.get<PaginatedResponse<User>>('/admin/users', { params });
    return response.data;
  }

  async createUser(data: RegisterRequest): Promise<User> {
    const response = await api.post<ApiResponse<User>>('/admin/users', data);
    return response.data.data!;
  }

  async getUser(id: string): Promise<User> {
    const response = await api.get<ApiResponse<User>>(`/admin/users/${id}`);
    return response.data.data!;
  }

  async updateUser(id: string, data: Partial<User>): Promise<User> {
    const response = await api.put<ApiResponse<User>>(`/admin/users/${id}`, data);
    return response.data.data!;
  }

  async deleteUser(id: string): Promise<void> {
    await api.delete(`/admin/users/${id}`);
  }

  async resetPassword(id: string, newPassword: string): Promise<void> {
    await api.post(`/admin/users/${id}/reset-password`, { newPassword });
  }

  async getSystemStats(): Promise<SystemStats> {
    const response = await api.get<ApiResponse<SystemStats>>('/admin/stats');
    return response.data.data!;
  }
}

export const adminService = new AdminService();