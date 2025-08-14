#!/bin/bash

# Music U Scheduler - One-Click Installation Script
# This script sets up the entire Music U Scheduler system from GitHub

set -e  # Exit on any error

echo "🎵 Music U Scheduler - One-Click Installation"
echo "=============================================="

# Configuration
INSTALL_DIR="/home/ubuntu/Music-U-Scheduler"
PYTHON_VERSION="3.11"
VENV_NAME="music-u-env"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check system requirements
check_requirements() {
    print_status "Checking system requirements..."
    
    # Check Python
    if ! command_exists python3; then
        print_error "Python 3 is not installed. Please install Python 3.11 or higher."
        exit 1
    fi
    
    # Check Python version
    PYTHON_VER=$(python3 -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')")
    if [[ $(echo "$PYTHON_VER < 3.8" | bc -l) -eq 1 ]]; then
        print_error "Python 3.8 or higher is required. Current version: $PYTHON_VER"
        exit 1
    fi
    
    # Check pip
    if ! command_exists pip3; then
        print_error "pip3 is not installed. Please install pip3."
        exit 1
    fi
    
    # Check git
    if ! command_exists git; then
        print_error "Git is not installed. Please install Git."
        exit 1
    fi
    
    print_success "System requirements check passed"
}

# Install system dependencies
install_system_deps() {
    print_status "Installing system dependencies..."
    
    if command_exists apt-get; then
        # Ubuntu/Debian
        sudo apt-get update
        sudo apt-get install -y python3-venv python3-dev libpq-dev build-essential
    elif command_exists yum; then
        # CentOS/RHEL
        sudo yum install -y python3-venv python3-devel postgresql-devel gcc
    elif command_exists brew; then
        # macOS
        brew install postgresql
    else
        print_warning "Could not detect package manager. Please install python3-venv and postgresql development headers manually."
    fi
    
    print_success "System dependencies installed"
}

# Setup repository (local installation)
setup_repository() {
    print_status "Setting up repository..."
    
    if [ -d "$INSTALL_DIR" ]; then
        print_status "Using existing local repository..."
        cd "$INSTALL_DIR"
    else
        print_error "Installation directory not found: $INSTALL_DIR"
        exit 1
    fi
    
    print_success "Repository setup complete"
}

# Setup Python virtual environment
setup_venv() {
    print_status "Setting up Python virtual environment..."
    
    cd "$INSTALL_DIR"
    
    if [ ! -d "$VENV_NAME" ]; then
        python3 -m venv "$VENV_NAME"
    fi
    
    source "$VENV_NAME/bin/activate"
    
    # Upgrade pip
    pip install --upgrade pip
    
    # Install requirements
    pip install -r requirements.txt
    
    print_success "Virtual environment setup complete"
}

# Setup database
setup_database() {
    print_status "Setting up database..."
    
    cd "$INSTALL_DIR"
    source "$VENV_NAME/bin/activate"
    
    # Create .env file if it doesn't exist
    if [ ! -f ".env" ]; then
        print_status "Creating .env file..."
        cat > .env << EOF
# Database Configuration
DATABASE_URL=sqlite:///./music_u_scheduler.db

# Security Configuration
SECRET_KEY=$(python3 -c "import secrets; print(secrets.token_urlsafe(32))")
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Application Configuration
DEBUG=False
ENVIRONMENT=production
EOF
        print_success ".env file created"
    fi
    
    # Run database migrations
    print_status "Running database migrations..."
    alembic upgrade head
    
    print_success "Database setup complete"
}

# Create admin user
create_admin_user() {
    print_status "Creating admin user..."
    
    cd "$INSTALL_DIR"
    source "$VENV_NAME/bin/activate"
    
    # Check if admin user already exists
    python3 -c "
import sys
sys.path.append('.')
from app.database import SessionLocal
from app.models import User
from app.auth.utils import get_password_hash

db = SessionLocal()
admin_exists = db.query(User).filter(User.email == 'admin@musicuscheduler.com').first()

if not admin_exists:
    admin_user = User(
        email='admin@musicuscheduler.com',
        username='admin',
        full_name='System Administrator',
        role='admin',
        is_active=True,
        hashed_password=get_password_hash('admin123')
    )
    db.add(admin_user)
    db.commit()
    print('Admin user created successfully')
    print('Email: admin@musicuscheduler.com')
    print('Password: admin123')
    print('Please change the password after first login!')
else:
    print('Admin user already exists')

db.close()
"
    
    print_success "Admin user setup complete"
}

# Create systemd service (optional)
create_service() {
    if [ "$1" = "--service" ]; then
        print_status "Creating systemd service..."
        
        sudo tee /etc/systemd/system/music-u-scheduler.service > /dev/null << EOF
[Unit]
Description=Music U Scheduler API
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$INSTALL_DIR
Environment=PATH=$INSTALL_DIR/$VENV_NAME/bin
ExecStart=$INSTALL_DIR/$VENV_NAME/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF
        
        sudo systemctl daemon-reload
        sudo systemctl enable music-u-scheduler
        
        print_success "Systemd service created and enabled"
    fi
}

# Start the application
start_application() {
    print_status "Starting Music U Scheduler..."
    
    cd "$INSTALL_DIR"
    source "$VENV_NAME/bin/activate"
    
    # Start the server in background
    nohup uvicorn app.main:app --host 0.0.0.0 --port 8000 > server.log 2>&1 &
    
    # Wait a moment for server to start
    sleep 3
    
    # Check if server is running
    if curl -s http://localhost:8000/ > /dev/null; then
        print_success "Music U Scheduler is running!"
        echo ""
        echo "🎉 Installation Complete!"
        echo "========================"
        echo "• Application URL: http://localhost:8000"
        echo "• API Documentation: http://localhost:8000/docs"
        echo "• Admin Login: admin@musicuscheduler.com / admin123"
        echo "• Server logs: $INSTALL_DIR/server.log"
        echo ""
        echo "To stop the server: pkill -f uvicorn"
        echo "To restart: cd $INSTALL_DIR && source $VENV_NAME/bin/activate && uvicorn app.main:app --host 0.0.0.0 --port 8000"
    else
        print_error "Failed to start the server. Check server.log for details."
        exit 1
    fi
}

# Main installation process
main() {
    echo ""
    print_status "Starting installation process..."
    echo ""
    
    check_requirements
    install_system_deps
    setup_repository
    setup_venv
    setup_database
    create_admin_user
    create_service "$1"
    start_application
    
    print_success "Installation completed successfully!"
}

# Help function
show_help() {
    echo "Music U Scheduler - One-Click Installation Script"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --service    Create and enable systemd service"
    echo "  --help       Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                    # Basic installation"
    echo "  $0 --service         # Install with systemd service"
    echo ""
}

# Parse command line arguments
case "$1" in
    --help)
        show_help
        exit 0
        ;;
    --service)
        main --service
        ;;
    "")
        main
        ;;
    *)
        print_error "Unknown option: $1"
        show_help
        exit 1
        ;;
esac
