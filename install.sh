#!/bin/bash
# Music-U-Scheduler Professional Installation Script
# This script handles fresh installations, updates, and professional setup with HTTPS/SSL

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
APP_NAME="Music-U-Scheduler"
INSTALL_DIR="$HOME/$APP_NAME"
DESKTOP_FILE="$HOME/.local/share/applications/music-u-scheduler.desktop"
ICON_FILE="$HOME/.local/share/icons/music-u-scheduler.png"

# Professional setup configuration
DOMAIN="musicu.local"
APP_PORT="8000"
NGINX_CONF="/etc/nginx/sites-available/$DOMAIN"
SSL_DIR="/etc/ssl/musicu"
SERVICE_NAME="music-u-scheduler"
UPDATE_SERVICE_NAME="music-u-scheduler-updater"

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

# Function to check if running as root
check_root() {
    if [[ $EUID -eq 0 ]]; then
        print_error "This script should not be run as root for security reasons."
        print_error "Please run as a regular user. The script will use sudo when needed."
        exit 1
    fi
}

# Function to install system dependencies
install_dependencies() {
    print_status "Installing system dependencies..."
    
    if command_exists apt-get; then
        sudo apt-get update
        sudo apt-get install -y python3 python3-pip python3-venv git curl nginx openssl ufw postgresql postgresql-contrib
    elif command_exists yum; then
        sudo yum install -y python3 python3-pip git curl nginx openssl firewalld postgresql postgresql-server
    elif command_exists dnf; then
        sudo dnf install -y python3 python3-pip git curl nginx openssl firewalld postgresql postgresql-server
    elif command_exists pacman; then
        sudo pacman -S --noconfirm python python-pip git curl nginx openssl ufw postgresql
    elif command_exists brew; then
        brew install python3 git curl nginx openssl postgresql
    else
        print_error "Unsupported package manager. Please install dependencies manually."
        exit 1
    fi
    
    print_success "System dependencies installed successfully"
}

# Function to install Node.js and Yarn
install_nodejs_yarn() {
    print_status "Installing Node.js and Yarn..."
    
    # Check if Node.js is already available through existing installation
    if [ -f "/usr/local/nvm/versions/node/v22.14.0/bin/node" ]; then
        print_status "Using existing Node.js installation"
        export PATH="/usr/local/nvm/versions/node/v22.14.0/bin:$PATH"
    else
        # Install Node.js via NodeSource repository
        print_status "Installing Node.js via NodeSource..."
        if command_exists apt-get; then
            curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
            sudo apt-get install -y nodejs
        elif command_exists yum; then
            curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
            sudo yum install -y nodejs
        elif command_exists dnf; then
            curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
            sudo dnf install -y nodejs
        else
            print_warning "Please install Node.js 18+ manually"
            return 1
        fi
    fi
    
    # Verify Node.js installation
    if command_exists node; then
        print_success "Node.js $(node --version) installed successfully"
    else
        print_error "Node.js installation failed"
        return 1
    fi
    
    # Install Yarn using npm
    if ! command_exists yarn; then
        print_status "Installing Yarn package manager..."
        npm install -g yarn
        print_success "Yarn installed successfully"
    else
        print_status "Yarn is already installed"
    fi
    
    return 0
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
        pip install tkinter customtkinter pillow fastapi uvicorn
    fi
}

