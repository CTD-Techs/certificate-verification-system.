# Deployment Guide

## Overview

This document provides comprehensive deployment instructions and configurations for the Certificate Verification Mock Demo system. It covers local development, staging, and production deployment scenarios using Docker and Docker Compose.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Configuration](#environment-configuration)
3. [Local Development Setup](#local-development-setup)
4. [Docker Deployment](#docker-deployment)
5. [Production Deployment](#production-deployment)
6. [Monitoring & Maintenance](#monitoring--maintenance)
7. [Backup & Recovery](#backup--recovery)
8. [Troubleshooting](#troubleshooting)

## Prerequisites

### System Requirements

**Minimum Requirements**:
- CPU: 2 cores
- RAM: 4 GB
- Storage: 20 GB
- OS: Linux (Ubuntu 20.04+), macOS, or Windows with WSL2

**Recommended for Production**:
- CPU: 4 cores
- RAM: 8 GB
- Storage: 50 GB SSD
- OS: Linux (Ubuntu 22.04 LTS)

### Software Requirements

```bash
# Required
- Docker 24.x or later
- Docker Compose 2.x or later
- Node.js 20 LTS (for local development)
- Git

# Optional
- Make (for convenience scripts)
- nginx (for reverse proxy in production)
```

### Installation

**Docker & Docker Compose**:
```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker --version
docker-compose --version
```

**Node.js (for local development)**:
```bash
# Using nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 20
nvm use 20
```

## Environment Configuration

### Environment Files

Create environment files for each environment:

#### `.env.development`
```env
# Application
NODE_ENV=development
API_PORT=3001
FRONTEND_PORT=3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=cert_verification_dev
DB_USER=postgres
DB_PASSWORD=postgres123

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT
JWT_SECRET=dev-secret-change-in-production-min-32-chars
JWT_EXPIRES_IN=24h

# Encryption
ENCRYPTION_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef

# File Storage
STORAGE_TYPE=local
STORAGE_PATH=./storage

# Mock Services
MOCK_MODE=true
MOCK_SUCCESS_RATE=0.95
MOCK_RESPONSE_DELAY_MIN=500
MOCK_RESPONSE_DELAY_MAX=2000

# Logging
LOG_LEVEL=debug
LOG_FILE_PATH=./logs

# CORS
CORS_ORIGIN=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# Email (Mock)
EMAIL_FROM=noreply@example.com
EMAIL_MOCK_MODE=true
```

#### `.env.production`
```env
# Application
NODE_ENV=production
API_PORT=3001
FRONTEND_PORT=80

# Database (use secrets manager in production)
DB_HOST=postgres
DB_PORT=5432
DB_NAME=cert_verification_prod
DB_USER=cert_user
DB_PASSWORD=${DB_PASSWORD_SECRET}

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=${REDIS_PASSWORD_SECRET}

# JWT (use secrets manager)
JWT_SECRET=${JWT_SECRET_FROM_SECRETS_MANAGER}
JWT_EXPIRES_IN=24h

# Encryption (use secrets manager)
ENCRYPTION_KEY=${ENCRYPTION_KEY_FROM_SECRETS_MANAGER}

# File Storage
STORAGE_TYPE=minio
STORAGE_ENDPOINT=minio:9000
STORAGE_ACCESS_KEY=${MINIO_ACCESS_KEY}
STORAGE_SECRET_KEY=${MINIO_SECRET_KEY}
STORAGE_BUCKET=certificates

# Mock Services
MOCK_MODE=true
MOCK_SUCCESS_RATE=0.95

# Logging
LOG_LEVEL=info
LOG_FILE_PATH=/var/log/app

# CORS
CORS_ORIGIN=https://yourdomain.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# Email
EMAIL_FROM=noreply@yourdomain.com
EMAIL_MOCK_MODE=true
```

### Secrets Management

**For Production, use a secrets manager**:

```bash
# AWS Secrets Manager
aws secretsmanager create-secret \
  --name cert-verification/jwt-secret \
  --secret-string "your-super-secret-jwt-key"

# Docker Secrets
echo "your-super-secret-jwt-key" | docker secret create jwt_secret -

# Environment variable from secret
export JWT_SECRET=$(aws secretsmanager get-secret-value \
  --secret-id cert-verification/jwt-secret \
  --query SecretString \
  --output text)
```

## Local Development Setup

### Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/yourusername/certificate-verification-mock.git
cd certificate-verification-mock

# 2. Copy environment files
cp .env.example .env.development

# 3. Install dependencies
cd backend && npm install
cd ../frontend && npm install

# 4. Start PostgreSQL and Redis (using Docker)
docker-compose -f docker-compose.dev.yml up -d postgres redis

# 5. Run database migrations
cd backend
npm run migration:run

# 6. Seed database with test data
npm run seed

# 7. Start backend
npm run dev

# 8. In a new terminal, start frontend
cd frontend
npm run dev
```

### Development Docker Compose

**`docker-compose.dev.yml`**:
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: cert-verification-db-dev
    environment:
      POSTGRES_DB: cert_verification_dev
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres123
    ports:
      - "5432:5432"
    volumes:
      - postgres_data_dev:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: cert-verification-redis-dev
    ports:
      - "6379:6379"
    volumes:
      - redis_data_dev:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data_dev:
  redis_data_dev:
```

## Docker Deployment

### Production Docker Compose

**`docker-compose.yml`**:
```yaml
version: '3.8'

services:
  # PostgreSQL Database
  postgres:
    image: postgres:15-alpine
    container_name: cert-verification-db
    restart: unless-stopped
    environment:
      POSTGRES_DB: ${DB_NAME}
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./docker/postgres/init.sql:/docker-entrypoint-initdb.d/init.sql
    networks:
      - backend
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER}"]
      interval: 30s
      timeout: 10s
      retries: 5
    security_opt:
      - no-new-privileges:true

  # Redis Cache
  redis:
    image: redis:7-alpine
    container_name: cert-verification-redis
    restart: unless-stopped
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    networks:
      - backend
    healthcheck:
      test: ["CMD", "redis-cli", "--raw", "incr", "ping"]
      interval: 30s
      timeout: 10s
      retries: 5
    security_opt:
      - no-new-privileges:true

  # Backend API
  api:
    build:
      context: ./backend
      dockerfile: Dockerfile
      args:
        NODE_ENV: production
    container_name: cert-verification-api
    restart: unless-stopped
    env_file:
      - .env.production
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    volumes:
      - ./storage:/app/storage
      - ./logs:/app/logs
    networks:
      - backend
      - frontend
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/api/v1/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    security_opt:
      - no-new-privileges:true
    read_only: true
    tmpfs:
      - /tmp

  # Frontend
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      args:
        VITE_API_BASE_URL: ${API_BASE_URL}
    container_name: cert-verification-frontend
    restart: unless-stopped
    depends_on:
      - api
    networks:
      - frontend
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:80"]
      interval: 30s
      timeout: 10s
      retries: 3
    security_opt:
      - no-new-privileges:true

  # Nginx Reverse Proxy
  nginx:
    image: nginx:alpine
    container_name: cert-verification-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./docker/nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./docker/nginx/ssl:/etc/nginx/ssl:ro
    depends_on:
      - frontend
      - api
    networks:
      - frontend
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    security_opt:
      - no-new-privileges:true

  # MinIO (S3-compatible storage)
  minio:
    image: minio/minio:latest
    container_name: cert-verification-minio
    restart: unless-stopped
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: ${MINIO_ACCESS_KEY}
      MINIO_ROOT_PASSWORD: ${MINIO_SECRET_KEY}
    volumes:
      - minio_data:/data
    networks:
      - backend
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
      interval: 30s
      timeout: 10s
      retries: 3
    security_opt:
      - no-new-privileges:true

networks:
  frontend:
    driver: bridge
  backend:
    driver: bridge

volumes:
  postgres_data:
  redis_data:
  minio_data:
```

### Dockerfiles

#### Backend Dockerfile

**`backend/Dockerfile`**:
```dockerfile
# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && \
    npm cache clean --force

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Production stage
FROM node:20-alpine

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copy built application
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./

# Create directories for logs and storage
RUN mkdir -p /app/logs /app/storage && \
    chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/api/v1/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start application
CMD ["node", "dist/server.js"]
```

#### Frontend Dockerfile

**`frontend/Dockerfile`**:
```dockerfile
# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci && \
    npm cache clean --force

# Copy source code
COPY . .

# Build application
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

RUN npm run build

# Production stage
FROM nginx:alpine

# Copy custom nginx config
COPY docker/nginx/frontend.conf /etc/nginx/conf.d/default.conf

# Copy built application
COPY --from=builder /app/dist /usr/share/nginx/html

# Create non-root user
RUN addgroup -g 1001 -S nginx && \
    adduser -S nginx -u 1001 && \
    chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid

USER nginx

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
```

### Nginx Configuration

**`docker/nginx/nginx.conf`**:
```nginx
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;

    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    client_max_body_size 10M;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript 
               application/json application/javascript application/xml+rss;

    # Security headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=general_limit:10m rate=100r/s;

    # Upstream servers
    upstream api_backend {
        server api:3001;
    }

    upstream frontend_backend {
        server frontend:80;
    }

    # HTTP server (redirect to HTTPS in production)
    server {
        listen 80;
        server_name _;

        # Health check endpoint
        location /health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }

        # Redirect to HTTPS (uncomment in production)
        # return 301 https://$server_name$request_uri;

        # API proxy
        location /api/ {
            limit_req zone=api_limit burst=20 nodelay;
            
            proxy_pass http://api_backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
            
            # Timeouts
            proxy_connect_timeout 60s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;
        }

        # Frontend proxy
        location / {
            limit_req zone=general_limit burst=50 nodelay;
            
            proxy_pass http://frontend_backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }
    }

    # HTTPS server (uncomment and configure for production)
    # server {
    #     listen 443 ssl http2;
    #     server_name yourdomain.com;
    #
    #     ssl_certificate /etc/nginx/ssl/cert.pem;
    #     ssl_certificate_key /etc/nginx/ssl/key.pem;
    #     ssl_protocols TLSv1.2 TLSv1.3;
    #     ssl_ciphers HIGH:!aNULL:!MD5;
    #     ssl_prefer_server_ciphers on;
    #
    #     # ... rest of configuration same as HTTP
    # }
}
```

## Production Deployment

### Deployment Steps

```bash
# 1. Clone repository on production server
git clone https://github.com/yourusername/certificate-verification-mock.git
cd certificate-verification-mock

# 2. Create production environment file
cp .env.example .env.production
# Edit .env.production with production values

# 3. Generate secrets
openssl rand -hex 32  # For JWT_SECRET
openssl rand -hex 32  # For ENCRYPTION_KEY

# 4. Build and start services
docker-compose up -d

# 5. Check service status
docker-compose ps

# 6. View logs
docker-compose logs -f

# 7. Run database migrations
docker-compose exec api npm run migration:run

# 8. Create admin user
docker-compose exec api npm run create-admin

# 9. Verify deployment
curl http://localhost/api/v1/health
```

### SSL/TLS Setup

```bash
# Using Let's Encrypt with Certbot
sudo apt-get install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal (add to crontab)
0 0 * * * certbot renew --quiet
```

### Deployment Script

**`scripts/deploy.sh`**:
```bash
#!/bin/bash

set -e

echo "Starting deployment..."

# Pull latest code
git pull origin main

# Build images
docker-compose build --no-cache

# Stop old containers
docker-compose down

# Start new containers
docker-compose up -d

# Run migrations
docker-compose exec -T api npm run migration:run

# Health check
sleep 10
curl -f http://localhost/api/v1/health || exit 1

echo "Deployment completed successfully!"
```

## Monitoring & Maintenance

### Health Checks

```bash
# Check all services
docker-compose ps

# Check API health
curl http://localhost/api/v1/health

# Check detailed health
curl http://localhost/api/v1/health/detailed
```

### Log Management

```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f api

# View last 100 lines
docker-compose logs --tail=100 api

# Export logs
docker-compose logs --no-color > logs.txt
```

### Database Maintenance

```bash
# Backup database
docker-compose exec postgres pg_dump -U cert_user cert_verification_prod > backup.sql

# Restore database
docker-compose exec -T postgres psql -U cert_user cert_verification_prod < backup.sql

# Vacuum database
docker-compose exec postgres psql -U cert_user -d cert_verification_prod -c "VACUUM ANALYZE;"
```

## Backup & Recovery

### Automated Backup Script

**`scripts/backup.sh`**:
```bash
#!/bin/bash

BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Backup database
docker-compose exec -T postgres pg_dump -U cert_user cert_verification_prod | \
  gzip > "$BACKUP_DIR/db_backup_$DATE.sql.gz"

# Backup storage
tar -czf "$BACKUP_DIR/storage_backup_$DATE.tar.gz" ./storage

# Keep only last 7 days of backups
find "$BACKUP_DIR" -name "*.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
```

### Recovery Procedure

```bash
# 1. Stop services
docker-compose down

# 2. Restore database
gunzip < backup.sql.gz | docker-compose exec -T postgres psql -U cert_user cert_verification_prod

# 3. Restore storage
tar -xzf storage_backup.tar.gz

# 4. Start services
docker-compose up -d
```

## Troubleshooting

### Common Issues

**Issue: Container won't start**
```bash
# Check logs
docker-compose logs api

# Check container status
docker-compose ps

# Restart container
docker-compose restart api
```

**Issue: Database connection failed**
```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# Check PostgreSQL logs
docker-compose logs postgres

# Test connection
docker-compose exec postgres psql -U cert_user -d cert_verification_prod -c "SELECT 1;"
```

**Issue: Out of disk space**
```bash
# Check disk usage
df -h

# Clean up Docker
docker system prune -a --volumes

# Remove old images
docker image prune -a
```

### Performance Tuning

**PostgreSQL**:
```sql
-- Increase connection pool
ALTER SYSTEM SET max_connections = 200;

-- Tune shared buffers
ALTER SYSTEM SET shared_buffers = '2GB';

-- Reload configuration
SELECT pg_reload_conf();
```

**Redis**:
```bash
# Increase max memory
docker-compose exec redis redis-cli CONFIG SET maxmemory 2gb
docker-compose exec redis redis-cli CONFIG SET maxmemory-policy allkeys-lru
```

---

**Document Version**: 1.0  
**Last Updated**: 2025-10-10  
**Status**: Draft for Review