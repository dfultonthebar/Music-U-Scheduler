
#!/bin/bash

# Clear NextAuth Session Tokens Script
# This resolves JWT decryption errors from old sessions

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}🧹 Clearing NextAuth Session Tokens...${NC}"
echo ""

# Stop frontend if running
echo -e "${YELLOW}[1/4]${NC} Stopping frontend service..."
pkill -f "next dev" 2>/dev/null || true
sleep 2

# Clear Next.js cache
echo -e "${YELLOW}[2/4]${NC} Clearing Next.js cache..."
rm -rf app/.next 2>/dev/null || true

# Generate new NEXTAUTH_SECRET 
echo -e "${YELLOW}[3/4]${NC} Generating new NEXTAUTH_SECRET..."
NEW_SECRET=$(openssl rand -base64 32)

# Update .env file
if [ -f "app/.env" ]; then
    # Update existing .env
    if grep -q "NEXTAUTH_SECRET=" app/.env; then
        sed -i "s|NEXTAUTH_SECRET=.*|NEXTAUTH_SECRET=$NEW_SECRET|" app/.env
    else
        echo "NEXTAUTH_SECRET=$NEW_SECRET" >> app/.env
    fi
    echo -e "   ✅ Updated NEXTAUTH_SECRET in app/.env"
else
    # Create new .env
    echo "NEXTAUTH_SECRET=$NEW_SECRET" > app/.env
    echo -e "   ✅ Created app/.env with NEXTAUTH_SECRET"
fi

echo -e "${YELLOW}[4/4]${NC} Session clearing complete!"
echo ""
echo -e "${GREEN}✅ JWT Session tokens cleared successfully!${NC}"
echo ""
echo "🚀 Now restart your application:"
echo "   ./start-all.sh"
echo ""
echo "💡 All old session tokens are now invalid."
echo "   Users will need to log in again."
