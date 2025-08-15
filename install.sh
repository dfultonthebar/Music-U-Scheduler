#!/bin/bash

# Music-U-Scheduler Clean Installation Script
# Version: 3.0.0 - Clean & Simple Edition
# Last Updated: August 2025

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="Music-U-Scheduler"
REPO_URL="https://github.com/dfultonthebar/Music-U-Scheduler.git"
INSTALL_DIR="$HOME/$PROJECT_NAME"
PYTHON_VERSION="3.11"
NODE_VERSION="22"

# Print functions
print_header() {
    echo -e "${PURPLE}"
    echo "======================================================"
    echo "    🎵 MUSIC-U-SCHEDULER INSTALLER v3.0.0 🎵"
    echo "        Clean & Simple Edition"
    echo "======================================================"
    echo -e "${NC}"
}

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

print_section() {
    echo -e "\n${CYAN}=== $1 ===${NC}"
}

# Helper function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to get OS information
detect_os() {
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        if command_exists lsb_release; then
            OS=$(lsb_release -is)
            VERSION=$(lsb_release -rs)
        elif [ -f /etc/os-release ]; then
            . /etc/os-release
            OS=$ID
            VERSION=$VERSION_ID
        else
            OS="Unknown Linux"
            VERSION="Unknown"
        fi
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        OS="macOS"
        VERSION=$(sw_vers -productVersion)
    else
        OS="Unknown"
        VERSION="Unknown"
    fi
    print_status "Detected OS: $OS $VERSION"
}

# Install system dependencies
install_system_dependencies() {
    print_section "Installing System Dependencies"
    
    if command_exists apt-get; then
        print_status "Using apt package manager..."
        sudo apt-get update
        sudo apt-get install -y curl wget git build-essential libssl-dev zlib1g-dev \
                               libbz2-dev libreadline-dev libsqlite3-dev python3-pip \
                               python3-venv postgresql postgresql-contrib nginx openssl \
                               software-properties-common ca-certificates gnupg lsb-release
    elif command_exists yum; then
        print_status "Using yum package manager..."
        sudo yum update -y
        sudo yum groupinstall -y "Development Tools"
        sudo yum install -y curl wget git openssl-devel bzip2-devel libffi-devel \
                           zlib-devel readline-devel sqlite-devel python3-pip \
                           python3-venv postgresql postgresql-server postgresql-contrib \
                           nginx openssl
    elif command_exists dnf; then
        print_status "Using dnf package manager..."
        sudo dnf update -y
        sudo dnf groupinstall -y "Development Tools"
        sudo dnf install -y curl wget git openssl-devel bzip2-devel libffi-devel \
                           zlib-devel readline-devel sqlite-devel python3-pip \
                           python3-venv postgresql postgresql-server postgresql-contrib \
                           nginx openssl
    else
        print_error "No supported package manager found!"
        exit 1
    fi
    
    print_success "System dependencies installed"
}

