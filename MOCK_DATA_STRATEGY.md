# Mock Data Strategy

## Overview

This document defines the comprehensive strategy for simulating external services and generating realistic mock data for the Certificate Verification Mock Demo system. Since this is a demonstration system, all external API calls and verification processes will be simulated with realistic responses and behaviors.

## Mock Service Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  Verification Engine                         │
└────────────────────────┬────────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
         ▼               ▼               ▼
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│  Digital    │  │   Portal    │  │  Forensic   │
│  Verifier   │  │  Verifier   │  │  Analyzer   │
└──────┬──────┘  └──────┬──────┘  └──────┬──────┘
       │                │                │
       ▼                ▼                ▼
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│ Mock API    │  │ Mock Portal │  │ Mock        │
│ Simulator   │  │ Simulator   │  │ Forensics   │
└─────────────┘  └─────────────┘  └─────────────┘
```

## 1. Mock External API Services

### 1.1 DigiLocker Mock Service

**Purpose**: Simulate DigiLocker API for digital certificate verification

**Mock Behavior**:
```typescript
interface DigiLockerMockConfig {
  successRate: number;        // 0.95 = 95% success rate
  responseDelay: [number, number]; // [min, max] in ms
  errorScenarios: {
    networkError: number;     // 0.02 = 2% network errors
    invalidSignature: number; // 0.03 = 3% invalid signatures
  };
}

const digiLockerConfig: DigiLockerMockConfig = {
  successRate: 0.95,
  responseDelay: [500, 2000],
  errorScenarios: {
    networkError: 0.02,
    invalidSignature: 0.03,
  },
};
```

**Mock Response Types**:
```typescript
// Success Response
{
  status: "SUCCESS",
  documentId: "DL-2023-12345678",
  verified: true,
  issuer: {
    name: "Central Board of Secondary Education",
    code: "CBSE",
    verified: true
  },
  document: {
    type: "CERTIFICATE",
    issueDate: "2023-06-15",
    validUntil: null
  },
  timestamp: "2025-10-10T09:30:00.000Z"
}

// Failure Response
{
  status: "FAILED",
  error: {
    code: "INVALID_SIGNATURE",
    message: "Digital signature verification failed"
  },
  timestamp: "2025-10-10T09:30:00.000Z"
}

// Network Error
{
  status: "ERROR",
  error: {
    code: "NETWORK_TIMEOUT",
    message: "Request timed out"
  }
}
```

**Implementation Strategy**:
```typescript
class DigiLockerMockService {
  async verifyDocument(qrCode: string): Promise<DigiLockerResponse> {
    // Simulate network delay
    await this.simulateDelay();
    
    // Determine outcome based on probability
    const outcome = this.determineOutcome();
    
    if (outcome === 'success') {
      return this.generateSuccessResponse(qrCode);
    } else if (outcome === 'invalid') {
      return this.generateInvalidResponse();
    } else {
      throw new Error('Network timeout');
    }
  }
  
  private simulateDelay(): Promise<void> {
    const delay = this.randomBetween(
      digiLockerConfig.responseDelay[0],
      digiLockerConfig.responseDelay[1]
    );
    return new Promise(resolve => setTimeout(resolve, delay));
  }
  
