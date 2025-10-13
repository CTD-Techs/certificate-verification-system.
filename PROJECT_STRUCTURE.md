# Project Structure

## Overview

This document defines the complete folder structure for the Certificate Verification Mock Demo system, including both backend (Node.js/Express) and frontend (React) applications.

## Root Directory Structure

```
certificate-verification-mock/
├── backend/                    # Node.js/Express API server
├── frontend/                   # React SPA application
├── docs/                       # Documentation
├── scripts/                    # Utility scripts
├── docker/                     # Docker configurations
├── .github/                    # GitHub workflows (CI/CD)
├── docker-compose.yml          # Docker Compose configuration
├── .gitignore                  # Git ignore rules
├── README.md                   # Project overview
└── LICENSE                     # License file
```

## Backend Structure

```
backend/
├── src/
│   ├── config/                 # Configuration files
│   │   ├── database.ts         # Database configuration
│   │   ├── auth.ts             # JWT & auth configuration
│   │   ├── redis.ts            # Redis configuration
│   │   ├── storage.ts          # File storage configuration
│   │   └── index.ts            # Main config aggregator
│   │
│   ├── models/                 # Database models (TypeORM/Sequelize)
│   │   ├── User.ts
│   │   ├── Certificate.ts
│   │   ├── Verification.ts
│   │   ├── VerificationStep.ts
│   │   ├── ManualReview.ts
│   │   ├── AuditLog.ts
│   │   ├── Consent.ts
│   │   ├── Notification.ts
│   │   ├── ApiKey.ts
│   │   ├── RateLimit.ts
│   │   └── index.ts
│   │
│   ├── controllers/            # Request handlers
│   │   ├── auth.controller.ts
│   │   ├── certificate.controller.ts
│   │   ├── verification.controller.ts
│   │   ├── manualReview.controller.ts
│   │   ├── auditLog.controller.ts
│   │   ├── user.controller.ts
│   │   ├── statistics.controller.ts
│   │   ├── notification.controller.ts
│   │   ├── webhook.controller.ts
│   │   ├── health.controller.ts
│   │   └── index.ts
│   │
│   ├── services/               # Business logic
│   │   ├── auth/
│   │   │   ├── auth.service.ts
│   │   │   ├── jwt.service.ts
│   │   │   └── password.service.ts
│   │   │
│   │   ├── certificate/
│   │   │   ├── certificate.service.ts
│   │   │   ├── ingestion.service.ts
│   │   │   └── storage.service.ts
│   │   │
│   │   ├── verification/
│   │   │   ├── verification.service.ts
│   │   │   ├── orchestrator.service.ts
│   │   │   ├── digital-verifier.service.ts
│   │   │   ├── portal-verifier.service.ts
│   │   │   ├── forensic-analyzer.service.ts
│   │   │   └── confidence-calculator.service.ts
│   │   │
│   │   ├── mock/
│   │   │   ├── mock-api.service.ts
│   │   │   ├── digilocker-mock.service.ts
│   │   │   ├── nad-mock.service.ts
│   │   │   ├── cbse-portal-mock.service.ts
│   │   │   └── university-portal-mock.service.ts
│   │   │
│   │   ├── manual-review/
│   │   │   ├── queue.service.ts
│   │   │   ├── assignment.service.ts
│   │   │   └── sla.service.ts
│   │   │
│   │   ├── audit/
│   │   │   ├── audit.service.ts
│   │   │   └── hash-chain.service.ts
│   │   │
│   │   ├── notification/
│   │   │   ├── notification.service.ts
│   │   │   ├── email.service.ts
│   │   │   └── webhook.service.ts
│   │   │
│   │   └── analytics/
│   │       ├── statistics.service.ts
│   │       └── trends.service.ts
│   │
│   ├── middleware/             # Express middleware
│   │   ├── auth.middleware.ts
│   │   ├── validation.middleware.ts
│   │   ├── rate-limit.middleware.ts
│   │   ├── error-handler.middleware.ts
│   │   ├── logger.middleware.ts
│   │   ├── cors.middleware.ts
│   │   └── index.ts
│   │
│   ├── routes/                 # API routes
│   │   ├── v1/
│   │   │   ├── auth.routes.ts
│   │   │   ├── certificate.routes.ts
│   │   │   ├── verification.routes.ts
│   │   │   ├── manual-review.routes.ts
│   │   │   ├── audit-log.routes.ts
│   │   │   ├── user.routes.ts
│   │   │   ├── statistics.routes.ts
│   │   │   ├── notification.routes.ts
│   │   │   ├── webhook.routes.ts
│   │   │   ├── health.routes.ts
│   │   │   └── index.ts
│   │   └── index.ts
│   │
│   ├── validators/             # Request validation schemas
│   │   ├── auth.validator.ts
│   │   ├── certificate.validator.ts
│   │   ├── verification.validator.ts
│   │   ├── manual-review.validator.ts
│   │   ├── user.validator.ts
│   │   └── index.ts
│   │
│   ├── types/                  # TypeScript type definitions
│   │   ├── express.d.ts
│   │   ├── certificate.types.ts
│   │   ├── verification.types.ts
│   │   ├── user.types.ts
│   │   ├── api.types.ts
│   │   └── index.ts
│   │
│   ├── utils/                  # Utility functions
│   │   ├── logger.ts
│   │   ├── crypto.ts
│   │   ├── date.ts
│   │   ├── validation.ts
│   │   ├── response.ts
│   │   ├── error.ts
│   │   └── index.ts
│   │
│   ├── database/               # Database related
│   │   ├── migrations/         # Database migrations
│   │   │   ├── 001_create_users.ts
│   │   │   ├── 002_create_certificates.ts
│   │   │   ├── 003_create_verifications.ts
│   │   │   └── ...
│   │   │
│   │   ├── seeds/              # Seed data
│   │   │   ├── users.seed.ts
│   │   │   ├── mock-certificates.seed.ts
│   │   │   └── index.ts
│   │   │
│   │   └── connection.ts       # Database connection
│   │
│   ├── jobs/                   # Background jobs
│   │   ├── verification-processor.job.ts
│   │   ├── notification-sender.job.ts
│   │   ├── sla-monitor.job.ts
│   │   └── index.ts
│   │
│   ├── app.ts                  # Express app setup
│   └── server.ts               # Server entry point
│
├── tests/                      # Test files
│   ├── unit/
│   │   ├── services/
│   │   │   ├── auth.service.test.ts
│   │   │   ├── verification.service.test.ts
│   │   │   └── ...
│   │   │
│   │   ├── utils/
│   │   │   ├── crypto.test.ts
│   │   │   └── ...
│   │   │
│   │   └── middleware/
│   │       ├── auth.middleware.test.ts
│   │       └── ...
│   │
│   ├── integration/
│   │   ├── auth.test.ts
│   │   ├── certificate.test.ts
│   │   ├── verification.test.ts
│   │   └── ...
│   │
│   ├── e2e/
│   │   ├── verification-flow.test.ts
│   │   ├── manual-review-flow.test.ts
│   │   └── ...
│   │
│   ├── fixtures/               # Test data
│   │   ├── certificates.json
│   │   ├── users.json
│   │   └── ...
│   │
│   └── setup.ts                # Test setup
│
├── storage/                    # File storage (gitignored)
│   ├── certificates/
│   ├── evidence/
│   └── temp/
│
├── logs/                       # Application logs (gitignored)
│   ├── app.log
│   ├── error.log
│   └── audit.log
│
├── .env.example                # Environment variables template
├── .env.development            # Development environment
├── .env.test                   # Test environment
├── .env.production             # Production environment (not in git)
├── .eslintrc.js                # ESLint configuration
├── .prettierrc                 # Prettier configuration
├── tsconfig.json               # TypeScript configuration
├── jest.config.js              # Jest configuration
├── package.json                # NPM dependencies
├── package-lock.json           # NPM lock file
├── Dockerfile                  # Docker image definition
└── README.md                   # Backend documentation
```