# Install Node.js and NPM
install_nodejs() {
    print_section "Installing Node.js and NPM"
    
    # Convert OS to lowercase for comparison
    OS_LOWER=$(echo "$OS" | tr '[:upper:]' '[:lower:]')
    
    # Install Node.js using NodeSource repository
    if [[ "$OS_LOWER" == "ubuntu" ]] || [[ "$OS_LOWER" == "debian" ]]; then
        print_status "Installing Node.js $NODE_VERSION via NodeSource..."
        curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | sudo -E bash -
        sudo apt-get install -y nodejs
    elif [[ "$OS_LOWER" == "centos" ]] || [[ "$OS_LOWER" == "rhel" ]] || [[ "$OS_LOWER" == "fedora" ]]; then
        print_status "Installing Node.js $NODE_VERSION via NodeSource..."
        curl -fsSL https://rpm.nodesource.com/setup_${NODE_VERSION}.x | sudo bash -
        if command_exists dnf; then
            sudo dnf install -y nodejs npm
        else
            sudo yum install -y nodejs npm
        fi
    else
        # Fallback: Install via NVM with proper environment setup
        print_status "Installing Node.js via NVM..."
        
        # Remove any existing NVM installation
        rm -rf "$HOME/.nvm"
        
        # Install NVM
        curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash
        
        # Source NVM properly
        export NVM_DIR="$HOME/.nvm"
        [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
        [ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"
        
        # Wait a moment for NVM to be fully loaded
        sleep 2
        
        # Check if NVM is available
        if ! command_exists nvm; then
            print_error "NVM installation failed. Trying alternative approach..."
            # Try to source from common locations
            [ -s "$HOME/.nvm/nvm.sh" ] && source "$HOME/.nvm/nvm.sh"
            [ -s "/usr/local/share/nvm/nvm.sh" ] && source "/usr/local/share/nvm/nvm.sh"
            
            if ! command_exists nvm; then
                print_error "Cannot load NVM. Please install Node.js manually."
                exit 1
            fi
        fi
        
        # Install and use Node.js
        nvm install $NODE_VERSION
        nvm use $NODE_VERSION
        nvm alias default $NODE_VERSION
        
        # Ensure node and npm are in PATH
        export PATH="$NVM_DIR/versions/node/v$(nvm version)/bin:$PATH"
    fi
    
    # Verify Node.js installation
    if command_exists node && command_exists npm; then
        print_success "Node.js $(node --version) and npm $(npm --version) installed successfully"
    else
        print_error "Node.js installation failed!"
        print_status "Attempting to fix PATH and retry..."
        
        # Try to add common Node.js paths
        export PATH="/usr/bin:$PATH"
        export PATH="$HOME/.nvm/versions/node/v$NODE_VERSION/bin:$PATH"
        
        if command_exists node && command_exists npm; then
            print_success "Node.js $(node --version) and npm $(npm --version) installed successfully"
        else
            print_error "Node.js installation failed completely!"
            exit 1
        fi
    fi
}

# Setup PostgreSQL
setup_postgresql() {
    print_section "Setting up PostgreSQL Database"
    
    # Start and enable PostgreSQL service
    if command_exists systemctl; then
        # Initialize database if needed (for CentOS/RHEL/Fedora)
        if [[ "$OS" == "centos" ]] || [[ "$OS" == "rhel" ]] || [[ "$OS" == "fedora" ]]; then
            if [ ! -d "/var/lib/pgsql/data" ] || [ -z "$(ls -A /var/lib/pgsql/data)" ]; then
                print_status "Initializing PostgreSQL database..."
                sudo postgresql-setup --initdb 2>/dev/null || sudo -u postgres initdb /var/lib/pgsql/data
            fi
        fi
        
        sudo systemctl start postgresql
        sudo systemctl enable postgresql
    fi
    
    # Wait for PostgreSQL to be ready
    sleep 3
    
    # Create database and user
    print_status "Creating database and user..."
    sudo -u postgres psql -c "CREATE DATABASE musicu;" 2>/dev/null || print_warning "Database musicu already exists"
    sudo -u postgres psql -c "CREATE USER musicuuser WITH PASSWORD 'musicupass';" 2>/dev/null || print_warning "User musicuuser already exists"
    sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE musicu TO musicuuser;"
    sudo -u postgres psql -c "ALTER USER musicuuser CREATEDB;"
    
    print_success "PostgreSQL database setup completed"
}

# Clone or update repository
clone_repository() {
    print_section "Cloning Repository"
    
    if [ -d "$INSTALL_DIR" ]; then
        print_status "Directory exists. Updating repository..."
        cd "$INSTALL_DIR"
        
        if [ -d ".git" ]; then
            git clean -fd
            git reset --hard HEAD
            git pull origin main
            print_success "Repository updated successfully"
        else
            print_warning "Directory exists but is not a git repository. Removing and re-cloning..."
            cd ..
            rm -rf "$INSTALL_DIR"
            git clone "$REPO_URL" "$INSTALL_DIR"
            cd "$INSTALL_DIR"
            print_success "Repository cloned successfully"
        fi
    else
        print_status "Cloning fresh repository..."
        git clone "$REPO_URL" "$INSTALL_DIR"
        cd "$INSTALL_DIR"
        print_success "Repository cloned successfully"
    fi
}

# Setup Python environment
setup_python_environment() {
    print_section "Setting up Python Environment"
    
    cd "$INSTALL_DIR"
    
    # Create virtual environment
    if [ -d "music-u-env" ]; then
        print_status "Removing existing virtual environment..."
        rm -rf music-u-env
    fi
    
    print_status "Creating new virtual environment..."
    python3 -m venv music-u-env
    
    # Activate virtual environment
    source music-u-env/bin/activate
    
    # Upgrade pip
    print_status "Upgrading pip..."
    pip install --upgrade pip
    
    # Install Python dependencies
    print_status "Installing Python dependencies..."
    pip install -r requirements.txt
    
    print_success "Python environment setup completed"
}

# Setup frontend (clean and simple)
setup_frontend() {
    print_section "Setting up Frontend"
    
    cd "$INSTALL_DIR/frontend"
    
    # Clean previous installations
    print_status "Cleaning previous installations..."
    rm -rf node_modules package-lock.json .next 2>/dev/null || true
    
    # Clear npm cache
    if command_exists npm; then
        npm cache clean --force 2>/dev/null || true
    fi
    
    # Install dependencies with npm (most reliable)
    print_status "Installing frontend dependencies with npm..."
    if npm install --legacy-peer-deps --no-audit --no-fund; then
        print_success "Frontend dependencies installed successfully"
    else
        print_error "Failed to install frontend dependencies"
        exit 1
    fi
    
    # Build the frontend
    print_status "Building frontend application..."
    if npm run build; then
        print_success "Frontend built successfully"
    else
        print_error "Frontend build failed"
        exit 1
    fi
    
    print_success "Frontend setup completed successfully"
}

# Initialize database
initialize_database() {
    print_section "Initializing Database"
    
    cd "$INSTALL_DIR"
    source music-u-env/bin/activate
    
    # Run database migrations
    print_status "Running database migrations..."
    alembic upgrade head
    
    # Create default admin user
    print_status "Creating default admin user..."
    python3 -c "
import sys
sys.path.append('.')
from app.database import SessionLocal
from app.auth.utils import hash_password
from app.models import User
import os

db = SessionLocal()
try:
    admin_user = db.query(User).filter(User.username == 'admin').first()
    if not admin_user:
        admin_user = User(
            username='admin',
            email='admin@musicu.local',
            hashed_password=hash_password('MusicU2025'),
            is_active=True,
            role='admin'
        )
        db.add(admin_user)
        db.commit()
        print('Default admin user created: admin/MusicU2025')
    else:
        print('Admin user already exists')
finally:
    db.close()
"
    
    print_success "Database initialization completed"
}

# Create launcher script
create_launcher() {
    print_section "Creating Launcher Script"
    
    tee "$INSTALL_DIR/start-musicu.sh" > /dev/null << 'LAUNCHER_EOF'
#!/bin/bash

# Music-U-Scheduler Simple Launcher
set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if PostgreSQL is running
if ! systemctl is-active --quiet postgresql; then
    print_status "Starting PostgreSQL..."
    sudo systemctl start postgresql
    sleep 3
fi

# Check directory
if [ ! -f "requirements.txt" ] || [ ! -d "frontend" ]; then
    print_error "Please run this script from the Music-U-Scheduler directory"
    exit 1
fi

# Kill any existing processes
sudo fuser -k 8000/tcp 3000/tcp 2>/dev/null || true
sleep 2

# Start backend
print_status "Starting backend on port 8000..."
source music-u-env/bin/activate
alembic upgrade head
nohup uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload > backend.log 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > .backend.pid

# Wait for backend
sleep 5

# Start frontend
print_status "Starting frontend on port 3000..."
cd frontend
nohup npm start > ../frontend.log 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > ../.frontend.pid

# Wait for frontend
sleep 5

echo ""
print_success "🎉 Music-U-Scheduler is now running!"
echo ""
echo -e "${GREEN}Access URLs:${NC}"
echo -e "  • Frontend: ${BLUE}http://localhost:3000${NC}"
echo -e "  • Backend API: ${BLUE}http://localhost:8000${NC}"
echo -e "  • API Docs: ${BLUE}http://localhost:8000/docs${NC}"
echo ""
echo -e "${GREEN}Default Admin Login:${NC}"
echo -e "  • Username: ${BLUE}admin${NC}"
echo -e "  • Password: ${BLUE}MusicU2025${NC}"
echo ""
LAUNCHER_EOF
    
    chmod +x "$INSTALL_DIR/start-musicu.sh"
    
    # Create stop script
    tee "$INSTALL_DIR/stop-musicu.sh" > /dev/null << 'STOP_EOF'
#!/bin/bash

print_status() {
    echo -e "\033[0;34m[INFO]\033[0m $1"
}

print_success() {
    echo -e "\033[0;32m[SUCCESS]\033[0m $1"
}

print_status "Stopping Music-U-Scheduler..."

# Kill processes
if [ -f ".backend.pid" ]; then
    kill $(cat .backend.pid) 2>/dev/null || true
    rm .backend.pid
fi

if [ -f ".frontend.pid" ]; then
    kill $(cat .frontend.pid) 2>/dev/null || true
    rm .frontend.pid
fi

sudo fuser -k 8000/tcp 3000/tcp 2>/dev/null || true

print_success "Services stopped"
STOP_EOF
    
    chmod +x "$INSTALL_DIR/stop-musicu.sh"
    
    print_success "Launcher scripts created"
}

# Final verification
verify_installation() {
    print_section "Verifying Installation"
    
    cd "$INSTALL_DIR"
    
    # Check Python environment
    if [ -d "music-u-env" ] && [ -f "music-u-env/bin/activate" ]; then
        print_success "✓ Python virtual environment is set up"
    else
        print_error "✗ Python virtual environment is missing"
        return 1
    fi
    
    # Check frontend dependencies
    if [ -d "frontend/node_modules" ]; then
        print_success "✓ Frontend dependencies are installed"
    else
        print_error "✗ Frontend dependencies are missing"
        return 1
    fi
    
    # Check database
    source music-u-env/bin/activate
    if python3 -c "from app.database import engine; engine.connect()" 2>/dev/null; then
        print_success "✓ Database connection is working"
    else
        print_error "✗ Database connection failed"
        return 1
    fi
    
    print_success "Installation verification completed"
    return 0
}

# Main installation function
main() {
    print_header
    
    # Check if running as root
    if [ "$EUID" -eq 0 ]; then
        print_error "Please don't run this script as root. It will use sudo when needed."
        exit 1
    fi
    
    # Detect OS
    detect_os
    
    # Run installation steps
    install_system_dependencies
    install_nodejs
    setup_postgresql
    clone_repository
    setup_python_environment
    setup_frontend
    initialize_database
    create_launcher
    
    # Verify installation
    if verify_installation; then
        print_success "🎉 Installation completed successfully!"
        echo ""
        echo -e "${GREEN}To start Music-U-Scheduler:${NC}"
        echo -e "  ${BLUE}cd $INSTALL_DIR${NC}"
        echo -e "  ${BLUE}./start-musicu.sh${NC}"
        echo ""
        echo -e "${GREEN}Default admin login:${NC}"
        echo -e "  Username: ${BLUE}admin${NC}"
        echo -e "  Password: ${BLUE}MusicU2025${NC}"
        echo ""
    else
        print_error "Installation verification failed!"
        exit 1
    fi
}

# Run main function
main "$@"