  private determineOutcome(): 'success' | 'invalid' | 'error' {
    const rand = Math.random();
    if (rand < digiLockerConfig.errorScenarios.networkError) {
      return 'error';
    } else if (rand < digiLockerConfig.successRate) {
      return 'success';
    } else {
      return 'invalid';
    }
  }
}
```

### 1.2 NAD (National Academic Depository) Mock Service

**Purpose**: Simulate NAD API for academic certificate verification

**Mock Configuration**:
```typescript
const nadConfig = {
  successRate: 0.92,
  responseDelay: [800, 3000],
  errorScenarios: {
    recordNotFound: 0.05,
    systemError: 0.03,
  },
};
```

**Mock Response**:
```typescript
{
  status: "VERIFIED",
  nadId: "NAD-2023-ABC123456",
  certificate: {
    studentName: "John Doe",
    rollNumber: "12345678",
    institution: "Delhi University",
    degree: "Bachelor of Science",
    year: "2023",
    cgpa: "8.5"
  },
  verification: {
    verified: true,
    verifiedAt: "2025-10-10T09:30:00.000Z",
    verifiedBy: "NAD System"
  }
}
```

### 1.3 CBSE Portal Mock Service

**Purpose**: Simulate CBSE board portal for marksheet verification

**Mock Configuration**:
```typescript
const cbseConfig = {
  successRate: 0.88,
  responseDelay: [1000, 4000],
  errorScenarios: {
    portalDown: 0.05,
    recordNotFound: 0.07,
  },
};
```

**Mock Response**:
```typescript
{
  found: true,
  rollNumber: "12345678",
  examYear: "2023",
  studentName: "John Doe",
  school: {
    name: "Delhi Public School",
    code: "1234567"
  },
  result: {
    status: "PASS",
    percentage: 92.5,
    subjects: [
      { name: "Mathematics", marks: 95, maxMarks: 100 },
      { name: "Physics", marks: 90, maxMarks: 100 },
      { name: "Chemistry", marks: 92, maxMarks: 100 }
    ]
  },
  verificationCode: "CBSE-VER-2023-12345"
}
```

### 1.4 University Portal Mock Services

**Purpose**: Simulate various university portals (DU, Mumbai University, etc.)

**Mock Configuration**:
```typescript
const universityConfigs = {
  'DELHI_UNIVERSITY': {
    successRate: 0.85,
    responseDelay: [1500, 5000],
    portalAvailability: 0.90, // 90% uptime
  },
  'MUMBAI_UNIVERSITY': {
    successRate: 0.82,
    responseDelay: [2000, 6000],
    portalAvailability: 0.85,
  },
  // Add more universities...
};
```

## 2. Mock Certificate Data Generation

### 2.1 Certificate Templates

**School Certificate Template**:
```typescript
const schoolCertificateTemplate = {
  certificateType: "SCHOOL_CERTIFICATE",
  issuerType: "CBSE",
  fields: {
    studentName: "faker.person.fullName()",
    rollNumber: "faker.string.numeric(8)",
    registrationNumber: "faker.string.alphanumeric(10).toUpperCase()",
    examYear: "faker.date.past({ years: 5 }).getFullYear()",
    board: "CBSE",
    school: {
      name: "faker.company.name() + ' School'",
      code: "faker.string.numeric(7)"
    },
    subjects: [
      { name: "Mathematics", marks: 85-100, grade: "A+" },
      { name: "Physics", marks: 80-100, grade: "A+" },
      { name: "Chemistry", marks: 80-100, grade: "A+" },
      { name: "English", marks: 75-95, grade: "A" },
      { name: "Computer Science", marks: 85-100, grade: "A+" }
    ],
    totalMarks: "calculated",
    percentage: "calculated",
    result: "PASS",
    issueDate: "faker.date.past({ years: 5 })"
  }
};
```

**Degree Certificate Template**:
```typescript
const degreeCertificateTemplate = {
  certificateType: "DEGREE",
  issuerType: "UNIVERSITY",
  fields: {
    studentName: "faker.person.fullName()",
    rollNumber: "faker.string.numeric(10)",
    registrationNumber: "faker.string.alphanumeric(12).toUpperCase()",
    university: "faker.helpers.arrayElement(['Delhi University', 'Mumbai University', 'Bangalore University'])",
    college: "faker.company.name() + ' College'",
    degree: "faker.helpers.arrayElement(['Bachelor of Science', 'Bachelor of Arts', 'Bachelor of Commerce'])",
    specialization: "faker.helpers.arrayElement(['Computer Science', 'Physics', 'Mathematics', 'Economics'])",
    yearOfPassing: "faker.date.past({ years: 10 }).getFullYear()",
    cgpa: "faker.number.float({ min: 6.0, max: 10.0, precision: 0.01 })",
    division: "calculated based on CGPA",
    issueDate: "faker.date.past({ years: 10 })"
  }
};
```

### 2.2 Mock Data Generator Service

```typescript
class MockDataGenerator {
  private faker: Faker;
  
