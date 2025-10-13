import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Certificate } from './Certificate';
import { ManualReview } from './ManualReview';
import { AuditLog } from './AuditLog';

export enum UserRole {
  ADMIN = 'ADMIN',
  VERIFIER = 'VERIFIER',
  API_USER = 'API_USER',
  AUDITOR = 'AUDITOR',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 255 })
  email: string;

  @Column({ name: 'password_hash', length: 255 })
  passwordHash: string;

  @Column({ name: 'first_name', length: 100, nullable: true })
  firstName?: string;

  @Column({ name: 'last_name', length: 100, nullable: true })
  lastName?: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.API_USER,
  })
  role: UserRole;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'last_login_at', type: 'timestamp with time zone', nullable: true })
  lastLoginAt?: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt: Date;

  // Relations
  @OneToMany(() => Certificate, (certificate) => certificate.user)
  certificates: Certificate[];

  @OneToMany(() => ManualReview, (review) => review.verifier)
  reviews: ManualReview[];

  @OneToMany(() => AuditLog, (log) => log.user)
  auditLogs: AuditLog[];
}