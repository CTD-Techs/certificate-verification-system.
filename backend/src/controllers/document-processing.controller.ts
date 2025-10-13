import { Response } from 'express';
import { AppDataSource } from '../config/database';
import { DocumentProcessing } from '../models/DocumentProcessing';
import { documentProcessorService } from '../services/document-processing/document-processor.service';
import { panAadhaarMatcherService } from '../services/document-processing/pan-aadhaar-matcher.service';
import { signatureMatcherService } from '../services/document-processing/signature-matcher.service';
import { s3Service } from '../services/aws/s3.service';
import { sendSuccess, sendError } from '../utils/response';
import logger from '../utils/logger';

/**
 * Document Processing Controller
 * Handles document upload, processing, and matching operations
 */
export class DocumentProcessingController {
  private documentProcessingRepository = AppDataSource.getRepository(DocumentProcessing);

  /**
   * Upload and process Aadhaar document
   * POST /api/v1/document-processing/aadhaar/upload
   */
  uploadAadhaar = async (req: any, res: Response): Promise<void> => {
    try {
      console.log('[UPLOAD] Aadhaar upload request received');
      console.log('[UPLOAD] User:', req.user);
      console.log('[UPLOAD] File present:', !!req.file);
      
      const userId = req.user?.sub;
      if (!userId) {
        console.log('[UPLOAD] User not authenticated');
        sendError(res, 'UNAUTHORIZED', 'User not authenticated', 401);
        return;
      }

      const file = req.file;
      if (!file) {
        console.log('[UPLOAD] No file in request');
        sendError(res, 'BAD_REQUEST', 'No file uploaded', 400);
        return;
      }
      
      console.log('[UPLOAD] File details:', {
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
      });

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
      if (!allowedTypes.includes(file.mimetype)) {
        sendError(res, 'BAD_REQUEST', 'Invalid file type. Only JPEG, PNG, WEBP, and PDF are allowed', 400);
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        sendError(res, 'BAD_REQUEST', 'File size exceeds 10MB limit', 400);
        return;
      }

      logger.info('Processing Aadhaar document', { userId, filename: file.originalname });

      console.log('[UPLOAD] Step 1: Checking database connection...');
      console.log('[UPLOAD] AppDataSource initialized:', AppDataSource.isInitialized);
      
      if (!AppDataSource.isInitialized) {
        console.error('[UPLOAD ERROR] Database not initialized!');
        sendError(res, 'INTERNAL_ERROR', 'Database connection not available', 500);
        return;
      }

      console.log('[UPLOAD] Step 2: Creating database record...');
      // Create initial record
      const docProcessing = this.documentProcessingRepository.create({
        userId,
        documentType: 'aadhaar',
        originalFilename: file.originalname,
        s3Key: '',
        s3Bucket: '',
        s3Url: '',
        processingStatus: 'processing',
      });

      console.log('[UPLOAD] Step 3: Saving initial record to database...');
      try {
        await this.documentProcessingRepository.save(docProcessing);
        console.log('[UPLOAD] Initial record saved successfully, ID:', docProcessing.id);
      } catch (dbError: any) {
        console.error('[UPLOAD ERROR] Database save failed:', dbError);
        // Retry once on connection reset
        if (dbError.code === 'ECONNRESET' || dbError.message?.includes('ECONNRESET')) {
          console.log('[UPLOAD] Retrying after ECONNRESET...');
          await new Promise(resolve => setTimeout(resolve, 1000));
          try {
            await this.documentProcessingRepository.save(docProcessing);
            console.log('[UPLOAD] Retry successful, ID:', docProcessing.id);
          } catch (retryError) {
            console.error('[UPLOAD ERROR] Retry failed:', retryError);
            sendError(res, 'INTERNAL_ERROR', 'Failed to create database record after retry: ' + (retryError instanceof Error ? retryError.message : 'Unknown error'), 500);
            return;
          }
        } else {
          sendError(res, 'INTERNAL_ERROR', 'Failed to create database record: ' + (dbError instanceof Error ? dbError.message : 'Unknown error'), 500);
          return;
        }
      }

      console.log('[UPLOAD] Step 4: Starting document processing...');
      // Process document asynchronously
      let result;
      try {
        result = await documentProcessorService.processAadhaarDocument(
          file.buffer,
          file.originalname,
          file.mimetype
        );
        console.log('[UPLOAD] Document processing completed, status:', result.status);
      } catch (processingError) {
        console.error('[UPLOAD ERROR] Document processing failed:', processingError);
        sendError(res, 'INTERNAL_ERROR', 'Document processing failed: ' + (processingError instanceof Error ? processingError.message : 'Unknown error'), 500);
        return;
      }

      console.log('[UPLOAD] Step 5: Updating database with results...');
      // Update record with results
      if (result.status === 'completed') {
        docProcessing.s3Key = result.s3Key!;
        docProcessing.s3Bucket = result.s3Bucket!;
        docProcessing.s3Url = result.s3Url!;
        docProcessing.processingStatus = 'completed';
        docProcessing.ocrText = result.ocrResult?.fullText;
        docProcessing.ocrConfidence = result.ocrResult?.averageConfidence;
        docProcessing.extractedFields = result.extractedFields as any;
        docProcessing.extractionConfidence = result.extractedFields?.confidence;
        docProcessing.validationErrors = result.validation?.errors;
        docProcessing.overallConfidence = result.overallConfidence;
        docProcessing.processingTimeMs = result.processingTime;
      } else {
        docProcessing.processingStatus = 'failed';
        docProcessing.errorMessage = result.error;
        docProcessing.processingTimeMs = result.processingTime;
      }

      try {
        await this.documentProcessingRepository.save(docProcessing);
        console.log('[UPLOAD] Final record saved successfully');
      } catch (dbError: any) {
        console.error('[UPLOAD ERROR] Final database save failed:', dbError);
        // Retry once on connection reset
        if (dbError.code === 'ECONNRESET' || dbError.message?.includes('ECONNRESET')) {
          console.log('[UPLOAD] Retrying final save after ECONNRESET...');
          await new Promise(resolve => setTimeout(resolve, 1000));
          try {
            await this.documentProcessingRepository.save(docProcessing);
            console.log('[UPLOAD] Final save retry successful');
          } catch (retryError) {
            console.error('[UPLOAD ERROR] Final save retry failed:', retryError);
            sendError(res, 'INTERNAL_ERROR', 'Failed to save processing results after retry: ' + (retryError instanceof Error ? retryError.message : 'Unknown error'), 500);
            return;
          }
        } else {
          sendError(res, 'INTERNAL_ERROR', 'Failed to save processing results: ' + (dbError instanceof Error ? dbError.message : 'Unknown error'), 500);
          return;
        }
      }

      console.log('[UPLOAD] Step 6: Sending success response...');
      sendSuccess(res, {
        id: docProcessing.id,
        status: docProcessing.processingStatus,
        extractedFields: docProcessing.extractedFields,
        validation: result.validation,
        confidence: docProcessing.overallConfidence,
        processingTime: docProcessing.processingTimeMs,
      });
    } catch (error) {
      logger.error('Error uploading Aadhaar document', { error });
      sendError(res, 'INTERNAL_ERROR', 'Failed to process Aadhaar document', 500);
    }
  };

