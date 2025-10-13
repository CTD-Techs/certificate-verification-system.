# Certificate Verification Mock Demo - System Architecture

## Executive Summary

This document outlines the architecture for a Certificate Verification Mock Demo system that processes pre-extracted certificate data (JSON), performs multi-stage verification through simulated external services, and provides a complete verification workflow with human-in-the-loop capabilities.

## System Overview

### Purpose
The system validates educational certificates through a multi-tier verification pipeline:
1. **Automated Digital Verification** - QR codes, digital signatures via simulated DigiLocker/NAD APIs
2. **Portal-based Verification** - Automated lookup via simulated board/university portals (CBSE, etc.)
3. **Manual Verification** - Human verifier workflow for cases requiring manual review
4. **Forensic Analysis** - Automated tampering detection and metadata analysis

### Key Characteristics
- **Scale**: Medium (500-1000 verifications/day)
- **Deployment**: Docker containerized
- **Architecture Pattern**: Modular monolith with clear service boundaries
- **Database**: PostgreSQL for relational data integrity
- **Authentication**: JWT-based with role-based access control (RBAC)

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Layer                             │
├─────────────────────────────────────────────────────────────────┤
│  React SPA (Admin Dashboard + Verifier Portal)                  │
│  - Certificate Upload & Status Tracking                          │
│  - Verifier Workbench (Manual Review)                           │
│  - Audit Log Viewer                                              │
│  - Analytics Dashboard                                           │
└────────────────────────┬────────────────────────────────────────┘
                         │ HTTPS/REST API
                         │
┌────────────────────────▼────────────────────────────────────────┐
│                      API Gateway Layer                           │
├─────────────────────────────────────────────────────────────────┤
│  Express.js API Server                                           │
│  - Authentication Middleware (JWT)                               │
│  - Rate Limiting                                                 │
│  - Request Validation                                            │
│  - CORS Configuration                                            │
└────────────────────────┬────────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────────┐
│                    Application Layer                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐ │
│  │ Certificate      │  │ Verification     │  │ User         │ │
│  │ Service          │  │ Service          │  │ Service      │ │
│  └──────────────────┘  └──────────────────┘  └──────────────┘ │
│                                                                  │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐ │
│  │ Audit            │  │ Notification     │  │ Queue        │ │
│  │ Service          │  │ Service          │  │ Service      │ │
│  └──────────────────┘  └──────────────────┘  └──────────────┘ │
│                                                                  │
└────────────────────────┬────────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────────┐
│                  Verification Engine Layer                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐ │
│  │ Digital          │  │ Portal           │  │ Forensic     │ │
│  │ Verifier         │  │ Verifier         │  │ Analyzer     │ │
│  │ (QR/Signature)   │  │ (Board APIs)     │  │              │ │
│  └──────────────────┘  └──────────────────┘  └──────────────┘ │
│                                                                  │
│  ┌──────────────────┐  ┌──────────────────┐                    │
│  │ Mock External    │  │ Manual Queue     │                    │
│  │ API Simulator    │  │ Manager          │                    │
│  └──────────────────┘  └──────────────────┘                    │
│                                                                  │
└────────────────────────┬────────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────────┐
│                     Data Layer                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ PostgreSQL Database                                       │  │
│  │  - Certificates                                           │  │
│  │  - Verification Results                                   │  │
│  │  - Audit Logs (Tamper-evident)                           │  │
│  │  - Users & Roles                                          │  │
│  │  - Manual Review Queue                                    │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ File Storage (Local/S3-compatible)                        │  │
│  │  - Original Certificate Files (encrypted)                 │  │
│  │  - Evidence Files                                         │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Component Descriptions

### 1. Client Layer (React SPA)

**Purpose**: User interface for all system interactions

**Key Features**:
- Certificate submission and tracking
- Verifier workbench for manual reviews
- Real-time status updates (polling-based)
- Audit log visualization
- Role-based UI components

**Technology**: React 18+, React Router, Axios, Material-UI/Tailwind CSS

### 2. API Gateway Layer (Express.js)

**Purpose**: Single entry point for all client requests

**Responsibilities**:
- JWT token validation
- Rate limiting (100 req/min per user, 1000 req/min global)
- Request/response logging
- Input validation and sanitization
- CORS policy enforcement
- API versioning (v1)

**Middleware Stack**:
```
Request → CORS → Rate Limiter → Auth → Validation → Route Handler → Response
```

### 3. Application Layer

#### Certificate Service
- Ingest JSON certificate data
- Store certificate metadata
- Manage certificate lifecycle
- PII minimization and consent tracking

