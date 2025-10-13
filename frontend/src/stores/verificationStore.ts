import { create } from 'zustand';
import { Verification } from '../types';
import { verificationService } from '../services';

interface VerificationState {
  verifications: Verification[];
  currentVerification: Verification | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchVerifications: () => Promise<void>;
  fetchVerificationById: (id: string) => Promise<void>;
  startVerification: (certificateId: string) => Promise<Verification>;
  retryVerification: (id: string) => Promise<void>;
  clearError: () => void;
  setCurrentVerification: (verification: Verification | null) => void;
}

export const useVerificationStore = create<VerificationState>((set) => ({
  verifications: [],
  currentVerification: null,
  isLoading: false,
  error: null,

  fetchVerifications: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await verificationService.getVerifications();
      console.log('DEBUG: fetchVerifications response:', response);
      console.log('DEBUG: response.data:', response.data);
      console.log('DEBUG: response.data.data:', response.data?.data);
      // Fix: response.data is PaginatedResponse, we need response.data.data for the array
      set({ verifications: response.data?.data || [], isLoading: false });
    } catch (error: any) {
      console.error('DEBUG: fetchVerifications error:', error);
      set({ error: error.message || 'Failed to fetch verifications', isLoading: false });
    }
  },

  fetchVerificationById: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await verificationService.getVerificationById(id);
      set({ currentVerification: response.data, isLoading: false });
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch verification', isLoading: false });
    }
  },

  startVerification: async (certificateId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await verificationService.startVerification(certificateId);
      const verification = response.data;
      if (!verification) {
        throw new Error('No verification data returned');
      }
      set((state) => ({
        verifications: [verification, ...state.verifications],
        isLoading: false,
      }));
      return verification;
    } catch (error: any) {
      set({ error: error.message || 'Failed to start verification', isLoading: false });
      throw error;
    }
  },

  retryVerification: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await verificationService.retryVerification(id);
      const verification = response.data;
      if (!verification) {
        throw new Error('No verification data returned');
      }
      set((state) => ({
        verifications: state.verifications.map((v) =>
          v.id === id ? verification : v
        ),
        currentVerification:
          state.currentVerification?.id === id
            ? verification
            : state.currentVerification,
        isLoading: false,
      }));
    } catch (error: any) {
      set({ error: error.message || 'Failed to retry verification', isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
  
  setCurrentVerification: (verification) => set({ currentVerification: verification }),
}));