  /**
   * Upload and process PAN document
   * POST /api/v1/document-processing/pan/upload
   */
  uploadPAN = async (req: any, res: Response): Promise<void> => {
    try {
      console.log('[UPLOAD] PAN upload request received');
      console.log('[UPLOAD] User:', req.user);
      console.log('[UPLOAD] File present:', !!req.file);
      
      const userId = req.user?.sub;
      if (!userId) {
        console.log('[UPLOAD] User not authenticated');
        sendError(res, 'UNAUTHORIZED', 'User not authenticated', 401);
        return;
      }

      const file = req.file;
      if (!file) {
        console.log('[UPLOAD] No file in request');
        sendError(res, 'BAD_REQUEST', 'No file uploaded', 400);
        return;
      }
      
      console.log('[UPLOAD] File details:', {
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
      });

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
      if (!allowedTypes.includes(file.mimetype)) {
        sendError(res, 'BAD_REQUEST', 'Invalid file type. Only JPEG, PNG, WEBP, and PDF are allowed', 400);
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        sendError(res, 'BAD_REQUEST', 'File size exceeds 10MB limit', 400);
        return;
      }

      logger.info('Processing PAN document', { userId, filename: file.originalname });

      // Create initial record
      const docProcessing = this.documentProcessingRepository.create({
        userId,
        documentType: 'pan',
        originalFilename: file.originalname,
        s3Key: '',
        s3Bucket: '',
        s3Url: '',
        processingStatus: 'processing',
      });

      try {
        await this.documentProcessingRepository.save(docProcessing);
      } catch (dbError: any) {
        // Retry once on connection reset
        if (dbError.code === 'ECONNRESET' || dbError.message?.includes('ECONNRESET')) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          await this.documentProcessingRepository.save(docProcessing);
        } else {
          throw dbError;
        }
      }

      // Process document asynchronously
      const result = await documentProcessorService.processPANDocument(
        file.buffer,
        file.originalname,
        file.mimetype
      );

      // Update record with results
      if (result.status === 'completed') {
        docProcessing.s3Key = result.s3Key!;
        docProcessing.s3Bucket = result.s3Bucket!;
        docProcessing.s3Url = result.s3Url!;
        docProcessing.processingStatus = 'completed';
        docProcessing.ocrText = result.ocrResult?.fullText;
        docProcessing.ocrConfidence = result.ocrResult?.averageConfidence;
        docProcessing.extractedFields = result.extractedFields as any;
        docProcessing.extractionConfidence = result.extractedFields?.confidence;
        docProcessing.validationErrors = result.validation?.errors;
        docProcessing.overallConfidence = result.overallConfidence;
        docProcessing.processingTimeMs = result.processingTime;
      } else {
        docProcessing.processingStatus = 'failed';
        docProcessing.errorMessage = result.error;
        docProcessing.processingTimeMs = result.processingTime;
      }

      try {
        await this.documentProcessingRepository.save(docProcessing);
      } catch (dbError: any) {
        // Retry once on connection reset
        if (dbError.code === 'ECONNRESET' || dbError.message?.includes('ECONNRESET')) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          await this.documentProcessingRepository.save(docProcessing);
        } else {
          throw dbError;
        }
      }

