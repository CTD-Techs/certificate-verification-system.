import { api } from './api.service';
import {
  DocumentProcessing,
  ProcessingResult,
  MatchResult,
  SignatureMatchResult,
  PANAadhaarMatchRequest,
  SignatureMatchRequest,
  CorrectionRequest,
} from '../types/certificate.types';

/**
 * Document Processing Service
 * Handles API calls for document upload, processing, and matching
 */
class DocumentProcessingService {
  private baseUrl = '/document-processing';

  /**
   * Upload and process Aadhaar document
   */
  async uploadAadhaar(file: File): Promise<ProcessingResult> {
    const formData = new FormData();
    formData.append('document', file);

    console.log('[DEBUG] Uploading Aadhaar document:', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
    });

    // DO NOT set Content-Type manually for FormData
    // Browser will automatically set it with the correct boundary parameter
    const response = await api.post<{ success: boolean; data: ProcessingResult }>(
      `${this.baseUrl}/aadhaar/upload`,
      formData
    );

    console.log('[DEBUG] Upload response:', response.data);
    // Backend wraps response in { success: true, data: {...} }
    return response.data.data;
  }

  /**
   * Upload and process PAN document
   */
  async uploadPAN(file: File): Promise<ProcessingResult> {
    const formData = new FormData();
    formData.append('document', file);

    console.log('[DEBUG] Uploading PAN document:', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
    });

    // DO NOT set Content-Type manually for FormData
    // Browser will automatically set it with the correct boundary parameter
    const response = await api.post<{ success: boolean; data: ProcessingResult }>(
      `${this.baseUrl}/pan/upload`,
      formData
    );

    console.log('[DEBUG] Upload response:', response.data);
    // Backend wraps response in { success: true, data: {...} }
    return response.data.data;
  }

  /**
   * Get document processing status
   */
  async getProcessingStatus(id: string): Promise<DocumentProcessing> {
    const response = await api.get<{ success: boolean; data: DocumentProcessing }>(`${this.baseUrl}/${id}`);
    return response.data.data;
  }

  /**
   * Get extracted data from processed document
   */
  async getExtractedData(id: string): Promise<{
    id: string;
    documentType: string;
    extractedFields: Record<string, any>;
    correctedFields?: Record<string, any>;
    ocrText?: string;
    confidence?: number;
    documentUrl: string;
    isVerified: boolean;
  }> {
    const response = await api.get<{ success: boolean; data: any }>(`${this.baseUrl}/${id}/data`);
    return response.data.data;
  }

  /**
   * Submit field corrections
   */
  async submitCorrections(id: string, data: CorrectionRequest): Promise<{
    id: string;
    message: string;
    correctedFields: Record<string, any>;
  }> {
    const response = await api.post<{ success: boolean; data: any }>(`${this.baseUrl}/${id}/corrections`, data);
    return response.data.data;
  }

  /**
   * Match PAN and Aadhaar documents
   */
  async matchPANAadhaar(data: PANAadhaarMatchRequest): Promise<MatchResult> {
    const response = await api.post<{ success: boolean; data: MatchResult }>(
      `${this.baseUrl}/match/pan-aadhaar`,
      data
    );
    return response.data.data;
  }

  /**
   * Match signatures from two documents
   */
  async matchSignatures(data: SignatureMatchRequest): Promise<SignatureMatchResult> {
    const response = await api.post<{ success: boolean; data: SignatureMatchResult }>(
      `${this.baseUrl}/match/signatures`,
      data
    );
    return response.data.data;
  }

  /**
   * List user's document processing records
   */
  async listDocuments(params?: {
    documentType?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    documents: DocumentProcessing[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const response = await api.get<{ success: boolean; data: any }>(this.baseUrl, { params });
    return response.data.data;
  }
}

export const documentProcessingService = new DocumentProcessingService();
export default documentProcessingService;