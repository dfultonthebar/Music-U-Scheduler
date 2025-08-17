
#!/bin/bash

# Music U Scheduler - Quick Download Script
# This script can be run directly from the web
# Usage: curl -L https://raw.githubusercontent.com/dfultonthebar/Music-U-Scheduler/main/quick-download.sh | bash

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🎵 Music U Scheduler - Quick Download${NC}"
echo -e "${BLUE}=====================================${NC}"
echo ""

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo -e "${RED}❌ Git is not installed${NC}"
    echo "Please install git first:"
    echo "  Ubuntu/Debian: sudo apt update && sudo apt install git"
    echo "  macOS: xcode-select --install"
    exit 1
fi

# Download the full installer
echo -e "${GREEN}📥 Downloading Music U Scheduler...${NC}"

# Check if directory already exists
if [ -d "Music-U-Scheduler" ]; then
    echo -e "${GREEN}📁 Directory already exists, entering existing installation...${NC}"
    cd Music-U-Scheduler
    # Download the latest updater script
    curl -L https://raw.githubusercontent.com/dfultonthebar/Music-U-Scheduler/main/download-update.sh -o download-update.sh
else
    git clone https://github.com/dfultonthebar/Music-U-Scheduler.git
    cd Music-U-Scheduler
fi

echo -e "${GREEN}🚀 Running installer...${NC}"
chmod +x download-update.sh
./download-update.sh

echo ""
echo -e "${GREEN}✅ Quick download completed!${NC}"
echo "You can now access the application at http://localhost:3000"
