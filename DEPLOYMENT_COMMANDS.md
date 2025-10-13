# Quick Deployment Commands Reference

Essential commands for deploying and managing the Certificate Verification System with Docker.

## Initial Setup

```bash
# 1. Connect to EC2
ssh -i your-key.pem ec2-user@your-ec2-ip

# 2. Clone repository
git clone https://github.com/your-org/certificate-verification-system.git
cd certificate-verification-system

# 3. Configure environment
cp .env.docker .env
nano .env  # Edit with your values

# 4. Make scripts executable
chmod +x deploy.sh rollback.sh
```

## Deployment

### Automated Deployment

```bash
# Run deployment script
./deploy.sh
```

### Manual Deployment

```bash
# Stop existing containers
docker-compose down

# Build images
docker-compose build --no-cache

# Run migrations
docker-compose run --rm backend npm run migrate

# Seed database (first time only)
docker-compose run --rm backend npm run seed

# Start services
docker-compose up -d

# Check status
docker-compose ps
```

## Verification

```bash
# Check container status
docker-compose ps

# Check backend health
curl http://localhost:8156/health

# Check frontend
curl http://localhost:5151

# View logs
docker-compose logs -f
```

## Database Operations

```bash
# Run migrations
docker-compose run --rm backend npm run migrate

# Check migration status
docker-compose run --rm backend npm run migrate:status

# Revert last migration
docker-compose run --rm backend npm run migrate:revert

# Seed database
docker-compose run --rm backend npm run seed
```

## Service Management

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# Restart services
docker-compose restart

# Restart specific service
docker-compose restart backend
docker-compose restart frontend

# View service status
docker-compose ps

# View resource usage
docker stats
```

## Logs and Debugging

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

# Execute commands in container
docker-compose exec backend sh
docker-compose exec backend npm run migrate:status
```

## Updates

```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker-compose build
docker-compose up -d

# Run new migrations
docker-compose run --rm backend npm run migrate
```

## Rollback

```bash
# Automated rollback
./rollback.sh

# Manual rollback
docker-compose down
git checkout HEAD~1
docker-compose run --rm backend npm run migrate:revert
docker-compose build
docker-compose up -d
```

## Cleanup

```bash
# Remove stopped containers
docker-compose rm -f

# Remove unused images
docker image prune -a

# Remove unused volumes
docker volume prune

# Complete cleanup (CAUTION!)
docker system prune -a --volumes
```

## Troubleshooting

```bash
# Check container logs for errors
docker-compose logs backend | grep -i error
docker-compose logs frontend | grep -i error

# Restart Docker daemon
sudo systemctl restart docker

# Check port usage
sudo netstat -tulpn | grep -E ':(3000|5151|8156|6379)'

# Test database connection
docker-compose exec backend node -e "
const { Sequelize } = require('sequelize');
const config = require('./dist/config').default;
const sequelize = new Sequelize(config.database);
sequelize.authenticate()
  .then(() => console.log('Connected'))
  .catch(err => console.error('Failed:', err));
"

# View container details
docker inspect cert-verify-backend
docker inspect cert-verify-frontend
```

## Environment Variables

### Required Variables

```bash
# Database (AWS RDS)
DB_HOST=your-rds-endpoint.region.rds.amazonaws.com
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_secure_password
DB_NAME=cert_verification

# JWT Secret (generate with: openssl rand -base64 32)
JWT_SECRET=your_secure_jwt_secret_min_32_chars

# CORS (your EC2 public IP)
CORS_ORIGIN=http://your-ec2-ip:5151

# Frontend API URLs
VITE_API_URL=http://your-ec2-ip:8156
VITE_API_BASE_URL=http://your-ec2-ip:8156/api/v1

# AWS Credentials
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_S3_BUCKET=certificate-verification-documents
```

## Service URLs

After deployment, access services at:

- **Frontend**: `http://your-ec2-ip:5151`
- **Backend API**: `http://your-ec2-ip:8156`
- **API Documentation**: `http://your-ec2-ip:8156/api-docs`
- **Health Check**: `http://your-ec2-ip:8156/health`

## Common Issues

### Port Already in Use

```bash
# Find process using port
sudo lsof -i :8156
sudo lsof -i :5151

# Kill process
sudo kill -9 <PID>
```

### Database Connection Failed

```bash
# Test RDS connection
docker run --rm -it postgres:14-alpine psql -h $DB_HOST -U $DB_USER -d $DB_NAME

# Check security groups in AWS Console
# Ensure EC2 can access RDS on port 5432
```

### Container Keeps Restarting

```bash
# Check logs for errors
docker-compose logs backend

# Check environment variables
docker-compose config

# Verify .env file
cat .env
```

### Out of Memory

```bash
# Check memory usage
docker stats

# Add swap space
sudo dd if=/dev/zero of=/swapfile bs=1M count=2048
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

## Backup and Restore

### Backup Database

```bash
# Create backup
docker-compose exec backend pg_dump -h $DB_HOST -U $DB_USER $DB_NAME > backup_$(date +%Y%m%d_%H%M%S).sql

# Or use AWS RDS automated backups
```

### Restore Database

```bash
# Restore from backup
docker-compose exec -T backend psql -h $DB_HOST -U $DB_USER $DB_NAME < backup_file.sql
```

## Security Checklist

- [ ] Strong JWT secret configured (min 32 characters)
- [ ] Strong database password set
- [ ] CORS origin set to production domain
- [ ] AWS credentials configured
- [ ] EC2 security group configured (ports 22, 80, 443, 5151, 8156)
- [ ] RDS security group allows EC2 access on port 5432
- [ ] SSL certificates installed (if using HTTPS)
- [ ] Firewall rules configured
- [ ] Log rotation enabled

## Monitoring

```bash
# Check service health
curl http://localhost:8156/health
curl http://localhost:5151

# Monitor resource usage
docker stats

# View application logs
tail -f backend/logs/app.log
tail -f backend/logs/error.log

# Check container health
docker inspect cert-verify-backend | grep -A 10 Health
docker inspect cert-verify-frontend | grep -A 10 Health
```

## Support

For detailed instructions, see [`DOCKER_DEPLOYMENT.md`](DOCKER_DEPLOYMENT.md)

For AWS setup, see [`AWS_SETUP_GUIDE.md`](AWS_SETUP_GUIDE.md)

For EC2 deployment, see [`DEPLOY_EC2_RDS.md`](DEPLOY_EC2_RDS.md)