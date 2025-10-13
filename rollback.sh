#!/bin/bash

set -e

echo "======================================"
echo "Certificate Verification System"
echo "Rollback Script"
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

# Confirm rollback
echo -e "${YELLOW}WARNING: This will rollback to the previous version!${NC}"
read -p "Are you sure you want to continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    print_status "Rollback cancelled"
    exit 0
fi

# Stop containers
print_status "Stopping containers..."
docker-compose down

# Checkout previous version
if [ -d .git ]; then
    print_status "Reverting to previous Git version..."
    git checkout HEAD~1 || print_error "Git rollback failed"
else
    print_error "Not a Git repository. Manual rollback required."
    exit 1
fi

# Revert database migration
print_status "Reverting database migration..."
docker-compose run --rm backend npm run migrate:revert || print_warning "Migration revert failed or no migrations to revert"

# Rebuild images
print_status "Rebuilding images..."
docker-compose build

# Start services
print_status "Starting services..."
docker-compose up -d

# Wait for services
print_status "Waiting for services to start..."
sleep 10

# Check status
print_status "Checking container status..."
docker-compose ps

# Verify health
print_status "Verifying service health..."
sleep 5
curl -f http://localhost:8156/health || print_error "Backend health check failed"
curl -f http://localhost:5151 || print_error "Frontend health check failed"

echo ""
print_status "======================================"
print_status "Rollback completed"
print_status "======================================"
echo ""
print_status "Services are running on previous version"
print_status "Check logs with: docker-compose logs -f"
echo ""