  constructor() {
    this.faker = faker;
  }
  
  generateCertificate(type: CertificateType, options?: Partial<Certificate>): Certificate {
    const template = this.getTemplate(type);
    const data = this.populateTemplate(template);
    
    return {
      ...data,
      ...options,
      id: this.faker.string.uuid(),
      certificateNumber: this.generateCertificateNumber(type),
      hasQrCode: this.faker.datatype.boolean({ probability: 0.7 }),
      hasDigitalSignature: this.faker.datatype.boolean({ probability: 0.6 }),
      qrCode: this.generateQRCode(),
      digitalSignature: this.generateDigitalSignature(),
    };
  }
  
  generateBatch(count: number, type: CertificateType): Certificate[] {
    return Array.from({ length: count }, () => this.generateCertificate(type));
  }
  
  private generateQRCode(): string {
    // Generate realistic QR code data
    return `QR-${this.faker.string.alphanumeric(32).toUpperCase()}`;
  }
  
  private generateDigitalSignature(): string {
    // Generate realistic digital signature
    return `SIG-${this.faker.string.alphanumeric(64).toUpperCase()}`;
  }
}
```

### 2.3 Seed Data Sets

**Development Seed Data**:
```typescript
const developmentSeeds = {
  users: [
    {
      email: "admin@example.com",
      password: "admin123",
      role: "ADMIN",
      firstName: "Admin",
      lastName: "User"
    },
    {
      email: "verifier@example.com",
      password: "verifier123",
      role: "VERIFIER",
      firstName: "Verifier",
      lastName: "User"
    },
    {
      email: "user@example.com",
      password: "user123",
      role: "API_USER",
      firstName: "Regular",
      lastName: "User"
    }
  ],
  
  certificates: {
    verified: 50,      // 50 verified certificates
    unverified: 10,    // 10 unverified certificates
    pending: 15,       // 15 pending certificates
    manualReview: 5    // 5 in manual review
  }
};
```

## 3. Mock Forensic Analysis

### 3.1 Forensic Check Simulator

**Purpose**: Simulate document forensic analysis

**Mock Checks**:
```typescript
interface ForensicChecks {
  fontAnalysis: {
    check: () => ForensicResult;
    weight: number;
  };
  metadataValidation: {
    check: () => ForensicResult;
    weight: number;
  };
  templateMatching: {
    check: () => ForensicResult;
    weight: number;
  };
  sealVerification: {
    check: () => ForensicResult;
    weight: number;
  };
}

interface ForensicResult {
  passed: boolean;
  confidence: number;
  findings: Finding[];
}

interface Finding {
  category: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  description: string;
  evidence?: string;
}
```

**Mock Implementation**:
```typescript
class ForensicAnalyzerMock {
  async analyze(certificate: Certificate): Promise<ForensicAnalysisResult> {
    const checks = [
      this.checkFonts(certificate),
      this.checkMetadata(certificate),
      this.checkTemplate(certificate),
      this.checkSeal(certificate),
    ];
    
    const results = await Promise.all(checks);
    const riskScore = this.calculateRiskScore(results);
    
    return {
      riskScore,
      findings: results.flatMap(r => r.findings),
      recommendation: this.getRecommendation(riskScore),
    };
  }
  
