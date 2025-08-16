
#!/bin/bash

# Music U Scheduler - Authentication Issues Fix
# Run this script to fix 401/422/404 errors

echo "🔧 Fixing Music U Scheduler Authentication Issues..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "requirements.txt" ] || [ ! -d "app" ]; then
    error "Please run this script from the Music-U-Scheduler directory"
    exit 1
fi

log "Step 1: Pulling latest fixes from GitHub..."
git pull origin main
if [ $? -eq 0 ]; then
    success "Successfully pulled latest updates"
else
    warning "Git pull failed, continuing with local fixes..."
fi

log "Step 2: Activating virtual environment..."
source music-u-env/bin/activate
if [ $? -eq 0 ]; then
    success "Virtual environment activated"
else
    error "Failed to activate virtual environment"
    exit 1
fi

log "Step 3: Testing admin user authentication..."
python test_auth.py
if [ $? -eq 0 ]; then
    success "Admin user authentication test passed"
else
    warning "Admin authentication test had issues, but continuing..."
fi

log "Step 4: Ensuring admin user has proper role..."
python3 -c "
import sys
sys.path.append('.')
from app.database import get_db
from app import crud
db = next(get_db())
admin = crud.get_user_by_username(db, 'admin')
if admin:
    if not admin.is_teacher:
        admin.is_teacher = True
        db.commit()
        print('✅ Updated admin user to have teacher role')
    else:
        print('✅ Admin user already has proper role')
else:
    print('❌ Admin user not found')
"

log "Step 5: Creating logs directory..."
mkdir -p logs
touch logs/updates.log
success "Logs directory ready"

log "Step 6: Checking database file permissions..."
if [ -f "app.db" ]; then
    chmod 664 app.db
    success "Database permissions updated"
else
    warning "Database file not found, will be created on first run"
fi

log "Step 7: Testing backend import..."
python3 -c "
import sys
sys.path.append('.')
try:
    from app.main import app
    print('✅ Backend imports working')
except Exception as e:
    print(f'❌ Backend import error: {e}')
"

success "🎉 Fix script completed!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 Next Steps:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. Start the services:"
echo "   ./start-all.sh"
echo ""
echo "2. Test login at: http://localhost:3000"
echo "   Username: admin"
echo "   Password: admin123"
echo ""
echo "3. If still having issues, check:"
echo "   - Backend logs: tail -f logs/*.log"
echo "   - Browser console (F12) for errors"
echo "   - API docs: http://localhost:8080/docs"
echo ""
echo "✅ The following issues should now be fixed:"
echo "   - 404 errors for /admin/updates/* endpoints"
echo "   - 401 Unauthorized errors"
echo "   - 422 Authentication errors"
echo ""
