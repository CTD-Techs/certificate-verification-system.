# Data Models & Database Schemas

## Overview

This document defines all data models, database schemas, and relationships for the Certificate Verification Mock Demo system. The system uses PostgreSQL with a normalized relational schema and JSONB columns for flexible certificate data.

## Entity Relationship Diagram

```
┌─────────────────┐         ┌──────────────────┐
│     Users       │         │   Certificates   │
├─────────────────┤         ├──────────────────┤
│ id (PK)         │         │ id (PK)          │
│ email           │         │ user_id (FK)     │
│ password_hash   │◄────────┤ certificate_data │
│ role            │    1:N  │ file_path        │
│ created_at      │         │ status           │
│ updated_at      │         │ created_at       │
└─────────────────┘         └────────┬─────────┘
                                     │
                                     │ 1:N
                                     ▼
                            ┌──────────────────┐
                            │ Verifications    │
                            ├──────────────────┤
                            │ id (PK)          │
                            │ certificate_id   │
                            │ verification_type│
                            │ status           │
                            │ result_data      │
                            │ confidence_score │
                            │ started_at       │
                            │ completed_at     │
                            └────────┬─────────┘
                                     │
                                     │ 1:N
                                     ▼
                            ┌──────────────────┐
                            │ VerificationSteps│
                            ├──────────────────┤
                            │ id (PK)          │
                            │ verification_id  │
                            │ step_type        │
                            │ status           │
                            │ result           │
                            │ evidence         │
                            │ executed_at      │
                            └──────────────────┘

┌─────────────────┐         ┌──────────────────┐
│ ManualReviews   │         │   AuditLogs      │
├─────────────────┤         ├──────────────────┤
│ id (PK)         │         │ id (PK)          │
│ certificate_id  │         │ entity_type      │
│ verifier_id (FK)│         │ entity_id        │
│ status          │         │ action           │
│ comments        │         │ user_id (FK)     │
│ decision        │         │ changes          │
│ assigned_at     │         │ ip_address       │
│ completed_at    │         │ hash             │
└─────────────────┘         │ previous_hash    │
                            │ created_at       │
                            └──────────────────┘

┌─────────────────┐         ┌──────────────────┐
│   Consents      │         │  Notifications   │
├─────────────────┤         ├──────────────────┤
│ id (PK)         │         │ id (PK)          │
│ certificate_id  │         │ user_id (FK)     │
│ purpose         │         │ type             │
│ granted         │         │ channel          │
│ granted_at      │         │ recipient        │
│ expires_at      │         │ subject          │
│ revoked_at      │         │ body             │
└─────────────────┘         │ status           │
                            │ sent_at          │
                            └──────────────────┘
```

## Core Entities

### 1. Users

**Purpose**: Store user accounts with role-based access control

**Schema**:
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role VARCHAR(50) NOT NULL CHECK (role IN ('ADMIN', 'VERIFIER', 'API_USER', 'AUDITOR')),
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
```

**TypeScript Interface**:
```typescript
interface User {
    id: string;
    email: string;
    passwordHash: string;
    firstName?: string;
    lastName?: string;
    role: 'ADMIN' | 'VERIFIER' | 'API_USER' | 'AUDITOR';
    isActive: boolean;
    lastLoginAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
```

### 2. Certificates

**Purpose**: Store certificate metadata and extracted JSON data

**Schema**:
```sql
CREATE TABLE certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Certificate identification
    certificate_number VARCHAR(100),
    certificate_type VARCHAR(50) NOT NULL CHECK (certificate_type IN (
        'SCHOOL_CERTIFICATE', 'DEGREE', 'DIPLOMA', 'MARKSHEET', 'OTHER'
    )),
    issuer_name VARCHAR(255) NOT NULL,
    issuer_type VARCHAR(50) CHECK (issuer_type IN (
        'CBSE', 'STATE_BOARD', 'UNIVERSITY', 'PROFESSIONAL_BODY', 'OTHER'
    )),
    
    -- Student information (hashed for PII protection)
    student_name_hash VARCHAR(64),
    student_dob_hash VARCHAR(64),
    student_id_hash VARCHAR(64),
    