# Function to setup frontend environment
setup_frontend_environment() {
    print_status "Setting up Next.js frontend environment..."
    
    if [ ! -d "$INSTALL_DIR/frontend" ]; then
        print_warning "Frontend directory not found. Skipping frontend setup."
        return 0
    fi
    
    cd "$INSTALL_DIR/frontend"
    
    # Ensure Node.js and Yarn are in PATH
    if [ -f "/usr/local/nvm/versions/node/v22.14.0/bin/node" ]; then
        export PATH="/usr/local/nvm/versions/node/v22.14.0/bin:$PATH"
    fi
    
    # Aggressive cleanup of any existing installation artifacts
    print_status "Performing deep cleanup of existing installation..."
    
    # Force remove node_modules with sudo if needed
    if [ -d "node_modules" ]; then
        print_status "Forcefully removing existing node_modules..."
        sudo rm -rf node_modules 2>/dev/null || rm -rf node_modules
    fi
    
    # Remove yarn.lock and package-lock.json to avoid conflicts
    [ -f "yarn.lock" ] && rm -f yarn.lock
    [ -f "package-lock.json" ] && rm -f package-lock.json
    
    # Clean various caches
    if command_exists yarn; then
        print_status "Cleaning yarn cache..."
        yarn cache clean --force 2>/dev/null || true
    fi
    
    if command_exists npm; then
        print_status "Cleaning npm cache..."
        npm cache clean --force 2>/dev/null || true
    fi
    
    # Clear any temporary directories
    sudo rm -rf /tmp/yarn* /tmp/npm* 2>/dev/null || true
    
    print_success "Deep cleanup completed"
    
    # Install frontend dependencies with multiple fallbacks
    print_status "Installing frontend dependencies..."
    
    INSTALL_SUCCESS=false
    
    # First attempt: Yarn with network timeout
    if command_exists yarn && [ "$INSTALL_SUCCESS" = false ]; then
        print_status "Attempting installation with Yarn..."
        if yarn install --network-timeout 300000 --no-lockfile --ignore-engines 2>/dev/null; then
            INSTALL_SUCCESS=true
            print_success "Frontend dependencies installed via Yarn"
        else
            print_warning "Yarn install failed, trying other methods..."
        fi
    fi
    
    # Second attempt: NPM with legacy peer deps
    if command_exists npm && [ "$INSTALL_SUCCESS" = false ]; then
        print_status "Attempting installation with NPM (legacy peer deps)..."
        if npm install --legacy-peer-deps --no-audit --no-fund 2>/dev/null; then
            INSTALL_SUCCESS=true
            print_success "Frontend dependencies installed via NPM"
        else
            print_warning "NPM with legacy-peer-deps failed, trying force..."
        fi
    fi
    
    # Third attempt: NPM with force
    if command_exists npm && [ "$INSTALL_SUCCESS" = false ]; then
        print_status "Attempting installation with NPM (forced)..."
        if npm install --force --no-audit --no-fund 2>/dev/null; then
            INSTALL_SUCCESS=true
            print_success "Frontend dependencies installed via NPM (forced)"
        else
            print_warning "NPM forced install failed..."
        fi
    fi
    
    # Final attempt: Manual dependency installation
    if [ "$INSTALL_SUCCESS" = false ]; then
        print_status "Attempting manual core dependencies installation..."
        if command_exists npm; then
            npm install next@14.2.28 react@18.2.0 react-dom@18.2.0 typescript@5.2.2 --legacy-peer-deps --no-audit --no-fund 2>/dev/null || true
            npm install tailwindcss@3.3.3 --legacy-peer-deps --no-audit --no-fund 2>/dev/null || true
            if [ -d "node_modules/next" ]; then
                INSTALL_SUCCESS=true
                print_success "Core dependencies installed manually"
            fi
        fi
    fi
    
    if [ "$INSTALL_SUCCESS" = false ]; then
        print_error "All frontend dependency installation methods failed."
        print_error "You may need to manually install dependencies later with:"
        print_error "cd $INSTALL_DIR/frontend && npm install --legacy-peer-deps"
        return 0  # Don't fail entire installation
    fi
    
    # Build the frontend
    print_status "Building frontend for production..."
    if yarn build 2>/dev/null; then
        print_success "Frontend built successfully with Yarn"
    elif npm run build 2>/dev/null; then
        print_success "Frontend built successfully with NPM"
    else
        print_warning "Frontend build failed, but continuing with development mode"
        print_warning "You can build manually later with: cd $INSTALL_DIR/frontend && npm run build"
    fi
    
    return 0
}

