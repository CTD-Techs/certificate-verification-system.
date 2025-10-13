import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './User';

export enum NotificationType {
  VERIFICATION_COMPLETE = 'VERIFICATION_COMPLETE',
  MANUAL_REVIEW_ASSIGNED = 'MANUAL_REVIEW_ASSIGNED',
  VERIFICATION_FAILED = 'VERIFICATION_FAILED',
  SLA_WARNING = 'SLA_WARNING',
  SYSTEM_ALERT = 'SYSTEM_ALERT',
}

export enum NotificationChannel {
  EMAIL = 'EMAIL',
  WEBHOOK = 'WEBHOOK',
  IN_APP = 'IN_APP',
}

export enum NotificationStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  FAILED = 'FAILED',
  BOUNCED = 'BOUNCED',
}

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({
    type: 'enum',
    enum: NotificationType,
  })
  type: NotificationType;

  @Column({
    type: 'enum',
    enum: NotificationChannel,
  })
  channel: NotificationChannel;

  @Column({ length: 255 })
  recipient: string;

  @Column({ length: 255, nullable: true })
  subject?: string;

  @Column({ type: 'text' })
  body: string;

  @Column({
    type: 'enum',
    enum: NotificationStatus,
    default: NotificationStatus.PENDING,
  })
  status: NotificationStatus;

  @Column({ name: 'sent_at', type: 'timestamp with time zone', nullable: true })
  sentAt?: Date;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage?: string;

  @Column({ name: 'retry_count', type: 'integer', default: 0 })
  retryCount: number;

  @Column({ name: 'related_entity_type', length: 50, nullable: true })
  relatedEntityType?: string;

  @Column({ name: 'related_entity_id', type: 'uuid', nullable: true })
  relatedEntityId?: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}