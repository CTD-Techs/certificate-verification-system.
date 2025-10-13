# Security & Compliance Documentation

## Overview

This document outlines the security architecture, compliance requirements, and best practices for the Certificate Verification Mock Demo system. While this is a demonstration system, it implements production-grade security measures to protect sensitive certificate data and ensure regulatory compliance.

## Security Architecture

### Defense in Depth Strategy

```
┌─────────────────────────────────────────────────────────────┐
│ Layer 1: Network Security                                   │
│ - HTTPS/TLS 1.3                                             │
│ - Firewall rules                                            │
│ - DDoS protection                                           │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│ Layer 2: Application Security                               │
│ - CORS policies                                             │
│ - Security headers (Helmet.js)                              │
│ - Rate limiting                                             │
│ - Input validation                                          │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│ Layer 3: Authentication & Authorization                     │
│ - JWT tokens                                                │
│ - Role-based access control (RBAC)                          │
│ - Session management                                        │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│ Layer 4: Data Security                                      │
│ - Encryption at rest (AES-256)                              │
│ - Encryption in transit (TLS)                               │
│ - PII minimization                                          │
│ - Secure key management                                     │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│ Layer 5: Audit & Monitoring                                 │
│ - Tamper-evident audit logs                                 │
│ - Activity monitoring                                       │
│ - Anomaly detection                                         │
└─────────────────────────────────────────────────────────────┘
```

## 1. Authentication & Authorization

### 1.1 JWT-based Authentication

**Token Structure**:
```typescript
interface JWTPayload {
  sub: string;           // User ID
  email: string;
  role: UserRole;
  permissions: string[];
  iat: number;          // Issued at
  exp: number;          // Expiration
  jti: string;          // JWT ID (for revocation)
}
```

**Token Configuration**:
```typescript
const jwtConfig = {
  secret: process.env.JWT_SECRET,
  algorithm: 'HS256',
  expiresIn: '24h',
  issuer: 'cert-verification-system',
  audience: 'cert-verification-api',
};
```

**Security Measures**:
- Strong secret key (minimum 256 bits)
- Short token lifetime (24 hours)
- Token refresh mechanism
- Token revocation via blacklist (Redis)
- Secure token storage (httpOnly cookies or localStorage with XSS protection)

**Implementation**:
```typescript
class JWTService {
  generateToken(user: User): string {
    const payload: JWTPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      permissions: this.getPermissions(user.role),
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 86400, // 24 hours
      jti: uuidv4(),
    };
    
    return jwt.sign(payload, jwtConfig.secret, {
      algorithm: jwtConfig.algorithm,
      issuer: jwtConfig.issuer,
      audience: jwtConfig.audience,
    });
  }
  
  async verifyToken(token: string): Promise<JWTPayload> {
    // Check if token is blacklisted
    const isBlacklisted = await this.isTokenBlacklisted(token);
    if (isBlacklisted) {
      throw new Error('Token has been revoked');
    }
    
    return jwt.verify(token, jwtConfig.secret, {
      algorithms: [jwtConfig.algorithm],
      issuer: jwtConfig.issuer,
      audience: jwtConfig.audience,
    }) as JWTPayload;
  }
  
  async revokeToken(token: string): Promise<void> {
    const decoded = jwt.decode(token) as JWTPayload;
    const ttl = decoded.exp - Math.floor(Date.now() / 1000);
    await redis.setex(`blacklist:${decoded.jti}`, ttl, '1');
  }
}
```

### 1.2 Role-Based Access Control (RBAC)

**Roles & Permissions**:
```typescript
enum UserRole {
  ADMIN = 'ADMIN',
  VERIFIER = 'VERIFIER',
  API_USER = 'API_USER',
  AUDITOR = 'AUDITOR',
}

const rolePermissions: Record<UserRole, string[]> = {
  ADMIN: [
    'certificate:*',
    'verification:*',
    'user:*',
    'audit:*',
    'system:*',
  ],
  VERIFIER: [
    'certificate:read',
    'verification:read',
    'manual-review:*',
    'audit:read',
  ],
  API_USER: [
    'certificate:create',
    'certificate:read:own',
    'verification:read:own',
  ],
  AUDITOR: [
    'certificate:read',
    'verification:read',
    'audit:read',
  ],
};
```

