import { s3Service } from '../aws/s3.service';
import { textractService, TextractResult } from '../aws/textract.service';
import { bedrockService, AadhaarFields, PANFields } from '../aws/bedrock.service';
import logger from '../../utils/logger';

/**
 * Document Processing Service
 * Orchestrates the complete document processing pipeline:
 * Upload → OCR → Field Extraction → Validation
 */
export class DocumentProcessorService {
  /**
   * Process Aadhaar card document
   * @param file - Document file buffer
   * @param fileName - Original file name
   * @param contentType - MIME type
   * @returns Processing result with extracted fields
   */
  async processAadhaarDocument(
    file: Buffer,
    fileName: string,
    contentType: string
  ): Promise<AadhaarProcessingResult> {
    const startTime = Date.now();
    logger.info('Starting Aadhaar document processing', { fileName });

    try {
      console.log('[PROCESSOR] Step 1: Starting S3 upload...');
      // Step 1: Upload to S3
      const uploadResult = await s3Service.uploadFile(file, fileName, contentType, {
        documentType: 'aadhaar',
        uploadedAt: new Date().toISOString(),
      });
      console.log('[PROCESSOR] S3 upload successful:', uploadResult.key);

      logger.info('Document uploaded to S3', {
        key: uploadResult.key,
        bucket: uploadResult.bucket,
      });

      console.log('[PROCESSOR] Step 2: Starting OCR with Textract...');
      // Step 2: Extract text using Textract
      const ocrResult = await textractService.extractText(file);
      console.log('[PROCESSOR] OCR completed successfully');
      console.log('[PROCESSOR] OCR Result Preview:', ocrResult.fullText.substring(0, 300));

      logger.info('OCR completed', {
        lineCount: ocrResult.lines.length,
        averageConfidence: ocrResult.averageConfidence,
        fullTextLength: ocrResult.fullText.length,
      });

      console.log('[PROCESSOR] Step 3: Extracting fields with Bedrock...');
      // Step 3: Extract fields using Bedrock (Claude)
      const extractedFields = await bedrockService.extractAadhaarFields(ocrResult.fullText);
      console.log('[PROCESSOR] Field extraction completed');
      console.log('[PROCESSOR] Extracted Fields:', JSON.stringify(extractedFields, null, 2));

      // Log which fields were successfully extracted
      const extractedFieldNames = Object.entries(extractedFields)
        .filter(([key, value]) => value !== null && key !== 'confidence')
        .map(([key]) => key);
      const missingFieldNames = Object.keys(extractedFields)
        .filter(key => key !== 'confidence' && extractedFields[key as keyof typeof extractedFields] === null);

      console.log('[PROCESSOR] Successfully extracted fields:', extractedFieldNames.join(', '));
      if (missingFieldNames.length > 0) {
        console.log('[PROCESSOR] WARNING: Missing fields:', missingFieldNames.join(', '));
      }

      logger.info('Fields extracted', {
        extractedFields,
        extractedCount: extractedFieldNames.length,
        missingCount: missingFieldNames.length,
        extractedFieldNames,
        missingFieldNames,
      });

      console.log('[PROCESSOR] Step 4: Validating extracted fields...');
      // Step 4: Validate extracted fields
      const validation = this.validateAadhaarFields(extractedFields);
      console.log('[PROCESSOR] Validation completed, isValid:', validation.isValid);

      console.log('[PROCESSOR] Step 5: Calculating confidence...');
      // Step 5: Calculate overall confidence
      const overallConfidence = this.calculateOverallConfidence(
        ocrResult.averageConfidence,
        extractedFields.confidence,
        validation.isValid ? 1.0 : 0.5
      );

      const processingTime = Date.now() - startTime;

      logger.info('Aadhaar document processing completed', {
        fileName,
        processingTime,
        overallConfidence,
        isValid: validation.isValid,
      });

      return {
        status: 'completed',
        s3Key: uploadResult.key,
        s3Bucket: uploadResult.bucket,
        s3Url: uploadResult.url,
        ocrResult,
        extractedFields,
        validation,
        overallConfidence,
        processingTime,
      };
    } catch (error) {
      console.error('[PROCESSOR ERROR] Exception during processing:', error);
      console.error('[PROCESSOR ERROR] Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        name: error instanceof Error ? error.name : undefined
      });
      logger.error('Error processing Aadhaar document', { error, fileName });

      return {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        processingTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Process PAN card document
   * @param file - Document file buffer
   * @param fileName - Original file name
   * @param contentType - MIME type
   * @returns Processing result with extracted fields
   */
  async processPANDocument(
    file: Buffer,
    fileName: string,
    contentType: string
  ): Promise<PANProcessingResult> {
    const startTime = Date.now();
    logger.info('Starting PAN document processing', { fileName });

    try {
      // Step 1: Upload to S3
      const uploadResult = await s3Service.uploadFile(file, fileName, contentType, {
        documentType: 'pan',
        uploadedAt: new Date().toISOString(),
      });

      logger.info('Document uploaded to S3', {
        key: uploadResult.key,
        bucket: uploadResult.bucket,
      });

      // Step 2: Extract text using Textract
      const ocrResult = await textractService.extractText(file);

      logger.info('OCR completed', {
        lineCount: ocrResult.lines.length,
        averageConfidence: ocrResult.averageConfidence,
      });

      // Step 3: Extract fields using Bedrock (Claude)
      const extractedFields = await bedrockService.extractPANFields(ocrResult.fullText);

      logger.info('Fields extracted', { extractedFields });

      // Step 4: Validate extracted fields
      const validation = this.validatePANFields(extractedFields);

      // Step 5: Calculate overall confidence
      const overallConfidence = this.calculateOverallConfidence(
        ocrResult.averageConfidence,
        extractedFields.confidence,
        validation.isValid ? 1.0 : 0.5
      );

      const processingTime = Date.now() - startTime;

      logger.info('PAN document processing completed', {
        fileName,
        processingTime,
        overallConfidence,
        isValid: validation.isValid,
      });

      return {
        status: 'completed',
        s3Key: uploadResult.key,
        s3Bucket: uploadResult.bucket,
        s3Url: uploadResult.url,
        ocrResult,
        extractedFields,
        validation,
        overallConfidence,
        processingTime,
      };
    } catch (error) {
      logger.error('Error processing PAN document', { error, fileName });

      return {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        processingTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Validate Aadhaar fields
   */
  private validateAadhaarFields(fields: AadhaarFields): ValidationResult {
    const errors: string[] = [];

    // Validate name
    if (!fields.name || fields.name.length < 2) {
      errors.push('Name is required and must be at least 2 characters');
    }

    // Validate Aadhaar number (12 digits)
    if (!fields.aadhaarNumber) {
      errors.push('Aadhaar number is required');
    } else {
      const cleanAadhaar = fields.aadhaarNumber.replace(/\s/g, '');
      if (!/^\d{12}$/.test(cleanAadhaar)) {
        errors.push('Aadhaar number must be 12 digits');
      }
    }

    // Validate date of birth
    if (!fields.dateOfBirth) {
      errors.push('Date of birth is required');
    } else if (!this.isValidDate(fields.dateOfBirth)) {
      errors.push('Date of birth must be in DD/MM/YYYY format');
    }

    // Validate gender
    if (fields.gender && !['Male', 'Female', 'Other'].includes(fields.gender)) {
      errors.push('Gender must be Male, Female, or Other');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate PAN fields
   */
  private validatePANFields(fields: PANFields): ValidationResult {
    const errors: string[] = [];

    // Validate name
    if (!fields.name || fields.name.length < 2) {
      errors.push('Name is required and must be at least 2 characters');
    }

    // Validate PAN number (10 characters: 5 letters, 4 digits, 1 letter)
    if (!fields.panNumber) {
      errors.push('PAN number is required');
    } else if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(fields.panNumber)) {
      errors.push('PAN number must be in format: ABCDE1234F');
    }

    // Validate date of birth
    if (!fields.dateOfBirth) {
      errors.push('Date of birth is required');
    } else if (!this.isValidDate(fields.dateOfBirth)) {
      errors.push('Date of birth must be in DD/MM/YYYY format');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate date format (DD/MM/YYYY)
   */
  private isValidDate(dateString: string): boolean {
    const regex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    const match = dateString.match(regex);

    if (!match) {
      return false;
    }

    const day = parseInt(match[1], 10);
    const month = parseInt(match[2], 10);
    const year = parseInt(match[3], 10);

    if (month < 1 || month > 12) {
      return false;
    }

    if (day < 1 || day > 31) {
      return false;
    }

    if (year < 1900 || year > new Date().getFullYear()) {
      return false;
    }

    return true;
  }

  /**
   * Calculate overall confidence score
   */
  private calculateOverallConfidence(
    ocrConfidence: number,
    extractionConfidence: number,
    validationScore: number
  ): number {
    // Weighted average: OCR 30%, Extraction 50%, Validation 20%
    const weighted =
      (ocrConfidence / 100) * 0.3 + extractionConfidence * 0.5 + validationScore * 0.2;

    return Math.round(weighted * 100) / 100;
  }
}

// Types

export interface AadhaarProcessingResult {
  status: 'completed' | 'failed';
  s3Key?: string;
  s3Bucket?: string;
  s3Url?: string;
  ocrResult?: TextractResult;
  extractedFields?: AadhaarFields;
  validation?: ValidationResult;
  overallConfidence?: number;
  processingTime: number;
  error?: string;
}

export interface PANProcessingResult {
  status: 'completed' | 'failed';
  s3Key?: string;
  s3Bucket?: string;
  s3Url?: string;
  ocrResult?: TextractResult;
  extractedFields?: PANFields;
  validation?: ValidationResult;
  overallConfidence?: number;
  processingTime: number;
  error?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

// Export singleton instance
export const documentProcessorService = new DocumentProcessorService();