  private checkFonts(certificate: Certificate): ForensicResult {
    // Simulate font analysis
    const passed = Math.random() > 0.1; // 90% pass rate
    
    return {
      passed,
      confidence: passed ? 0.95 : 0.45,
      findings: passed ? [] : [{
        category: 'FONT_ANALYSIS',
        severity: 'MEDIUM',
        description: 'Inconsistent font usage detected',
      }],
    };
  }
  
  private calculateRiskScore(results: ForensicResult[]): number {
    // Calculate weighted risk score (0-100)
    const totalWeight = results.length;
    const failedWeight = results.filter(r => !r.passed).length;
    return Math.round((failedWeight / totalWeight) * 100);
  }
}
```

### 3.2 Tampering Scenarios

**Predefined Tampering Patterns**:
```typescript
const tamperingScenarios = [
  {
    name: "Font Inconsistency",
    probability: 0.05,
    severity: "MEDIUM",
    description: "Different fonts used in certificate body",
    riskScore: 45,
  },
  {
    name: "Metadata Mismatch",
    probability: 0.03,
    severity: "HIGH",
    description: "Creation date doesn't match issue date",
    riskScore: 75,
  },
  {
    name: "Seal Tampering",
    probability: 0.02,
    severity: "HIGH",
    description: "Official seal shows signs of digital manipulation",
    riskScore: 85,
  },
  {
    name: "Template Deviation",
    probability: 0.04,
    severity: "LOW",
    description: "Minor deviations from standard template",
    riskScore: 25,
  },
];
```

## 4. Response Time Simulation

### 4.1 Realistic Delays

**Delay Configuration**:
```typescript
const responseDelays = {
  digitalVerification: {
    min: 500,
    max: 2000,
    average: 1000,
  },
  portalLookup: {
    min: 1000,
    max: 5000,
    average: 2500,
  },
  forensicAnalysis: {
    min: 2000,
    max: 8000,
    average: 4000,
  },
  manualReview: {
    min: 300000,  // 5 minutes
    max: 3600000, // 1 hour
    average: 1800000, // 30 minutes
  },
};
```

**Implementation**:
```typescript
class DelaySimulator {
  async simulate(type: keyof typeof responseDelays): Promise<void> {
    const config = responseDelays[type];
    const delay = this.normalDistribution(config.min, config.max, config.average);
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  
  private normalDistribution(min: number, max: number, mean: number): number {
    // Box-Muller transform for normal distribution
    const u1 = Math.random();
    const u2 = Math.random();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    const value = mean + z * (max - min) / 6;
    return Math.max(min, Math.min(max, value));
  }
}
```

## 5. Error Scenario Simulation

### 5.1 Error Types

```typescript
const errorScenarios = {
  networkErrors: {
    timeout: {
      probability: 0.02,
      message: "Request timed out",
      retryable: true,
    },
    connectionRefused: {
      probability: 0.01,
      message: "Connection refused",
      retryable: true,
    },
  },
  
  apiErrors: {
    invalidRequest: {
      probability: 0.03,
      message: "Invalid request parameters",
      retryable: false,
    },
    rateLimitExceeded: {
      probability: 0.01,
      message: "Rate limit exceeded",
      retryable: true,
    },
    serviceUnavailable: {
      probability: 0.05,
      message: "Service temporarily unavailable",
      retryable: true,
    },
  },
  
  verificationErrors: {
    recordNotFound: {
      probability: 0.07,
      message: "Certificate record not found",
      retryable: false,
    },
    invalidSignature: {
      probability: 0.03,
      message: "Digital signature verification failed",
      retryable: false,
    },
  },
};
```

### 5.2 Error Injection

```typescript
class ErrorInjector {
  shouldInjectError(errorType: string): boolean {
    const scenario = this.getErrorScenario(errorType);
    return Math.random() < scenario.probability;
  }
  
