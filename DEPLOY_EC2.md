# AWS EC2 Deployment Guide

Complete step-by-step guide for deploying the Certificate Verification System on AWS EC2 using Docker.

## Table of Contents
- [Prerequisites](#prerequisites)
- [EC2 Instance Setup](#ec2-instance-setup)
- [Security Group Configuration](#security-group-configuration)
- [Server Setup](#server-setup)
- [Application Deployment](#application-deployment)
- [Post-Deployment Configuration](#post-deployment-configuration)
- [Verification](#verification)
- [Troubleshooting](#troubleshooting)
- [Maintenance](#maintenance)

---

## Prerequisites

Before starting, ensure you have:
- AWS account with EC2 access
- SSH key pair for EC2 instance access
- Domain name (optional, but recommended)
- Basic knowledge of Linux commands

---

## EC2 Instance Setup

### 1. Launch EC2 Instance

**Recommended Specifications:**
- **Instance Type**: t2.medium or larger (minimum 2 vCPU, 4GB RAM)
- **AMI**: Ubuntu Server 22.04 LTS
- **Storage**: 20GB GP3 SSD (minimum)
- **Region**: Choose closest to your users

**Steps:**
1. Log in to AWS Console
2. Navigate to EC2 Dashboard
3. Click "Launch Instance"
4. Configure instance:
   - Name: `cert-verification-prod`
   - AMI: Ubuntu Server 22.04 LTS
   - Instance type: t2.medium
   - Key pair: Select or create new
   - Storage: 20GB GP3

---

## Security Group Configuration

### Required Inbound Rules

Configure your EC2 security group with the following inbound rules:

| Type | Protocol | Port Range | Source | Description |
|------|----------|------------|--------|-------------|
| SSH | TCP | 22 | Your IP/0.0.0.0/0 | SSH access |
| Custom TCP | TCP | 5151 | 0.0.0.0/0 | Frontend application |
| Custom TCP | TCP | 8156 | 0.0.0.0/0 | Backend API |
| PostgreSQL | TCP | 5432 | Security Group ID | Database (internal only) |

### Steps to Configure:

1. Go to EC2 Dashboard → Security Groups
2. Select your instance's security group
3. Click "Edit inbound rules"
4. Add the following rules:

```bash
# SSH Access
Type: SSH
Protocol: TCP
Port: 22
Source: 0.0.0.0/0 (or your IP for better security)

# Frontend Port
Type: Custom TCP
Protocol: TCP
Port: 5151
Source: 0.0.0.0/0
Description: Frontend Application

# Backend API Port
Type: Custom TCP
Protocol: TCP
Port: 8156
Source: 0.0.0.0/0
Description: Backend API

# PostgreSQL (if needed for external access)
Type: PostgreSQL
Protocol: TCP
Port: 5432
Source: Your Security Group ID
Description: Database Internal Access
```

5. Click "Save rules"

---

## Server Setup

### 1. Connect to EC2 Instance

```bash
# Replace with your key file and EC2 public IP
ssh -i /path/to/your-key.pem ubuntu@your-ec2-public-ip
```

### 2. Update System Packages

```bash
sudo apt update && sudo apt upgrade -y
```

### 3. Install Docker

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add current user to docker group
sudo usermod -aG docker $USER

# Start and enable Docker
sudo systemctl start docker
sudo systemctl enable docker

# Verify installation
docker --version
```

### 4. Install Docker Compose

```bash
# Download Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

# Make it executable
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker-compose --version
```

### 5. Install Git

```bash
sudo apt install git -y
git --version
```

---

## Application Deployment

### 1. Clone Repository

```bash
# Navigate to home directory
cd ~

# Clone your repository
git clone https://github.com/your-username/certificate-verification-system.git

# Navigate to project directory
cd certificate-verification-system
```

### 2. Configure Environment Variables

```bash
# Copy the Docker environment template
cp .env.docker .env

# Edit the environment file
nano .env
```

**Update the following values in `.env`:**

```bash
# Node Environment
NODE_ENV=production

# Database Configuration
DB_HOST=postgres
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=CHANGE_THIS_TO_STRONG_PASSWORD
DB_NAME=cert_verification

# Backend Configuration
PORT=3000

# JWT Configuration (IMPORTANT: Change these!)
JWT_SECRET=CHANGE_THIS_TO_LONG_RANDOM_STRING_MIN_32_CHARS
JWT_EXPIRES_IN=7d

# Security
BCRYPT_ROUNDS=12

# CORS - Replace with your EC2 public IP
CORS_ORIGIN=http://YOUR_EC2_PUBLIC_IP:5151

# Frontend Configuration
FRONTEND_PORT=80
VITE_API_URL=http://YOUR_EC2_PUBLIC_IP:8156
VITE_API_BASE_URL=http://YOUR_EC2_PUBLIC_IP:8156/api/v1

# Redis Configuration
REDIS_HOST=redis
REDIS_PORT=6379

# Logging
LOG_LEVEL=info
```

**To generate a secure JWT secret:**
```bash
openssl rand -base64 32
```

### 3. Build and Start Services

```bash
# Build Docker images
docker-compose build

# Start all services in detached mode
docker-compose up -d

# Verify all containers are running
docker-compose ps
```

Expected output:
```
NAME                    STATUS              PORTS
cert-verify-backend     Up                  0.0.0.0:8156->3000/tcp
cert-verify-frontend    Up                  0.0.0.0:5151->80/tcp
cert-verify-db          Up                  5432/tcp
cert-verify-redis       Up                  6379/tcp
```

### 4. Initialize Database

```bash
# Run database migrations
docker-compose exec backend npm run migrate

# Seed initial data (optional)
docker-compose exec backend npm run seed
```

---

## Post-Deployment Configuration

### 1. Create Admin User

```bash
# Access backend container
docker-compose exec backend sh

# Run seed script or create admin manually
npm run seed

# Exit container
exit
```

### 2. Configure Firewall (UFW)

```bash
# Enable UFW
sudo ufw enable

# Allow SSH
sudo ufw allow 22/tcp

# Allow Frontend
sudo ufw allow 5151/tcp

# Allow Backend API
sudo ufw allow 8156/tcp

# Check status
sudo ufw status
```

### 3. Setup Log Rotation

```bash
# Create log rotation config
sudo nano /etc/logrotate.d/cert-verification

# Add the following content:
/home/ubuntu/certificate-verification-system/backend/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 ubuntu ubuntu
    sharedscripts
}
```

### 4. Setup Automatic Backups

```bash
# Create backup script
nano ~/backup-db.sh

# Add the following content:
#!/bin/bash
BACKUP_DIR="/home/ubuntu/backups"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

docker-compose exec -T postgres pg_dump -U postgres cert_verification > $BACKUP_DIR/backup_$DATE.sql
find $BACKUP_DIR -name "backup_*.sql" -mtime +7 -delete

# Make executable
chmod +x ~/backup-db.sh

# Add to crontab (daily at 2 AM)
crontab -e
# Add: 0 2 * * * /home/ubuntu/backup-db.sh
```

---

## Verification

### 1. Check Service Health

```bash
# Check all containers
docker-compose ps

# Check backend logs
docker-compose logs backend

# Check frontend logs
docker-compose logs frontend

# Check database logs
docker-compose logs postgres
```

### 2. Test API Endpoints

```bash
# Test backend health endpoint
curl http://YOUR_EC2_PUBLIC_IP:8156/health

# Expected response:
# {"status":"ok","timestamp":"..."}

# Test API version endpoint
curl http://YOUR_EC2_PUBLIC_IP:8156/api/v1/health
```

### 3. Access Frontend

Open your browser and navigate to:
```
http://YOUR_EC2_PUBLIC_IP:5151
```

You should see the Certificate Verification System login page.

### 4. Test Complete Flow

1. **Register a new user**:
   - Navigate to: `http://YOUR_EC2_PUBLIC_IP:5151/register`
   - Create an account

2. **Login**:
   - Use credentials to login
   - Verify JWT token is stored

3. **Upload Certificate**:
   - Navigate to upload page
   - Upload a test certificate
   - Verify processing

4. **Check Verification**:
   - View verification results
   - Check confidence scores
   - Review evidence

---

## Troubleshooting

### Container Issues

```bash
# View all container logs
docker-compose logs

# View specific service logs
docker-compose logs backend
docker-compose logs frontend
docker-compose logs postgres

# Restart specific service
docker-compose restart backend

# Restart all services
docker-compose restart

# Stop all services
docker-compose down

# Start with fresh build
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

### Database Connection Issues

```bash
# Check database is running
docker-compose ps postgres

# Access database directly
docker-compose exec postgres psql -U postgres -d cert_verification

# Check database logs
docker-compose logs postgres

# Reset database (WARNING: Deletes all data)
docker-compose down -v
docker-compose up -d
docker-compose exec backend npm run migrate
```

### Port Conflicts

```bash
# Check if ports are in use
sudo netstat -tulpn | grep :5151
sudo netstat -tulpn | grep :8156

# Kill process using port (if needed)
sudo kill -9 $(sudo lsof -t -i:5151)
sudo kill -9 $(sudo lsof -t -i:8156)
```

### Permission Issues

```bash
# Fix log directory permissions
sudo chown -R ubuntu:ubuntu ~/certificate-verification-system/backend/logs

# Fix storage permissions
sudo chown -R ubuntu:ubuntu ~/certificate-verification-system/backend/storage
```

### Memory Issues

```bash
# Check memory usage
free -h

# Check Docker memory usage
docker stats

# Increase swap space if needed
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

---

## Maintenance

### Regular Updates

```bash
# Navigate to project directory
cd ~/certificate-verification-system

# Pull latest changes
git pull origin main

# Rebuild and restart
docker-compose down
docker-compose build
docker-compose up -d

# Run migrations if needed
docker-compose exec backend npm run migrate
```

### Monitoring

```bash
# Check disk usage
df -h

# Check Docker disk usage
docker system df

# Clean up unused Docker resources
docker system prune -a

# Monitor logs in real-time
docker-compose logs -f backend
```

### Backup and Restore

**Backup:**
```bash
# Backup database
docker-compose exec postgres pg_dump -U postgres cert_verification > backup.sql

# Backup environment file
cp .env .env.backup

# Backup uploaded files
tar -czf storage-backup.tar.gz backend/storage/
```

**Restore:**
```bash
# Restore database
docker-compose exec -T postgres psql -U postgres cert_verification < backup.sql

# Restore files
tar -xzf storage-backup.tar.gz
```

### SSL/HTTPS Setup (Optional but Recommended)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Install Nginx
sudo apt install nginx -y

# Configure Nginx as reverse proxy
sudo nano /etc/nginx/sites-available/cert-verification

# Add configuration:
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:5151;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api {
        proxy_pass http://localhost:8156;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

# Enable site
sudo ln -s /etc/nginx/sites-available/cert-verification /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com
```

---

## Quick Reference Commands

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f

# Restart services
docker-compose restart

# Check status
docker-compose ps

# Update application
git pull && docker-compose down && docker-compose build && docker-compose up -d

# Backup database
docker-compose exec postgres pg_dump -U postgres cert_verification > backup_$(date +%Y%m%d).sql

# Access backend shell
docker-compose exec backend sh

# Access database
docker-compose exec postgres psql -U postgres -d cert_verification
```

---

## Support and Resources

- **GitHub Repository**: https://github.com/your-username/certificate-verification-system
- **Documentation**: See project README.md
- **API Documentation**: See API_SPECIFICATION.md
- **Architecture**: See ARCHITECTURE.md

---

## Security Checklist

- [ ] Changed default database password
- [ ] Generated strong JWT secret (min 32 characters)
- [ ] Configured security group with minimal required ports
- [ ] Enabled UFW firewall
- [ ] Setup SSL/HTTPS (recommended)
- [ ] Regular backups configured
- [ ] Log rotation enabled
- [ ] Updated all system packages
- [ ] Restricted SSH access to specific IPs (recommended)
- [ ] Setup monitoring and alerts

---

## Production Checklist

- [ ] EC2 instance launched and configured
- [ ] Security groups properly configured
- [ ] Docker and Docker Compose installed
- [ ] Application cloned and environment configured
- [ ] Services running and healthy
- [ ] Database initialized and seeded
- [ ] Frontend accessible on port 5151
- [ ] Backend API accessible on port 8156
- [ ] Backups configured
- [ ] Monitoring setup
- [ ] SSL certificate installed (if using domain)
- [ ] Documentation reviewed

---

**Last Updated**: 2025-01-13
**Version**: 1.0.0