
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { User, UserRole } from '../models/User';
import { Certificate, CertificateType, IssuerType, CertificateStatus } from '../models/Certificate';
import { Verification, VerificationType, VerificationStatus, VerificationResult } from '../models/Verification';
import { VerificationStep, StepType, StepStatus } from '../models/VerificationStep';
import { ManualReview, ReviewStatus, ReviewPriority, ReviewDecision } from '../models/ManualReview';
import { AuditLog, EntityType } from '../models/AuditLog';
import { Consent } from '../models/Consent';
import { Notification } from '../models/Notification';
import { hashPassword, hashSensitiveData, generateAuditHash } from '../utils/crypto';

/**
 * Database Seed Script
 * Populates the database with demo data for testing
 */

interface DemoUser {
  email: string;
  password: string;
  role: UserRole;
  firstName: string;
  lastName: string;
}

const DEMO_USERS: DemoUser[] = [
  {
    email: 'admin@certverify.com',
    password: 'Admin123!',
    role: UserRole.ADMIN,
    firstName: 'Admin',
    lastName: 'User',
  },
  {
    email: 'verifier@certverify.com',
    password: 'Verifier123!',
    role: UserRole.VERIFIER,
    firstName: 'Verifier',
    lastName: 'User',
  },
  {
    email: 'user@certverify.com',
    password: 'User123!',
    role: UserRole.API_USER,
    firstName: 'API',
    lastName: 'User',
  },
];

async function clearDatabase(dataSource: DataSource) {
  console.log('🗑️  Clearing existing data...');
  
  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();
  
  try {
    // Check if tables exist before truncating
    const tables = ['audit_logs', 'verification_steps', 'manual_reviews', 'verifications', 'consents', 'notifications', 'certificates', 'users'];
    
    for (const table of tables) {
      try {
        await queryRunner.query(`TRUNCATE TABLE ${table} CASCADE`);
      } catch (error: any) {
        // Ignore error if table doesn't exist (code 42P01)
        if (error.code !== '42P01') {
          throw error;
        }
      }
    }
    
    console.log('✅ Database cleared successfully');
  } catch (error) {
    console.error('❌ Error clearing database:', error);
    throw error;
  } finally {
    await queryRunner.release();
  }
}

async function createUsers(dataSource: DataSource): Promise<User[]> {
  console.log('👥 Creating demo users...');
  
  const userRepository = dataSource.getRepository(User);
  const users: User[] = [];
  
  for (const demoUser of DEMO_USERS) {
    const passwordHash = await hashPassword(demoUser.password);
    
    const user = userRepository.create({
      email: demoUser.email,
      passwordHash,
      firstName: demoUser.firstName,
      lastName: demoUser.lastName,
      role: demoUser.role,
      isActive: true,
      lastLoginAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Random within last 7 days
    });
    
    await userRepository.save(user);
    users.push(user);
    
    console.log(`  ✓ Created ${demoUser.role}: ${demoUser.email}`);
  }
  
  return users;
}

