# Certificate Verification Mock Demo - Testing Guide

This comprehensive guide provides detailed instructions for testing all features of the Certificate Verification Mock Demo application.

## Table of Contents

1. [Setup Instructions](#setup-instructions)
2. [Demo User Credentials](#demo-user-credentials)
3. [API Testing](#api-testing)
4. [Frontend Testing](#frontend-testing)
5. [Test Scenarios by Role](#test-scenarios-by-role)
6. [Expected Results](#expected-results)
7. [Troubleshooting](#troubleshooting)

---

## Setup Instructions

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+
- Git

### Initial Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Certificate_Verification_Mock
   ```

2. **Install dependencies**
   ```bash
   # Backend
   cd backend
   npm install
   
   # Frontend
   cd ../frontend
   npm install
   ```

3. **Configure environment variables**
   ```bash
   # Backend
   cd backend
   cp .env.example .env
   # Edit .env with your database credentials
   ```

4. **Setup database**
   ```bash
   cd backend
   
   # Run migrations
   npm run migration:run
   
   # Seed demo data
   npm run seed
   ```

5. **Start services**
   ```bash
   # Terminal 1 - Backend
   cd backend
   npm run dev
   
   # Terminal 2 - Frontend
   cd frontend
   npm run dev
   ```

6. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3000

---

## Demo User Credentials

The seed script creates three demo users:

| Role | Email | Password | Access Level |
|------|-------|----------|--------------|
| **Admin** | admin@certverify.com | Admin123! | Full system access, user management, audit logs |
| **Verifier** | verifier@certverify.com | Verifier123! | Manual review queue, certificate verification |
| **API User** | user@certverify.com | User123! | Certificate upload, verification requests |

---

## API Testing

### Using cURL

#### 1. User Registration

```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "Password123!",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "newuser@example.com",
      "role": "API_USER"
    },
    "token": "jwt_token_here"
  }
}
```

#### 2. User Login

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@certverify.com",
    "password": "User123!"
  }'
```

**Save the JWT token from response for subsequent requests.**

#### 3. Upload Certificate (JSON)

```bash
curl -X POST http://localhost:3000/api/v1/certificates/upload-json \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d @demo-data/certificates/cbse-10th-verified.json
```

#### 4. Upload Certificate (File)

```bash
curl -X POST http://localhost:3000/api/v1/certificates/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@path/to/certificate.pdf" \
  -F "certificateType=SCHOOL_CERTIFICATE" \
  -F "issuerName=CBSE" \
  -F "studentName=John Doe" \
  -F "rollNumber=123456"
```

#### 5. List Certificates

```bash
curl -X GET "http://localhost:3000/api/v1/certificates?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### 6. Get Certificate Details

```bash
curl -X GET http://localhost:3000/api/v1/certificates/{certificateId} \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### 7. Start Verification

```bash
curl -X POST http://localhost:3000/api/v1/verifications/{certificateId}/start \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "verificationType": "COMBINED"
  }'
```

#### 8. Get Verification Status

```bash
curl -X GET http://localhost:3000/api/v1/verifications/{verificationId} \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### 9. Get Review Queue (Verifier)

```bash
curl -X GET "http://localhost:3000/api/v1/verifier/queue?status=PENDING" \
  -H "Authorization: Bearer VERIFIER_JWT_TOKEN"
```

#### 10. Submit Review Decision (Verifier)

```bash
curl -X POST http://localhost:3000/api/v1/verifier/reviews/{reviewId}/decision \
  -H "Authorization: Bearer VERIFIER_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "decision": "APPROVED",
    "comments": "Certificate verified against issuer records."
  }'
```

#### 11. Get System Statistics (Admin)

```bash
curl -X GET http://localhost:3000/api/v1/admin/stats \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"
```

#### 12. Get Audit Logs (Admin)

```bash
curl -X GET "http://localhost:3000/api/v1/audit/logs?page=1&limit=20" \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"
```

### Using Postman

1. Import the Postman collection from `demo-data/Certificate_Verification_API.postman_collection.json`
2. Set up environment variables:
   - `base_url`: http://localhost:3000
   - `api_user_token`: JWT token for API user
   - `verifier_token`: JWT token for verifier
   - `admin_token`: JWT token for admin
3. Run requests in the collection

---

## Frontend Testing

### Login Flow

1. Navigate to http://localhost:5173
2. Click "Login"
3. Enter credentials for any demo user
4. Verify successful login and redirect to dashboard

### API User Workflows

#### Test Case 1: Upload Certificate via Form

1. Login as `user@certverify.com`
2. Navigate to "Upload Certificate"
3. Select "Manual Form" tab
4. Fill in certificate details:
   - Certificate Type: School Certificate
   - Issuer: CBSE
   - Student Name: Test Student
   - Roll Number: 123456
   - Date of Birth: 2005-01-01
   - Exam Year: 2023
5. Click "Upload Certificate"
6. Verify success message
7. Navigate to "My Certificates"
8. Verify certificate appears in list

#### Test Case 2: Upload Certificate via JSON

1. Login as `user@certverify.com`
2. Navigate to "Upload Certificate"
3. Select "JSON Upload" tab
4. Choose `demo-data/certificates/cbse-10th-verified.json`
5. Click "Upload"
6. Verify success message
7. Check certificate list

#### Test Case 3: Start Verification

1. Login as `user@certverify.com`
2. Navigate to "My Certificates"
3. Click on a certificate with "PENDING" status
4. Click "Start Verification"
5. Select verification type: "Combined"
6. Click "Start"
7. Wait for verification to complete
8. Verify status changes to "VERIFIED" or "MANUAL_REVIEW"

#### Test Case 4: View Verification Details

1. Login as `user@certverify.com`
2. Navigate to "Verifications"
3. Click on a completed verification
4. Verify the following are displayed:
   - Confidence score
   - Verification steps
   - Evidence collected
   - Timeline
   - Result summary

#### Test Case 5: Retry Failed Verification

1. Find a certificate with "UNVERIFIED" status
2. Click "Retry Verification"
3. Confirm retry
4. Monitor verification progress

### Verifier Workflows

#### Test Case 6: View Review Queue

1. Login as `verifier@certverify.com`
2. Navigate to "Review Queue"
3. Verify list of certificates requiring manual review
4. Check filters work:
   - Status: PENDING, IN_PROGRESS, COMPLETED
   - Priority: HIGH, MEDIUM, LOW

#### Test Case 7: Assign Review to Self

1. Login as `verifier@certverify.com`
2. Navigate to "Review Queue"
3. Click on a PENDING review
4. Click "Assign to Me"
5. Verify status changes to "IN_PROGRESS"

#### Test Case 8: Review Certificate

1. Login as `verifier@certverify.com`
2. Navigate to "Review Queue"
3. Click on an IN_PROGRESS review
4. Review certificate details
5. Review verification evidence
6. Make decision:
   - **Approve**: Certificate is genuine
   - **Reject**: Certificate is fraudulent
   - **Need Info**: Request additional information
7. Add comments
8. Submit decision
9. Verify review status changes to "COMPLETED"

#### Test Case 9: Escalate Review

1. Login as `verifier@certverify.com`
2. Open a complex review case
3. Click "Escalate"
4. Provide escalation reason
5. Submit escalation
6. Verify status changes to "ESCALATED"

### Admin Workflows

#### Test Case 10: View System Statistics

1. Login as `admin@certverify.com`
2. Navigate to "Dashboard" or "Statistics"
3. Verify the following metrics are displayed:
   - Total certificates
   - Total verifications
   - Verification success rate
   - Pending reviews
   - System health indicators

#### Test Case 11: User Management

1. Login as `admin@certverify.com`
2. Navigate to "Users"
3. View list of all users
4. **Create New User**:
   - Click "Add User"
   - Fill in details
   - Assign role
   - Submit
5. **Edit User**:
   - Click edit icon
   - Change role or status
   - Save changes
6. **Delete User**:
   - Click delete icon
   - Confirm deletion

#### Test Case 12: View Audit Logs

1. Login as `admin@certverify.com`
2. Navigate to "Audit Logs"
3. Verify logs are displayed with:
   - Timestamp
   - User
   - Action
   - Entity type
   - Changes made
4. Test filters:
   - Date range
   - Entity type
   - Action type
   - User

#### Test Case 13: System Monitoring

1. Login as `admin@certverify.com`
2. Navigate to "System Health"
3. Verify the following are displayed:
   - Database connection status
   - API response times
   - Active users
   - Recent errors
   - System uptime

---

## Test Scenarios by Role

### API User Test Scenarios

| # | Scenario | Steps | Expected Result |
|---|----------|-------|-----------------|
| 1 | Register new account | Use registration API/form | Account created, JWT token received |
| 2 | Login with credentials | Use login API/form | JWT token received, redirected to dashboard |
| 3 | Upload CBSE 10th certificate | Use cbse-10th-verified.json | Certificate uploaded, status PENDING |
| 4 | Start verification | Click "Start Verification" | Verification initiated, status IN_PROGRESS |
| 5 | View verification result | Navigate to verification details | Confidence score 85-100%, status VERIFIED |
| 6 | Upload diploma without security features | Use diploma-unverified.json | Certificate uploaded, verification fails |
| 7 | View certificate list | Navigate to "My Certificates" | All uploaded certificates displayed |
| 8 | Filter certificates by status | Use status filter | Only certificates with selected status shown |
| 9 | Search certificates | Use search box | Matching certificates displayed |
| 10 | Download verification report | Click "Download Report" | PDF report downloaded |

### Verifier Test Scenarios

| # | Scenario | Steps | Expected Result |
|---|----------|-------|-----------------|
| 1 | Login as verifier | Use verifier credentials | Access to review queue |
| 2 | View pending reviews | Navigate to review queue | List of pending reviews displayed |
| 3 | Assign review to self | Click "Assign to Me" | Review status changes to IN_PROGRESS |
| 4 | Review certificate with QR code | Open review, check QR validation | QR code validation results visible |
| 5 | Approve genuine certificate | Submit APPROVED decision | Certificate status changes to VERIFIED |
| 6 | Reject fraudulent certificate | Submit REJECTED decision | Certificate status changes to UNVERIFIED |
| 7 | Request more information | Submit NEEDS_INFO decision | User notified, review remains open |
| 8 | Escalate complex case | Click "Escalate" | Review escalated to senior verifier |
| 9 | View review history | Navigate to completed reviews | All past reviews displayed |
| 10 | Filter by priority | Use priority filter | Only high priority reviews shown |

### Admin Test Scenarios

| # | Scenario | Steps | Expected Result |
|---|----------|-------|-----------------|
| 1 | Login as admin | Use admin credentials | Full system access |
| 2 | View system statistics | Navigate to dashboard | All metrics displayed correctly |
| 3 | Create new verifier user | Add user with VERIFIER role | New verifier can login and access queue |
| 4 | Edit user role | Change API_USER to VERIFIER | User gains verifier permissions |
| 5 | Deactivate user | Set isActive to false | User cannot login |
| 6 | View audit logs | Navigate to audit logs | All system actions logged |
| 7 | Filter audit logs by date | Use date range filter | Only logs in range displayed |
| 8 | Export audit logs | Click "Export" | CSV file downloaded |
| 9 | Monitor system health | View health dashboard | All services status shown |
| 10 | View error logs | Navigate to error logs | Recent errors displayed |

---

## Expected Results

### Verification Outcomes

#### Verified Certificate
- **Confidence Score**: 85-100%
- **Status**: VERIFIED
- **Indicators**:
  - QR code validated ✓
  - Digital signature verified ✓
  - Portal lookup successful ✓
  - No tampering detected ✓

#### Unverified Certificate
- **Confidence Score**: 20-50%
- **Status**: UNVERIFIED
- **Indicators**:
  - Missing security features ✗
  - Portal lookup failed ✗
  - Forensic analysis suspicious ✗
  - Potential tampering detected ✗

#### Manual Review Required
- **Confidence Score**: 50-70%
- **Status**: MANUAL_REVIEW
- **Indicators**:
  - Inconclusive automated checks
  - Partial security features
  - Requires human verification

### Response Times

- **Certificate Upload**: < 2 seconds
- **Verification Start**: < 1 second
- **Verification Completion**: 5-15 seconds
- **Manual Review Assignment**: < 1 second
- **API Response**: < 500ms

### Error Handling

#### Common Errors

1. **401 Unauthorized**
   - Cause: Missing or invalid JWT token
   - Solution: Login again to get new token

2. **403 Forbidden**
   - Cause: Insufficient permissions
   - Solution: Use account with appropriate role

3. **404 Not Found**
   - Cause: Resource doesn't exist
   - Solution: Verify ID is correct

4. **422 Validation Error**
   - Cause: Invalid input data
   - Solution: Check request payload format

5. **500 Internal Server Error**
   - Cause: Server-side error
   - Solution: Check server logs, contact admin

---

## Troubleshooting

### Database Issues

**Problem**: Cannot connect to database

**Solutions**:
1. Verify PostgreSQL is running
2. Check database credentials in `.env`
3. Ensure database exists: `createdb cert_verification`
4. Run migrations: `npm run migration:run`

**Problem**: Seed script fails

**Solutions**:
1. Clear database: `npm run migration:revert`
2. Re-run migrations: `npm run migration:run`
3. Run seed again: `npm run seed`

### Authentication Issues

**Problem**: Login fails with correct credentials

**Solutions**:
1. Verify user exists in database
2. Check JWT_SECRET in `.env`
3. Clear browser cookies/localStorage
4. Try password reset

**Problem**: Token expired

**Solutions**:
1. Login again to get new token
2. Increase JWT_EXPIRES_IN in `.env`

### Verification Issues

**Problem**: Verification stuck in IN_PROGRESS

**Solutions**:
1. Check backend logs for errors
2. Verify mock services are running
3. Restart backend server
4. Retry verification

**Problem**: All verifications fail

**Solutions**:
1. Check mock service configuration
2. Verify database connections
3. Review verification service logs

### Frontend Issues

**Problem**: Cannot connect to backend

**Solutions**:
1. Verify backend is running on port 3000
2. Check VITE_API_URL in frontend `.env`
3. Check CORS configuration in backend

**Problem**: UI not updating after actions

**Solutions**:
1. Check browser console for errors
2. Verify API responses in Network tab
3. Clear browser cache
4. Restart frontend dev server

### Performance Issues

**Problem**: Slow API responses

**Solutions**:
1. Check database query performance
2. Review database indexes
3. Monitor server resources
4. Enable query logging

**Problem**: High memory usage

**Solutions**:
1. Restart services
2. Check for memory leaks
3. Optimize database queries
4. Increase server resources

---

## Additional Resources

- **API Documentation**: See `backend/API_ENDPOINTS.md`
- **Architecture**: See `ARCHITECTURE.md`
- **Data Models**: See `DATA_MODELS.md`
- **Deployment**: See `DEPLOYMENT_GUIDE.md`

---

## Support

For issues or questions:
1. Check this testing guide
2. Review application logs
3. Consult documentation
4. Contact development team

---

**Last Updated**: 2024-01-10
**Version**: 1.0.0