#### Verification Service
- Orchestrate verification pipeline
- Route to appropriate verifier
- Aggregate results from multiple checks
- Calculate confidence scores

#### User Service
- User authentication (JWT)
- Role management (Admin, Verifier, API User)
- Permission enforcement

#### Audit Service
- Tamper-evident logging (hash chain)
- Activity tracking
- Compliance reporting

#### Notification Service
- Email notifications (simulated)
- Webhook callbacks
- Status change alerts

#### Queue Service
- Manual verification queue management
- Priority-based assignment
- SLA tracking

### 4. Verification Engine Layer

#### Digital Verifier
**Purpose**: Validate QR codes and digital signatures

**Simulated APIs**:
- DigiLocker API (document verification)
- NAD (National Academic Depository)
- Issuer-specific APIs

**Process**:
1. Extract QR code data or signature
2. Call mock external API
3. Return VERIFIED/UNVERIFIED with evidence

#### Portal Verifier
**Purpose**: Lookup certificates via board/university portals

**Simulated Portals**:
- CBSE (Central Board of Secondary Education)
- State boards (Maharashtra, Karnataka, etc.)
- Universities (DU, Mumbai University, etc.)

**Process**:
1. Extract roll number, year, board
2. Simulate HTTP form submission
3. Parse mock response
4. Return verification result

#### Forensic Analyzer
**Purpose**: Detect tampering and anomalies

**Checks**:
- Font consistency analysis
- Metadata validation (creation date, software)
- Image forensics (copy-paste detection)
- Template matching
- Seal/signature verification

**Output**: Risk score (0-100) with detailed findings

#### Mock External API Simulator
**Purpose**: Simulate responses from external services

**Features**:
- Configurable success/failure rates
- Realistic response delays (100-2000ms)
- Error scenario simulation
- Response caching for consistency

#### Manual Queue Manager
**Purpose**: Route cases requiring human review

**Triggers**:
- Portal unavailable
- Low confidence score (<70%)
- Conflicting results
- High-value certificates

### 5. Data Layer

#### PostgreSQL Database
**Schema Design**:
- Normalized relational schema
- JSONB columns for flexible certificate data
- Full-text search indexes
- Audit trail with hash chain
- Row-level security policies

#### File Storage
**Strategy**:
- Encrypted at rest (AES-256)
- Organized by certificate ID
- Retention policy enforcement
- Access logging

## Verification Pipeline Flow

```
Certificate JSON Input
         │
         ▼
   ┌─────────────┐
   │  Ingest &   │
   │  Validate   │
   └──────┬──────┘
          │
          ▼
   ┌─────────────┐
   │  Extract    │
   │  Metadata   │
   └──────┬──────┘
          │
          ▼
   ┌─────────────────────────────────────┐
   │  Has QR/Digital Signature?          │
   └──┬──────────────────────────────┬───┘
      │ YES                          │ NO
      ▼                              ▼
┌──────────────┐            ┌──────────────┐
│  Digital     │            │  Portal      │
│  Verifier    │            │  Lookup      │
└──────┬───────┘            └──────┬───────┘
       │                           │
       │ SUCCESS                   │ FOUND
       ▼                           ▼
┌──────────────┐            ┌──────────────┐
│  Forensic    │            │  Forensic    │
│  Analysis    │            │  Analysis    │
└──────┬───────┘            └──────┬───────┘
       │                           │
       │                           │ PORTAL UNAVAILABLE
       │                           │ OR LOW CONFIDENCE
       │                           ▼
       │                    ┌──────────────┐
       │                    │  Manual      │
       │                    │  Queue       │
       │                    └──────┬───────┘
       │                           │
       │                           ▼
       │                    ┌──────────────┐
       │                    │  Verifier    │
       │                    │  Review      │
       │                    └──────┬───────┘
       │                           │
       └───────────┬───────────────┘
                   ▼
          ┌─────────────────┐
          │  Aggregate      │
          │  Results        │
          └────────┬────────┘
                   │
                   ▼
          ┌─────────────────┐
          │  Final Status:  │
          │  VERIFIED       │
          │  UNVERIFIED     │
          │  PENDING        │
          └────────┬────────┘
                   │
                   ▼
          ┌─────────────────┐
          │  Notify &       │
          │  Store Result   │
          └─────────────────┘
```

## Security Architecture

### Authentication & Authorization

**JWT Token Structure**:
```json
{
  "sub": "user_id",
  "email": "user@example.com",
  "role": "VERIFIER",
  "permissions": ["verify:read", "verify:update"],
  "iat": 1234567890,
  "exp": 1234571490
}
```