async function createCertificates(dataSource: DataSource, users: User[]): Promise<Certificate[]> {
  console.log('📜 Creating demo certificates...');
  
  const certificateRepository = dataSource.getRepository(Certificate);
  const apiUser = users.find(u => u.role === UserRole.API_USER)!;
  const certificates: Certificate[] = [];
  
  // CBSE 10th Grade Certificates (5 examples)
  const cbse10thCerts = [
    {
      certificateNumber: 'CBSE/2023/10TH/001234',
      studentName: 'Rahul Sharma',
      rollNumber: '1234567',
      dateOfBirth: '2007-05-15',
      examYear: '2023',
      grade: '10th',
      school: 'Delhi Public School, New Delhi',
      hasQrCode: true,
      hasDigitalSignature: true,
      status: CertificateStatus.VERIFIED,
    },
    {
      certificateNumber: 'CBSE/2023/10TH/002345',
      studentName: 'Priya Patel',
      rollNumber: '2345678',
      dateOfBirth: '2007-08-22',
      examYear: '2023',
      grade: '10th',
      school: 'Kendriya Vidyalaya, Mumbai',
      hasQrCode: true,
      hasDigitalSignature: false,
      status: CertificateStatus.VERIFIED,
    },
    {
      certificateNumber: 'CBSE/2023/10TH/003456',
      studentName: 'Amit Kumar',
      rollNumber: '3456789',
      dateOfBirth: '2007-03-10',
      examYear: '2023',
      grade: '10th',
      school: 'DAV Public School, Bangalore',
      hasQrCode: false,
      hasDigitalSignature: true,
      status: CertificateStatus.PENDING,
    },
    {
      certificateNumber: 'CBSE/2022/10TH/004567',
      studentName: 'Sneha Reddy',
      rollNumber: '4567890',
      dateOfBirth: '2006-11-18',
      examYear: '2022',
      grade: '10th',
      school: 'Ryan International School, Hyderabad',
      hasQrCode: true,
      hasDigitalSignature: true,
      status: CertificateStatus.MANUAL_REVIEW,
    },
    {
      certificateNumber: 'CBSE/2023/10TH/005678',
      studentName: 'Vikram Singh',
      rollNumber: '5678901',
      dateOfBirth: '2007-01-25',
      examYear: '2023',
      grade: '10th',
      school: 'St. Xavier\'s School, Kolkata',
      hasQrCode: false,
      hasDigitalSignature: false,
      status: CertificateStatus.UNVERIFIED,
    },
  ];
  
  for (const certData of cbse10thCerts) {
    const certificate = certificateRepository.create({
      userId: apiUser.id,
      certificateNumber: certData.certificateNumber,
      certificateType: CertificateType.SCHOOL_CERTIFICATE,
      issuerName: 'Central Board of Secondary Education',
      issuerType: IssuerType.CBSE,
      studentNameHash: hashSensitiveData(certData.studentName),
      studentDobHash: hashSensitiveData(certData.dateOfBirth),
      studentIdHash: hashSensitiveData(certData.rollNumber),
      certificateData: {
        studentName: certData.studentName,
        rollNumber: certData.rollNumber,
        dateOfBirth: certData.dateOfBirth,
        examYear: certData.examYear,
        grade: certData.grade,
        school: certData.school,
        board: 'CBSE',
        registrationNumber: certData.certificateNumber,
        ...(certData.hasQrCode && {
          qrCodeData: `https://digilocker.gov.in/verify/${certData.certificateNumber}`,
        }),
        ...(certData.hasDigitalSignature && {
          digitalSignature: Buffer.from(`signature_${certData.certificateNumber}`).toString('base64'),
        }),
      },
      hasQrCode: certData.hasQrCode,
      hasDigitalSignature: certData.hasDigitalSignature,
      status: certData.status,
      issueDate: new Date(`${certData.examYear}-06-20`),
      verifiedAt: certData.status === CertificateStatus.VERIFIED ? new Date() : undefined,
    });
    
    await certificateRepository.save(certificate);
    certificates.push(certificate);
  }
  
  // CBSE 12th Grade Certificates (3 examples)
  const cbse12thCerts = [
    {
      certificateNumber: 'CBSE/2023/12TH/101234',
      studentName: 'Ananya Gupta',
      rollNumber: '1012345',
      dateOfBirth: '2005-04-12',
      examYear: '2023',
      grade: '12th',
      stream: 'Science',
      school: 'Delhi Public School, Gurgaon',
      hasQrCode: true,
      hasDigitalSignature: true,
      status: CertificateStatus.VERIFIED,
    },
    {
      certificateNumber: 'CBSE/2023/12TH/102345',
      studentName: 'Rohan Mehta',
      rollNumber: '1023456',
      dateOfBirth: '2005-09-08',
      examYear: '2023',
      grade: '12th',
      stream: 'Commerce',
      school: 'Modern School, Delhi',
      hasQrCode: true,
      hasDigitalSignature: true,
      status: CertificateStatus.VERIFIED,
    },
    {
      certificateNumber: 'CBSE/2023/12TH/103456',
      studentName: 'Kavya Iyer',
      rollNumber: '1034567',
      dateOfBirth: '2005-07-20',
      examYear: '2023',
      grade: '12th',
      stream: 'Arts',
      school: 'Sardar Patel Vidyalaya, Delhi',
      hasQrCode: false,
      hasDigitalSignature: true,
      status: CertificateStatus.PENDING,
    },
  ];
  
  for (const certData of cbse12thCerts) {
    const certificate = certificateRepository.create({
      userId: apiUser.id,
      certificateNumber: certData.certificateNumber,
      certificateType: CertificateType.SCHOOL_CERTIFICATE,
      issuerName: 'Central Board of Secondary Education',
      issuerType: IssuerType.CBSE,
      studentNameHash: hashSensitiveData(certData.studentName),
      studentDobHash: hashSensitiveData(certData.dateOfBirth),
      studentIdHash: hashSensitiveData(certData.rollNumber),
      certificateData: {
        studentName: certData.studentName,
        rollNumber: certData.rollNumber,
        dateOfBirth: certData.dateOfBirth,
        examYear: certData.examYear,
        grade: certData.grade,
        stream: certData.stream,
        school: certData.school,
        board: 'CBSE',
        registrationNumber: certData.certificateNumber,
        ...(certData.hasQrCode && {
          qrCodeData: `https://digilocker.gov.in/verify/${certData.certificateNumber}`,
        }),
        ...(certData.hasDigitalSignature && {
          digitalSignature: Buffer.from(`signature_${certData.certificateNumber}`).toString('base64'),
        }),
      },
      hasQrCode: certData.hasQrCode,
      hasDigitalSignature: certData.hasDigitalSignature,
      status: certData.status,
      issueDate: new Date(`${certData.examYear}-06-20`),
      verifiedAt: certData.status === CertificateStatus.VERIFIED ? new Date() : undefined,
    });
    
    await certificateRepository.save(certificate);
    certificates.push(certificate);
  }
  
  // University Degree Certificates (3 examples)
  const universityCerts = [
    {
      certificateNumber: 'DU/2023/BSC/001234',
      studentName: 'Arjun Kapoor',
      rollNumber: 'DU2020001234',
      dateOfBirth: '2002-03-15',
      graduationYear: '2023',
      degree: 'Bachelor of Science',
      major: 'Computer Science',
      university: 'University of Delhi',
      hasQrCode: true,
      hasDigitalSignature: true,
      status: CertificateStatus.VERIFIED,
    },
    {
      certificateNumber: 'MU/2023/BCOM/002345',
      studentName: 'Neha Desai',
      rollNumber: 'MU2020002345',
      dateOfBirth: '2002-06-22',
      graduationYear: '2023',
      degree: 'Bachelor of Commerce',
      major: 'Accounting',
      university: 'Mumbai University',
      hasQrCode: false,
      hasDigitalSignature: true,
      status: CertificateStatus.PENDING,
    },
    {
      certificateNumber: 'BU/2023/BA/003456',
      studentName: 'Siddharth Joshi',
      rollNumber: 'BU2020003456',
      dateOfBirth: '2002-11-10',
      graduationYear: '2023',
      degree: 'Bachelor of Arts',
      major: 'English Literature',
      university: 'Bangalore University',
      hasQrCode: true,
      hasDigitalSignature: false,
      status: CertificateStatus.MANUAL_REVIEW,
    },
  ];
  
  for (const certData of universityCerts) {
    const certificate = certificateRepository.create({
      userId: apiUser.id,
      certificateNumber: certData.certificateNumber,
      certificateType: CertificateType.DEGREE,
      issuerName: certData.university,
      issuerType: IssuerType.UNIVERSITY,
      studentNameHash: hashSensitiveData(certData.studentName),
      studentDobHash: hashSensitiveData(certData.dateOfBirth),
      studentIdHash: hashSensitiveData(certData.rollNumber),
      certificateData: {
        studentName: certData.studentName,
        rollNumber: certData.rollNumber,
        dateOfBirth: certData.dateOfBirth,
        graduationYear: certData.graduationYear,
        degree: certData.degree,
        major: certData.major,
        university: certData.university,
        registrationNumber: certData.certificateNumber,
        ...(certData.hasQrCode && {
          qrCodeData: `https://verify.${certData.university.toLowerCase().replace(/\s+/g, '')}.edu/${certData.certificateNumber}`,
        }),
        ...(certData.hasDigitalSignature && {
          digitalSignature: Buffer.from(`signature_${certData.certificateNumber}`).toString('base64'),
        }),
      },
      hasQrCode: certData.hasQrCode,
      hasDigitalSignature: certData.hasDigitalSignature,
      status: certData.status,
      issueDate: new Date(`${certData.graduationYear}-07-15`),
      verifiedAt: certData.status === CertificateStatus.VERIFIED ? new Date() : undefined,
    });
    
    await certificateRepository.save(certificate);
    certificates.push(certificate);
  }
  
  // Diploma Certificates (2 examples)
  const diplomaCerts = [
    {
      certificateNumber: 'POLY/2023/DIP/001234',
      studentName: 'Manish Yadav',
      rollNumber: 'POLY2021001234',
      dateOfBirth: '2003-02-18',
      completionYear: '2023',
      diploma: 'Diploma in Mechanical Engineering',
      institute: 'Government Polytechnic, Delhi',
      hasQrCode: true,
      hasDigitalSignature: true,
      status: CertificateStatus.VERIFIED,
    },
    {
      certificateNumber: 'POLY/2023/DIP/002345',
      studentName: 'Pooja Nair',
      rollNumber: 'POLY2021002345',
      dateOfBirth: '2003-08-05',
      completionYear: '2023',
      diploma: 'Diploma in Computer Applications',
      institute: 'NIIT Polytechnic, Mumbai',
      hasQrCode: false,
      hasDigitalSignature: false,
      status: CertificateStatus.UNVERIFIED,
    },
  ];
  
  for (const certData of diplomaCerts) {
    const certificate = certificateRepository.create({
      userId: apiUser.id,
      certificateNumber: certData.certificateNumber,
      certificateType: CertificateType.DIPLOMA,
      issuerName: certData.institute,
      issuerType: IssuerType.PROFESSIONAL_BODY,
      studentNameHash: hashSensitiveData(certData.studentName),
      studentDobHash: hashSensitiveData(certData.dateOfBirth),
      studentIdHash: hashSensitiveData(certData.rollNumber),
      certificateData: {
        studentName: certData.studentName,
        rollNumber: certData.rollNumber,
        dateOfBirth: certData.dateOfBirth,
        completionYear: certData.completionYear,
        diploma: certData.diploma,
        institute: certData.institute,
        registrationNumber: certData.certificateNumber,
        ...(certData.hasQrCode && {
          qrCodeData: `https://verify.polytechnic.edu/${certData.certificateNumber}`,
        }),
        ...(certData.hasDigitalSignature && {
          digitalSignature: Buffer.from(`signature_${certData.certificateNumber}`).toString('base64'),
        }),
      },
      hasQrCode: certData.hasQrCode,
      hasDigitalSignature: certData.hasDigitalSignature,
      status: certData.status,
      issueDate: new Date(`${certData.completionYear}-05-30`),
      verifiedAt: certData.status === CertificateStatus.VERIFIED ? new Date() : undefined,
    });
    
    await certificateRepository.save(certificate);
    certificates.push(certificate);
  }
  
  console.log(`  ✓ Created ${certificates.length} certificates`);
  return certificates;
}

