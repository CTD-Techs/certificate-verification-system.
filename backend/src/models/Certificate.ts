import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from './User';
import { Verification } from './Verification';
import { ManualReview } from './ManualReview';
import { Consent } from './Consent';

export enum CertificateType {
  SCHOOL_CERTIFICATE = 'SCHOOL_CERTIFICATE',
  DEGREE = 'DEGREE',
  DIPLOMA = 'DIPLOMA',
  MARKSHEET = 'MARKSHEET',
  AADHAAR_CARD = 'AADHAAR_CARD',
  PAN_CARD = 'PAN_CARD',
  OTHER = 'OTHER',
}

export enum IssuerType {
  CBSE = 'CBSE',
  STATE_BOARD = 'STATE_BOARD',
  UNIVERSITY = 'UNIVERSITY',
  PROFESSIONAL_BODY = 'PROFESSIONAL_BODY',
  UIDAI = 'UIDAI',
  INCOME_TAX = 'INCOME_TAX',
  OTHER = 'OTHER',
}

export enum CertificateStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  VERIFIED = 'VERIFIED',
  UNVERIFIED = 'UNVERIFIED',
  MANUAL_REVIEW = 'MANUAL_REVIEW',
  FAILED = 'FAILED',
}

@Entity('certificates')
export class Certificate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'certificate_number', length: 100, nullable: true })
  certificateNumber?: string;

  @Column({
    name: 'certificate_type',
    type: 'enum',
    enum: CertificateType,
  })
  certificateType: CertificateType;

  @Column({ name: 'issuer_name', length: 255 })
  issuerName: string;

  @Column({
    name: 'issuer_type',
    type: 'enum',
    enum: IssuerType,
    nullable: true,
  })
  issuerType?: IssuerType;

  @Column({ name: 'student_name_hash', length: 64, nullable: true })
  studentNameHash?: string;

  @Column({ name: 'student_dob_hash', length: 64, nullable: true })
  studentDobHash?: string;

  @Column({ name: 'student_id_hash', length: 64, nullable: true })
  studentIdHash?: string;

  @Column({ name: 'aadhaar_number_hash', length: 64, nullable: true })
  aadhaarNumberHash?: string;

  @Column({ name: 'pan_number_hash', length: 64, nullable: true })
  panNumberHash?: string;

  @Column({ name: 'identity_verified', default: false })
  identityVerified: boolean;

  @Column({ name: 'identity_verified_at', type: 'timestamp with time zone', nullable: true })
  identityVerifiedAt?: Date;

  @Column({ name: 'certificate_data', type: 'jsonb' })
  certificateData: Record<string, any>;

  @Column({ name: 'file_path', length: 500, nullable: true })
  filePath?: string;

  @Column({ name: 'file_hash', length: 64, nullable: true })
  fileHash?: string;

  @Column({
    type: 'enum',
    enum: CertificateStatus,
    default: CertificateStatus.PENDING,
  })
  status: CertificateStatus;

  @Column({ name: 'has_qr_code', default: false })
  hasQrCode: boolean;

  @Column({ name: 'has_digital_signature', default: false })
  hasDigitalSignature: boolean;

  @Column({ name: 'issue_date', type: 'date', nullable: true })
  issueDate?: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt: Date;

  @Column({ name: 'verified_at', type: 'timestamp with time zone', nullable: true })
  verifiedAt?: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.certificates, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToMany(() => Verification, (verification) => verification.certificate)
  verifications: Verification[];

  @OneToMany(() => ManualReview, (review) => review.certificate)
  manualReviews: ManualReview[];

  @OneToMany(() => Consent, (consent) => consent.certificate)
  consents: Consent[];
}