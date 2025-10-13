# AWS EC2 + RDS Deployment Guide

Complete guide for deploying the Certificate Verification System on AWS EC2 with RDS PostgreSQL.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [AWS RDS PostgreSQL Setup](#aws-rds-postgresql-setup)
3. [AWS EC2 Instance Setup](#aws-ec2-instance-setup)
4. [Security Group Configuration](#security-group-configuration)
5. [Application Deployment](#application-deployment)
6. [Database Migration and Seeding](#database-migration-and-seeding)
7. [Verification and Testing](#verification-and-testing)
8. [Troubleshooting](#troubleshooting)
9. [Production Best Practices](#production-best-practices)

---

## Prerequisites

- AWS Account with appropriate permissions
- AWS CLI installed and configured (optional but recommended)
- SSH key pair for EC2 access
- Domain name (optional, for production)
- Basic knowledge of AWS services (EC2, RDS, VPC, Security Groups)

---

## AWS RDS PostgreSQL Setup

### Step 1: Create RDS PostgreSQL Instance

1. **Navigate to RDS Console**
   - Go to AWS Console → Services → RDS
   - Click "Create database"

2. **Choose Database Creation Method**
   - Select "Standard create"

3. **Engine Options**
   - Engine type: PostgreSQL
   - Version: PostgreSQL 14.x or later (recommended)

4. **Templates**
   - For production: Choose "Production"
   - For testing: Choose "Free tier" (if eligible) or "Dev/Test"

5. **Settings**
   ```
   DB instance identifier: cert-verify-db
   Master username: postgres
   Master password: [Create a strong password - save this securely]
   ```

6. **DB Instance Class**
   - Production: `db.t3.medium` or higher
   - Testing: `db.t3.micro` (free tier eligible)

7. **Storage**
   - Storage type: General Purpose SSD (gp3)
   - Allocated storage: 20 GB (minimum)
   - Enable storage autoscaling: Yes
   - Maximum storage threshold: 100 GB

8. **Availability & Durability**
   - Production: Multi-AZ deployment (recommended)
   - Testing: Single-AZ

9. **Connectivity**
   - Virtual Private Cloud (VPC): Select your VPC
   - Subnet group: Default or create new
   - Public access: **No** (recommended for security)
   - VPC security group: Create new or select existing
   - Availability Zone: No preference

10. **Database Authentication**
    - Password authentication

11. **Additional Configuration**
    ```
    Initial database name: cert_verification
    DB parameter group: default.postgres14
    Backup retention period: 7 days (production) or 1 day (testing)
    Enable encryption: Yes (recommended)
    Enable Enhanced monitoring: Yes (production)
    Enable auto minor version upgrade: Yes
    ```

12. **Click "Create database"**
    - Wait 5-10 minutes for the database to be created
    - Note the endpoint once available

### Step 2: Get RDS Connection Details

Once the RDS instance is available:

1. Click on your database instance
2. Copy the **Endpoint** (e.g., `cert-verify-db.c9akciq32.us-east-1.rds.amazonaws.com`)
3. Note the **Port** (default: 5432)
4. Save these details for later configuration

**Example Connection String:**
```
Host: cert-verify-db.c9akciq32.us-east-1.rds.amazonaws.com
Port: 5432
Database: cert_verification
Username: postgres
Password: [your-secure-password]
```

---

## AWS EC2 Instance Setup

### Step 1: Launch EC2 Instance

1. **Navigate to EC2 Console**
   - Go to AWS Console → Services → EC2
   - Click "Launch Instance"

2. **Name and Tags**
   ```
   Name: cert-verify-app
   ```

3. **Application and OS Images (AMI)**
   - Select: Ubuntu Server 22.04 LTS (HVM), SSD Volume Type
   - Architecture: 64-bit (x86)

4. **Instance Type**
   - Production: `t3.medium` or higher (2 vCPU, 4 GB RAM)
   - Testing: `t2.micro` (free tier eligible)

5. **Key Pair**
   - Select existing key pair or create new
   - Download and save the `.pem` file securely

6. **Network Settings**
   - VPC: Same VPC as your RDS instance
   - Subnet: Public subnet
   - Auto-assign public IP: Enable
   - Firewall (security groups): Create new or select existing

7. **Configure Storage**
   - Root volume: 20 GB gp3
   - Increase if needed for logs and data

8. **Advanced Details**
   - Leave defaults or customize as needed

9. **Click "Launch Instance"**

### Step 2: Connect to EC2 Instance

```bash
# Change permissions on your key file
chmod 400 your-key-pair.pem

# Connect via SSH
ssh -i your-key-pair.pem ubuntu@your-ec2-public-ip
```

### Step 3: Install Required Software

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker ubuntu

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install Git
sudo apt install git -y

# Install PostgreSQL client (for database operations)
sudo apt install postgresql-client -y

# Logout and login again for docker group to take effect
exit
# Then reconnect via SSH
```

---

## Security Group Configuration

### RDS Security Group

1. **Navigate to EC2 → Security Groups**
2. **Find your RDS security group**
3. **Edit Inbound Rules**

Add the following rule:

| Type | Protocol | Port Range | Source | Description |
|------|----------|------------|--------|-------------|
| PostgreSQL | TCP | 5432 | [EC2-Security-Group-ID] | Allow EC2 to connect to RDS |

**Alternative (less secure):**
- Source: EC2 instance's private IP with /32 CIDR

### EC2 Security Group

1. **Navigate to EC2 → Security Groups**
2. **Find your EC2 security group**
3. **Edit Inbound Rules**

Add the following rules:

| Type | Protocol | Port Range | Source | Description |
|------|----------|------------|--------|-------------|
| SSH | TCP | 22 | Your-IP/32 | SSH access |
| Custom TCP | TCP | 8156 | 0.0.0.0/0 | Backend API |
| Custom TCP | TCP | 5151 | 0.0.0.0/0 | Frontend |
| HTTP | TCP | 80 | 0.0.0.0/0 | HTTP (optional) |
| HTTPS | TCP | 443 | 0.0.0.0/0 | HTTPS (optional) |

**Security Notes:**
- For production, restrict SSH access to your IP only
- Consider using a bastion host for SSH access
- Use HTTPS with SSL/TLS certificates in production
- Consider using AWS Application Load Balancer

---

## Application Deployment

### Step 1: Clone Repository

```bash
# Clone your repository
git clone https://github.com/your-username/certificate-verification-system.git
cd certificate-verification-system
```

### Step 2: Configure Environment Variables

```bash
# Copy the Docker environment template
cp .env.docker .env

# Edit the .env file
nano .env
```

Update the following values in `.env`:

```env
# AWS RDS PostgreSQL Configuration
DB_HOST=cert-verify-db.c9akciq32.us-east-1.rds.amazonaws.com
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_actual_rds_password
DB_NAME=cert_verification

# JWT Configuration
JWT_SECRET=generate_a_secure_random_string_min_32_chars

# Server Configuration
NODE_ENV=production
PORT=3000

# CORS Configuration
CORS_ORIGIN=http://your-ec2-public-ip:5151

# Frontend Configuration
VITE_API_URL=http://your-ec2-public-ip:8156
VITE_API_BASE_URL=http://your-ec2-public-ip:8156/api/v1
```

**Generate Secure JWT Secret:**
```bash
# Generate a secure random string
openssl rand -base64 32
```

### Step 3: Test RDS Connection

Before deploying, verify you can connect to RDS:

```bash
# Test connection to RDS
psql -h cert-verify-db.c9akciq32.us-east-1.rds.amazonaws.com \
     -U postgres \
     -d cert_verification \
     -p 5432

# Enter your RDS password when prompted
# If successful, you'll see the PostgreSQL prompt
# Type \q to exit
```

If connection fails, check:
- RDS security group allows inbound from EC2
- RDS endpoint is correct
- Password is correct
- RDS instance is available

### Step 4: Build and Start Services

```bash
# Build and start all services
docker-compose up -d --build

# Check if containers are running
docker-compose ps

# View logs
docker-compose logs -f
```

Expected output:
```
NAME                      STATUS              PORTS
cert-verify-backend       Up                  0.0.0.0:8156->3000/tcp
cert-verify-frontend      Up                  0.0.0.0:5151->80/tcp
cert-verify-redis         Up                  0.0.0.0:6379->6379/tcp
```

---

## Database Migration and Seeding

### Step 1: Run Database Migrations

```bash
# Access the backend container
docker-compose exec backend sh

# Inside the container, run migrations
npm run migrate

# Exit the container
exit
```

### Step 2: Seed Initial Data

```bash
# Access the backend container
docker-compose exec backend sh

# Inside the container, run seed script
npm run seed

# Exit the container
exit
```

### Step 3: Verify Database

```bash
# Connect to RDS directly
psql -h your-rds-endpoint.rds.amazonaws.com \
     -U postgres \
     -d cert_verification

# Check tables
\dt

# Check user count
SELECT COUNT(*) FROM users;

# Check certificate count
SELECT COUNT(*) FROM certificates;

# Exit
\q
```

---

## Verification and Testing

### Step 1: Health Check

```bash
# Check backend health
curl http://your-ec2-public-ip:8156/health

# Expected response:
# {"status":"ok","timestamp":"2024-01-15T10:30:00.000Z"}
```

### Step 2: Access Frontend

1. Open browser and navigate to: `http://your-ec2-public-ip:5151`
2. You should see the login page
3. Try logging in with seeded credentials:
   ```
   Email: admin@example.com
   Password: Admin@123
   ```

### Step 3: Test API Endpoints

```bash
# Test login endpoint
curl -X POST http://your-ec2-public-ip:8156/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "Admin@123"
  }'

# You should receive a JWT token in the response
```

### Step 4: Monitor Logs

```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend

# View last 100 lines
docker-compose logs --tail=100 backend
```

---

## Troubleshooting

### Issue: Cannot Connect to RDS

**Symptoms:**
- Backend fails to start
- Database connection errors in logs

**Solutions:**

1. **Check Security Group:**
   ```bash
   # Verify EC2 can reach RDS
   telnet your-rds-endpoint.rds.amazonaws.com 5432
   ```

2. **Verify RDS Status:**
   - Go to RDS Console
   - Check if instance is "Available"
   - Verify endpoint is correct

3. **Check Environment Variables:**
   ```bash
   # View current environment
   docker-compose exec backend env | grep DB_
   ```

4. **Test Connection from EC2:**
   ```bash
   psql -h your-rds-endpoint.rds.amazonaws.com \
        -U postgres \
        -d cert_verification \
        -p 5432
   ```

### Issue: Backend Container Keeps Restarting

**Check Logs:**
```bash
docker-compose logs backend
```

**Common Causes:**
- Database connection failure
- Missing environment variables
- Port conflicts
- Migration errors

**Solutions:**
```bash
# Restart services
docker-compose restart backend

# Rebuild if needed
docker-compose up -d --build backend

# Check container status
docker-compose ps
```

### Issue: Frontend Cannot Connect to Backend

**Symptoms:**
- API calls fail
- CORS errors in browser console

**Solutions:**

1. **Verify Backend is Running:**
   ```bash
   curl http://your-ec2-public-ip:8156/health
   ```

2. **Check CORS Configuration:**
   - Ensure `CORS_ORIGIN` in `.env` matches frontend URL
   - Rebuild backend after changes

3. **Check Frontend Environment:**
   ```bash
   # View frontend build args
   docker-compose config | grep VITE_
   ```

### Issue: Cannot Access Application from Browser

**Solutions:**

1. **Check Security Group:**
   - Verify ports 8156 and 5151 are open
   - Source should be 0.0.0.0/0 for public access

2. **Verify Containers are Running:**
   ```bash
   docker-compose ps
   ```

3. **Check EC2 Public IP:**
   ```bash
   curl http://checkip.amazonaws.com
   ```

4. **Test Locally on EC2:**
   ```bash
   curl http://localhost:8156/health
   curl http://localhost:5151
   ```

### Issue: Database Migration Fails

**Solutions:**

1. **Check Database Exists:**
   ```bash
   psql -h your-rds-endpoint.rds.amazonaws.com \
        -U postgres \
        -l
   ```

2. **Create Database if Missing:**
   ```bash
   psql -h your-rds-endpoint.rds.amazonaws.com \
        -U postgres \
        -c "CREATE DATABASE cert_verification;"
   ```

3. **Run Migrations Manually:**
   ```bash
   docker-compose exec backend npm run migrate
   ```

---

## Production Best Practices

### 1. Security

- **Use HTTPS:** Set up SSL/TLS certificates (Let's Encrypt or AWS Certificate Manager)
- **Restrict SSH:** Limit SSH access to specific IPs
- **Use Secrets Manager:** Store sensitive data in AWS Secrets Manager
- **Enable RDS Encryption:** Encrypt data at rest and in transit
- **Regular Updates:** Keep system packages and Docker images updated
- **Use IAM Roles:** Instead of hardcoding credentials
- **Enable CloudWatch:** For monitoring and alerting

### 2. High Availability

- **Multi-AZ RDS:** Enable Multi-AZ deployment for RDS
- **Auto Scaling:** Use Auto Scaling Groups for EC2
- **Load Balancer:** Use Application Load Balancer
- **Health Checks:** Configure proper health check endpoints
- **Backup Strategy:** Regular automated backups

### 3. Performance

- **RDS Instance Size:** Choose appropriate instance type
- **Connection Pooling:** Configure proper connection pool settings
- **Redis Caching:** Utilize Redis for caching
- **CDN:** Use CloudFront for static assets
- **Database Indexing:** Optimize database queries and indexes

### 4. Monitoring

```bash
# Set up CloudWatch Logs
# Install CloudWatch agent on EC2
wget https://s3.amazonaws.com/amazoncloudwatch-agent/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb
sudo dpkg -i -E ./amazon-cloudwatch-agent.deb

# Configure log forwarding
sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
  -a fetch-config \
  -m ec2 \
  -s \
  -c file:/opt/aws/amazon-cloudwatch-agent/etc/config.json
```

### 5. Backup and Disaster Recovery

**RDS Automated Backups:**
- Retention period: 7-35 days
- Backup window: During low-traffic hours

**Manual Snapshots:**
```bash
# Create RDS snapshot via AWS CLI
aws rds create-db-snapshot \
  --db-instance-identifier cert-verify-db \
  --db-snapshot-identifier cert-verify-backup-$(date +%Y%m%d)
```

**Application Backups:**
```bash
# Backup application data
docker-compose exec backend tar -czf /app/storage/backup-$(date +%Y%m%d).tar.gz /app/storage

# Download backup
docker cp cert-verify-backend:/app/storage/backup-$(date +%Y%m%d).tar.gz ./
```

### 6. Cost Optimization

- Use Reserved Instances for predictable workloads
- Enable RDS storage autoscaling
- Use appropriate instance sizes
- Schedule non-production instances to stop during off-hours
- Monitor and optimize data transfer costs

### 7. Domain and SSL Setup

**Using Route 53 and Certificate Manager:**

1. **Register Domain in Route 53**
2. **Request SSL Certificate in ACM**
3. **Create Application Load Balancer**
4. **Configure Target Groups**
5. **Update DNS Records**
6. **Update Environment Variables:**
   ```env
   CORS_ORIGIN=https://your-domain.com
   VITE_API_URL=https://api.your-domain.com
   ```

---

## Maintenance Commands

```bash
# View running containers
docker-compose ps

# View logs
docker-compose logs -f

# Restart services
docker-compose restart

# Stop services
docker-compose stop

# Start services
docker-compose start

# Rebuild and restart
docker-compose up -d --build

# Remove all containers and volumes
docker-compose down -v

# Update application
git pull
docker-compose up -d --build

# Database backup
docker-compose exec backend npm run db:backup

# Check disk usage
df -h
docker system df

# Clean up unused Docker resources
docker system prune -a
```

---

## Support and Resources

- **AWS Documentation:** https://docs.aws.amazon.com/
- **Docker Documentation:** https://docs.docker.com/
- **PostgreSQL Documentation:** https://www.postgresql.org/docs/

---

## Summary

You have successfully deployed the Certificate Verification System on AWS EC2 with RDS PostgreSQL. The application is now running with:

- ✅ AWS RDS PostgreSQL database (managed, scalable)
- ✅ Backend API on EC2 (port 8156)
- ✅ Frontend application on EC2 (port 5151)
- ✅ Redis for caching
- ✅ Proper security group configuration
- ✅ Database migrations and seed data

**Next Steps:**
1. Set up domain and SSL certificates
2. Configure monitoring and alerts
3. Implement backup strategy
4. Set up CI/CD pipeline
5. Perform load testing
6. Document operational procedures

For production deployment, follow the best practices section to ensure security, scalability, and reliability.