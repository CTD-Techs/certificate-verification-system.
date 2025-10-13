import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Verification } from './Verification';

export enum StepType {
  QR_VALIDATION = 'QR_VALIDATION',
  SIGNATURE_CHECK = 'SIGNATURE_CHECK',
  PORTAL_LOOKUP = 'PORTAL_LOOKUP',
  FONT_ANALYSIS = 'FONT_ANALYSIS',
  METADATA_CHECK = 'METADATA_CHECK',
  TEMPLATE_MATCH = 'TEMPLATE_MATCH',
  MANUAL_REVIEW = 'MANUAL_REVIEW',
  API_CALL = 'API_CALL',
}

export enum StepStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  SKIPPED = 'SKIPPED',
}

@Entity('verification_steps')
export class VerificationStep {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'verification_id', type: 'uuid' })
  verificationId: string;

  @Column({
    name: 'step_type',
    type: 'enum',
    enum: StepType,
  })
  stepType: StepType;

  @Column({ name: 'step_name', length: 100 })
  stepName: string;

  @Column({
    type: 'enum',
    enum: StepStatus,
  })
  status: StepStatus;

  @Column({ type: 'jsonb', nullable: true })
  result?: Record<string, any>;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage?: string;

  @Column({ type: 'jsonb', nullable: true })
  evidence?: Record<string, any>;

  @Column({ name: 'executed_at', type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP' })
  executedAt: Date;

  @Column({ name: 'duration_ms', type: 'integer', nullable: true })
  durationMs?: number;

  @Column({ name: 'sequence_number', type: 'integer' })
  sequenceNumber: number;

  // Relations
  @ManyToOne(() => Verification, (verification) => verification.steps, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'verification_id' })
  verification: Verification;
}