#!/bin/bash

# Music-U-Scheduler Enhanced Installation Script
# This script handles fresh installations and updates existing installations

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
REPO_URL="https://github.com/dfultonthebar/Music-U-Scheduler.git"
APP_NAME="Music-U-Scheduler"
INSTALL_DIR="$HOME/$APP_NAME"
DESKTOP_FILE="$HOME/.local/share/applications/music-u-scheduler.desktop"
ICON_FILE="$HOME/.local/share/icons/music-u-scheduler.png"

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

# Function to install system dependencies
install_dependencies() {
    print_status "Installing system dependencies..."
    
    if command_exists apt-get; then
        sudo apt-get update
        sudo apt-get install -y python3 python3-pip python3-venv git curl
    elif command_exists yum; then
        sudo yum install -y python3 python3-pip git curl
    elif command_exists dnf; then
        sudo dnf install -y python3 python3-pip git curl
    elif command_exists pacman; then
        sudo pacman -S --noconfirm python python-pip git curl
    elif command_exists brew; then
        brew install python3 git curl
    else
        print_error "Unsupported package manager. Please install Python 3, pip, git, and curl manually."
        exit 1
    fi
    
    print_success "System dependencies installed successfully"
}

# Function to handle existing installation
handle_existing_installation() {
    if [ -d "$INSTALL_DIR" ]; then
        print_warning "Existing installation found at $INSTALL_DIR"
        
        # Check if it's a git repository
        if [ -d "$INSTALL_DIR/.git" ]; then
            print_status "Updating existing installation..."
            cd "$INSTALL_DIR"
            
            # Save any local changes
            if ! git diff --quiet || ! git diff --cached --quiet; then
                print_warning "Local changes detected. Stashing them..."
                git stash push -m "Auto-stash before update $(date)"
            fi
            
            # Pull latest changes
            git fetch origin
            git reset --hard origin/main
            print_success "Repository updated to latest version"
        else
            print_warning "Directory exists but is not a git repository. Removing and recloning..."
            rm -rf "$INSTALL_DIR"
            git clone "$REPO_URL" "$INSTALL_DIR"
            print_success "Repository cloned fresh"
        fi
    else
        print_status "Cloning repository..."
        git clone "$REPO_URL" "$INSTALL_DIR"
        print_success "Repository cloned successfully"
    fi
}

# Function to setup Python virtual environment
setup_python_environment() {
    print_status "Setting up Python virtual environment..."
    cd "$INSTALL_DIR"
    
    # Remove existing venv if it exists and is corrupted
    if [ -d "venv" ] && [ ! -f "venv/bin/activate" ]; then
        print_warning "Removing corrupted virtual environment..."
        rm -rf venv
    fi
    
    # Create virtual environment if it doesn't exist
    if [ ! -d "venv" ]; then
        python3 -m venv venv
        print_success "Virtual environment created"
    else
        print_status "Using existing virtual environment"
    fi
    
    # Activate virtual environment
    source venv/bin/activate
    
    # Upgrade pip
    pip install --upgrade pip
    
    # Install requirements
    if [ -f "requirements.txt" ]; then
        print_status "Installing Python dependencies..."
        pip install -r requirements.txt
        print_success "Python dependencies installed"
    else
        print_warning "requirements.txt not found. Installing basic dependencies..."
        pip install tkinter customtkinter pillow
    fi
}

# Function to create desktop entry
create_desktop_entry() {
    print_status "Creating desktop entry..."
    
    # Create directories if they don't exist
    mkdir -p "$(dirname "$DESKTOP_FILE")"
    mkdir -p "$(dirname "$ICON_FILE")"
    
    # Copy icon if it exists
    if [ -f "$INSTALL_DIR/icon.png" ]; then
        cp "$INSTALL_DIR/icon.png" "$ICON_FILE"
    elif [ -f "$INSTALL_DIR/assets/icon.png" ]; then
        cp "$INSTALL_DIR/assets/icon.png" "$ICON_FILE"
    fi
    
    # Create desktop file with correct module invocation
    cat > "$DESKTOP_FILE" << 'EOF'
[Desktop Entry]
Name=Music-U-Scheduler
Comment=Music practice scheduler and progress tracker
Exec=bash -c "cd $INSTALL_DIR && source venv/bin/activate && python -m app.main"
Icon=$ICON_FILE
Terminal=false
Type=Application
Categories=Education;Music;
StartupWMClass=Music-U-Scheduler
EOF
    
    # Replace variables in the desktop file
    sed -i "s|\$INSTALL_DIR|$INSTALL_DIR|g" "$DESKTOP_FILE"
    sed -i "s|\$ICON_FILE|$ICON_FILE|g" "$DESKTOP_FILE"
    
    chmod +x "$DESKTOP_FILE"
    
    # Update desktop database if available
    if command_exists update-desktop-database; then
        update-desktop-database "$HOME/.local/share/applications" 2>/dev/null || true
    fi
    
    print_success "Desktop entry created"
}