**Permission Middleware**:
```typescript
const requirePermission = (permission: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user; // Set by auth middleware
    
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const hasPermission = user.permissions.some(p => 
      p === permission || p.endsWith(':*')
    );
    
    if (!hasPermission) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    next();
  };
};

// Usage
router.delete('/certificates/:id', 
  authenticate,
  requirePermission('certificate:delete'),
  certificateController.delete
);
```

### 1.3 Password Security

**Password Requirements**:
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

**Hashing Strategy**:
```typescript
import bcrypt from 'bcrypt';

class PasswordService {
  private readonly SALT_ROUNDS = 12;
  
  async hash(password: string): Promise<string> {
    // Validate password strength
    this.validatePasswordStrength(password);
    
    // Hash with bcrypt
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }
  
  async verify(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
  
  private validatePasswordStrength(password: string): void {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    if (password.length < minLength) {
      throw new Error('Password must be at least 8 characters');
    }
    
    if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
      throw new Error('Password must contain uppercase, lowercase, number, and special character');
    }
  }
}
```

## 2. Data Protection

### 2.1 Encryption at Rest

**Database Encryption**:
```typescript
// Field-level encryption for sensitive data
class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly key: Buffer;
  
  constructor() {
    this.key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
  }
  
  encrypt(plaintext: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
    
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    // Return: iv:authTag:encrypted
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }
  
  decrypt(ciphertext: string): string {
    const [ivHex, authTagHex, encrypted] = ciphertext.split(':');
    
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
    
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}
```

**File Encryption**:
```typescript
// Encrypt certificate files before storage
class FileEncryptionService {
  async encryptFile(filePath: string): Promise<string> {
    const fileBuffer = await fs.readFile(filePath);
    const encrypted = encryptionService.encrypt(fileBuffer.toString('base64'));
    
    const encryptedPath = `${filePath}.enc`;
    await fs.writeFile(encryptedPath, encrypted);
    
    // Delete original file
    await fs.unlink(filePath);
    
    return encryptedPath;
  }
  
  async decryptFile(encryptedPath: string): Promise<Buffer> {
    const encrypted = await fs.readFile(encryptedPath, 'utf8');
    const decrypted = encryptionService.decrypt(encrypted);
    return Buffer.from(decrypted, 'base64');
  }
}
```

### 2.2 Encryption in Transit

**TLS Configuration**:
```typescript
import https from 'https';
import fs from 'fs';

const tlsOptions = {
  key: fs.readFileSync('path/to/private-key.pem'),
  cert: fs.readFileSync('path/to/certificate.pem'),
  ca: fs.readFileSync('path/to/ca-certificate.pem'),
  
  // TLS 1.3 only
  minVersion: 'TLSv1.3',
  maxVersion: 'TLSv1.3',
  
  // Strong cipher suites
  ciphers: [
    'TLS_AES_256_GCM_SHA384',
    'TLS_CHACHA20_POLY1305_SHA256',
    'TLS_AES_128_GCM_SHA256',
  ].join(':'),
  
  // Prefer server cipher order
  honorCipherOrder: true,
};

const server = https.createServer(tlsOptions, app);
```

### 2.3 PII Protection

**Data Minimization**:
```typescript
// Hash sensitive fields before storage
class PIIProtectionService {
  hashSensitiveField(value: string): string {
    return crypto
      .createHash('sha256')
      .update(value + process.env.HASH_SALT)
      .digest('hex');
  }
  
  redactPII(data: any): any {
    const piiFields = ['aadhaar', 'pan', 'dob', 'phone', 'address'];
    
    const redacted = { ...data };
    
    for (const field of piiFields) {
      if (redacted[field]) {
        redacted[field] = this.maskValue(redacted[field]);
      }
    }
    
    return redacted;
  }
  
  private maskValue(value: string): string {
    if (value.length <= 4) return '****';
    return value.slice(0, 2) + '*'.repeat(value.length - 4) + value.slice(-2);
  }
}
```

