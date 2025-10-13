import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Certificate } from './Certificate';
import { User } from './User';

export enum ReviewStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  ESCALATED = 'ESCALATED',
}

export enum ReviewPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum ReviewDecision {
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  NEEDS_INFO = 'NEEDS_INFO',
  ESCALATED = 'ESCALATED',
}

@Entity('manual_reviews')
export class ManualReview {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'certificate_id', type: 'uuid' })
  certificateId: string;

  @Column({ name: 'verifier_id', type: 'uuid', nullable: true })
  verifierId?: string;

  @Column({
    type: 'enum',
    enum: ReviewStatus,
    default: ReviewStatus.PENDING,
  })
  status: ReviewStatus;

  @Column({
    type: 'enum',
    enum: ReviewPriority,
    default: ReviewPriority.MEDIUM,
  })
  priority: ReviewPriority;

  @Column({ name: 'assigned_at', type: 'timestamp with time zone', nullable: true })
  assignedAt?: Date;

  @Column({ name: 'assigned_by', type: 'uuid', nullable: true })
  assignedBy?: string;

  @Column({
    type: 'enum',
    enum: ReviewDecision,
    nullable: true,
  })
  decision?: ReviewDecision;

  @Column({ type: 'text', nullable: true })
  comments?: string;

  @Column({ name: 'internal_notes', type: 'text', nullable: true })
  internalNotes?: string;

  @Column({ name: 'escalated_to', type: 'uuid', nullable: true })
  escalatedTo?: string;

  @Column({ name: 'escalation_reason', type: 'text', nullable: true })
  escalationReason?: string;

  @Column({ name: 'sla_deadline', type: 'timestamp with time zone', nullable: true })
  slaDeadline?: Date;

  @Column({ name: 'sla_breached', default: false })
  slaBreached: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;

  @Column({ name: 'started_at', type: 'timestamp with time zone', nullable: true })
  startedAt?: Date;

  @Column({ name: 'completed_at', type: 'timestamp with time zone', nullable: true })
  completedAt?: Date;

  // Relations
  @ManyToOne(() => Certificate, (certificate) => certificate.manualReviews, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'certificate_id' })
  certificate: Certificate;

  @ManyToOne(() => User, (user) => user.reviews, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'verifier_id' })
  verifier?: User;
}