async function createVerifications(dataSource: DataSource, certificates: Certificate[]): Promise<Verification[]> {
  console.log('🔍 Creating verifications...');
  
  const verificationRepository = dataSource.getRepository(Verification);
  const stepRepository = dataSource.getRepository(VerificationStep);
  const verifications: Verification[] = [];
  
  for (const certificate of certificates) {
    // Skip pending certificates (no verification started yet)
    if (certificate.status === CertificateStatus.PENDING) {
      continue;
    }
    
    let verificationType: VerificationType;
    let verificationStatus: VerificationStatus;
    let verificationResult: VerificationResult | undefined;
    let confidenceScore: number | undefined;
    
    if (certificate.status === CertificateStatus.VERIFIED) {
      verificationType = certificate.hasQrCode && certificate.hasDigitalSignature 
        ? VerificationType.COMBINED 
        : certificate.hasQrCode 
        ? VerificationType.DIGITAL 
        : VerificationType.PORTAL;
      verificationStatus = VerificationStatus.COMPLETED;
      verificationResult = VerificationResult.VERIFIED;
      confidenceScore = 85 + Math.random() * 15; // 85-100
    } else if (certificate.status === CertificateStatus.UNVERIFIED) {
      verificationType = VerificationType.FORENSIC;
      verificationStatus = VerificationStatus.COMPLETED;
      verificationResult = VerificationResult.UNVERIFIED;
      confidenceScore = 20 + Math.random() * 30; // 20-50
    } else if (certificate.status === CertificateStatus.MANUAL_REVIEW) {
      verificationType = VerificationType.COMBINED;
      verificationStatus = VerificationStatus.COMPLETED;
      verificationResult = VerificationResult.INCONCLUSIVE;
      confidenceScore = 50 + Math.random() * 20; // 50-70
    } else {
      verificationType = VerificationType.COMBINED;
      verificationStatus = VerificationStatus.IN_PROGRESS;
      verificationResult = undefined;
      confidenceScore = undefined;
    }
    
    const startedAt = new Date(certificate.createdAt.getTime() + 60000); // 1 minute after creation
    const completedAt = verificationStatus === VerificationStatus.COMPLETED 
      ? new Date(startedAt.getTime() + 5000 + Math.random() * 10000) // 5-15 seconds
      : undefined;
    
    const verification = verificationRepository.create({
      certificateId: certificate.id,
      verificationType,
      status: verificationStatus,
      result: verificationResult,
      confidenceScore: confidenceScore ? Math.round(confidenceScore * 100) / 100 : undefined,
      resultData: {
        checks: {
          qrCode: certificate.hasQrCode ? { valid: verificationResult === VerificationResult.VERIFIED } : undefined,
          digitalSignature: certificate.hasDigitalSignature ? { valid: verificationResult === VerificationResult.VERIFIED } : undefined,
          portalLookup: { found: verificationResult !== VerificationResult.UNVERIFIED },
          forensicAnalysis: { suspicious: verificationResult === VerificationResult.UNVERIFIED },
        },
      },
      startedAt,
      completedAt,
      durationMs: completedAt ? completedAt.getTime() - startedAt.getTime() : undefined,
    });
    
    await verificationRepository.save(verification);
    verifications.push(verification);
    
    // Create verification steps
    const steps: Partial<VerificationStep>[] = [];
    let sequenceNumber = 1;
    
    if (certificate.hasQrCode) {
      steps.push({
        verificationId: verification.id,
        stepType: StepType.QR_VALIDATION,
        stepName: 'QR Code Validation',
        status: StepStatus.COMPLETED,
        result: { valid: verificationResult === VerificationResult.VERIFIED },
        sequenceNumber: sequenceNumber++,
        durationMs: Math.round(1000 + Math.random() * 2000),
      });
    }
    
    if (certificate.hasDigitalSignature) {
      steps.push({
        verificationId: verification.id,
        stepType: StepType.SIGNATURE_CHECK,
        stepName: 'Digital Signature Verification',
        status: StepStatus.COMPLETED,
        result: { valid: verificationResult === VerificationResult.VERIFIED },
        sequenceNumber: sequenceNumber++,
        durationMs: Math.round(1500 + Math.random() * 2500),
      });
    }
    
    steps.push({
      verificationId: verification.id,
      stepType: StepType.PORTAL_LOOKUP,
      stepName: 'Issuer Portal Lookup',
      status: StepStatus.COMPLETED,
      result: {
        found: verificationResult !== VerificationResult.UNVERIFIED,
        matchScore: verificationResult === VerificationResult.VERIFIED ? 95 : 60,
      },
      sequenceNumber: sequenceNumber++,
      durationMs: Math.round(2000 + Math.random() * 3000),
    });
    
    if (verificationResult === VerificationResult.UNVERIFIED || verificationResult === VerificationResult.INCONCLUSIVE) {
      steps.push({
        verificationId: verification.id,
        stepType: StepType.FONT_ANALYSIS,
        stepName: 'Font Analysis',
        status: StepStatus.COMPLETED,
        result: {
          suspicious: verificationResult === VerificationResult.UNVERIFIED,
          confidence: verificationResult === VerificationResult.UNVERIFIED ? 85 : 55,
        },
        sequenceNumber: sequenceNumber++,
        durationMs: Math.round(3000 + Math.random() * 4000),
      });
      
      steps.push({
        verificationId: verification.id,
        stepType: StepType.TEMPLATE_MATCH,
        stepName: 'Template Matching',
        status: StepStatus.COMPLETED,
        result: {
          matchScore: verificationResult === VerificationResult.UNVERIFIED ? 45 : 65,
        },
        sequenceNumber: sequenceNumber++,
        durationMs: Math.round(2500 + Math.random() * 3500),
      });
    }
    
    for (const stepData of steps) {
      const step = stepRepository.create(stepData);
      await stepRepository.save(step);
    }
  }
  
  console.log(`  ✓ Created ${verifications.length} verifications`);
  return verifications;
}