  injectError(errorType: string): Error {
    const scenario = this.getErrorScenario(errorType);
    const error = new Error(scenario.message);
    error.name = errorType;
    error['retryable'] = scenario.retryable;
    return error;
  }
}
```

## 6. Mock Data Persistence

### 6.1 Consistent Mock Responses

**Strategy**: Cache mock responses for consistency

```typescript
class MockResponseCache {
  private cache: Map<string, any> = new Map();
  
  async getOrGenerate(key: string, generator: () => Promise<any>): Promise<any> {
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }
    
    const value = await generator();
    this.cache.set(key, value);
    return value;
  }
  
  clear(): void {
    this.cache.clear();
  }
}
```

**Usage**:
```typescript
// Ensure same certificate always gets same verification result
const cacheKey = `digilocker:${certificate.qrCode}`;
const response = await mockCache.getOrGenerate(cacheKey, () => 
  digiLockerMock.verifyDocument(certificate.qrCode)
);
```

## 7. Configuration Management

### 7.1 Mock Configuration File

```typescript
// config/mock.config.ts
export const mockConfig = {
  enabled: process.env.MOCK_MODE === 'true',
  
  services: {
    digilocker: {
      enabled: true,
      successRate: 0.95,
      responseDelay: [500, 2000],
    },
    nad: {
      enabled: true,
      successRate: 0.92,
      responseDelay: [800, 3000],
    },
    cbse: {
      enabled: true,
      successRate: 0.88,
      responseDelay: [1000, 4000],
    },
  },
  
  forensics: {
    enabled: true,
    tamperingRate: 0.05,
    analysisDelay: [2000, 8000],
  },
  
  errors: {
    networkErrorRate: 0.02,
    apiErrorRate: 0.03,
  },
  
  cache: {
    enabled: true,
    ttl: 3600, // 1 hour
  },
};
```

### 7.2 Environment-based Configuration

```env
# .env.development
MOCK_MODE=true
MOCK_SUCCESS_RATE=0.95
MOCK_RESPONSE_DELAY_MIN=500
MOCK_RESPONSE_DELAY_MAX=2000
MOCK_ERROR_RATE=0.05

# .env.production
MOCK_MODE=false
```

## 8. Testing with Mock Data

### 8.1 Test Scenarios

```typescript
describe('Mock Verification Service', () => {
  it('should return success for valid certificate', async () => {
    const certificate = mockGenerator.generateCertificate('SCHOOL_CERTIFICATE', {
      hasQrCode: true,
    });
    
    const result = await verificationService.verify(certificate);
    expect(result.status).toBe('VERIFIED');
  });
  
  it('should handle network errors gracefully', async () => {
    // Force network error
    mockConfig.errors.networkErrorRate = 1.0;
    
    const certificate = mockGenerator.generateCertificate('DEGREE');
    const result = await verificationService.verify(certificate);
    
    expect(result.status).toBe('FAILED');
    expect(result.error).toContain('network');
  });
});
```

## 9. Mock Data Documentation

### 9.1 API Mock Endpoints (Internal)

```
GET /api/v1/mock/config
  - Get current mock configuration

PUT /api/v1/mock/config
  - Update mock configuration (dev/test only)

POST /api/v1/mock/reset
  - Reset mock cache and state

GET /api/v1/mock/statistics
  - Get mock service statistics
```

### 9.2 Mock Data Visualization

**Dashboard Metrics**:
- Total mock API calls
- Success/failure rates
- Average response times
- Error distribution
- Cache hit rates

## 10. Best Practices

1. **Consistency**: Same input should produce same output (use caching)
2. **Realism**: Response times and error rates should match real-world scenarios
3. **Configurability**: Easy to adjust success rates and delays
4. **Testability**: Mock services should be easy to test
5. **Documentation**: Clear documentation of mock behavior
6. **Observability**: Log all mock service calls for debugging
7. **Isolation**: Mock services should not affect each other
8. **Reset**: Ability to reset mock state between tests

---

**Document Version**: 1.0  
**Last Updated**: 2025-10-10  
**Status**: Draft for Review