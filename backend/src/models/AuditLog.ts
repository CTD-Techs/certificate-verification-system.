import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './User';

export enum EntityType {
  CERTIFICATE = 'CERTIFICATE',
  VERIFICATION = 'VERIFICATION',
  USER = 'USER',
  MANUAL_REVIEW = 'MANUAL_REVIEW',
  CONSENT = 'CONSENT',
}

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    name: 'entity_type',
    type: 'enum',
    enum: EntityType,
  })
  entityType: EntityType;

  @Column({ name: 'entity_id', type: 'uuid' })
  entityId: string;

  @Column({ length: 100 })
  action: string;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId?: string;

  @Column({ name: 'user_email', length: 255, nullable: true })
  userEmail?: string;

  @Column({ type: 'jsonb', nullable: true })
  changes?: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @Column({ name: 'ip_address', type: 'inet', nullable: true })
  ipAddress?: string;

  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent?: string;

  @Column({ name: 'request_id', length: 100, nullable: true })
  requestId?: string;

  @Column({ length: 64 })
  hash: string;

  @Column({ name: 'previous_hash', length: 64, nullable: true })
  previousHash?: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.auditLogs, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'user_id' })
  user?: User;
}