async function createManualReviews(dataSource: DataSource, certificates: Certificate[], users: User[]): Promise<void> {
  console.log('📋 Creating manual reviews...');
  
  const reviewRepository = dataSource.getRepository(ManualReview);
  const verifier = users.find(u => u.role === UserRole.VERIFIER)!;
  const admin = users.find(u => u.role === UserRole.ADMIN)!;
  
  const reviewCertificates = certificates.filter(
    c => c.status === CertificateStatus.MANUAL_REVIEW
  );
  
  for (const certificate of reviewCertificates) {
    const isCompleted = Math.random() > 0.5;
    const assignedAt = new Date(certificate.createdAt.getTime() + 300000); // 5 minutes after creation
    const startedAt = isCompleted ? new Date(assignedAt.getTime() + 60000) : undefined; // 1 minute after assignment
    const completedAt = isCompleted && startedAt ? new Date(startedAt.getTime() + 600000) : undefined; // 10 minutes after start
    
    const review = reviewRepository.create({
      certificateId: certificate.id,
      verifierId: verifier.id,
      status: isCompleted ? ReviewStatus.COMPLETED : ReviewStatus.IN_PROGRESS,
      priority: ReviewPriority.MEDIUM,
      assignedAt,
      assignedBy: admin.id,
      decision: isCompleted ? (Math.random() > 0.3 ? ReviewDecision.APPROVED : ReviewDecision.NEEDS_INFO) : undefined,
      comments: isCompleted ? 'Certificate reviewed and verified against issuer records.' : undefined,
      internalNotes: 'Requires additional verification due to inconclusive automated checks.',
      slaDeadline: new Date(assignedAt.getTime() + 24 * 60 * 60 * 1000), // 24 hours
      slaBreached: false,
      startedAt,
      completedAt,
    });
    
    await reviewRepository.save(review);
  }
  
  console.log(`  ✓ Created ${reviewCertificates.length} manual reviews`);
}

