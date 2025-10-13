# Certificate Verification API - Endpoints Documentation

## Base URL
```
http://localhost:3000/api/v1
```

## Authentication
Most endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

---

## Authentication Endpoints

### Register User
**POST** `/auth/register`
- **Access**: Public
- **Body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123",
  "firstName": "John",
  "lastName": "Doe",
  "role": "API_USER"
}
```

### Login
**POST** `/auth/login`
- **Access**: Public
- **Body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

### Refresh Token
**POST** `/auth/refresh`
- **Access**: Public
- **Body**:
```json
{
  "refreshToken": "your_refresh_token"
}
```

### Logout
**POST** `/auth/logout`
- **Access**: Private

### Get Profile
**GET** `/auth/profile`
- **Access**: Private

### Update Profile
**PUT** `/auth/profile`
- **Access**: Private
- **Body**:
```json
{
  "firstName": "John",
  "lastName": "Doe"
}
```

### Change Password
**POST** `/auth/change-password`
- **Access**: Private
- **Body**:
```json
{
  "currentPassword": "OldPass123",
  "newPassword": "NewPass123"
}
```

---

## Certificate Endpoints

### Upload Certificate
**POST** `/certificates`
- **Access**: Private
- **Body**:
```json
{
  "certificateType": "SCHOOL_CERTIFICATE",
  "issuerType": "CBSE",
  "studentName": "John Doe",
  "rollNumber": "1234567",
  "examYear": "2023",
  "issueDate": "2023-06-20",
  "issuerName": "Central Board of Secondary Education",
  "school": {
    "name": "Delhi Public School",
    "code": "1234567"
  },
  "subjects": [
    {
      "name": "Mathematics",
      "marks": 95,
      "maxMarks": 100,
      "grade": "A+"
    }
  ],
  "qrCode": "QR_CODE_DATA",
  "digitalSignature": "SIGNATURE_DATA"
}
```

### List Certificates
**GET** `/certificates?page=1&limit=20&certificateType=SCHOOL_CERTIFICATE&status=VERIFIED`
- **Access**: Private
- **Query Parameters**:
  - `page`: Page number (default: 1)
  - `limit`: Items per page (default: 20)
  - `certificateType`: Filter by type
  - `issuerType`: Filter by issuer
  - `status`: Filter by status
  - `search`: Search term

### Get Certificate
**GET** `/certificates/:id`
- **Access**: Private

### Update Certificate
**PUT** `/certificates/:id`
- **Access**: Private

### Delete Certificate
**DELETE** `/certificates/:id`
- **Access**: Private

### Get Certificate Statistics
**GET** `/certificates/stats`
- **Access**: Private

---

## Verification Endpoints

### Create Verification
**POST** `/verifications`
- **Access**: Private
- **Body**:
```json
{
  "certificateId": "uuid",
  "verificationType": "COMBINED",
  "priority": "HIGH"
}
```

### List Verifications
**GET** `/verifications?page=1&limit=20&status=COMPLETED&result=VERIFIED`
- **Access**: Private
- **Query Parameters**:
  - `page`: Page number
  - `limit`: Items per page
  - `status`: Filter by status
  - `result`: Filter by result
  - `certificateId`: Filter by certificate
  - `startDate`: Filter by start date (YYYY-MM-DD)
  - `endDate`: Filter by end date (YYYY-MM-DD)

### Get Verification
**GET** `/verifications/:id`
- **Access**: Private

### Get Verification Steps
**GET** `/verifications/:id/steps`
- **Access**: Private

### Retry Verification
**POST** `/verifications/:id/retry`
- **Access**: Private

### Get Verification Statistics
**GET** `/verifications/stats?startDate=2024-01-01&endDate=2024-12-31`
- **Access**: Private

---

## Verifier Endpoints (Requires VERIFIER or ADMIN role)

### Get Review Queue
**GET** `/verifier/queue?page=1&limit=20&priority=HIGH&status=PENDING`
- **Access**: Private (Verifier, Admin)

### Get Next Review
**GET** `/verifier/next`
- **Access**: Private (Verifier, Admin)

### Get My Reviews
**GET** `/verifier/my-reviews?page=1&limit=20`
- **Access**: Private (Verifier, Admin)

### Get Review
**GET** `/verifier/reviews/:id`
- **Access**: Private (Verifier, Admin)

### Assign Review
**POST** `/verifier/reviews/:id/assign`
- **Access**: Private (Admin only)
- **Body**:
```json
{
  "verifierId": "uuid"
}
```

### Submit Review
**POST** `/verifier/reviews/:id/submit`
- **Access**: Private (Verifier, Admin)
- **Body**:
```json
{
  "decision": "APPROVED",
  "comments": "Certificate verified successfully after manual review",
  "confidenceScore": 85,
  "evidence": ["Evidence item 1", "Evidence item 2"]
}
```

### Get Review Statistics
**GET** `/verifier/stats?startDate=2024-01-01&endDate=2024-12-31`
- **Access**: Private (Verifier, Admin)

---

## Audit Endpoints (Requires ADMIN role)

### Get Audit Logs
**GET** `/audit?page=1&limit=50&entityType=VERIFICATION&action=VERIFICATION_COMPLETED`
- **Access**: Private (Admin)
- **Query Parameters**:
  - `page`: Page number
  - `limit`: Items per page
  - `entityType`: Filter by entity type
  - `entityId`: Filter by entity ID
  - `action`: Filter by action
  - `userId`: Filter by user
  - `startDate`: Filter by start date
  - `endDate`: Filter by end date

### Get Audit Log
**GET** `/audit/:id`
- **Access**: Private (Admin)

### Get Entity Audit Logs
**GET** `/audit/:entityType/:entityId?page=1&limit=50`
- **Access**: Private (Admin)

### Get Audit Statistics
**GET** `/audit/stats?startDate=2024-01-01&endDate=2024-12-31`
- **Access**: Private (Admin)

---

## Admin Endpoints (Requires ADMIN role)

### Get Users
**GET** `/admin/users?page=1&limit=20&role=API_USER&isActive=true&search=john`
- **Access**: Private (Admin)

### Create User
**POST** `/admin/users`
- **Access**: Private (Admin)
- **Body**:
```json
{
  "email": "newuser@example.com",
  "password": "SecurePass123",
  "firstName": "Jane",
  "lastName": "Smith",
  "role": "VERIFIER"
}
```

### Get User
**GET** `/admin/users/:id`
- **Access**: Private (Admin)

### Update User
**PUT** `/admin/users/:id`
- **Access**: Private (Admin)
- **Body**:
```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "role": "VERIFIER",
  "isActive": true
}
```

### Delete User
**DELETE** `/admin/users/:id`
- **Access**: Private (Admin)

### Reset User Password
**POST** `/admin/users/:id/reset-password`
- **Access**: Private (Admin)
- **Body**:
```json
{
  "newPassword": "NewSecurePass123"
}
```

### Get System Statistics
**GET** `/admin/stats`
- **Access**: Private (Admin)

---

## Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful",
  "timestamp": "2025-01-10T10:00:00Z"
}
```

