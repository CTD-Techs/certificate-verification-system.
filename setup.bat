@echo off
setlocal enabledelayedexpansion

REM Certificate Verification Mock Demo - Setup Script (Windows)
REM This script automates the setup process for the application

title Certificate Verification Mock Demo - Setup

echo.
echo ========================================================
echo.
echo   Certificate Verification Mock Demo - Setup Script
echo.
echo ========================================================
echo.

REM Check Node.js
echo [INFO] Checking prerequisites...
echo.

where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed
    echo Please install Node.js 18+ from https://nodejs.org/
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
echo [OK] Node.js is installed: %NODE_VERSION%

REM Check npm
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] npm is not installed
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('npm -v') do set NPM_VERSION=%%i
echo [OK] npm is installed: v%NPM_VERSION%

REM Check PostgreSQL
where psql >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] PostgreSQL command line tools not found in PATH
    echo Please ensure PostgreSQL 14+ is installed
    echo Download from: https://www.postgresql.org/download/windows/
    echo.
    set /p CONTINUE="Continue anyway? (Y/N): "
    if /i "!CONTINUE!" NEQ "Y" exit /b 1
) else (
    for /f "tokens=3" %%i in ('psql --version') do set PSQL_VERSION=%%i
    echo [OK] PostgreSQL is installed: v!PSQL_VERSION!
)

echo.
echo [OK] Prerequisites check completed
echo.
pause

REM Install dependencies
echo.
echo ========================================================
echo   Installing Dependencies
echo ========================================================
echo.

echo [INFO] Installing backend dependencies...
cd backend
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to install backend dependencies
    pause
    exit /b 1
)
echo [OK] Backend dependencies installed
echo.

echo [INFO] Installing frontend dependencies...
cd ..\frontend
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to install frontend dependencies
    pause
    exit /b 1
)
echo [OK] Frontend dependencies installed
echo.

cd ..

REM Setup database
echo.
echo ========================================================
echo   Database Configuration
echo ========================================================
echo.

set /p DB_USER="Enter PostgreSQL username (default: postgres): "
if "%DB_USER%"=="" set DB_USER=postgres

set /p DB_PASSWORD="Enter PostgreSQL password: "
if "%DB_PASSWORD%"=="" (
    echo [ERROR] Password cannot be empty
    pause
    exit /b 1
)

set /p DB_NAME="Enter database name (default: cert_verification): "
if "%DB_NAME%"=="" set DB_NAME=cert_verification

echo.
echo [INFO] Creating database...

REM Create database using psql
set PGPASSWORD=%DB_PASSWORD%
psql -U %DB_USER% -c "CREATE DATABASE %DB_NAME%;" 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [OK] Database created successfully
) else (
    echo [WARNING] Database might already exist or creation failed
    set /p CONTINUE="Continue anyway? (Y/N): "
    if /i "!CONTINUE!" NEQ "Y" exit /b 1
)

REM Create backend .env file
echo.
echo ========================================================
echo   Creating Environment Files
echo ========================================================
echo.

echo [INFO] Creating backend .env file...
cd backend

if exist .env (
    echo [WARNING] .env file already exists
    set /p OVERWRITE="Do you want to overwrite it? (Y/N): "
    if /i "!OVERWRITE!" NEQ "Y" (
        echo [INFO] Skipping backend .env creation
        goto frontend_env
    )
)

REM Generate random JWT secret (simple version for Windows)
set JWT_SECRET=%RANDOM%%RANDOM%%RANDOM%%RANDOM%%RANDOM%%RANDOM%

(
echo # Environment Configuration
echo NODE_ENV=development
echo.
echo # Server Configuration
echo PORT=3000
echo.
echo # Database Configuration
echo DB_HOST=localhost
echo DB_PORT=5432
echo DB_USER=%DB_USER%
echo DB_PASSWORD=%DB_PASSWORD%
echo DB_NAME=%DB_NAME%
echo.
echo # JWT Configuration
echo JWT_SECRET=%JWT_SECRET%
echo JWT_EXPIRES_IN=7d
echo.
echo # Security
echo BCRYPT_ROUNDS=10
echo.
echo # CORS
echo CORS_ORIGIN=http://localhost:5173
echo.
echo # Logging
echo LOG_LEVEL=debug
) > .env

echo [OK] Backend .env file created

:frontend_env
cd ..\frontend
echo [INFO] Creating frontend .env file...

if exist .env (
    echo [WARNING] .env file already exists
    set /p OVERWRITE="Do you want to overwrite it? (Y/N): "
    if /i "!OVERWRITE!" NEQ "Y" (
        echo [INFO] Skipping frontend .env creation
        goto migrations
    )
)

(
echo # Frontend Configuration
echo VITE_API_URL=http://localhost:3000
) > .env

echo [OK] Frontend .env file created

:migrations
cd ..

REM Run migrations
echo.
echo ========================================================
echo   Running Database Migrations
echo ========================================================
echo.

cd backend
echo [INFO] Running migrations...
call npm run migration:run
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to run migrations
    pause
    exit /b 1
)
echo [OK] Migrations completed
cd ..

REM Seed database
echo.
echo ========================================================
echo   Seeding Database
echo ========================================================
echo.

set /p SEED="Do you want to seed the database with demo data? (Y/N): "
if /i "%SEED%"=="" set SEED=Y

if /i "%SEED%"=="Y" (
    cd backend
    echo [INFO] Seeding database...
    call npm run seed
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Failed to seed database
        pause
        exit /b 1
    )
    echo [OK] Database seeded successfully
    cd ..
) else (
    echo [INFO] Skipping database seeding
)

REM Display completion message
echo.
echo ========================================================
echo   Setup Complete!
echo ========================================================
echo.
echo [OK] Setup completed successfully!
echo.
echo Next Steps:
echo.
echo 1. Start the backend server:
echo    cd backend ^&^& npm run dev
echo.
echo 2. In a new terminal, start the frontend:
echo    cd frontend ^&^& npm run dev
echo.
echo 3. Open your browser and navigate to:
echo    http://localhost:5173
echo.
echo ========================================================
echo   Demo User Credentials
echo ========================================================
echo   Admin:     admin@certverify.com     / Admin123!
echo   Verifier:  verifier@certverify.com  / Verifier123!
echo   API User:  user@certverify.com      / User123!
echo ========================================================
echo.
echo Documentation:
echo   - Quick Start Guide: QUICK_START.md
echo   - Testing Guide: TESTING_GUIDE.md
echo   - API Documentation: backend\API_ENDPOINTS.md
echo.
echo Press any key to exit...
pause >nul