# Function to create launcher script
create_launcher() {
    print_status "Creating launcher script..."
    
    cat > "$INSTALL_DIR/launch.sh" << 'EOF'
#!/bin/bash
# Music-U-Scheduler Launcher Script

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Change to the application directory
cd "$SCRIPT_DIR"

# Activate virtual environment and run the application using module syntax
source venv/bin/activate
python -m app.main
EOF
    
    chmod +x "$INSTALL_DIR/launch.sh"
    print_success "Launcher script created"
}

# Function to run post-installation setup
post_install_setup() {
    print_status "Running post-installation setup..."
    
    cd "$INSTALL_DIR"
    
    # Make app/main.py executable if it exists
    if [ -f "app/main.py" ]; then
        chmod +x app/main.py
    fi
    
    # Create data directory if it doesn't exist
    mkdir -p data
    
    print_success "Post-installation setup completed"
}

# Function to display final instructions
show_final_instructions() {
    echo
    print_success "=== Installation Complete! ==="
    echo
    echo "Music-U-Scheduler has been successfully installed to: $INSTALL_DIR"
    echo
    echo "You can run the application in several ways:"
    echo
    echo "1. From the applications menu (if desktop environment supports it)"
    echo "2. Run the launcher script:"
    echo "   $INSTALL_DIR/launch.sh"
    echo
    echo "3. Manual activation:"
    echo "   cd $INSTALL_DIR"
    echo "   source venv/bin/activate"
    echo "   python -m app.main"
    echo
    echo "For updates, simply run this installer again."
    echo
    print_success "Happy music practicing! 🎵"
}

# Main installation function
main() {
    echo
    print_status "=== Music-U-Scheduler Enhanced Installer ==="
    echo
    
    # Check for required commands
    if ! command_exists git; then
        print_error "Git is not installed. Installing dependencies..."
        install_dependencies
    fi
    
    if ! command_exists python3; then
        print_error "Python 3 is not installed. Installing dependencies..."
        install_dependencies
    fi
    
    # Handle existing installation or clone fresh
    handle_existing_installation
    
    # Setup Python environment
    setup_python_environment
    
    # Create desktop integration
    create_desktop_entry
    
    # Create launcher script
    create_launcher
    
    # Post-installation setup
    post_install_setup
    
    # Show final instructions
    show_final_instructions
}

# Handle command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -y|--yes)
            # Auto-yes mode (useful for automated installations)
            shift
            ;;
        --verify)
            # Verification mode - just check if installation is working
            INSTALL_DIR="$HOME/$APP_NAME"
            if [ -d "$INSTALL_DIR" ] && [ -f "$INSTALL_DIR/app/main.py" ]; then
                print_success "Installation verified successfully!"
                echo "Main application file found at: $INSTALL_DIR/app/main.py"
                exit 0
            else
                print_error "Installation verification failed!"
                echo "Expected main application file at: $INSTALL_DIR/app/main.py"
                exit 1
            fi
            ;;
        -h|--help)
            echo "Music-U-Scheduler Enhanced Installer"
            echo
            echo "Usage: $0 [OPTIONS]"
            echo
            echo "Options:"
            echo "  -y, --yes      Auto-confirm all prompts"
            echo "  --verify       Verify existing installation"
            echo "  -h, --help     Show this help message"
            echo
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            echo "Use -h or --help for usage information."
            exit 1
            ;;
    esac
done

# Run main installation
main