## Frontend Structure

```
frontend/
├── public/
│   ├── index.html
│   ├── favicon.ico
│   ├── manifest.json
│   └── robots.txt
│
├── src/
│   ├── components/             # Reusable components
│   │   ├── common/
│   │   │   ├── Button/
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Button.test.tsx
│   │   │   │   └── Button.module.css
│   │   │   │
│   │   │   ├── Input/
│   │   │   ├── Modal/
│   │   │   ├── Table/
│   │   │   ├── Card/
│   │   │   ├── Badge/
│   │   │   ├── Spinner/
│   │   │   ├── Alert/
│   │   │   └── index.ts
│   │   │
│   │   ├── layout/
│   │   │   ├── Header/
│   │   │   │   ├── Header.tsx
│   │   │   │   └── Header.module.css
│   │   │   │
│   │   │   ├── Sidebar/
│   │   │   ├── Footer/
│   │   │   ├── Layout/
│   │   │   └── index.ts
│   │   │
│   │   ├── certificate/
│   │   │   ├── CertificateCard/
│   │   │   ├── CertificateUpload/
│   │   │   ├── CertificateDetails/
│   │   │   ├── CertificateList/
│   │   │   └── index.ts
│   │   │
│   │   ├── verification/
│   │   │   ├── VerificationStatus/
│   │   │   ├── VerificationSteps/
│   │   │   ├── VerificationResult/
│   │   │   ├── ConfidenceScore/
│   │   │   └── index.ts
│   │   │
│   │   ├── manual-review/
│   │   │   ├── ReviewQueue/
│   │   │   ├── ReviewCard/
│   │   │   ├── ReviewForm/
│   │   │   ├── ReviewHistory/
│   │   │   └── index.ts
│   │   │
│   │   ├── audit/
│   │   │   ├── AuditLogTable/
│   │   │   ├── AuditLogFilter/
│   │   │   └── index.ts
│   │   │
│   │   └── dashboard/
│   │       ├── StatisticsCard/
│   │       ├── TrendChart/
│   │       ├── ActivityFeed/
│   │       └── index.ts
│   │
│   ├── pages/                  # Page components
│   │   ├── auth/
│   │   │   ├── LoginPage.tsx
│   │   │   ├── RegisterPage.tsx
│   │   │   └── index.ts
│   │   │
│   │   ├── dashboard/
│   │   │   ├── DashboardPage.tsx
│   │   │   └── index.ts
│   │   │
│   │   ├── certificates/
│   │   │   ├── CertificateListPage.tsx
│   │   │   ├── CertificateDetailPage.tsx
│   │   │   ├── CertificateUploadPage.tsx
│   │   │   └── index.ts
│   │   │
│   │   ├── verifications/
│   │   │   ├── VerificationListPage.tsx
│   │   │   ├── VerificationDetailPage.tsx
│   │   │   └── index.ts
│   │   │
│   │   ├── manual-review/
│   │   │   ├── ReviewQueuePage.tsx
│   │   │   ├── ReviewDetailPage.tsx
│   │   │   └── index.ts
│   │   │
│   │   ├── audit/
│   │   │   ├── AuditLogPage.tsx
│   │   │   └── index.ts
│   │   │
│   │   ├── profile/
│   │   │   ├── ProfilePage.tsx
│   │   │   ├── SettingsPage.tsx
│   │   │   └── index.ts
│   │   │
│   │   └── NotFoundPage.tsx
│   │
│   ├── hooks/                  # Custom React hooks
│   │   ├── useAuth.ts
│   │   ├── useCertificates.ts
│   │   ├── useVerifications.ts
│   │   ├── useManualReviews.ts
│   │   ├── useAuditLogs.ts
│   │   ├── useNotifications.ts
│   │   ├── usePagination.ts
│   │   ├── useDebounce.ts
│   │   └── index.ts
│   │
│   ├── services/               # API service layer
│   │   ├── api.ts              # Axios instance & interceptors
│   │   ├── auth.service.ts
│   │   ├── certificate.service.ts
│   │   ├── verification.service.ts
│   │   ├── manualReview.service.ts
│   │   ├── auditLog.service.ts
│   │   ├── user.service.ts
│   │   ├── statistics.service.ts
│   │   ├── notification.service.ts
│   │   └── index.ts
│   │
│   ├── store/                  # State management (Redux/Zustand)
│   │   ├── slices/
│   │   │   ├── authSlice.ts
│   │   │   ├── certificateSlice.ts
│   │   │   ├── verificationSlice.ts
│   │   │   ├── reviewSlice.ts
│   │   │   ├── notificationSlice.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── store.ts            # Store configuration
│   │   └── index.ts
│   │
│   ├── types/                  # TypeScript types
│   │   ├── auth.types.ts
│   │   ├── certificate.types.ts
│   │   ├── verification.types.ts
│   │   ├── user.types.ts
│   │   ├── api.types.ts
│   │   └── index.ts
│   │
│   ├── utils/                  # Utility functions
│   │   ├── format.ts
│   │   ├── validation.ts
│   │   ├── date.ts
│   │   ├── storage.ts
│   │   ├── constants.ts
│   │   └── index.ts
│   │
│   ├── styles/                 # Global styles
│   │   ├── variables.css
│   │   ├── global.css
│   │   ├── theme.css
│   │   └── index.css
│   │
│   ├── assets/                 # Static assets
│   │   ├── images/
│   │   ├── icons/
│   │   └── fonts/
│   │
│   ├── routes/                 # Route configuration
│   │   ├── PrivateRoute.tsx
│   │   ├── RoleRoute.tsx
│   │   ├── routes.tsx
│   │   └── index.ts
│   │
│   ├── contexts/               # React contexts
│   │   ├── AuthContext.tsx
│   │   ├── ThemeContext.tsx
│   │   └── index.ts
│   │
│   ├── App.tsx                 # Main App component
│   ├── App.test.tsx
│   ├── index.tsx               # Entry point
│   └── setupTests.ts           # Test setup
│
├── .env.example                # Environment variables template
├── .env.development
├── .env.production
├── .eslintrc.js
├── .prettierrc
├── tsconfig.json
├── package.json
├── package-lock.json
├── Dockerfile
└── README.md
```