    -- Certificate data
    certificate_data JSONB NOT NULL, -- Full extracted JSON
    file_path VARCHAR(500), -- Path to original file
    file_hash VARCHAR(64), -- SHA-256 hash of original file
    
    -- Status tracking
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING' CHECK (status IN (
        'PENDING', 'IN_PROGRESS', 'VERIFIED', 'UNVERIFIED', 'MANUAL_REVIEW', 'FAILED'
    )),
    
    -- Metadata
    has_qr_code BOOLEAN DEFAULT false,
    has_digital_signature BOOLEAN DEFAULT false,
    issue_date DATE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    verified_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_certificates_user_id ON certificates(user_id);
CREATE INDEX idx_certificates_status ON certificates(status);
CREATE INDEX idx_certificates_certificate_number ON certificates(certificate_number);
CREATE INDEX idx_certificates_issuer_type ON certificates(issuer_type);
CREATE INDEX idx_certificates_created_at ON certificates(created_at DESC);
CREATE INDEX idx_certificates_certificate_data ON certificates USING GIN (certificate_data);
```

**TypeScript Interface**:
```typescript
interface Certificate {
    id: string;
    userId: string;
    certificateNumber?: string;
    certificateType: 'SCHOOL_CERTIFICATE' | 'DEGREE' | 'DIPLOMA' | 'MARKSHEET' | 'OTHER';
    issuerName: string;
    issuerType?: 'CBSE' | 'STATE_BOARD' | 'UNIVERSITY' | 'PROFESSIONAL_BODY' | 'OTHER';
    studentNameHash?: string;
    studentDobHash?: string;
    studentIdHash?: string;
    certificateData: CertificateData; // JSON structure
    filePath?: string;
    fileHash?: string;
    status: 'PENDING' | 'IN_PROGRESS' | 'VERIFIED' | 'UNVERIFIED' | 'MANUAL_REVIEW' | 'FAILED';
    hasQrCode: boolean;
    hasDigitalSignature: boolean;
    issueDate?: Date;
    createdAt: Date;
    updatedAt: Date;
    verifiedAt?: Date;
}

interface CertificateData {
    // Flexible structure based on certificate type
    studentName?: string;
    rollNumber?: string;
    registrationNumber?: string;
    examYear?: string;
    board?: string;
    subjects?: Array<{
        name: string;
        marks: number;
        maxMarks: number;
        grade?: string;
    }>;
    qrCode?: string;
    digitalSignature?: string;
    [key: string]: any; // Allow additional fields
}
```

### 3. Verifications

**Purpose**: Track overall verification process for each certificate

**Schema**:
```sql
CREATE TABLE verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    certificate_id UUID NOT NULL REFERENCES certificates(id) ON DELETE CASCADE,
    
    -- Verification details
    verification_type VARCHAR(50) NOT NULL CHECK (verification_type IN (
        'DIGITAL', 'PORTAL', 'MANUAL', 'FORENSIC', 'COMBINED'
    )),
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING' CHECK (status IN (
        'PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED'
    )),
    
    -- Results
    result VARCHAR(50) CHECK (result IN ('VERIFIED', 'UNVERIFIED', 'INCONCLUSIVE')),
    confidence_score DECIMAL(5,2) CHECK (confidence_score >= 0 AND confidence_score <= 100),
    result_data JSONB, -- Detailed results
    
    -- Evidence
    evidence_files TEXT[], -- Array of file paths
    external_reference VARCHAR(255), -- Reference ID from external system
    
    -- Timing
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    duration_ms INTEGER,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_verifications_certificate_id ON verifications(certificate_id);
CREATE INDEX idx_verifications_status ON verifications(status);
CREATE INDEX idx_verifications_verification_type ON verifications(verification_type);
CREATE INDEX idx_verifications_result ON verifications(result);
```

**TypeScript Interface**:
```typescript
interface Verification {
    id: string;
    certificateId: string;
    verificationType: 'DIGITAL' | 'PORTAL' | 'MANUAL' | 'FORENSIC' | 'COMBINED';
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
    result?: 'VERIFIED' | 'UNVERIFIED' | 'INCONCLUSIVE';
    confidenceScore?: number;
    resultData?: VerificationResultData;
    evidenceFiles?: string[];
    externalReference?: string;
    startedAt: Date;
    completedAt?: Date;
    durationMs?: number;
    createdAt: Date;
}

