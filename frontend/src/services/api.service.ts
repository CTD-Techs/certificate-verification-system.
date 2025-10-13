import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import toast from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api/v1';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      // DO NOT set default Content-Type here
      // It will be set automatically based on request data type
      // FormData needs multipart/form-data with boundary
      // JSON needs application/json
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.api.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        console.log('[API] Request interceptor:', {
          url: config.url,
          method: config.method,
          hasFormData: config.data instanceof FormData,
          contentType: config.headers?.['Content-Type']
        });

        const token = localStorage.getItem('token');
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Set Content-Type for JSON requests only
        // FormData will set its own Content-Type with boundary
        if (config.data && !(config.data instanceof FormData) && config.headers) {
          config.headers['Content-Type'] = 'application/json';
        }

        console.log('[API] Request headers after interceptor:', config.headers);
        return config;
      },
      (error: AxiosError) => {
        console.error('[API] Request interceptor error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.api.interceptors.response.use(
      (response) => {
        console.log('[API] Response received:', {
          url: response.config.url,
          status: response.status,
          data: response.data
        });
        return response;
      },
      (error: AxiosError) => {
        console.error('[API] Response error:', {
          url: error.config?.url,
          status: error.response?.status,
          message: error.message,
          data: error.response?.data
        });

        if (error.response?.status === 401) {
          // Unauthorized - clear token and redirect to login
          console.error('[API] 401 Unauthorized - clearing session');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
          toast.error('Session expired. Please login again.');
        } else if (error.response?.status === 403) {
          toast.error('You do not have permission to perform this action.');
        } else if (error.response?.status === 429) {
          toast.error('Too many requests. Please try again later.');
        } else if (error.response?.status >= 500) {
          toast.error('Server error. Please try again later.');
        } else if (error.code === 'ECONNABORTED') {
          toast.error('Request timeout. Please try again.');
        } else if (!error.response) {
          toast.error('Network error. Please check your connection.');
        }
        return Promise.reject(error);
      }
    );
  }

  public getApi(): AxiosInstance {
    return this.api;
  }
}

export const apiService = new ApiService();
export const api = apiService.getApi();