## Docker Structure

```
docker/
├── backend/
│   ├── Dockerfile
│   └── .dockerignore
│
├── frontend/
│   ├── Dockerfile
│   ├── nginx.conf
│   └── .dockerignore
│
├── postgres/
│   ├── init.sql
│   └── Dockerfile
│
└── redis/
    └── redis.conf
```

## Documentation Structure

```
docs/
├── architecture/
│   ├── ARCHITECTURE.md         # System architecture (this file)
│   ├── DATA_MODELS.md          # Database schemas
│   ├── API_SPECIFICATION.md    # API documentation
│   └── SECURITY.md             # Security guidelines
│
├── guides/
│   ├── SETUP.md                # Setup instructions
│   ├── DEPLOYMENT.md           # Deployment guide
│   ├── DEVELOPMENT.md          # Development guide
│   └── TESTING.md              # Testing guide
│
├── api/
│   └── openapi.yaml            # OpenAPI specification
│
└── diagrams/
    ├── system-architecture.png
    ├── data-flow.png
    └── verification-pipeline.png
```

## Scripts Structure

```
scripts/
├── setup/
│   ├── init-db.sh              # Initialize database
│   ├── seed-data.sh            # Seed test data
│   └── create-admin.sh         # Create admin user
│
├── deployment/
│   ├── deploy-dev.sh
│   ├── deploy-staging.sh
│   └── deploy-prod.sh
│
├── maintenance/
│   ├── backup-db.sh
│   ├── restore-db.sh
│   └── cleanup-logs.sh
│
└── development/
    ├── generate-mock-data.ts
    ├── test-api.sh
    └── reset-dev-db.sh
```