**Consent Management**:
```typescript
class ConsentService {
  async checkConsent(userId: string, purpose: ConsentPurpose): Promise<boolean> {
    const consent = await Consent.findOne({
      where: {
        userId,
        purpose,
        granted: true,
        expiresAt: MoreThan(new Date()),
        revokedAt: IsNull(),
      },
    });
    
    return !!consent;
  }
  
  async grantConsent(
    userId: string,
    certificateId: string,
    purpose: ConsentPurpose,
    expiresAt: Date
  ): Promise<Consent> {
    return Consent.create({
      userId,
      certificateId,
      purpose,
      granted: true,
      grantedAt: new Date(),
      expiresAt,
      consentText: this.getConsentText(purpose),
      consentVersion: '1.0',
    });
  }
  
  async revokeConsent(consentId: string): Promise<void> {
    await Consent.update(consentId, {
      revokedAt: new Date(),
    });
    
    // Trigger data deletion if required
    await this.handleConsentRevocation(consentId);
  }
}
```

## 3. Input Validation & Sanitization

### 3.1 Request Validation

**Zod Schemas**:
```typescript
import { z } from 'zod';

const certificateSubmissionSchema = z.object({
  certificateData: z.object({
    studentName: z.string().min(1).max(100),
    rollNumber: z.string().regex(/^[A-Z0-9]+$/),
    examYear: z.string().regex(/^\d{4}$/),
    board: z.string().min(1),
  }),
  certificateType: z.enum(['SCHOOL_CERTIFICATE', 'DEGREE', 'DIPLOMA', 'MARKSHEET']),
  issuerName: z.string().min(1).max(255),
});

// Validation middleware
const validate = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.errors,
        });
      }
      next(error);
    }
  };
};
```

### 3.2 SQL Injection Prevention

**Parameterized Queries** (TypeORM handles this automatically):
```typescript
// Safe - TypeORM uses parameterized queries
const certificate = await Certificate.findOne({
  where: { certificateNumber: userInput },
});

// Unsafe - Never do this
const result = await connection.query(
  `SELECT * FROM certificates WHERE number = '${userInput}'`
);
```

### 3.3 XSS Prevention

**Content Security Policy**:
```typescript
import helmet from 'helmet';

app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    scriptSrc: ["'self'"],
    imgSrc: ["'self'", 'data:', 'https:'],
    connectSrc: ["'self'"],
    fontSrc: ["'self'"],
    objectSrc: ["'none'"],
    mediaSrc: ["'self'"],
    frameSrc: ["'none'"],
  },
}));
```

**Output Encoding**:
```typescript
// Frontend - React automatically escapes
<div>{userInput}</div> // Safe

// Backend - Sanitize HTML if needed
import DOMPurify from 'isomorphic-dompurify';

const sanitized = DOMPurify.sanitize(userInput);
```

## 4. Rate Limiting & DDoS Protection

### 4.1 Rate Limiting Configuration

```typescript
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';

const limiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'rl:',
  }),
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Rate limit exceeded',
      retryAfter: req.rateLimit.resetTime,
    });
  },
});

// Apply globally
app.use('/api/', limiter);

// Stricter limits for sensitive endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  skipSuccessfulRequests: true,
});

app.use('/api/v1/auth/login', authLimiter);
```

### 4.2 Request Size Limits

```typescript
import express from 'express';

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// File upload limits
import multer from 'multer';

const upload = multer({
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 5,
  },
});
```

## 5. Audit Logging

### 5.1 Tamper-Evident Audit Trail

