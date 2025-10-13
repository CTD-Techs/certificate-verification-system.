# API Specification

## Overview

This document defines all RESTful API endpoints for the Certificate Verification Mock Demo system. The API follows REST principles, uses JSON for request/response bodies, and implements JWT-based authentication.

## Base Configuration

- **Base URL**: `http://localhost:3000/api/v1`
- **Protocol**: HTTP/HTTPS
- **Content-Type**: `application/json`
- **API Version**: v1
- **Authentication**: JWT Bearer Token

## Common Headers

### Request Headers
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
X-Request-ID: <unique_request_id>
```

### Response Headers
```
Content-Type: application/json
X-Request-ID: <unique_request_id>
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1234567890
```

## Standard Response Format

### Success Response
```json
{
  "success": true,
  "data": { },
  "message": "Operation completed successfully",
  "timestamp": "2025-10-10T09:30:00.000Z"
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  },
  "timestamp": "2025-10-10T09:30:00.000Z"
}
```

### Pagination Response
```json
{
  "success": true,
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": false
  },
  "timestamp": "2025-10-10T09:30:00.000Z"
}
```

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Invalid request data |
| `UNAUTHORIZED` | 401 | Missing or invalid authentication |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `CONFLICT` | 409 | Resource already exists |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |
| `SERVICE_UNAVAILABLE` | 503 | Service temporarily unavailable |

## API Endpoints

### 1. Authentication

#### 1.1 Register User
```
POST /auth/register
```

**Description**: Register a new user account

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "role": "API_USER"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "API_USER",
      "createdAt": "2025-10-10T09:30:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### 1.2 Login
```
POST /auth/login
```

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "role": "API_USER"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 86400
  }
}
```

#### 1.3 Refresh Token
```
POST /auth/refresh
```

**Request Body**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 86400
  }
}
```

#### 1.4 Logout
```
POST /auth/logout
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### 2. Certificates

#### 2.1 Submit Certificate for Verification
```
POST /certificates
```

**Description**: Submit a certificate JSON for verification

**Authentication**: Required

**Request Body**:
```json
{
  "certificateData": {
    "studentName": "John Doe",
    "rollNumber": "12345678",
    "registrationNumber": "REG2023001",
    "examYear": "2023",
    "board": "CBSE",
    "certificateNumber": "CERT123456",
    "issueDate": "2023-06-15",
    "subjects": [
      {
        "name": "Mathematics",
        "marks": 95,
        "maxMarks": 100,
        "grade": "A+"
      }
    ],
    "qrCode": "QR_DATA_STRING",
    "digitalSignature": "SIGNATURE_DATA"
  },
  "certificateType": "SCHOOL_CERTIFICATE",
  "issuerName": "Central Board of Secondary Education",
  "issuerType": "CBSE",
  "consent": {
    "verification": true,
    "storage": true,
    "thirdPartySharing": false
  }
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "certificate": {
      "id": "cert-550e8400-e29b-41d4-a716-446655440000",
      "certificateNumber": "CERT123456",
      "status": "PENDING",
      "createdAt": "2025-10-10T09:30:00.000Z"
    },
    "verification": {
      "id": "ver-660e8400-e29b-41d4-a716-446655440000",
      "status": "PENDING",
      "estimatedCompletionTime": "2025-10-10T09:35:00.000Z"
    }
  },
  "message": "Certificate submitted successfully for verification"
}
```

#### 2.2 Get Certificate Details
```
GET /certificates/:id
```

**Authentication**: Required

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "cert-550e8400-e29b-41d4-a716-446655440000",
    "certificateNumber": "CERT123456",
    "certificateType": "SCHOOL_CERTIFICATE",
    "issuerName": "Central Board of Secondary Education",
    "issuerType": "CBSE",
    "status": "VERIFIED",
    "hasQrCode": true,
    "hasDigitalSignature": true,
    "issueDate": "2023-06-15",
    "createdAt": "2025-10-10T09:30:00.000Z",
    "verifiedAt": "2025-10-10T09:32:00.000Z",
    "certificateData": {
      "studentName": "John Doe",
      "rollNumber": "12345678"
    }
  }
}
```

#### 2.3 List User Certificates
```
GET /certificates
```

**Authentication**: Required

**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)
- `status` (optional): Filter by status (PENDING, VERIFIED, UNVERIFIED, etc.)
- `certificateType` (optional): Filter by type
- `sortBy` (optional): Sort field (createdAt, verifiedAt)
- `sortOrder` (optional): asc or desc (default: desc)

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": "cert-550e8400-e29b-41d4-a716-446655440000",
      "certificateNumber": "CERT123456",
      "status": "VERIFIED",
      "certificateType": "SCHOOL_CERTIFICATE",
      "issuerName": "CBSE",
      "createdAt": "2025-10-10T09:30:00.000Z",
      "verifiedAt": "2025-10-10T09:32:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3,
    "hasNext": true,
    "hasPrev": false
  }
}
```

