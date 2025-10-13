
# Certificate Verification Mock Demo - Backend API

A Node.js/Express backend API for certificate verification with mock external service integrations.

## 🚀 Features

- **JWT Authentication** - Secure token-based authentication
- **Role-Based Access Control** - Admin, Verifier, API User, Auditor roles
- **Mock Verification Services** - DigiLocker, CBSE Portal, Forensic Analysis
- **Audit Trail** - Tamper-evident hash chain for compliance
- **Rate Limiting** - Protect against abuse
- **TypeScript** - Type-safe development
- **PostgreSQL** - Reliable relational database
- **RESTful API** - Clean, well-documented endpoints

## 📋 Prerequisites

- Node.js 20.x or higher
- PostgreSQL 15.x or higher
- npm or yarn

## 🛠️ Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and configure your database and other settings.

3. **Create PostgreSQL database:**
   ```bash
   createdb cert_verification
   ```

4. **Run database migrations:**
   ```bash
   npm run migration:run
   ```

5. **Seed database (optional):**
   ```bash
   npm run seed
   ```

## 🏃 Running the Application

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm run build
npm start
```

### Run Tests
```bash
npm test
npm run test:coverage
```

## 📚 API Documentation

### Base URL
```
http://localhost:3000/api/v1
```

### Authentication

All authenticated endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

### Example API Requests

#### 1. Register a New User
```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!",
    "firstName": "John",
    "lastName": "Doe",
    "role": "API_USER"
  }'
```

#### 2. Login
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!"
  }'
```

Response:
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

#### 3. Submit Certificate for Verification
```bash
curl -X POST http://localhost:3000/api/v1/certificates \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your_token>" \
  -d '{
    "certificateData": {
      "studentName": "John Doe",
      "rollNumber": "12345678",
      "examYear": "2023",
      "board": "CBSE",
      "subjects": [
        {
          "name": "Mathematics",
          "marks": 95,
          "maxMarks": 100
        }
      ],
      "qrCode": "QR_DATA_STRING"
    },
    "certificateType": "SCHOOL_CERTIFICATE",
    "issuerName": "Central Board of Secondary Education",
    "issuerType": "CBSE"
  }'
```

#### 4. Get Certificate Status
```bash
curl -X GET http://localhost:3000/api/v1/certificates/{certificate_id} \
  -H "Authorization: Bearer <your_token>"
```

#### 5. Get Verification Details
```bash
curl -X GET http://localhost:3000/api/v1/verifications/{verification_id} \
  -H "Authorization: Bearer <your_token>"
```

#### 6. Manual Review Queue (Verifier Role)
```bash
curl -X GET http://localhost:3000/api/v1/manual-reviews/queue \
  -H "Authorization: Bearer <your_token>"
```

#### 7. Health Check (No Auth Required)
```bash
curl http://localhost:3000/health
```

## 🗂️ Project Structure

```
backend/
├── src/
│   ├── config/           # Configuration files
│   ├── models/           # Database models (TypeORM)
│   ├── controllers/      # Request handlers
│   ├── services/         # Business logic
│   │   ├── auth/         # Authentication services
│   │   ├── certificate/  # Certificate services
│   │   ├── verification/ # Verification services
│   │   ├── mock/         # Mock external services
│   │   └── ...
│   ├── middleware/       # Express middleware
│   ├── routes/           # API routes
│   ├── validators/       # Request validation
│   ├── types/            # TypeScript types
│   ├── utils/            # Utility functions
│   ├── database/         # Migrations and seeds
│   ├── app.ts            # Express app setup
│   └── server.ts         # Server entry point
├── tests/                # Test files
├── logs/                 # Application logs
├── storage/              # File storage
└── package.json
```

## 🔐 User Roles

- **ADMIN**: Full system access, user management
- **VERIFIER**: Manual review and verification
- **API_USER**: Submit certificates, check status
- **AUDITOR**: Read-only access to audit logs

## 🧪 Mock Services

The system includes mock implementations of external services:

### DigiLocker Mock
- **Success Rate**: 95%
- **Response Time**: 500-2000ms
- **Simulates**: QR code and digital signature verification

### CBSE Portal Mock
- **Success Rate**: 88%
- **Response Time**: 1000-4000ms
- **Simulates**: Board certificate lookup

### Forensic Analyzer Mock
- **Always Runs**: Yes
- **Response Time**: 2000-8000ms
- **Simulates**: Document tampering detection

## 📊 Database Schema

Key tables:
- `users` - User accounts
- `certificates` - Certificate metadata
- `verifications` - Verification processes
- `verification_steps` - Individual verification steps
- `manual_reviews` - Manual review queue
- `audit_logs` - Tamper-evident audit trail
- `consents` - User consent tracking
- `notifications` - Notification delivery

## 🔧 Configuration

Key environment variables:

```env
# Server
NODE_ENV=development
PORT=3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=cert_verification
DB_USER=postgres
DB_PASSWORD=postgres

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h

# Mock Services
MOCK_MODE=true
MOCK_SUCCESS_RATE=0.95
```

## 📝 Logging

Logs are stored in the `logs/` directory:
- `error.log` - Error level logs
- `combined.log` - All logs

## 🐛 Debugging

Enable debug logging:
```bash
LOG_LEVEL=debug npm run dev
```

## 🚦 Rate Limiting

- Anonymous: 10 requests/minute
- Authenticated: 100 requests/minute
- Admin: 1000 requests/minute

## 📄 License

MIT

## 👥 Support

For issues and questions, please open an issue on GitHub.

---

**Note**: This is a mock/demo system. All external API calls are simulated. Do not use in production without implementing real verification services.