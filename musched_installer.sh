#!/bin/bash
# Music-U-Scheduler Professional Remote Installer
# One-line installation script for Music-U-Scheduler with professional features
# Usage: curl -sL https://raw.githubusercontent.com/dfultonthebar/Music-U-Scheduler/main/musched_installer.sh | bash

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Configuration
REPO_URL="https://github.com/dfultonthebar/Music-U-Scheduler.git"
INSTALLER_URL="https://raw.githubusercontent.com/dfultonthebar/Music-U-Scheduler/main/install.sh"
APP_NAME="Music-U-Scheduler"
TEMP_DIR="/tmp/musched_install_$$"
DOMAIN="musicu.local"

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

print_professional() {
    echo -e "${PURPLE}[PROFESSIONAL]${NC} $1"
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

# Function to check if running as root
check_root() {
    if [[ $EUID -eq 0 ]]; then
        print_error "This script should not be run as root for security reasons."
        print_error "Please run as a regular user. The script will use sudo when needed."
        exit 1
    fi
}

# Function to check sudo access
check_sudo() {
    print_status "Checking sudo access..."
    if ! sudo -n true 2>/dev/null; then
        print_warning "This installer requires sudo access for system configuration."
        print_status "You may be prompted for your password..."
        if ! sudo true; then
            print_error "Sudo access is required for professional installation."
            print_error "Please ensure you have sudo privileges and try again."
            exit 1
        fi
    fi
    print_success "Sudo access confirmed"
}

# Function to install basic dependencies
install_basic_deps() {
    print_status "Installing basic dependencies..."
    
    if command_exists apt-get; then
        sudo apt-get update >/dev/null 2>&1
        sudo apt-get install -y curl git wget >/dev/null 2>&1
    elif command_exists yum; then
        sudo yum install -y curl git wget >/dev/null 2>&1
    elif command_exists dnf; then
        sudo dnf install -y curl git wget >/dev/null 2>&1
    elif command_exists pacman; then
        sudo pacman -S --noconfirm curl git wget >/dev/null 2>&1
    elif command_exists brew; then
        brew install curl git wget >/dev/null 2>&1
    else
        print_error "Unsupported package manager. Please install curl, git, and wget manually."
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
            print_warning "macOS detected. Some professional features may require manual configuration."
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
    
    # Check for wget
    if ! command_exists wget; then
        print_warning "wget not found. Installing..."
        install_basic_deps
    fi
    
    print_success "System requirements satisfied"
}

# Function to show pre-installation information
show_pre_install_info() {
    echo
    print_professional "=== Music-U-Scheduler Professional Setup ==="
    echo
    echo "This installer will set up Music-U-Scheduler with professional features:"
    echo
    echo "🌐 Custom Domain: https://$DOMAIN"
    echo "🔒 SSL/HTTPS: Self-signed certificate for secure connections"
    echo "🛡️  Reverse Proxy: Nginx with security headers"
    echo "🔥 Firewall: Automatic configuration"
    echo "⚙️  System Service: Automatic startup and management"
    echo "🔄 Auto-Updates: Daily update checks"
    echo "📊 Management Tools: Professional control interface"
    echo
    echo "Requirements:"
    echo "• Linux system with systemd"
    echo "• Sudo privileges"
    echo "• Internet connection"
    echo "• Python 3.7+"
    echo
    print_warning "This will modify system configuration including:"
    print_warning "• /etc/hosts (for custom domain)"
    print_warning "• Nginx configuration"
    print_warning "• Firewall rules"
    print_warning "• Systemd services"
    echo
}

# Function to download and run the main installer
run_main_installer() {
    print_status "Downloading professional installer..."
    
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
    
    print_success "Professional installer downloaded successfully"
    print_professional "Running professional installation..."
    echo
    
    # Run the main installer with professional features
    if [ "$BASIC_MODE" = true ]; then
        bash install.sh -y --basic
    else
        bash install.sh -y
    fi
}

# Function to verify installation
verify_installation() {
    INSTALL_DIR="$HOME/$APP_NAME"
    SERVICE_NAME="music-u-scheduler"
    
    print_status "Verifying professional installation..."
    
    # Check if directory exists
    if [ ! -d "$INSTALL_DIR" ]; then
        print_error "Installation directory not found: $INSTALL_DIR"
        return 1
    fi
    
    # Check if main application exists
    if [ ! -f "$INSTALL_DIR/app/main.py" ]; then
        print_error "Main application file not found: $INSTALL_DIR/app/main.py"
        return 1
    fi
    
    # Check if systemd service exists (only if not basic mode)
    if [ "$BASIC_MODE" != true ] && [ ! -f "/etc/systemd/system/$SERVICE_NAME.service" ]; then
        print_warning "Systemd service not found (may be expected on some systems)"
    fi
    
    # Check if nginx configuration exists (only if not basic mode)
    if [ "$BASIC_MODE" != true ] && [ ! -f "/etc/nginx/sites-available/$DOMAIN" ]; then
        print_warning "Nginx configuration not found (may be expected on some systems)"
    fi
    
    # Check if SSL certificates exist (only if not basic mode)
    if [ "$BASIC_MODE" != true ] && [ ! -f "/etc/ssl/musicu/cert.crt" ]; then
        print_warning "SSL certificates not found (may be expected on some systems)"
    fi
    
    # Check if service is running (if systemd is available and not basic mode)
    if [ "$BASIC_MODE" != true ] && command_exists systemctl; then
        if sudo systemctl is-active --quiet "$SERVICE_NAME" 2>/dev/null; then
            print_success "Service is running successfully"
        else
            print_warning "Service is not running. This may be normal during initial setup."
        fi
    fi
    
    print_success "Installation verification completed"
    return 0
}

# Function to show post-installation instructions
show_post_install_instructions() {
    echo
    print_success "=== Professional Installation Complete! ==="
    echo
    print_professional "🎉 Music-U-Scheduler Professional is now installed!"
    echo
    
    if [ "$BASIC_MODE" = true ]; then
        echo "📁 Installation: $HOME/$APP_NAME"
        echo
        echo "🚀 Quick Start:"
        echo "  $HOME/$APP_NAME/launch.sh"
        echo
        echo "🔧 Management:"
        echo "  cd $HOME/$APP_NAME"
        echo "  source venv/bin/activate"
        echo "  python -m app.main"
    else
        echo "🌐 Web Interface: https://$DOMAIN"
        echo "📁 Installation: $HOME/$APP_NAME"
        echo
        echo "🚀 Quick Start:"
        echo "  1. Open your browser to: https://$DOMAIN"
        echo "  2. Accept the security warning (self-signed certificate)"
        echo "  3. Start using Music-U-Scheduler!"
        echo
        echo "🔧 Management Commands:"
        echo "  $HOME/$APP_NAME/launch.sh start    - Start the service"
        echo "  $HOME/$APP_NAME/launch.sh stop     - Stop the service"
        echo "  $HOME/$APP_NAME/launch.sh status   - Check service status"
        echo "  $HOME/$APP_NAME/launch.sh open     - Open web interface"
        echo
        echo "📋 Service Management:"
        echo "  sudo systemctl status music-u-scheduler"
        echo "  sudo journalctl -u music-u-scheduler -f"
        echo
        echo "🔄 Updates:"
        echo "  • Automatic daily update checks are enabled"
        echo "  • Manual update: $HOME/$APP_NAME/launch.sh update"
        echo "  • Re-run installer: curl -sL $INSTALLER_URL | bash"
        echo
        echo "🔒 Security Notes:"
        echo "  • Self-signed SSL certificate will show browser warnings"
        echo "  • Certificate is valid for: $DOMAIN, localhost, 127.0.0.1"
        echo "  • Firewall has been configured for HTTP/HTTPS access"
        echo
        echo "📚 Documentation:"
        echo "  • Installation logs: Check systemd journal"
        echo "  • Configuration: /etc/nginx/sites-available/$DOMAIN"
        echo "  • SSL Certificates: /etc/ssl/musicu/"
    fi
    
    echo
    print_success "🎵 Happy music practicing with professional-grade setup!"
}

# Main function
main() {
    echo
    print_professional "=== Music-U-Scheduler Professional Remote Installer ==="
    print_status "Preparing to install Music-U-Scheduler with enterprise features"
    echo
    
    # Security and system checks
    check_root
    detect_system
    check_requirements
    
    if [ "$BASIC_MODE" != true ]; then
        check_sudo
        
        # Show what will be installed
        show_pre_install_info
        
        # Prompt for confirmation (unless in CI/automated environment)
        if [ -t 0 ] && [ -z "$CI" ] && [ -z "$AUTOMATED" ]; then
            echo -n "Do you want to proceed with the professional installation? [Y/n]: "
            read -r response
            case $response in
                [nN][oO]|[nN])
                    print_status "Installation cancelled by user"
                    exit 0
                    ;;
                *)
                    print_status "Proceeding with installation..."
                    ;;
            esac
        else
            print_status "Running in automated mode..."
        fi
    else
        print_status "Running basic installation mode..."
    fi
    
    echo
    
    # Run main installer
    run_main_installer
    
    # Verify installation
    if verify_installation; then
        show_post_install_instructions
    else
        print_error "Installation verification failed. Please check the error messages above."
        print_error "You can try running the installer again or check the logs."
        exit 1
    fi
}