#### 2.4 Delete Certificate
```
DELETE /certificates/:id
```

**Authentication**: Required

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Certificate deleted successfully"
}
```

### 3. Verifications

#### 3.1 Get Verification Status
```
GET /verifications/:id
```

**Authentication**: Required

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "ver-660e8400-e29b-41d4-a716-446655440000",
    "certificateId": "cert-550e8400-e29b-41d4-a716-446655440000",
    "verificationType": "COMBINED",
    "status": "COMPLETED",
    "result": "VERIFIED",
    "confidenceScore": 95.5,
    "startedAt": "2025-10-10T09:30:00.000Z",
    "completedAt": "2025-10-10T09:32:00.000Z",
    "durationMs": 120000,
    "resultData": {
      "digitalVerification": {
        "qrCodeValid": true,
        "signatureValid": true,
        "issuerVerified": true
      },
      "forensicAnalysis": {
        "riskScore": 5,
        "findings": [
          {
            "category": "METADATA",
            "severity": "LOW",
            "description": "All metadata checks passed"
          }
        ]
      }
    }
  }
}
```

#### 3.2 Get Verification Steps
```
GET /verifications/:id/steps
```

**Authentication**: Required

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": "step-1",
      "stepType": "QR_VALIDATION",
      "stepName": "QR Code Validation",
      "status": "COMPLETED",
      "result": {
        "valid": true,
        "data": "QR_DECODED_DATA"
      },
      "executedAt": "2025-10-10T09:30:15.000Z",
      "durationMs": 500,
      "sequenceNumber": 1
    },
    {
      "id": "step-2",
      "stepType": "SIGNATURE_CHECK",
      "stepName": "Digital Signature Verification",
      "status": "COMPLETED",
      "result": {
        "valid": true,
        "issuer": "CBSE"
      },
      "executedAt": "2025-10-10T09:30:20.000Z",
      "durationMs": 1200,
      "sequenceNumber": 2
    }
  ]
}
```

#### 3.3 Retry Verification
```
POST /verifications/:id/retry
```

**Authentication**: Required (Admin only)

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "verificationId": "ver-770e8400-e29b-41d4-a716-446655440000",
    "status": "PENDING"
  },
  "message": "Verification retry initiated"
}
```

### 4. Manual Reviews

#### 4.1 Get Manual Review Queue
```
GET /manual-reviews/queue
```

**Authentication**: Required (Verifier role)

**Query Parameters**:
- `status` (optional): PENDING, IN_PROGRESS, COMPLETED
- `priority` (optional): LOW, MEDIUM, HIGH, URGENT
- `page` (optional): Page number
- `limit` (optional): Items per page

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": "review-1",
      "certificateId": "cert-550e8400-e29b-41d4-a716-446655440000",
      "status": "PENDING",
      "priority": "HIGH",
      "certificate": {
        "certificateNumber": "CERT123456",
        "issuerName": "CBSE",
        "studentName": "John Doe"
      },
      "assignedAt": null,
      "slaDeadline": "2025-10-10T12:00:00.000Z",
      "createdAt": "2025-10-10T09:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 15,
    "totalPages": 1
  }
}
```

#### 4.2 Claim Review
```
POST /manual-reviews/:id/claim
```

**Authentication**: Required (Verifier role)

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "review-1",
    "status": "IN_PROGRESS",
    "assignedAt": "2025-10-10T09:35:00.000Z"
  },
  "message": "Review claimed successfully"
}
```

#### 4.3 Submit Review Decision
```
POST /manual-reviews/:id/decision
```

**Authentication**: Required (Verifier role)

**Request Body**:
```json
{
  "decision": "APPROVED",
  "comments": "All documents verified. Certificate is authentic.",
  "internalNotes": "Cross-checked with board records.",
  "confidenceScore": 95
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "review-1",
    "status": "COMPLETED",
    "decision": "APPROVED",
    "completedAt": "2025-10-10T09:40:00.000Z"
  },
  "message": "Review decision submitted successfully"
}
```

#### 4.4 Escalate Review
```
POST /manual-reviews/:id/escalate
```

**Authentication**: Required (Verifier role)

**Request Body**:
```json
{
  "reason": "Requires senior verifier approval due to discrepancies",
  "escalateTo": "senior-verifier-id"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "review-1",
    "status": "ESCALATED",
    "escalatedTo": "senior-verifier-id"
  },
  "message": "Review escalated successfully"
}
```