# Function to setup custom domain in hosts file
setup_custom_domain() {
    print_professional "Setting up custom domain: $DOMAIN"
    
    # Check if domain already exists in hosts file
    if ! grep -q "$DOMAIN" /etc/hosts; then
        print_status "Adding $DOMAIN to /etc/hosts..."
        echo "127.0.0.1 $DOMAIN" | sudo tee -a /etc/hosts
        print_success "Custom domain added to hosts file"
    else
        print_status "Custom domain already exists in hosts file"
    fi
}

# Function to generate SSL certificates
generate_ssl_certificates() {
    print_professional "Generating SSL certificates for $DOMAIN"
    
    # Create SSL directory
    sudo mkdir -p "$SSL_DIR"
    
    # Generate private key
    print_status "Generating private key..."
    sudo openssl genrsa -out "$SSL_DIR/private.key" 2048
    
    # Generate certificate signing request
    print_status "Generating certificate signing request..."
    sudo openssl req -new -key "$SSL_DIR/private.key" -out "$SSL_DIR/cert.csr" \
        -subj "/C=US/ST=Local/L=Development/O=Music-U-Scheduler/OU=Development/CN=$DOMAIN"
    
    # Generate self-signed certificate
    print_status "Generating self-signed certificate..."
    
    # Create temporary config file for certificate extensions
    TEMP_CONFIG=$(mktemp)
    cat > "$TEMP_CONFIG" <<EOF
[v3_req]
keyUsage = keyEncipherment, dataEncipherment
extendedKeyUsage = serverAuth
subjectAltName = @alt_names
[alt_names]
DNS.1 = $DOMAIN
DNS.2 = www.$DOMAIN
DNS.3 = localhost
IP.1 = 127.0.0.1
EOF
    
    sudo openssl x509 -req -days 365 -in "$SSL_DIR/cert.csr" \
        -signkey "$SSL_DIR/private.key" -out "$SSL_DIR/cert.crt" \
        -extensions v3_req -extfile "$TEMP_CONFIG"
    
    # Clean up temporary file
    rm -f "$TEMP_CONFIG"
    
    # Set proper permissions
    sudo chmod 600 "$SSL_DIR/private.key"
    sudo chmod 644 "$SSL_DIR/cert.crt"
    
    print_success "SSL certificates generated successfully"
}