interface VerificationResultData {
    digitalVerification?: {
        qrCodeValid: boolean;
        signatureValid: boolean;
        issuerVerified: boolean;
        externalApiResponse?: any;
    };
    portalVerification?: {
        portalName: string;
        recordFound: boolean;
        dataMatches: boolean;
        discrepancies?: string[];
    };
    forensicAnalysis?: {
        riskScore: number;
        findings: Array<{
            category: string;
            severity: 'LOW' | 'MEDIUM' | 'HIGH';
            description: string;
        }>;
    };
    manualReview?: {
        reviewerId: string;
        decision: string;
        comments: string;
    };
}
```

### 4. Verification Steps

**Purpose**: Track individual steps within a verification process

**Schema**:
```sql
CREATE TABLE verification_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    verification_id UUID NOT NULL REFERENCES verifications(id) ON DELETE CASCADE,
    
    -- Step details
    step_type VARCHAR(50) NOT NULL CHECK (step_type IN (
        'QR_VALIDATION', 'SIGNATURE_CHECK', 'PORTAL_LOOKUP', 
        'FONT_ANALYSIS', 'METADATA_CHECK', 'TEMPLATE_MATCH',
        'MANUAL_REVIEW', 'API_CALL'
    )),
    step_name VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN (
        'PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'SKIPPED'
    )),
    
    -- Results
    result JSONB,
    error_message TEXT,
    
    -- Evidence
    evidence JSONB,
    
    -- Timing
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    duration_ms INTEGER,
    
    -- Ordering
    sequence_number INTEGER NOT NULL
);