async function createAuditLogs(dataSource: DataSource, users: User[], certificates: Certificate[]): Promise<void> {
  console.log('📝 Creating audit logs...');
  
  const auditRepository = dataSource.getRepository(AuditLog);
  const admin = users.find(u => u.role === UserRole.ADMIN)!;
  const apiUser = users.find(u => u.role === UserRole.API_USER)!;
  
  let previousHash: string | undefined;
  
  // User creation logs
  for (const user of users) {
    const auditData = {
      entityType: EntityType.USER,
      entityId: user.id,
      action: 'USER_CREATED',
      userId: admin.id,
      userEmail: admin.email,
      changes: {
        email: user.email,
        role: user.role,
      },
      metadata: {
        source: 'seed_script',
      },
      ipAddress: '127.0.0.1',
      userAgent: 'Seed Script',
    };
    
    const hash = generateAuditHash(auditData, previousHash);
    
    const log = auditRepository.create({
      ...auditData,
      hash,
      previousHash,
    });
    
    await auditRepository.save(log);
    previousHash = hash;
  }
  
  // Certificate upload logs
  for (const certificate of certificates) {
    const auditData = {
      entityType: EntityType.CERTIFICATE,
      entityId: certificate.id,
      action: 'CERTIFICATE_UPLOADED',
      userId: apiUser.id,
      userEmail: apiUser.email,
      changes: {
        certificateType: certificate.certificateType,
        issuerName: certificate.issuerName,
        status: certificate.status,
      },
      metadata: {
        hasQrCode: certificate.hasQrCode,
        hasDigitalSignature: certificate.hasDigitalSignature,
      },
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    };
    
    const hash = generateAuditHash(auditData, previousHash);
    
    const log = auditRepository.create({
      ...auditData,
      hash,
      previousHash,
    });
    
    await auditRepository.save(log);
    previousHash = hash;
  }
  
  // Verification logs
  const verifiedCertificates = certificates.filter(c => c.status === CertificateStatus.VERIFIED);
  for (const certificate of verifiedCertificates) {
    const auditData = {
      entityType: EntityType.VERIFICATION,
      entityId: certificate.id,
      action: 'VERIFICATION_COMPLETED',
      userId: apiUser.id,
      userEmail: apiUser.email,
      changes: {
        status: 'COMPLETED',
        result: 'VERIFIED',
      },
      metadata: {
        verificationType: 'COMBINED',
        confidenceScore: 95,
      },
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    };
    
    const hash = generateAuditHash(auditData, previousHash);
    
    const log = auditRepository.create({
      ...auditData,
      hash,
      previousHash,
    });
    
    await auditRepository.save(log);
    previousHash = hash;
  }
  
  console.log('  ✓ Created audit logs');
}

