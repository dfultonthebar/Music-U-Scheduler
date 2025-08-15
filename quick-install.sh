
#!/bin/bash

# Music-U-Scheduler Quick Install Script
# Version: 3.0.0 - Clean Edition
# This script performs a complete fresh installation

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

# Configuration
REPO_URL="https://github.com/dfultonthebar/Music-U-Scheduler.git"
INSTALL_DIR="$HOME/Music-U-Scheduler"
PYTHON_VERSION="3.11"
NODE_VERSION="20"

# Print functions
print_header() {
    echo -e "${PURPLE}"
    echo "════════════════════════════════════════════════════════"
    echo "    🎵 MUSIC-U-SCHEDULER QUICK INSTALLER v3.0.0 🎵"
    echo "             One-Command Fresh Installation"
    echo "════════════════════════════════════════════════════════"
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
    echo -e "\n${CYAN}═══ $1 ═══${NC}"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Detect operating system
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
        sudo apt-get install -y curl wget git build-essential python3-pip python3-venv \
                               postgresql postgresql-contrib nginx openssl unzip
        print_success "System dependencies installed"
    elif command_exists yum; then
        print_status "Using yum package manager..."
        sudo yum update -y
        sudo yum groupinstall -y "Development Tools"
        sudo yum install -y curl wget git python3 python3-pip postgresql-server \
                            postgresql-contrib nginx openssl unzip
        print_success "System dependencies installed"
    elif command_exists brew; then
        print_status "Using Homebrew package manager..."
        brew update
        brew install curl wget git python3 postgresql nginx openssl
        print_success "System dependencies installed"
    else
        print_error "No supported package manager found"
        exit 1
    fi
}