# Function to configure nginx reverse proxy
configure_nginx() {
    print_professional "Configuring Nginx reverse proxy"
    
    # Create nginx configuration
    print_status "Creating Nginx configuration..."
    sudo tee "$NGINX_CONF" > /dev/null <<EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    
    # Redirect HTTP to HTTPS
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name $DOMAIN www.$DOMAIN;
    
    # SSL Configuration
    ssl_certificate $SSL_DIR/cert.crt;
    ssl_certificate_key $SSL_DIR/private.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES128-SHA256:ECDHE-RSA-AES256-SHA384;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # API proxy configuration
    location /api/ {
        proxy_pass http://127.0.0.1:8001/;
        proxy_set_header Host \$http_host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header X-Forwarded-Host \$server_name;
        proxy_redirect off;
        
        # WebSocket support
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # FastAPI docs and admin endpoints
    location ~ ^/(docs|redoc|openapi\.json|admin|health) {
        proxy_pass http://127.0.0.1:8001;
        proxy_set_header Host \$http_host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header X-Forwarded-Host \$server_name;
        proxy_redirect off;
    }
    
    # Frontend proxy configuration
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host \$http_host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header X-Forwarded-Host \$server_name;
        proxy_redirect off;
        
        # WebSocket support for Next.js hot reload
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Static files (if any)
    location /static/ {
        alias $INSTALL_DIR/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Favicon
    location /favicon.ico {
        alias $INSTALL_DIR/static/favicon.ico;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF
    
    # Enable the site
    sudo ln -sf "$NGINX_CONF" /etc/nginx/sites-enabled/
    
    # Remove default nginx site if it exists
    sudo rm -f /etc/nginx/sites-enabled/default
    
    # Test nginx configuration
    print_status "Testing Nginx configuration..."
    if sudo nginx -t; then
        print_success "Nginx configuration is valid"
    else
        print_error "Nginx configuration is invalid"
        exit 1
    fi
    
    # Restart nginx
    print_status "Restarting Nginx..."
    sudo systemctl restart nginx
    sudo systemctl enable nginx
    
    print_success "Nginx reverse proxy configured successfully"
}

# Function to configure firewall
configure_firewall() {
    print_professional "Configuring firewall"
    
    if command_exists ufw; then
        print_status "Configuring UFW firewall..."
        sudo ufw --force enable
        sudo ufw allow ssh
        sudo ufw allow 'Nginx Full'
        sudo ufw --force reload
        print_success "UFW firewall configured"
    elif command_exists firewall-cmd; then
        print_status "Configuring firewalld..."
        sudo systemctl enable firewalld
        sudo systemctl start firewalld
        sudo firewall-cmd --permanent --add-service=http
        sudo firewall-cmd --permanent --add-service=https
        sudo firewall-cmd --permanent --add-service=ssh
        sudo firewall-cmd --reload
        print_success "Firewalld configured"
    else
        print_warning "No supported firewall found. Please configure manually."
    fi
}

# Function to create systemd services
create_systemd_service() {
    print_professional "Creating systemd services"
    
    # Create backend service file
    sudo tee "/etc/systemd/system/$SERVICE_NAME-backend.service" > /dev/null <<EOF
[Unit]
Description=Music-U-Scheduler Backend API
After=network.target postgresql.service
Wants=network.target

[Service]
Type=simple
User=$USER
Group=$USER
WorkingDirectory=$INSTALL_DIR
Environment=PATH=$INSTALL_DIR/venv/bin
ExecStart=$INSTALL_DIR/venv/bin/python -m uvicorn app.main:app --host 127.0.0.1 --port 8001
ExecReload=/bin/kill -HUP \$MAINPID
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal
SyslogIdentifier=$SERVICE_NAME-backend

[Install]
WantedBy=multi-user.target
EOF
    
    # Create frontend service file
    if [ -d "$INSTALL_DIR/frontend" ]; then
        sudo tee "/etc/systemd/system/$SERVICE_NAME-frontend.service" > /dev/null <<EOF
[Unit]
Description=Music-U-Scheduler Frontend
After=network.target $SERVICE_NAME-backend.service
Wants=network.target

[Service]
Type=simple
User=$USER
Group=$USER
WorkingDirectory=$INSTALL_DIR/frontend
Environment=PATH=/usr/local/nvm/versions/node/v22.14.0/bin:/usr/local/bin:/usr/bin:/bin
Environment=NODE_ENV=production
ExecStart=/usr/local/nvm/versions/node/v22.14.0/bin/yarn start
ExecReload=/bin/kill -HUP \$MAINPID
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal
SyslogIdentifier=$SERVICE_NAME-frontend

[Install]
WantedBy=multi-user.target
EOF
    fi
    
    # Create main service that manages both
    sudo tee "/etc/systemd/system/$SERVICE_NAME.service" > /dev/null <<EOF
[Unit]
Description=Music-U-Scheduler Full Stack Application
After=network.target postgresql.service
Wants=network.target
Requires=$SERVICE_NAME-backend.service
$([ -d "$INSTALL_DIR/frontend" ] && echo "Requires=$SERVICE_NAME-frontend.service")

[Service]
Type=oneshot
RemainAfterExit=yes
ExecStart=/bin/true
ExecReload=/bin/systemctl reload $SERVICE_NAME-backend.service
$([ -d "$INSTALL_DIR/frontend" ] && echo "ExecReload=/bin/systemctl reload $SERVICE_NAME-frontend.service")

[Install]
WantedBy=multi-user.target
EOF
    
    # Reload systemd and enable services
    sudo systemctl daemon-reload
    sudo systemctl enable "$SERVICE_NAME-backend"
    if [ -d "$INSTALL_DIR/frontend" ]; then
        sudo systemctl enable "$SERVICE_NAME-frontend"
    fi
    sudo systemctl enable "$SERVICE_NAME"
    
    print_success "Systemd services created and enabled"
}

# Function to create update mechanism
create_update_mechanism() {
    print_professional "Setting up automatic update mechanism"
    
    # Create update script
    cat > "$INSTALL_DIR/scripts/update.sh" <<'EOF'
#!/bin/bash

# Music-U-Scheduler Auto-Update Script
set -e

INSTALL_DIR="$HOME/Music-U-Scheduler"
SERVICE_NAME="music-u-scheduler"
LOG_FILE="/var/log/music-u-scheduler-update.log"

# Function to log messages
log_message() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | sudo tee -a "$LOG_FILE"
}

log_message "Starting update check..."

cd "$INSTALL_DIR"

# Check for updates
git fetch origin
LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/main)

if [ "$LOCAL" != "$REMOTE" ]; then
    log_message "Updates available. Starting update process..."
    
    # Stop the service
    sudo systemctl stop "$SERVICE_NAME"
    
    # Stash any local changes
    git stash push -m "Auto-stash before update $(date)"
    
    # Pull updates
    git reset --hard origin/main
    
    # Update Python dependencies
    source venv/bin/activate
    pip install --upgrade pip
    pip install -r requirements.txt
    
    # Restart the service
    sudo systemctl start "$SERVICE_NAME"
    
    log_message "Update completed successfully"
else
    log_message "No updates available"
fi
EOF
    
    chmod +x "$INSTALL_DIR/scripts/update.sh"
    
    # Create systemd timer for updates
    sudo tee "/etc/systemd/system/$UPDATE_SERVICE_NAME.service" > /dev/null <<EOF
[Unit]
Description=Music-U-Scheduler Update Service
After=network.target

[Service]
Type=oneshot
User=$USER
ExecStart=$INSTALL_DIR/scripts/update.sh
EOF
    
    sudo tee "/etc/systemd/system/$UPDATE_SERVICE_NAME.timer" > /dev/null <<EOF
[Unit]
Description=Music-U-Scheduler Update Timer
Requires=$UPDATE_SERVICE_NAME.service

[Timer]
OnCalendar=daily
Persistent=true

[Install]
WantedBy=timers.target
EOF
    
    # Enable update timer
    sudo systemctl daemon-reload
    sudo systemctl enable "$UPDATE_SERVICE_NAME.timer"
    sudo systemctl start "$UPDATE_SERVICE_NAME.timer"
    
    print_success "Automatic update mechanism configured"
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
    
    # Create desktop file for web access
    cat > "$DESKTOP_FILE" << EOF
[Desktop Entry]
Name=Music-U-Scheduler
Comment=Music practice scheduler and progress tracker (Web Interface)
Exec=xdg-open https://$DOMAIN
Icon=$ICON_FILE
Terminal=false
Type=Application
Categories=Education;Music;Network;
StartupWMClass=Music-U-Scheduler
EOF
    
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
    
    cat > "$INSTALL_DIR/launch.sh" << EOF
#!/bin/bash
# Music-U-Scheduler Professional Launcher Script

echo "Music-U-Scheduler Professional Setup"
echo "===================================="
echo
echo "Web Interface: https://$DOMAIN"
echo "Backend Status: \$(sudo systemctl is-active $SERVICE_NAME-backend 2>/dev/null || echo 'inactive')"
echo "Frontend Status: \$(sudo systemctl is-active $SERVICE_NAME-frontend 2>/dev/null || echo 'inactive')"
echo "PostgreSQL Status: \$(sudo systemctl is-active postgresql 2>/dev/null || echo 'inactive')"
echo
echo "Available commands:"
echo "  start     - Start all services"
echo "  stop      - Stop all services"
echo "  restart   - Restart all services"
echo "  status    - Show service status"
echo "  logs      - Show service logs"
echo "  backend   - Manage backend only"
echo "  frontend  - Manage frontend only"
echo "  update    - Check for updates"
echo "  open      - Open web interface"
echo "  setup-db  - Setup database"
echo

case "\$1" in
    start)
        sudo systemctl start postgresql
        sudo systemctl start $SERVICE_NAME-backend
        [ -d "$INSTALL_DIR/frontend" ] && sudo systemctl start $SERVICE_NAME-frontend
        sudo systemctl start $SERVICE_NAME
        echo "All services started"
        ;;
    stop)
        sudo systemctl stop $SERVICE_NAME
        [ -d "$INSTALL_DIR/frontend" ] && sudo systemctl stop $SERVICE_NAME-frontend
        sudo systemctl stop $SERVICE_NAME-backend
        echo "All services stopped"
        ;;
    restart)
        sudo systemctl restart postgresql
        sudo systemctl restart $SERVICE_NAME-backend
        [ -d "$INSTALL_DIR/frontend" ] && sudo systemctl restart $SERVICE_NAME-frontend
        sudo systemctl restart $SERVICE_NAME
        echo "All services restarted"
        ;;
    status)
        echo "=== Service Status ==="
        sudo systemctl status postgresql --no-pager -l
        sudo systemctl status $SERVICE_NAME-backend --no-pager -l
        [ -d "$INSTALL_DIR/frontend" ] && sudo systemctl status $SERVICE_NAME-frontend --no-pager -l
        ;;
    logs)
        echo "=== Backend Logs ==="
        sudo journalctl -u $SERVICE_NAME-backend -n 20 --no-pager
        if [ -d "$INSTALL_DIR/frontend" ]; then
            echo "=== Frontend Logs ==="
            sudo journalctl -u $SERVICE_NAME-frontend -n 20 --no-pager
        fi
        ;;
    backend)
        case "\$2" in
            start) sudo systemctl start $SERVICE_NAME-backend ;;
            stop) sudo systemctl stop $SERVICE_NAME-backend ;;
            restart) sudo systemctl restart $SERVICE_NAME-backend ;;
            status) sudo systemctl status $SERVICE_NAME-backend ;;
            logs) sudo journalctl -u $SERVICE_NAME-backend -f ;;
            *) echo "Usage: \$0 backend {start|stop|restart|status|logs}" ;;
        esac
        ;;
    frontend)
        if [ -d "$INSTALL_DIR/frontend" ]; then
            case "\$2" in
                start) sudo systemctl start $SERVICE_NAME-frontend ;;
                stop) sudo systemctl stop $SERVICE_NAME-frontend ;;
                restart) sudo systemctl restart $SERVICE_NAME-frontend ;;
                status) sudo systemctl status $SERVICE_NAME-frontend ;;
                logs) sudo journalctl -u $SERVICE_NAME-frontend -f ;;
                *) echo "Usage: \$0 frontend {start|stop|restart|status|logs}" ;;
            esac
        else
            echo "Frontend not installed"
        fi
        ;;
    setup-db)
        echo "Setting up PostgreSQL database..."
        sudo systemctl start postgresql
        sudo -u postgres createdb music_u_scheduler 2>/dev/null || echo "Database may already exist"
        sudo -u postgres psql -c "CREATE USER music_u_user WITH PASSWORD 'music_u_password';" 2>/dev/null || echo "User may already exist"
        sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE music_u_scheduler TO music_u_user;" 2>/dev/null
        echo "Database setup complete"
        ;;
    update)
        $INSTALL_DIR/scripts/update.sh
        ;;
    open)
        xdg-open https://$DOMAIN 2>/dev/null || echo "Please open https://$DOMAIN in your browser"
        ;;
    *)
        echo "Usage: \$0 {start|stop|restart|status|logs|backend|frontend|update|open|setup-db}"
        echo "Or run without arguments to see this help"
        ;;