CREATE INDEX idx_verification_steps_verification_id ON verification_steps(verification_id);
CREATE INDEX idx_verification_steps_step_type ON verification_steps(step_type);
CREATE INDEX idx_verification_steps_status ON verification_steps(status);
```

**TypeScript Interface**:
```typescript
interface VerificationStep {
    id: string;
    verificationId: string;
    stepType: 'QR_VALIDATION' | 'SIGNATURE_CHECK' | 'PORTAL_LOOKUP' | 
              'FONT_ANALYSIS' | 'METADATA_CHECK' | 'TEMPLATE_MATCH' |
              'MANUAL_REVIEW' | 'API_CALL';
    stepName: string;
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'SKIPPED';
    result?: any;
    errorMessage?: string;
    evidence?: any;
    executedAt: Date;
    durationMs?: number;
    sequenceNumber: number;
}
```

### 5. Manual Reviews

**Purpose**: Track manual verification queue and verifier actions

**Schema**:
```sql
CREATE TABLE manual_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    certificate_id UUID NOT NULL REFERENCES certificates(id) ON DELETE CASCADE,
    verifier_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Review details
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING' CHECK (status IN (
        'PENDING', 'IN_PROGRESS', 'COMPLETED', 'ESCALATED'
    )),
    priority VARCHAR(20) DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')),
    
    -- Assignment
    assigned_at TIMESTAMP WITH TIME ZONE,
    assigned_by UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Review outcome
    decision VARCHAR(50) CHECK (decision IN ('APPROVED', 'REJECTED', 'NEEDS_INFO', 'ESCALATED')),
    comments TEXT,
    internal_notes TEXT,
    
    -- Escalation
    escalated_to UUID REFERENCES users(id) ON DELETE SET NULL,
    escalation_reason TEXT,
    
    -- SLA tracking
    sla_deadline TIMESTAMP WITH TIME ZONE,
    sla_breached BOOLEAN DEFAULT false,
    
    -- Timing
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_manual_reviews_certificate_id ON manual_reviews(certificate_id);
CREATE INDEX idx_manual_reviews_verifier_id ON manual_reviews(verifier_id);
CREATE INDEX idx_manual_reviews_status ON manual_reviews(status);
CREATE INDEX idx_manual_reviews_priority ON manual_reviews(priority);
CREATE INDEX idx_manual_reviews_sla_deadline ON manual_reviews(sla_deadline);
```

**TypeScript Interface**:
```typescript
interface ManualReview {
    id: string;
    certificateId: string;
    verifierId?: string;
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'ESCALATED';
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    assignedAt?: Date;
    assignedBy?: string;
    decision?: 'APPROVED' | 'REJECTED' | 'NEEDS_INFO' | 'ESCALATED';
    comments?: string;
    internalNotes?: string;
    escalatedTo?: string;
    escalationReason?: string;
    slaDeadline?: Date;
    slaBreached: boolean;
    createdAt: Date;
    startedAt?: Date;
    completedAt?: Date;
}
```

### 6. Audit Logs

**Purpose**: Tamper-evident audit trail with hash chain

**Schema**:
```sql
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Entity tracking
    entity_type VARCHAR(50) NOT NULL CHECK (entity_type IN (
        'CERTIFICATE', 'VERIFICATION', 'USER', 'MANUAL_REVIEW', 'CONSENT'
    )),
    entity_id UUID NOT NULL,
    
    -- Action details
    action VARCHAR(100) NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    user_email VARCHAR(255),
    
    -- Changes
    changes JSONB, -- Before/after values
    metadata JSONB, -- Additional context
    
    -- Request context
    ip_address INET,
    user_agent TEXT,
    request_id VARCHAR(100),
    
    -- Tamper-evident chain
    hash VARCHAR(64) NOT NULL, -- SHA-256 of this record
    previous_hash VARCHAR(64), -- Hash of previous record
    
    -- Timestamp
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_hash ON audit_logs(hash);
```

**TypeScript Interface**:
```typescript
interface AuditLog {
    id: string;
    entityType: 'CERTIFICATE' | 'VERIFICATION' | 'USER' | 'MANUAL_REVIEW' | 'CONSENT';
    entityId: string;
    action: string;
    userId?: string;
    userEmail?: string;
    changes?: {
        before?: any;
        after?: any;
    };
    metadata?: any;
    ipAddress?: string;
    userAgent?: string;
    requestId?: string;
    hash: string;
    previousHash?: string;
    createdAt: Date;
}
```

### 7. Consents

**Purpose**: Track user consent for data processing and retention

**Schema**:
```sql
CREATE TABLE consents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    certificate_id UUID NOT NULL REFERENCES certificates(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Consent details
    purpose VARCHAR(100) NOT NULL CHECK (purpose IN (
        'VERIFICATION', 'STORAGE', 'THIRD_PARTY_SHARING', 'ANALYTICS'
    )),
    granted BOOLEAN NOT NULL DEFAULT false,
    
    -- Consent text
    consent_text TEXT NOT NULL,
    consent_version VARCHAR(20) NOT NULL,
    
    -- Timing
    granted_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    revoked_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_consents_certificate_id ON consents(certificate_id);
CREATE INDEX idx_consents_user_id ON consents(user_id);
CREATE INDEX idx_consents_purpose ON consents(purpose);
CREATE INDEX idx_consents_expires_at ON consents(expires_at);
```

**TypeScript Interface**:
```typescript
interface Consent {
    id: string;
    certificateId: string;
    userId: string;
    purpose: 'VERIFICATION' | 'STORAGE' | 'THIRD_PARTY_SHARING' | 'ANALYTICS';
    granted: boolean;
    consentText: string;
    consentVersion: string;
    grantedAt?: Date;
    expiresAt?: Date;
    revokedAt?: Date;
    ipAddress?: string;
    userAgent?: string;
    createdAt: Date;
}
```

### 8. Notifications

**Purpose**: Track notification delivery for status updates

**Schema**:
```sql
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Notification details
    type VARCHAR(50) NOT NULL CHECK (type IN (
        'VERIFICATION_COMPLETE', 'MANUAL_REVIEW_ASSIGNED', 
        'VERIFICATION_FAILED', 'SLA_WARNING', 'SYSTEM_ALERT'
    )),
    channel VARCHAR(20) NOT NULL CHECK (channel IN ('EMAIL', 'WEBHOOK', 'IN_APP')),
    
    -- Content
    recipient VARCHAR(255) NOT NULL, -- Email or webhook URL
    subject VARCHAR(255),
    body TEXT NOT NULL,
    
    -- Delivery
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING' CHECK (status IN (
        'PENDING', 'SENT', 'FAILED', 'BOUNCED'
    )),
    sent_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    
    -- Related entity
    related_entity_type VARCHAR(50),
    related_entity_id UUID,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_status ON notifications(status);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