### 5. Audit Logs

#### 5.1 Get Audit Logs
```
GET /audit-logs
```

**Authentication**: Required (Admin or Auditor role)

**Query Parameters**:
- `entityType` (optional): CERTIFICATE, VERIFICATION, USER, etc.
- `entityId` (optional): Specific entity ID
- `action` (optional): Specific action
- `userId` (optional): Filter by user
- `startDate` (optional): ISO date string
- `endDate` (optional): ISO date string
- `page` (optional): Page number
- `limit` (optional): Items per page

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": "audit-1",
      "entityType": "CERTIFICATE",
      "entityId": "cert-550e8400-e29b-41d4-a716-446655440000",
      "action": "CERTIFICATE_SUBMITTED",
      "userId": "user-123",
      "userEmail": "user@example.com",
      "changes": {
        "before": null,
        "after": {
          "status": "PENDING"
        }
      },
      "ipAddress": "192.168.1.1",
      "hash": "abc123...",
      "previousHash": "def456...",
      "createdAt": "2025-10-10T09:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 1000,
    "totalPages": 20
  }
}
```

#### 5.2 Verify Audit Chain
```
POST /audit-logs/verify-chain
```

**Authentication**: Required (Admin or Auditor role)

**Request Body**:
```json
{
  "startId": "audit-1",
  "endId": "audit-100"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "valid": true,
    "recordsChecked": 100,
    "startHash": "abc123...",
    "endHash": "xyz789..."
  },
  "message": "Audit chain is intact"
}
```

### 6. Users & Roles

#### 6.1 Get Current User Profile
```
GET /users/me
```

**Authentication**: Required

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "user-123",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "VERIFIER",
    "isActive": true,
    "createdAt": "2025-01-01T00:00:00.000Z",
    "lastLoginAt": "2025-10-10T09:00:00.000Z"
  }
}
```

#### 6.2 Update User Profile
```
PATCH /users/me
```

**Authentication**: Required

**Request Body**:
```json
{
  "firstName": "John",
  "lastName": "Smith"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "user-123",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Smith",
    "updatedAt": "2025-10-10T09:30:00.000Z"
  }
}
```

#### 6.3 Change Password
```
POST /users/me/change-password
```

**Authentication**: Required

**Request Body**:
```json
{
  "currentPassword": "OldPass123!",
  "newPassword": "NewPass456!"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

#### 6.4 List Users (Admin only)
```
GET /users
```

**Authentication**: Required (Admin role)

**Query Parameters**:
- `role` (optional): Filter by role
- `isActive` (optional): Filter by active status
- `page` (optional): Page number
- `limit` (optional): Items per page

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": "user-123",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "VERIFIER",
      "isActive": true,
      "createdAt": "2025-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "totalPages": 3
  }
}
```

### 7. Statistics & Analytics

#### 7.1 Get Dashboard Statistics
```
GET /statistics/dashboard
```

**Authentication**: Required (Admin role)

**Query Parameters**:
- `startDate` (optional): ISO date string
- `endDate` (optional): ISO date string

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "totalCertificates": 1000,
    "verifiedCertificates": 850,
    "unverifiedCertificates": 100,
    "pendingCertificates": 50,
    "averageVerificationTime": 120000,
    "verificationsByType": {
      "DIGITAL": 600,
      "PORTAL": 200,
      "MANUAL": 200
    },
    "successRate": 85.0,
    "manualReviewQueueDepth": 15,
    "averageConfidenceScore": 92.5
  }
}
```

#### 7.2 Get Verification Trends
```
GET /statistics/trends
```

**Authentication**: Required (Admin role)

**Query Parameters**:
- `period` (optional): day, week, month (default: week)
- `metric` (optional): count, success_rate, avg_time

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "period": "week",
    "metric": "count",
    "dataPoints": [
      {
        "date": "2025-10-04",
        "value": 120
      },
      {
        "date": "2025-10-05",
        "value": 135
      }
    ]
  }
}
```

### 8. Notifications

#### 8.1 Get User Notifications
```
GET /notifications
```

**Authentication**: Required

**Query Parameters**:
- `status` (optional): PENDING, SENT, FAILED
- `type` (optional): Notification type
- `page` (optional): Page number
- `limit` (optional): Items per page

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": "notif-1",
      "type": "VERIFICATION_COMPLETE",
      "subject": "Certificate Verification Complete",
      "body": "Your certificate CERT123456 has been verified successfully.",
      "status": "SENT",
      "sentAt": "2025-10-10T09:32:00.000Z",
      "createdAt": "2025-10-10T09:32:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "totalPages": 1
  }
}
```

#### 8.2 Mark Notification as Read
```
PATCH /notifications/:id/read
```

**Authentication**: Required

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Notification marked as read"
}
```

