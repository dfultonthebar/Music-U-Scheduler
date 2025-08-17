
#!/bin/bash

# Music U Scheduler - Download/Update Script
# Version: 1.3.02
# This script downloads the latest version from GitHub

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
REPO_URL="https://github.com/dfultonthebar/Music-U-Scheduler.git"
PROJECT_NAME="Music-U-Scheduler"
INSTALL_DIR="$HOME"
PROJECT_DIR="$INSTALL_DIR/$PROJECT_NAME"

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║       Music U Scheduler Updater       ║${NC}"
echo -e "${BLUE}║            Version 1.3.02              ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if git is installed
if ! command -v git &> /dev/null; then
    print_error "Git is not installed. Please install git first:"
    echo "  Ubuntu/Debian: sudo apt update && sudo apt install git"
    echo "  CentOS/RHEL: sudo yum install git"
    exit 1
fi

# Check if this is a fresh install or update
if [ -d "$PROJECT_DIR" ]; then
    print_warning "Existing installation found at $PROJECT_DIR"
    echo ""
    
    # Check if running in non-interactive mode (piped input)
    if [ ! -t 0 ]; then
        print_status "Non-interactive mode detected. Performing update..."
        choice=1
    else
        echo "Choose an option:"
        echo "1) Update existing installation (recommended)"
        echo "2) Fresh installation (will backup existing)"
        echo "3) Cancel"
        echo ""
        read -p "Enter your choice (1-3): " choice
    fi
    
    case $choice in
        1)
            print_status "Updating existing installation..."
            cd "$PROJECT_DIR"
            
            # Create backup of current state
            BACKUP_NAME="backup_$(date +%Y%m%d_%H%M%S)"
            print_status "Creating backup: $BACKUP_NAME"
            cp -r "$PROJECT_DIR" "$INSTALL_DIR/$BACKUP_NAME"
            
            # Check if there are local changes
            if ! git diff --quiet || ! git diff --staged --quiet; then
                print_warning "Local changes detected. Stashing them..."
                git stash push -m "Auto-stash before update $(date)"
            fi
            
            # Pull latest changes
            print_status "Pulling latest changes from GitHub..."
            git fetch origin
            git reset --hard origin/main
            
            UPDATE_MODE=true
            ;;
        2)
            print_status "Performing fresh installation..."
            # Backup existing directory
            BACKUP_NAME="backup_$(date +%Y%m%d_%H%M%S)"
            print_status "Backing up existing installation to $BACKUP_NAME"
            mv "$PROJECT_DIR" "$INSTALL_DIR/$BACKUP_NAME"
            UPDATE_MODE=false
            ;;
        3)
            print_status "Update cancelled."
            exit 0
            ;;
        *)
            print_error "Invalid choice. Using default: Update existing installation"
            choice=1
            cd "$PROJECT_DIR"
            
            # Create backup of current state
            BACKUP_NAME="backup_$(date +%Y%m%d_%H%M%S)"
            print_status "Creating backup: $BACKUP_NAME"
            cp -r "$PROJECT_DIR" "$INSTALL_DIR/$BACKUP_NAME"
            
            # Check if there are local changes
            if ! git diff --quiet || ! git diff --staged --quiet; then
                print_warning "Local changes detected. Stashing them..."
                git stash push -m "Auto-stash before update $(date)"
            fi
            
            # Pull latest changes
            print_status "Pulling latest changes from GitHub..."
            git fetch origin
            git reset --hard origin/main
            
            UPDATE_MODE=true
            ;;
    esac
else
    print_status "Fresh installation detected."
    UPDATE_MODE=false
fi

# Clone repository if fresh install
if [ "$UPDATE_MODE" = false ]; then
    print_status "Cloning Music U Scheduler from GitHub..."
    cd "$INSTALL_DIR"
    git clone "$REPO_URL" "$PROJECT_NAME"
    cd "$PROJECT_DIR"
fi

print_status "Checking current version..."
cd "$PROJECT_DIR"

# Debug: Show current directory and files
print_status "Current directory: $(pwd)"
print_status "Directory contents:"
ls -la | head -10