# Install Node.js
install_nodejs() {
    print_section "Installing Node.js $NODE_VERSION"
    
    if command_exists node; then
        NODE_CURRENT=$(node -v | sed 's/v//')
        if [[ "$NODE_CURRENT" =~ ^20\. ]]; then
            print_success "Node.js $NODE_CURRENT already installed"
            return
        fi
    fi
    
    # Install using NodeSource repository
    if command_exists apt-get; then
        curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
        sudo apt-get install -y nodejs
    elif command_exists yum; then
        curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
        sudo yum install -y nodejs
    elif command_exists brew; then
        brew install node@20
        brew link node@20 --force
    else
        # Fallback: install using NVM
        curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
        export NVM_DIR="$HOME/.nvm"
        [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
        nvm install 20
        nvm use 20
        nvm alias default 20
    fi
    
    print_success "Node.js $(node -v) installed"
    
    # Install Yarn
    npm install -g yarn
    print_success "Yarn $(yarn -v) installed"
}

# Setup PostgreSQL
setup_postgresql() {
    print_section "Setting up PostgreSQL Database"
    
    # Start PostgreSQL service
    if command_exists systemctl; then
        sudo systemctl start postgresql
        sudo systemctl enable postgresql
    elif command_exists service; then
        sudo service postgresql start
    elif command_exists brew; then
        brew services start postgresql
    fi
    
    # Create database and user
    print_status "Creating database and user..."
    
    if command_exists sudo; then
        sudo -u postgres psql -c "CREATE DATABASE IF NOT EXISTS musicu_scheduler;"
        sudo -u postgres psql -c "CREATE USER IF NOT EXISTS musicu_user WITH ENCRYPTED PASSWORD 'musicu_pass_2025';"
        sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE musicu_scheduler TO musicu_user;"
        sudo -u postgres psql -c "ALTER USER musicu_user CREATEDB;"
    else
        psql -U postgres -c "CREATE DATABASE IF NOT EXISTS musicu_scheduler;"
        psql -U postgres -c "CREATE USER IF NOT EXISTS musicu_user WITH ENCRYPTED PASSWORD 'musicu_pass_2025';"
        psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE musicu_scheduler TO musicu_user;"
        psql -U postgres -c "ALTER USER musicu_user CREATEDB;"
    fi
    
    print_success "PostgreSQL database setup complete"
}

# Clone repository
clone_repository() {
    print_section "Cloning Music-U-Scheduler Repository"
    
    if [ -d "$INSTALL_DIR" ]; then
        print_warning "Installation directory exists. Removing old installation..."
        rm -rf "$INSTALL_DIR"
    fi
    
    print_status "Cloning from $REPO_URL..."
    git clone "$REPO_URL" "$INSTALL_DIR"
    cd "$INSTALL_DIR"
    
    print_success "Repository cloned to $INSTALL_DIR"
}

# Setup Python backend
setup_backend() {
    print_section "Setting up FastAPI Backend"
    
    cd "$INSTALL_DIR"
    
    # Create Python virtual environment
    print_status "Creating Python virtual environment..."
    python3 -m venv music-u-env
    source music-u-env/bin/activate
    
    # Upgrade pip
    pip install --upgrade pip
    
    # Install Python dependencies
    print_status "Installing Python dependencies..."
    pip install -r requirements.txt
    
    # Create environment file
    print_status "Creating backend environment configuration..."
    cat > .env << EOF
DATABASE_URL=postgresql://musicu_user:musicu_pass_2025@localhost/musicu_scheduler
SECRET_KEY=$(openssl rand -hex 32)
JWT_SECRET=$(openssl rand -hex 32)
CORS_ORIGINS=["http://localhost:3000"]
DEBUG=True
EOF
    
    print_success "Backend setup complete"
}

# Setup Node.js frontend
setup_frontend() {
    print_section "Setting up Next.js Frontend"
    
    cd "$INSTALL_DIR/app"
    
    # Install dependencies
    print_status "Installing Node.js dependencies..."
    yarn install --silent
    
    # Create environment file
    print_status "Creating frontend environment configuration..."
    cat > .env.local << EOF
NEXT_PUBLIC_API_URL=http://localhost:8001
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=$(openssl rand -base64 32)
EOF
    
    # Build frontend
    print_status "Building frontend application..."
    yarn build
    
    print_success "Frontend setup complete"
}

# Run database migrations
run_migrations() {
    print_section "Running Database Migrations"
    
    cd "$INSTALL_DIR"
    source music-u-env/bin/activate
    
    # Run Alembic migrations
    print_status "Running database migrations..."
    alembic upgrade head
    
    print_success "Database migrations complete"
}

# Create startup scripts
create_startup_scripts() {
    print_section "Creating Application Scripts"
    
    cd "$INSTALL_DIR"
    
    # Create start script
    cat > start-app.sh << 'EOF'
#!/bin/bash

# Music-U-Scheduler Application Starter
cd "$(dirname "$0")"

echo "🎵 Starting Music-U-Scheduler..."

# Start PostgreSQL if not running
if ! pgrep -x "postgres" > /dev/null; then
    echo "Starting PostgreSQL..."
    if command -v systemctl >/dev/null; then
        sudo systemctl start postgresql
    elif command -v service >/dev/null; then
        sudo service postgresql start
    elif command -v brew >/dev/null; then
        brew services start postgresql
    fi
fi

# Start backend
echo "Starting FastAPI backend on port 8001..."
source music-u-env/bin/activate
nohup uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload > logs/backend.log 2>&1 &

# Wait for backend to start
sleep 5

# Start frontend
echo "Starting Next.js frontend on port 3000..."
cd app
nohup yarn start > ../logs/frontend.log 2>&1 &

echo "✅ Application started successfully!"
echo ""
echo "🌐 Access URLs:"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:8001"
echo "   API Docs: http://localhost:8001/docs"
echo ""
echo "🔐 Default Login:"
echo "   Email:    admin@musicu.com"
echo "   Password: MusicU2025"
EOF

    # Create stop script
    cat > stop-app.sh << 'EOF'
#!/bin/bash

# Music-U-Scheduler Application Stopper
echo "🛑 Stopping Music-U-Scheduler..."

# Kill Node.js processes
pkill -f "next start"
pkill -f "yarn start"

# Kill Python processes
pkill -f "uvicorn"

echo "✅ Application stopped successfully!"
EOF

    # Create update script
    cat > update-app.sh << 'EOF'
#!/bin/bash

# Music-U-Scheduler Updater
cd "$(dirname "$0")"

echo "🔄 Updating Music-U-Scheduler..."

# Stop application
./stop-app.sh

# Pull latest changes
git pull origin main

# Update backend dependencies
source music-u-env/bin/activate
pip install --upgrade -r requirements.txt

# Run database migrations
alembic upgrade head

# Update frontend dependencies
cd app
yarn install --silent
yarn build
cd ..

echo "✅ Update complete!"
echo "Run ./start-app.sh to restart the application"
EOF

    # Make scripts executable
    chmod +x *.sh
    
    # Create logs directory
    mkdir -p logs
    
    print_success "Application scripts created"
}

# Final setup and validation
final_setup() {
    print_section "Final Setup and Validation"
    
    cd "$INSTALL_DIR"
    
    # Test database connection
    print_status "Testing database connection..."
    source music-u-env/bin/activate
    python -c "
import asyncpg
import asyncio
async def test_db():
    try:
        conn = await asyncpg.connect('postgresql://musicu_user:musicu_pass_2025@localhost/musicu_scheduler')
        await conn.close()
        print('✅ Database connection successful')
    except Exception as e:
        print(f'❌ Database connection failed: {e}')
asyncio.run(test_db())
"
    
    # Create desktop shortcut (Linux only)
    if [[ "$OS" == "Ubuntu" ]] || [[ "$OS" == "debian" ]]; then
        print_status "Creating desktop shortcut..."
        cat > ~/Desktop/Music-U-Scheduler.desktop << EOF
[Desktop Entry]
Version=1.0
Name=Music-U-Scheduler
Comment=Music Lesson Scheduling System
Exec=$INSTALL_DIR/start-app.sh
Icon=$INSTALL_DIR/assets/icon.png
Terminal=true
Type=Application
Categories=Education;Music;
EOF
        chmod +x ~/Desktop/Music-U-Scheduler.desktop
    fi
    
    print_success "Final setup complete"
}

# Main installation function
main() {
    print_header
    
    print_status "Starting fresh installation of Music-U-Scheduler..."
    print_status "This will take approximately 5-10 minutes depending on your system."
    echo
    
    # Check if running as root
    if [[ $EUID -eq 0 ]]; then
        print_error "Please do not run this script as root"
        exit 1
    fi
    
    # Detect OS
    detect_os
    
    # Install system dependencies
    install_system_dependencies
    
    # Install Node.js
    install_nodejs
    
    # Setup PostgreSQL
    setup_postgresql
    
    # Clone repository
    clone_repository
    
    # Setup backend
    setup_backend
    
    # Setup frontend
    setup_frontend
    
    # Run migrations
    run_migrations
    
    # Create startup scripts
    create_startup_scripts
    
    # Final setup
    final_setup
    
    # Installation complete
    echo
    print_success "🎉 Installation completed successfully!"
    echo
    echo -e "${WHITE}════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}         🎵 Music-U-Scheduler is ready to use! 🎵${NC}"
    echo -e "${WHITE}════════════════════════════════════════════════════════${NC}"
    echo
    echo -e "${CYAN}📁 Installation Directory:${NC} $INSTALL_DIR"
    echo
    echo -e "${CYAN}🚀 To start the application:${NC}"
    echo "   cd $INSTALL_DIR"
    echo "   ./start-app.sh"
    echo
    echo -e "${CYAN}🌐 Access URLs (after starting):${NC}"
    echo "   Frontend: http://localhost:3000"
    echo "   Backend:  http://localhost:8001"
    echo "   API Docs: http://localhost:8001/docs"
    echo
    echo -e "${CYAN}🔐 Default Admin Login:${NC}"
    echo "   Email:    admin@musicu.com"
    echo "   Password: MusicU2025"
    echo
    echo -e "${CYAN}📚 Documentation:${NC} $INSTALL_DIR/FRESH_INSTALL_GUIDE.md"
    echo
    echo -e "${YELLOW}⚠️  Important:${NC} Change the default password after first login!"
    echo
    
    # Auto-start option
    echo -n "Would you like to start the application now? [y/N]: "
    read -r start_now
    if [[ "$start_now" =~ ^[Yy]$ ]]; then
        echo
        print_status "Starting Music-U-Scheduler..."
        cd "$INSTALL_DIR"
        ./start-app.sh
        
        echo
        echo -e "${GREEN}🎉 Music-U-Scheduler is now running!${NC}"
        echo -e "${CYAN}Visit http://localhost:3000 to get started.${NC}"
    fi
}

# Error handling
handle_error() {
    print_error "Installation failed on line $1"
    echo
    echo "Please check the error message above and try again."
    echo "For support, create an issue at: $REPO_URL/issues"
    exit 1
}

trap 'handle_error $LINENO' ERR

# Run main installation
main "$@"
