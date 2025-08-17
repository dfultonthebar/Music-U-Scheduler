
#!/bin/bash

# Music U Scheduler - Emergency Installation Script (Fixed)
# Handles npm/nodejs conflicts

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}🚨 Music U Scheduler - Emergency Installation (Fixed)${NC}"
echo -e "${BLUE}=====================================================${NC}"
echo ""

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

# Change to home directory
cd ~

# Remove existing directory if it exists
if [ -d "Music-U-Scheduler" ]; then
    print_warning "Removing existing installation..."
    rm -rf Music-U-Scheduler
fi

print_status "Downloading fresh copy from GitHub..."
git clone https://github.com/dfultonthebar/Music-U-Scheduler.git
cd Music-U-Scheduler

print_status "Checking existing installations..."

# Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    print_status "Found Node.js: $NODE_VERSION"
else
    print_error "Node.js not found"
    exit 1
fi

# Check npm and install if needed
if ! command -v npm &> /dev/null; then
    print_status "npm not found, installing via alternative method..."
    
    # Use Node.js built-in npm if available
    if [ -f "$(dirname $(which node))/npm" ]; then
        print_status "Using existing npm from Node.js installation"
    else
        print_status "Installing npm via curl..."
        curl -L https://www.npmjs.com/install.sh | sh
    fi
else
    NPM_VERSION=$(npm --version)
    print_status "Found npm: $NPM_VERSION"
fi

print_status "Installing Python dependencies only..."
sudo apt update
sudo apt install -y python3-full python3-venv

print_status "Creating clean virtual environment..."
rm -rf music-u-env 2>/dev/null || true
python3 -m venv music-u-env

print_status "Activating virtual environment..."
source music-u-env/bin/activate

# Verify activation worked
if [ -z "$VIRTUAL_ENV" ]; then
    print_error "Virtual environment activation failed"
    exit 1
fi

print_status "Virtual environment active: $VIRTUAL_ENV"
print_status "Python path: $(which python)"
print_status "Python version: $(python --version)"

print_status "Installing Python dependencies..."
python -m pip install --upgrade pip
python -m pip install -r requirements.txt

print_status "Installing Node.js dependencies..."
cd app

# Clear any existing node_modules
rm -rf node_modules package-lock.json 2>/dev/null || true

# Install with npm
if command -v npm &> /dev/null; then
    npm install
else
    print_error "npm still not available"
    exit 1
fi

cd ..

print_status "Setting up database..."
source music-u-env/bin/activate

# Check if alembic command exists
if python -c "import alembic" 2>/dev/null; then
    python -m alembic upgrade head
else
    print_warning "Alembic not found, skipping migrations"
fi

# Create admin user
if [ -f "init_admin.py" ]; then
    python init_admin.py
else
    print_warning "init_admin.py not found, skipping admin creation"
fi

print_status "Making scripts executable..."
chmod +x *.sh 2>/dev/null || true

print_status "Installation completed successfully!"
echo ""
echo -e "${GREEN}╔═══════════════════════════════════════╗${NC}"
echo -e "${GREEN}║    Emergency Installation Complete!   ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════╝${NC}"
echo ""
echo "🚀 To start the application:"
echo "   cd ~/Music-U-Scheduler"
echo "   source music-u-env/bin/activate"
echo "   ./start-all.sh"
echo ""
echo "🌐 Access URLs:"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:8001"
echo ""
echo "👤 Admin Login:"
echo "   Username: admin"
echo "   Password: MusicU2025"
echo ""

# Test the installation
print_status "Testing installation..."
print_status "Node.js: $(node --version)"
print_status "npm: $(npm --version)"
source music-u-env/bin/activate
print_status "Python: $(python --version)"
print_status "Virtual env: $VIRTUAL_ENV"

print_status "Ready to use!"