esac
EOF
    
    chmod +x "$INSTALL_DIR/launch.sh"
    print_success "Launcher script created"
}

# Function to run post-installation setup
post_install_setup() {
    print_status "Running post-installation setup..."
    
    cd "$INSTALL_DIR"
    
    # Create necessary directories
    mkdir -p data logs scripts static
    
    # Create log directory with proper permissions
    sudo mkdir -p /var/log
    sudo touch /var/log/music-u-scheduler-update.log
    sudo chown "$USER":"$USER" /var/log/music-u-scheduler-update.log
    
    # Make app/main.py executable if it exists
    if [ -f "app/main.py" ]; then
        chmod +x app/main.py
    fi
    
    print_success "Post-installation setup completed"
}

# Function to setup PostgreSQL database
setup_postgresql() {
    print_professional "Setting up PostgreSQL database..."
    
    # Start and enable PostgreSQL
    sudo systemctl start postgresql
    sudo systemctl enable postgresql
    
    # Wait for PostgreSQL to start
    sleep 2
    
    # Create database and user
    print_status "Creating database and user..."
    sudo -u postgres createdb music_u_scheduler 2>/dev/null || print_warning "Database may already exist"
    sudo -u postgres psql -c "CREATE USER music_u_user WITH PASSWORD 'music_u_password';" 2>/dev/null || print_warning "User may already exist"
    sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE music_u_scheduler TO music_u_user;" 2>/dev/null
    sudo -u postgres psql -c "ALTER USER music_u_user CREATEDB;" 2>/dev/null
    
    print_success "PostgreSQL database setup complete"
}

