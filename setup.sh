#!/bin/bash

# Certificate Verification Mock Demo - Setup Script (Linux/Mac)
# This script automates the setup process for the application

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_header() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check prerequisites
check_prerequisites() {
    print_header "Checking Prerequisites"
    
    local all_ok=true
    
    # Check Node.js
    if command_exists node; then
        NODE_VERSION=$(node -v)
        print_success "Node.js is installed: $NODE_VERSION"
        
        # Check if version is 18 or higher
        MAJOR_VERSION=$(echo $NODE_VERSION | cut -d'.' -f1 | sed 's/v//')
        if [ "$MAJOR_VERSION" -lt 18 ]; then
            print_warning "Node.js version should be 18 or higher"
            all_ok=false
        fi
    else
        print_error "Node.js is not installed"
        print_info "Please install Node.js 18+ from https://nodejs.org/"
        all_ok=false
    fi
    
    # Check npm
    if command_exists npm; then
        NPM_VERSION=$(npm -v)
        print_success "npm is installed: v$NPM_VERSION"
    else
        print_error "npm is not installed"
        all_ok=false
    fi
    
    # Check PostgreSQL
    if command_exists psql; then
        PSQL_VERSION=$(psql --version | awk '{print $3}')
        print_success "PostgreSQL is installed: v$PSQL_VERSION"
    else
        print_error "PostgreSQL is not installed"
        print_info "Please install PostgreSQL 14+ from https://www.postgresql.org/download/"
        all_ok=false
    fi
    
    # Check if PostgreSQL is running
    if command_exists pg_isready; then
        if pg_isready >/dev/null 2>&1; then
            print_success "PostgreSQL is running"
        else
            print_warning "PostgreSQL is not running"
            print_info "Please start PostgreSQL service"
        fi
    fi
    
    if [ "$all_ok" = false ]; then
        print_error "Some prerequisites are missing. Please install them and run this script again."
        exit 1
    fi
    
    print_success "All prerequisites are met!"
}

# Function to install dependencies
install_dependencies() {
    print_header "Installing Dependencies"
    
    # Backend dependencies
    print_info "Installing backend dependencies..."
    cd backend
    npm install
    print_success "Backend dependencies installed"
    
    # Frontend dependencies
    print_info "Installing frontend dependencies..."
    cd ../frontend
    npm install
    print_success "Frontend dependencies installed"
    
    cd ..
}

# Function to setup database
setup_database() {
    print_header "Setting Up Database"
    
    # Prompt for database credentials
    read -p "Enter PostgreSQL username (default: postgres): " DB_USER
    DB_USER=${DB_USER:-postgres}
    
    read -sp "Enter PostgreSQL password: " DB_PASSWORD
    echo ""
    
    read -p "Enter database name (default: cert_verification): " DB_NAME
    DB_NAME=${DB_NAME:-cert_verification}
    
    # Check if database exists
    print_info "Checking if database exists..."
    if PGPASSWORD=$DB_PASSWORD psql -U $DB_USER -lqt | cut -d \| -f 1 | grep -qw $DB_NAME; then
        print_warning "Database '$DB_NAME' already exists"
        read -p "Do you want to drop and recreate it? (y/N): " RECREATE
        if [ "$RECREATE" = "y" ] || [ "$RECREATE" = "Y" ]; then
            print_info "Dropping database..."
            PGPASSWORD=$DB_PASSWORD dropdb -U $DB_USER $DB_NAME
            print_info "Creating database..."
            PGPASSWORD=$DB_PASSWORD createdb -U $DB_USER $DB_NAME
            print_success "Database recreated"
        fi
    else
        print_info "Creating database..."
        PGPASSWORD=$DB_PASSWORD createdb -U $DB_USER $DB_NAME
        print_success "Database created"
    fi
    
    # Export credentials for later use
    export DB_USER DB_PASSWORD DB_NAME
}

