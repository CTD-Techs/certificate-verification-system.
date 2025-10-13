import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Certificate } from './Certificate';
import { VerificationStep } from './VerificationStep';

export enum VerificationType {
  DIGITAL = 'DIGITAL',
  PORTAL = 'PORTAL',
  MANUAL = 'MANUAL',
  FORENSIC = 'FORENSIC',
  COMBINED = 'COMBINED',
}

export enum VerificationStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export enum VerificationResult {
  VERIFIED = 'VERIFIED',
  UNVERIFIED = 'UNVERIFIED',
  INCONCLUSIVE = 'INCONCLUSIVE',
}

@Entity('verifications')
export class Verification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'certificate_id', type: 'uuid' })
  certificateId: string;

  @Column({
    name: 'verification_type',
    type: 'enum',
    enum: VerificationType,
  })
  verificationType: VerificationType;

  @Column({
    type: 'enum',
    enum: VerificationStatus,
    default: VerificationStatus.PENDING,
  })
  status: VerificationStatus;

  @Column({
    type: 'enum',
    enum: VerificationResult,
    nullable: true,
  })
  result?: VerificationResult;

  @Column({ name: 'confidence_score', type: 'decimal', precision: 5, scale: 2, nullable: true })
  confidenceScore?: number;

  @Column({ name: 'result_data', type: 'jsonb', nullable: true })
  resultData?: Record<string, any>;

  @Column({ name: 'evidence_files', type: 'text', array: true, nullable: true })
  evidenceFiles?: string[];

  @Column({ name: 'external_reference', length: 255, nullable: true })
  externalReference?: string;

  @Column({ name: 'started_at', type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP' })
  startedAt: Date;

  @Column({ name: 'completed_at', type: 'timestamp with time zone', nullable: true })
  completedAt?: Date;

  @Column({ name: 'duration_ms', type: 'integer', nullable: true })
  durationMs?: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => Certificate, (certificate) => certificate.verifications, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'certificate_id' })
  certificate: Certificate;

  @OneToMany(() => VerificationStep, (step) => step.verification)
  steps: VerificationStep[];
}