import { create } from 'zustand';
import { Certificate } from '../types';
import { certificateService } from '../services';

interface CertificateState {
  certificates: Certificate[];
  currentCertificate: Certificate | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchCertificates: () => Promise<void>;
  fetchCertificateById: (id: string) => Promise<void>;
  createCertificate: (data: any) => Promise<Certificate>;
  clearError: () => void;
  setCurrentCertificate: (certificate: Certificate | null) => void;
}

export const useCertificateStore = create<CertificateState>((set) => ({
  certificates: [],
  currentCertificate: null,
  isLoading: false,
  error: null,

  fetchCertificates: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await certificateService.getCertificates();
      console.log('DEBUG: fetchCertificates response:', response);
      console.log('DEBUG: response.data:', response.data);
      console.log('DEBUG: response.data.data:', response.data?.data);
      // Fix: response.data is PaginatedResponse, we need response.data.data for the array
      set({ certificates: response.data?.data || [], isLoading: false });
    } catch (error: any) {
      console.error('DEBUG: fetchCertificates error:', error);
      set({ error: error.message || 'Failed to fetch certificates', isLoading: false });
    }
  },

  fetchCertificateById: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await certificateService.getCertificateById(id);
      set({ currentCertificate: response.data, isLoading: false });
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch certificate', isLoading: false });
    }
  },

  createCertificate: async (data: any) => {
    set({ isLoading: true, error: null });
    try {
      const response = await certificateService.uploadCertificate(data);
      // Fix: Ensure response.data exists before using it
      const certificate = response.data;
      if (!certificate) {
        throw new Error('No certificate data returned');
      }
      set((state) => ({
        certificates: [certificate, ...state.certificates],
        isLoading: false,
      }));
      return certificate;
    } catch (error: any) {
      set({ error: error.message || 'Failed to create certificate', isLoading: false });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
  
  setCurrentCertificate: (certificate) => set({ currentCertificate: certificate }),
}));