**Roles & Permissions**:
- **ADMIN**: Full system access
- **VERIFIER**: Manual review, comment, approve/reject
- **API_USER**: Submit certificates, check status
- **AUDITOR**: Read-only access to audit logs

### Data Protection

**PII Minimization**:
- Hash sensitive fields (Aadhaar, DOB)
- Redact unnecessary personal data
- Consent tracking for data retention

**Encryption**:
- TLS 1.3 for data in transit
- AES-256 for data at rest
- Field-level encryption for sensitive data

**Audit Trail**:
- Tamper-evident hash chain
- Immutable log entries
- Cryptographic signatures

### Rate Limiting

**Tiers**:
- Anonymous: 10 req/min
- Authenticated: 100 req/min
- Admin: 1000 req/min

**Strategy**: Token bucket algorithm with Redis

## Scalability Considerations

### Current Architecture (500-1000/day)
- Single Docker container deployment
- PostgreSQL with connection pooling
- In-memory caching for mock responses

### Future Scaling Path (5000+/day)
1. **Horizontal Scaling**: Multiple API server instances behind load balancer
2. **Database**: Read replicas, connection pooling
3. **Caching**: Redis for session and response caching
4. **Queue**: Bull/BullMQ for async processing
5. **Microservices**: Split verification engines into separate services

## Integration Points

### Third-Party Background Check Providers

**Integration Pattern**: Webhook-based

**Flow**:
1. System completes verification
2. POST result to provider webhook
3. Provider can query for additional details via API
4. Provider sends final decision via webhook

**API Endpoints**:
- `POST /api/v1/integrations/webhooks/register`
- `GET /api/v1/certificates/:id/verification-result`
- Webhook callback: `POST {provider_webhook_url}`

### External Verification Services (Future)

**Adapter Pattern**:
- Abstract interface for verification providers
- Concrete implementations for each service
- Easy to swap mock with real APIs

## Monitoring & Observability

### Metrics to Track
- Verification throughput (certs/hour)
- Average verification time
- Success/failure rates by verification type
- Manual queue depth and wait time
- API response times
- Error rates

### Logging Strategy
- Structured JSON logs
- Log levels: ERROR, WARN, INFO, DEBUG
- Correlation IDs for request tracing
- Separate audit log stream

### Health Checks
- `/health` - Basic liveness check
- `/health/ready` - Readiness check (DB connection, etc.)
- `/health/detailed` - Component-level health

## Deployment Architecture

### Docker Compose Setup

```
┌─────────────────────────────────────────────────────────┐
│                    Docker Host                          │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   nginx      │  │   api-server │  │  postgresql  │ │
│  │   (reverse   │  │   (Node.js)  │  │              │ │
│  │    proxy)    │  │              │  │              │ │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘ │
│         │                 │                  │          │
│         └─────────────────┴──────────────────┘          │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐                    │
│  │   frontend   │  │   redis      │                    │
│  │   (React)    │  │   (cache)    │                    │
│  └──────────────┘  └──────────────┘                    │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Environment Configuration
- Development: `.env.development`
- Staging: `.env.staging`
- Production: `.env.production`

### Backup Strategy
- Daily PostgreSQL dumps
- Certificate file backups
- Audit log archival (immutable storage)

## Compliance & Legal

### Data Retention
- Active certificates: 7 years
- Audit logs: 10 years (compliance requirement)
- PII: Delete after consent expiry

### Consent Management
- Explicit consent for data processing
- Consent withdrawal mechanism
- Audit trail of consent changes

### GDPR/Data Protection
- Right to access
- Right to erasure (with audit trail)
- Data portability
- Privacy by design

## Technology Stack Summary

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | React 18, TypeScript | UI framework |
| API Server | Node.js 20, Express 4 | REST API |
| Database | PostgreSQL 15 | Primary data store |
| Cache | Redis 7 | Session & response cache |
| Authentication | JWT, bcrypt | Auth & password hashing |
| File Storage | Local FS / MinIO | Certificate storage |
| Containerization | Docker, Docker Compose | Deployment |
| Reverse Proxy | Nginx | Load balancing, SSL |
| Testing | Jest, Supertest | Unit & integration tests |
| Documentation | OpenAPI 3.0 | API documentation |

## Next Steps

1. Review and approve this architecture
2. Create detailed data models and schemas
3. Define API endpoint specifications
4. Design project folder structure
5. Document mock data strategy
6. Create deployment configurations

---

**Document Version**: 1.0  
**Last Updated**: 2025-10-10  
**Status**: Draft for Review