**Hash Chain Implementation**:
```typescript
class AuditLogService {
  async createLog(entry: AuditLogEntry): Promise<AuditLog> {
    // Get previous log entry
    const previousLog = await this.getLatestLog();
    
    // Create new log entry
    const log = {
      ...entry,
      previousHash: previousLog?.hash || null,
      createdAt: new Date(),
    };
    
    // Calculate hash
    log.hash = this.calculateHash(log);
    
    // Save to database
    return AuditLog.create(log);
  }
  
  private calculateHash(log: Partial<AuditLog>): string {
    const data = JSON.stringify({
      entityType: log.entityType,
      entityId: log.entityId,
      action: log.action,
      userId: log.userId,
      changes: log.changes,
      previousHash: log.previousHash,
      createdAt: log.createdAt,
    });
    
    return crypto
      .createHash('sha256')
      .update(data)
      .digest('hex');
  }
  
  async verifyChain(startId: string, endId: string): Promise<boolean> {
    const logs = await AuditLog.find({
      where: {
        id: Between(startId, endId),
      },
      order: { createdAt: 'ASC' },
    });
    
    for (let i = 1; i < logs.length; i++) {
      const current = logs[i];
      const previous = logs[i - 1];
      
      // Verify previous hash
      if (current.previousHash !== previous.hash) {
        return false;
      }
      
      // Verify current hash
      const expectedHash = this.calculateHash(current);
      if (current.hash !== expectedHash) {
        return false;
      }
    }
    
    return true;
  }
}
```

### 5.2 Audit Log Events

**Events to Log**:
```typescript
enum AuditAction {
  // Authentication
  USER_LOGIN = 'USER_LOGIN',
  USER_LOGOUT = 'USER_LOGOUT',
  USER_LOGIN_FAILED = 'USER_LOGIN_FAILED',
  
  // Certificate operations
  CERTIFICATE_SUBMITTED = 'CERTIFICATE_SUBMITTED',
  CERTIFICATE_VIEWED = 'CERTIFICATE_VIEWED',
  CERTIFICATE_DELETED = 'CERTIFICATE_DELETED',
  
  // Verification operations
  VERIFICATION_STARTED = 'VERIFICATION_STARTED',
  VERIFICATION_COMPLETED = 'VERIFICATION_COMPLETED',
  VERIFICATION_FAILED = 'VERIFICATION_FAILED',
  
  // Manual review
  REVIEW_ASSIGNED = 'REVIEW_ASSIGNED',
  REVIEW_COMPLETED = 'REVIEW_COMPLETED',
  REVIEW_ESCALATED = 'REVIEW_ESCALATED',
  
  // Data access
  PII_ACCESSED = 'PII_ACCESSED',
  AUDIT_LOG_VIEWED = 'AUDIT_LOG_VIEWED',
  
  // System
  CONFIG_CHANGED = 'CONFIG_CHANGED',
  USER_ROLE_CHANGED = 'USER_ROLE_CHANGED',
}
```

## 6. Security Headers

### 6.1 Helmet.js Configuration

```typescript
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  frameguard: {
    action: 'deny',
  },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin',
  },
}));
```

## 7. Compliance Requirements

### 7.1 GDPR Compliance

**Data Subject Rights**:
1. **Right to Access**: Users can request their data
2. **Right to Rectification**: Users can correct their data
3. **Right to Erasure**: Users can request deletion
4. **Right to Data Portability**: Export data in machine-readable format
5. **Right to Object**: Users can object to processing

**Implementation**:
```typescript
class GDPRService {
  async exportUserData(userId: string): Promise<any> {
    const user = await User.findOne(userId);
    const certificates = await Certificate.find({ userId });
    const verifications = await Verification.find({ 
      certificate: { userId } 
    });
    
    return {
      user: this.sanitizeUser(user),
      certificates: certificates.map(c => this.sanitizeCertificate(c)),
      verifications: verifications.map(v => this.sanitizeVerification(v)),
    };
  }
  
  async deleteUserData(userId: string): Promise<void> {
    // Create audit log before deletion
    await auditService.createLog({
      entityType: 'USER',
      entityId: userId,
      action: 'DATA_DELETION_REQUESTED',
      userId,
    });
    
    // Soft delete (mark as deleted but keep for audit)
    await User.update(userId, {
      isActive: false,
      deletedAt: new Date(),
      email: `deleted_${userId}@example.com`,
    });
    
    // Anonymize certificates
    await Certificate.update(
      { userId },
      { 
        studentNameHash: null,
        studentDobHash: null,
        studentIdHash: null,
      }
    );
  }
}
```