// Create a custom DataSource for seeding with synchronize enabled
dotenv.config();

const SeedDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'cert_verification',
  synchronize: true, // Enable synchronize for seeding
  logging: false,
  entities: [User, Certificate, Verification, VerificationStep, ManualReview, AuditLog, Consent, Notification],
  ssl: process.env.DB_SSL === 'true' || process.env.DB_HOST?.includes('rds.amazonaws.com') || process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : false,
});

async function seed() {
  console.log('🌱 Starting database seed...\n');
  
  try {
    // Initialize database connection with synchronize enabled to create tables
    await SeedDataSource.initialize();
    console.log('✅ Database connected\n');
    console.log('✅ Database schema synchronized\n');
    
    // Clear existing data
    await clearDatabase(SeedDataSource);
    console.log('');
    
    // Create demo data
    const users = await createUsers(SeedDataSource);
    console.log('');
    
    const certificates = await createCertificates(SeedDataSource, users);
    console.log('');
    
    const verifications = await createVerifications(SeedDataSource, certificates);
    console.log('');
    
    await createManualReviews(SeedDataSource, certificates, users);
    console.log('');
    
    await createAuditLogs(SeedDataSource, users, certificates);
    console.log('');
    
    // Print summary
    console.log('📊 Seed Summary:');
    console.log(`  • Users: ${users.length}`);
    console.log(`  • Certificates: ${certificates.length}`);
    console.log(`  • Verifications: ${verifications.length}`);
    console.log('');
    
    console.log('✅ Database seeded successfully!\n');
    console.log('Demo User Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    for (const user of DEMO_USERS) {
      console.log(`  ${user.role.padEnd(12)} | ${user.email.padEnd(30)} | ${user.password}`);
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
  } catch (error) {
    console.error('❌ Seed failed:', error);
    throw error;
  } finally {
    await SeedDataSource.destroy();
    console.log('Database connection closed');
  }
}

// Run seed if called directly
if (require.main === module) {
  seed()
    .then(() => {
      console.log('Seed completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Seed failed:', error);
      process.exit(1);
    });
}

export default seed;