### 9. Webhooks (Third-party Integration)

#### 9.1 Register Webhook
```
POST /webhooks
```

**Authentication**: Required (Admin or API_USER role)

**Request Body**:
```json
{
  "url": "https://partner.example.com/webhook",
  "events": ["VERIFICATION_COMPLETE", "VERIFICATION_FAILED"],
  "secret": "webhook_secret_key"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": "webhook-1",
    "url": "https://partner.example.com/webhook",
    "events": ["VERIFICATION_COMPLETE", "VERIFICATION_FAILED"],
    "isActive": true,
    "createdAt": "2025-10-10T09:30:00.000Z"
  }
}
```

#### 9.2 List Webhooks
```
GET /webhooks
```

**Authentication**: Required

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": "webhook-1",
      "url": "https://partner.example.com/webhook",
      "events": ["VERIFICATION_COMPLETE"],
      "isActive": true,
      "createdAt": "2025-10-10T09:30:00.000Z"
    }
  ]
}
```

#### 9.3 Delete Webhook
```
DELETE /webhooks/:id
```

**Authentication**: Required

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Webhook deleted successfully"
}
```

### 10. Health & System

#### 10.1 Health Check
```
GET /health
```

**Authentication**: Not required

**Response** (200 OK):
```json
{
  "status": "healthy",
  "timestamp": "2025-10-10T09:30:00.000Z",
  "uptime": 86400
}
```

#### 10.2 Detailed Health Check
```
GET /health/detailed
```

**Authentication**: Required (Admin role)

**Response** (200 OK):
```json
{
  "status": "healthy",
  "timestamp": "2025-10-10T09:30:00.000Z",
  "components": {
    "database": {
      "status": "healthy",
      "responseTime": 5
    },
    "redis": {
      "status": "healthy",
      "responseTime": 2
    },
    "fileStorage": {
      "status": "healthy",
      "availableSpace": "50GB"
    }
  }
}
```

## Webhook Payload Format

When events occur, the system sends POST requests to registered webhook URLs:

### Verification Complete Event
```json
{
  "event": "VERIFICATION_COMPLETE",
  "timestamp": "2025-10-10T09:32:00.000Z",
  "data": {
    "certificateId": "cert-550e8400-e29b-41d4-a716-446655440000",
    "verificationId": "ver-660e8400-e29b-41d4-a716-446655440000",
    "result": "VERIFIED",
    "confidenceScore": 95.5,
    "completedAt": "2025-10-10T09:32:00.000Z"
  },
  "signature": "sha256_hmac_signature"
}
```

### Verification Failed Event
```json
{
  "event": "VERIFICATION_FAILED",
  "timestamp": "2025-10-10T09:32:00.000Z",
  "data": {
    "certificateId": "cert-550e8400-e29b-41d4-a716-446655440000",
    "verificationId": "ver-660e8400-e29b-41d4-a716-446655440000",
    "result": "UNVERIFIED",
    "reason": "Digital signature validation failed",
    "completedAt": "2025-10-10T09:32:00.000Z"
  },
  "signature": "sha256_hmac_signature"
}
```

## Rate Limiting

Rate limits are applied per user/API key:

| User Type | Requests per Minute | Burst Limit |
|-----------|---------------------|-------------|
| Anonymous | 10 | 20 |
| Authenticated | 100 | 150 |
| Admin | 1000 | 1500 |

When rate limit is exceeded:
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again later.",
    "retryAfter": 60
  }
}
```

## API Versioning

The API uses URL-based versioning:
- Current version: `/api/v1`
- Future versions: `/api/v2`, `/api/v3`, etc.

Older versions will be supported for at least 12 months after a new version is released.

## Authentication Flow

1. User registers or logs in → receives JWT token
2. Include token in Authorization header: `Bearer <token>`
3. Token expires after 24 hours
4. Use refresh token endpoint to get new token
5. Logout invalidates the token

## CORS Configuration

Allowed origins (configurable):
- `http://localhost:3000` (development)
- `https://app.example.com` (production)

Allowed methods: GET, POST, PUT, PATCH, DELETE, OPTIONS

Allowed headers: Authorization, Content-Type, X-Request-ID

## OpenAPI/Swagger Documentation

Interactive API documentation will be available at:
- Development: `http://localhost:3000/api-docs`
- Production: `https://api.example.com/api-docs`

---

**Document Version**: 1.0  
**Last Updated**: 2025-10-10  
**Status**: Draft for Review