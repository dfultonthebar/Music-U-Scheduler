
# 🔧 Troubleshooting Guide

This guide covers common issues you might encounter when installing or running the Music U Scheduler application.

## 🚀 Installation Issues

### 1. Permission Errors During Installation

**Problem**: Permission denied errors when running the installation script.

**Solutions**:
```bash
# Make sure the script is executable
chmod +x install-fixed.sh

# Don't run as root - use your regular user account
./install-fixed.sh

# If you get yarn permission errors, the script will automatically fallback to npm
```

### 2. Python Environment Issues

**Problem**: Virtual environment creation fails or Python imports fail.

**Solutions**:
```bash
# Check Python version (needs 3.8+)
python3 --version

# If python3 is not available, install it
sudo apt update
sudo apt install python3 python3-venv python3-pip

# Remove and recreate virtual environment
rm -rf music-u-env
python3 -m venv music-u-env
source music-u-env/bin/activate
pip install -r requirements.txt
```

### 3. Node.js/Yarn Issues

**Problem**: Frontend dependencies won't install.

**Solutions**:
```bash
# Check Node.js version (needs 18+)
node --version

# If Node.js is too old, update it
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clear npm/yarn cache
cd app
rm -rf node_modules package-lock.json yarn.lock
npm install

# Or if using yarn
yarn cache clean
yarn install
```

## 🖥️ Service Management Issues

### 1. Port Already in Use

**Problem**: Backend or frontend won't start due to port conflicts.

**Solutions**:
```bash
# Check what's using the ports
sudo lsof -i :3000  # Frontend port
sudo lsof -i :8080  # Backend port

# Kill processes using the ports
sudo kill $(sudo lsof -t -i:3000)
sudo kill $(sudo lsof -t -i:8080)

# Or use the service management script
./manage-services.sh stop
./manage-services.sh start
```

### 2. Services Won't Start

**Problem**: Backend or frontend services fail to start.

**Solutions**:

**For Backend Issues**:
```bash
# Check if virtual environment is activated
source music-u-env/bin/activate

# Test backend manually
cd app
python3 -c "import main; print('Backend imports OK')"

# Check database file permissions
ls -la app.db

# Recreate database if needed
rm app.db
cd app
python3 -c "from database import engine; from models import Base; Base.metadata.create_all(bind=engine)"
```

**For Frontend Issues**:
```bash
cd app

# Clear Next.js cache
rm -rf .next

# Rebuild
npm run build

# Check for TypeScript errors
npx tsc --noEmit
```

### 3. Database Issues

**Problem**: Database connection errors or corruption.

**Solutions**:
```bash
# Check database file
file app.db

# Backup and recreate database
cp app.db app.db.backup
rm app.db

# Reinitialize database
cd app
python3 -c "
from database import engine
from models import Base
Base.metadata.create_all(bind=engine)
print('Database recreated successfully')
"
```

## 🌐 Connection Issues

### 1. Frontend Can't Connect to Backend

**Problem**: API calls from frontend fail.

**Solutions**:
```bash
# Check backend is running
curl http://localhost:8080/health

# Check frontend environment variables
cat app/.env

# Should contain:
# NEXT_PUBLIC_API_URL=http://localhost:8080

# If different, update it:
echo 'NEXT_PUBLIC_API_URL=http://localhost:8080' >> app/.env

# Restart frontend
./manage-services.sh restart
```

### 2. CORS Issues

**Problem**: Cross-origin request blocked errors.

**Solutions**:
- The backend is configured to allow all origins in development
- If you're accessing from a different domain, update CORS settings in `app/main.py`

### 3. Authentication Issues

**Problem**: Login/signup not working.

**Solutions**:
```bash
# Check NextAuth configuration
cat app/.env | grep NEXTAUTH

# Should have valid URLs and secret:
# NEXTAUTH_URL=http://localhost:3000
# NEXTAUTH_SECRET=<some-long-secret>

# If missing, regenerate:
echo "NEXTAUTH_SECRET=$(openssl rand -hex 32)" >> app/.env
echo "NEXTAUTH_URL=http://localhost:3000" >> app/.env
```

## 📊 Performance Issues

### 1. Slow Application Response

**Problem**: Application is slow to respond.

**Solutions**:
```bash
# Check system resources
top
df -h

# Check for memory issues
free -m

# Restart services to clear memory
./manage-services.sh restart

# Check logs for errors
tail -f logs/*.log
```

### 2. High CPU Usage

**Problem**: Services using too much CPU.

**Solutions**:
```bash
# Check which process is using CPU
top -p $(pgrep -d',' -f 'uvicorn\|next')

# For Next.js development build issues:
cd app
rm -rf .next
npm run build

# For backend issues, check for infinite loops in logs
tail -f ../logs/backend.log
```

## 🔍 Debugging Tips

### 1. Check Logs

```bash
# View all logs
find logs/ -name "*.log" -exec tail -20 {} \; -print

# Monitor logs in real-time
tail -f logs/*.log

# Check system logs
journalctl -f
```

### 2. Test Components Separately

**Backend Only**:
```bash
./start-backend.sh
curl http://localhost:8080/docs
```

**Frontend Only**:
```bash
./start-frontend.sh
curl http://localhost:3000
```

### 3. Validate Configuration

```bash
# Check all environment files
echo "=== Backend Config ==="
cat .env
echo "=== Frontend Config ==="
cat app/.env
echo "=== System Info ==="
python3 --version
node --version
```

## 🆘 Getting Help

### 1. Collect System Information

When asking for help, please provide:

```bash
# System information
echo "OS: $(lsb_release -d | cut -f2)"
echo "Python: $(python3 --version)"
echo "Node.js: $(node --version)"
echo "Architecture: $(uname -m)"

# Service status
./manage-services.sh status

# Recent logs
tail -50 logs/*.log
```

### 2. Common Error Messages

| Error Message | Likely Cause | Solution |
|---------------|--------------|----------|
| "Port already in use" | Another service using port | Kill existing process |
| "Module not found" | Missing Python dependencies | Reinstall requirements.txt |
| "CORS policy" | Frontend/backend URL mismatch | Check environment variables |
| "Database locked" | SQLite database corruption | Recreate database |
| "Command not found" | Missing system dependencies | Install Node.js/Python |

### 3. Reset to Clean State

If all else fails, perform a complete reset:

```bash
# Stop all services
./manage-services.sh stop

# Clean everything
rm -rf music-u-env app/.next app/node_modules logs/*

# Reinstall
./install-fixed.sh
```

---

**Need more help?** Check the main [README.md](README.md) or create an issue on GitHub.
