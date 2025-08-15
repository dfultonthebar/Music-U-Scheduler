#!/bin/bash

# Music-U-Scheduler Remote Installer
# One-line installation script for Music-U-Scheduler
# Usage: curl -sL https://raw.githubusercontent.com/dfultonthebar/Music-U-Scheduler/main/musched_installer.sh | bash

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
REPO_URL="https://github.com/dfultonthebar/Music-U-Scheduler.git"
INSTALLER_URL="https://raw.githubusercontent.com/dfultonthebar/Music-U-Scheduler/main/install.sh"
APP_NAME="Music-U-Scheduler"
TEMP_DIR="/tmp/musched_install_$$"

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

# Function to cleanup temporary files
cleanup() {
    if [ -d "$TEMP_DIR" ]; then
        rm -rf "$TEMP_DIR"
    fi
}

# Set trap to cleanup on exit
trap cleanup EXIT

# Function to install basic dependencies
install_basic_deps() {
    print_status "Installing basic dependencies..."
    
    if command_exists apt-get; then
        sudo apt-get update >/dev/null 2>&1
        sudo apt-get install -y curl git >/dev/null 2>&1
    elif command_exists yum; then
        sudo yum install -y curl git >/dev/null 2>&1
    elif command_exists dnf; then
        sudo dnf install -y curl git >/dev/null 2>&1
    elif command_exists pacman; then
        sudo pacman -S --noconfirm curl git >/dev/null 2>&1
    elif command_exists brew; then
        brew install curl git >/dev/null 2>&1
    else
        print_error "Unsupported package manager. Please install curl and git manually."
        exit 1
    fi
    
    print_success "Basic dependencies installed"
}

# Function to detect OS and architecture
detect_system() {
    OS=$(uname -s | tr '[:upper:]' '[:lower:]')
    ARCH=$(uname -m)
    
    case $OS in
        linux*)
            OS="linux"
            ;;
        darwin*)
            OS="macos"
            ;;
        cygwin*|mingw*|msys*)
            OS="windows"
            print_error "Windows is not directly supported. Please use WSL (Windows Subsystem for Linux)."
            exit 1
            ;;
        *)
            print_error "Unsupported operating system: $OS"
            exit 1
            ;;
    esac
    
    print_status "Detected system: $OS ($ARCH)"
}

# Function to check system requirements
check_requirements() {
    print_status "Checking system requirements..."
    
    # Check for curl
    if ! command_exists curl; then
        print_warning "curl not found. Installing..."
        install_basic_deps
    fi
    
    # Check for git
    if ! command_exists git; then
        print_warning "git not found. Installing..."
        install_basic_deps
    fi
    
    print_success "System requirements satisfied"
}

# Function to download and run the main installer
run_main_installer() {
    print_status "Downloading main installer..."
    
    # Create temporary directory
    mkdir -p "$TEMP_DIR"
    cd "$TEMP_DIR"
    
    # Download the main installer
    if ! curl -sL "$INSTALLER_URL" -o install.sh; then
        print_error "Failed to download installer from $INSTALLER_URL"
        print_error "Please check your internet connection and try again."
        exit 1
    fi
    
    # Make installer executable
    chmod +x install.sh
    
    print_success "Installer downloaded successfully"
    print_status "Running main installer..."
    
    # Run the main installer
    bash install.sh -y
}

# Function to verify installation
verify_installation() {
    INSTALL_DIR="$HOME/$APP_NAME"
    
    if [ -d "$INSTALL_DIR" ] && [ -f "$INSTALL_DIR/app/main.py" ]; then
        print_success "Installation verified successfully!"
        return 0
    else
        print_error "Installation verification failed!"
        print_error "Expected main application file at: $INSTALL_DIR/app/main.py"
        return 1
    fi
}

# Main function
main() {
    echo
    print_status "=== Music-U-Scheduler Remote Installer ==="
    print_status "This will download and install Music-U-Scheduler on your system"
    echo
    
    # Detect system
    detect_system
    
    # Check requirements
    check_requirements
    
    # Run main installer
    run_main_installer
    
    # Verify installation
    if verify_installation; then
        echo
        print_success "=== Installation Complete! ==="
        echo
        echo "Music-U-Scheduler has been successfully installed!"
        echo
        echo "To run the application:"
        echo "  $HOME/$APP_NAME/launch.sh"
        echo
        echo "Or activate the virtual environment and run manually:"
        echo "  cd $HOME/$APP_NAME"
        echo "  source venv/bin/activate"
        echo "  python app/main.py"
        echo
        print_success "Happy music practicing! 🎵"
    else
        print_error "Installation failed. Please check the error messages above."
        exit 1
    fi
}

# Handle command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            echo "Music-U-Scheduler Remote Installer"
            echo
            echo "This script downloads and installs Music-U-Scheduler automatically."
            echo
            echo "Usage:"
            echo "  curl -sL https://raw.githubusercontent.com/dfultonthebar/Music-U-Scheduler/main/musched_installer.sh | bash"
            echo
            echo "Or download and run locally:"
            echo "  wget https://raw.githubusercontent.com/dfultonthebar/Music-U-Scheduler/main/musched_installer.sh"
            echo "  chmod +x musched_installer.sh"
            echo "  ./musched_installer.sh"
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