## Configuration Files

### Backend package.json (key scripts)
```json
{
  "scripts": {
    "dev": "nodemon src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "lint": "eslint src/**/*.ts",
    "lint:fix": "eslint src/**/*.ts --fix",
    "format": "prettier --write \"src/**/*.ts\"",
    "migrate": "ts-node src/database/migrations/run.ts",
    "seed": "ts-node src/database/seeds/run.ts"
  }
}
```

### Frontend package.json (key scripts)
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "jest",
    "test:watch": "jest --watch",
    "lint": "eslint src/**/*.{ts,tsx}",
    "lint:fix": "eslint src/**/*.{ts,tsx} --fix",
    "format": "prettier --write \"src/**/*.{ts,tsx}\""
  }
}
```

## Environment Variables

### Backend .env.example
```env
# Server
NODE_ENV=development
PORT=3000
API_VERSION=v1

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=cert_verification
DB_USER=postgres
DB_PASSWORD=postgres

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h

# File Storage
STORAGE_TYPE=local
STORAGE_PATH=./storage

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# Email (Mock)
EMAIL_FROM=noreply@example.com
EMAIL_MOCK_MODE=true

# Logging
LOG_LEVEL=info
LOG_FILE_PATH=./logs
```

### Frontend .env.example
```env
VITE_API_BASE_URL=http://localhost:3000/api/v1
VITE_APP_NAME=Certificate Verification System
VITE_APP_VERSION=1.0.0
```

## Git Ignore Patterns

### Root .gitignore
```
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Environment
.env
.env.local
.env.production

# Build outputs
dist/
build/

# Storage
storage/
uploads/

# Logs
logs/
*.log

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Testing
coverage/
.nyc_output/

# Docker
docker-compose.override.yml
```

## Key Design Principles

### 1. Separation of Concerns
- Controllers handle HTTP requests/responses
- Services contain business logic
- Models define data structure
- Middleware handles cross-cutting concerns

### 2. Modularity
- Each feature has its own directory
- Clear boundaries between modules
- Easy to add/remove features

### 3. Testability
- Unit tests alongside source files
- Integration tests separate
- Mock data in fixtures

### 4. Scalability
- Service layer can be extracted to microservices
- Clear API boundaries
- Stateless design

### 5. Maintainability
- Consistent naming conventions
- Clear folder hierarchy
- Comprehensive documentation

## Naming Conventions

### Files
- Components: PascalCase (e.g., `CertificateCard.tsx`)
- Services: camelCase with .service suffix (e.g., `auth.service.ts`)
- Types: camelCase with .types suffix (e.g., `certificate.types.ts`)
- Tests: Same as source with .test suffix (e.g., `auth.service.test.ts`)

### Directories
- kebab-case for multi-word directories (e.g., `manual-review/`)
- Singular for utility directories (e.g., `util/`, `config/`)
- Plural for collection directories (e.g., `models/`, `services/`)

### Code
- Variables/Functions: camelCase
- Classes/Interfaces: PascalCase
- Constants: UPPER_SNAKE_CASE
- Private methods: prefix with underscore (e.g., `_privateMethod`)

---

**Document Version**: 1.0  
**Last Updated**: 2025-10-10  
**Status**: Draft for Review