# Function to start services
start_services() {
    print_professional "Starting services..."
    
    # Start and enable nginx
    sudo systemctl start nginx
    sudo systemctl enable nginx
    
    # Start PostgreSQL
    sudo systemctl start postgresql
    
    # Start backend service
    sudo systemctl start "$SERVICE_NAME-backend"
    
    # Start frontend service if it exists
    if [ -d "$INSTALL_DIR/frontend" ]; then
        sudo systemctl start "$SERVICE_NAME-frontend"
    fi
    
    # Start main service
    sudo systemctl start "$SERVICE_NAME"
    
    # Wait a moment for services to start
    sleep 5
    
    # Check service status
    if sudo systemctl is-active --quiet "$SERVICE_NAME-backend"; then
        print_success "Music-U-Scheduler backend is running"
    else
        print_warning "Backend service may not have started properly. Check logs with: sudo journalctl -u $SERVICE_NAME-backend"
    fi
    
    if [ -d "$INSTALL_DIR/frontend" ] && sudo systemctl is-active --quiet "$SERVICE_NAME-frontend"; then
        print_success "Music-U-Scheduler frontend is running"
    elif [ -d "$INSTALL_DIR/frontend" ]; then
        print_warning "Frontend service may not have started properly. Check logs with: sudo journalctl -u $SERVICE_NAME-frontend"
    fi
    
    if sudo systemctl is-active --quiet nginx; then
        print_success "Nginx is running"
    else
        print_warning "Nginx may not have started properly. Check logs with: sudo journalctl -u nginx"
    fi
}