# Handle command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --basic)
            # Basic installation without professional features
            print_status "Basic installation mode selected"
            BASIC_MODE=true
            shift
            ;;
        --automated)
            # Automated installation (no prompts)
            export AUTOMATED=1
            shift
            ;;
        -h|--help)
            echo "Music-U-Scheduler Professional Remote Installer"
            echo
            echo "This script downloads and installs Music-U-Scheduler with professional features."
            echo
            echo "Usage:"
            echo "  curl -sL https://raw.githubusercontent.com/dfultonthebar/Music-U-Scheduler/main/musched_installer.sh | bash"
            echo
            echo "Options:"
            echo "  --basic       Install without professional features"
            echo "  --automated   Run without interactive prompts"
            echo "  -h, --help    Show this help message"
            echo
            echo "Professional Features:"
            echo "  • Custom domain (musicu.local) with HTTPS/SSL"
            echo "  • Nginx reverse proxy with security headers"
            echo "  • Systemd service for automatic startup"
            echo "  • Automatic updates with systemd timer"
            echo "  • Firewall configuration"
            echo "  • Professional management tools"
            echo
            echo "Examples:"
            echo "  # Standard professional installation"
            echo "  curl -sL https://raw.githubusercontent.com/dfultonthebar/Music-U-Scheduler/main/musched_installer.sh | bash"
            echo
            echo "  # Basic installation without professional features"
            echo "  curl -sL https://raw.githubusercontent.com/dfultonthebar/Music-U-Scheduler/main/musched_installer.sh | bash -s -- --basic"
            echo
            echo "  # Automated installation (no prompts)"
            echo "  curl -sL https://raw.githubusercontent.com/dfultonthebar/Music-U-Scheduler/main/musched_installer.sh | bash -s -- --automated"
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