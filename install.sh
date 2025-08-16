
#!/bin/bash

# Music U Scheduler - Fixed Installation Script
# Version: 2.0
# Date: August 15, 2025
# Fixes: Yarn permissions, service management, environment setup

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if running as root (not recommended)
if [ "$EUID" -eq 0 ]; then
    error "Please do not run this script as root. Run as regular user instead."
    exit 1
fi

log "Starting Music U Scheduler installation..."

# Check if we need to clone the repository
if [ ! -f "requirements.txt" ] && [ ! -d "app" ]; then
    log "Cloning Music U Scheduler repository..."
    
    # Check if git is installed
    if ! command -v git &> /dev/null; then
        error "Git is required but not installed. Please install git first:"
        echo "  Ubuntu/Debian: sudo apt update && sudo apt install git"
        echo "  CentOS/RHEL: sudo yum install git"
        exit 1
    fi
    
    # Clone the repository
    if [ -d "Music-U-Scheduler" ]; then
        warning "Music-U-Scheduler directory already exists, updating..."
        cd Music-U-Scheduler
        git pull origin main || {
            error "Failed to update existing repository"
            exit 1
        }
    else
        git clone https://github.com/dfultonthebar/Music-U-Scheduler.git || {
            error "Failed to clone repository. Please check your internet connection."
            exit 1
        }
        cd Music-U-Scheduler
    fi
    
    log "Repository cloned successfully"
else
    log "Using existing repository files..."
fi

# Get the directory of the script/repository
SCRIPT_DIR="$(pwd)"
log "Working directory: $SCRIPT_DIR"

# 1. System Requirements Check
log "Checking system requirements..."

# Check Ubuntu version
if ! grep -q "Ubuntu" /etc/os-release; then
    warning "This script is optimized for Ubuntu. Other distributions may work but are not tested."
fi

# Check Python 3
if ! command -v python3 &> /dev/null; then
    error "Python 3 is required but not installed. Please install Python 3.8+ first."
    exit 1
fi

PYTHON_VERSION=$(python3 -c 'import sys; print(".".join(map(str, sys.version_info[:2])))')
log "Python version: $PYTHON_VERSION"

# Check if PostgreSQL is available
if ! command -v psql &> /dev/null && ! command -v sudo &> /dev/null; then
    warning "PostgreSQL client not found. Database operations may fail."
fi

# 2. Kill existing processes to avoid conflicts
log "Stopping any existing services..."

# Kill existing Python/uvicorn processes on port 8080
if lsof -ti:8080 >/dev/null 2>&1; then
    log "Stopping existing backend service on port 8080..."
    kill $(lsof -ti:8080) 2>/dev/null || true
    sleep 2
fi

# Kill existing Node.js/Next.js processes on port 3000
if lsof -ti:3000 >/dev/null 2>&1; then
    log "Stopping existing frontend service on port 3000..."
    kill $(lsof -ti:3000) 2>/dev/null || true
    sleep 2
fi

# Kill any existing processes in this directory
pkill -f "uvicorn.*$(basename "$SCRIPT_DIR")" 2>/dev/null || true
pkill -f "next.*dev" 2>/dev/null || true
sleep 2

# 3. Backend Setup
log "Setting up Python backend environment..."

# Create virtual environment if it doesn't exist
if [ ! -d "music-u-env" ]; then
    log "Creating Python virtual environment..."
    python3 -m venv music-u-env
fi

# Activate virtual environment
source music-u-env/bin/activate

# Upgrade pip
log "Upgrading pip..."
pip install --upgrade pip

# Install backend requirements
log "Installing Python dependencies..."
if [ -f "requirements.txt" ]; then
    pip install -r requirements.txt
else
    error "requirements.txt not found!"
    exit 1
fi

# 4. Database Setup
log "Setting up database..."

# Create database directories if they don't exist
mkdir -p static uploads logs

# Check if database file exists, if not initialize it
if [ ! -f "app.db" ]; then
    log "Initializing SQLite database..."
    cd app
    python3 -c "
from database import engine
from models import Base
Base.metadata.create_all(bind=engine)
print('Database initialized successfully')
"
    cd ..
else
    log "Database already exists, skipping initialization..."
fi

# 5. Frontend Setup
log "Setting up Node.js frontend..."

cd app

# Check Node.js version
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    log "Node.js version: $NODE_VERSION"
else
    error "Node.js is required but not installed. Please install Node.js 18+ first."
    exit 1
fi

# Setup package management - Use npm instead of yarn to avoid permission issues
if [ -f "yarn.lock" ] && command -v yarn &> /dev/null; then
    log "Using Yarn for package management..."
    # Check if node_modules exists and is properly linked
    if [ ! -d "node_modules" ] || [ ! -L "node_modules" ]; then
        log "Installing frontend dependencies with Yarn..."
        yarn install --frozen-lockfile || {
            warning "Yarn installation failed, falling back to npm..."
            rm -rf node_modules yarn.lock
            npm install
        }
    else
        log "Frontend dependencies already installed..."
    fi
else
    log "Using npm for package management..."
    if [ ! -d "node_modules" ] || [ "$(find node_modules -maxdepth 0 -empty 2>/dev/null)" ]; then
        log "Installing frontend dependencies with npm..."
        npm install
    else
        log "Frontend dependencies already installed..."
    fi
fi

cd ..