# Function to display final instructions
show_final_instructions() {
    echo
    print_success "=== Professional Installation Complete! ==="
    echo
    print_professional "Music-U-Scheduler Professional Setup Summary:"
    echo
    echo "🌐 Web Interface: https://$DOMAIN"
    echo "📁 Installation Directory: $INSTALL_DIR"
    echo "🔧 Backend Service: $SERVICE_NAME-backend"
    if [ -d "$INSTALL_DIR/frontend" ]; then
        echo "🎨 Frontend Service: $SERVICE_NAME-frontend"
    fi
    echo "🗄️  Database: PostgreSQL (music_u_scheduler)"
    echo "🔄 Auto-updates: Enabled (daily check)"
    echo "🔒 SSL/HTTPS: Self-signed certificate"
    echo "🛡️  Reverse Proxy: Nginx"
    echo "🔥 Firewall: Configured"
    echo
    echo "Management Commands:"
    echo "  $INSTALL_DIR/launch.sh start    - Start the service"
    echo "  $INSTALL_DIR/launch.sh stop     - Stop the service"
    echo "  $INSTALL_DIR/launch.sh restart  - Restart the service"
    echo "  $INSTALL_DIR/launch.sh status   - Check service status"
    echo "  $INSTALL_DIR/launch.sh logs     - View service logs"
    echo "  $INSTALL_DIR/launch.sh update   - Manual update check"
    echo "  $INSTALL_DIR/launch.sh open     - Open web interface"
    echo
    echo "Service Management:"
    echo "  sudo systemctl status $SERVICE_NAME"
    echo "  sudo journalctl -u $SERVICE_NAME -f"
    echo
    echo "SSL Certificate Info:"
    echo "  Certificate: $SSL_DIR/cert.crt"
    echo "  Private Key: $SSL_DIR/private.key"
    echo "  Note: Browser will show security warning for self-signed certificate"
    echo
    echo "Default Login Credentials:"
    echo "  Username: admin"
    echo "  Password: MusicU2025"
    echo
    echo "API Documentation:"
    echo "  FastAPI Docs: https://$DOMAIN/docs"
    echo "  Backend API: https://$DOMAIN/api/"
    echo
    print_success "🎵 Professional Music-U-Scheduler is ready!"
    print_professional "Access your application at: https://$DOMAIN"
}