# Function to create .env files
create_env_files() {
    print_header "Creating Environment Files"
    
    # Backend .env
    print_info "Creating backend .env file..."
    cd backend
    
    if [ -f .env ]; then
        print_warning ".env file already exists"
        read -p "Do you want to overwrite it? (y/N): " OVERWRITE
        if [ "$OVERWRITE" != "y" ] && [ "$OVERWRITE" != "Y" ]; then
            print_info "Skipping backend .env creation"
            cd ..
            return
        fi
    fi
    
    # Generate random JWT secret
    JWT_SECRET=$(openssl rand -base64 32)
    
    cat > .env << EOF
# Environment Configuration
NODE_ENV=development

# Server Configuration
PORT=3000

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD
DB_NAME=$DB_NAME

# JWT Configuration
JWT_SECRET=$JWT_SECRET
JWT_EXPIRES_IN=7d

# Security
BCRYPT_ROUNDS=10

# CORS
CORS_ORIGIN=http://localhost:5173

# Logging
LOG_LEVEL=debug
EOF
    
    print_success "Backend .env file created"
    
    # Frontend .env
    cd ../frontend
    print_info "Creating frontend .env file..."
    
    if [ -f .env ]; then
        print_warning ".env file already exists"
        read -p "Do you want to overwrite it? (y/N): " OVERWRITE
        if [ "$OVERWRITE" != "y" ] && [ "$OVERWRITE" != "Y" ]; then
            print_info "Skipping frontend .env creation"
            cd ..
            return
        fi
    fi
    
    cat > .env << EOF
# Frontend Configuration
VITE_API_URL=http://localhost:3000
EOF
    
    print_success "Frontend .env file created"
    cd ..
}

# Function to run migrations
run_migrations() {
    print_header "Running Database Migrations"
    
    cd backend
    print_info "Running migrations..."
    npm run migration:run
    print_success "Migrations completed"
    cd ..
}

# Function to seed database
seed_database() {
    print_header "Seeding Database"
    
    read -p "Do you want to seed the database with demo data? (Y/n): " SEED
    SEED=${SEED:-Y}
    
    if [ "$SEED" = "y" ] || [ "$SEED" = "Y" ]; then
        cd backend
        print_info "Seeding database..."
        npm run seed
        print_success "Database seeded successfully"
        cd ..
    else
        print_info "Skipping database seeding"
    fi
}

# Function to display completion message
display_completion() {
    print_header "Setup Complete!"
    
    echo ""
    echo -e "${GREEN}✓ Setup completed successfully!${NC}"
    echo ""
    echo -e "${BLUE}Next Steps:${NC}"
    echo ""
    echo "1. Start the backend server:"
    echo -e "   ${YELLOW}cd backend && npm run dev${NC}"
    echo ""
    echo "2. In a new terminal, start the frontend:"
    echo -e "   ${YELLOW}cd frontend && npm run dev${NC}"
    echo ""
    echo "3. Open your browser and navigate to:"
    echo -e "   ${YELLOW}http://localhost:5173${NC}"
    echo ""
    echo -e "${BLUE}Demo User Credentials:${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "  Admin:     admin@certverify.com     / Admin123!"
    echo "  Verifier:  verifier@certverify.com  / Verifier123!"
    echo "  API User:  user@certverify.com      / User123!"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo -e "${BLUE}Documentation:${NC}"
    echo "  • Quick Start Guide: QUICK_START.md"
    echo "  • Testing Guide: TESTING_GUIDE.md"
    echo "  • API Documentation: backend/API_ENDPOINTS.md"
    echo ""
}

# Main execution
main() {
    clear
    echo ""
    echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║                                                        ║${NC}"
    echo -e "${BLUE}║   Certificate Verification Mock Demo - Setup Script   ║${NC}"
    echo -e "${BLUE}║                                                        ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
    echo ""
    
    check_prerequisites
    install_dependencies
    setup_database
    create_env_files
    run_migrations
    seed_database
    display_completion
}

# Run main function
main