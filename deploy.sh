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