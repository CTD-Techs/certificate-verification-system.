# Docker Deployment Guide

Complete guide for deploying the Certificate Verification System using Docker on AWS EC2 with RDS PostgreSQL.

## Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Environment Setup](#environment-setup)
3. [Build and Deployment](#build-and-deployment)
4. [Database Migrations](#database-migrations)
5. [Verification Steps](#verification-steps)
6. [Troubleshooting](#troubleshooting)
7. [Rollback Procedures](#rollback-procedures)
8. [Monitoring and Logs](#monitoring-and-logs)

---

## Pre-Deployment Checklist

### AWS Infrastructure

- [ ] **EC2 Instance Running**
  - Instance type: t2.medium or larger
  - OS: Amazon Linux 2 or Ubuntu 20.04+
  - Security group configured (ports 22, 80, 443, 5151, 8156)
  - SSH key pair available

- [ ] **RDS PostgreSQL Instance**
  - PostgreSQL version 14 or higher
  - Instance class: db.t3.micro or larger
  - Security group allows EC2 access on port 5432
  - Master username and password recorded
  - Database name: `cert_verification`

- [ ] **AWS Credentials**
  - IAM user with S3, Textract, and Bedrock permissions
  - Access Key ID and Secret Access Key available
  - Region configured (e.g., ap-south-1)

### Software Requirements

- [ ] Docker installed (version 20.10+)
- [ ] Docker Compose installed (version 2.0+)
- [ ] Git installed
- [ ] Sufficient disk space (minimum 10GB free)

### Security Requirements

- [ ] JWT secret generated (minimum 32 characters)
- [ ] Strong database password set
- [ ] SSL certificates prepared (if using HTTPS)
- [ ] Firewall rules configured

---

## Environment Setup

### Step 1: Connect to EC2 Instance

```bash
# SSH into your EC2 instance
ssh -i your-key.pem ec2-user@your-ec2-public-ip

# Or for Ubuntu
ssh -i your-key.pem ubuntu@your-ec2-public-ip
```

### Step 2: Install Docker and Docker Compose

**For Amazon Linux 2:**

```bash
# Update system
sudo yum update -y

# Install Docker
sudo yum install docker -y
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -a -G docker ec2-user

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installations
docker --version
docker-compose --version

# Log out and back in for group changes to take effect
exit
```

**For Ubuntu:**

```bash
# Update system
sudo apt-get update
sudo apt-get upgrade -y

# Install Docker
sudo apt-get install docker.io -y
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -a -G docker ubuntu

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installations
docker --version
docker-compose --version

# Log out and back in for group changes to take effect
exit
```

### Step 3: Clone Repository

```bash
# Clone the repository
git clone https://github.com/your-org/certificate-verification-system.git
cd certificate-verification-system

# Or if already cloned, pull latest changes
git pull origin main
```

### Step 4: Configure Environment Variables

```bash
# Copy the Docker environment template
cp .env.docker .env

# Edit the environment file
nano .env
```

**Required Environment Variables:**

```bash
# Node Environment
NODE_ENV=production

# AWS RDS PostgreSQL Configuration
DB_HOST=your-rds-endpoint.region.rds.amazonaws.com
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_secure_rds_password
DB_NAME=cert_verification

# Backend Configuration
PORT=3000

# JWT Configuration (Generate with: openssl rand -base64 32)
JWT_SECRET=your_very_secure_jwt_secret_min_32_characters
JWT_EXPIRES_IN=7d

# Security
BCRYPT_ROUNDS=10

# CORS Configuration (Replace with your EC2 public IP)
CORS_ORIGIN=http://your-ec2-ip:5151

# Frontend Configuration
VITE_API_URL=http://your-ec2-ip:8156
VITE_API_BASE_URL=http://your-ec2-ip:8156/api/v1

# AWS Configuration
# IMPORTANT: Replace with your actual AWS credentials
# Create IAM user with S3, Textract, and Bedrock permissions
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here
AWS_S3_BUCKET=certificate-verification-documents

# AWS Services Mock Mode
# Set to 'true' for development/testing without AWS services
# Set to 'false' for production with actual AWS services
AWS_TEXTRACT_MOCK_MODE=false
AWS_BEDROCK_MOCK_MODE=false
AWS_BEDROCK_MODEL_ID=anthropic.claude-3-5-sonnet-20241022-v2:0

# Redis Configuration
REDIS_HOST=redis
REDIS_PORT=6379

# Logging
LOG_LEVEL=info
```

**Generate Secure JWT Secret:**

```bash
openssl rand -base64 32
```

**AWS Credentials Setup:**

1. **Create IAM User:**
   - Go to AWS IAM Console
   - Create a new IAM user for the application
   - Enable programmatic access
   - Save the Access Key ID and Secret Access Key

2. **Attach Required Policies:**
   - `AmazonS3FullAccess` (or custom policy with S3 permissions)
   - `AmazonTextractFullAccess` (for document OCR)
   - `AmazonBedrockFullAccess` (for AI-powered verification)

3. **Create S3 Bucket:**
   ```bash
   aws s3 mb s3://certificate-verification-documents --region ap-south-1
   ```

4. **Configure Mock Mode:**
   - Set `AWS_TEXTRACT_MOCK_MODE=true` and `AWS_BEDROCK_MOCK_MODE=true` for development
   - Set both to `false` for production with actual AWS services

**Security Best Practices:**
- Never commit AWS credentials to Git
- Use IAM roles instead of access keys when possible
- Rotate credentials regularly
- Use least privilege principle for IAM policies
- Enable MFA for AWS accounts

### Step 5: Verify RDS Connectivity

```bash
# Test database connection
docker run --rm -it postgres:14-alpine psql -h your-rds-endpoint.region.rds.amazonaws.com -U postgres -d cert_verification

# If successful, you'll see the PostgreSQL prompt
# Type \q to exit
```

---

## Build and Deployment

### Deployment Script

Create a deployment script for automated deployment:

```bash
# Create deployment script
nano deploy.sh
```

**deploy.sh:**

```bash
#!/bin/bash

set -e

echo "======================================"
echo "Certificate Verification System"
echo "Docker Deployment Script"
echo "======================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if .env file exists
if [ ! -f .env ]; then
    print_error ".env file not found!"
    print_status "Please copy .env.docker to .env and configure it"
    exit 1
fi

print_status "Environment file found"

# Stop existing containers
print_status "Stopping existing containers..."
docker-compose down || true

# Pull latest code (if using Git)
if [ -d .git ]; then
    print_status "Pulling latest code from Git..."
    git pull origin main || print_warning "Git pull failed or not configured"
fi

# Build Docker images
print_status "Building Docker images..."
docker-compose build --no-cache

# Run database migrations
print_status "Running database migrations..."
docker-compose run --rm backend npm run migrate

# Seed database (optional - comment out if not needed)
print_status "Seeding database with initial data..."
docker-compose run --rm backend npm run seed || print_warning "Seeding failed or already completed"

# Start containers
print_status "Starting containers..."
docker-compose up -d

# Wait for services to be healthy
print_status "Waiting for services to be healthy..."
sleep 10

# Check container status
print_status "Checking container status..."
docker-compose ps

# Check backend health
print_status "Checking backend health..."
sleep 5
curl -f http://localhost:8156/health || print_error "Backend health check failed"

# Check frontend health
print_status "Checking frontend health..."
curl -f http://localhost:5151 || print_error "Frontend health check failed"

echo ""
print_status "======================================"
print_status "Deployment completed successfully!"
print_status "======================================"
echo ""
print_status "Services:"
print_status "  - Frontend: http://your-ec2-ip:5151"
print_status "  - Backend API: http://your-ec2-ip:8156"
print_status "  - API Docs: http://your-ec2-ip:8156/api-docs"
echo ""
print_status "To view logs:"
print_status "  docker-compose logs -f"
echo ""
print_status "To stop services:"
print_status "  docker-compose down"
echo ""
```

**Make script executable:**

```bash
chmod +x deploy.sh
```

### Manual Deployment Steps

If you prefer manual deployment:

#### 1. Stop Existing Containers

```bash
docker-compose down
```

#### 2. Build Docker Images

```bash
# Build all images
docker-compose build --no-cache

# Or build individually
docker-compose build backend
docker-compose build frontend
```

#### 3. Run Database Migrations

```bash
# Run migrations
docker-compose run --rm backend npm run migrate
```

#### 4. Seed Database (Optional)

```bash
# Seed with initial data
docker-compose run --rm backend npm run seed
```

#### 5. Start Services

```bash
# Start all services in detached mode
docker-compose up -d

# Or start with logs visible
docker-compose up
```

---

## Database Migrations

### Running Migrations

```bash
# Run all pending migrations
docker-compose run --rm backend npm run migrate

# Check migration status
docker-compose run --rm backend npm run migrate:status
```

### Creating New Migrations

```bash
# Generate a new migration
docker-compose run --rm backend npm run migrate:create -- AddNewFeature

# Edit the migration file in backend/src/database/migrations/
```

### Reverting Migrations

```bash
# Revert last migration
docker-compose run --rm backend npm run migrate:revert

# Revert to specific migration
docker-compose run --rm backend npm run migrate:revert -- 1697200000000
```

---

## Verification Steps

### 1. Check Container Status

```bash
# View running containers
docker-compose ps

# Expected output:
# NAME                    STATUS              PORTS
# cert-verify-backend     Up (healthy)        0.0.0.0:8156->3000/tcp
# cert-verify-frontend    Up (healthy)        0.0.0.0:5151->80/tcp
# cert-verify-redis       Up (healthy)        0.0.0.0:6379->6379/tcp
```

### 2. Check Service Health

```bash
# Backend health check
curl http://localhost:8156/health

# Expected response:
# {"status":"ok","timestamp":"2024-01-01T00:00:00.000Z"}

# Frontend health check
curl http://localhost:5151

# Should return HTML content
```

### 3. Test API Endpoints

```bash
# Test API root
curl http://localhost:8156/api/v1

# Test authentication endpoint
curl -X POST http://localhost:8156/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!@#",
    "name": "Test User",
    "role": "user"
  }'
```

### 4. Access Web Interface

Open in browser:
- Frontend: `http://your-ec2-ip:5151`
- API Documentation: `http://your-ec2-ip:8156/api-docs`

### 5. Check Database Connection

```bash
# Connect to database through backend container
docker-compose exec backend node -e "
const { Sequelize } = require('sequelize');
const config = require('./dist/config').default;
const sequelize = new Sequelize(config.database);
sequelize.authenticate()
  .then(() => console.log('Database connected successfully'))
  .catch(err => console.error('Database connection failed:', err));
"
```

---

## Troubleshooting

### Common Issues and Solutions

#### 1. Container Won't Start

**Problem:** Container exits immediately after starting

**Solution:**

```bash
# Check container logs
docker-compose logs backend
docker-compose logs frontend

# Check for port conflicts
sudo netstat -tulpn | grep -E ':(3000|5151|8156|6379)'

# Restart Docker daemon
sudo systemctl restart docker
```

#### 2. Database Connection Failed

**Problem:** Backend can't connect to RDS

**Solution:**

```bash
# Verify RDS endpoint
echo $DB_HOST

# Check RDS security group
# - Ensure EC2 security group is allowed on port 5432
# - Verify RDS is publicly accessible (if needed)

# Test connection manually
docker run --rm -it postgres:14-alpine psql -h $DB_HOST -U $DB_USER -d $DB_NAME

# Check backend logs
docker-compose logs backend | grep -i database
```

#### 3. Migration Errors

**Problem:** Migrations fail to run

**Solution:**

```bash
# Check migration status
docker-compose run --rm backend npm run migrate:status

# Reset migrations (CAUTION: This will drop all tables)
docker-compose run --rm backend npm run migrate:reset

# Run migrations again
docker-compose run --rm backend npm run migrate
```

#### 4. Frontend Can't Connect to Backend

**Problem:** API calls fail from frontend

**Solution:**

```bash
# Verify CORS_ORIGIN in .env matches frontend URL
grep CORS_ORIGIN .env

# Verify VITE_API_BASE_URL in .env
grep VITE_API_BASE_URL .env

# Rebuild frontend with correct API URL
docker-compose build --no-cache frontend
docker-compose up -d frontend
```

#### 5. Out of Memory

**Problem:** Containers crash due to memory issues

**Solution:**

```bash
# Check memory usage
docker stats

# Increase EC2 instance size
# Or add swap space
sudo dd if=/dev/zero of=/swapfile bs=1M count=2048
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Make swap permanent
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

#### 6. Permission Denied Errors

**Problem:** Docker commands fail with permission errors

**Solution:**

```bash
# Add user to docker group
sudo usermod -a -G docker $USER

# Log out and back in
exit

# Or use sudo for docker commands
sudo docker-compose up -d
```

#### 7. Port Already in Use

**Problem:** Port conflicts prevent containers from starting

**Solution:**

```bash
# Find process using the port
sudo lsof -i :8156
sudo lsof -i :5151

# Kill the process
sudo kill -9 <PID>

# Or change ports in docker-compose.yml
```

### Viewing Logs

```bash
# View all logs
docker-compose logs

# Follow logs in real-time
docker-compose logs -f

# View specific service logs
docker-compose logs backend
docker-compose logs frontend
docker-compose logs redis

# View last 100 lines
docker-compose logs --tail=100

# View logs with timestamps
docker-compose logs -t
```

### Debugging Inside Containers

```bash
# Execute bash in backend container
docker-compose exec backend sh

# Execute bash in frontend container
docker-compose exec frontend sh

# Run commands in container
docker-compose exec backend npm run migrate:status
docker-compose exec backend node -v
```

---

## Rollback Procedures

### Quick Rollback

If deployment fails, quickly rollback to previous version:

```bash
# Stop current containers
docker-compose down

# Checkout previous version
git checkout HEAD~1

# Rebuild and start
docker-compose build
docker-compose up -d

# Verify services
docker-compose ps
```

### Database Rollback

```bash
# Revert last migration
docker-compose run --rm backend npm run migrate:revert

# Revert multiple migrations
docker-compose run --rm backend npm run migrate:revert
docker-compose run --rm backend npm run migrate:revert
```

### Complete Rollback Script

Create a rollback script:

```bash
nano rollback.sh
```

**rollback.sh:**

```bash
#!/bin/bash

set -e

echo "======================================"
echo "Rolling back deployment..."
echo "======================================"

# Stop containers
echo "Stopping containers..."
docker-compose down

# Checkout previous version
echo "Reverting to previous version..."
git checkout HEAD~1

# Revert database migration
echo "Reverting database migration..."
docker-compose run --rm backend npm run migrate:revert || true

# Rebuild images
echo "Rebuilding images..."
docker-compose build

# Start services
echo "Starting services..."
docker-compose up -d

# Check status
echo "Checking status..."
docker-compose ps

echo "======================================"
echo "Rollback completed"
echo "======================================"
```

```bash
chmod +x rollback.sh
```

---

## Monitoring and Logs

### Container Health Monitoring

```bash
# Check container health status
docker-compose ps

# View health check logs
docker inspect cert-verify-backend | grep -A 10 Health
docker inspect cert-verify-frontend | grep -A 10 Health
```

### Application Logs

```bash
# Backend logs
docker-compose logs -f backend

# Frontend logs (nginx)
docker-compose logs -f frontend

# Redis logs
docker-compose logs -f redis

# All logs
docker-compose logs -f
```

### System Resource Monitoring

```bash
# Monitor container resource usage
docker stats

# Detailed container information
docker-compose top
```

### Log Rotation

Configure log rotation to prevent disk space issues:

```bash
# Create log rotation config
sudo nano /etc/docker/daemon.json
```

Add:

```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
```

```bash
# Restart Docker
sudo systemctl restart docker
```

### Persistent Logs

Backend logs are persisted to `./backend/logs` directory:

```bash
# View backend application logs
tail -f backend/logs/app.log
tail -f backend/logs/error.log

# Search logs
grep "ERROR" backend/logs/app.log
```

---

## Maintenance Commands

### Update Application

```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker-compose build
docker-compose up -d

# Run migrations
docker-compose run --rm backend npm run migrate
```

### Clean Up

```bash
# Remove stopped containers
docker-compose rm -f

# Remove unused images
docker image prune -a

# Remove unused volumes
docker volume prune

# Complete cleanup (CAUTION: Removes all unused Docker resources)
docker system prune -a --volumes
```

### Backup Database

```bash
# Backup database
docker-compose exec backend pg_dump -h $DB_HOST -U $DB_USER $DB_NAME > backup_$(date +%Y%m%d_%H%M%S).sql

# Or use AWS RDS automated backups
```

### Restart Services

```bash
# Restart all services
docker-compose restart

# Restart specific service
docker-compose restart backend
docker-compose restart frontend
```

---

## Security Best Practices

1. **Environment Variables**
   - Never commit `.env` file to Git
   - Use strong, unique passwords
   - Rotate JWT secrets regularly

2. **Network Security**
   - Configure EC2 security groups properly
   - Use HTTPS in production
   - Restrict RDS access to EC2 only

3. **Container Security**
   - Run containers as non-root users (already configured)
   - Keep base images updated
   - Scan images for vulnerabilities

4. **Access Control**
   - Use IAM roles for AWS services
   - Implement least privilege principle
   - Enable MFA for AWS accounts

5. **Monitoring**
   - Set up CloudWatch alarms
   - Monitor application logs
   - Track failed login attempts

---

## Production Checklist

Before going to production:

- [ ] All environment variables configured correctly
- [ ] JWT secret is strong and unique
- [ ] Database password is strong
- [ ] CORS origin set to production domain
- [ ] SSL certificates installed (if using HTTPS)
- [ ] Firewall rules configured
- [ ] Backup strategy implemented
- [ ] Monitoring and alerting set up
- [ ] Log rotation configured
- [ ] Documentation updated
- [ ] Team trained on deployment process
- [ ] Rollback procedure tested
- [ ] Load testing completed
- [ ] Security audit performed

---

## Support and Resources

### Documentation
- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [AWS RDS Documentation](https://docs.aws.amazon.com/rds/)
- [AWS EC2 Documentation](https://docs.aws.amazon.com/ec2/)

### Useful Commands Reference

```bash
# Docker Compose
docker-compose up -d              # Start services
docker-compose down               # Stop services
docker-compose ps                 # List containers
docker-compose logs -f            # View logs
docker-compose build              # Build images
docker-compose restart            # Restart services

# Docker
docker ps                         # List running containers
docker images                     # List images
docker stats                      # Resource usage
docker system df                  # Disk usage

# Application
npm run migrate                   # Run migrations
npm run seed                      # Seed database
npm run migrate:revert            # Revert migration
```

---

## Conclusion

This guide provides comprehensive instructions for deploying the Certificate Verification System using Docker. Follow the steps carefully, and refer to the troubleshooting section if you encounter any issues.

For additional support, contact the development team or refer to the project documentation.

**Last Updated:** 2024-01-13
**Version:** 1.0.0