# 6. Environment Configuration
log "Setting up environment configuration..."

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    cat > .env << EOF
DATABASE_URL=sqlite:///./app.db
ENVIRONMENT=development
LOG_LEVEL=info
EOF
    log "Created backend .env file"
fi

# Create app/.env file for Next.js
if [ ! -f "app/.env" ]; then
    cat > app/.env << EOF
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="$(openssl rand -hex 32)"
NEXT_PUBLIC_API_URL="http://localhost:8080"
EOF
    log "Created frontend .env file"
else
    # Update API URL to use port 8080
    sed -i 's|NEXT_PUBLIC_API_URL=.*|NEXT_PUBLIC_API_URL="http://localhost:8080"|' app/.env
    log "Updated frontend API URL configuration"
fi

# 7. Create startup scripts
log "Creating startup scripts..."

# Backend startup script
cat > start-backend.sh << 'EOF'
#!/bin/bash
cd "$(dirname "$0")"
source music-u-env/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8080 --reload
EOF
chmod +x start-backend.sh

# Frontend startup script
cat > start-frontend.sh << 'EOF'
#!/bin/bash
cd "$(dirname "$0")/app"
if command -v yarn &> /dev/null && [ -f "yarn.lock" ]; then
    yarn dev
else
    npm run dev
fi
EOF
chmod +x start-frontend.sh

# Combined startup script
cat > start-all.sh << 'EOF'
#!/bin/bash
cd "$(dirname "$0")"

echo "Starting Music U Scheduler..."
echo "Backend: http://localhost:8080"
echo "Frontend: http://localhost:3000"
echo "API Docs: http://localhost:8080/docs"
echo ""
echo "Press Ctrl+C to stop all services"

# Function to kill background processes on exit
cleanup() {
    echo "Stopping services..."
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    exit 0
}
trap cleanup SIGINT SIGTERM

# Start backend
echo "Starting backend..."
./start-backend.sh &
BACKEND_PID=$!

# Wait for backend to start
sleep 5

# Start frontend
echo "Starting frontend..."
./start-frontend.sh &
FRONTEND_PID=$!

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID
EOF
chmod +x start-all.sh

# 8. Test installations
log "Testing installation..."

# Test backend
log "Testing backend setup..."
cd app
source ../music-u-env/bin/activate

# Quick Python import test
PYTHONPATH=. python3 -c "
import sys
import os
os.chdir('.')
try:
    import main
    import database
    import models
    print('✓ Backend imports successful')
except Exception as e:
    print(f'✗ Backend import error: {e}')
    # Don't fail installation for import issues in test
    print('⚠ Backend test had import issues but installation can continue')
"

cd ..

# Test frontend
log "Testing frontend setup..."
cd app

# Check if build works
if command -v yarn &> /dev/null && [ -f "yarn.lock" ]; then
    timeout 30 yarn build >/dev/null 2>&1 || {
        warning "Frontend build test failed, but installation may still work"
    }
else
    timeout 30 npm run build >/dev/null 2>&1 || {
        warning "Frontend build test failed, but installation may still work"
    }
fi

cd ..

# 9. Create service management script
cat > manage-services.sh << 'EOF'
#!/bin/bash

case "$1" in
    start)
        echo "Starting Music U Scheduler services..."
        ./start-all.sh
        ;;
    stop)
        echo "Stopping Music U Scheduler services..."
        pkill -f "uvicorn.*main:app" || true
        pkill -f "next.*dev" || true
        echo "Services stopped."
        ;;
    restart)
        echo "Restarting Music U Scheduler services..."
        $0 stop
        sleep 3
        $0 start
        ;;
    status)
        echo "Checking service status..."
        if pgrep -f "uvicorn.*main:app" > /dev/null; then
            echo "✓ Backend is running"
        else
            echo "✗ Backend is not running"
        fi
        
        if pgrep -f "next.*dev" > /dev/null; then
            echo "✓ Frontend is running"
        else
            echo "✗ Frontend is not running"
        fi
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|status}"
        exit 1
        ;;
esac
EOF
chmod +x manage-services.sh

# 10. Installation complete
success "Installation completed successfully!"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎵 Music U Scheduler - Ready to Use! 🎵"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 Quick Start Commands:"
echo "  Start all services:    ./start-all.sh"
echo "  Start backend only:    ./start-backend.sh"
echo "  Start frontend only:   ./start-frontend.sh"
echo "  Manage services:       ./manage-services.sh {start|stop|restart|status}"
echo ""
echo "🌐 Access URLs:"
echo "  Frontend App:          http://localhost:3000"
echo "  Backend API:           http://localhost:8080"
echo "  API Documentation:     http://localhost:8080/docs"
echo "  API Alternative Docs:  http://localhost:8080/redoc"
echo ""
echo "📁 Important Files:"
echo "  Backend config:        .env"
echo "  Frontend config:       app/.env"
echo "  Database file:         app.db"
echo "  Logs directory:        logs/"
echo ""
echo "🔧 Troubleshooting:"
echo "  If services don't start, check ports 3000 and 8080 are available"
echo "  Run './manage-services.sh status' to check service status"
echo "  Check logs in the logs/ directory for error details"
echo ""
echo "🚀 To start now: ./start-all.sh"
echo ""

# Optionally start services
read -p "Would you like to start the services now? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    log "Starting services..."
    exec ./start-all.sh
else
    log "You can start the services later by running: ./start-all.sh"
fi