# Check if we're in the right directory
if [ ! -f "requirements.txt" ] || [ ! -f "app/package.json" ]; then
    print_error "This doesn't appear to be a valid Music U Scheduler installation."
    print_error "Looking for: requirements.txt and app/package.json"
    print_error "Current directory: $(pwd)"
    if [ -f "requirements.txt" ]; then
        print_status "✓ Found requirements.txt"
    else
        print_error "✗ Missing requirements.txt"
    fi
    if [ -f "app/package.json" ]; then
        print_status "✓ Found app/package.json"  
    else
        print_error "✗ Missing app/package.json"
    fi
    
    # Try to find the correct directory
    if [ -d "Music-U-Scheduler" ] && [ -f "Music-U-Scheduler/requirements.txt" ]; then
        print_status "Found nested Music-U-Scheduler directory, entering..."
        cd Music-U-Scheduler
    else
        print_error "Cannot locate valid installation directory."
        exit 1
    fi
fi

# Get version from package.json
if [ -f "app/package.json" ]; then
    VERSION=$(grep '"version"' app/package.json | head -1 | sed 's/.*"version": *"\([^"]*\)".*/\1/')
    print_status "Downloaded version: $VERSION"
fi

# Check if Python virtual environment exists
if [ ! -d "music-u-env" ]; then
    print_status "Creating Python virtual environment..."
    python3 -m venv music-u-env
    if [ $? -ne 0 ]; then
        print_error "Failed to create virtual environment. Trying with python..."
        python -m venv music-u-env
    fi
fi

# Activate virtual environment and update dependencies
print_status "Updating Python dependencies..."
if [ -f "music-u-env/bin/activate" ]; then
    source music-u-env/bin/activate
    
    # Upgrade pip first
    pip install --upgrade pip
    
    # Install/update requirements
    pip install -r requirements.txt
else
    print_error "Virtual environment activation failed. Attempting direct install..."
    python3 -m pip install --user --upgrade pip
    python3 -m pip install --user -r requirements.txt
fi

# Update Node.js dependencies if needed
if [ -d "app" ]; then
    print_status "Updating Node.js dependencies..."
    cd app
    
    # Check if node_modules exists and yarn.lock
    if [ ! -d "node_modules" ] || [ "package.json" -nt "node_modules" ]; then
        if command -v yarn &> /dev/null; then
            yarn install
        elif command -v npm &> /dev/null; then
            npm install
        else
            print_warning "Neither yarn nor npm found. Please install Node.js dependencies manually."
        fi
    fi
    
    cd ..
fi

# Make sure all scripts are executable
print_status "Setting script permissions..."
chmod +x *.sh 2>/dev/null || true
chmod +x scripts/*.sh 2>/dev/null || true

# Run database migrations if needed
if [ -f "alembic.ini" ]; then
    print_status "Running database migrations..."
    source music-u-env/bin/activate
    alembic upgrade head 2>/dev/null || print_warning "Database migration skipped (may not be needed)"
fi

# Create/update admin user
if [ -f "init_admin.py" ]; then
    print_status "Ensuring admin user exists..."
    source music-u-env/bin/activate
    python init_admin.py 2>/dev/null || print_warning "Admin initialization skipped"
fi

print_status "Update completed successfully!"
echo ""
echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║           Update Complete!             ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
echo ""
echo "Next steps:"
echo "1. Start the services:"
echo "   cd $PROJECT_DIR"
echo "   ./start-all.sh"
echo ""
echo "2. Access the application:"
echo "   Frontend: http://localhost:3000"
echo "   Backend API: http://localhost:8001"
echo ""
echo "3. Login credentials:"
echo "   Username: admin"
echo "   Password: MusicU2025"
echo ""

if [ "$UPDATE_MODE" = true ] && [ -d "$INSTALL_DIR/$BACKUP_NAME" ]; then
    echo "4. Your previous installation was backed up to:"
    echo "   $INSTALL_DIR/$BACKUP_NAME"
    echo ""
fi

print_status "Download and update process completed successfully!"
