
#!/bin/bash

# Music U Scheduler - Emergency Installation Script
# This script handles difficult Python environments

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}🚨 Music U Scheduler - Emergency Installation${NC}"
echo -e "${BLUE}=============================================${NC}"
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

print_status "Installing system dependencies..."
sudo apt update
sudo apt install -y python3-full python3-venv nodejs npm

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
npm install
cd ..

print_status "Setting up database..."
source music-u-env/bin/activate
python -m alembic upgrade head
python init_admin.py

print_status "Making scripts executable..."
chmod +x *.sh

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
print_status "Ready to use!"