### 7.2 Data Retention Policy

```typescript
const retentionPolicy = {
  certificates: {
    active: 7 * 365, // 7 years
    deleted: 30, // 30 days after deletion
  },
  auditLogs: {
    retention: 10 * 365, // 10 years
    immutable: true,
  },
  verifications: {
    retention: 7 * 365, // 7 years
  },
  pii: {
    retention: 'until consent expires',
    deleteAfter: 30, // 30 days after consent expiry
  },
};
```

### 7.3 Indian Data Protection Laws

**Compliance with IT Act 2000 & DPDPA 2023**:
1. Data localization (if required)
2. Consent management
3. Data breach notification (within 72 hours)
4. Appointment of Data Protection Officer
5. Privacy by design

## 8. Security Testing

### 8.1 Security Test Checklist

- [ ] SQL Injection testing
- [ ] XSS testing
- [ ] CSRF testing
- [ ] Authentication bypass testing
- [ ] Authorization testing
- [ ] Session management testing
- [ ] Rate limiting testing
- [ ] Input validation testing
- [ ] File upload security testing
- [ ] API security testing

### 8.2 Automated Security Scanning

**Tools to Use**:
- **OWASP ZAP**: Web application security scanner
- **npm audit**: Check for vulnerable dependencies
- **Snyk**: Continuous security monitoring
- **SonarQube**: Code quality and security

```bash
# Run security audit
npm audit

# Fix vulnerabilities
npm audit fix

# Check for outdated packages
npm outdated
```

## 9. Incident Response Plan

### 9.1 Security Incident Procedures

1. **Detection**: Monitor logs and alerts
2. **Containment**: Isolate affected systems
3. **Investigation**: Analyze the incident
4. **Remediation**: Fix vulnerabilities
5. **Recovery**: Restore normal operations
6. **Post-Incident**: Review and improve

### 9.2 Data Breach Response

```typescript
class IncidentResponseService {
  async handleDataBreach(incident: SecurityIncident): Promise<void> {
    // 1. Log the incident
    await this.logIncident(incident);
    
    // 2. Notify stakeholders
    await this.notifyStakeholders(incident);
    
    // 3. Contain the breach
    await this.containBreach(incident);
    
    // 4. Investigate
    await this.investigate(incident);
    
    // 5. Remediate
    await this.remediate(incident);
    
    // 6. Report to authorities (if required)
    if (this.requiresRegulatorNotification(incident)) {
      await this.notifyRegulators(incident);
    }
  }
}
```

## 10. Security Best Practices

### 10.1 Development Guidelines

1. **Never commit secrets** to version control
2. **Use environment variables** for configuration
3. **Keep dependencies updated**
4. **Follow principle of least privilege**
5. **Validate all inputs**
6. **Sanitize all outputs**
7. **Use HTTPS everywhere**
8. **Implement proper error handling**
9. **Log security events**
10. **Regular security audits**

### 10.2 Deployment Security

```yaml
# docker-compose.yml security settings
services:
  api:
    security_opt:
      - no-new-privileges:true
    read_only: true
    tmpfs:
      - /tmp
    cap_drop:
      - ALL
    cap_add:
      - NET_BIND_SERVICE
```

### 10.3 Environment Variables Security

```bash
# Never commit .env files
# Use secrets management in production

# Development
JWT_SECRET=dev-secret-change-in-production
ENCRYPTION_KEY=dev-key-change-in-production

# Production (use secrets manager)
JWT_SECRET=${AWS_SECRETS_MANAGER_JWT_SECRET}
ENCRYPTION_KEY=${AWS_SECRETS_MANAGER_ENCRYPTION_KEY}
```

---

**Document Version**: 1.0  
**Last Updated**: 2025-10-10  
**Status**: Draft for Review  
**Classification**: Internal Use Only