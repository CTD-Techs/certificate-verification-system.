import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadBucketCommand,
  CreateBucketCommand,
  BucketLocationConstraint,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Readable } from 'stream';
import crypto from 'crypto';
import path from 'path';
import logger from '../../utils/logger';

/**
 * AWS S3 Service for document storage and management
 * Handles file uploads, downloads, deletion, and pre-signed URL generation
 */
export class S3Service {
  private s3Client: S3Client;
  private bucketName: string;
  private region: string;
  private mockMode: boolean;

  constructor() {
    this.region = process.env.AWS_REGION || 'ap-south-1';
    this.bucketName = process.env.AWS_S3_BUCKET || 'certificate-verification-documents';
    this.mockMode = process.env.MOCK_MODE === 'true';

    // Initialize S3 client
    this.s3Client = new S3Client({
      region: this.region,
      credentials: this.mockMode
        ? undefined
        : {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
          },
    });

    logger.info('S3Service initialized', {
      region: this.region,
      bucket: this.bucketName,
      mockMode: this.mockMode,
    });
  }

  /**
   * Upload a file to S3
   * @param file - File buffer to upload
   * @param fileName - Original file name
   * @param contentType - MIME type of the file
   * @param metadata - Additional metadata to store with the file
   * @returns S3 key and URL of the uploaded file
   */
  async uploadFile(
    file: Buffer,
    fileName: string,
    contentType: string,
    metadata?: Record<string, string>
  ): Promise<{ key: string; url: string; bucket: string }> {
    try {
      console.log('[S3] Upload file called, mockMode:', this.mockMode);
      if (this.mockMode) {
        console.log('[S3] Using mock upload');
        return this.mockUploadFile(fileName);
      }

      // Generate unique key with timestamp and random hash
      const timestamp = Date.now();
      const hash = crypto.randomBytes(8).toString('hex');
      const ext = path.extname(fileName);
      const baseName = path.basename(fileName, ext);
      const key = `documents/${timestamp}-${hash}-${baseName}${ext}`;
      console.log('[S3] Generated S3 key:', key);

      console.log('[S3] Creating PutObjectCommand...');
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: file,
        ContentType: contentType,
        Metadata: metadata,
        ServerSideEncryption: 'AES256',
      });

      console.log('[S3] Sending command to S3...');
      await this.s3Client.send(command);
      console.log('[S3] S3 upload command completed successfully');

      const url = `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${key}`;

      logger.info('File uploaded to S3', { key, bucket: this.bucketName });

      return { key, url, bucket: this.bucketName };
    } catch (error) {
      console.error('[S3 ERROR] Upload failed:', error);
      console.error('[S3 ERROR] Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        name: error instanceof Error ? error.name : undefined,
        stack: error instanceof Error ? error.stack : undefined
      });
      logger.error('Error uploading file to S3', { error, fileName });
      throw new Error(`Failed to upload file to S3: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate a pre-signed URL for temporary file access
   * @param key - S3 object key
   * @param expiresIn - URL expiration time in seconds (default: 1 hour)
   * @returns Pre-signed URL
   */
  async getPresignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    try {
      if (this.mockMode) {
        return this.mockGetPresignedUrl(key);
      }

      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const url = await getSignedUrl(this.s3Client, command, { expiresIn });

      logger.info('Generated pre-signed URL', { key, expiresIn });

      return url;
    } catch (error) {
      logger.error('Error generating pre-signed URL', { error, key });
      throw new Error(`Failed to generate pre-signed URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Download a file from S3
   * @param key - S3 object key
   * @returns File buffer
   */
  async downloadFile(key: string): Promise<Buffer> {
    try {
      if (this.mockMode) {
        return this.mockDownloadFile(key);
      }

      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const response = await this.s3Client.send(command);

      if (!response.Body) {
        throw new Error('No file body returned from S3');
      }

      // Convert stream to buffer
      const stream = response.Body as Readable;
      const chunks: Buffer[] = [];

      for await (const chunk of stream) {
        chunks.push(chunk);
      }

      const buffer = Buffer.concat(chunks);

      logger.info('File downloaded from S3', { key, size: buffer.length });

      return buffer;
    } catch (error) {
      logger.error('Error downloading file from S3', { error, key });
      throw new Error(`Failed to download file from S3: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete a file from S3
   * @param key - S3 object key
   */
  async deleteFile(key: string): Promise<void> {
    try {
      if (this.mockMode) {
        logger.info('Mock: File deleted from S3', { key });
        return;
      }

      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.s3Client.send(command);

      logger.info('File deleted from S3', { key });
    } catch (error) {
      logger.error('Error deleting file from S3', { error, key });
      throw new Error(`Failed to delete file from S3: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check if bucket exists, create if it doesn't
   */
  async ensureBucketExists(): Promise<void> {
    try {
      if (this.mockMode) {
        logger.info('Mock: Bucket exists', { bucket: this.bucketName });
        return;
      }

      const headCommand = new HeadBucketCommand({
        Bucket: this.bucketName,
      });

      await this.s3Client.send(headCommand);

      logger.info('Bucket exists', { bucket: this.bucketName });
    } catch (error: any) {
      if (error.name === 'NotFound') {
        logger.info('Bucket not found, creating...', { bucket: this.bucketName });

        const createCommand = new CreateBucketCommand({
          Bucket: this.bucketName,
          CreateBucketConfiguration: {
            LocationConstraint: this.region as BucketLocationConstraint,
          },
        });

        await this.s3Client.send(createCommand);

        logger.info('Bucket created', { bucket: this.bucketName });
      } else {
        logger.error('Error checking bucket', { error });
        throw error;
      }
    }
  }

  // Mock methods for local testing

  private mockUploadFile(fileName: string): { key: string; url: string; bucket: string } {
    const timestamp = Date.now();
    const hash = crypto.randomBytes(8).toString('hex');
    const ext = path.extname(fileName);
    const baseName = path.basename(fileName, ext);
    const key = `documents/${timestamp}-${hash}-${baseName}${ext}`;
    const url = `http://localhost:3000/mock-s3/${key}`;

    console.log('[S3 MOCK] Mock upload completed:', { key, url, bucket: this.bucketName });
    logger.info('Mock: File uploaded to S3', { key, bucket: this.bucketName });

    return { key, url, bucket: this.bucketName };
  }

  private mockGetPresignedUrl(key: string): string {
    const url = `http://localhost:3000/mock-s3/${key}?expires=${Date.now() + 3600000}`;
    logger.info('Mock: Generated pre-signed URL', { key });
    return url;
  }

  private mockDownloadFile(key: string): Buffer {
    // Return a mock buffer with some sample data
    const mockData = JSON.stringify({
      message: 'Mock file content',
      key,
      timestamp: new Date().toISOString(),
    });

    logger.info('Mock: File downloaded from S3', { key });

    return Buffer.from(mockData);
  }
}

// Export singleton instance
export const s3Service = new S3Service();