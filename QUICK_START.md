# Quick Start Guide

Get the Certificate Verification Mock Demo up and running in minutes!

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18.x or higher ([Download](https://nodejs.org/))
- **PostgreSQL** 14.x or higher ([Download](https://www.postgresql.org/download/))
- **Git** ([Download](https://git-scm.com/downloads))

## 🚀 Quick Setup (5 Minutes)

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd Certificate_Verification_Mock
```

### Step 2: Install Dependencies

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Step 3: Setup Database

```bash
# Create PostgreSQL database
createdb cert_verification

# Or using psql
psql -U postgres
CREATE DATABASE cert_verification;
\q
```

### Step 4: Configure Environment

```bash
# Backend configuration
cd backend
cp .env.example .env

# Edit .env file with your database credentials
# Required variables:
# DB_HOST=localhost
# DB_PORT=5432
# DB_USER=postgres
# DB_PASSWORD=your_password
# DB_NAME=cert_verification
# JWT_SECRET=your_secret_key_here
```

**Windows Users**: Use `copy` instead of `cp`
```cmd
copy .env.example .env
```

### Step 5: Run Database Migrations

```bash
cd backend
npm run migration:run
```

### Step 6: Seed Demo Data

```bash
npm run seed
```

**Expected Output:**
```
🌱 Starting database seed...
✅ Database connected
🗑️  Clearing existing data...
✅ Database cleared successfully
👥 Creating demo users...
  ✓ Created ADMIN: admin@certverify.com
  ✓ Created VERIFIER: verifier@certverify.com
  ✓ Created API_USER: user@certverify.com
📜 Creating demo certificates...
  ✓ Created 13 certificates
🔍 Creating verifications...
  ✓ Created 10 verifications
📋 Creating manual reviews...
  ✓ Created 2 manual reviews
📝 Creating audit logs...
  ✓ Created audit logs
✅ Database seeded successfully!

Demo User Credentials:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ADMIN        | admin@certverify.com           | Admin123!
  VERIFIER     | verifier@certverify.com        | Verifier123!
  API_USER     | user@certverify.com            | User123!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Step 7: Start the Application

Open two terminal windows:

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Expected Output:**
```
[INFO] Server starting...
✅ Database connection established successfully
[INFO] Server running on port 3000
[INFO] Environment: development
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

**Expected Output:**
```
  VITE v5.0.0  ready in 500 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

### Step 8: Access the Application

Open your browser and navigate to:

**Frontend**: http://localhost:5173

**Backend API**: http://localhost:3000

---

## 🎯 First Steps

### 1. Login to the Application

1. Go to http://localhost:5173
2. Click "Login"
3. Use any of the demo credentials:

**For API User Testing:**
- Email: `user@certverify.com`
- Password: `User123!`

**For Verifier Testing:**
- Email: `verifier@certverify.com`
- Password: `Verifier123!`

**For Admin Testing:**
- Email: `admin@certverify.com`
- Password: `Admin123!`

### 2. Upload Your First Certificate

**Option A: Using Sample JSON**

1. Login as API User
2. Navigate to "Upload Certificate"
3. Select "JSON Upload" tab
4. Choose file: `demo-data/certificates/cbse-10th-verified.json`
5. Click "Upload"
6. ✅ Certificate uploaded successfully!

**Option B: Using Manual Form**

1. Login as API User
2. Navigate to "Upload Certificate"
3. Select "Manual Form" tab
4. Fill in the details:
   - Certificate Type: School Certificate
   - Issuer: CBSE
   - Student Name: John Doe
   - Roll Number: 123456
   - Date of Birth: 2005-01-01
   - Exam Year: 2023
5. Click "Upload Certificate"
6. ✅ Certificate uploaded successfully!

### 3. Start Verification

1. Go to "My Certificates"
2. Click on the uploaded certificate
3. Click "Start Verification"
4. Select verification type: "Combined"
5. Click "Start"
6. Wait 5-15 seconds for completion
7. ✅ View verification results!

### 4. Test Manual Review (Verifier)

1. Logout and login as Verifier
2. Navigate to "Review Queue"
3. Click on a pending review
4. Click "Assign to Me"
5. Review the certificate details
6. Submit decision (Approve/Reject/Need Info)
7. ✅ Review completed!

### 5. View System Statistics (Admin)

1. Logout and login as Admin
2. Navigate to "Dashboard"
3. View system statistics:
   - Total certificates
   - Verification success rate
   - Pending reviews
   - System health
4. Navigate to "Users" to manage users
5. Navigate to "Audit Logs" to view system activity

---

## 📋 Demo Data Overview

The seed script creates:

- **3 Users**: Admin, Verifier, API User
- **13 Certificates**: Various types and statuses
  - 5 CBSE 10th grade certificates
  - 3 CBSE 12th grade certificates
  - 3 University degrees
  - 2 Diplomas
- **10 Verifications**: Different results
  - 6 Verified
  - 2 Unverified
  - 2 Manual Review
- **2 Manual Reviews**: For testing verifier workflow
- **Audit Logs**: Complete audit trail

### Certificate Statuses

| Status | Count | Description |
|--------|-------|-------------|
| VERIFIED | 6 | Successfully verified certificates |
| UNVERIFIED | 2 | Failed verification (potential fraud) |
| MANUAL_REVIEW | 2 | Requires human verification |
| PENDING | 3 | Not yet verified |

---

## 🧪 Quick Test Scenarios

### Scenario 1: Successful Verification (2 minutes)

```bash
# 1. Login as API User
# 2. Upload: demo-data/certificates/cbse-10th-verified.json
# 3. Start verification
# Expected: Confidence score 85-100%, Status VERIFIED
```

### Scenario 2: Failed Verification (2 minutes)

```bash
# 1. Login as API User
# 2. Upload: demo-data/certificates/diploma-unverified.json
# 3. Start verification
# Expected: Confidence score 20-50%, Status UNVERIFIED
```

### Scenario 3: Manual Review (3 minutes)

```bash
# 1. Login as API User
# 2. Upload: demo-data/certificates/school-certificate-manual-review.json
# 3. Start verification
# Expected: Status MANUAL_REVIEW
# 4. Logout, login as Verifier
# 5. Go to Review Queue
# 6. Assign and complete review
```

### Scenario 4: User Management (2 minutes)

```bash
# 1. Login as Admin
# 2. Go to Users page
# 3. Click "Add User"
# 4. Create new user
# 5. Edit user role
# Expected: New user can login with assigned role
```

---

## 🔧 Common Commands

### Backend

```bash
# Development mode with hot reload
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run tests
npm test

# Run migrations
npm run migration:run

# Revert last migration
npm run migration:revert

# Seed database
npm run seed

# Lint code
npm run lint

# Format code
npm run format
```

### Frontend

```bash
# Development mode
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

---

## 🐛 Troubleshooting

### Database Connection Error

**Problem**: Cannot connect to PostgreSQL

**Solution**:
```bash
# Check if PostgreSQL is running
# Windows
pg_ctl status

# Linux/Mac
pg_isready

# Start PostgreSQL if not running
# Windows
pg_ctl start

# Linux
sudo service postgresql start

# Mac
brew services start postgresql
```

### Port Already in Use

**Problem**: Port 3000 or 5173 already in use

**Solution**:
```bash
# Find and kill process on port 3000 (Backend)
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3000 | xargs kill -9

# Or change port in .env (Backend) or vite.config.ts (Frontend)
```

### Migration Errors

**Problem**: Migration fails

**Solution**:
```bash
# Reset database
cd backend
npm run migration:revert
npm run migration:run
npm run seed
```

### Module Not Found

**Problem**: Cannot find module errors

**Solution**:
```bash
# Clean install dependencies
rm -rf node_modules package-lock.json
npm install

# Or on Windows
rmdir /s node_modules
del package-lock.json
npm install
```

### Seed Script Fails

**Problem**: Seed script errors

**Solution**:
```bash
# Clear database and re-seed
cd backend
npm run migration:revert
npm run migration:run
npm run seed
```

---

## 📚 Next Steps

Now that you have the application running:

1. **Explore the API**: See [`TESTING_GUIDE.md`](./TESTING_GUIDE.md) for comprehensive API testing
2. **Review Architecture**: See [`ARCHITECTURE.md`](./ARCHITECTURE.md) for system design
3. **Understand Data Models**: See [`DATA_MODELS.md`](./DATA_MODELS.md) for database schema
4. **Deploy to Production**: See [`DEPLOYMENT_GUIDE.md`](./DEPLOYMENT_GUIDE.md) for deployment instructions

---

## 🆘 Getting Help

If you encounter issues:

1. Check the [Troubleshooting](#troubleshooting) section above
2. Review [`TESTING_GUIDE.md`](./TESTING_GUIDE.md) for detailed testing instructions
3. Check application logs:
   - Backend: `backend/logs/`
   - Browser Console: F12 → Console tab
4. Verify environment variables in `.env` files

---

## 🎉 Success!

You now have a fully functional Certificate Verification Mock Demo system!

**What you can do:**
- ✅ Upload certificates (JSON or manual form)
- ✅ Start automated verifications
- ✅ Review certificates manually
- ✅ Manage users and permissions
- ✅ View audit logs and statistics
- ✅ Test all 38 API endpoints

**Demo Credentials:**
- **Admin**: admin@certverify.com / Admin123!
- **Verifier**: verifier@certverify.com / Verifier123!
- **API User**: user@certverify.com / User123!

Happy testing! 🚀