```

**TypeScript Interface**:
```typescript
interface Notification {
    id: string;
    userId: string;
    type: 'VERIFICATION_COMPLETE' | 'MANUAL_REVIEW_ASSIGNED' | 
          'VERIFICATION_FAILED' | 'SLA_WARNING' | 'SYSTEM_ALERT';
    channel: 'EMAIL' | 'WEBHOOK' | 'IN_APP';
    recipient: string;
    subject?: string;
    body: string;
    status: 'PENDING' | 'SENT' | 'FAILED' | 'BOUNCED';
    sentAt?: Date;
    errorMessage?: string;
    retryCount: number;
    relatedEntityType?: string;
    relatedEntityId?: string;
    createdAt: Date;
}
```

## Additional Tables

### 9. API Keys (for third-party integrations)

```sql
CREATE TABLE api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    key_hash VARCHAR(64) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    scopes TEXT[] NOT NULL, -- Array of permissions
    is_active BOOLEAN DEFAULT true,
    last_used_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX idx_api_keys_user_id ON api_keys(user_id);
```

### 10. Rate Limits

```sql
CREATE TABLE rate_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    identifier VARCHAR(255) NOT NULL, -- User ID, IP, or API key
    identifier_type VARCHAR(20) NOT NULL CHECK (identifier_type IN ('USER', 'IP', 'API_KEY')),
    endpoint VARCHAR(255),
    request_count INTEGER DEFAULT 0,
    window_start TIMESTAMP WITH TIME ZONE NOT NULL,
    window_end TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_rate_limits_identifier ON rate_limits(identifier, identifier_type);
CREATE INDEX idx_rate_limits_window ON rate_limits(window_end);
```

## Database Initialization Script

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create all tables in order (respecting foreign key dependencies)
-- 1. Users (no dependencies)
-- 2. Certificates (depends on Users)
-- 3. Verifications (depends on Certificates)
-- 4. Verification Steps (depends on Verifications)
-- 5. Manual Reviews (depends on Certificates, Users)
-- 6. Audit Logs (depends on Users)
-- 7. Consents (depends on Certificates, Users)
-- 8. Notifications (depends on Users)
-- 9. API Keys (depends on Users)
-- 10. Rate Limits (no dependencies)

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_certificates_updated_at BEFORE UPDATE ON certificates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## Data Relationships Summary

1. **Users → Certificates**: One-to-Many (user can submit multiple certificates)
2. **Certificates → Verifications**: One-to-Many (certificate can have multiple verification attempts)
3. **Verifications → Verification Steps**: One-to-Many (verification has multiple steps)
4. **Certificates → Manual Reviews**: One-to-Many (certificate can be reviewed multiple times)
5. **Users → Manual Reviews**: One-to-Many (verifier can review multiple certificates)
6. **Certificates → Consents**: One-to-Many (certificate can have multiple consent records)
7. **Users → Notifications**: One-to-Many (user receives multiple notifications)
8. **All Entities → Audit Logs**: Many-to-Many (all entities generate audit logs)

## Data Retention & Archival

### Active Data (Hot Storage)
- Certificates: Last 1 year
- Verifications: Last 1 year
- Manual Reviews: Last 6 months

### Archived Data (Cold Storage)
- Certificates: 1-7 years
- Audit Logs: 10 years (compliance requirement)
- Consents: Until expiry + 1 year

### Deletion Policy
- PII: Delete after consent expiry or user request
- Audit Logs: Never delete (immutable)
- Certificates: Delete after 7 years or user request (with audit trail)

---

**Document Version**: 1.0  
**Last Updated**: 2025-10-10  
**Status**: Draft for Review