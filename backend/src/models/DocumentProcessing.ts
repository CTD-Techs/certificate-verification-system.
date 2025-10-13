import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './User';

/**
 * Document Processing Entity
 * Tracks document processing status, results, and metadata
 */
@Entity('document_processing')
export class DocumentProcessing {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ name: 'document_type', type: 'varchar', length: 50 })
  documentType!: 'aadhaar' | 'pan';

  @Column({ name: 'original_filename', type: 'varchar', length: 255 })
  originalFilename!: string;

  @Column({ name: 's3_key', type: 'varchar', length: 500 })
  s3Key!: string;

  @Column({ name: 's3_bucket', type: 'varchar', length: 255 })
  s3Bucket!: string;

  @Column({ name: 's3_url', type: 'text' })
  s3Url!: string;

  @Column({ name: 'processing_status', type: 'varchar', length: 50 })
  processingStatus!: 'pending' | 'processing' | 'completed' | 'failed';

  @Column({ name: 'ocr_text', type: 'text', nullable: true })
  ocrText?: string;

  @Column({ name: 'ocr_confidence', type: 'decimal', precision: 5, scale: 2, nullable: true })
  ocrConfidence?: number;

  @Column({ name: 'extracted_fields', type: 'jsonb', nullable: true })
  extractedFields?: Record<string, any>;

  @Column({ name: 'extraction_confidence', type: 'decimal', precision: 5, scale: 2, nullable: true })
  extractionConfidence?: number;

  @Column({ name: 'validation_errors', type: 'jsonb', nullable: true })
  validationErrors?: string[];

  @Column({ name: 'overall_confidence', type: 'decimal', precision: 5, scale: 2, nullable: true })
  overallConfidence?: number;

  @Column({ name: 'processing_time_ms', type: 'integer', nullable: true })
  processingTimeMs?: number;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage?: string;

  @Column({ name: 'corrected_fields', type: 'jsonb', nullable: true })
  correctedFields?: Record<string, any>;

  @Column({ name: 'correction_notes', type: 'text', nullable: true })
  correctionNotes?: string;

  @Column({ name: 'is_verified', type: 'boolean', default: false })
  isVerified!: boolean;

  @Column({ name: 'verified_at', type: 'timestamp', nullable: true })
  verifiedAt?: Date;

  @Column({ name: 'verified_by', type: 'uuid', nullable: true })
  verifiedBy?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}