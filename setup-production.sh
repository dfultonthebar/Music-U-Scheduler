#!/bin/bash
# Music U Scheduler - Production Setup Script
# This script sets up systemd services for auto-start on boot

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}=== Music U Scheduler Production Setup ===${NC}"

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}Please run as root (sudo ./setup-production.sh)${NC}"
    exit 1
fi

INSTALL_DIR="/root/Music-U-Scheduler"

# Create log directory
echo "Creating log directory..."
mkdir -p /var/log/music-u
chmod 755 /var/log/music-u

# Build frontend for production
echo "Building frontend for production..."
cd "$INSTALL_DIR/app"
npm run build || {
    echo -e "${YELLOW}Build failed, trying with dev mode...${NC}"
}

# Copy systemd service files
echo "Installing systemd services..."
cat > /etc/systemd/system/music-u-backend.service << EOF
[Unit]
Description=Music U Scheduler Backend API
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=$INSTALL_DIR
Environment="PATH=$INSTALL_DIR/music-u-env/bin:/usr/local/bin:/usr/bin:/bin"
ExecStart=$INSTALL_DIR/music-u-env/bin/uvicorn app.main:app --host 0.0.0.0 --port 8080
Restart=always
RestartSec=5
StandardOutput=append:/var/log/music-u/backend.log
StandardError=append:/var/log/music-u/backend-error.log

[Install]
WantedBy=multi-user.target
EOF

cat > /etc/systemd/system/music-u-frontend.service << EOF
[Unit]
Description=Music U Scheduler Frontend
After=network.target music-u-backend.service
Wants=music-u-backend.service

[Service]
Type=simple
User=root
WorkingDirectory=$INSTALL_DIR/app
Environment="NODE_ENV=production"
Environment="PATH=/usr/local/bin:/usr/bin:/bin"
ExecStart=/usr/bin/npm run start
Restart=always
RestartSec=5
StandardOutput=append:/var/log/music-u/frontend.log
StandardError=append:/var/log/music-u/frontend-error.log

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd
echo "Reloading systemd..."
systemctl daemon-reload

# Enable services for auto-start
echo "Enabling services for auto-start on boot..."
systemctl enable music-u-backend.service
systemctl enable music-u-frontend.service

echo ""
echo -e "${GREEN}=== Production Setup Complete ===${NC}"
echo ""
echo "Commands:"
echo "  Start services:    systemctl start music-u-backend music-u-frontend"
echo "  Stop services:     systemctl stop music-u-backend music-u-frontend"
echo "  Restart services:  systemctl restart music-u-backend music-u-frontend"
echo "  Check status:      systemctl status music-u-backend music-u-frontend"
echo "  View backend log:  tail -f /var/log/music-u/backend.log"
echo "  View frontend log: tail -f /var/log/music-u/frontend.log"
echo ""
echo "Services will auto-start on system boot."
echo ""

read -p "Start services now? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    systemctl start music-u-backend
    sleep 3
    systemctl start music-u-frontend
    echo -e "${GREEN}Services started!${NC}"
    echo "Backend: http://localhost:8080"
    echo "Frontend: http://localhost:3000"
fi
