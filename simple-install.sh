
#!/bin/bash

# Music U Scheduler - Simple Installation Script
# Version: 1.3.02
# For Ubuntu/Debian systems

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}🎵 Music U Scheduler - Simple Installation${NC}"
echo -e "${BLUE}===========================================${NC}"
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

# Check requirements
print_status "Checking system requirements..."

# Check Git
if ! command -v git &> /dev/null; then
    print_error "Git is not installed. Installing..."
    sudo apt update && sudo apt install -y git
fi

# Check Python3
if ! command -v python3 &> /dev/null; then
    print_error "Python3 is not installed. Installing..."
    sudo apt update && sudo apt install -y python3 python3-venv python3-pip
fi

# Check Node.js
if ! command -v node &> /dev/null; then
    print_warning "Node.js not found. Installing..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Download the application
print_status "Downloading Music U Scheduler..."
cd ~

# Remove existing directory if it exists
if [ -d "Music-U-Scheduler" ]; then
    print_warning "Existing directory found. Creating backup..."
    mv Music-U-Scheduler "Music-U-Scheduler-backup-$(date +%Y%m%d_%H%M%S)"
fi

# Clone repository
git clone https://github.com/dfultonthebar/Music-U-Scheduler.git
cd Music-U-Scheduler

print_status "Setting up Python environment..."

# Create virtual environment
python3 -m venv music-u-env

# Activate and install dependencies
source music-u-env/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

print_status "Setting up Node.js environment..."
cd app

# Install Node.js dependencies
if command -v yarn &> /dev/null; then
    yarn install
else
    npm install
fi

cd ..

print_status "Setting up database..."
source music-u-env/bin/activate

# Run migrations
if [ -f "alembic.ini" ]; then
    alembic upgrade head
fi

# Initialize admin user
if [ -f "init_admin.py" ]; then
    python init_admin.py
fi

# Make scripts executable
chmod +x *.sh

print_status "Installation completed successfully!"
echo ""
echo -e "${GREEN}╔═══════════════════════════════════════╗${NC}"
echo -e "${GREEN}║         Installation Complete!        ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════╝${NC}"
echo ""
echo "🚀 To start the application:"
echo "   cd ~/Music-U-Scheduler"
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
print_status "You can now start the services with: ./start-all.sh"
