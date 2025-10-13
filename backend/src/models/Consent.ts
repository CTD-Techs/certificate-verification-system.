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

export enum ConsentPurpose {
  VERIFICATION = 'VERIFICATION',
  STORAGE = 'STORAGE',
  THIRD_PARTY_SHARING = 'THIRD_PARTY_SHARING',
  ANALYTICS = 'ANALYTICS',
}

@Entity('consents')
export class Consent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'certificate_id', type: 'uuid' })
  certificateId: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({
    type: 'enum',
    enum: ConsentPurpose,
  })
  purpose: ConsentPurpose;

  @Column({ default: false })
  granted: boolean;

  @Column({ name: 'consent_text', type: 'text' })
  consentText: string;

  @Column({ name: 'consent_version', length: 20 })
  consentVersion: string;

  @Column({ name: 'granted_at', type: 'timestamp with time zone', nullable: true })
  grantedAt?: Date;

  @Column({ name: 'expires_at', type: 'timestamp with time zone', nullable: true })
  expiresAt?: Date;

  @Column({ name: 'revoked_at', type: 'timestamp with time zone', nullable: true })
  revokedAt?: Date;

  @Column({ name: 'ip_address', type: 'inet', nullable: true })
  ipAddress?: string;

  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent?: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => Certificate, (certificate) => certificate.consents, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'certificate_id' })
  certificate: Certificate;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}