### Paginated Response
```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": false
  },
  "message": "Data retrieved successfully",
  "timestamp": "2025-01-10T10:00:00Z"
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description",
    "details": [ ... ]
  },
  "timestamp": "2025-01-10T10:00:00Z"
}
```

---

## Verification Pipeline Flow

1. **Upload Certificate** → POST `/certificates`
2. **Create Verification** → POST `/verifications`
3. **Pipeline Execution** (Automatic):
   - Check for QR code/digital signature → DigiLocker verification
   - CBSE portal lookup
   - Forensic analysis
   - Calculate confidence score
   - If score < 70% → Create manual review
4. **Manual Review** (if needed):
   - Verifier gets review → GET `/verifier/next`
   - Submit decision → POST `/verifier/reviews/:id/submit`
5. **Get Results** → GET `/verifications/:id`

---

## Rate Limiting

- **Window**: 60 seconds
- **Max Requests**: 100 per window
- **Response**: 429 Too Many Requests

---

## Error Codes

- `VALIDATION_ERROR` - Invalid input data (400)
- `UNAUTHORIZED` - Authentication required (401)
- `FORBIDDEN` - Insufficient permissions (403)
- `NOT_FOUND` - Resource not found (404)
- `CONFLICT` - Resource already exists (409)
- `RATE_LIMIT_EXCEEDED` - Too many requests (429)
- `INTERNAL_ERROR` - Server error (500)