      sendSuccess(res, {
        id: docProcessing.id,
        status: docProcessing.processingStatus,
        extractedFields: docProcessing.extractedFields,
        validation: result.validation,
        confidence: docProcessing.overallConfidence,
        processingTime: docProcessing.processingTimeMs,
      });
    } catch (error) {
      logger.error('Error uploading PAN document', { error });
      sendError(res, 'INTERNAL_ERROR', 'Failed to process PAN document', 500);
    }
  };

  /**
   * Get document processing status
   * GET /api/v1/document-processing/:id
   */
  getProcessingStatus = async (req: any, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.user?.sub;

      const docProcessing = await this.documentProcessingRepository.findOne({
        where: { id, userId },
      });

      if (!docProcessing) {
        sendError(res, 'NOT_FOUND', 'Document processing record not found', 404);
        return;
      }

      sendSuccess(res, {
        id: docProcessing.id,
        documentType: docProcessing.documentType,
        status: docProcessing.processingStatus,
        extractedFields: docProcessing.extractedFields,
        validationErrors: docProcessing.validationErrors,
        confidence: docProcessing.overallConfidence,
        processingTime: docProcessing.processingTimeMs,
        errorMessage: docProcessing.errorMessage,
        createdAt: docProcessing.createdAt,
        updatedAt: docProcessing.updatedAt,
      });
    } catch (error) {
      logger.error('Error getting processing status', { error });
      sendError(res, 'INTERNAL_ERROR', 'Failed to get processing status', 500);
    }
  };

  /**
   * Get extracted data
   * GET /api/v1/document-processing/:id/data
   */
  getExtractedData = async (req: any, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.user?.sub;

      const docProcessing = await this.documentProcessingRepository.findOne({
        where: { id, userId },
      });

      if (!docProcessing) {
        sendError(res, 'NOT_FOUND', 'Document processing record not found', 404);
        return;
      }

      if (docProcessing.processingStatus !== 'completed') {
        sendError(res, 'BAD_REQUEST', 'Document processing not completed', 400);
        return;
      }

      // Generate pre-signed URL for document access
      const presignedUrl = await s3Service.getPresignedUrl(docProcessing.s3Key, 3600);

      sendSuccess(res, {
        id: docProcessing.id,
        documentType: docProcessing.documentType,
        extractedFields: docProcessing.extractedFields,
        correctedFields: docProcessing.correctedFields,
        ocrText: docProcessing.ocrText,
        confidence: docProcessing.overallConfidence,
        documentUrl: presignedUrl,
        isVerified: docProcessing.isVerified,
      });
    } catch (error) {
      logger.error('Error getting extracted data', { error });
      sendError(res, 'INTERNAL_ERROR', 'Failed to get extracted data', 500);
    }
  };

  /**
   * Submit field corrections
   * POST /api/v1/document-processing/:id/corrections
   */
  submitCorrections = async (req: any, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.user?.sub;
      const { correctedFields, notes } = req.body;

      const docProcessing = await this.documentProcessingRepository.findOne({
        where: { id, userId },
      });

      if (!docProcessing) {
        sendError(res, 'NOT_FOUND', 'Document processing record not found', 404);
        return;
      }

      if (docProcessing.processingStatus !== 'completed') {
        sendError(res, 'BAD_REQUEST', 'Document processing not completed', 400);
        return;
      }

      // Update with corrections
      docProcessing.correctedFields = correctedFields;
      docProcessing.correctionNotes = notes;
      docProcessing.isVerified = true;
      docProcessing.verifiedAt = new Date();
      docProcessing.verifiedBy = userId;

      try {
        await this.documentProcessingRepository.save(docProcessing);
      } catch (dbError: any) {
        // Retry once on connection reset
        if (dbError.code === 'ECONNRESET' || dbError.message?.includes('ECONNRESET')) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          await this.documentProcessingRepository.save(docProcessing);
        } else {
          throw dbError;
        }
      }

      sendSuccess(res, {
        id: docProcessing.id,
        message: 'Corrections submitted successfully',
        correctedFields: docProcessing.correctedFields,
      });
    } catch (error) {
      logger.error('Error submitting corrections', { error });
      sendError(res, 'INTERNAL_ERROR', 'Failed to submit corrections', 500);
    }
  };

  /**
   * Match PAN and Aadhaar documents
   * POST /api/v1/document-processing/match/pan-aadhaar
   */
  matchPANAadhaar = async (req: any, res: Response): Promise<void> => {
    try {
      const userId = req.user?.sub;
      const { panId, aadhaarId } = req.body;

      if (!panId || !aadhaarId) {
        sendError(res, 'BAD_REQUEST', 'Both PAN and Aadhaar document IDs are required', 400);
        return;
      }

      // Fetch both documents
      const [panDoc, aadhaarDoc] = await Promise.all([
        this.documentProcessingRepository.findOne({
          where: { id: panId, userId, documentType: 'pan' },
        }),
        this.documentProcessingRepository.findOne({
          where: { id: aadhaarId, userId, documentType: 'aadhaar' },
        }),
      ]);

      if (!panDoc || !aadhaarDoc) {
        sendError(res, 'NOT_FOUND', 'One or both documents not found', 404);
        return;
      }

      if (panDoc.processingStatus !== 'completed' || aadhaarDoc.processingStatus !== 'completed') {
        sendError(res, 'BAD_REQUEST', 'Both documents must be successfully processed', 400);
        return;
      }

      // Perform matching
      const matchResult = panAadhaarMatcherService.matchDocuments(
        panDoc.extractedFields as any,
        aadhaarDoc.extractedFields as any
      );

      sendSuccess(res, matchResult);
    } catch (error) {
      logger.error('Error matching PAN and Aadhaar', { error });
      sendError(res, 'INTERNAL_ERROR', 'Failed to match documents', 500);
    }
  };

  /**
   * Match signatures from two documents
   * POST /api/v1/document-processing/match/signatures
   */
  matchSignatures = async (req: any, res: Response): Promise<void> => {
    try {
      const userId = req.user?.sub;
      const { documentId1, documentId2 } = req.body;

      if (!documentId1 || !documentId2) {
        sendError(res, 'BAD_REQUEST', 'Both document IDs are required', 400);
        return;
      }

      // Fetch both documents
      const [doc1, doc2] = await Promise.all([
        this.documentProcessingRepository.findOne({
          where: { id: documentId1, userId },
        }),
        this.documentProcessingRepository.findOne({
          where: { id: documentId2, userId },
        }),
      ]);

      if (!doc1 || !doc2) {
        sendError(res, 'NOT_FOUND', 'One or both documents not found', 404);
        return;
      }

      // Download documents from S3
      const [image1, image2] = await Promise.all([
        s3Service.downloadFile(doc1.s3Key),
        s3Service.downloadFile(doc2.s3Key),
      ]);

      // Perform signature matching
      const matchResult = await signatureMatcherService.matchSignatures(image1, image2);

      sendSuccess(res, matchResult);
    } catch (error) {
      logger.error('Error matching signatures', { error });
      sendError(res, 'INTERNAL_ERROR', 'Failed to match signatures', 500);
    }
  };

  /**
   * List user's document processing records
   * GET /api/v1/document-processing
   */
  listDocuments = async (req: any, res: Response): Promise<void> => {
    try {
      const userId = req.user?.sub;
      const { documentType, status, page = 1, limit = 10 } = req.query;

      const where: any = { userId };
      if (documentType) where.documentType = documentType;
      if (status) where.processingStatus = status;

      const [documents, total] = await this.documentProcessingRepository.findAndCount({
        where,
        order: { createdAt: 'DESC' },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
      });

      sendSuccess(res, {
        documents: documents.map((doc) => ({
          id: doc.id,
          documentType: doc.documentType,
          originalFilename: doc.originalFilename,
          status: doc.processingStatus,
          confidence: doc.overallConfidence,
          isVerified: doc.isVerified,
          createdAt: doc.createdAt,
        })),
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (error) {
      logger.error('Error listing documents', { error });
      sendError(res, 'INTERNAL_ERROR', 'Failed to list documents', 500);
    }
  };
}

export const documentProcessingController = new DocumentProcessingController();