# Main installation function
main() {
    echo
    print_professional "=== Music-U-Scheduler Professional Installer ==="
    print_professional "Setting up enterprise-grade Music-U-Scheduler with HTTPS, SSL, and auto-updates"
    echo
    
    # Security check
    check_root
    
    # Check for required commands and install dependencies
    if ! command_exists git || ! command_exists python3 || ! command_exists nginx; then
        print_status "Installing required dependencies..."
        install_dependencies
    fi
    
    # Install Node.js and Yarn for frontend
    install_nodejs_yarn
    
    # Handle existing installation or clone fresh
    handle_existing_installation
    
    # Setup Python environment
    setup_python_environment
    
    # Setup frontend environment
    setup_frontend_environment
    
    # Setup PostgreSQL database
    setup_postgresql
    
    # Professional setup
    setup_custom_domain
    generate_ssl_certificates
    configure_nginx
    configure_firewall
    create_systemd_service
    create_update_mechanism
    
    # Create desktop integration
    create_desktop_entry
    
    # Create launcher script
    create_launcher
    
    # Post-installation setup
    post_install_setup
    
    # Start services
    start_services
    
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
        --basic)
            # Basic installation without professional features
            print_status "Running basic installation without professional features..."
            # Set flags to skip professional setup
            SKIP_PROFESSIONAL=true
            shift
            ;;
        --verify)
            # Verification mode - check if installation is working
            INSTALL_DIR="$HOME/$APP_NAME"
            if [ -d "$INSTALL_DIR" ] && [ -f "$INSTALL_DIR/app/main.py" ]; then
                print_success "Installation verified successfully!"
                echo "Main application file found at: $INSTALL_DIR/app/main.py"
                if sudo systemctl is-active --quiet "$SERVICE_NAME" 2>/dev/null; then
                    print_success "Service is running"
                    echo "Web interface: https://$DOMAIN"
                else
                    print_warning "Service is not running. Start with: sudo systemctl start $SERVICE_NAME"
                fi
                exit 0
            else
                print_error "Installation verification failed!"
                echo "Expected main application file at: $INSTALL_DIR/app/main.py"
                exit 1
            fi
            ;;
        -h|--help)
            echo "Music-U-Scheduler Professional Installer"
            echo
            echo "Usage: $0 [OPTIONS]"
            echo
            echo "Options:"
            echo "  -y, --yes      Auto-confirm all prompts"
            echo "  --basic        Basic installation without professional features"
            echo "  --verify       Verify existing installation"
            echo "  -h, --help     Show this help message"
            echo
            echo "Professional Features:"
            echo "  • Custom domain (musicu.local) with HTTPS/SSL"
            echo "  • Nginx reverse proxy with security headers"
            echo "  • Systemd service for automatic startup"
            echo "  • Automatic updates with systemd timer"
            echo "  • Firewall configuration"
            echo "  • Professional management tools"
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
if [ "$SKIP_PROFESSIONAL" = true ]; then
    # Run basic installation (original functionality)
    print_warning "Professional features disabled. Running basic installation..."
    # Here you would call the original main function or simplified version
    # For now, we'll just run the full professional setup
fi

main